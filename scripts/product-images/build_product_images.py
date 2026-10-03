#!/usr/bin/env python3
"""OUMMAH — batch of clean product photos for the Scan result sheet.

For each barcode (most scanned products + popular products of boycotted brands):
  1. take the product's own front photo from Open Food Facts (CC BY-SA 3.0),
  2. remove the background with rembg (open source, runs locally),
  3. crop on the product, pad to a square, save a 512 px transparent WebP,
  4. upload it to Supabase Storage (bucket "product-images") and record it in public.product_images.

Nothing is bundled in the app: it only downloads the image it needs, on demand.

Usage (from the project root):
  python scripts/product-images/build_product_images.py --dry-run --limit 5
  python scripts/product-images/build_product_images.py
  python scripts/product-images/build_product_images.py --reject 5000112680171   # hide a bad result

Env (.env / .env.local, or process env):
  EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (keep it in .env.local, never in .env)
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / 'scripts' / 'output' / 'product-images'
BUCKET = 'product-images'
USER_AGENT = 'OUMMAH-ProductImages/1.0 (batch, low rate)'
OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=code,product_name,brands,categories_tags,selected_images,image_front_url'
OFF_SEARCH_URL = 'https://world.openfoodfacts.org/api/v2/search'
CANVAS = 512
MARGIN = 0.06
WEBP_QUALITY = 80
# Open Food Facts rate limits: 100 product reads/min, 10 searches/min.
PRODUCT_DELAY_S = 0.8
SEARCH_DELAY_S = 6.5


def env_value(name: str) -> str | None:
    import os
    if os.environ.get(name):
        return os.environ[name].strip()
    for file_name in ('.env.local', '.env'):
        path = ROOT / file_name
        if not path.exists():
            continue
        for line in path.read_text(encoding='utf-8').splitlines():
            if line.startswith(f'{name}='):
                value = line[len(name) + 1:].strip().strip('"').strip("'")
                if value:
                    return value
    return None


def http(url: str, *, method: str = 'GET', headers: dict[str, str] | None = None, body: bytes | None = None, timeout: int = 30) -> bytes:
    request = urllib.request.Request(url, data=body, method=method, headers={'User-Agent': USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def http_json(url: str, **kwargs) -> object:
    return json.loads(http(url, **kwargs).decode('utf-8'))


def now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize('NFD', value).encode('ascii', 'ignore').decode('ascii').lower()
    return re.sub(r'[^a-z0-9]+', '-', ascii_value).strip('-')


class Supabase:
    def __init__(self, url: str, service_key: str):
        self.url = url.rstrip('/')
        # New Supabase secret keys (sb_secret_...) go in the apikey header only; legacy service_role JWTs also as Bearer.
        self.headers = {'apikey': service_key}
        if service_key.startswith('eyJ'):
            self.headers['Authorization'] = f'Bearer {service_key}'

    def select(self, table: str, query: str) -> list[dict]:
        rows: list[dict] = []
        offset = 0
        while True:
            page = http_json(f'{self.url}/rest/v1/{table}?{query}', headers={**self.headers, 'Range-Unit': 'items', 'Range': f'{offset}-{offset + 999}'})
            rows.extend(page)  # type: ignore[arg-type]
            if len(page) < 1000:  # type: ignore[arg-type]
                return rows
            offset += 1000

    def upsert(self, table: str, row: dict) -> None:
        http(f'{self.url}/rest/v1/{table}?on_conflict=barcode', method='POST', body=json.dumps(row).encode('utf-8'),
             headers={**self.headers, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal'})

    def upload(self, path: str, data: bytes) -> None:
        http(f'{self.url}/storage/v1/object/{BUCKET}/{path}', method='POST', body=data,
             headers={**self.headers, 'Content-Type': 'image/webp', 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000'})

    def delete_object(self, path: str) -> None:
        try:
            http(f'{self.url}/storage/v1/object/{BUCKET}/{path}', method='DELETE', headers=self.headers)
        except urllib.error.HTTPError:
            pass


def collect_barcodes(db: Supabase, per_brand: int, skip_brand_search: bool) -> list[str]:
    ordered: dict[str, None] = {}
    for row in db.select('boycott_scanned_products', 'select=barcode&order=scan_count.desc'):
        ordered.setdefault(row['barcode'], None)
    entities = db.select('boycott_entities', 'select=name,aliases,product_barcodes&is_active=eq.true')
    for entity in entities:
        for barcode in entity.get('product_barcodes') or []:
            ordered.setdefault(str(barcode), None)
    if not skip_brand_search:
        for entity in entities:
            brand_tag = slugify(entity['name'])
            if not brand_tag:
                continue
            query = urllib.parse.urlencode({'brands_tags': brand_tag, 'countries_tags_en': 'france', 'sort_by': 'unique_scans_n', 'page_size': per_brand, 'fields': 'code'})
            try:
                payload = http_json(f'{OFF_SEARCH_URL}?{query}')
                for product in payload.get('products', []):  # type: ignore[union-attr]
                    code = str(product.get('code') or '')
                    if re.fullmatch(r'[0-9]{8,14}', code):
                        ordered.setdefault(code, None)
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
                print(f'  ! brand search failed for {entity["name"]}: {error}')
            time.sleep(SEARCH_DELAY_S)
    return [code for code in ordered if re.fullmatch(r'[0-9]{8,14}', code)]


def front_image_urls(product: dict) -> list[str]:
    """Same priority as the app (selected front fr > en > image_front_url), full resolution first."""
    display = ((product.get('selected_images') or {}).get('front') or {}).get('display') or {}
    candidates = [display.get('fr'), display.get('en'), product.get('image_front_url')]
    urls: list[str] = []
    for url in candidates:
        if isinstance(url, str) and url.startswith('http'):
            full = re.sub(r'\.(\d+)\.jpg$', '.full.jpg', url)
            urls.extend(dict.fromkeys([full, url]))
            break
    return urls


def upright_beverage(product, alpha):
    """A drink lying on its side: rotate it so the narrower end (neck / cap) is on top. None when ambiguous."""
    from PIL import Image
    width = product.width
    edge = max(1, int(width * 0.15))

    def thickness(x0: int, x1: int) -> float:
        columns = [sum(1 for value in alpha.crop((x, 0, x + 1, alpha.height)).getdata() if value > 128) for x in range(x0, x1)]
        return sum(columns) / max(1, len(columns))

    left, right = thickness(0, edge), thickness(width - edge, width)
    if max(left, right) < min(left, right) * 1.25:
        return None
    # Narrow end on the left -> rotate clockwise; on the right -> counter-clockwise.
    return product.transpose(Image.Transpose.ROTATE_270 if left < right else Image.Transpose.ROTATE_90)


def clean_image(raw: bytes, session, is_beverage: bool = False) -> tuple[bytes | None, str | None]:
    from PIL import Image
    from rembg import remove

    source = Image.open(io.BytesIO(raw))
    source = source.convert('RGB')
    if min(source.size) < 200:
        return None, 'source_too_small'
    cutout = remove(source, session=session, post_process_mask=True)
    alpha = cutout.getchannel('A')
    bbox = alpha.point(lambda value: 255 if value > 24 else 0).getbbox()
    if not bbox:
        return None, 'no_subject'
    box_w, box_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    coverage = (box_w * box_h) / (source.width * source.height)
    if coverage < 0.08:
        return None, 'subject_too_small'
    histogram = alpha.crop(bbox).histogram()
    opaque_ratio = sum(histogram[128:]) / max(1, box_w * box_h)
    if opaque_ratio < 0.35:
        return None, 'cutout_too_sparse'
    product = cutout.crop(bbox)
    if is_beverage and box_w > box_h * 1.3:
        product = upright_beverage(product, product.getchannel('A'))
        if product is None:
            return None, 'lying_ambiguous'
    inner = int(CANVAS * (1 - 2 * MARGIN))
    product.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(product, ((CANVAS - product.width) // 2, (CANVAS - product.height) // 2), product)
    output = io.BytesIO()
    canvas.save(output, 'WEBP', quality=WEBP_QUALITY, method=6)
    return output.getvalue(), None


def main() -> int:
    parser = argparse.ArgumentParser(description='Build clean product photos for OUMMAH Scan.')
    parser.add_argument('--limit', type=int, default=0, help='max products to process this run (0 = all)')
    parser.add_argument('--per-brand', type=int, default=30, help='popular products fetched per boycotted brand')
    parser.add_argument('--skip-brand-search', action='store_true', help='only scanned products and catalog barcodes')
    parser.add_argument('--barcode', action='append', default=[], help='process only these barcodes (repeatable)')
    parser.add_argument('--retry-rejected', action='store_true', help='retry barcodes previously rejected')
    parser.add_argument('--force', action='store_true', help='reprocess barcodes that already have an image')
    parser.add_argument('--dry-run', action='store_true', help='write WebP files to scripts/output/product-images, upload nothing')
    parser.add_argument('--reject', action='append', default=[], help='hide a bad image for this barcode and never retry it')
    parser.add_argument('--model', default='birefnet-general-lite', help='rembg model')
    args = parser.parse_args()

    url = env_value('EXPO_PUBLIC_SUPABASE_URL')
    service_key = env_value('SUPABASE_SERVICE_ROLE_KEY')
    offline = args.dry_run and bool(args.barcode)
    if not offline and (not url or not service_key):
        print('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (put the service key in .env.local).')
        return 1
    db = Supabase(url or '', service_key or '')

    if args.reject:
        for barcode in args.reject:
            db.delete_object(f'{barcode}.webp')
            db.upsert('product_images', {'barcode': barcode, 'status': 'rejected', 'storage_path': None, 'reject_reason': 'manual', 'processed_at': now_iso()})
            print(f'rejected {barcode}')
        return 0

    known = {} if offline else {row['barcode']: row['status'] for row in db.select('product_images', 'select=barcode,status')}
    barcodes = args.barcode or collect_barcodes(db, args.per_brand, args.skip_brand_search)
    todo = [code for code in barcodes if args.force or args.barcode or code not in known or (args.retry_rejected and known[code] == 'rejected')]
    if args.limit:
        todo = todo[:args.limit]
    print(f'{len(barcodes)} candidates, {len(todo)} to process')
    if not todo:
        return 0

    from rembg import new_session
    session = new_session(args.model)
    if args.dry_run:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    stats = {'ready': 0, 'rejected': 0, 'skipped': 0}
    for index, barcode in enumerate(todo, start=1):
        prefix = f'[{index}/{len(todo)}] {barcode}'
        try:
            payload = http_json(OFF_PRODUCT_URL.format(barcode=barcode))
            time.sleep(PRODUCT_DELAY_S)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            print(f'{prefix} skipped (OFF unavailable: {error})')
            stats['skipped'] += 1
            continue
        product = payload.get('product') if payload.get('status') != 0 else None  # type: ignore[union-attr]
        urls = front_image_urls(product) if product else []
        result: tuple[bytes | None, str | None] = (None, 'no_front_photo')
        source_url = None
        for image_url in urls:
            try:
                raw = http(image_url, timeout=60)
            except (urllib.error.URLError, TimeoutError):
                continue
            source_url = image_url
            is_beverage = 'en:beverages' in (product.get('categories_tags') or [])
            result = clean_image(raw, session, is_beverage)
            break
        webp, reason = result
        if args.dry_run:
            if webp:
                (OUTPUT_DIR / f'{barcode}.webp').write_bytes(webp)
            print(f'{prefix} {"ready" if webp else "rejected"} {reason or ""} {len(webp) // 1024 if webp else 0} KB')
            stats['ready' if webp else 'rejected'] += 1
            continue
        try:
            if webp:
                db.upload(f'{barcode}.webp', webp)
                db.upsert('product_images', {'barcode': barcode, 'status': 'ready', 'storage_path': f'{barcode}.webp', 'width': CANVAS, 'height': CANVAS,
                                             'source_url': source_url, 'reject_reason': None, 'processed_at': now_iso()})
                print(f'{prefix} ready ({len(webp) // 1024} KB)')
                stats['ready'] += 1
            else:
                db.upsert('product_images', {'barcode': barcode, 'status': 'rejected', 'storage_path': None, 'source_url': source_url, 'reject_reason': reason, 'processed_at': now_iso()})
                print(f'{prefix} rejected ({reason})')
                stats['rejected'] += 1
        except urllib.error.HTTPError as error:
            print(f'{prefix} upload failed: {error.code} {error.read().decode("utf-8", "ignore")[:200]}')
            stats['skipped'] += 1
    print(json.dumps(stats))
    return 0


if __name__ == '__main__':
    sys.exit(main())

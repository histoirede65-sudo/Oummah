#!/usr/bin/env python3
"""OUMMAH — precomputed product alternatives for the Scan result sheet.

"Same type" = the product's deepest Open Food Facts category (official taxonomy) that still holds
enough products sold in France (colas, not "sweetened beverages"; farmer's crisps, not "snacks").

  1. extract the products sold in France from the OFF Parquet export (only the needed columns),
  2. for each comparison category, keep the most popular products of each Nutri-Score grade,
  3. replace the three Supabase tables: products, category → products links, category sizes.

Boycott filtering is NOT done here: the app filters candidates at scan time with the live boycott
catalog (brands, owners, GS1 prefixes), so there is a single source of truth.

Usage (from the project root):
  python scripts/product-alternatives/build_product_alternatives.py            # extract if needed + build + upload
  python scripts/product-alternatives/build_product_alternatives.py --refresh  # force a new extraction
  python scripts/product-alternatives/build_product_alternatives.py --dry-run  # build only, print samples

Env (.env / .env.local, or process env):
  EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (keep it in .env.local, never in .env)
Data: Open Food Facts, ODbL (attribution shown in the app).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / 'scripts' / 'output' / 'product-alternatives'
EXTRACT_PATH = OUTPUT_DIR / 'off-france.parquet'
OFF_PARQUET_URL = 'https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet'
OFF_TAXONOMY_URL = 'https://static.openfoodfacts.org/data/taxonomies/categories.json'
TAXONOMY_PATH = OUTPUT_DIR / 'categories-taxonomy.json'
USER_AGENT = 'OUMMAH-ProductAlternatives/1.0'
TABLE = 'product_alternative_candidates'
LINK_TABLE = 'product_alternative_category_products'
CATEGORY_TABLE = 'product_alternative_categories'
PER_GRADE = 15        # most popular products kept per category and Nutri-Score grade
PER_BRAND = 2         # per category and grade: one brand cannot fill the list (Coca-Cola has dozens of colas)
MIN_TYPE_SIZE = 8     # a "type" category needs at least this many French products with a Nutri-Score
MAX_TYPE_SIZE = 4000  # with MIN_TYPE_DEPTH, keeps families ("snacks", "sweetened beverages") out
MIN_TYPE_DEPTH = 4    # taxonomy depth: "sweet spreads" (2) is a family, "cocoa and hazelnut spreads" (5) a type
EXTRACT_MAX_AGE_DAYS = 30
HALAL_LABEL = re.compile(r'halal|a-votre-service|avs|achahada|argml|mosquee|sfcvh|hqc|ifanca|jakim|muis|cicot|eurohalal|halal-zertifizierung')


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


def http(url: str, *, method: str = 'GET', headers: dict[str, str] | None = None, body: bytes | None = None, timeout: int = 120) -> bytes:
    request = urllib.request.Request(url, data=body, method=method, headers={'User-Agent': USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def download_dump() -> Path:
    """Full OFF Parquet export (≈ 8 Go): one streamed download is much faster than remote range reads."""
    dump = OUTPUT_DIR / 'food.parquet'
    partial = dump.with_suffix('.part')
    print('Téléchargement de l’export Open Food Facts…', flush=True)
    started = time.time()
    request = urllib.request.Request(OFF_PARQUET_URL, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response, open(partial, 'wb') as output:
        total = int(response.headers.get('Content-Length') or 0)
        done, next_report = 0, 0.0
        while chunk := response.read(8 * 1024 * 1024):
            output.write(chunk)
            done += len(chunk)
            if total and done / total >= next_report:
                print(f'  {done / 1e9:.1f} / {total / 1e9:.1f} Go', flush=True)
                next_report += 0.1
    partial.replace(dump)
    print(f'Téléchargé en {time.time() - started:.0f} s', flush=True)
    return dump


def extract(refresh: bool) -> None:
    """OFF Parquet export → local France subset with only the needed columns."""
    if EXTRACT_PATH.exists() and not refresh and time.time() - EXTRACT_PATH.stat().st_mtime < EXTRACT_MAX_AGE_DAYS * 86400:
        print(f'Extraction récente réutilisée : {EXTRACT_PATH}')
        return
    import duckdb
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    dump = download_dump()
    tmp = EXTRACT_PATH.with_suffix('.tmp.parquet')
    con = duckdb.connect()
    print('Extraction des produits vendus en France…', flush=True)
    started = time.time()
    con.execute(f"""
      COPY (
        SELECT code, product_name, brands, brands_tags, categories_tags, compared_to_category, nutriscore_grade, nutriscore_score,
               nova_group, additives_tags, popularity_key, unique_scans_n, labels_tags, quantity, owner,
               list_transform(list_filter(images, x -> x.key LIKE 'front_%'), x -> {{'key': x.key, 'rev': x.rev}}) AS images
        FROM read_parquet('{dump.as_posix()}')
        WHERE list_contains(countries_tags, 'en:france')
          AND nutriscore_grade IN ('a', 'b', 'c', 'd', 'e')
          AND len(categories_tags) > 0
          AND coalesce(obsolete, false) = false
      ) TO '{tmp.as_posix()}' (FORMAT parquet, COMPRESSION zstd)
    """)
    tmp.replace(EXTRACT_PATH)
    dump.unlink(missing_ok=True)  # 8 Go: only the France subset is kept
    count = con.execute(f"SELECT count(*) FROM read_parquet('{EXTRACT_PATH.as_posix()}')").fetchone()[0]
    print(f'{count} produits extraits en {time.time() - started:.0f} s → {EXTRACT_PATH}', flush=True)


def pick_name(names) -> str | None:
    if not names:
        return None
    by_lang = {item['lang']: (item['text'] or '').strip() for item in names if item and item.get('text')}
    for lang in ('fr', 'main', 'en'):
        if by_lang.get(lang):
            return by_lang[lang]
    return next((value for value in by_lang.values() if value), None)


def image_url(code: str, images) -> str | None:
    """Front photo URL on the OFF image server (400 px)."""
    if not images:
        return None
    fronts = {item['key']: item for item in images if item and str(item.get('key', '')).startswith('front_') and item.get('rev')}
    front = fronts.get('front_fr') or fronts.get('front_en') or next(iter(fronts.values()), None)
    if not front:
        return None
    digits = code if not code.isdigit() else code.zfill(13)
    path = '/'.join([digits[0:3], digits[3:6], digits[6:9], digits[9:]]) if digits.isdigit() and len(digits) >= 13 else digits
    return f"https://images.openfoodfacts.org/images/products/{path}/{front['key']}.{front['rev']}.400.jpg"


def load_taxonomy(refresh: bool) -> list[tuple[str, int, str | None]]:
    """(tag, depth, French name) from the official OFF categories taxonomy; depth = longest path to a root."""
    if refresh or not TAXONOMY_PATH.exists():
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        TAXONOMY_PATH.write_bytes(http(OFF_TAXONOMY_URL))
    taxonomy = json.loads(TAXONOMY_PATH.read_text(encoding='utf-8'))
    depths: dict[str, int] = {}

    def depth(tag: str, trail: frozenset[str] = frozenset()) -> int:
        if tag in depths:
            return depths[tag]
        parents = [parent for parent in (taxonomy.get(tag) or {}).get('parents') or [] if parent in taxonomy and parent not in trail]
        value = 1 + max((depth(parent, trail | {tag}) for parent in parents), default=0)
        depths[tag] = value
        return value

    sys.setrecursionlimit(10000)
    return [(tag, depth(tag), ((entry.get('name') or {}).get('fr') or None)) for tag, entry in taxonomy.items()]


def build_rows(refresh: bool = False) -> tuple[list[dict], list[dict], list[dict]]:
    """Returns (products, category links, category sizes).

    A "type" category is a well-formed taxonomy tag holding MIN_TYPE_SIZE..MAX_TYPE_SIZE French products
    and being the most precise usable tag of at least one of them. Every product is linked to each of
    its type categories, so the app can search inside the scanned product's own most precise category.
    """
    import duckdb
    con = duckdb.connect()
    con.execute('CREATE TEMP TABLE taxonomy (tag VARCHAR, depth INTEGER, name_fr VARCHAR)')
    con.executemany('INSERT INTO taxonomy VALUES (?, ?, ?)', load_taxonomy(refresh))
    con.execute(f"""
      CREATE TEMP TABLE products AS
        SELECT *, list_bool_or(list_transform(product_name, x -> x.lang = 'fr' AND coalesce(x.text, '') <> '')) AS has_fr_name
        FROM read_parquet('{EXTRACT_PATH.as_posix()}') WHERE code IS NOT NULL AND length(code) >= 8;
      -- Well-formed taxonomy tags only ("en:colas", "fr:pates-a-tartiner"); free-text tags are noise.
      CREATE TEMP TABLE tags AS
        SELECT code, tag FROM (SELECT code, unnest(list_distinct(categories_tags)) AS tag FROM products)
        WHERE regexp_full_match(tag, '[a-z]{{2,3}}:[a-z0-9-]+');
      CREATE TEMP TABLE sizes AS
        SELECT tag, count(*) AS size, coalesce(any_value(x.depth), 0) AS depth, any_value(x.name_fr) AS name_fr
        FROM tags LEFT JOIN taxonomy x USING (tag) GROUP BY tag;
      -- Type = deepest taxonomy tag in the size window, then smallest. Shallow or unknown tags
      -- ("confectionary-based-spreads", depth 3, mixes jams and chocolate spreads) never define a type:
      -- a badly categorised product gets no alternative rather than a wrong one.
      CREATE TEMP TABLE types AS
        SELECT DISTINCT arg_max(t.tag, s.depth * 100000000 - s.size) AS tag
        FROM tags t JOIN sizes s USING (tag)
        WHERE s.size BETWEEN {MIN_TYPE_SIZE} AND {MAX_TYPE_SIZE} AND s.depth >= {MIN_TYPE_DEPTH}
        GROUP BY t.code;
      -- Only branded products (checkable against the boycott catalog) with a front photo (recognisable
      -- on the shelf) are recommended.
      CREATE TEMP TABLE links AS
        WITH candidates AS (
          SELECT t.tag AS category, p.code, p.nutriscore_grade, coalesce(p.popularity_key, 0) AS popularity, p.has_fr_name,
                 coalesce(p.unique_scans_n, 0) AS scans, p.nutriscore_score,
                 lower(trim(split_part(coalesce(p.brands_tags[1], p.brands), ',', 1))) AS brand_key
          FROM tags t JOIN types USING (tag) JOIN products p USING (code)
          WHERE trim(coalesce(p.brands, '')) <> ''
            AND len(list_filter(coalesce(p.images, []), x -> x.rev IS NOT NULL)) > 0
        ),
        per_brand AS (
          SELECT *, row_number() OVER (PARTITION BY category, nutriscore_grade, brand_key
                                       ORDER BY has_fr_name DESC, popularity DESC, scans DESC, nutriscore_score ASC) AS brand_rank
          FROM candidates
        )
        SELECT * FROM (
          SELECT category, code, nutriscore_grade, popularity,
                 row_number() OVER (PARTITION BY category, nutriscore_grade
                                    ORDER BY has_fr_name DESC, popularity DESC, scans DESC, nutriscore_score ASC) AS grade_rank
          FROM per_brand WHERE brand_rank <= {PER_BRAND}
        ) WHERE grade_rank <= {PER_GRADE};
    """)
    categories = [{'category': tag, 'size': int(size), 'depth': int(depth), 'name_fr': name_fr}
                  for tag, size, depth, name_fr in con.execute('SELECT s.tag, s.size, s.depth, s.name_fr FROM sizes s JOIN types USING (tag)').fetchall()]
    records = con.execute("""
      SELECT code, product_name, brands, brands_tags, nutriscore_grade, nutriscore_score, nova_group, additives_tags,
             coalesce(popularity_key, 0), labels_tags, quantity, images, owner
      FROM products WHERE code IN (SELECT code FROM links)
    """).fetchall()
    columns = ['code', 'product_name', 'brands', 'brands_tags', 'grade', 'score', 'nova', 'additives', 'popularity', 'labels', 'quantity', 'images', 'owner']
    products: list[dict] = []
    seen: set[str] = set()
    for record in records:
        item = dict(zip(columns, record))
        name = pick_name(item['product_name'])
        # The OFF export can hold the same barcode twice: one row per product.
        if not name or item['code'] in seen:
            continue
        seen.add(item['code'])
        products.append({
            'barcode': item['code'],
            'product_name': name[:200],
            'brands': (item['brands'] or '')[:200] or None,
            'brands_tags': list(item['brands_tags'] or [])[:10],
            'nutriscore_grade': item['grade'],
            'nutriscore_score': item['score'],
            'nova_group': item['nova'],
            # Additives feed the OUMMAH health score computed in the app (same analyzer as the scan sheet).
            'additives_tags': list(item['additives'] or [])[:40],
            'popularity': int(item['popularity'] or 0),
            'halal_labels': [tag for tag in (item['labels'] or []) if HALAL_LABEL.search(tag)][:10],
            'quantity': (item['quantity'] or '')[:60] or None,
            'image_url': image_url(item['code'], item['images']),
            # OFF producer account ("org-nestle-france"): helps the app tie a subsidiary brand to its group.
            'owner': (item['owner'] or '')[:120] or None,
        })
    links_by_key: dict[tuple[str, str], dict] = {}
    for category, code, grade, popularity in con.execute('SELECT category, code, nutriscore_grade, popularity FROM links').fetchall():
        if code in seen:
            links_by_key.setdefault((category, code), {'category': category, 'barcode': code, 'nutriscore_grade': grade, 'popularity': int(popularity)})
    links = list(links_by_key.values())
    return products, links, categories


class Supabase:
    def __init__(self, url: str, service_key: str):
        self.url = url.rstrip('/')
        self.headers = {'apikey': service_key}
        if service_key.startswith('eyJ'):
            self.headers['Authorization'] = f'Bearer {service_key}'

    def request(self, path: str, *, method: str, body: object | None = None, prefer: str = 'return=minimal') -> None:
        data = json.dumps(body).encode('utf-8') if body is not None else None
        for attempt in range(4):
            try:
                http(f'{self.url}/rest/v1/{path}', method=method, body=data, headers={**self.headers, 'Content-Type': 'application/json', 'Prefer': prefer})
                return
            except urllib.error.HTTPError as error:
                if error.code < 500 or attempt == 3:
                    raise RuntimeError(f'{method} {path} → {error.code}: {error.read()[:300]!r}') from error
                time.sleep(2 ** attempt)

    def upsert_all(self, table: str, conflict: str, rows: list[dict], build_id: str) -> None:
        for start in range(0, len(rows), 1000):
            chunk = [{**row, 'build_id': build_id} for row in rows[start:start + 1000]]
            self.request(f'{table}?on_conflict={conflict}', method='POST', body=chunk, prefer='resolution=merge-duplicates,return=minimal')
            if (start // 1000) % 20 == 0 or start + 1000 >= len(rows):
                print(f'  {table} : {min(start + 1000, len(rows))}/{len(rows)}', flush=True)

    def replace_all(self, products: list[dict], links: list[dict], categories: list[dict], build_id: str) -> None:
        self.upsert_all(TABLE, 'barcode', products, build_id)
        self.upsert_all(LINK_TABLE, 'category,barcode', links, build_id)
        self.upsert_all(CATEGORY_TABLE, 'category', categories, build_id)
        # Rows from older builds (products gone from France or out of the top) are removed afterwards,
        # links first (they reference products).
        for table in (LINK_TABLE, CATEGORY_TABLE, TABLE):
            self.request(f'{table}?build_id=neq.{build_id}', method='DELETE')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--refresh', action='store_true', help='force a new extraction from Open Food Facts')
    parser.add_argument('--dry-run', action='store_true', help='build without uploading')
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding='utf-8')  # Windows console defaults to cp1252

    extract(args.refresh)
    products, links, categories = build_rows(args.refresh)
    print(f'{len(products)} produits, {len(links)} liens, {len(categories)} catégories de type.', flush=True)
    (OUTPUT_DIR / 'sample.json').write_text(json.dumps(products[:50], ensure_ascii=False, indent=1), encoding='utf-8')
    if args.dry_run:
        return 0

    url = env_value('EXPO_PUBLIC_SUPABASE_URL')
    service_key = env_value('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not service_key:
        print('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (put the service key in .env.local).')
        return 1
    build_id = time.strftime('%Y%m%d%H%M%S')
    Supabase(url, service_key).replace_all(products, links, categories, build_id)
    print(f'Terminé (build {build_id}).')
    return 0


if __name__ == '__main__':
    sys.exit(main())

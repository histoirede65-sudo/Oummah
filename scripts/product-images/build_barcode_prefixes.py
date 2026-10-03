#!/usr/bin/env python3
"""OUMMAH Scan — GS1 company prefixes for catalog groups (boycott_entities.barcode_prefixes).

A GS1 company prefix belongs to the company that registered the barcodes (the brand owner), so a
validated prefix lets the app recognise a group's products even when Open Food Facts has no brand
for them, or does not know the product at all.

1. Collect barcodes of each group's brands (Open Food Facts search, Open Beauty Facts for cosmetics).
2. Candidate prefixes = first 7 digits of EAN-13 codes seen at least 3 times for the group.
3. Validate each candidate on ALL products carrying it: at least MIN_BRANDED products with a brand,
   at least PURITY of them belonging to the group, and no outside brand above MAX_OUTSIDE_BRAND_SHARE.
   Mixed prefixes (co-packers, companies sharing a 7-digit range) are rejected.

Usage (project root):  python scripts/product-images/build_barcode_prefixes.py [--apply] [--group Nestlé]
Report: scripts/output/barcode-prefixes-report.json
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_product_images import ROOT, Supabase, env_value, http, http_json  # noqa: E402

OFF_SEARCH = 'https://search.openfoodfacts.org/search'
OBF_SEARCH = 'https://world.openbeautyfacts.org/api/v2/search'
REPORT = ROOT / 'scripts' / 'output' / 'barcode-prefixes-report.json'
COSMETIC_GROUPS = {"L'Oréal Groupe", 'Ahava'}
GROUP_REPRESENTATIVE = {'The Coca-Cola Company': 'coca-cola'}
SKIPPED_CATEGORIES = {'finance', 'technology', 'travel', 'energy', 'automotive', 'restaurant'}
AMBIGUOUS = {'bare', 'beyond', 'bonjour', 'boost', 'caro', 'chef', 'ciel', 'crunch', 'crystal', 'essentia', 'evolve', 'extreme', 'fitness', 'georgia', 'gourmet',
             'kas', 'lion', 'matrix', 'nuts', 'perfecto', 'propel', 'resource', 'simply', 'starry', 'wagner'}
# A prefix is kept when most branded products belong to the group AND no single outside brand is
# frequent (isolated unknown brands are often the group's own brands missing from the catalog;
# a frequent outside brand means the 7-digit range is shared with another company).
MIN_SEEN, MIN_BRANDED, PURITY, MAX_OUTSIDE_BRAND_SHARE = 3, 10, 0.75, 0.08


def norm(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', ' ', unicodedata.normalize('NFD', value).encode('ascii', 'ignore').decode().lower()).strip()


def matches(candidate: str, term: str) -> bool:
    if candidate == term or candidate.replace(' ', '') == term.replace(' ', ''):
        return True
    return len(term) >= 5 and re.search(rf'(?:^| ){re.escape(term)}(?:$| )', candidate) is not None


def slug(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFD', value).encode('ascii', 'ignore').decode().lower()).strip('-')


class Groups:
    def __init__(self, entities: list[dict]):
        self.members: dict[str, list[dict]] = collections.defaultdict(list)
        for entity in entities:
            if entity['category'] in SKIPPED_CATEGORIES:
                continue
            self.members[entity['parent_group'] or entity['name']].append(entity)
        self.terms: dict[str, list[tuple[str, bool]]] = {}
        for group, members in self.members.items():
            names = {group, *[m['name'] for m in members], *[a for m in members for a in (m['aliases'] or [])]}
            parts = {p for n in names for p in [n, *n.split(' / ')]}
            self.terms[group] = [(norm(p), norm(p) in AMBIGUOUS) for p in parts if norm(p)]
        by_slug = {e['slug']: e for e in entities}
        self.representative = {}
        for group, members in self.members.items():
            rep = by_slug.get(GROUP_REPRESENTATIVE.get(group, '')) or next((m for m in members if norm(m['name']) == norm(group)), None) or (members[0] if len(members) == 1 else None)
            if rep:
                self.representative[group] = rep

    def classify(self, brands: list[str]) -> str | None:
        candidates = [norm(b) for b in brands if b and norm(b)]
        hits = collections.Counter()
        for group, terms in self.terms.items():
            group_present = any(matches(c, norm(group)) for c in candidates)
            for term, ambiguous in terms:
                if (not ambiguous or group_present) and any(matches(c, term) for c in candidates):
                    hits[group] += 1
        return hits.most_common(1)[0][0] if hits else None


def off_products(query: str, pages: int = 2) -> list[dict]:
    products = []
    for page in range(1, pages + 1):
        url = f'{OFF_SEARCH}?{urllib.parse.urlencode({"q": query, "page_size": 100, "page": page, "fields": "code,brands,brand_owner"})}'
        try:
            payload = http_json(url, timeout=40)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            break
        hits = payload.get('hits', [])  # type: ignore[union-attr]
        products += [{'code': h.get('code', ''), 'brands': [*(h.get('brands') or []), h.get('brand_owner') or '']} for h in hits]
        time.sleep(1.0)
        if len(hits) < 100:
            break
    return products


def obf_products(params: dict, pages: int = 2) -> list[dict]:
    products = []
    for page in range(1, pages + 1):
        url = f'{OBF_SEARCH}?{urllib.parse.urlencode({**params, "page_size": 100, "page": page, "fields": "code,brands,brand_owner"})}'
        try:
            payload = http_json(url, timeout=40)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            break
        items = payload.get('products', [])  # type: ignore[union-attr]
        products += [{'code': p.get('code', ''), 'brands': [*(p.get('brands') or '').split(','), p.get('brand_owner') or '']} for p in items]
        time.sleep(6.5)  # Open Beauty Facts search: 10 requests / minute
        if len(items) < 100:
            break
    return products


def valid_ean13(code: str) -> bool:
    if not re.fullmatch(r'\d{13}', code) or code[0] in '02' or code[:3] in {'977', '978', '979'}:
        return False
    digits = [int(c) for c in code]
    return (10 - sum(d * (3 if i % 2 else 1) for i, d in enumerate(digits[:12])) % 10) % 10 == digits[12]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='write validated prefixes to boycott_entities.barcode_prefixes')
    parser.add_argument('--group', action='append', default=[], help='only these groups (repeatable)')
    args = parser.parse_args()

    url, key = env_value('EXPO_PUBLIC_SUPABASE_URL'), env_value('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).')
        return 1
    db = Supabase(url, key)
    entities = db.select('boycott_entities', 'select=slug,name,aliases,parent_group,category,barcode_prefixes&is_active=eq.true')
    groups = Groups(entities)
    selected = [g for g in groups.members if not args.group or g in args.group]
    report: dict[str, dict] = {}

    for group in selected:
        rep = groups.representative.get(group)
        if not rep:
            continue
        cosmetic = group in COSMETIC_GROUPS
        seen = collections.Counter()
        for member in groups.members[group]:
            name = member['name']
            found = obf_products({'brands_tags': slug(name)}, pages=1) if cosmetic else off_products(f'brands:"{name}"', pages=1)
            for product in found:
                if valid_ean13(product['code']) and groups.classify(product['brands']) == group:
                    seen[product['code'][:7]] += 1
        validated, rejected = [], []
        for prefix, count in seen.most_common():
            if count < MIN_SEEN:
                continue
            sample = obf_products({'codes_tags': f'{prefix}xxxxxx'}) if cosmetic else off_products(f'code:{prefix}*')
            branded = [p for p in sample if any(b.strip() for b in p['brands'])]
            owners = collections.Counter(groups.classify(p['brands']) for p in branded)
            purity = owners[group] / len(branded) if branded else 0
            outside = collections.Counter(norm(next(b for b in p['brands'] if b.strip())) for p in branded if groups.classify(p['brands']) != group)
            top_outside = outside.most_common(1)[0] if outside else ('', 0)
            outside_share = top_outside[1] / len(branded) if branded else 0
            entry = {'prefix': prefix, 'seen_for_group': count, 'branded_products': len(branded), 'purity': round(purity, 3), 'top_outside_brand': top_outside[0], 'top_outside_share': round(outside_share, 3), 'others': {str(k): v for k, v in owners.most_common(4) if k != group}}
            ok = len(branded) >= MIN_BRANDED and purity >= PURITY and outside_share <= MAX_OUTSIDE_BRAND_SHARE
            (validated if ok else rejected).append(entry)
        report[group] = {'entity': rep['slug'], 'validated': validated, 'rejected': rejected}
        print(f"{group:28} -> {rep['slug']:20} {len(validated)} préfixes validés {[v['prefix'] for v in validated]} ({len(rejected)} rejetés)")
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

    if args.apply:
        for group, result in report.items():
            prefixes = sorted({v['prefix'] for v in result['validated']})
            if not prefixes:
                continue
            http(f"{db.url}/rest/v1/boycott_entities?slug=eq.{urllib.parse.quote(result['entity'])}", method='PATCH', body=json.dumps({'barcode_prefixes': prefixes}).encode('utf-8'),
                 headers={**db.headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'})
        print('barcode_prefixes mis à jour.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

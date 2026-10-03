#!/usr/bin/env python3
"""OUMMAH Scan — load French medicine boxes (CIP13 barcodes) into public.boycott_known_products.

Source: Base de données publique des médicaments (ANSM, open data), files CIS_bdpm.txt and CIS_CIP_bdpm.txt.
Every active presentation is loaded so a scanned medicine always shows its name and laboratory;
presentations whose marketing-authorisation holder is Teva or one of its subsidiaries (ratiopharm,
Actavis — acquisitions confirmed on tevapharm.com) are linked to the catalog entity "teva".

Usage (from the project root):  python scripts/product-images/load_medicines.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_product_images import Supabase, env_value, http  # noqa: E402

BDPM_URL = 'https://base-donnees-publique.medicaments.gouv.fr/download/file/{name}'
SOURCE_URL = 'https://base-donnees-publique.medicaments.gouv.fr/'
TEVA_HOLDERS = re.compile(r'\b(TEVA|RATIOPHARM|ACTAVIS)\b', re.IGNORECASE)
BATCH = 1000


def download(name: str) -> list[list[str]]:
    raw = urllib.request.urlopen(urllib.request.Request(BDPM_URL.format(name=name), headers={'User-Agent': 'OUMMAH/1.0'}), timeout=120).read()
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        text = raw.decode('latin-1')
    return [line.split('\t') for line in text.splitlines() if line.strip()]


def holder_label(value: str) -> str:
    # "TEVA SANTE" / " TEVA (PAYS-BAS)" -> "Teva Santé"-like readable label
    clean = re.sub(r'\s*\(.*?\)\s*', ' ', value).strip()
    return clean.title().replace('Sante', 'Santé')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    specialities = {row[0]: row for row in download('CIS_bdpm.txt') if len(row) > 10}
    now = datetime.now(timezone.utc).isoformat()
    rows: dict[str, dict] = {}
    for row in download('CIS_CIP_bdpm.txt'):
        if len(row) < 7 or row[0] not in specialities:
            continue
        cip13, status = row[6].strip(), row[3].lower()
        if not re.fullmatch(r'34009\d{8}', cip13) or 'active' not in status:
            continue
        speciality = specialities[row[0]]
        holder = speciality[10].strip()
        rows[cip13] = {
            'barcode': cip13,
            'product_name': speciality[1].strip()[:300],
            'brand': holder_label(holder)[:120] or None,
            'entity_slug': 'teva' if TEVA_HOLDERS.search(holder) else None,
            'product_kind': 'medicine',
            'source': 'ansm_bdpm',
            'source_url': SOURCE_URL,
            'updated_at': now,
        }
    teva = sum(1 for item in rows.values() if item['entity_slug'])
    print(f'{len(rows)} présentations actives, dont {teva} Teva / ratiopharm / Actavis')
    if args.dry_run:
        return 0

    url, key = env_value('EXPO_PUBLIC_SUPABASE_URL'), env_value('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).')
        return 1
    db = Supabase(url, key)
    items = list(rows.values())
    for start in range(0, len(items), BATCH):
        http(f'{db.url}/rest/v1/boycott_known_products?on_conflict=barcode', method='POST', body=json.dumps(items[start:start + BATCH]).encode('utf-8'),
             headers={**db.headers, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal'}, timeout=120)
        print(f'  {min(start + BATCH, len(items))}/{len(items)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { setHalalCertificationBodies, setHalalReligiousGuides, type HalalCertificationBody, type HalalReligiousGuide } from './halalCertifierRepository';

const CACHE_KEY = 'oummah.halal.certification-bodies.v2';
const GUIDES_CACHE_KEY = 'oummah.halal.religious-guides.v1';
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

type Row = { id: string; name: string; full_name?: string | null; aliases?: string[] | null; off_label_tags?: string[] | null; logo_url?: string | null; country?: string | null; official_website?: string | null; body_type?: string | null; documentation_level: HalalCertificationBody['documentationLevel']; summary: string; facts?: HalalCertificationBody['facts'] | null; criteria?: HalalCertificationBody['criteria'] | null; warnings?: HalalCertificationBody['warnings'] | null; criticisms?: HalalCertificationBody['criticisms'] | null; scholarly_notes?: HalalCertificationBody['scholarlyNotes'] | null; sources?: HalalCertificationBody['sources'] | null; last_verified_at: string; en?: HalalCertificationBody['en'] | null };
type GuideRow = { id: HalalReligiousGuide['id']; title: string; question: string; quran?: HalalReligiousGuide['quran'] | null; sunnah?: HalalReligiousGuide['sunnah'] | null; companions?: HalalReligiousGuide['companions'] | null; scholars?: HalalReligiousGuide['scholars'] | null; agreement?: string | null; divergence?: string | null; reading?: string | null; last_verified_at: string; en?: HalalReligiousGuide['en'] | null };

function fromRow(row: Row): HalalCertificationBody {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name ?? undefined,
    aliases: row.aliases ?? [],
    offLabelTags: row.off_label_tags ?? [],
    logoUrl: row.logo_url ?? undefined,
    country: row.country ?? undefined,
    officialWebsite: row.official_website ?? undefined,
    bodyType: row.body_type ?? undefined,
    documentationLevel: row.documentation_level,
    summary: row.summary,
    facts: row.facts ?? {},
    criteria: row.criteria ?? {},
    warnings: row.warnings ?? [],
    criticisms: row.criticisms ?? [],
    scholarlyNotes: row.scholarly_notes ?? [],
    sources: row.sources ?? [],
    lastVerifiedAt: row.last_verified_at,
    en: row.en ?? undefined,
  };
}

function guideFromRow(row: GuideRow): HalalReligiousGuide {
  return {
    id: row.id,
    title: row.title,
    question: row.question,
    quran: row.quran ?? [],
    sunnah: row.sunnah ?? [],
    companions: row.companions ?? [],
    scholars: row.scholars ?? [],
    agreement: row.agreement ?? undefined,
    divergence: row.divergence ?? undefined,
    reading: row.reading ?? undefined,
    lastVerifiedAt: row.last_verified_at,
    en: row.en ?? undefined,
  };
}

function notify() { listeners.forEach((listener) => listener()); }

async function readCache() {
  try {
    const [bodies, guides] = await Promise.all([AsyncStorage.getItem(CACHE_KEY), AsyncStorage.getItem(GUIDES_CACHE_KEY)]);
    if (bodies) setHalalCertificationBodies(JSON.parse(bodies) as HalalCertificationBody[]);
    if (guides) setHalalReligiousGuides(JSON.parse(guides) as HalalReligiousGuide[]);
    if (bodies || guides) notify();
  } catch {
    // A broken cache only means waiting for the network copy.
  }
}

/** Loads the certification body sheets and religious guides once per app session (cached copy first, then Supabase). */
export function loadHalalCertificationBodies() {
  if (loading) return loading;
  loading = (async () => {
    await readCache();
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !key) return;
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    try {
      const [bodiesResponse, guidesResponse] = await Promise.all([
        fetch(`${url}/rest/v1/halal_certification_bodies?select=*&order=name.asc`, { headers }),
        fetch(`${url}/rest/v1/halal_religious_guides?select=*&order=sort_order.asc`, { headers }),
      ]);
      if (!bodiesResponse.ok) { loading = null; return; }
      const list = (await bodiesResponse.json() as Row[]).map(fromRow);
      setHalalCertificationBodies(list);
      const guides = guidesResponse.ok ? (await guidesResponse.json() as GuideRow[]).map(guideFromRow) : [];
      setHalalReligiousGuides(guides);
      notify();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list));
      if (guides.length) await AsyncStorage.setItem(GUIDES_CACHE_KEY, JSON.stringify(guides));
    } catch {
      loading = null; // retry on next scan
    }
  })();
  return loading;
}

/** Re-renders the caller once the sheets are loaded, so detection and labels use the full data. */
export function useHalalCertificationBodies() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    void loadHalalCertificationBodies();
    return () => { listeners.delete(listener); };
  }, []);
}

// @ts-ignore -- Supabase Edge uses Deno imports with explicit TypeScript extensions.
import { handleGet, json, languageParameter } from '../_shared/http.ts';
// @ts-ignore -- Supabase Edge uses Deno imports with explicit TypeScript extensions.
import { getQuranFoundationSdk } from '../_shared/quranFoundation.ts';
// @ts-ignore -- Supabase Edge uses Deno imports with explicit TypeScript extensions.
import { serve } from '../_shared/runtime.ts';

serve(handleGet(async (request) => {
  const { searchParams } = new URL(request.url);
  const data = await getQuranFoundationSdk().content.v4.chapters.list({
    language: languageParameter(searchParams),
  });
  return json(data);
}));

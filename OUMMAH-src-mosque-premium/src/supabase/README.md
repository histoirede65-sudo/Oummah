# Quran.Foundation Edge Functions

Backend-only proxy architecture for Quran.Foundation Content APIs.

## Required Supabase Secrets

- `QF_CLIENT_ID`
- `QF_CLIENT_SECRET`

Configure these values in Supabase Secrets. Do not add a local secret file to version control.

The Edge Functions use the pinned official server SDK entrypoint
`npm:@quranjs/api@3.4.0/server`. OAuth token retrieval, caching, renewal, and authenticated Content
API calls are delegated to the SDK.

## Functions

- `quran-surahs`: `GET ?language=fr`
- `quran-content`: `GET ?chapter=1&language=fr&page=1&per_page=50&translations=31`
- `quran-audio`: `GET ?chapter=1&reciter=7`

JWT verification remains enabled for every function in `config.toml`. No function is deployed or
invoked as part of this architecture-only setup.

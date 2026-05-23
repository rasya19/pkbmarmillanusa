# Project Rules and Conventions

## Asset Management
- **DO NOT DELETE OR MODIFY** the following PWA icon files in the `/public` directory:
  - `pwa-192x192.png`
  - `pwa-512x512.png`
- These icons are official school logos manually uploaded by the user and must be preserved. The "Sync to GitHub" tool might show them as deleted if they are not present in the local workspace; this is a known environment limitation.

## PPDB Registration
- The PPDB form must strictly follow Dapodik (Ministry of Education) standards.
- Data is stored in the `ppdb_registrations` table in Supabase.
- Always use the multi-step form pattern for mobile-responsive PWA compatibility.

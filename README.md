# Ruqyah Reader PWA - Vercel static deployment

This is the v25 Ruqyah Reader packaged as a Vercel-ready PWA. It retains
all 21 chapters, the original 272 scanned book images, clickable expanded TOC,
mobile reading, notes and Last Read. The original scanned image bytes are unchanged.

## Deploy (no Node.js build required)

Option A: Open https://vercel.com/drop and drop this ZIP file. Choose a
project name and deploy. Ensure the folder root contains `index.html`.

Option B: Extract this ZIP into a Git repository; import the repository at
https://vercel.com/new. Framework preset: Other. Leave Build Command empty
and output directory at the project root (no special build step).

## Install on your phone

- Android Chrome: open the deployed HTTPS URL, then use the Install app item
  in the browser menu (or the in-app Install button when available).
- iPhone Safari: Share > Add to Home Screen > Add.

Installed mode opens chapter 21 by default; chapters 1-20 remain available.

## Offline reading

Service worker pre-caches the base reader. Chapter 21 has 272 original scans
as separate files, fetched lazily. Open chapter 21's TOC and press the
"Offline book" button once while connected to Wi-Fi. Keep the page open until
272/272 finishes. This enables offline access to all scans; pages already
visited may also be cached automatically. Browser storage eviction can remove
offline content. External audio, PDFs and third-party links require internet.

## Notes and Last Read

These are still saved in this browser's localStorage and remain on-device.
Data from an earlier file:// HTML download does NOT migrate automatically to
this new HTTPS domain. Export Notes JSON from the previous version and import
it from the new app ("My Notes" > Import) before deleting the old copy.

Do not clear this site's browser storage if you want to keep notes.

## Files

- index.html - v25 reader with PWA metadata/offline controls
- assets/scans/ - exact 272 original scan files, unchanged
- manifest.webmanifest - install metadata
- sw.js - offline shell and page cache service worker
- icons/ - installable app icons
- vercel.json - HTTP cache headers for Vercel

To publish an update, upload a revised project and bump APP_VERSION in sw.js.

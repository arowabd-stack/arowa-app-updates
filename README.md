# Ruqyah Reader v27 - Vercel PWA (original PDF)

## Deploy

- This folder is a static website. No build command, npm or framework required.
- Upload the extracted folder (or import it in a Git repository) to Vercel.
- `index.html`, `manifest.webmanifest`, `sw.js`, `vercel.json`, `offline.html`, `icons/`, and `assets/ruqyah-book.pdf` must be in the project root as arranged here.
- Serve over HTTPS (Vercel does this automatically). `file://` preview does not support PWA/service worker caching.

## What changed from v26

- Removed all 272 per-page scan image assets. `assets/scans/` is deliberately absent.
- Chapter 21 uses the untouched uploaded original **272-page PDF** at `assets/ruqyah-book.pdf` (11.4 MiB).
- The embedded PDF viewer supports native scrolling/zoom. The chapter TOC jumps by page number using the PDF `#page=` fragment. Native PDF viewer page fragment support depends on browser.
- Last Read and Notes keep their v21 localStorage keys; menu/page controls sync them, but direct scrolling inside a native PDF viewer is not observable by the website.
- `PDF ডাউনলোড করুন` downloads the PDF to the device and attempts to cache a full copy for offline app use.
- Updated service worker handles cached PDF byte ranges; changed shell cache to v27 and deletes old v26 image cache.
- Added a fallback "PDF খুলুন" link when a mobile browser does not support inline embedded PDF.

## Offline

1. Open the deployed website once while online.
2. Open Chapter 21 and press `PDF ডাউনলোড করুন` (in the book TOC).
3. After it says the PDF is cached, the installed PWA should be able to show it offline in browsers supporting native PDF display and range loading.
4. On Android/iOS browsers that do not render embedded PDFs, use the PDF download and open it in the device PDF viewer.

## Storage

- Notes and Last Read are stored locally on the current website origin, under the same v21 keys as before. A new Vercel domain is a different storage origin; use JSON Export/Import for Notes.
- Some mobile browsers may clear CacheStorage due to storage pressure. Keep the downloaded PDF file as backup.

## QA / constraints

- The original source PDF was copied without modifying a byte.
- Browser-native embedded PDF scrolling cannot report its current page to the outer webpage, so Last Read/Notes update when using the book's page controls or TOC, not by simply scrolling inside the PDF.
- No external PDF.js CDN is used; the PWA has no extra runtime dependencies.

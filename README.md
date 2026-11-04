# Ruqyah Shariah — Complete PWA v36 (Integrated Custom Canvas PDF Reader)

This ZIP is a **complete** static Vercel deploy project. The 272-page PDF file is included unchanged.

## Deploy
1. Unzip the archive.
2. Import the extracted folder into Vercel, or upload this entire folder.
3. Framework = Other, Build Command = empty, Output Directory = `public` (already set in `vercel.json`).
4. Deploy and open `/#chapter-21`. Look for the green **নিজস্ব রিডার v36** marker.
5. First time needs internet to fetch the PDF and PDF.js; the PWA and reader cache them.
6. Do not clear browser site data: stored PDF, notes, last-read and pages may be removed.

## Key files
- `public/index.html`: all 21 chapters, with the old native PDF iframe navigation replaced by the custom bridge.
- `public/book-reader.html`: the custom PDF.js Canvas reader; offline PDF and rendered page caching.
- `public/assets/ruqyah-book.pdf`: original unmodified 272-page PDF (11.9 MB).
- `public/sw.js`: app shell + original PDF caching and range support.
- `public/manifest.webmanifest`, `public/icons/*`: installable PWA assets.
- `vercel.json`: Vercel configuration with output directory `public`.

## Important
The browser PDF plugin is not the chapter 21 reader. The page hosts a CUSTOM HTML Canvas PDF renderer. The PDF download link deliberately downloads the source file. The first visit to a page may take a moment to render, and full 272-page offline preparation depends on available browser storage.

Source chapter 1–20 content is unchanged from the v30 GitHub index (blob SHA 31c18084f467ee4625d7a029a86541196d3d70eb). Only chapter 21 reader integration and deployment shell were changed.

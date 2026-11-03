# Ruqyah PWA v31 — small update (no PDF download needed)

This is an OFFLINE patch kit for existing Ruqyah PWA v29/v30.

1. Extract the zip.
2. Open PATCH_INDEX.html in Chrome or Safari on your computer.
3. Select the original `public/index.html` from your EXISTING PWA project.
4. Press "নতুন index.html তৈরি করো", then download `index.html`.
5. Replace the existing `public/index.html` in your project with the newly generated file. If your browser names it `index (1).html`, rename it to `index.html`.
6. Copy `public/sw.js` and `public/assets/ruqyah-pdf-reader-v31.js` and `public/assets/ruqyah-pdf-reader-v31.css` from this kit into the matching folders in your project.
7. Keep the existing `public/assets/ruqyah-book.pdf`, icons, manifest, and vercel.json. Deploy the COMPLETE project to Vercel. Do not deploy just this patch zip.
8. Hard refresh / reload installed PWA after publishing.

This patch changes one v30 inline script to load v31 PDF.js reader, and adds the CSS link. It does not rewrite the Qur'an text, the PDF or user Notes. If the old index.html is missing, use the v31 Full Deploy ZIP instead.

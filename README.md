# Ruqyah and Hijama reading library

Visual release matching the approved homepage preview: forest green, warm paper surfaces, Bangla typography and official Hugeicons. Mobile navigation uses 44px controls. The Ruqyah reader groups settings in a native dialog and shows source notes in a drawer. Dua text, translations and audio mappings retain their original sources; Quran verses now use the selected writing system as described below. Questions retain the existing public corpus, answer file and local draft key.

Build with `node build-v38.mjs`. Vercel serves `public/`. The generated reader and font payloads are emitted during the build. Service-worker shell version: v58.

This release includes UI and previously public content only. The supplied Hijama book text, illustrations and original PDF are excluded. The existing Hijama PDF reader retains its local file picker.

The local Hijama reader starts with a file chooser instead of requesting an unpublished PDF and showing HTTP 404. PDF validation accepts valid small documents and retains the `%PDF-` signature check.

## Arabic writing systems

The Arabic dropdown changes both Quran text and font: `noorehuda`/`indopak` use `quran_indo.db`; `uthmani`/`hafs` use `quran.db`. Existing preferences retain their storage key. Hadith, dua, Bengali translations, verse identifiers, audio nodes and the scanned PDF remain unchanged.

The original databases each contain 6,236 verses in 114 surahs, in the FTS3 `verses(sura, ayah, text, primary)` table. The web app bundles only its 649 referenced verses (840 displayed instances) in two local, synchronous payloads. This avoids a browser SQLite dependency, remote Quran-text requests and asynchronous switching races. All source Unicode, including spaces and marks, is retained verbatim. `public/data/quran-sources.json` records the pinned upstream revision and SHA-256 checksums.

To regenerate after adding a new keyed verse, download both databases from the exact revision in that manifest into a local directory, then run `python scripts/export-quran.py /path/to/databases`. The exporter checks integrity, schema, unique keys, complete numbering and all 6,236 rows before selecting the reader's keys. Run `node build-v38.mjs` afterward. The build refuses missing verses or modified payload checksums.

Tajweed rebinds its text snapshots after every switch; annotations are applied only to exact matching spelling. Search refreshes its Arabic index. The service worker precaches both text payloads plus the selectable Arabic fonts; the PDF cache name and range handling are retained.

Validation (Node 24+): `npm install --prefix tests`, then `npm test --prefix tests`. The tests execute the generated reader in a DOM environment and the real service worker in a cache/network harness. They cover all 840 verse instances, four font selections, representative verses from eight surahs, tajweed toggles, saved preferences, search, audio source/time/identity, bookmark and note storage, offline resources and PDF byte ranges. They do not simulate real audio streaming, browser layout or PDF rasterization.

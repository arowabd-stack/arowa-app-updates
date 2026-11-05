# Ruqyah and Hijama reading library

Visual release matching the approved homepage preview: forest green, warm paper surfaces, Bangla typography and official Hugeicons. Mobile navigation uses 44px controls. The Ruqyah reader groups settings in a native dialog and shows source notes in a drawer; original source text and audio mappings are unchanged. Questions retain the existing public corpus, answer file and local draft key.

Build with `node build-v38.mjs`. Vercel serves `public/`. The generated reader and font payloads are emitted during the build. Service-worker shell version: v45.

This release includes UI and previously public content only. The supplied Hijama book text, illustrations and original PDF are excluded. The existing Hijama PDF reader retains its local file picker.

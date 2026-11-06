/* Ruqyah Reader v27: one PDF asset, cache-on-demand, byte-range support offline. */
'use strict';
const APP_VERSION='v66-20261106-no-auto-install-popup';
const SHELL_CACHE='ruqyah-pwa-shell-'+APP_VERSION;
const PDF_CACHE='ruqyah-original-pdf-v1';
const PDF_URL=new URL('assets/ruqyah-book.pdf',self.registration.scope).href;
const HOME=new URL('index.html',self.registration.scope).href;
const FALLBACK=new URL('offline.html',self.registration.scope).href;
const SHELL_FILES=['index.html','install.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png',
'icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png','offline.html','check.html',
'book-reader.html','reader.html','ruqyah-guide.html','hijama-guide.html','hijama-book.html','hijama-questions.html','hijama-training.html','hijama-pdf-publish.html','data/hijama-answers.json','assets/book21-direct-v38.js','assets/library.css','assets/library.js','assets/pwa-install.js','assets/pwa-install.css','assets/hijama-training.js','assets/hijama-training.css','assets/hijama-cupping.png','assets/hijama-treatment.png','assets/hijama-toc.js','assets/hijama-toc.css','assets/hugeicons.css','assets/ruqyah-redesign.css','assets/ruqyah-redesign.js','assets/ruqyah-guide.css','assets/ruqyah-book-icons.svg','assets/ruqyah-guide.js','assets/ruqyah-library-search-bridge.js','assets/reader-settings.js','assets/pdf-shell.css','assets/questions.js','assets/question-editor.js','assets/fonts/hind-siliguri.ttf','assets/fonts/hind-siliguri-semibold.ttf','assets/fonts/kalpurush.ttf','assets/fonts/noorehuda.ttf','assets/fonts/hugeicons.ttf'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL_CACHE);
  const fontListURL=new URL('data/reader-fonts.json',self.registration.scope).href;
  const fontResponse=await fetch(fontListURL,{cache:'reload'});
  if(!fontResponse.ok)throw new Error('Arabic offline font manifest unavailable');
  const fontFiles=await fontResponse.json();
  const scriptureFiles=['data/quran-uthmani-v1.js','data/quran-indopak-v1.js','data/quran-sources.json','data/reader-fonts.json','assets/reader-scripture.js'];
  await cache.addAll([...SHELL_FILES,...scriptureFiles,...fontFiles].map(path=>new URL(path,self.registration.scope).href));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>(k.startsWith('ruqyah-pwa-shell-')&&k!==SHELL_CACHE)||k==='ruqyah-book-scans-v1')
    .map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
async function rangeFromCachedPDF(response,rangeHeader){
 const blob=await response.blob();
 const size=blob.size;
 // Native Chromium PDF viewers commonly request bytes=0- or suffix ranges.
 const m=/^bytes=(\d*)-(\d*)$/.exec((rangeHeader||'').trim());
 if(!m)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
 let start,end;
 if(m[1]===''){
   const suffix=Number(m[2]);if(!suffix)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
   start=Math.max(0,size-suffix);end=size-1;
 }else{
   start=Number(m[1]);end=m[2]!==''?Number(m[2]):size-1;
 }
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)
   return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
 end=Math.min(end,size-1);
 const slice=blob.slice(start,end+1,'application/pdf');
 return new Response(slice,{status:206,headers:{'Content-Type':'application/pdf',
 'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${size}`,
 'Content-Length':String(slice.size),'Cache-Control':'no-store'}});
}
async function servePDF(event){
 const req=event.request;
 const range=req.headers.get('Range');
 const cache=await caches.open(PDF_CACHE);
 const saved=await cache.match(PDF_URL);
 if(saved){return range?rangeFromCachedPDF(saved,range):saved;}
 // If not yet cached, forward native browser range requests unmodified.
 // The explicit PDF Download button fetches and caches the entire original PDF for offline use.
 try{
   const fetched=await fetch(req);
   if(fetched.ok&&!range&&fetched.status===200&&/pdf|octet-stream/.test(fetched.headers.get('Content-Type')||''))
     event.waitUntil(cache.put(PDF_URL,fetched.clone()).catch(()=>{}));
   return fetched;
 }catch(e){return new Response('PDF unavailable offline. Download it once while online.',
   {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
}
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const u=new URL(req.url);
 if(u.origin!==self.location.origin)return;
 // Query parameters force PDF-plugin page reloads. They must still match
 // the single offline-cached PDF file, otherwise offline navigation 404s.
 if(u.pathname===new URL(PDF_URL).pathname){event.respondWith(servePDF(event));return;}
 if(u.pathname.endsWith('/assets/book21-direct-v38.js')){event.respondWith((async()=>{const c=await caches.open(SHELL_CACHE);return (await c.match(req))||fetch(req)})());return;}
 if(/\/(?:data\/quran-(?:uthmani|indopak)-v1\.js|assets\/reader-scripture\.js)$/.test(u.pathname)){
  event.respondWith((async()=>{const c=await caches.open(SHELL_CACHE);return (await c.match(req,{ignoreSearch:true}))||fetch(req)})());return;
 }
 if(u.pathname.includes('/assets/hijama/')||u.pathname.includes('/assets/fonts/')||u.pathname.includes('/assets/ruqyah-fonts/')||/\/(?:assets\/[^/]+\.(?:css|js)|data\/hijama-book\.json)$/.test(u.pathname)){
  event.respondWith((async()=>{const c=await caches.open(SHELL_CACHE);try{const r=await fetch(req);if(r.ok)event.waitUntil(c.put(req,r.clone()).catch(()=>{}));return r}catch(e){return (await c.match(req))||Response.error()}})());return;
 }
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try{const response=await fetch(req);
     if(response.ok&&new URL(req.url).pathname.endsWith('/')){
       const c=await caches.open(SHELL_CACHE);event.waitUntil(c.put(HOME,response.clone()));}
     return response;
   }catch(e){return (await caches.match(req,{ignoreSearch:true}))||(await caches.match(HOME))||(await caches.match(FALLBACK))||Response.error();}
  })());return;
 }
 if(u.pathname.endsWith('/manifest.webmanifest')||u.pathname.endsWith('/offline.html')||u.pathname.includes('/icons/')){
  event.respondWith((async()=>{const c=await caches.open(SHELL_CACHE);return (await c.match(req))||(await fetch(req));})());
 }
});

// Cache PDF.js assets after first use so installed PWAs can reopen the viewer.
// The same pinned API+worker version must be used to avoid worker mismatches.
const PDFJS_CACHE='ruqyah-pdfjs-lib-v36';
const PDFJS_RESOURCES=new Set([
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
]);
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||!PDFJS_RESOURCES.has(req.url))return;
 event.respondWith((async()=>{
  const cache=await caches.open(PDFJS_CACHE);
  const saved=await cache.match(req);
  if(saved)return saved;
  try{
   const response=await fetch(req);
   if(response.ok||response.type==='opaque')event.waitUntil(cache.put(req,response.clone()).catch(()=>{}));
   return response;
  }catch(e){return saved||Response.error();}
 })());
});

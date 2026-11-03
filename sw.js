/* Ruqyah Reader v27: one PDF asset, cache-on-demand, byte-range support offline. */
'use strict';
const APP_VERSION='v28-20261103-pdf-fix';
const SHELL_CACHE='ruqyah-pwa-shell-'+APP_VERSION;
const PDF_CACHE='ruqyah-original-pdf-v1';
const PDF_URL=new URL('assets/ruqyah-book.pdf',self.registration.scope).href;
const HOME=new URL('index.html',self.registration.scope).href;
const FALLBACK=new URL('offline.html',self.registration.scope).href;
const SHELL_FILES=['index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png',
'icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png','offline.html'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL_CACHE);
  await cache.addAll(SHELL_FILES.map(path=>new URL(path,self.registration.scope).href));
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
 if(u.href.split('#')[0]===PDF_URL){event.respondWith(servePDF(event));return;}
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try{const response=await fetch(req);
     if(response.ok&&new URL(req.url).pathname.endsWith('/')){
       const c=await caches.open(SHELL_CACHE);event.waitUntil(c.put(HOME,response.clone()));}
     return response;
   }catch(e){return (await caches.match(HOME))||(await caches.match(FALLBACK))||Response.error();}
  })());return;
 }
 if(u.pathname.endsWith('/manifest.webmanifest')||u.pathname.endsWith('/offline.html')||u.pathname.includes('/icons/')){
  event.respondWith((async()=>{const c=await caches.open(SHELL_CACHE);return (await c.match(req))||(await fetch(req));})());
 }
});
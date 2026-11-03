/* Ruqyah Reader PWA: app-shell offline, on-demand cache for original scanned pages. */
'use strict';
const APP_VERSION='v26-20261102';
const SHELL_CACHE='ruqyah-pwa-shell-'+APP_VERSION;
const SCAN_CACHE='ruqyah-book-scans-v1';
const ORIGIN=new URL(self.registration.scope).origin;
const HOME=new URL('index.html',self.registration.scope).href;
const SCAN_PATH=new URL('assets/scans/',self.registration.scope).pathname;
const SHELL_FILES=['index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png',
'icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png','offline.html'];
self.addEventListener('install',e=>{
 e.waitUntil((async()=>{
   const cache=await caches.open(SHELL_CACHE);
   await cache.addAll(SHELL_FILES.map(path=>new URL(path,self.registration.scope).href));
   await self.skipWaiting();
 })());
});
self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{
   const names=await caches.keys();
   await Promise.all(names.filter(name=>name.startsWith('ruqyah-pwa-shell-')&&name!==SHELL_CACHE)
       .map(name=>caches.delete(name)));
   await self.clients.claim();
 })());
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.origin!==ORIGIN)return;
 if(e.request.mode==='navigate'){
   e.respondWith((async()=>{
     try{
       const response=await fetch(e.request);
       if(response.ok){const cache=await caches.open(SHELL_CACHE);
         e.waitUntil(cache.put(HOME,response.clone()).catch(()=>{}));}
       return response;
     }catch(err){return (await caches.match(HOME))||(await caches.match(new URL('offline.html',self.registration.scope).href))||Response.error();}
   })());
   return;
 }
 if(url.pathname.startsWith(SCAN_PATH)){
   e.respondWith((async()=>{
     const cache=await caches.open(SCAN_CACHE);
     const hit=await cache.match(e.request);
     if(hit)return hit;
     try{
       const response=await fetch(e.request);
       if(response.ok)e.waitUntil(cache.put(e.request,response.clone()).catch(()=>{}));
       return response;
     }catch(err){return new Response('Scan page not available offline',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}
   })());
   return;
 }
 // Icons, manifest, and offline fallback are bundled during initial install.
 if(['/manifest.webmanifest','/offline.html'].some(x=>url.pathname.endsWith(x)) || url.pathname.includes('/icons/')){
   e.respondWith((async()=>{
     const cache=await caches.open(SHELL_CACHE);
     return (await cache.match(e.request))||(await fetch(e.request));
   })());
 }
});

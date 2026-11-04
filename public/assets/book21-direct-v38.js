
/* Ruqyah v37: native PDF iframe removed. PDF.js is mounted directly inside chapter 21. */
(()=>{'use strict';
const book=document.getElementById('chapter-21');if(!book)return;
const host=document.getElementById('bookCanvasMount');if(!host)return;
const layout=book.querySelector('.book-scan-layout'),toc=book.querySelector('.book-toc');
const pageInput=document.getElementById('bookPageInput'),counter=document.getElementById('bookPageCount');
const prev=document.getElementById('bookPrevPage'),next=document.getElementById('bookNextPage');
const open=document.getElementById('bookPdfOpen'),message=document.getElementById('bookPdfMessage');
const chapterLink=document.querySelector('.chapter-item[data-target="chapter-21"]');
const TOTAL=272,digits='০১২৩৪৫৬৭৮৯';
const bn=n=>String(n).replace(/\d/g,c=>digits[Number(c)]);
const parse=n=>Number(String(n||'').replace(/[০-৯]/g,c=>digits.indexOf(c)).replace(/[^0-9]/g,''));
const clamp=n=>Math.max(1,Math.min(TOTAL,Math.floor(Number(n)||1)));
const pdfUrl=new URL('./assets/ruqyah-book.pdf',document.baseURI).href;
let requestedPage=1,showingPage=1,oldScroll=0,hasSavedEvent=false,initialized=false;
window.RuqyahBookReaderVersion='v38-static-canvas-no-iframe';
open.href=pdfUrl;open.download='Ruqyah-Abdullah-Al-Mahmud.pdf';open.textContent='⬇ PDF';open.title='মূল PDF ডাউনলোড করুন';
if(message)message.hidden=true;
const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML="<style>\n:host{color-scheme:light;--green:#397652;--bg:#e6ebe6;--muted:#6c806f}\n*{box-sizing:border-box}:host{display:block;width:100%;height:100%;margin:0;padding:0;overflow:hidden;contain:layout style}\n:host{background:var(--bg);font-family:system-ui,'Noto Sans Bengali',sans-serif;color:#25452e}\n#app{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;position:relative}\n#reader{flex:1 1 auto;width:100%;min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable;touch-action:pan-x pan-y}\n#pages{--page-width:640px;min-width:100%;display:flex;flex-direction:column;align-items:center;gap:14px;padding:12px 8px 44px}\n.page{position:relative;flex:none;width:var(--page-width);aspect-ratio:585 / 825;background:#fff;box-shadow:0 3px 15px rgba(30,50,35,.15);overflow:hidden;contain:layout paint style}\n.page canvas,.page img{display:block;width:100%;height:100%;background:white;object-fit:fill}\n.page:not(.painted)::before{content:'পৃষ্ঠা ' attr(data-page);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#7c9582;font:500 15px/1.4 system-ui}\n.page.current{outline:1px solid #7da88b55}\n#status{position:absolute;z-index:10;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:#f7faf7;color:#2a593e;text-align:center}\n#status[hidden]{display:none!important}\n#status .inner{display:flex;max-width:360px;flex-direction:column;align-items:center;gap:11px;line-height:1.65}\n#status strong{font-size:18px}#status span{font-size:13px;color:#607968}\n#status a,#status button{border:1px solid #cadbce;background:#fff;color:#2b704b;padding:9px 15px;border-radius:10px;text-decoration:none;font:600 13px system-ui;cursor:pointer}\n#status .progress{height:5px;width:min(230px,70vw);border-radius:99px;background:#dde8db;overflow:hidden}\n#status .progress>div{height:100%;background:#51936e;width:10%;transition:width .2s}\n#hud{position:absolute;z-index:4;right:15px;bottom:13px;display:flex;align-items:center;gap:7px;border:1px solid #dbe7d9;border-radius:999px;background:#f9fcf9ec;box-shadow:0 3px 16px #254a2e28;padding:5px 7px;user-select:none}\n#hud button{height:32px;min-width:35px;border:0;border-radius:999px;background:#e8f1e9;color:#29523c;font:700 19px/1 system-ui;cursor:pointer}\n#hud button:focus-visible{outline:2px solid #548e62}\n#hud .pct{font:700 11px system-ui;color:#365a40;min-width:37px;text-align:center}\n#hud .badge{padding:0 8px;font:600 11px system-ui;color:#647b69;border-right:1px solid #d3e0d2}\n#hud .offline-state{font:600 11px system-ui;color:#316b45;white-space:nowrap;padding:0 5px}\n#hud .offline-state[hidden]{display:none}\n#hud .pages-prepared{font:600 10px system-ui;color:#316b45;white-space:nowrap;padding:0 5px}\n#hud .pages-prepared[hidden]{display:none}\n#hud .reader-version{font:600 10px system-ui;color:#5a7560;white-space:nowrap;padding-right:3px}\n@media(max-width:700px){#pages{gap:8px;padding:6px 2px 35px}.page{box-shadow:0 1px 5px #273e2725}#hud{bottom:9px;right:9px;padding:3px 4px;gap:3px}#hud button{height:29px;min-width:30px;font-size:17px}#hud .badge{padding:0 6px;font-size:10px}}\n@media(max-width:700px){#hud .pages-prepared{position:absolute;right:4px;bottom:39px;background:#f7fbf7;padding:5px 9px;border:1px solid #d3e2d4;border-radius:99px;box-shadow:0 2px 10px #2042281b}#hud .reader-version{display:none}}\n</style><div id=\"app\">\n  <div id=\"status\" role=\"status\" aria-live=\"polite\"><div class=\"inner\"><strong id=\"statusTitle\">PDF রিডার প্রস্তুত হচ্ছে…</strong><span id=\"statusText\">মূল বইটি একবার লোড হলে পৃষ্ঠা পরিবর্তন হবে তাৎক্ষণিক।</span><div class=\"progress\"><div id=\"progressBar\"></div></div><button id=\"retry\" type=\"button\" hidden>আবার চেষ্টা করুন</button><a href=\"./assets/ruqyah-book.pdf\" target=\"_blank\" rel=\"noopener\">মূল PDF খুলুন</a></div></div>\n  <div id=\"reader\" role=\"region\" aria-label=\"মূল PDF, টাচ ও মাউস দিয়ে স্ক্রল করুন\" tabindex=\"0\"><div id=\"pages\"></div></div>\n  <div id=\"hud\" aria-label=\"বইয়ের Zoom\"><span class=\"reader-version\" title=\"নতুন পৃষ্ঠা-ক্যাশ রিডার\">v34</span><span id=\"offlineBadge\" class=\"offline-state\" hidden aria-live=\"polite\"></span><span id=\"preparedBadge\" class=\"pages-prepared\" hidden aria-live=\"polite\"></span><span class=\"badge\" id=\"pageBadge\">১ / ২৭২</span><button id=\"zoomOut\" title=\"ছোট করুন\" aria-label=\"Zoom out\">−</button><span class=\"pct\" id=\"zoomLevel\">100%</span><button id=\"zoomIn\" title=\"বড় করুন\" aria-label=\"Zoom in\">+</button></div>\n</div>";
const byId=id=>shadow.getElementById(id);
const header=document.createElement('div');header.className='book-mobile-topbar';
header.innerHTML='<button type="button" class="book-mobile-menu-btn" aria-label="সূচিপত্র খুলুন" aria-expanded="false">☰</button><a class="book-home-toplink" href="./index.html" aria-label="হোমপেজে ফিরে যান" title="হোমপেজ">⌂ হোম</a><span class="book-mobile-title">মূল বই · নিজস্ব PDF রিডার</span><span class="book-mobile-number">১ / ২৭২</span><button type="button" class="book-fullscreen-btn">⛶ বড় করে দেখুন</button><button type="button" class="book-exit-fullscreen">✕ বন্ধ</button>';
layout.insertBefore(header,layout.firstChild);

const homeCSS=document.createElement('style');homeCSS.id='ruqyah-book-home-nav-css';
homeCSS.textContent='#chapter-21 .book-home-toplink{display:inline-flex;align-items:center;justify-content:center;flex:none;white-space:nowrap;padding:6px 9px;background:#e9f3ec;color:#165a41;text-decoration:none;border-radius:9px;border:1px solid #bfdcc7;font:700 12px/1.35 system-ui,"Noto Sans Bengali",sans-serif}#chapter-21 .book-home-toplink:focus-visible,#chapter-21 .book-fullscreen-home:focus-visible{outline:3px solid #d0a751;outline-offset:2px}#chapter-21 .book-fullscreen-home{display:none}#chapter-21.book-pdf-fullscreen .book-fullscreen-home{position:fixed!important;bottom:max(18px,env(safe-area-inset-bottom))!important;left:max(15px,env(safe-area-inset-left))!important;z-index:2147483647!important;display:inline-flex!important;align-items:center;gap:6px;background:#175e46;color:white;text-decoration:none;padding:10px 15px;border-radius:999px;box-shadow:0 4px 20px #143b325c;font:750 14px/1.3 system-ui,"Noto Sans Bengali",sans-serif}@media(max-width:470px){#chapter-21 .book-mobile-topbar .book-mobile-title{display:none!important}#chapter-21 .book-home-toplink{font-size:11px;padding:5px 8px}}';
document.head.append(homeCSS);
const homeInFullscreen=document.createElement('a');homeInFullscreen.className='book-fullscreen-home';homeInFullscreen.href='./index.html';homeInFullscreen.textContent='⌂ হোমপেজ';homeInFullscreen.setAttribute('aria-label','পূর্ণস্ক্রিন থেকেও হোমপেজে ফিরে যান');
book.append(homeInFullscreen);

const shade=document.createElement('div');shade.className='book-mobile-shade';layout.insertBefore(shade,toc);
const close=document.createElement('button');close.className='book-mobile-toc-close';close.type='button';close.textContent='✕';toc.insertBefore(close,toc.firstChild);
const menu=header.querySelector('.book-mobile-menu-btn'),fullscreen=header.querySelector('.book-fullscreen-btn'),exit=header.querySelector('.book-exit-fullscreen'),mobileCount=header.querySelector('.book-mobile-number');
function openToc(show){book.classList.toggle('book-mobile-toc-open',!!show);menu.setAttribute('aria-expanded',String(!!show));if(show)toc.querySelector('details')?.setAttribute('open','')}
menu.addEventListener('click',()=>openToc(!book.classList.contains('book-mobile-toc-open')));
close.addEventListener('click',()=>openToc(false));shade.addEventListener('click',()=>openToc(false));
function setOuterPage(n,emit){
 n=clamp(n);const changed=n!==showingPage;showingPage=n;
 const text=bn(n)+' / '+bn(TOTAL);counter.textContent=text;mobileCount.textContent=text;pageInput.value=String(n);
 prev.disabled=n<=1;next.disabled=n>=TOTAL;
 const items=[...toc.querySelectorAll('button[data-book-jump]')];
 for(let i=0;i<items.length;i++){const start=Number(items[i].dataset.bookJump),end=Number(items[i+1]?.dataset.bookJump||TOTAL+1);items[i].classList.toggle('current',n>=start&&n<end)}
 if(emit&&(changed||!hasSavedEvent))window.dispatchEvent(new CustomEvent('ruqyah:book-page-changed',{detail:{page:n}}));
 if(emit)hasSavedEvent=true;
}
function ensureViewer(){if(initialized)return;initialized=true;loadPDF().catch(()=>{})}
function goto(n){n=clamp(n);requestedPage=n;openToc(false);ensureViewer();navigate(n);return n}
pageInput.addEventListener('change',()=>goto(parse(pageInput.value)));
pageInput.addEventListener('keydown',e=>{if(e.key==='Enter'){goto(parse(pageInput.value));pageInput.blur()}});
prev.addEventListener('click',()=>goto(showingPage-1));
next.addEventListener('click',()=>goto(showingPage+1));
for(const item of toc.querySelectorAll('button[data-book-jump]'))item.addEventListener('click',()=>goto(Number(item.dataset.bookJump)));
fullscreen.addEventListener('click',()=>{oldScroll=window.scrollY;book.classList.add('book-pdf-fullscreen');document.body.style.overflow='hidden';ensureViewer()});
function leaveFullscreen(){if(!book.classList.contains('book-pdf-fullscreen'))return;openToc(false);book.classList.remove('book-pdf-fullscreen');document.body.style.overflow='';window.scrollTo({top:oldScroll,behavior:'instant'})}
exit.addEventListener('click',leaveFullscreen);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(book.classList.contains('book-mobile-toc-open'))openToc(false);else leaveFullscreen()}});
window.RuqyahBookGoToPage=n=>{if(!book.classList.contains('active'))chapterLink?.click();setTimeout(()=>goto(n),book.classList.contains('active')?0:90)};
const scanKeys=window.__ruqyahScanKeys||{};
window.addEventListener('ruqyah:ayah-audio-playing',event=>{
 if(!book.classList.contains('active'))return;
 const key=event.detail?.key;if(!/^\d{1,3}:\d{1,3}$/.test(key||''))return;
 const found=scanKeys[key];if(found?.length)goto(found.includes(showingPage)?showingPage:found[0]);
});
setOuterPage(1,false);
chapterLink?.addEventListener('click',()=>setTimeout(()=>{if(book.classList.contains('active'))ensureViewer()},0));
new MutationObserver(()=>{if(book.classList.contains('active'))ensureViewer()}).observe(book,{attributes:true,attributeFilter:['class']});
if(book.classList.contains('active'))queueMicrotask(ensureViewer);


// This is a custom PDF.js CANVAS viewer. There is no native browser PDF iframe.
// It loads the file once; page requests only paint canvases from that document.
const reader=byId('reader');
const container=byId('pages');
const status=byId('status');
const statusTitle=byId('statusTitle');
const statusText=byId('statusText');
const progressBar=byId('progressBar');
const retry=byId('retry');
const badge=byId('pageBadge');
const zoomLabel=byId('zoomLevel');
const offlineBadge=byId('offlineBadge');
const preparedBadge=byId('preparedBadge');
const PDF_CACHE='ruqyah-original-pdf-v1';
const LIB_CACHE='ruqyah-pdfjs-lib-v33';
const PAGES_CACHE='ruqyah-rendered-book-pages-v34';
const PREP_WIDTH=1120;





const scripts=[
  ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'],
  ['https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js']
];
let pdf=null,loadPromise=null,current=1,pendingPage=1,zoom=1,baseW=585,baseH=825,epoch=0,painting=0,raf=0,scrollLock=false;
const rendered=new Map(),waiting=new Set(),queue=[];
const MAX_CONCURRENT=2;
const slots=[];
let liveRenders=new Set();
const stats={pdfDownloads:0,opens:0,navigations:0,painted:0,scriptLoads:0,pdfCacheHits:0,pdfCacheWrites:0,libCacheHits:0,libCacheWrites:0,bitmapHits:0,bitmapWrites:0,backgroundPrepared:0};
let pageCache=null,prepStarted=false,prepStopped=false,prepFailure='';
let lastNavigationAt=0;
const preparedPages=new Set();
window.RuqyahPDFViewerDebug=stats;
function notify(type,data={}){if(type==='page'||type==='navigation')setOuterPage(data.page,true);if(type==='ready')setOuterPage(requestedPage,true);if(type==='error')console.warn('Custom reader:',data.message)}
function setStatus(title,msg,failed=false){status.hidden=false;statusTitle.textContent=title;statusText.textContent=msg;retry.hidden=!failed;progressBar.style.width=failed?'100%':'8%';}
function setPage(n,notifyParent=true){
 n=clamp(n);if(current===n&&badge.textContent===`${bn(n)} / ${bn(TOTAL)}`)return;
 current=n;badge.textContent=`${bn(n)} / ${bn(TOTAL)}`;
 for(const el of container.querySelectorAll('.page.current'))el.classList.remove('current');
 slots[n-1]?.classList.add('current');
 if(notifyParent)notify('page',{page:n});
}
function loadScript(url){return new Promise((resolve,reject)=>{
 const script=document.createElement('script');script.src=url;script.async=true;
 const timer=setTimeout(()=>{script.remove();reject(new Error('PDF.js load timeout'))},13000);
 script.onload=()=>{clearTimeout(timer);stats.scriptLoads++;resolve()};
 script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('PDF.js unavailable'))};
 document.head.append(script);
})}
// A first successful online open caches BOTH the PDF.js runtime and worker.
// On later launches these assets are loaded from CacheStorage, not a CDN.
async function cachedScriptBlob(url){
 let cache=null;
 try{if('caches'in window)cache=await caches.open(LIB_CACHE)}catch(e){console.warn('PDF.js cache unavailable',e)}
 if(cache){
  const saved=await cache.match(url).catch(()=>null);
  if(saved){stats.libCacheHits++;return saved.blob()}
 }
 const response=await fetch(url,{mode:'cors',cache:'default'});
 if(!response.ok)throw new Error('PDF.js asset HTTP '+response.status);
 const blob=await response.blob();
 if(cache)try{
  await cache.put(url,new Response(blob,{headers:{'Content-Type':'text/javascript'}}));
  stats.libCacheWrites++;
 }catch(e){console.warn('PDF.js asset could not be cached',e)}
 return blob;
}
async function getPdfJS(){
 if(window.pdfjsLib)return window.pdfjsLib;
 let error;
 for(const [url,worker] of scripts){
  try{
   const scriptBlob=await cachedScriptBlob(url);
   const scriptURL=URL.createObjectURL(scriptBlob);
   try{await loadScript(scriptURL)}finally{URL.revokeObjectURL(scriptURL)}
   if(window.pdfjsLib){
    // Worker is stored locally too. No CDN fetch on later offline launches.
    let workerBlob;
    try{workerBlob=await cachedScriptBlob(worker)}catch(e){
     for(const [,otherWorker] of scripts)if(otherWorker!==worker){
      try{workerBlob=await cachedScriptBlob(otherWorker);break}catch(_){}
     }
     if(!workerBlob)throw e;
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(workerBlob);
    return window.pdfjsLib;
   }
  }catch(e){error=e;}
 }
 throw error||new Error('PDF.js could not be loaded');
}
async function getPdfBytes(){
 let cache=null;
 try{if('caches'in window)cache=await caches.open(PDF_CACHE)}catch(e){console.warn('PDF offline cache unavailable',e)}
 const isPdf=bytes=>bytes.byteLength>=100000&&
    new TextDecoder().decode(bytes.slice(0,5))==='%PDF-';
 if(cache){
  const stored=await cache.match(pdfUrl).catch(()=>null);
  if(stored){
   const bytes=await stored.arrayBuffer();
   if(isPdf(bytes)){
    stats.pdfCacheHits++;
    offlineBadge.hidden=false;
    offlineBadge.textContent='\u2713 \u0985\u09ab\u09b2\u09be\u0987\u09a8';
    return bytes;
   }
   await cache.delete(pdfUrl).catch(()=>{});
  }
 }
 // First load or a cleared/evicted cache: fetch the original file exactly once.
 const response=await fetch(pdfUrl,{cache:'default'});
 if(!response.ok)throw new Error('PDF HTTP '+response.status);
 const bytes=await response.arrayBuffer();
 if(!isPdf(bytes))throw new Error('Invalid PDF asset');
 stats.pdfDownloads++;
 if(cache){
  try{
   await cache.put(pdfUrl,new Response(bytes.slice(0),{
    headers:{'Content-Type':'application/pdf','Accept-Ranges':'bytes'}}));
   stats.pdfCacheWrites++;
   offlineBadge.hidden=false;
   offlineBadge.textContent='\u2713 \u0985\u09ab\u09b2\u09be\u0987\u09a8';
  }catch(e){
   console.warn('PDF could not be saved offline',e);
   offlineBadge.hidden=false;
   offlineBadge.textContent='\u26a0 \u09b8\u09c7\u09ad \u09b9\u09df\u09a8\u09bf';
  }
 }else{
  offlineBadge.hidden=false;
  offlineBadge.textContent='\u26a0 \u09b8\u09c7\u09ad \u09b9\u09df\u09a8\u09bf';
 }
 return bytes;
}
// In addition to the single saved PDF, keep a locally rendered image of each page.
// This costs device storage, not a network request. Once all pages are prepared,
// TOC jumps also avoid repeating PDF page rasterization.
function pageKey(n){return new URL('./_ruqyah_local_pages_v34_/page-'+clamp(n)+'.webp',document.baseURI).href;}
function showPreparation(){
 preparedBadge.hidden=false;
 preparedBadge.textContent=preparedPages.size===TOTAL?'✓ সব পৃষ্ঠা প্রস্তুত':'পৃষ্ঠা প্রস্তুত '+bn(preparedPages.size)+'/'+bn(TOTAL);
 preparedBadge.title=prepFailure||'একবার তৈরি হওয়া পৃষ্ঠা এই ডিভাইসে সংরক্ষিত; প্রস্তুতি সম্পন্ন হলে সব সূচি দ্রুত খুলবে';
}
async function getPageCache(){
 if(pageCache)return pageCache;
 if(!('caches'in window))return null;
 try{
  const c=await caches.open(PAGES_CACHE);
  pageCache=c;
  for(const req of await c.keys()){
   const m=/\/page-(\d+)\.webp$/.exec(new URL(req.url).pathname);
   if(m&&+m[1]>=1&&+m[1]<=TOTAL)preparedPages.add(+m[1]);
  }
  showPreparation();return c;
 }catch(e){console.warn('Rendered-page cache unavailable',e);return null}
}
function makeBlob(canvas){return new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.77));}
async function storeRendered(n,canvas){
 const c=await getPageCache();
 if(!c||preparedPages.has(n)||prepStopped)return false;
 try{
  let target=canvas;
  if(canvas.width!==PREP_WIDTH){
   const small=document.createElement('canvas');small.width=PREP_WIDTH;
   small.height=Math.round(canvas.height*PREP_WIDTH/canvas.width);
   small.getContext('2d',{alpha:false}).drawImage(canvas,0,0,small.width,small.height);target=small;
  }
  const blob=await makeBlob(target);
  if(target!==canvas){target.width=0;target.height=0}
  if(!blob||blob.size<1000)throw new Error('Could not encode page bitmap');
  await c.put(pageKey(n),new Response(blob,{headers:{'Content-Type':blob.type||'image/webp','Cache-Control':'no-store'}}));
  preparedPages.add(n);stats.bitmapWrites++;showPreparation();return true;
 }catch(e){
  prepStopped=true;prepFailure='পৃষ্ঠা সেভ বন্ধ: স্টোরেজ সীমা বা অনুমতি সমস্যা';
  showPreparation();console.warn('Page bitmap save failed',e);return false;
 }
}
async function restoreRendered(n,atEpoch){
 const c=await getPageCache();
 if(!c||!preparedPages.has(n))return false;
 let link;
 try{
  const r=await c.match(pageKey(n));
  if(!r){preparedPages.delete(n);showPreparation();return false}
  const blob=await r.blob();link=URL.createObjectURL(blob);
  const img=new Image();img.src=link;
  await img.decode();
  if(atEpoch!==epoch||Math.abs(n-current)>5)return true;
  slots[n-1]?.replaceChildren(img);
  slots[n-1]?.classList.add('painted');
  rendered.set(n,img);stats.bitmapHits++;
  return true;
 }catch(e){console.warn('Cached page failed, will render from PDF',n,e);preparedPages.delete(n);showPreparation();return false}
 finally{if(link)URL.revokeObjectURL(link)}
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function prepareEveryPage(){
 if(prepStarted||!pdf)return;prepStarted=true;
 const c=await getPageCache();if(!c)return;
 for(let n=1;n<=TOTAL;n++){
  if(prepStopped)return;
  if(preparedPages.has(n))continue;
  // Background work never delays an active page click or a visible scroll.
  while(document.hidden||painting>0||queue.length>0||waiting.size>0||Date.now()-lastNavigationAt<1000){
   if(prepStopped)return;await sleep(280);
  }
  let canvas;
  try{
   const pg=await pdf.getPage(n);
   const unit=pg.getViewport({scale:1});
   const vp=pg.getViewport({scale:PREP_WIDTH/unit.width});
   canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);
   const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('canvas unavailable');
   await pg.render({canvasContext:ctx,viewport:vp,background:'#fff'}).promise;
   if(!preparedPages.has(n)){
    const ok=await storeRendered(n,canvas);if(ok)stats.backgroundPrepared++;
   }
  }catch(e){console.warn('Background page prepare failed',n,e)}
  finally{if(canvas){canvas.width=0;canvas.height=0}}
  await sleep(50);
 }
 showPreparation();
}
function createSlots(){
 if(slots.length)return;
 const frag=document.createDocumentFragment();
 for(let i=1;i<=TOTAL;i++){
  const e=document.createElement('section');e.className='page';e.dataset.page=String(i);
  e.setAttribute('aria-label','পৃষ্ঠা '+bn(i));e.style.aspectRatio=`${baseW} / ${baseH}`;
  slots.push(e);frag.append(e);
 }
 container.append(frag);
}
function availableWidth(){
 const width=Math.max(220,reader.clientWidth-18);
 return Math.min(1100,width)*zoom;
}
function updateSize(){
 const width=Math.round(availableWidth());
 container.style.setProperty('--page-width',width+'px');
 container.style.minWidth=(width+14)+'px';
 for(const e of slots)e.style.aspectRatio=`${baseW} / ${baseH}`;
}
function getVisiblePage(){
 if(!slots.length)return current;
 const pos=reader.scrollTop+Math.min(reader.clientHeight*.33,150);
 let left=0,right=slots.length-1;
 while(left<right){const mid=(left+right+1)>>1;if(slots[mid].offsetTop<=pos)left=mid;else right=mid-1;}
 return left+1;
}
function destroyFar(center){
 for(const [n,c] of rendered){if(Math.abs(n-center)>3){c.remove();rendered.delete(n);slots[n-1]?.classList.remove('painted')}}
}
function addToQueue(n){
 if(!pdf||n<1||n>TOTAL||rendered.has(n)||waiting.has(n)||queue.includes(n))return;
 queue.push(n);flushQueue();
}
function schedule(n){
 if(!pdf)return;
 // Jumping to a distant page always prioritizes the selected page over old work.
 queue.length=0;
 addToQueue(n);addToQueue(n+1);addToQueue(n-1);addToQueue(n+2);addToQueue(n-2);
 destroyFar(n);
}
function flushQueue(){
 if(!pdf)return;
 while(painting<MAX_CONCURRENT&&queue.length){
  const n=queue.shift();if(rendered.has(n)||waiting.has(n))continue;
  painting++;waiting.add(n);
  const myEpoch=epoch;
  (async()=>{
   if(zoom<=1.3 && await restoreRendered(n,myEpoch))return;
   const page=await pdf.getPage(n);
   if(myEpoch!==epoch)return;
   const cssWidth=availableWidth();
   const ratio=Math.min(1.65,Math.max(1,window.devicePixelRatio||1));
   const vp0=page.getViewport({scale:1});
   const paintWidth=Math.min(1600,Math.max(PREP_WIDTH,cssWidth*ratio));
   const viewport=page.getViewport({scale:paintWidth/vp0.width});
   const canvas=document.createElement('canvas');
   canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   canvas.style.width='100%';canvas.style.height='100%';
   const context=canvas.getContext('2d',{alpha:false});
   if(!context)throw new Error('Canvas unavailable');
   const job=page.render({canvasContext:context,viewport,background:'#fff'});
   liveRenders.add(job);
   try{await job.promise;}finally{liveRenders.delete(job);}
   if(myEpoch!==epoch)return;
   slots[n-1]?.replaceChildren(canvas);slots[n-1]?.classList.add('painted');rendered.set(n,canvas);stats.painted++;
   if(zoom<=1.3&&!preparedPages.has(n))storeRendered(n,canvas).catch(()=>{});
  })().catch(e=>{if(!/cancel/i.test(String(e)))console.warn('PDF page render',n,e)}).finally(()=>{waiting.delete(n);painting--;flushQueue()});
 }
}
function cancelPaints(){
 epoch++;queue.length=0;for(const task of liveRenders){try{task.cancel()}catch(_){}}
 rendered.forEach(canvas=>canvas.remove());rendered.clear();waiting.clear();
 slots.forEach(e=>e.classList.remove('painted'));
}
function navigate(n){
 lastNavigationAt=Date.now();
 n=clamp(n);pendingPage=n;stats.navigations++;
 setPage(n);notify('navigation',{page:n});
 if(!pdf){loadPDF().catch(()=>{});return;}
 scrollLock=true;reader.scrollTo({top:slots[n-1].offsetTop,behavior:'instant'});
 schedule(n);requestAnimationFrame(()=>{scrollLock=false;setPage(n)});
}
function zoomTo(value){
 const next=Math.max(.7,Math.min(2.25,Math.round(value*100)/100));
 if(Math.abs(next-zoom)<.01)return;
 zoom=next;zoomLabel.textContent=Math.round(zoom*100)+'%';
 if(!pdf)return;
 const keep=current;cancelPaints();updateSize();
 requestAnimationFrame(()=>{reader.scrollTop=slots[keep-1].offsetTop;schedule(keep)});
 notify('zoom',{zoom});
}
async function loadPDF(){
 if(pdf)return pdf;
 if(loadPromise)return loadPromise;
 setStatus('PDF রিডার চালু হচ্ছে…','বইটি প্রথমবার একবার ডাউনলোড হবে। এরপর পৃষ্ঠায় যেতে আর রিলোড হবে না।');
 loadPromise=(async()=>{
   const lib=await getPdfJS();
   const bytes=await getPdfBytes();
   progressBar.style.width='70%';
   // Only ONE getDocument call. Never reset src or navigate to pdfUrl#page=N.
   const task=lib.getDocument({data:new Uint8Array(bytes),isEvalSupported:false});
   pdf=await task.promise;stats.opens++;
   if(pdf.numPages!==TOTAL)throw new Error('Expected 272 pages; got '+pdf.numPages);
   const first=await pdf.getPage(1),vp=first.getViewport({scale:1});baseW=vp.width;baseH=vp.height;
   createSlots();updateSize();status.hidden=true;
   await getPageCache();
   // On-demand page caching; avoid heavy background rasterization
   notify('ready',{page:current,pages:TOTAL});
   const initial=pendingPage;navigate(initial);
   return pdf;
 })().catch(e=>{
   console.error('Ruqyah custom PDF renderer:',e);
   pdf=null;
   const details=/404/.test(String(e))?'Vercel-এ assets/ruqyah-book.pdf ফাইলটি পাওয়া যায়নি।':'প্রথমবার PDF.js চালাতে ইন্টারনেট প্রয়োজন। সংযোগ বা Vercel ফাইল যাচাই করুন।';
   setStatus('PDF রিডার চালু হয়নি',details+' '+String(e?.message||e),true);
   notify('error',{message:String(e?.message||e)});
   throw e;
 }).finally(()=>{loadPromise=null});
 return loadPromise;
}
byId('retry').addEventListener('click',()=>loadPDF().catch(()=>{}));
byId('zoomIn').addEventListener('click',()=>zoomTo(zoom+.2));
byId('zoomOut').addEventListener('click',()=>zoomTo(zoom-.2));
reader.addEventListener('scroll',()=>{
 if(raf)return;raf=requestAnimationFrame(()=>{
  raf=0;if(!pdf||scrollLock)return;
  const p=getVisiblePage();if(p!==current)setPage(p);schedule(p);
 });
},{passive:true});
let resizeTimer=0;
const resize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
 if(!pdf)return;const keep=current;cancelPaints();updateSize();
 requestAnimationFrame(()=>{reader.scrollTop=slots[keep-1].offsetTop;schedule(keep)});
},150)};
if('ResizeObserver'in window)new ResizeObserver(resize).observe(reader);
else window.addEventListener('resize',resize,{passive:true});
// Keyboard navigation when directly reading standalone.
reader.addEventListener('keydown',event=>{
 if(event.key==='PageDown'){event.preventDefault();navigate(current+1)}
 if(event.key==='PageUp'){event.preventDefault();navigate(current-1)}
});
// Standalone debug and direct links: /book-reader.html?page=68.
window.RuqyahPDFGoToPage=navigate;
const fromURL=new URL(location.href).searchParams.get('page');
if(fromURL)pendingPage=clamp(fromURL);
notify('boot',{version:'v38-static-canvas',page:pendingPage});
// Lazy-load on chapter 21 activation.

})();

/* Ruqyah v35: native PDF iframe is removed; original PDF renders as Canvas in the same chapter. */
(()=>{'use strict';
const book=document.getElementById('chapter-21');if(!book)return;
const stage=document.getElementById('bookScanStage');
const layout=book.querySelector('.book-scan-layout');
const toc=book.querySelector('.book-toc');
const pageInput=document.getElementById('bookPageInput');
const counter=document.getElementById('bookPageCount');
const prev=document.getElementById('bookPrevPage');
const next=document.getElementById('bookNextPage');
const chapterLink=document.querySelector('.chapter-item[data-target="chapter-21"]');
const fileLink=document.getElementById('bookPdfOpen');
if(!stage||!layout||!toc||!pageInput||!counter||!prev||!next){console.error('v35: missing chapter 21 elements');return;}
stage.querySelector('#bookPdfFrame')?.remove();
stage.querySelector('#bookPdfMessage')?.remove();
stage.querySelector('#bookPdfFallback')?.remove();
for(const link of stage.querySelectorAll('a[href*="ruqyah-book.pdf"]')){link.setAttribute('download','Ruqyah-Abdullah-Al-Mahmud.pdf');link.removeAttribute('target')}
if(fileLink){fileLink.textContent='↓ PDF সেভ করুন';fileLink.href='./assets/ruqyah-book.pdf'}
const marker=document.createElement('span');marker.className='book-reader-version-v35';marker.textContent='নিজস্ব রিডার v35';stage.querySelector('.book-pdf-toolbar')?.insertBefore(marker,fileLink||null);
const canvasRoot=document.createElement('div');canvasRoot.id='ruqyah-canvas-root';
canvasRoot.innerHTML="<div id=\"status\" role=\"status\" aria-live=\"polite\"><div class=\"inner\">\n<strong id=\"statusTitle\">বইয়ের রিডার প্রস্তুত হচ্ছে…</strong><span id=\"statusText\">PDF প্রথমবার সেভ হবে; এরপর পৃষ্ঠা বদলাতে নতুন ডাউনলোড হবে না।</span>\n<div class=\"progress\"><div id=\"progressBar\"></div></div><button id=\"retry\" type=\"button\" hidden>আবার চেষ্টা করুন</button></div></div>\n<div id=\"reader\" role=\"region\" tabindex=\"0\" aria-label=\"মূল বই—নিজস্ব স্ক্রলযোগ্য PDF রিডার\"><div id=\"pages\"></div></div>\n<div id=\"hud\" aria-label=\"পৃষ্ঠার Zoom\"><span class=\"reader-version\">v35</span><span id=\"offlineBadge\" class=\"offline-state\" hidden></span><span id=\"preparedBadge\" class=\"pages-prepared\" hidden></span>\n<span class=\"badge\" id=\"pageBadge\">১ / ২৭২</span><button id=\"zoomOut\" type=\"button\" aria-label=\"ছোট করুন\">−</button><span id=\"zoomLevel\" class=\"pct\">100%</span><button id=\"zoomIn\" type=\"button\" aria-label=\"বড় করুন\">+</button></div>";
stage.append(canvasRoot);
window.RuqyahBookReaderVersion='v35-direct-canvas-no-iframe';
const bengaliDigits='০১২৩৪৫৬৭৮৯';
const bnNum=n=>String(n).replace(/\d/g,c=>bengaliDigits[Number(c)]);
const parseNum=n=>Number(String(n||'').replace(/[০-৯]/g,c=>bengaliDigits.indexOf(c)).replace(/[^0-9]/g,''));
let oldScroll=0,storedPage=1,emitted=false;
const header=document.createElement('div');header.className='book-mobile-topbar';
header.innerHTML='<button type="button" class="book-mobile-menu-btn" aria-label="সূচিপত্র খুলুন" aria-expanded="false">☰</button><span class="book-mobile-title">মূল বই · নিজস্ব রিডার</span><span class="book-mobile-number">১ / ২৭২</span><button type="button" class="book-fullscreen-btn">⛶ বড় করে দেখুন</button><button type="button" class="book-exit-fullscreen">✕ বন্ধ</button>';
layout.insertBefore(header,layout.firstChild);
const shade=document.createElement('div');shade.className='book-mobile-shade';layout.insertBefore(shade,toc);
const close=document.createElement('button');close.className='book-mobile-toc-close';close.type='button';close.textContent='✕';close.setAttribute('aria-label','সূচিপত্র বন্ধ করুন');toc.insertBefore(close,toc.firstChild);
const menu=header.querySelector('.book-mobile-menu-btn'),fullscreen=header.querySelector('.book-fullscreen-btn'),exit=header.querySelector('.book-exit-fullscreen'),mobileCount=header.querySelector('.book-mobile-number');
function openToc(show){book.classList.toggle('book-mobile-toc-open',!!show);menu.setAttribute('aria-expanded',String(!!show));if(show)toc.querySelector('details')?.setAttribute('open','')}
menu.addEventListener('click',()=>openToc(!book.classList.contains('book-mobile-toc-open')));
close.addEventListener('click',()=>openToc(false));shade.addEventListener('click',()=>openToc(false));
function leaveFullscreen(){if(!book.classList.contains('book-pdf-fullscreen'))return;openToc(false);book.classList.remove('book-pdf-fullscreen');document.body.style.overflow='';window.scrollTo({top:oldScroll,behavior:'instant'})}
const tocItems=[...toc.querySelectorAll('button[data-book-jump]')];
function syncToolbarPage(n,emit){
 n=Math.max(1,Math.min(272,Math.floor(Number(n)||1)));
 const changed=n!==storedPage;storedPage=n;
 const label=bnNum(n)+' / '+bnNum(272);
 counter.textContent=label;mobileCount.textContent=label;pageInput.value=String(n);
 prev.disabled=n<=1;next.disabled=n>=272;
 for(let i=0;i<tocItems.length;i++){
 const start=Number(tocItems[i].dataset.bookJump),end=Number(tocItems[i+1]?.dataset.bookJump||273);
 tocItems[i].classList.toggle('current',n>=start&&n<end);
 }
 if(emit&&(changed||!emitted)){emitted=true;window.dispatchEvent(new CustomEvent('ruqyah:book-page-changed',{detail:{page:n}}))}
}
const scanKeys={"1:1":[256],"1:2":[256],"1:3":[256],"1:4":[256],"1:5":[256],"1:6":[256],"1:7":[256],"2:1":[256],"2:2":[256],"2:3":[256],"2:4":[256],"2:5":[256,257],"2:163":[257],"2:164":[257],"2:255":[258],"2:285":[258],"2:286":[258],"3:18":[258],"3:19":[258,259],"7:54":[259],"7:55":[259],"7:56":[259],"7:117":[259],"7:118":[259],"7:119":[259],"7:120":[259],"7:121":[259],"23:115":[260],"23:116":[260],"23:117":[260],"23:118":[260],"37:1":[261],"37:2":[261],"37:3":[261],"37:4":[261],"37:5":[261],"37:6":[261],"37:7":[261,267],"37:8":[261,267],"37:9":[261,267],"37:10":[261,267],"46:29":[261],"46:30":[261],"46:31":[261],"46:32":[261],"55:33":[262],"55:34":[262],"55:35":[262],"55:36":[262],"59:21":[262],"59:22":[262],"59:23":[262],"59:24":[262],"72:1":[262,263],"72:2":[262,263],"72:3":[262,263],"72:4":[262,263],"72:5":[262,263],"72:6":[262,263],"72:7":[262,263],"72:8":[262,263,268],"72:9":[262,263,268],"112:1":[263],"112:2":[263],"112:3":[263],"112:4":[263],"113:1":[263,142],"113:2":[263,142],"113:3":[263,264,142],"113:4":[263,264,142],"113:5":[263,264],"114:1":[264],"114:2":[264],"114:3":[264],"114:4":[264],"114:5":[264],"114:6":[264],"9:14":[264],"10:57":[264],"16:69":[265],"17:82":[265],"41:44":[265],"6:128":[266],"8:50":[266],"14:15":[266],"14:16":[266],"14:17":[266],"14:49":[266],"14:50":[266],"19:4":[266],"19:9":[266],"21:35":[266],"22:19":[267],"22:20":[267],"22:21":[267],"22:22":[267],"29:24":[267],"35:36":[267],"35:37":[267],"44:43":[267],"44:44":[267],"44:45":[267],"44:46":[267],"44:47":[267],"44:48":[267],"44:49":[267],"44:50":[268],"56:51":[268],"56:52":[268],"56:53":[268],"56:54":[268],"56:55":[268],"56:56":[268],"85:10":[268],"92:14":[268],"92:15":[268],"92:16":[268],"101:8":[268],"101:9":[268],"101:10":[268],"101:11":[268],"104:4":[268],"104:5":[268],"104:6":[268],"104:7":[268],"104:8":[268],"104:9":[268],"4:54":[85],"12:67":[85],"18:39":[85],"67:3":[85],"68:51":[85],"26:80":[265,186],"20:69":[260,163],"10:81":[260,163],"10:82":[260,163],"7:122":[259,163]};

// This is a custom PDF.js CANVAS viewer. There is no native browser PDF iframe.
// It loads the file once; page requests only paint canvases from that document.
const reader=canvasRoot.querySelector('#reader');
const container=canvasRoot.querySelector('#pages');
const status=canvasRoot.querySelector('#status');
const statusTitle=canvasRoot.querySelector('#statusTitle');
const statusText=canvasRoot.querySelector('#statusText');
const progressBar=canvasRoot.querySelector('#progressBar');
const retry=canvasRoot.querySelector('#retry');
const badge=canvasRoot.querySelector('#pageBadge');
const zoomLabel=canvasRoot.querySelector('#zoomLevel');
const offlineBadge=canvasRoot.querySelector('#offlineBadge');
const preparedBadge=canvasRoot.querySelector('#preparedBadge');
const PDF_CACHE='ruqyah-original-pdf-v1';
const LIB_CACHE='ruqyah-pdfjs-lib-v33';
const PAGES_CACHE='ruqyah-rendered-book-pages-v34';
const PREP_WIDTH=1120;
const pdfUrl=new URL('./assets/ruqyah-book.pdf',document.baseURI).href;

const TOTAL=272;
const bn=n=>String(n).replace(/\d/g,d=>String.fromCharCode(0x09e6+Number(d)));
const clamp=n=>Math.max(1,Math.min(TOTAL,Math.floor(Number(n)||1)));
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
function notify(type,data={}){if(type==='page'||type==='navigation')syncToolbarPage(data.page,true);if(type==='error')console.warn('Custom reader:',data.message);}
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
   setTimeout(()=>prepareEveryPage().catch(e=>console.warn('Page preparation',e)),1800);
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
canvasRoot.querySelector('#retry').addEventListener('click',()=>loadPDF().catch(()=>{}));
document.getElementById('zoomIn').addEventListener('click',()=>zoomTo(zoom+.2));
document.getElementById('zoomOut').addEventListener('click',()=>zoomTo(zoom-.2));
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
// Navigation happens in this page; no browser PDF iframe is created.
window.RuqyahPDFGoToPage=navigate;
window.RuqyahBookGoToPage=n=>{
 if(!book.classList.contains('active'))chapterLink?.click();
 if(book.classList.contains('active'))navigate(n);else setTimeout(()=>navigate(n),130);
};
chapterLink?.addEventListener('click',()=>setTimeout(()=>{if(book.classList.contains('active'))loadPDF().catch(()=>{})},0));
pageInput.addEventListener('change',()=>navigate(parseNum(pageInput.value)));
pageInput.addEventListener('keydown',e=>{if(e.key==='Enter'){navigate(parseNum(pageInput.value));pageInput.blur()}});
prev.addEventListener('click',()=>navigate(current-1));
next.addEventListener('click',()=>navigate(current+1));
for(const item of toc.querySelectorAll('button[data-book-jump]'))item.addEventListener('click',()=>navigate(Number(item.dataset.bookJump)));
fullscreen.addEventListener('click',()=>{oldScroll=window.scrollY;book.classList.add('book-pdf-fullscreen');document.body.style.overflow='hidden';loadPDF().catch(()=>{})});
exit.addEventListener('click',leaveFullscreen);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(book.classList.contains('book-mobile-toc-open'))openToc(false);else leaveFullscreen()}});
window.addEventListener('ruqyah:ayah-audio-playing',event=>{
 if(!book.classList.contains('active'))return;
 const key=event.detail?.key;if(!/^\d{1,3}:\d{1,3}$/.test(key||''))return;
 const pages=scanKeys[key];if(pages?.length)navigate(pages.includes(current)?current:pages[0]);
});

const fromURL=new URL(location.href).searchParams.get('book_page');
if(fromURL)pendingPage=clamp(fromURL);
notify('boot',{version:'v35-direct-canvas',page:pendingPage});
if(book.classList.contains('active'))loadPDF().catch(()=>{});
})();
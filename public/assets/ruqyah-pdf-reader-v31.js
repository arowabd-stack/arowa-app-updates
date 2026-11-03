/* Ruqyah v32: bridge between the main PWA and standalone canvas PDF viewer. */
(()=>{'use strict';
const book=document.getElementById('chapter-21');if(!book)return;
const layout=book.querySelector('.book-scan-layout');
const toc=book.querySelector('.book-toc');
const reader=document.getElementById('bookScanStage');
const frame=document.getElementById('bookPdfFrame');
const pageInput=document.getElementById('bookPageInput');
const counter=document.getElementById('bookPageCount');
const prev=document.getElementById('bookPrevPage');
const next=document.getElementById('bookNextPage');
const open=document.getElementById('bookPdfOpen');
const chapterLink=document.querySelector('.chapter-item[data-target="chapter-21"]');
const message=document.getElementById('bookPdfMessage');
const TOTAL=272;
const digits='০১২৩৪৫৬৭৮৯';
const bn=n=>String(n).replace(/\d/g,c=>digits[Number(c)]);
const parse=n=>Number(String(n||'').replace(/[০-৯]/g,c=>digits.indexOf(c)).replace(/[^0-9]/g,''));
const clamp=n=>Math.max(1,Math.min(TOTAL,Math.floor(Number(n)||1)));
const viewerUrl=new URL('./book-reader.html',document.baseURI).href;
const pdfUrl=new URL('./assets/ruqyah-book.pdf',document.baseURI).href;
let page=1,request=1,ready=false,loading=false;
let oldScroll=0;
let hasSavedEvent=false;
window.RuqyahBookReaderVersion='v32-custom-canvas';
const header=document.createElement('div');
header.className='book-mobile-topbar';
header.innerHTML='<button type="button" class="book-mobile-menu-btn" aria-label="সূচিপত্র খুলুন" aria-expanded="false">☰</button><span class="book-mobile-title">মূল বই · PDF রিডার</span><span class="book-mobile-number">১ / ২৭২</span><button type="button" class="book-fullscreen-btn">⛶ বড় করে দেখুন</button><button type="button" class="book-exit-fullscreen">✕ বন্ধ</button>';
layout.insertBefore(header,layout.firstChild);
const shade=document.createElement('div');shade.className='book-mobile-shade';layout.insertBefore(shade,toc);
const close=document.createElement('button');close.className='book-mobile-toc-close';close.type='button';close.textContent='✕';close.setAttribute('aria-label','সূচিপত্র বন্ধ করুন');toc.insertBefore(close,toc.firstChild);
const menu=header.querySelector('.book-mobile-menu-btn');
const fullscreen=header.querySelector('.book-fullscreen-btn');
const exit=header.querySelector('.book-exit-fullscreen');
const mobileCount=header.querySelector('.book-mobile-number');
if(message)message.hidden=true;
frame.hidden=false;
// Blank iframe is only a DOM placeholder before the custom HTML canvas viewer is loaded.
frame.removeAttribute('src');
frame.setAttribute('loading','lazy');
frame.setAttribute('title','নিজস্ব PDF Canvas Reader · ২৭২ পৃষ্ঠা');
frame.setAttribute('data-custom-viewer','v32');
function send(type,data={}){
 if(!frame.contentWindow||!loading)return;
 try{frame.contentWindow.postMessage({source:'ruqyah-pwa-parent-v32',type,...data},location.origin==='null'?'*':location.origin)}catch(e){console.warn(e)}
}
function ensureViewer(){
 if(loading)return;
 loading=true;
 // THIS IS THE ONLY ASSIGNMENT OF iframe src in the entire new reader.
 frame.src=viewerUrl;
}
function openToc(show){book.classList.toggle('book-mobile-toc-open',!!show);menu.setAttribute('aria-expanded',String(!!show));if(show)toc.querySelector('details')?.setAttribute('open','')}
menu.addEventListener('click',()=>openToc(!book.classList.contains('book-mobile-toc-open')));
close.addEventListener('click',()=>openToc(false));shade.addEventListener('click',()=>openToc(false));
function setPage(n,emit){
 n=clamp(n);page=n;
 const text=bn(n)+' / '+bn(TOTAL);
 counter.textContent=text;mobileCount.textContent=text;pageInput.value=String(n);
 prev.disabled=n<=1;next.disabled=n>=TOTAL;
 open.href=pdfUrl+'#page='+n+'&view=FitH';
 const tocItems=[...toc.querySelectorAll('button[data-book-jump]')];
 for(let i=0;i<tocItems.length;i++){
  const start=Number(tocItems[i].dataset.bookJump);
  const finish=Number(tocItems[i+1]?.dataset.bookJump||TOTAL+1);
  tocItems[i].classList.toggle('current',n>=start&&n<finish);
 }
 if(emit && (hasSavedEvent||n!==1)){
  window.dispatchEvent(new CustomEvent('ruqyah:book-page-changed',{detail:{page:n}}));
 }
 if(emit)hasSavedEvent=true;
}
function navigate(n){
 n=clamp(n);request=n;setPage(n,true);openToc(false);
 ensureViewer();
 if(ready)send('goto',{page:n});
 return n;
}
window.addEventListener('message',event=>{
 if(event.source!==frame.contentWindow)return;
 if(location.origin!=='null'&&event.origin!==location.origin)return;
 const data=event.data;
 if(!data||data.source!=='ruqyah-custom-pdf-v32')return;
 if(data.type==='ready'){
  ready=true;send('goto',{page:request});
  return;
 }
 if(data.type==='page'){
  // Only act on page notifications from the canvas viewer (not a PDF plugin).
  setPage(data.page,true);
 }
 if(data.type==='error'){
  console.error('Custom PDF reader error:',data.message);
 }
});
frame.addEventListener('load',()=>{if(ready)send('goto',{page:request})});
pageInput.addEventListener('change',()=>navigate(parse(pageInput.value)));
pageInput.addEventListener('keydown',e=>{if(e.key==='Enter'){navigate(parse(pageInput.value));pageInput.blur()}});
prev.addEventListener('click',()=>navigate(page-1));
next.addEventListener('click',()=>navigate(page+1));
for(const item of toc.querySelectorAll('button[data-book-jump]'))item.addEventListener('click',()=>navigate(Number(item.dataset.bookJump)));
fullscreen.addEventListener('click',()=>{oldScroll=window.scrollY;book.classList.add('book-pdf-fullscreen');document.body.style.overflow='hidden';ensureViewer()});
function leaveFullscreen(){
 if(!book.classList.contains('book-pdf-fullscreen'))return;
 openToc(false);book.classList.remove('book-pdf-fullscreen');document.body.style.overflow='';
 window.scrollTo({top:oldScroll,behavior:'instant'});
}
exit.addEventListener('click',leaveFullscreen);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(book.classList.contains('book-mobile-toc-open'))openToc(false);else leaveFullscreen()}});
window.RuqyahBookGoToPage=n=>{
 if(!book.classList.contains('active'))chapterLink?.click();
 setTimeout(()=>navigate(n),book.classList.contains('active')?0:120);
};
const scanKeys={"1:1":[256],"1:2":[256],"1:3":[256],"1:4":[256],"1:5":[256],"1:6":[256],"1:7":[256],"2:1":[256],"2:2":[256],"2:3":[256],"2:4":[256],"2:5":[256,257],"2:163":[257],"2:164":[257],"2:255":[258],"2:285":[258],"2:286":[258],"3:18":[258],"3:19":[258,259],"7:54":[259],"7:55":[259],"7:56":[259],"7:117":[259],"7:118":[259],"7:119":[259],"7:120":[259],"7:121":[259],"23:115":[260],"23:116":[260],"23:117":[260],"23:118":[260],"37:1":[261],"37:2":[261],"37:3":[261],"37:4":[261],"37:5":[261],"37:6":[261],"37:7":[261,267],"37:8":[261,267],"37:9":[261,267],"37:10":[261,267],"46:29":[261],"46:30":[261],"46:31":[261],"46:32":[261],"55:33":[262],"55:34":[262],"55:35":[262],"55:36":[262],"59:21":[262],"59:22":[262],"59:23":[262],"59:24":[262],"72:1":[262,263],"72:2":[262,263],"72:3":[262,263],"72:4":[262,263],"72:5":[262,263],"72:6":[262,263],"72:7":[262,263],"72:8":[262,263,268],"72:9":[262,263,268],"112:1":[263],"112:2":[263],"112:3":[263],"112:4":[263],"113:1":[263,142],"113:2":[263,142],"113:3":[263,264,142],"113:4":[263,264,142],"113:5":[263,264],"114:1":[264],"114:2":[264],"114:3":[264],"114:4":[264],"114:5":[264],"114:6":[264],"9:14":[264],"10:57":[264],"16:69":[265],"17:82":[265],"41:44":[265],"6:128":[266],"8:50":[266],"14:15":[266],"14:16":[266],"14:17":[266],"14:49":[266],"14:50":[266],"19:4":[266],"19:9":[266],"21:35":[266],"22:19":[267],"22:20":[267],"22:21":[267],"22:22":[267],"29:24":[267],"35:36":[267],"35:37":[267],"44:43":[267],"44:44":[267],"44:45":[267],"44:46":[267],"44:47":[267],"44:48":[267],"44:49":[267],"44:50":[268],"56:51":[268],"56:52":[268],"56:53":[268],"56:54":[268],"56:55":[268],"56:56":[268],"85:10":[268],"92:14":[268],"92:15":[268],"92:16":[268],"101:8":[268],"101:9":[268],"101:10":[268],"101:11":[268],"104:4":[268],"104:5":[268],"104:6":[268],"104:7":[268],"104:8":[268],"104:9":[268],"4:54":[85],"12:67":[85],"18:39":[85],"67:3":[85],"68:51":[85],"26:80":[265,186],"20:69":[260,163],"10:81":[260,163],"10:82":[260,163],"7:122":[259,163]};
window.addEventListener('ruqyah:ayah-audio-playing',event=>{
 // Audio in chapters 1-20 MUST NEVER switch to chapter 21.
 if(!book.classList.contains('active'))return;
 const key=event.detail?.key;
 if(!/^\d{1,3}:\d{1,3}$/.test(key||''))return;
 const found=scanKeys[key];
 if(found?.length)navigate(found.includes(page)?page:found[0]);
});
setPage(1,false);
if(book.classList.contains('active'))ensureViewer();
chapterLink?.addEventListener('click',()=>setTimeout(()=>{
 if(book.classList.contains('active'))ensureViewer();
},0));
})();

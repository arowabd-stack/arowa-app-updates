/* Ruqyah v31 - a single loaded PDF with instant in-app page changes. */
(()=>{'use strict';
  const book=document.getElementById('chapter-21');
  if(!book)return;
  const layout=book.querySelector('.book-scan-layout');
  const toc=book.querySelector('.book-toc');
  const reader=document.getElementById('bookScanStage');
  const frame=document.getElementById('bookPdfFrame');
  const pageInput=document.getElementById('bookPageInput');
  const counter=document.getElementById('bookPageCount');
  const prev=document.getElementById('bookPrevPage');
  const next=document.getElementById('bookNextPage');
  const openPDF=document.getElementById('bookPdfOpen');
  const chapterLink=document.querySelector('.chapter-item[data-target="chapter-21"]');
  const messageBox=document.getElementById('bookPdfMessage');
  const messageTitle=document.getElementById('bookPdfMessageTitle');
  const messageText=document.getElementById('bookPdfMessageText');
  const retry=document.getElementById('bookPdfRetryBtn');
  const pdfURL=new URL('./assets/ruqyah-book.pdf',document.baseURI).href;
  const total=272;
  const bn=n=>String(n).replace(/[0-9]/g,d=>String.fromCharCode(0x09e6+Number(d)));
  const clamp=n=>Math.max(1,Math.min(total,Math.floor(Number(n)||1)));
  const pdfjsCdn=[
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
  ];
  const pdfjsWorkers=[
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
  ];

  let current=1;
  let pdfDocument=null;
  let openPromise=null;
  let previousWindowScroll=0;
  let bookWidth=580,bookHeight=815;
  let zoom=1;
  let paintVersion=0;
  let previousUserPage=1;
  let scrollFrame=0;
  let scrollingFromNavigation=false;
  const pendingRenders=new Map();
  const rendered=new Map();
  const queue=[];
  let painting=0;
  const MAX_PAINTING=2;

  const scroll=document.createElement('div');
  scroll.id='bookPdfCanvasScroll';scroll.className='book-pdf-canvas-scroll';
  scroll.setAttribute('role','region');
  scroll.setAttribute('aria-label','মূল ২৭২ পৃষ্ঠার PDF বই, আঙুল বা মাউস দিয়ে স্ক্রল করুন');
  scroll.hidden=true;
  const pages=document.createElement('div');pages.className='book-pdf-pages';
  scroll.appendChild(pages);
  reader.insertBefore(scroll,frame);
  frame.hidden=true;
  frame.setAttribute('src','about:blank');

  const zoomControls=document.createElement('div');zoomControls.className='pdfjs-zoom-controls';
  zoomControls.innerHTML='<button type="button" class="pdfjs-zoom-out" title="ছোট করুন" aria-label="বই ছোট করুন">−</button><span class="pdfjs-zoom-label" aria-live="polite">১০০%</span><button type="button" class="pdfjs-zoom-in" title="বড় করুন" aria-label="বই বড় করুন">+</button>';
  reader.querySelector('.book-pdf-toolbar').insertBefore(zoomControls,openPDF);
  const zoomLabel=zoomControls.querySelector('.pdfjs-zoom-label');

  // Mobile toolbar lives inside chapter 21, as in previous versions.
  const header=document.createElement('div');header.className='book-mobile-topbar';
  header.innerHTML='<button type="button" class="book-mobile-menu-btn" aria-label="সূচিপত্র খুলুন" aria-expanded="false">☰</button><span class="book-mobile-title">রুকইয়াহ · মূল PDF</span><span class="book-mobile-number">১ / ২৭২</span><button type="button" class="book-fullscreen-btn">⛶ বড় করে দেখুন</button><button type="button" class="book-exit-fullscreen">✕ বন্ধ</button>';
  layout.insertBefore(header,layout.firstChild);
  const shade=document.createElement('div');shade.className='book-mobile-shade';layout.insertBefore(shade,toc);
  const close=document.createElement('button');close.type='button';close.className='book-mobile-toc-close';close.textContent='✕';close.setAttribute('aria-label','সূচিপত্র বন্ধ');toc.insertBefore(close,toc.firstChild);
  const menu=header.querySelector('.book-mobile-menu-btn');
  const fullscreen=header.querySelector('.book-fullscreen-btn');
  const exitBtn=header.querySelector('.book-exit-fullscreen');
  const mobilePage=header.querySelector('.book-mobile-number');

  function openToc(show){
    book.classList.toggle('book-mobile-toc-open',!!show);
    menu.setAttribute('aria-expanded',String(!!show));
    if(show)toc.querySelector('details')?.setAttribute('open','');
  }
  menu.addEventListener('click',()=>openToc(!book.classList.contains('book-mobile-toc-open')));
  close.addEventListener('click',()=>openToc(false));shade.addEventListener('click',()=>openToc(false));

  function showMessage(title,text,failed=false){
    messageBox.hidden=false;messageTitle.textContent=title;messageText.textContent=text;
    retry.hidden=!failed;scroll.hidden=true;frame.hidden=true;
  }
  function dismissMessage(){messageBox.hidden=true;scroll.hidden=false;frame.hidden=true;}

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const el=document.createElement('script');el.src=src;el.async=true;
      const time=setTimeout(()=>{el.remove();reject(new Error('Library load timeout'));},15000);
      el.onload=()=>{clearTimeout(time);resolve();};
      el.onerror=()=>{clearTimeout(time);el.remove();reject(new Error('Library unavailable: '+src));};
      document.head.appendChild(el);
    });
  }
  async function getPdfJs(){
    if(window.pdfjsLib)return window.pdfjsLib;
    for(let i=0;i<pdfjsCdn.length;i++){
      try{
        await loadScript(pdfjsCdn[i]);
        if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc=pdfjsWorkers[i];return window.pdfjsLib;}
      }catch(e){console.warn('Trying alternative PDF.js source',e);}
    }
    throw new Error('PDF.js library unavailable');
  }

  function setPage(n,fireEvent){
    n=clamp(n);
    current=n;
    const text=bn(n)+' / '+bn(total);
    counter.textContent=text;mobilePage.textContent=text;
    pageInput.value=String(n);
    prev.disabled=n<=1;next.disabled=n>=total;
    openPDF.href=pdfURL+'#page='+n+'&view=FitH';
    const items=Array.from(toc.querySelectorAll('button[data-book-jump]'));
    for(let i=0;i<items.length;i++){
      const v=Number(items[i].dataset.bookJump);
      const following=Number(items[i+1]?.dataset.bookJump||total+1);
      items[i].classList.toggle('current',n>=v&&n<following);
    }
    pages.querySelectorAll('.pdfjs-page-slot.is-active').forEach(e=>e.classList.remove('is-active'));
    pages.children[n-1]?.classList.add('is-active');
    if(fireEvent&&previousUserPage!==n){
      previousUserPage=n;
      window.dispatchEvent(new CustomEvent('ruqyah:book-page-changed',{detail:{page:n}}));
    }
  }

  function createPageSlots(){
    if(pages.children.length)return;
    const fragment=document.createDocumentFragment();
    for(let i=1;i<=total;i++){
      const article=document.createElement('article');
      article.className='pdfjs-page-slot';article.dataset.pdfPage=String(i);
      article.setAttribute('aria-label','পৃষ্ঠা '+bn(i));
      article.innerHTML='<div class="pdfjs-loading-page">পৃষ্ঠা '+bn(i)+'</div>';
      fragment.appendChild(article);
    }
    pages.appendChild(fragment);
    setPage(current,false);
  }
  function pageWidth(){
    const inner=Math.max(250,scroll.clientWidth-22);
    return Math.min(1120,inner)*zoom;
  }
  function sizeSlots(){
    const width=pageWidth();
    pages.style.setProperty('--pdf-page-width',Math.round(width)+'px');
    pages.querySelectorAll('.pdfjs-page-slot').forEach(el=>{
      el.style.aspectRatio=bookWidth+' / '+bookHeight;
    });
  }
  function closestPage(){
    if(!pages.children.length)return current;
    // Binary search in 272 fixed-aspect page placeholders.
    const pos=scroll.scrollTop+Math.min(140,scroll.clientHeight*.35);
    let left=0,right=total-1;
    while(left<right){
      const mid=(left+right+1)>>1;
      if(pages.children[mid].offsetTop<=pos)left=mid;else right=mid-1;
    }
    return left+1;
  }
  function navigate(n){
    n=clamp(n);setPage(n,true);openToc(false);
    if(!pdfDocument){ensurePdf().catch(()=>{});return n;}
    const target=pages.children[n-1];if(!target)return n;
    scrollingFromNavigation=true;
    scroll.scrollTo({top:target.offsetTop,behavior:'instant'});
    requestAnimationFrame(()=>{scrollingFromNavigation=false;setPage(n,false);scheduleAround(n);});
    scheduleAround(n);
    return n;
  }
  function clearPaints(){
    paintVersion++;
    queue.length=0;
    rendered.clear();
    pendingRenders.clear();
    for(const slot of pages.children){
      slot.querySelector('canvas')?.remove();
      slot.classList.remove('is-rendered');
    }
  }
  function trimPaints(center){
    // Keep only nearby canvases in memory. The original PDF stays loaded.
    for(const [n,canvas] of rendered){
      if(Math.abs(n-center)>4){
        canvas.remove();pages.children[n-1]?.classList.remove('is-rendered');rendered.delete(n);
      }
    }
  }
  function enqueue(n){
    if(!pdfDocument||n<1||n>total||rendered.has(n)||pendingRenders.has(n)||queue.some(j=>j.n===n))return;
    queue.push({n,v:paintVersion});processQueue();
  }
  function scheduleAround(n){
    if(!pdfDocument)return;
    // Render visible page first, then two adjacent pages for seamless scrolling.
    enqueue(n);enqueue(n+1);enqueue(n-1);enqueue(n+2);enqueue(n-2);
    trimPaints(n);
  }
  async function processQueue(){
    if(!pdfDocument)return;
    while(painting<MAX_PAINTING&&queue.length){
      const job=queue.shift();if(job.v!==paintVersion||rendered.has(job.n)||pendingRenders.has(job.n))continue;
      painting++;
      const promise=(async()=>{
        const slot=pages.children[job.n-1];if(!slot)return;
        const page=await pdfDocument.getPage(job.n);
        if(job.v!==paintVersion)return;
        const cssWidth=pageWidth();
        const dpr=Math.min(window.devicePixelRatio||1,1.55);
        const scale=(cssWidth/page.view[2])*dpr;
        const viewport=page.getViewport({scale});
        const canvas=document.createElement('canvas');
        canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
        canvas.style.width='100%';canvas.style.height='100%';
        const context=canvas.getContext('2d',{alpha:false});
        await page.render({canvasContext:context,viewport,background:'#ffffff'}).promise;
        if(job.v!==paintVersion)return;
        slot.appendChild(canvas);slot.classList.add('is-rendered');rendered.set(job.n,canvas);
      })().catch(error=>{console.error('PDF page render error:',job.n,error);}).finally(()=>{
        pendingRenders.delete(job.n);painting--;processQueue();
      });
      pendingRenders.set(job.n,promise);
    }
  }

  // Critical difference from v30: getDocument is called once and the PDF
  // iframe src is NEVER changed when the reader navigates to another page.
  async function ensurePdf(){
    if(pdfDocument){dismissMessage();return pdfDocument;}
    if(openPromise)return openPromise;
    showMessage('মূল PDF লোড হচ্ছে…','একবার লোড হলে সূচি ও পৃষ্ঠা-বোতামে দ্রুত যাওয়া যাবে।');
    openPromise=(async()=>{
      const lib=await getPdfJs();
      let response=await fetch(pdfURL,{cache:'default'});
      if(!response.ok)throw new Error('HTTP '+response.status+' '+response.statusText);
      const bytes=await response.arrayBuffer();
      if(bytes.byteLength<100000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('PDF file missing or invalid');
      // One transfer into pdf.js: subsequent page renders use the same document.
      const task=lib.getDocument({data:new Uint8Array(bytes),disableAutoFetch:true,isEvalSupported:false});
      pdfDocument=await task.promise;
      if(pdfDocument.numPages!==total)console.warn('Expected 272 PDF pages, got',pdfDocument.numPages);
      const p1=await pdfDocument.getPage(1);
      const vp=p1.getViewport({scale:1});bookWidth=vp.width;bookHeight=vp.height;
      createPageSlots();sizeSlots();dismissMessage();
      requestAnimationFrame(()=>navigate(current));
      return pdfDocument;
    })().catch(error=>{
      console.error('Ruqyah PDF.js reader failed',error);
      const notFound=/HTTP 404/.test(String(error));
      const title=notFound?'মূল PDF পাওয়া যায়নি':'PDF রিডার খুলতে সমস্যা হয়েছে';
      const description=notFound?
        'Vercel-এর public/assets/ruqyah-book.pdf ফাইলটি Deploy হয়েছে কি না দেখুন।':
        'প্রথমবার PDF রিডার চালাতে ইন্টারনেট প্রয়োজন হতে পারে। PDF খুলুন দিয়ে মূল বই আলাদা পড়তে পারবেন।';
      showMessage(title,description,true);
      pdfDocument=null;throw error;
    }).finally(()=>{openPromise=null;});
    return openPromise;
  }
  retry?.addEventListener('click',()=>ensurePdf().catch(()=>{}));
  function showChapter(){ensurePdf().catch(()=>{});}
  pageInput.addEventListener('change',()=>navigate(pageInput.value));
  pageInput.addEventListener('keydown',e=>{if(e.key==='Enter'){navigate(pageInput.value);pageInput.blur();}});
  prev.addEventListener('click',()=>navigate(current-1));
  next.addEventListener('click',()=>navigate(current+1));
  for(const b of toc.querySelectorAll('button[data-book-jump]'))b.addEventListener('click',()=>navigate(b.dataset.bookJump));
  scroll.addEventListener('scroll',()=>{
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;if(scrollingFromNavigation||!pdfDocument||!book.classList.contains('active'))return;
      const p=closestPage();setPage(p,true);scheduleAround(p);
    });
  },{passive:true});
  const onResize=()=>{
    if(!pdfDocument||!book.classList.contains('active'))return;
    const keep=current;clearPaints();sizeSlots();requestAnimationFrame(()=>navigate(keep));
  };
  let resizeTimer=0;
  const observer=typeof ResizeObserver==='function'?
    new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(onResize,160);}):null;
  observer?.observe(scroll);
  window.addEventListener('resize',()=>{
    if(observer)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(onResize,160);
  });
  function setZoom(nextZoom){
    const next=Math.max(0.75,Math.min(2,Math.round(nextZoom*100)/100));
    if(zoom===next)return;
    const keep=current;zoom=next;zoomLabel.textContent=Math.round(zoom*100)+'%';
    if(pdfDocument){clearPaints();sizeSlots();requestAnimationFrame(()=>navigate(keep));}
  }
  zoomControls.querySelector('.pdfjs-zoom-out').addEventListener('click',()=>setZoom(zoom-.2));
  zoomControls.querySelector('.pdfjs-zoom-in').addEventListener('click',()=>setZoom(zoom+.2));

  fullscreen.addEventListener('click',()=>{
    previousWindowScroll=window.scrollY;
    book.classList.add('book-pdf-fullscreen');document.body.style.overflow='hidden';
    requestAnimationFrame(()=>onResize());
  });
  function leaveFullscreen(){
    if(!book.classList.contains('book-pdf-fullscreen'))return;
    openToc(false);book.classList.remove('book-pdf-fullscreen');document.body.style.overflow='';
    window.scrollTo({top:previousWindowScroll,behavior:'instant'});
    setTimeout(onResize,80);
  }
  exitBtn.addEventListener('click',leaveFullscreen);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(book.classList.contains('book-mobile-toc-open'))openToc(false);
      else leaveFullscreen();
    }
  });
  window.RuqyahBookGoToPage=n=>{
    const already=book.classList.contains('active');
    if(!already)chapterLink?.click();
    setTimeout(()=>navigate(n),already?0:100);
  };
  // Preserve the v29 protection: audio in chapters 1-20 never opens chapter 21.
  const scanKeys={"1:1":[256],"1:2":[256],"1:3":[256],"1:4":[256],"1:5":[256],"1:6":[256],"1:7":[256],"2:1":[256],"2:2":[256],"2:3":[256],"2:4":[256],"2:5":[256,257],"2:163":[257],"2:164":[257],"2:255":[258],"2:285":[258],"2:286":[258],"3:18":[258],"3:19":[258,259],"7:54":[259],"7:55":[259],"7:56":[259],"7:117":[259],"7:118":[259],"7:119":[259],"7:120":[259],"7:121":[259],"23:115":[260],"23:116":[260],"23:117":[260],"23:118":[260],"37:1":[261],"37:2":[261],"37:3":[261],"37:4":[261],"37:5":[261],"37:6":[261],"37:7":[261,267],"37:8":[261,267],"37:9":[261,267],"37:10":[261,267],"46:29":[261],"46:30":[261],"46:31":[261],"46:32":[261],"55:33":[262],"55:34":[262],"55:35":[262],"55:36":[262],"59:21":[262],"59:22":[262],"59:23":[262],"59:24":[262],"72:1":[262,263],"72:2":[262,263],"72:3":[262,263],"72:4":[262,263],"72:5":[262,263],"72:6":[262,263],"72:7":[262,263],"72:8":[262,263,268],"72:9":[262,263,268],"112:1":[263],"112:2":[263],"112:3":[263],"112:4":[263],"113:1":[263,142],"113:2":[263,142],"113:3":[263,264,142],"113:4":[263,264,142],"113:5":[263,264],"114:1":[264],"114:2":[264],"114:3":[264],"114:4":[264],"114:5":[264],"114:6":[264],"9:14":[264],"10:57":[264],"16:69":[265],"17:82":[265],"41:44":[265],"6:128":[266],"8:50":[266],"14:15":[266],"14:16":[266],"14:17":[266],"14:49":[266],"14:50":[266],"19:4":[266],"19:9":[266],"21:35":[266],"22:19":[267],"22:20":[267],"22:21":[267],"22:22":[267],"29:24":[267],"35:36":[267],"35:37":[267],"44:43":[267],"44:44":[267],"44:45":[267],"44:46":[267],"44:47":[267],"44:48":[267],"44:49":[267],"44:50":[268],"56:51":[268],"56:52":[268],"56:53":[268],"56:54":[268],"56:55":[268],"56:56":[268],"85:10":[268],"92:14":[268],"92:15":[268],"92:16":[268],"101:8":[268],"101:9":[268],"101:10":[268],"101:11":[268],"104:4":[268],"104:5":[268],"104:6":[268],"104:7":[268],"104:8":[268],"104:9":[268],"4:54":[85],"12:67":[85],"18:39":[85],"67:3":[85],"68:51":[85],"26:80":[265,186],"20:69":[260,163],"10:81":[260,163],"10:82":[260,163],"7:122":[259,163]};
  window.addEventListener('ruqyah:ayah-audio-playing',event=>{
    if(!book.classList.contains('active'))return;
    const key=event.detail?.key;
    if(!/^\d{1,3}:\d{1,3}$/.test(key||''))return;
    const matched=scanKeys[key];
    if(matched?.length)navigate(matched.includes(current)?current:matched[0]);
  });
  setPage(1,false);
  if(book.classList.contains('active'))showChapter();
  chapterLink?.addEventListener('click',()=>setTimeout(()=>{
    if(book.classList.contains('active'))showChapter();
  },0));
})();

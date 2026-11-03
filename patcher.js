/* Offline, browser-only v30/v29 -> v31 patcher. Does not upload user files. */
(function(){
  'use strict';
  const OLD_SCRIPT = /<script\s+id=["']ruqyah-v28-pdf-navigation["']>[^]*?<\/script>/i;
  const NEW_SCRIPT = '<script id="ruqyah-v31-instant-pdf" src="./assets/ruqyah-pdf-reader-v31.js"></script>';
  const STYLE_LINK = '<link rel="stylesheet" href="./assets/ruqyah-pdf-reader-v31.css">';
  function patchRuqyahIndex(source) {
    if (!source.includes('id="chapter-21"'))
      throw new Error('এটি রুকইয়াহ রিডারের index.html নয়, অথবা অধ্যায় ২১ নেই।');
    const alreadyNew = source.includes('id="ruqyah-v31-instant-pdf"');
    if(!alreadyNew && !OLD_SCRIPT.test(source))
      throw new Error('v30-এর PDF navigation script পাওয়া যায়নি। v30/v29-এর আসল public/index.html বেছে নাও।');
    let text = alreadyNew ? source : source.replace(OLD_SCRIPT,NEW_SCRIPT);
    if(!text.includes('ruqyah-pdf-reader-v31.css')){
      if(!text.includes('</head>')) throw new Error('</head> পাওয়া যায়নি।');
      text=text.replace('</head>',STYLE_LINK+'\n</head>');
    }
    return {text,wasNew:alreadyNew};
  }
  if(typeof module!=='undefined'&&module.exports) module.exports={patchRuqyahIndex};
  if(typeof document==='undefined') return;
  const fileInput=document.getElementById('sourceIndex');
  const start=document.getElementById('makeIndex');
  const status=document.getElementById('patchStatus');
  const download=document.getElementById('saveIndex');
  let lastUrl=null;
  fileInput.addEventListener('change',()=>{
    start.disabled=!fileInput.files?.length;
    status.textContent=fileInput.files?.length ? 'ফাইলটি প্রস্তুত। এখন নতুন index.html তৈরি করো।' : 'ফাইল নির্বাচন করো।';
  });
  start.addEventListener('click',async()=>{
    try {
      if(!fileInput.files?.[0]) throw new Error('আগের public/index.html ফাইলটি নির্বাচন করো।');
      start.disabled=true;status.textContent='HTML আপডেট হচ্ছে…';
      const source=await fileInput.files[0].text();
      const result=patchRuqyahIndex(source);
      if(lastUrl)URL.revokeObjectURL(lastUrl);
      lastUrl=URL.createObjectURL(new Blob([result.text],{type:'text/html;charset=utf-8'}));
      download.href=lastUrl;
      download.download='index.html';
      download.hidden=false;
      status.textContent=result.wasNew?'এটি আগেই v31 ছিল। একই ফাইল আবার সংরক্ষণ করতে পারো।':'সফল! এখন নিচের বোতামে ক্লিক করে নতুন index.html নাও।';
    }catch(e){
      download.hidden=true;
      status.textContent='সমস্যা: '+e.message;
    }finally{start.disabled=!fileInput.files?.length;}
  });
})();

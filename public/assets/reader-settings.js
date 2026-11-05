(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const icon=name=>`<i class="hgi hgi-${name}" aria-hidden="true"></i>`;
 const topbar=document.querySelector('.topbar');
 if(!topbar)return;
 const dialog=document.createElement('dialog');
 dialog.id='readingSettings';dialog.className='reading-settings';dialog.setAttribute('aria-labelledby','readingSettingsTitle');
 dialog.innerHTML=`<div class="settings-heading"><div><span class="eyebrow">আপনার মতো করে পড়ুন</span><h2 id="readingSettingsTitle">পড়ার সেটিংস</h2></div><button type="button" class="icon-button" aria-label="সেটিংস বন্ধ করুন">${icon('cancel-01')}</button></div><div class="settings-content"></div>`;
 document.body.append(dialog);
 const content=dialog.querySelector('.settings-content');
 function block(title,node){
  if(!node)return;
  const section=document.createElement('section');section.className='settings-block';
  const h=document.createElement('h3');h.textContent=title;section.append(h,node);content.append(section);
 }
 block('পাঠের ধরন',document.querySelector('.reading-switcher'));
 block('আরবি ফন্ট',document.querySelector('.font-switcher'));
 const sizes=document.createElement('div');sizes.className='settings-font-size';
 sizes.innerHTML='<button type="button" class="button" id="settingsFontMinus" aria-label="আরবি লেখা ছোট করুন">A−</button><span>আরবি লেখার আকার</span><button type="button" class="button" id="settingsFontPlus" aria-label="আরবি লেখা বড় করুন">A+</button>';
 block('লেখার আকার',sizes);
 $('settingsFontMinus').addEventListener('click',()=>$('dockFontMinus')?.click());
 $('settingsFontPlus').addEventListener('click',()=>$('dockFontPlus')?.click());
 block('তাজবিদ',document.getElementById('tajweedControls'));
 const appearance=document.createElement('button');appearance.type='button';appearance.className='button settings-theme';
 const themeButton=document.querySelector('.site-header .theme-toggle');
 const syncTheme=()=>{const dark=document.documentElement.dataset.theme==='dark';appearance.innerHTML=icon(dark?'sun-01':'moon')+(dark?'দিনের থিম ব্যবহার করুন':'রাতের থিম ব্যবহার করুন')};
 appearance.addEventListener('click',()=>themeButton?.click());
 new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});syncTheme();
 block('পড়ার পরিবেশ',appearance);
 const open=document.createElement('button');open.type='button';open.id='readingSettingsOpen';open.className='reader-settings-open';open.setAttribute('aria-controls',dialog.id);open.setAttribute('aria-haspopup','dialog');open.setAttribute('aria-expanded','false');open.innerHTML=icon('settings-01')+'<span>পড়ার সেটিংস</span>';topbar.append(open);
 open.addEventListener('click',()=>{dialog.showModal();open.setAttribute('aria-expanded','true')});
 dialog.querySelector('.settings-heading button').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close()}});
 dialog.addEventListener('close',()=>{open.setAttribute('aria-expanded','false');open.focus({preventScroll:true})});
 const audio=$('readerAudio'),play=$('dockPlay');
 function audioState(){if(!audio||!play)return;const playing=!audio.paused&&!audio.ended;play.innerHTML=icon(playing?'pause':'headphones')+`<span>${playing?'বিরতি':'শুনুন'}</span>`;play.setAttribute('aria-label',playing?'অডিও থামান':'নির্বাচিত আয়াত শুনুন');play.setAttribute('aria-pressed',String(playing))}
 if(play&&audio)play.addEventListener('click',e=>{if(!audio.paused){e.preventDefault();e.stopImmediatePropagation();audio.pause()}},true);
 if(audio){for(const e of ['play','pause','ended','loadedmetadata'])audio.addEventListener(e,audioState)}audioState();
 for(const id of ['readerInfoClose','playerClose']){const button=$(id);if(button)button.innerHTML=icon('cancel-01')}
 // A closed drawer must not add invisible controls to the tab order.
 document.querySelectorAll('.copy-entry').forEach(b=>b.innerHTML=icon('copy-01'));
 document.querySelectorAll('.bookmark-entry').forEach(b=>{const sync=()=>{const saved=b.getAttribute('aria-pressed')==='true';b.innerHTML=icon('bookmark-01');b.setAttribute('aria-label',saved?'বুকমার্ক সরান':'বুকমার্ক করুন')};sync();b.addEventListener('click',()=>setTimeout(sync,0))});
 const info=$('readerInfoPanel');
 if(info){const sync=()=>{info.inert=!info.classList.contains('open')};sync();new MutationObserver(sync).observe(info,{attributes:true,attributeFilter:['class']})}
 const bn=s=>s.replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
 document.querySelectorAll('.ch-num,.ch-pages,.ch-meta-pages,.chapter-hero .hero-kicker').forEach(el=>{el.textContent=bn(el.textContent);if(el.classList.contains('hero-kicker'))el.textContent=el.textContent.replace(/\/\s*২০$/, '/ ২১')});
})();

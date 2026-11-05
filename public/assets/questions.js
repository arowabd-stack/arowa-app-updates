(()=>{
 'use strict';
 const input=document.getElementById('questionSearch');
 let items=[...document.querySelectorAll('.question')];
 const groups=[...document.querySelectorAll('.group')];
 const count=document.getElementById('questionsCount');
 function decorate(){items=[...document.querySelectorAll('.question')];items.forEach(item=>{const summary=item.querySelector('summary');if(!summary||summary.querySelector('.question-chevron'))return;const icon=document.createElement('i');icon.className='hgi hgi-arrow-right-01 question-chevron';icon.setAttribute('aria-hidden','true');summary.append(icon)})}
 decorate();
 const categoryLinks=[...document.querySelectorAll('.category-nav a')];
 const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
 const normalize=s=>s.normalize('NFC').toLocaleLowerCase().replace(/[য়য়]/g,'য়').replace(/\s+/g,' ').trim();
 const clear=document.createElement('button');clear.type='button';clear.className='question-clear';clear.hidden=true;clear.innerHTML='<i class="hgi hgi-cancel-01" aria-hidden="true"></i>';clear.setAttribute('aria-label','প্রশ্নের অনুসন্ধান মুছুন');input.parentElement.append(clear);
 function filter(){
  items=[...document.querySelectorAll('.question')];const q=normalize(input.value);let hits=0;
  for(const item of items){const haystack=item.querySelector('summary').textContent+' '+(item.querySelector('.current-answer')?.textContent||'');const yes=!q||normalize(haystack).includes(q);item.hidden=!yes;if(yes)hits++}
  groups.forEach(g=>{g.hidden=!!q&&![...g.querySelectorAll('.question')].some(x=>!x.hidden)});
  document.getElementById('noResults').hidden=hits!==0;
  count.textContent=bn(hits)+'টি প্রশ্ন'+(q?' পাওয়া গেছে':' · ১০টি বিভাগ');clear.hidden=!q;
 }
 input.addEventListener('input',filter);
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';filter()}});
 clear.addEventListener('click',()=>{input.value='';filter();input.focus()});
 document.getElementById('enableEditing').addEventListener('click',e=>{const enabled=document.body.classList.toggle('editor-mode');e.currentTarget.setAttribute('aria-pressed',String(enabled));e.currentTarget.textContent=enabled?'সম্পাদনা বন্ধ করুন':'সম্পাদনা চালু করুন'});
 document.querySelectorAll('.group h3 span').forEach(e=>e.textContent=bn(e.textContent));
 categoryLinks.forEach(link=>{link.textContent=bn(link.textContent);link.addEventListener('click',()=>{input.value='';filter();categoryLinks.forEach(x=>x.removeAttribute('aria-current'));link.setAttribute('aria-current','location')})});
 let scrollTick=false;
 function syncCategory(){
  scrollTick=false;const visible=groups.filter(g=>!g.hidden),marker=(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'))||82)+90;
  let active=visible.find(g=>{const r=g.getBoundingClientRect();return r.top<=marker&&r.bottom>marker})||visible.find(g=>g.getBoundingClientRect().top>marker);
  if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-10)active=visible.at(-1);
  if(!active)return;categoryLinks.forEach(a=>{if(a.hash==='#'+active.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 }
 window.addEventListener('scroll',()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(syncCategory)}},{passive:true});
 window.addEventListener('resize',syncCategory);syncCategory();
 function reveal(){const el=document.getElementById(location.hash.slice(1));if(el?.classList.contains('question')){input.value='';filter();el.open=true;el.scrollIntoView({block:'start'})}}
 window.addEventListener('hashchange',reveal);
 document.addEventListener('hijama:reader-questions-updated',()=>{decorate();filter();reveal();syncCategory()});
 reveal();
})();

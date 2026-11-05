(()=>{'use strict';
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const safe=s=>{const d=document.createElement('span');d.textContent=s;return d};
document.querySelectorAll('details.question[id^="q"]').forEach(question=>{
 const n=Number(question.id.slice(1));if(n<1||n>84)return;
 const panel=question.querySelector('.answer');if(!panel)return;
 const wrap=document.createElement('section');wrap.className='community-answers';wrap.setAttribute('aria-label','পাঠকদের উত্তর');
 const title=document.createElement('h4');title.textContent='পাঠকদের উত্তর';
 const note=document.createElement('p');note.className='community-disclaimer';note.textContent='এগুলো পাঠকদের নিজস্ব বক্তব্য, যাচাইকৃত চিকিৎসা বা ধর্মীয় পরামর্শ নয়।';
 const posts=document.createElement('div');posts.className='community-posts';posts.setAttribute('aria-live','polite');
 const status=document.createElement('p');status.className='community-status';status.setAttribute('role','status');
 const form=document.createElement('form');form.className='community-form';
 const heading=document.createElement('h5');heading.textContent='আপনার উত্তর যোগ করুন';
 const nameLabel=document.createElement('label');nameLabel.textContent='আপনার নাম';const name=document.createElement('input');name.type='text';name.maxLength=70;name.minLength=2;name.required=true;name.placeholder='আপনার নাম লিখুন';name.autocomplete='name';nameLabel.append(name);
 const answerLabel=document.createElement('label');answerLabel.textContent='আপনার উত্তর';const answer=document.createElement('textarea');answer.minLength=12;answer.maxLength=1500;answer.required=true;answer.rows=3;answer.placeholder='এখানে আপনার মতামত বা উত্তর লিখুন…';answerLabel.append(answer);
 const trap=document.createElement('input');trap.type='text';trap.name='website';trap.tabIndex=-1;trap.autocomplete='off';trap.className='community-trap';trap.setAttribute('aria-hidden','true');
 const submit=document.createElement('button');submit.type='submit';submit.textContent='ক্লাউডে উত্তর জমা দিন';
 const consent=document.createElement('p');consent.className='community-disclaimer';consent.textContent='জমা দিলে আপনার নাম ও উত্তর সবার জন্য প্রকাশিত হবে। ব্যক্তিগত চিকিৎসার তথ্য বা ফোন নম্বর লিখবেন না।';
 form.append(heading,nameLabel,answerLabel,trap,consent,submit);wrap.append(title,note,posts,status,form);panel.append(wrap);
 let loaded=false;
 function show(row){const item=document.createElement('article');item.className='community-post';const top=document.createElement('div');top.className='community-post-meta';const who=document.createElement('strong');who.textContent=row.name;const when=document.createElement('time');when.dateTime=row.createdAt;try{when.textContent=new Intl.DateTimeFormat('bn-BD',{dateStyle:'medium'}).format(new Date(row.createdAt))}catch{when.textContent='';}top.append(who,when);const body=document.createElement('p');body.textContent=row.answer;item.append(top,body);posts.append(item);}
 async function load(force=false){if(loaded&&!force)return;status.textContent='উত্তর লোড হচ্ছে…';try{const r=await fetch('/api/hijama-community?q='+n,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error||'লোড ব্যর্থ');posts.replaceChildren();d.answers.forEach(show);status.textContent=d.answers.length?bn(d.answers.length)+'টি পাঠকের উত্তর': 'এখনো কোনো পাঠকের উত্তর নেই। প্রথম উত্তরটি লিখুন।';loaded=true;}catch{status.textContent='উত্তর লোড হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।';}}
 question.addEventListener('toggle',()=>{if(question.open)load()});
 if(question.open)load();
 form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;submit.disabled=true;submit.textContent='সংরক্ষণ হচ্ছে…';try{const r=await fetch('/api/hijama-community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:n,name:name.value,answer:answer.value,website:trap.value})});const d=await r.json();if(!r.ok)throw Error(d.error||'সংরক্ষণ ব্যর্থ');if(trap.value){status.textContent='উত্তর জমা হয়েছে।';return;}answer.value='';status.textContent='উত্তর ক্লাউডে সংরক্ষিত হয়েছে।';await load(true);}catch(err){status.textContent=err.message||'সংরক্ষণ ব্যর্থ।'}finally{submit.disabled=false;submit.textContent='ক্লাউডে উত্তর জমা দিন';}});
});
window.addEventListener('hashchange',()=>{const el=document.getElementById(location.hash.slice(1));if(el?.matches('details.question')){el.open=true;el.scrollIntoView({block:'start'})}});
})();
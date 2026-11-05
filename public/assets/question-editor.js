
(()=>{'use strict';
const KEY='hijama-question-drafts-v1';
const items=[...document.querySelectorAll('details.question[id^="q"]')];
const record=new Map(), published=new Map();
let drafts={};
try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))drafts=v;}catch(e){}
const status=document.getElementById('editorMessage');
function flash(msg){status.textContent=msg;}
const valid=(s)=>typeof s==='string'&&s.length<=12000;
function stored(){try{localStorage.setItem(KEY,JSON.stringify(drafts));return true}catch(e){flash('এই ব্রাউজারে Save সম্ভব হয়নি। JSON Export করে রাখুন।');return false;}}
for(const item of items){
 const n=Number(item.id.slice(1)), panel=item.querySelector('.answer');if(!panel||!Number.isInteger(n))continue;
 const cloned=panel.cloneNode(true); cloned.querySelectorAll('small').forEach(s=>s.remove());
 const defaultText=cloned.textContent.trim(); const note=panel.querySelector('small')?.cloneNode(true);
 published.set(n,defaultText);panel.textContent='';
 const p=document.createElement('p');p.className='current-answer';panel.appendChild(p);
 if(note)panel.appendChild(note);
 const actions=document.createElement('div');actions.className='answer-actions';
 const edit=document.createElement('button');edit.type='button';edit.textContent='উত্তর Edit';
 const meta=document.createElement('span');meta.className='meta';actions.append(edit,meta);
 const form=document.createElement('div');form.className='edit-form';form.hidden=true;
 const label=document.createElement('label');label.textContent='প্রশ্ন '+n+' এর উত্তর লিখুন';label.htmlFor='answerEditor'+n;
 const area=document.createElement('textarea');area.id=label.htmlFor;area.maxLength=12000;area.placeholder='যাচাইকৃত উত্তর লিখুন...';
 const controls=document.createElement('div');controls.className='controls';
 const save=document.createElement('button');save.type='button';save.className='primary';save.textContent='Save Draft';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';
 const reset=document.createElement('button');reset.type='button';reset.textContent='মূল প্রকাশিত উত্তর';
 controls.append(save,cancel,reset);form.append(label,area,controls);panel.append(actions,form);
 const apply=()=>{
   const value=Object.prototype.hasOwnProperty.call(drafts,n)?drafts[n]:published.get(n);
   p.textContent=value||'এই প্রশ্নের যাচাইকৃত উত্তর এখনো যোগ করা হয়নি।';
   meta.textContent=Object.prototype.hasOwnProperty.call(drafts,n)?'এই ডিভাইসের Draft':'প্রকাশিত উত্তর';
 };
 edit.addEventListener('click',()=>{form.hidden=!form.hidden;if(!form.hidden){area.value=Object.prototype.hasOwnProperty.call(drafts,n)?drafts[n]:(published.get(n)||'');area.focus();item.open=true}});
 save.addEventListener('click',()=>{const v=area.value.trim();if(v.length>12000)return flash('উত্তর খুব বড়।');drafts[n]=v;stored();apply();form.hidden=true;flash('প্রশ্ন '+n+' এর উত্তর Draft হিসেবে সংরক্ষিত।')});
 cancel.addEventListener('click',()=>form.hidden=true);
 reset.addEventListener('click',()=>{delete drafts[n];stored();apply();form.hidden=true;flash('প্রশ্ন '+n+' এর প্রকাশিত উত্তর ফিরিয়ে আনা হয়েছে।')});
 record.set(n,{apply,p});
 apply();
}
document.getElementById('exportAnswers').addEventListener('click',()=>{
 const answers={}; for(const [n] of record){answers[n]=Object.prototype.hasOwnProperty.call(drafts,n)?drafts[n]:(published.get(n)||'');}
 const payload={version:1,description:'Hijama Guide published answers. Review medical and religious claims before publishing.',answers};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hijama-answers.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 flash('৮৪টি উত্তর JSON ফাইলে Export হয়েছে। GitHub-এ আপলোড না করা পর্যন্ত অন্যরা Draft দেখবে না।');
});
const fileInput=document.getElementById('answersFile');
document.getElementById('importAnswers').addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',async()=>{
 const file=fileInput.files?.[0];if(!file)return;
 try{
  if(file.size>2500000)throw Error('ফাইলটি অত্যন্ত বড়।');
  const json=JSON.parse(await file.text()),ans=json?.answers;
  if(!ans||typeof ans!=='object'||Array.isArray(ans))throw Error('JSON-এ answers নেই।');
  const incoming={};let count=0;
  for(const [k,v] of Object.entries(ans)){const n=Number(k);if(!Number.isInteger(n)||n<1||n>84||!valid(v))throw Error('অবৈধ প্রশ্ন বা উত্তর: '+k);incoming[n]=v;count++;}
  if(!count)throw Error('কোনো উত্তর নেই।');
  if(!confirm(count+'টি উত্তর এই ব্রাউজারের Draft-এ Import করবে?'))return;
  drafts={...drafts,...incoming};stored();record.forEach(({apply})=>apply());flash(count+'টি উত্তর Import হয়েছে (শুধু এই ব্রাউজারে)।');
 }catch(e){flash('Import ব্যর্থ: '+e.message)}finally{fileInput.value=''}
});
fetch('./data/hijama-answers.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
 if(!data?.answers||typeof data.answers!=='object')return;
 for(const [k,v] of Object.entries(data.answers)){const n=Number(k);if(record.has(n)&&valid(v))published.set(n,v);}
 record.forEach(({apply})=>apply());
}).catch(()=>{});
})();

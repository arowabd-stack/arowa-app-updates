(()=>{
'use strict';
// The same anonymous browser key is used for Hijama answers and reader questions.
// A name alone cannot authorize editing or deleting anybody else's contribution.
const KEY='hijama-author-key-v2',NAME='hijama-author-display-name-v2';
function getIdentity(){
 let key='';
 try{
  key=localStorage.getItem(KEY)||'';
  if(!/^[a-f0-9]{64}$/.test(key)&&window.crypto?.getRandomValues){
   const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
   key=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');
   localStorage.setItem(KEY,key);
  }
  if(localStorage.getItem(KEY)!==key)key='';
 }catch{key='';}
 return {key,getName(){try{return localStorage.getItem(NAME)||''}catch{return ''}},
  saveName(name){try{localStorage.setItem(NAME,name)}catch{}}};
}
const identity=getIdentity();
window.HijamaCommunityIdentity=identity;
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const el=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node};
const request=async (url,options={})=>{
 const headers={...(options.headers||{})};if(identity.key)headers['x-hijama-edit-key']=identity.key;
 const response=await fetch(url,{...options,headers,cache:'no-store'});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(payload.error||'ইন্টারনেট সংযোগ পরীক্ষা করুন।');
 return payload;
};
document.querySelectorAll('details.question[id^="q"]').forEach(question=>{
 const n=Number(question.id.slice(1));
 if(!Number.isInteger(n)||n<1||n>84)return;
 const panel=question.querySelector('.answer');if(!panel)return;
 const wrap=el('section','community-answers');wrap.setAttribute('aria-label','পাঠকদের উত্তর');
 const heading=el('div','community-heading');
 const title=el('h4','community-title','পাঠকদের উত্তর');
 const count=el('span','community-count');
 const left=el('div','community-heading-left');left.append(title,count);
 const toggle=el('button','community-toggle','উত্তর দিন');toggle.type='button';
 toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','communityCompose'+n);
 heading.append(left,toggle);
 const posts=el('div','community-posts');posts.setAttribute('aria-live','polite');
 const status=el('p','community-status','');status.setAttribute('role','status');
 const composer=el('div','community-composer');composer.id='communityCompose'+n;composer.hidden=true;
 const form=el('form','community-form');
 const title2=el('h5','community-form-title','আপনার উত্তর লিখুন');
 const nameLabel=el('label','community-field');nameLabel.append(el('span','','আপনার নাম'));
 const name=el('input');name.type='text';name.required=true;name.minLength=2;name.maxLength=70;name.autocomplete='name';name.placeholder='আপনার নাম লিখুন';
 name.value=identity.getName();nameLabel.append(name);
 const author=el('p','community-author');author.hidden=true;
 const answerLabel=el('label','community-field');answerLabel.append(el('span','','আপনার উত্তর'));
 const answer=el('textarea');answer.required=true;answer.minLength=4;answer.maxLength=1500;answer.rows=3;answer.placeholder='আপনার উত্তর লিখুন…';answerLabel.append(answer);
 const honeypot=el('input','community-trap');honeypot.type='text';honeypot.name='website';honeypot.tabIndex=-1;honeypot.autocomplete='off';
 honeypot.setAttribute('aria-hidden','true');
 const controls=el('div','community-controls');
 const cancel=el('button','community-cancel','বাতিল');cancel.type='button';cancel.hidden=true;
 const submit=el('button','community-submit','উত্তর জমা দিন');submit.type='submit';
 controls.append(cancel,submit);
 const notice=el('p','community-disclaimer','আপনার নাম ও উত্তর প্রকাশিত হবে। ব্যক্তিগত তথ্য বা ফোন নম্বর লিখবেন না।');
 form.append(title2,nameLabel,author,answerLabel,honeypot,controls,notice);
 const manage=el('div','community-manage');manage.hidden=true;
 composer.append(form,manage);
 wrap.append(heading,posts,status,composer);panel.append(wrap);

 let loaded=false,rows=[],editingId=null,busy=false;
 const myRows=()=>rows.filter(row=>row.mine);
 function setBusy(value){
  busy=value;submit.disabled=value;cancel.disabled=value;toggle.disabled=value;
  submit.textContent=value?'জমা হচ্ছে…':editingId?'পরিবর্তন সংরক্ষণ করুন':'উত্তর জমা দিন';
 }
 function resetEditor(){
  editingId=null;answer.value='';cancel.hidden=true;
  title2.textContent='আপনার উত্তর লিখুন';submit.textContent='উত্তর জমা দিন';
 }
 function syncAuthor(){
  const mine=myRows();
  if(mine.length){const display=mine[0].name;nameLabel.hidden=true;author.hidden=false;author.textContent='আপনি: '+display;}
  else{author.hidden=true;nameLabel.hidden=false;name.value=name.value||identity.getName();}
 }
 function makeEntry(row){
  const entry=el('div','community-entry');
  const body=el('p','community-entry-body',row.answer);
  const date=el('time','community-date');
  date.dateTime=row.updatedAt||row.createdAt;
  try{date.textContent=new Intl.DateTimeFormat('bn-BD',{dateStyle:'medium'}).format(new Date(date.dateTime));}
  catch{date.textContent='';}
  entry.append(body,date);return entry;
 }
 function render(){
  posts.replaceChildren();manage.replaceChildren();
  const grouped=new Map();
  for(const row of rows){
   const id=row.ownerId||'legacy-'+row.id;
   if(!grouped.has(id))grouped.set(id,[]);
   grouped.get(id).push(row);
  }
  count.textContent=rows.length?'· '+bn(rows.length)+'টি':'';
  if(!rows.length){posts.append(el('p','community-empty','এখনো কেউ উত্তর দেননি।'));}
  for(const group of grouped.values()){
   const box=el('article','community-person');
   const meta=el('div','community-person-meta');
   meta.append(el('strong','community-person-name',group[0].name));
   if(group.length>1)meta.append(el('span','community-person-count',bn(group.length)+'টি উত্তর'));
   box.append(meta);
   for(const row of group)box.append(makeEntry(row));
   posts.append(box);
  }
  const own=myRows();
  if(own.length){
   manage.hidden=false;manage.append(el('h5','','আপনার আগের উত্তর'));
   for(const row of own){
    const item=el('div','community-own-item');
    item.append(el('p','community-own-preview',row.answer));
    const actions=el('div','community-own-actions');
    const edit=el('button','','এডিট');edit.type='button';
    const remove=el('button','community-remove','মুছুন');remove.type='button';
    edit.addEventListener('click',()=>{
     if(busy)return;
     editingId=row.id;answer.value=row.answer;title2.textContent='উত্তর পরিবর্তন করুন';
     submit.textContent='পরিবর্তন সংরক্ষণ করুন';cancel.hidden=false;
     composer.hidden=false;toggle.setAttribute('aria-expanded','true');
     answer.focus();answer.scrollIntoView({block:'nearest'});
    });
    remove.addEventListener('click',async()=>{
     if(busy||!confirm('আপনার এই উত্তরটি মুছে ফেলবেন?'))return;
     setBusy(true);
     try{
      await request('/api/hijama-community',{method:'DELETE',headers:{'Content-Type':'application/json'},
       body:JSON.stringify({question:n,id:row.id})});
      if(editingId===row.id)resetEditor();
      await load(true);status.textContent='উত্তর মুছে ফেলা হয়েছে।';
     }catch(err){status.textContent=err.message;}
     finally{setBusy(false);}
    });
    actions.append(edit,remove);item.append(actions);manage.append(item);
   }
   const more=el('button','community-more','আরেকটি উত্তর যোগ করুন');more.type='button';
   more.addEventListener('click',()=>{resetEditor();answer.focus()});
   manage.append(more);
  }else manage.hidden=true;
  syncAuthor();
 }
 async function load(force=false){
  if(loaded&&!force)return;
  status.textContent='উত্তর আসছে…';
  try{
   const data=await request('/api/hijama-community?q='+n);
   rows=Array.isArray(data.answers)?data.answers:[];loaded=true;
   render();status.textContent=data.more?'আরও উত্তর থাকতে পারে।':'';
  }catch(err){status.textContent=err.message||'উত্তর লোড হয়নি।';}
 }
 toggle.addEventListener('click',()=>{
  if(!loaded)load();
  composer.hidden=!composer.hidden;
  toggle.setAttribute('aria-expanded',String(!composer.hidden));
  toggle.textContent=composer.hidden?'উত্তর দিন':'বন্ধ করুন';
  if(!composer.hidden&&!identity.key)status.textContent='এই ব্রাউজারে উত্তর সম্পাদনার পরিচয় সংরক্ষণ করা যাচ্ছে না।';
  if(!composer.hidden)syncAuthor();
  if(composer.hidden)resetEditor();
 });
 cancel.addEventListener('click',()=>{resetEditor();syncAuthor();answer.focus()});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;
  if(!identity.key){status.textContent='এই ব্রাউজারে নিরাপদ সম্পাদনা পরিচয় তৈরি করা যায়নি।';return;}
  const oldId=editingId;
  setBusy(true);
  try{
   const data={question:n,answer:answer.value.trim(),website:honeypot.value};
   if(oldId)data.id=oldId;else data.name=name.value.trim()||identity.getName();
   await request('/api/hijama-community',{method:oldId?'PATCH':'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
   if(!oldId)identity.saveName(data.name);
   resetEditor();await load(true);status.textContent=oldId?'উত্তর পরিবর্তন হয়েছে।':'উত্তর জমা হয়েছে।';
  }catch(err){status.textContent=err.message||'উত্তর জমা দেওয়া যায়নি।';}
  finally{setBusy(false);}
 });
 question.addEventListener('toggle',()=>{if(question.open)load()});
 if(question.open)load();
});
window.addEventListener('hashchange',()=>{
 const item=document.getElementById(location.hash.slice(1));
 if(item?.matches('details.question'))item.open=true;
});
})();

(()=>{
'use strict';
// This panel appears once, directly after all 84 curated questions.
const root=document.getElementById('readerQuestions');
if(!root)return;
const identity=window.HijamaCommunityIdentity;
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const el=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node};
const api='/api/hijama-reader-questions';
const request=async(method='GET',data)=>{
 const headers={};if(identity?.key)headers['x-hijama-edit-key']=identity.key;
 if(method!=='GET')headers['Content-Type']='application/json';
 const response=await fetch(api,{method,headers,cache:'no-store',...(data?{body:JSON.stringify(data)}:{})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||'সার্ভারে যোগাযোগ করা যাচ্ছে না।');
 return result;
};
root.classList.add('community-questions');
const heading=el('div','community-heading community-reader-heading');
const titlebox=el('div','community-heading-left');
titlebox.append(el('h3','community-title','পাঠকদের প্রশ্ন'));
const description=el('p','community-reader-description','এখানে আপনার প্রশ্ন যোগ করুন।');
titlebox.append(description);
const toggle=el('button','community-toggle','আপনার প্রশ্ন যোগ করুন');toggle.type='button';
toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','readerQuestionComposer');
heading.append(titlebox,toggle);
const posts=el('div','community-posts');posts.setAttribute('aria-live','polite');
const status=el('p','community-status','পাঠকদের প্রশ্ন লোড হচ্ছে…');status.setAttribute('role','status');
const composer=el('div','community-composer');composer.hidden=true;composer.id='readerQuestionComposer';
const form=el('form','community-form');
const formTitle=el('h4','community-form-title','আপনার প্রশ্ন লিখুন');
const nameLabel=el('label','community-field');nameLabel.append(el('span','','আপনার নাম'));
const name=el('input');name.type='text';name.autocomplete='name';name.minLength=2;name.maxLength=70;name.required=true;
name.placeholder='আপনার নাম লিখুন';name.value=identity?.getName()||'';nameLabel.append(name);
const author=el('p','community-author');author.hidden=true;
const questionLabel=el('label','community-field');questionLabel.append(el('span','','আপনার প্রশ্ন'));
const text=el('textarea');text.minLength=8;text.maxLength=1200;text.required=true;text.rows=3;
text.placeholder='এখানে আপনার প্রশ্ন লিখুন…';questionLabel.append(text);
const honeypot=el('input','community-trap');honeypot.name='website';honeypot.type='text';honeypot.tabIndex=-1;
honeypot.autocomplete='off';honeypot.setAttribute('aria-hidden','true');
const controls=el('div','community-controls');
const cancel=el('button','community-cancel','বাতিল');cancel.hidden=true;cancel.type='button';
const submit=el('button','community-submit','প্রশ্ন জমা দিন');submit.type='submit';
controls.append(cancel,submit);
const disclaimer=el('p','community-disclaimer','আপনার নাম ও প্রশ্ন সবার জন্য প্রকাশিত হবে। ব্যক্তিগত তথ্য, ফোন নম্বর বা বিজ্ঞাপন লিখবেন না।');
form.append(formTitle,nameLabel,author,questionLabel,honeypot,controls,disclaimer);
const manage=el('div','community-manage');manage.hidden=true;
composer.append(form,manage);
root.append(heading,posts,status,composer);
let rows=[],editingId=null,busy=false,loaded=false;
const mine=()=>rows.filter(row=>row.mine);
function reset(){
 editingId=null;formTitle.textContent='আপনার প্রশ্ন লিখুন';text.value='';cancel.hidden=true;submit.textContent='প্রশ্ন জমা দিন';
}
function syncAuthor(){
 const own=mine();
 if(own.length){
  nameLabel.hidden=true;author.hidden=false;author.textContent='আপনি: '+own[0].name;
 }else{
  nameLabel.hidden=false;author.hidden=true;name.value=name.value||identity?.getName()||'';
 }
}
function setBusy(value){
 busy=value;toggle.disabled=value;submit.disabled=value;cancel.disabled=value;
 submit.textContent=value?'জমা হচ্ছে…':editingId?'পরিবর্তন সংরক্ষণ করুন':'প্রশ্ন জমা দিন';
}
function render(){
 posts.replaceChildren();manage.replaceChildren();
 const grouped=new Map();
 for(const row of rows){
  const key=row.ownerId||'legacy-'+row.id;
  if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push(row);
 }
 if(!rows.length)posts.append(el('p','community-empty','এখনো কোনো পাঠকের প্রশ্ন নেই।'));
 for(const group of grouped.values()){
  const box=el('article','community-person');
  const head=el('div','community-person-meta');
  head.append(el('strong','community-person-name',group[0].name));
  if(group.length>1)head.append(el('span','community-person-count',bn(group.length)+'টি প্রশ্ন'));
  box.append(head);
  for(const row of group){
   const entry=el('div','community-entry');
   entry.append(el('p','community-entry-body',row.question));
   const date=el('time','community-date');date.dateTime=row.updatedAt||row.createdAt;
   try{date.textContent=new Intl.DateTimeFormat('bn-BD',{dateStyle:'medium'}).format(new Date(date.dateTime));}
   catch{date.textContent='';}
   entry.append(date);box.append(entry);
  }
  posts.append(box);
 }
 const own=mine();
 if(own.length){
  manage.hidden=false;manage.append(el('h5','','আপনার আগের প্রশ্ন'));
  for(const row of own){
   const item=el('div','community-own-item');
   item.append(el('p','community-own-preview',row.question));
   const actions=el('div','community-own-actions');
   const edit=el('button','','এডিট');edit.type='button';
   const remove=el('button','community-remove','মুছুন');remove.type='button';
   edit.addEventListener('click',()=>{
    if(busy)return;
    editingId=row.id;text.value=row.question;formTitle.textContent='প্রশ্ন পরিবর্তন করুন';
    submit.textContent='পরিবর্তন সংরক্ষণ করুন';cancel.hidden=false;
    composer.hidden=false;toggle.setAttribute('aria-expanded','true');
    text.focus();text.scrollIntoView({block:'nearest'});
   });
   remove.addEventListener('click',async()=>{
    if(busy||!confirm('আপনার এই প্রশ্নটি মুছে ফেলবেন?'))return;
    setBusy(true);
    try{
     await request('DELETE',{id:row.id});
     if(editingId===row.id)reset();
     await load(true);status.textContent='প্রশ্ন মুছে ফেলা হয়েছে।';
    }catch(err){status.textContent=err.message;}
    finally{setBusy(false);}
   });
   actions.append(edit,remove);item.append(actions);manage.append(item);
  }
  const more=el('button','community-more','আরেকটি প্রশ্ন যোগ করুন');more.type='button';
  more.addEventListener('click',()=>{reset();text.focus()});manage.append(more);
 }else manage.hidden=true;
 syncAuthor();
}
async function load(force=false){
 if(loaded&&!force)return;
 status.textContent='প্রশ্ন আসছে…';
 try{
  const data=await request();
  rows=Array.isArray(data.questions)?data.questions:[];loaded=true;render();
  status.textContent=data.more?'আরও প্রশ্ন থাকতে পারে।':'';
 }catch(err){status.textContent=err.message||'প্রশ্ন লোড করা যায়নি।';}
}
toggle.addEventListener('click',()=>{
 composer.hidden=!composer.hidden;
 toggle.textContent=composer.hidden?'আপনার প্রশ্ন যোগ করুন':'বন্ধ করুন';
 toggle.setAttribute('aria-expanded',String(!composer.hidden));
 if(!composer.hidden){
  if(!identity?.key)status.textContent='এই ব্রাউজারে সম্পাদনার পরিচয় সংরক্ষণ করা যাচ্ছে না।';
  syncAuthor();
 }else reset();
});
cancel.addEventListener('click',()=>{reset();syncAuthor();text.focus()});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!form.reportValidity())return;
 if(!identity?.key){status.textContent='এই ব্রাউজারে সম্পাদনার পরিচয় তৈরি করা যায়নি।';return;}
 const id=editingId;setBusy(true);
 try{
  const payload={question:text.value.trim(),website:honeypot.value};
  if(id)payload.id=id;else payload.name=name.value.trim()||identity.getName();
  await request(id?'PATCH':'POST',payload);
  if(!id)identity.saveName(payload.name);
  reset();await load(true);
  status.textContent=id?'প্রশ্ন পরিবর্তন হয়েছে।':'প্রশ্ন জমা হয়েছে।';
 }catch(err){status.textContent=err.message||'প্রশ্ন জমা দেওয়া যায়নি।';}
 finally{setBusy(false);}
});
load();
})();

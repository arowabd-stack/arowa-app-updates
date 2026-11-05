(()=>{
'use strict';
// Reader questions are the tenth FAQ category, numbered from 85.
// Edit ownership is based on the local browser key, never a displayed name.
const root=document.getElementById('readerQuestions');
if(!root)return;
const identity=window.HijamaCommunityIdentity;
const apiQuestions='/api/hijama-reader-questions';
const apiReplies='/api/hijama-reader-replies';
const apiNotifications='/api/hijama-reader-notifications';
const bn=x=>String(x).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const el=(tag,cls,txt)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(txt!==undefined)node.textContent=txt;
 return node;
};
const moderatorMode=new URLSearchParams(location.search).get('moderator')==='1';
const staff={code:''};
const controllers=new Map();
function formatDate(value){
 try{return new Intl.DateTimeFormat('bn-BD',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
 catch{return '';}
}
async function request(url,method='GET',payload,asStaff=false){
 const headers={};
 if(identity?.key)headers['x-hijama-edit-key']=identity.key;
 if(asStaff&&staff.code)headers['x-hijama-admin-key']=staff.code;
 if(method!=='GET')headers['Content-Type']='application/json';
 const response=await fetch(url,{method,headers,cache:'no-store',
  ...(payload?{body:JSON.stringify(payload)}:{})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||'সার্ভারে যোগাযোগ করা যাচ্ছে না।');
 return data;
}
const toolbar=el('div','community-heading community-reader-heading');
const description=el('p','community-reader-description','নিজের প্রশ্ন যোগ করুন অথবা অন্য পাঠকের প্রশ্নে উত্তর দিন।');
const addQuestion=el('button','community-toggle','আপনার প্রশ্ন যোগ করুন');
addQuestion.type='button';
addQuestion.setAttribute('aria-expanded','false');
addQuestion.setAttribute('aria-controls','readerQuestionComposer');
const notificationArea=el('div','reader-notification-area');
const notificationButton=el('button','reader-notification-button');
notificationButton.type='button';notificationButton.setAttribute('aria-label','নোটিফিকেশন');
notificationButton.setAttribute('title','আপনার প্রশ্নের রিপ্লাই নোটিফিকেশন');
notificationButton.setAttribute('aria-expanded','false');
notificationButton.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
const notificationBadge=el('span','reader-notification-badge');
notificationBadge.hidden=true;notificationArea.append(notificationButton,notificationBadge);
const notificationPanel=el('section','reader-notification-panel');
notificationPanel.hidden=true;notificationPanel.setAttribute('aria-label','আপনার রিপ্লাই নোটিফিকেশন');
notificationPanel.append(el('h4','','নতুন রিপ্লাই'));
const notificationList=el('div','reader-notification-list');
notificationPanel.append(notificationList);
toolbar.append(description,notificationArea,addQuestion);
const questionFormWrap=el('div','community-composer');
questionFormWrap.id='readerQuestionComposer';
questionFormWrap.hidden=true;
const form=el('form','community-form');
const formTitle=el('h4','community-form-title','আপনার প্রশ্ন লিখুন');
const nameLabel=el('label','community-field');
nameLabel.append(el('span','','আপনার নাম'));
const name=el('input');
name.type='text';name.minLength=2;name.maxLength=70;name.autocomplete='name';
name.required=true;name.placeholder='আপনার নাম লিখুন';
name.value=identity?.getName()||'';
nameLabel.append(name);
const author=el('p','community-author');author.hidden=true;
const questionLabel=el('label','community-field');
questionLabel.append(el('span','','আপনার প্রশ্ন'));
const questionText=el('textarea');
questionText.required=true;questionText.minLength=8;questionText.maxLength=1200;
questionText.rows=3;questionText.placeholder='এখানে আপনার প্রশ্ন লিখুন…';
questionLabel.append(questionText);
const honeypot=el('input','community-trap');
honeypot.name='website';honeypot.tabIndex=-1;honeypot.type='text';
honeypot.autocomplete='off';honeypot.setAttribute('aria-hidden','true');
const formControls=el('div','community-controls');
const formCancel=el('button','community-cancel','বাতিল');formCancel.type='button';
formCancel.hidden=true;
const formSubmit=el('button','community-submit','প্রশ্ন জমা দিন');formSubmit.type='submit';
formControls.append(formCancel,formSubmit);
form.append(formTitle,nameLabel,author,questionLabel,honeypot,formControls,
 el('p','community-disclaimer','আপনার নাম ও প্রশ্ন প্রকাশিত হবে। ব্যক্তিগত তথ্য বা ফোন নম্বর লিখবেন না।'));
questionFormWrap.append(form);
const list=el('div','reader-question-items');
const status=el('p','community-status');status.setAttribute('role','status');
root.append(toolbar,notificationPanel,questionFormWrap,list,status);
let rows=[],editingId=null,busy=false,loaded=false,focusCard=null;
const mine=()=>rows.filter(r=>r.mine);
function ownerLabel(){
 const posts=mine();
 if(posts.length){
  nameLabel.hidden=true;name.required=false;author.hidden=false;
  author.textContent='আপনি: '+posts[0].name;
 }else{
  nameLabel.hidden=false;name.required=true;author.hidden=true;
  name.value=name.value||identity?.getName()||'';
 }
}
function resetQuestionEditor(){
 editingId=null;formTitle.textContent='আপনার প্রশ্ন লিখুন';
 formSubmit.textContent='প্রশ্ন জমা দিন';formCancel.hidden=true;questionText.value='';
}
function openQuestionEditor(row=null){
 editingId=row?.id||null;
 questionFormWrap.hidden=false;addQuestion.textContent='বন্ধ করুন';
 addQuestion.setAttribute('aria-expanded','true');
 ownerLabel();
 if(row){
  formTitle.textContent='আপনার প্রশ্ন পরিবর্তন করুন';
  questionText.value=row.question;formSubmit.textContent='পরিবর্তন সংরক্ষণ করুন';
  formCancel.hidden=false;
 }else resetQuestionEditor();
 questionText.focus();
 questionFormWrap.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function closeQuestionEditor(){
 questionFormWrap.hidden=true;addQuestion.textContent='আপনার প্রশ্ন যোগ করুন';
 addQuestion.setAttribute('aria-expanded','false');resetQuestionEditor();
}
function questionBusy(value){
 busy=value;addQuestion.disabled=value;formSubmit.disabled=value;formCancel.disabled=value;
 formSubmit.textContent=value?'জমা হচ্ছে…':editingId?'পরিবর্তন সংরক্ষণ করুন':'প্রশ্ন জমা দিন';
}
addQuestion.addEventListener('click',()=>{
 if(busy)return;
 if(!questionFormWrap.hidden){closeQuestionEditor();return;}
 openQuestionEditor();
});
formCancel.addEventListener('click',closeQuestionEditor);
function renderReplies(record){
 const area=el('section','reader-replies');
 const head=el('div','community-heading reader-reply-heading');
 const title=el('strong','community-title','পাঠকদের উত্তর');
 const count=el('span','community-count');
 const left=el('div','community-heading-left');left.append(title,count);
 const toggle=el('button','community-toggle','Reply to '+record.name);
 toggle.type='button';toggle.setAttribute('aria-expanded','false');
 const composerId='replyComposer-'+record.id;
 toggle.setAttribute('aria-controls',composerId);
 head.append(left,toggle);
 const posts=el('div','community-posts reader-reply-posts');
 const message=el('p','community-status');message.setAttribute('role','status');
 const composer=el('div','community-composer');composer.hidden=true;composer.id=composerId;
 const replyForm=el('form','community-form');
 const formHeading=el('h4','community-form-title','Reply to '+record.name);
 const replyNameLabel=el('label','community-field');replyNameLabel.append(el('span','','আপনার নাম'));
 const replyName=el('input');replyName.type='text';replyName.required=true;
 replyName.minLength=2;replyName.maxLength=70;replyName.autocomplete='name';
 replyName.placeholder='আপনার নাম লিখুন';replyName.value=identity?.getName()||'';
 replyNameLabel.append(replyName);
 const replyAuthor=el('p','community-author');replyAuthor.hidden=true;
 const replyAnswerLabel=el('label','community-field');replyAnswerLabel.append(el('span','','আপনার উত্তর'));
 const replyText=el('textarea');replyText.required=true;replyText.minLength=4;
 replyText.maxLength=1500;replyText.rows=3;replyText.placeholder='আপনার রিপ্লাই লিখুন…';
 replyAnswerLabel.append(replyText);
 const officialLabel=el('label','community-official-switch');
 const officialCheck=el('input');officialCheck.type='checkbox';
 officialLabel.append(officialCheck,el('span','','ওয়েবসাইটের পক্ষ থেকে উত্তর'));
 officialLabel.hidden=!moderatorMode||!staff.code;
 const actions=el('div','community-controls');
 const cancel=el('button','community-cancel','বাতিল');cancel.type='button';cancel.hidden=true;
 const submit=el('button','community-submit','রিপ্লাই জমা দিন');submit.type='submit';
 actions.append(cancel,submit);
 replyForm.append(formHeading,replyNameLabel,replyAuthor,replyAnswerLabel,officialLabel,
  actions,el('p','community-disclaimer','পাঠকদের মতামত চিকিৎসা বা ধর্মীয় সিদ্ধান্তের বিকল্প নয়।'));
 composer.append(replyForm);
 area.append(head,posts,message,composer);
 let replies=[],loadedReplies=false,editing=null,replyBusy=false;
 const myReplies=()=>replies.filter(r=>r.mine);
 function authorFields(){
  officialLabel.hidden=!moderatorMode||!staff.code;
  const official=officialCheck.checked;
  const own=myReplies().find(r=>!r.official);
  if(official){replyNameLabel.hidden=true;replyName.required=false;replyAuthor.hidden=false;replyAuthor.textContent='হিজামা ওয়েবসাইট';}
  else if(own){replyNameLabel.hidden=true;replyName.required=false;replyAuthor.hidden=false;replyAuthor.textContent='আপনি: '+own.name;}
  else{replyNameLabel.hidden=false;replyName.required=true;replyAuthor.hidden=true;
   replyName.value=replyName.value||identity?.getName()||'';}
 }
 function resetReplyEditor(){
  editing=null;replyText.value='';formHeading.textContent='Reply to '+record.name;
  submit.textContent='রিপ্লাই জমা দিন';cancel.hidden=true;officialCheck.disabled=false;
  officialCheck.checked=false;authorFields();
 }
 function closeReplyEditor(){
  composer.hidden=true;toggle.textContent='Reply to '+record.name;toggle.setAttribute('aria-expanded','false');
  resetReplyEditor();
 }
 function setReplyBusy(value){
  replyBusy=value;toggle.disabled=value;submit.disabled=value;cancel.disabled=value;
  submit.textContent=value?'জমা হচ্ছে…':editing?'পরিবর্তন সংরক্ষণ করুন':'রিপ্লাই জমা দিন';
 }
 function editReply(r){
  editing=r.id;replyText.value=r.answer;formHeading.textContent='আপনার উত্তর পরিবর্তন করুন';
  officialCheck.checked=!!r.official;officialCheck.disabled=true;
  cancel.hidden=false;composer.hidden=false;toggle.textContent='বন্ধ করুন';
  toggle.setAttribute('aria-expanded','true');
  authorFields();submit.textContent='পরিবর্তন সংরক্ষণ করুন';replyText.focus();
  composer.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function draw(){
  posts.replaceChildren();
  count.textContent=replies.length?'· '+bn(replies.length)+'টি':'';
  if(!replies.length)posts.append(el('p','community-empty','এখনো কোনো উত্তর নেই।'));
  const groups=new Map();
  for(const r of replies){
   const key=r.official?'official':r.ownerId||'legacy-'+r.id;
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(r);
  }
  for(const group of groups.values()){
   const box=el('article','community-person'+(group[0].official?' community-official':''));
   const meta=el('div','community-person-meta');
   meta.append(el('strong','community-person-name',group[0].official?'হিজামা ওয়েবসাইট':group[0].name));
   if(group[0].official)meta.append(el('span','community-official-label','ওয়েবসাইটের উত্তর'));
   if(group.length>1)meta.append(el('span','community-person-count',bn(group.length)+'টি উত্তর'));
   box.append(meta);
   for(const r of group){
    const entry=el('div','community-entry');
    entry.append(el('p','community-entry-body',r.answer));
    const date=el('time','community-date');date.dateTime=r.updatedAt||r.createdAt;
    date.textContent=formatDate(date.dateTime);entry.append(date);
    if(r.mine){
     const controls=el('div','community-own-actions reader-item-actions');
     const edit=el('button','','এডিট');edit.type='button';
     const remove=el('button','community-remove','মুছুন');remove.type='button';
     edit.addEventListener('click',()=>{if(!replyBusy)editReply(r)});
     remove.addEventListener('click',async()=>{
      if(replyBusy||!confirm('আপনার এই উত্তরটি মুছে ফেলবেন?'))return;
      setReplyBusy(true);
      try{
       await request(apiReplies,'DELETE',{question:record.id,id:r.id},r.official);
       if(editing===r.id)closeReplyEditor();
       await loadReplies(true);message.textContent='উত্তর মুছে ফেলা হয়েছে।';
      }catch(err){message.textContent=err.message;}
      finally{setReplyBusy(false);}
     });
     controls.append(edit,remove);entry.append(controls);
    }
    box.append(entry);
   }
   posts.append(box);
  }
  authorFields();
 }
 async function loadReplies(force=false){
  if(loadedReplies&&!force)return;
  message.textContent='উত্তর লোড হচ্ছে…';
  try{
   const data=await request(apiReplies+'?question='+encodeURIComponent(record.id),'GET',null,!!staff.code);
   replies=Array.isArray(data.replies)?data.replies:[];
   loadedReplies=true;draw();
   message.textContent=data.more?'আরও উত্তর থাকতে পারে।':'';
  }catch(err){message.textContent=err.message;}
 }
 toggle.addEventListener('click',()=>{
  composer.hidden=!composer.hidden;
  toggle.textContent=composer.hidden?'Reply to '+record.name:'বন্ধ করুন';
  toggle.setAttribute('aria-expanded',String(!composer.hidden));
  if(composer.hidden)resetReplyEditor();else{authorFields();replyText.focus();}
 });
 officialCheck.addEventListener('change',authorFields);
 cancel.addEventListener('click',closeReplyEditor);
 replyForm.addEventListener('submit',async event=>{
  event.preventDefault();if(replyBusy||!replyForm.reportValidity())return;
  if(!identity?.key&&!officialCheck.checked){message.textContent='এই ব্রাউজারে সম্পাদনার পরিচয় তৈরি করা যায়নি।';return;}
  const id=editing,official=editing?replies.find(r=>r.id===id)?.official:officialCheck.checked;
  setReplyBusy(true);
  try{
   const payload={question:record.id,answer:replyText.value.trim()};
   if(id)payload.id=id;
   else{payload.official=!!official;if(!official)payload.name=replyName.value.trim()||identity?.getName()||'';}
   await request(apiReplies,id?'PATCH':'POST',payload,!!official);
   if(!id&&!official)identity?.saveName(payload.name);
   closeReplyEditor();await loadReplies(true);
   message.textContent=id?'রিপ্লাই পরিবর্তন হয়েছে।':'রিপ্লাই জমা হয়েছে।';
  }catch(err){message.textContent=err.message;}
  finally{setReplyBusy(false);}
 });
 return {element:area,load:loadReplies};
}
function render(){
 const openBefore=new Set([...list.querySelectorAll('details.reader-question[open]')].map(x=>x.id));
 list.replaceChildren();controllers.clear();
 const sorted=[...rows].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||a.id.localeCompare(b.id));
 const range=sorted.length?'85–'+(84+sorted.length):'85–…';
 const span=document.getElementById('readerQuestionRange');
 if(span)span.textContent=bn(range);
 const link=document.getElementById('readerCategoryLink');
 if(link)link.textContent='পাঠকদের প্রশ্ন '+bn(range);
 if(!sorted.length)list.append(el('p','community-empty','এখনো কোনো পাঠক প্রশ্ন করেননি। প্রথম প্রশ্নটি যোগ করুন।'));
 sorted.forEach((record,index)=>{
  const card=el('details','question reader-question');
  card.id='reader-'+record.id;
  const summary=el('summary');
  const postMain=el('span','reader-post-main');
  const by=el('span','reader-post-byline');
  by.append(el('strong','reader-post-name',record.name),el('span','reader-post-separator','·'));
  const when=el('time','reader-post-time');when.dateTime=record.createdAt;
  when.textContent=formatDate(record.createdAt);
  by.append(when);
  if(record.updatedAt&&record.updatedAt!==record.createdAt)by.append(el('span','reader-post-edited','· সম্পাদিত'));
  postMain.append(by,el('span','reader-question-title',record.question));
  summary.append(el('b','reader-post-number',bn(85+index)+'.'),postMain);
  const content=el('div','answer reader-answer');
  if(record.mine){
   const actions=el('div','community-own-actions reader-item-actions');
   const edit=el('button','','এডিট');edit.type='button';
   const remove=el('button','community-remove','মুছুন');remove.type='button';
   edit.addEventListener('click',()=>{if(!busy)openQuestionEditor(record)});
   remove.addEventListener('click',async()=>{
    if(busy||!confirm('আপনার এই প্রশ্নটি মুছে ফেলবেন?'))return;
    questionBusy(true);
    try{
     await request(apiQuestions,'DELETE',{id:record.id});
     if(editingId===record.id)closeQuestionEditor();
     rows=rows.filter(q=>q.id!==record.id);render();
     status.textContent='প্রশ্ন মুছে ফেলা হয়েছে।';
    }catch(err){status.textContent=err.message;}
    finally{questionBusy(false);}
   });
   actions.append(edit,remove);content.append(actions);
  }
  const replies=renderReplies(record);
  content.append(replies.element);
  card.append(summary,content);list.append(card);
  controllers.set(record.id,replies);
  card.addEventListener('toggle',()=>{if(card.open)replies.load()});
  if(openBefore.has(card.id)||focusCard===card.id){card.open=true;replies.load();}
 });
 document.dispatchEvent(new Event('hijama:reader-questions-updated'));
 if(focusCard){
  const target=document.getElementById(focusCard);
  if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'nearest',behavior:'smooth'}));
  focusCard=null;
 }
 ownerLabel();
}
async function load(force=false){
 if(loaded&&!force)return;
 if(!force)status.textContent='পাঠকদের প্রশ্ন লোড হচ্ছে…';
 try{
  const data=await request(apiQuestions);
  rows=Array.isArray(data.questions)?data.questions:[];
  loaded=true;render();
  status.textContent=data.more?'আরও প্রশ্ন থাকতে পারে।':'';
 }catch(err){status.textContent=err.message||'প্রশ্ন লোড হয়নি।';}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!form.reportValidity())return;
 if(!identity?.key){status.textContent='এই ব্রাউজারে নিরাপদ সম্পাদনা পরিচয় তৈরি করা যায়নি।';return;}
 const id=editingId;
 questionBusy(true);
 try{
  const payload={question:questionText.value.trim()};
  if(id)payload.id=id;else payload.name=name.value.trim()||identity.getName();
  const data=await request(apiQuestions,id?'PATCH':'POST',payload);
  if(!id)identity.saveName(payload.name);
  const saved=data.question;
  if(saved){
   const i=rows.findIndex(r=>r.id===saved.id);
   if(i>=0)rows[i]=saved;else rows.push(saved);
   focusCard='reader-'+saved.id;
  }
  closeQuestionEditor();
  render();status.textContent=id?'প্রশ্ন পরিবর্তন হয়েছে।':'প্রশ্ন জমা হয়েছে।';
 }catch(err){status.textContent=err.message||'প্রশ্ন জমা দেওয়া যায়নি।';}
 finally{questionBusy(false);}
});
if(moderatorMode){
 const staffPanel=el('details','reader-moderator');
 const sum=el('summary','','ওয়েবসাইট কর্তৃপক্ষের প্রবেশ');
 const inner=el('div','community-form');
 const label=el('label','community-field');label.append(el('span','','প্রশাসকের প্রবেশ কোড'));
 const pass=el('input');pass.type='password';pass.autocomplete='off';pass.placeholder='প্রবেশ কোড';
 label.append(pass);
 const apply=el('button','community-toggle','প্রবেশ করুন');apply.type='button';
 const msg=el('p','community-status','কোড ব্রাউজারে স্থায়ীভাবে রাখা হয় না।');
 apply.addEventListener('click',async()=>{
  const candidate=pass.value.trim();
  if(!candidate){msg.textContent='প্রবেশ কোড লিখুন।';return;}
  const previous=staff.code;staff.code=candidate;
  try{
   if(rows.length){
    const data=await request(apiReplies+'?question='+encodeURIComponent(rows[0].id),'GET',null,true);
    if(!data.admin)throw Error('কোডটি সঠিক নয়।');
   }
   pass.value='';msg.textContent='কর্তৃপক্ষের পরিচয় সক্রিয় হয়েছে।';
   for(const [id,controller] of controllers){if(document.getElementById('reader-'+id)?.open)controller.load(true);}
  }catch(err){staff.code=previous;msg.textContent=err.message;}
 });
 inner.append(label,apply,msg);staffPanel.append(sum,inner);
 root.insertBefore(staffPanel,list);
}
load();
})();

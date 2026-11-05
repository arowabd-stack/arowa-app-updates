(()=>{
'use strict';
const el=id=>document.getElementById(id);
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const lock=el('lockScreen'),work=el('trainingWorkspace'),player=el('trainingPlayer'),
 placeholder=el('trainingPlaceholder'),list=el('videoList'),notice=el('trainingNotice');
const source=el('sourceLink'),admin=el('trainingAdmin');
let videos=new Map(),number=0,hls=null,sourceFolder='',authenticated=false,minimumClasses=137,catalogSyncBusy=false;
let last=0;try{last=Number(localStorage.getItem('hijama-training-last')||0)}catch{}
const adminMode=new URLSearchParams(location.search).get('admin')==='1';
async function request(path,options={}){
 const res=await fetch(path,{cache:'no-store',credentials:'same-origin',...options});
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(body.error||'সার্ভারে সমস্যা হয়েছে।');
 return body;
}
const currentMax=()=>Math.max(minimumClasses,...videos.keys());
function setLinks(url){
 sourceFolder=url||'';
 document.querySelectorAll('[data-training-source]').forEach(a=>{a.href=sourceFolder||'#';a.hidden=!sourceFolder});
}
function clearVideo(){
 try{player.pause()}catch{}
 if(hls){try{hls.destroy()}catch{}hls=null}
 player.removeAttribute('src');player.load();
}
function showPlaceholder(head,body,link){
 clearVideo();player.hidden=true;placeholder.hidden=false;
 el('placeholderTitle').textContent=head;el('placeholderDetail').textContent=body;
 source.href=link||'#';source.hidden=!link;
 source.textContent=link===sourceFolder?'Telegram চ্যানেল খুলুন':'মূল ভিডিওর লিংক খুলুন';
}
function draw(){
 const q=el('videoSearch').value.trim().toLowerCase();
 const frag=document.createDocumentFragment();
 list.replaceChildren();
 const max=currentMax();
 el('trainingCount').textContent='ক্লাস ১–'+bn(max);
 el('connectedCount').textContent=bn([...videos.values()].filter(v=>v.type!=='external').length)+'টি প্লেয়ার লিংক';
 for(let i=1;i<=max;i++){
  const entry=videos.get(i),name=entry?.title||'হিজামা ক্লাস '+bn(i);
  if(q&&!(String(i)+' '+bn(i)+' '+name).toLowerCase().includes(q))continue;
  const btn=document.createElement('button');btn.type='button';btn.className='training-lesson';
  btn.setAttribute('role','listitem');
  if(i===number)btn.classList.add('selected');
  const index=document.createElement('span');index.className='training-lesson-number';
  index.textContent=bn(i).padStart(3,'০');
  const caption=document.createElement('span');caption.className='training-lesson-copy';
  const strong=document.createElement('strong');strong.textContent=name;
  const small=document.createElement('small');
  small.textContent=entry?(entry.type==='external'?'বাইরের লিংক':'ভিডিও সংযুক্ত'):'লিংক সংযুক্ত হয়নি';
  caption.append(strong,small);btn.append(index,caption);
  btn.addEventListener('click',()=>play(i,true));frag.append(btn);
 }
 list.append(frag);
}
async function setupHls(url){
 if(player.canPlayType('application/vnd.apple.mpegurl')){player.src=url;return}
 if(!window.Hls){
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
   script.onload=resolve;script.onerror=()=>reject(Error('HLS লাইব্রেরি পাওয়া যায়নি।'));
   document.head.append(script);
  });
 }
 if(!window.Hls?.isSupported())throw Error('এই ব্রাউজারে HLS সাপোর্ট করছে না।');
 hls=new window.Hls({enableWorker:true});
 hls.loadSource(url);hls.attachMedia(player);
 await new Promise((resolve,reject)=>{
  hls.once(window.Hls.Events.MANIFEST_PARSED,resolve);
  hls.once(window.Hls.Events.ERROR,(_,data)=>{if(data?.fatal)reject(Error('HLS স্ট্রিম পাওয়া যায়নি।'))});
 });
}
async function play(i,auto=false){
 if(!authenticated||!Number.isInteger(i)||i<1||i>currentMax())return;
 number=i;try{localStorage.setItem('hijama-training-last',String(i))}catch{}
 const entry=videos.get(i);
 el('nowTitle').textContent=entry?.title||'হিজামা ক্লাস '+bn(i);
 el('nowMeta').textContent='ক্লাস '+bn(i)+' / '+bn(currentMax());
 draw();clearVideo();
 if(!entry){showPlaceholder('ক্লাস '+bn(i)+'-এর ভিডিও এখনো সংযুক্ত হয়নি',
  'Telegram-এর আলাদা ভিডিও পোস্টের লিংক বা সরাসরি MP4/HLS স্ট্রিম প্রয়োজন। চ্যানেল লিংক দিয়ে প্লেয়ার অটো-সিঙ্ক হয় না।',sourceFolder);return}
 if(entry.type==='external'){showPlaceholder('এই ভিডিওটি অন্য সাইটে রয়েছে',
  'বাইরের ওয়েবসাইটের ভিডিও শেষ হওয়ার ঘটনা এখানে পাওয়া যায় না, তাই autoplay সম্ভব নয়।',entry.url);return}
 placeholder.hidden=true;player.hidden=false;
 try{
  if(entry.type==='hls')await setupHls(entry.url);else player.src=entry.url;
  if(auto)await player.play();
  notice.textContent='ভিডিও শেষ হলে সংযুক্ত পরের ক্লাস স্বয়ংক্রিয়ভাবে শুরু হবে।';
 }catch(err){showPlaceholder('ভিডিও চালু হয়নি','উৎসের অনুমতি, URL বা ভিডিওর ফরম্যাট পরীক্ষা করুন। '+err.message,entry.url)}
}
function nextPlayable(){
 return [...videos.values()].filter(v=>v.number>number&&(v.type==='mp4'||v.type==='hls'))
  .sort((a,b)=>a.number-b.number)[0]?.number||null;
}
player.addEventListener('ended',()=>{const next=nextPlayable();if(next)play(next,true);else notice.textContent='সংযুক্ত সব ক্লাস শেষ।'});
player.addEventListener('error',()=>{if(!player.hidden)showPlaceholder('ভিডিও পাওয়া যায়নি','সরাসরি ভিডিও লিংক বর্তমানে কাজ করছে না।',videos.get(number)?.url)});
el('videoSearch').addEventListener('input',draw);
el('previousClass').addEventListener('click',()=>play(Math.max(1,number-1),true));
el('nextClass').addEventListener('click',()=>play(Math.min(currentMax(),number+1),true));
async function refresh(){
 const data=await request('/api/hijama-training-videos');
 videos=new Map((data.videos||[]).map(x=>[x.number,x]));
 minimumClasses=Math.max(137,Number(data.minimumClasses)||137);
 setLinks(data.sourceShare);
 draw();
 const selected=number||((last>0&&last<=currentMax())?last:1);
 await play(selected,false);
 notice.textContent=data.notice||'সরাসরি MP4/HLS ভিডিও লিংক দিলে এখানে চালু হবে।';
}
async function syncNewClasses(){
 if(!authenticated||catalogSyncBusy||document.hidden)return;
 catalogSyncBusy=true;
 try{
  const data=await request('/api/hijama-training-videos');
  const incoming=Array.isArray(data.videos)?data.videos:[];
  const nextMinimum=Math.max(137,Number(data.minimumClasses)||137);
  const hasChanges=nextMinimum!==minimumClasses||incoming.length!==videos.size||
   incoming.some(v=>{
    const old=videos.get(v.number);
    return !old||old.url!==v.url||old.title!==v.title||old.type!==v.type;
   });
  if(hasChanges){
   const previousMax=currentMax();
   videos=new Map(incoming.map(v=>[v.number,v]));
   minimumClasses=nextMinimum;
   setLinks(data.sourceShare);
   draw();
   if(currentMax()>previousMax){
    notice.textContent='নতুন ক্লাস '+bn(previousMax+1)+'–'+bn(currentMax())+' প্লেলিস্টে যোগ হয়েছে।';
   }
  }
 }catch(error){console.warn('Training catalog refresh unavailable:',error?.message);}
 finally{catalogSyncBusy=false;}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncNewClasses()});
window.setInterval(syncNewClasses,60000);
function setAuth(ok){
 authenticated=ok;lock.hidden=ok;work.hidden=!ok;el('logout').hidden=!ok;
 admin.hidden=!ok||!adminMode;
 if(ok)refresh().catch(e=>notice.textContent=e.message);
 else{clearVideo();videos.clear();number=0;list.replaceChildren();}
}
el('loginForm').addEventListener('submit',async ev=>{
 ev.preventDefault();const btn=el('loginButton');btn.disabled=true;
 try{
  await request('/api/hijama-training-auth',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({password:el('passcode').value})});
  el('passcode').value='';el('loginMessage').textContent='';setAuth(true);
 }catch(e){el('loginMessage').textContent=e.message}
 finally{btn.disabled=false}
});
el('logout').addEventListener('click',async()=>{
 await request('/api/hijama-training-auth',{method:'DELETE'}).catch(()=>{});
 setAuth(false);
});
el('videoAdminForm').addEventListener('submit',async ev=>{
 ev.preventDefault();if(!authenticated)return;
 const form=new FormData(ev.currentTarget);
 const item={number:Number(form.get('number')),title:String(form.get('title')||''),
  url:String(form.get('url')||''),type:String(form.get('type')||'')};
 try{
  await request('/api/hijama-training-videos',{method:'POST',headers:{
   'Content-Type':'application/json','x-hijama-catalog-admin':String(form.get('adminCode')||'')},
   body:JSON.stringify(item)});
  el('trainingAdminStatus').textContent='ক্লাস '+bn(item.number)+' সংরক্ষণ হয়েছে।';
  await refresh();
 }catch(err){el('trainingAdminStatus').textContent=err.message}
});
request('/api/hijama-training-auth').then(d=>setAuth(!!d.authenticated)).catch(()=>setAuth(false));
})();
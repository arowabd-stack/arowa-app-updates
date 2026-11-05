(()=>{
'use strict';
const el=id=>document.getElementById(id);
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const lock=el('lockScreen'),work=el('trainingWorkspace'),player=el('trainingPlayer'),
 placeholder=el('trainingPlaceholder'),list=el('videoList'),notice=el('trainingNotice');
const source=el('sourceLink'),admin=el('trainingAdmin');
const telegramPanel=el('trainingTelegramPanel'),telegramFrame=el('trainingTelegramFrame'),telegramLink=el('trainingTelegramLink'),telegramWebLink=el('trainingTelegramWebLink'),downloadButton=el('offlineDownload');
let videos=new Map(),number=0,hls=null,sourceFolder='',authenticated=false,minimumClasses=137,catalogSyncBusy=false;
const localFiles=new Map();let duplicateSerials=new Set(),activeObjectUrl=null,activePlaybackKey='';
let last=0;try{last=Number(localStorage.getItem('hijama-training-last')||0)}catch{}
const progressKey='hijama-training-playback-position-v1';
let savedPositions={};try{
 const stored=JSON.parse(localStorage.getItem(progressKey)||'{}');
 if(stored&&typeof stored==='object'&&!Array.isArray(stored))savedPositions=stored;
}catch{}
let progressSavedAt=0;
function saveNativeProgress(finished=false){
 const entry=videos.get(number);
 if(!activePlaybackKey)return;
 const time=Number(player.currentTime)||0;
 if(!finished&&(Date.now()-progressSavedAt)<2500)return;
 progressSavedAt=Date.now();
 savedPositions[number]={time:finished?0:time,url:activePlaybackKey,updatedAt:Date.now()};
 try{localStorage.setItem(progressKey,JSON.stringify(savedPositions))}catch{}
}
player.addEventListener('timeupdate',()=>saveNativeProgress(false));
player.addEventListener('pause',()=>saveNativeProgress(true===player.ended));
player.addEventListener('loadedmetadata',()=>{
 const entry=videos.get(number),saved=savedPositions[number];
 if(saved&&saved.url===activePlaybackKey&&saved.time>5&&player.duration&&saved.time<player.duration-5){
  try{player.currentTime=saved.time}catch{}
 }
});
const adminMode=new URLSearchParams(location.search).get('admin')==='1';
const localStatus=el('trainingLocalStatus');
const videoExt=/\.(mp4|m4v|mov|webm|mkv)$/i;
const normalizeDigits=text=>String(text).replace(/[০-৯]/g,c=>String(c.charCodeAt(0)-2534));
function serialFromFile(file){
 if(!file||!file.size||!videoExt.test(file.name))return null;
 const m=/^(\d{1,3})(?=[\s._-]|$)/.exec(normalizeDigits(file.name));
 const n=m?Number(m[1]):0;
 return n>=1&&n<=137?n:null;
}
function localKey(file){return 'local:'+file.name+':'+file.size+':'+file.lastModified;}
function setLocalStatus(message){
 if(localStatus)localStatus.textContent=message;
 el('trainingClearLocal').hidden=!localFiles.size&&!duplicateSerials.size;
}
function updateLocalFiles(files){
 const grouped=new Map();let ignored=0;
 for(const file of files){
  const serial=serialFromFile(file);
  if(!serial){ignored++;continue}
  const group=grouped.get(serial)||[];group.push(file);grouped.set(serial,group);
 }
 localFiles.clear();duplicateSerials=new Set();
 for(const [serial,group] of grouped){
  if(group.length===1)localFiles.set(serial,group[0]);
  else duplicateSerials.add(serial);
 }
 const details=bn(localFiles.size)+'টি ভিডিও মিলেছে।'+(duplicateSerials.size?' '+bn(duplicateSerials.size)+'টি ক্লাসে একাধিক ফাইল; অনুমান করে বেছে নেওয়া হয়নি।':'')+(ignored?' '+bn(ignored)+'টি ফাইল বাদ দেওয়া হয়েছে।':'');
 setLocalStatus(details+' ভিডিও সরাসরি এই ডিভাইস থেকে চলবে, কোনো আপলোড হবে না।');
 draw();
 const target=localFiles.has(number)?number:[...localFiles.keys()].sort((a,b)=>a-b)[0];
 if(target)play(target,false);
}
el('trainingLocalFolder').addEventListener('change',e=>{
 if(!authenticated)return;
 updateLocalFiles(Array.from(e.target.files||[]));
 e.target.value='';
});
el('trainingLocalClassButton').addEventListener('click',()=>el('trainingLocalClassFile').click());
el('trainingLocalClassFile').addEventListener('change',e=>{
 if(!authenticated)return;
 const file=e.target.files?.[0];
 e.target.value='';
 if(!file)return;
 if(!file.size||!videoExt.test(file.name)){setLocalStatus('ভিডিও ফাইলটি খালি বা সমর্থিত নয়। MP4, WebM, MOV, M4V বা MKV দিন।');return;}
 const selected=number||last||1;
 localFiles.set(selected,file);duplicateSerials.delete(selected);
 setLocalStatus('ক্লাস '+bn(selected)+'-এর লোকাল ভিডিও নির্বাচন করা হয়েছে: '+file.name);
 draw();play(selected,false);
});
el('trainingClearLocal').addEventListener('click',()=>{
 localFiles.clear();duplicateSerials.clear();
 setLocalStatus('লোকাল ভিডিওর তালিকা খালি হয়েছে। আবার ফোল্ডার বেছে নিতে পারবেন।');
 if(number)play(number,false);else draw();
});
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
 if(activePlaybackKey)saveNativeProgress(false);
 try{player.pause()}catch{}
 if(hls){try{hls.destroy()}catch{}hls=null}
 player.removeAttribute('src');player.load();
 if(activeObjectUrl){URL.revokeObjectURL(activeObjectUrl);activeObjectUrl=null;}
 activePlaybackKey='';
 if(telegramPanel){telegramPanel.hidden=true;telegramFrame.src='about:blank';}
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
 el('connectedCount').textContent=bn(videos.size)+'টি ক্লাস · '+bn(localFiles.size)+'টি অফলাইন';
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
  small.textContent=localFiles.has(i)?'ডিভাইসের ভিডিও · অফলাইন':duplicateSerials.has(i)?'একাধিক ফাইল · আলাদা বাছুন':entry?(entry.type==='external'?'Telegram পোস্ট':'ভিডিও ফাইল সংযুক্ত'):'লিংক সংযুক্ত হয়নি';
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
 // Save old position against its original class before switching to the new class.
 clearVideo();
 number=i;try{localStorage.setItem('hijama-training-last',String(i))}catch{}
 const entry=videos.get(i);
 el('nowTitle').textContent=entry?.title||'হিজামা ক্লাস '+bn(i);
 el('nowMeta').textContent='ক্লাস '+bn(i)+' / '+bn(currentMax());
 draw();
 const localFile=localFiles.get(i);
 downloadButton.disabled=!!localFile||!entry||entry.type!=='mp4';
 downloadButton.title=localFile?'ভিডিওটি আগেই আপনার ডিভাইসে আছে।':downloadButton.disabled?'Telegram পোস্টের ফাইল এই ওয়েবসাইট থেকে অফলাইনে ডাউনলোড করা যায় না।':'এই MP4 ভিডিওটি ডিভাইসে ডাউনলোড করুন';
 if(localFile){
  placeholder.hidden=true;player.hidden=false;
  activeObjectUrl=URL.createObjectURL(localFile);
  activePlaybackKey=localKey(localFile);
  player.src=activeObjectUrl;
  if(auto){try{await player.play()}catch(e){notice.textContent='অটোপ্লে আটকে গেছে; ভিডিওতে Play চাপুন।';return;}}
  notice.textContent='এই ক্লাসটি আপনার ডিভাইস থেকে অফলাইনে চলবে। শেষ হলে পরের নম্বরের লোকাল ভিডিও চালু হবে; মাঝের ফাইল না থাকলে থামবে।';
  return;
 }
 if(!entry){showPlaceholder('ক্লাস '+bn(i)+'-এর ভিডিও এখনো সংযুক্ত হয়নি',
  'Telegram-এর আলাদা ভিডিও পোস্টের লিংক বা সরাসরি MP4/HLS স্ট্রিম প্রয়োজন। চ্যানেল লিংক দিয়ে প্লেয়ার অটো-সিঙ্ক হয় না।',sourceFolder);return}
 if(entry.type==='external'){
  // The official Telegram embed is confined to the exact public channel supplied by the owner.
  const match=entry.url.match(/^https:\/\/t\.me\/hijamatranigvideos\/([1-9][0-9]*)$/);
  if(match){
   placeholder.hidden=true;player.hidden=true;telegramPanel.hidden=false;
   telegramLink.href=entry.url;
   if(telegramWebLink)telegramWebLink.href='https://web.telegram.org/k/#@hijamatranigvideos?post='+match[1];
   telegramFrame.title='ক্লাস '+bn(i)+' Telegram পোস্ট';
   telegramFrame.src=entry.url+'?embed=1';
   notice.textContent='Telegram পোস্টের ভিডিও এখানে চালানো সম্ভব হলে প্লে করুন। না চললে নিচের “ভিডিওটি Telegram-এ খুলুন” ব্যবহার করুন। Telegram embed-এর ভিডিও শেষ হলে স্বয়ংক্রিয়ভাবে পরের ক্লাস চালানো সম্ভব নয়।';
   return;
  }
  showPlaceholder('এই ভিডিওটি অন্য সাইটে রয়েছে',
   'বাইরের ওয়েবসাইটের ভিডিওর শেষ হওয়ার তথ্য পাওয়া যায় না, তাই স্বয়ংক্রিয়ভাবে পরের ক্লাস চলে না।',entry.url);return;
 }
 placeholder.hidden=true;player.hidden=false;
 activePlaybackKey=entry.url;
 try{
  if(entry.type==='hls')await setupHls(entry.url);else player.src=entry.url;
  if(auto)await player.play();
  notice.textContent='ভিডিও শেষ হলে সংযুক্ত পরের ক্লাস স্বয়ংক্রিয়ভাবে শুরু হবে।';
 }catch(err){showPlaceholder('ভিডিও চালু হয়নি','উৎসের অনুমতি, URL বা ভিডিওর ফরম্যাট পরীক্ষা করুন। '+err.message,entry.url)}
}
function nextPlayable(){
 if(activePlaybackKey.startsWith('local:'))return localFiles.has(number+1)?number+1:null;
 return [...videos.values()].filter(v=>v.number>number&&(v.type==='mp4'||v.type==='hls'))
  .sort((a,b)=>a.number-b.number)[0]?.number||null;
}
player.addEventListener('ended',()=>{saveNativeProgress(true);const wasLocal=activePlaybackKey.startsWith('local:');const next=nextPlayable();if(next)play(next,true);else notice.textContent=wasLocal&&number<currentMax()?'পরের ক্লাস '+bn(number+1)+'-এর লোকাল ফাইল নেই। আগে সেটি নির্বাচন করুন।':'সংযুক্ত সব ক্লাস শেষ।'});
player.addEventListener('error',()=>{if(!player.hidden)showPlaceholder('ভিডিও পাওয়া যায়নি','সরাসরি ভিডিও লিংক বর্তমানে কাজ করছে না।',videos.get(number)?.url)});
el('videoSearch').addEventListener('input',draw);
downloadButton.addEventListener('click',async()=>{
 const entry=videos.get(number);
 if(!entry||entry.type!=='mp4'||!/^https:\/\//.test(entry.url))return;
 downloadButton.disabled=true;downloadButton.textContent='ডাউনলোড হচ্ছে…';
 try{
  const response=await fetch(entry.url,{mode:'cors'});
  if(!response.ok)throw Error('ভিডিও ফাইল পাওয়া যায়নি (HTTP '+response.status+')');
  const bytes=Number(response.headers.get('content-length'))||0;
  if(bytes>600*1024*1024)throw Error('ভিডিওটি ৬০০ MB-এর বেশি; সরাসরি সোর্স থেকে ডাউনলোড করুন।');
  const blob=await response.blob();
  const href=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=href;a.download='Hijama-Class-'+number+(entry.url.toLowerCase().includes('.webm')?'.webm':'.mp4');
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),30000);
  notice.textContent='ক্লাস '+bn(number)+'-এর ভিডিও ফাইল ডাউনলোডের জন্য প্রস্তুত।';
 }catch(e){
  notice.textContent='অফলাইন ফাইল ডাউনলোড করা যায়নি: '+e.message;
 }
 finally{downloadButton.disabled=false;downloadButton.textContent='অফলাইন ডাউনলোড';}
});
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
 else{clearVideo();videos.clear();localFiles.clear();duplicateSerials.clear();setLocalStatus('লোকাল ভিডিওর তালিকা খালি হয়েছে। আবার লগইন করে ফোল্ডার বেছে নিন।');number=0;list.replaceChildren();}
}
el('loginForm').addEventListener('submit',async ev=>{
 ev.preventDefault();const btn=el('loginButton');btn.disabled=true;
 try{
  await request('/api/hijama-training-auth',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({password:el('passcode').value,remember:el('rememberDevice').checked})});
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
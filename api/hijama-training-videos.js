import {list,put} from '@vercel/blob';
import {telegramLessons} from '../lib/hijama-training-telegram-catalog.js';
import {createHmac,timingSafeEqual} from 'node:crypto';
const folder='hijama/training/catalog/';
const sourceShare='https://t.me/hijamatranigvideos';
const json=(res,status,value)=>res.status(status).setHeader('Cache-Control','private, no-store').setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(value));
const safeEqual=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const sign=x=>createHmac('sha256',process.env.HIJAMA_TRAINING_SESSION_KEY||'').update(x).digest('hex');
function isAuthenticated(req){
 const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('hijama_training_session='))?.split('=')[1];
 if(!raw||!process.env.HIJAMA_TRAINING_SESSION_KEY)return false;
 const [until,signature,extra]=raw.split('.');
 return !extra&&/^[a-z0-9]+$/.test(until||'')&&/^[a-f0-9]{64}$/.test(signature||'')&&parseInt(until,36)>Date.now()&&safeEqual(signature,sign(until));
}
const editor=req=>safeEqual(req.headers['x-hijama-catalog-admin'],process.env.HIJAMA_ADMIN_UPLOAD_KEY||'');
async function scan(){
 let rows=[],cursor;
 do{
  const p=await list({prefix:folder,limit:100,cursor});
  rows.push(...p.blobs);
  cursor=p.hasMore?p.cursor:undefined;
 }while(cursor&&rows.length<500);
 return rows.slice(0,500);
}
async function readItem(row){
 try{
  const r=await fetch(row.url+(row.url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'});
  return r.ok?await r.json():null;
 }catch{return null;}
}
async function readAll(){
 const files=await scan();
 const result=await Promise.all(files.map(readItem));
 const unique=new Map();
 for(const item of result){
  if(!item||!Number.isInteger(item.number)||item.number<1||item.number>1000)continue;
  if(!['mp4','hls','external'].includes(item.type)||typeof item.url!=='string')continue;
  unique.set(item.number,{number:item.number,title:String(item.title||('হিজামা ক্লাস '+item.number)).slice(0,120),url:item.url,type:item.type});
 }
 return [...unique.values()].sort((a,b)=>a.number-b.number);
}
export default async function handler(req,res){
 if(!isAuthenticated(req))return json(res,401,{error:'প্রশিক্ষণ ভিডিও দেখতে প্রথমে পাসওয়ার্ড দিন।'});
 if(req.method==='GET'){
  try{
   // Published owner-supplied Telegram post links work as the baseline catalog.
   // Authenticated cloud items override a class, e.g. when a direct MP4/HLS is available.
   const merged=new Map(telegramLessons.map(item=>[item.number,item]));
   if(process.env.BLOB_READ_WRITE_TOKEN){
    try{
     for(const item of await readAll())merged.set(item.number,item);
    }catch(storageError){
     console.warn('Using published Telegram catalog due to cloud lookup failure',storageError?.message);
    }
   }
   const videos=[...merged.values()].sort((a,b)=>a.number-b.number);
   return json(res,200,{videos,minimumClasses:137,sourceShare,autoSync:false,
     notice:'১–১৩৭টি Telegram পোস্ট যুক্ত আছে। ক্লাস খুললে পোস্টের ভিডিও এখানে দেখার চেষ্টা করবে; Telegram-এর সীমাবদ্ধতায় কোনো ভিডিও না চললে সরাসরি পোস্ট লিংক ব্যবহার করুন। Telegram embed-এ স্বয়ংক্রিয়ভাবে পরের ভিডিও চালানো সম্ভব নয়।'});
  }catch(e){console.error('Hijama videos list failed',e?.message);return json(res,502,{error:'ভিডিও তালিকা লোড করা যায়নি।'});}
 }
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return json(res,503,{error:'ভিডিও তালিকায় পরিবর্তন করার ক্লাউড সংযোগ নেই।'});
 if(!editor(req))return json(res,403,{error:'ভিডিও তালিকায় পরিবর্তন করতে আলাদা প্রশাসক কোড প্রয়োজন।'});
 if(req.headers.origin){
  try{if(new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Invalid origin'})}catch{return json(res,403,{error:'Invalid origin'})}
 }
 const data=typeof req.body==='object'&&req.body?req.body:{};
 const number=Number(data.number);
 const title=typeof data.title==='string'?data.title.trim():'';
 const url=typeof data.url==='string'?data.url.trim():'';
 const type=data.type;
 if(!Number.isInteger(number)||number<1||number>1000||title.length<2||title.length>120
  ||url.length>1600||!['mp4','hls','external'].includes(type))
  return json(res,400,{error:'ক্লাস নম্বর, নাম, লিংক এবং ভিডিওর ধরন ঠিক করুন।'});
 let parsed;try{parsed=new URL(url)}catch{return json(res,400,{error:'সঠিক HTTPS ভিডিও লিংক দিন।'})}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password)return json(res,400,{error:'শুধু HTTPS লিংক গ্রহণযোগ্য।'});
 if(type==='mp4'&&!/\.mp4(?:$|[?#])|\.webm(?:$|[?#])/i.test(parsed.pathname+parsed.search))return json(res,400,{error:'MP4/WebM ভিডিওর সরাসরি লিংক দিন, শেয়ার ফোল্ডারের URL নয়।'});
 if(type==='hls'&&!/\.m3u8(?:$|[?#])/i.test(parsed.pathname+parsed.search))return json(res,400,{error:'HLS .m3u8 প্লেলিস্টের সরাসরি লিংক দিন।'});
 const item={number,title,url,type,updatedAt:new Date().toISOString()};
 try{
  await put(folder+'lesson-'+String(number).padStart(3,'0')+'.json',JSON.stringify(item),{
   access:'public',contentType:'application/json',addRandomSuffix:false,
   allowOverwrite:true,cacheControlMaxAge:60
  });
  return json(res,200,{ok:true,item});
 }catch(e){console.error('Hijama video update failed',e?.message);return json(res,502,{error:'ভিডিও লিংক সংরক্ষণ করা যায়নি।'});}
}

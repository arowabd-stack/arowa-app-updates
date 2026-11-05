import {list,put,del} from '@vercel/blob';
import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';

// Replies to questions submitted after the curated Q84 list.
// Public readers can reply; only server-authorized staff can post "হিজামা ওয়েবসাইট" replies.
const ROOT='hijama/reader-replies/';
const QUESTIONS='hijama/reader-questions/';
const NOTIFICATIONS='hijama/reader-notifications/';
const MAX_SCAN=350,MAX_DISPLAY=120;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const validId=id=>typeof id==='string'&&UUID.test(id);
const clean=s=>typeof s==='string'?s.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,''):'';
const spam=s=>/https?:\/\/|www\.|<[^>]*>|(?:\b(?:telegram|whatsapp)\b).{0,15}\d{6}/i.test(s);
const safe=(res,status,data)=>res.status(status)
 .setHeader('Content-Type','application/json; charset=utf-8')
 .setHeader('Cache-Control','private, no-store')
 .setHeader('X-Content-Type-Options','nosniff')
 .end(JSON.stringify(data));
function isStaff(req){
 const token=req.headers['x-hijama-admin-key'];
 const secret=process.env.HIJAMA_MODERATOR_KEY;
 if(typeof secret!=='string'||secret.length<24||typeof token!=='string')return false;
 if(token.length!==secret.length)return false;
 return timingSafeEqual(Buffer.from(token,'utf8'),Buffer.from(secret,'utf8'));
}
function ownerHash(req){
 const token=req.headers['x-hijama-edit-key'];
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
 return createHash('sha256').update(token).digest('hex');
}
async function bodyOf(req){
 if(req.body&&typeof req.body==='object')return req.body;
 let raw='';
 for await(const chunk of req){raw+=chunk;if(raw.length>10000)throw Error('Request too long');}
 return JSON.parse(raw||'{}');
}
async function scan(prefix,max=MAX_SCAN){
 let cursor,blobs=[];
 do{
  const page=await list({prefix,limit:100,cursor});
  blobs.push(...page.blobs);
  cursor=page.hasMore?page.cursor:undefined;
 }while(cursor&&blobs.length<max);
 return blobs.slice(0,max).sort((a,b)=>+new Date(b.uploadedAt)-+new Date(a.uploadedAt));
}
async function read(ref){
 try{
  const u=ref.url+(ref.url.includes('?')?'&':'?')+'revision='+Date.now();
  const result=await fetch(u,{cache:'no-store'});
  return result.ok?await result.json():null;
 }catch{return null;}
}
async function activeQuestion(id){
 const refs=await scan(QUESTIONS+id+'/',40);
 if(!refs.length)return false;
 const rows=await Promise.all(refs.map(read));
 const newest=rows.find(r=>r&&r.id===id);
 return newest&&!newest.deleted?newest:null;
}
async function newestPost(q,id){
 const refs=await scan(ROOT+q+'/'+id+'/',35);
 if(!refs.length)return null;
 const posts=await Promise.all(refs.map(read));
 const newest=posts.find(p=>p&&p.id===id&&p.parentId===q);
 return newest?{row:newest,refs}:null;
}
const publicPost=(row,hash,staff)=>({
 id:row.id,parentId:row.parentId,name:row.official?'হিজামা ওয়েবসাইট':row.name,
 answer:row.answer,official:!!row.official,createdAt:row.createdAt,updatedAt:row.updatedAt||row.createdAt,
 ownerId:row.official?'official':row.ownerId||'legacy-'+row.id,
 mine:row.official?staff:!!(hash&&row.ownerHash===hash)
});
const options={access:'public',contentType:'application/json',addRandomSuffix:false,cacheControlMaxAge:60};
async function save(q,id,row){
 return put(ROOT+q+'/'+id+'/'+randomUUID()+'.json',JSON.stringify(row),options);
}
async function cleanup(refs){
 if(!refs?.length)return;
 try{await del(refs.map(r=>r.url));}
 catch(e){console.error('Reply cleanup failed',e?.message);}
}
export default async function handler(req,res){
 if(!process.env.BLOB_READ_WRITE_TOKEN)return safe(res,503,{error:'উত্তর সংরক্ষণের সার্ভার প্রস্তুত নয়।'});
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return safe(res,405,{error:'Method not allowed'});
 const staff=isStaff(req),hash=ownerHash(req);
 const parent=req.method==='GET'?req.query.question:undefined;
 if(req.method==='GET'){
  if(!validId(parent))return safe(res,400,{error:'প্রশ্নটি পাওয়া যায়নি।'});
  try{
   const refs=await scan(ROOT+parent+'/');
   const decoded=await Promise.all(refs.slice(0,MAX_DISPLAY).map(read));
   const used=new Set(),replies=[];
   for(const row of decoded){
    if(!row||row.parentId!==parent||!validId(row.id)||used.has(row.id))continue;
    used.add(row.id);
    if(row.deleted||typeof row.answer!=='string')continue;
    replies.push(publicPost(row,hash,staff));
   }
   replies.sort((a,b)=>Number(b.official)-Number(a.official)||Date.parse(a.createdAt)-Date.parse(b.createdAt));
   return safe(res,200,{replies,more:refs.length>MAX_DISPLAY,admin:staff});
  }catch(e){console.error('Reader replies list failed',e?.message);return safe(res,502,{error:'উত্তর লোড করা যায়নি।'});}
 }
 const origin=req.headers.origin;
 if(origin){
  try{if(new URL(origin).host!==req.headers.host)return safe(res,403,{error:'Origin rejected'});}
  catch{return safe(res,403,{error:'Origin rejected'});}
 }
 let data;try{data=await bodyOf(req);}catch{return safe(res,400,{error:'অবৈধ তথ্য পাঠানো হয়েছে।'});}
 if(data.website)return safe(res,200,{ok:true});
 const q=data.question;
 if(!validId(q))return safe(res,400,{error:'অবৈধ প্রশ্ন।'});
 const official=data.official===true;
 if(req.method==='POST'&&official&&!staff)return safe(res,403,{error:'ওয়েবসাইটের পরিচয়ে উত্তর দিতে কর্তৃপক্ষের কোড প্রয়োজন।'});
 if(req.method==='POST'&&!official&&!hash)return safe(res,401,{error:'এই ব্রাউজারে লেখকের পরিচয় পাওয়া যায়নি।'});
 const answer=clean(data.answer);
 if(req.method!=='DELETE'&&(answer.length<4||answer.length>1500||spam(answer)))
  return safe(res,400,{error:'উত্তর ৪–১৫০০ অক্ষরের হতে হবে; লিংক বা বিজ্ঞাপন নয়।'});
 try{
  if(req.method==='POST'){
   const question=await activeQuestion(q);
   if(!question)return safe(res,404,{error:'মূল প্রশ্নটি আর পাওয়া যাচ্ছে না।'});
   const name=official?'হিজামা ওয়েবসাইট':clean(data.name);
   if(!official&&(name.length<2||name.length>70||spam(name)||
       /^(হিজামা\s*ওয়েবসাইট|ওয়েবসাইট\s*কর্তৃপক্ষ|hijama\s*website|official\s*admin)$/i.test(name)))
    return safe(res,400,{error:'নাম ২–৭০ অক্ষরের দিন এবং কর্তৃপক্ষের নাম ব্যবহার করবেন না।'});
   const existing=await scan(ROOT+q+'/',180);
   const seen=await Promise.all(existing.slice(0,90).map(read));
   const previous=seen.find(r=>r&&!r.deleted&&!r.official&&r.ownerHash===hash);
   const previousCount=seen.filter(r=>r&&!r.deleted&&r.ownerHash===hash&&!r.official).length;
   if(!official&&previousCount>=15)return safe(res,429,{error:'এই প্রশ্নে সর্বোচ্চ ১৫টি উত্তর দিতে পারবেন।'});
   const now=new Date().toISOString();
   const row={id:randomUUID(),parentId:q,answer,name:official?'হিজামা ওয়েবসাইট':previous?.name||name,
    official,createdAt:now,updatedAt:now,
    ownerHash:official?null:hash,ownerId:official?'official':hash.slice(0,24)};
   await save(q,row.id,row);
   // Notify the question author only when another person (or verified staff) replies.
   // A reply stays saved if notification delivery has a transient failure.
   if(question.ownerHash&&(official||question.ownerHash!==hash)){
    try{
     const notice={id:randomUUID(),questionId:q,replyId:row.id,
      from:row.name,official:!!official,createdAt:now,
      question:typeof question.question==='string'?question.question.slice(0,140):'',
      preview:answer.slice(0,170)};
     await put(NOTIFICATIONS+question.ownerHash+'/'+notice.id+'.json',
      JSON.stringify(notice),options);
    }catch(noticeError){
     console.error('Reader reply notification failed',noticeError?.message);
    }
   }
   return safe(res,201,{ok:true,reply:publicPost(row,hash,staff)});
  }
  if(!validId(data.id))return safe(res,400,{error:'অবৈধ উত্তরের নম্বর।'});
  const current=await newestPost(q,data.id);
  if(!current||current.row.deleted)return safe(res,404,{error:'উত্তরটি পাওয়া যায়নি।'});
  if(current.row.official&&!staff)return safe(res,403,{error:'শুধু ওয়েবসাইট কর্তৃপক্ষ এই উত্তর পরিবর্তন করতে পারবেন।'});
  if(!current.row.official&&(!hash||hash!==current.row.ownerHash))return safe(res,403,{error:'শুধু নিজের উত্তর পরিবর্তন বা মুছতে পারবেন।'});
  if(req.method==='PATCH'){
   const updated={...current.row,answer,updatedAt:new Date().toISOString()};
   await save(q,data.id,updated);await cleanup(current.refs);
   return safe(res,200,{ok:true,reply:publicPost(updated,hash,staff)});
  }
  const deleted={id:data.id,parentId:q,deleted:true,updatedAt:new Date().toISOString(),
   ownerHash:current.row.ownerHash,ownerId:current.row.ownerId,official:current.row.official};
  await save(q,data.id,deleted);await cleanup(current.refs);
  return safe(res,200,{ok:true,deleted:true});
 }catch(e){console.error('Reader reply mutation failed',e?.message);
  return safe(res,502,{error:'উত্তর জমা দেওয়া যায়নি। আবার চেষ্টা করুন।'});}
}

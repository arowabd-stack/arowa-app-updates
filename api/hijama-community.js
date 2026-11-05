import {list,put,del} from '@vercel/blob';
import {createHash,randomUUID} from 'node:crypto';

// Anonymous edit keys are random 256-bit values stored in the writer's browser.
// Never grant edit access based on a display name.
const MAX_RESULTS=150;
const prefixFor=q=>'hijama/community/q'+q+'/';
const validQuestion=q=>Number.isInteger(q)&&q>=1&&q<=84;
const validId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id);
const safe=s=>typeof s==='string'?s.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,''):'';
const unsafe=s=>/https?:\/\/|www\.|<[^>]*>|(?:\b(?:telegram|whatsapp)\b).{0,15}\d{6}/i.test(s);
const json=(res,status,payload)=>res.status(status)
 .setHeader('Content-Type','application/json; charset=utf-8')
 .setHeader('Cache-Control','private, no-store')
 .setHeader('X-Content-Type-Options','nosniff')
 .end(JSON.stringify(payload));
const editorHash=req=>{
 const key=req.headers['x-hijama-edit-key'];
 if(typeof key!=='string'||!/^[a-f0-9]{64}$/.test(key))return null;
 return createHash('sha256').update(key).digest('hex');
};
const readBody=async req=>{
 if(req.body&&typeof req.body==='object')return req.body;
 let body='';
 for await(const part of req){body+=part;if(body.length>10000)throw Error('TOO_LARGE');}
 return JSON.parse(body||'{}');
};
async function getAll(prefix,max=320){
 let cursor;const records=[];
 do{
  const page=await list({prefix,limit:100,cursor});
  records.push(...page.blobs);
  cursor=page.hasMore?page.cursor:undefined;
 }while(cursor&&records.length<max);
 return records.slice(0,max);
}
const sorted=records=>records.sort((a,b)=>Date.parse(b.uploadedAt||0)-Date.parse(a.uploadedAt||0));
async function readBlob(entry){
 try{
  // A nonce avoids stale CDN representations after edits/deletes.
  const url=entry.url+(entry.url.includes('?')?'&':'?')+'r='+Date.now();
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)return null;
  const value=await response.json();
  return value&&typeof value==='object'?value:null;
 }catch{return null;}
}
const options={access:'public',contentType:'application/json',addRandomSuffix:false,cacheControlMaxAge:60};
function visible(row,hash){
 return {id:row.id,question:row.question,name:row.name,answer:row.answer,
  createdAt:row.createdAt,updatedAt:row.updatedAt||row.createdAt,
  ownerId:row.ownerId||'legacy-'+row.id,
  mine:!!(hash&&row.ownerHash&&row.ownerHash===hash)};
}
async function getPost(q,id){
 const entries=sorted(await getAll(prefixFor(q)+id+'/',40));
 if(!entries.length)return null;
 const posts=await Promise.all(entries.map(readBlob));
 const row=posts.find(p=>p&&p.id===id&&p.question===q);
 return row?{row,entries}:null;
}
async function writeVersion(q,id,payload){
 return put(prefixFor(q)+id+'/'+randomUUID()+'.json',JSON.stringify(payload),options);
}
async function cleanOld(entries){
 if(!entries?.length)return;
 try{await del(entries.map(entry=>entry.url));}catch(err){
  console.error('Hijama answer revision cleanup failed:',err?.message);
 }
}
export default async function handler(req,res){
 if(!process.env.BLOB_READ_WRITE_TOKEN)return json(res,503,{error:'উত্তর সংরক্ষণের ব্যবস্থা সাময়িকভাবে বন্ধ আছে।'});
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 const hash=editorHash(req);
 if(req.method==='GET'){
  const q=Number(req.query.q);
  if(!validQuestion(q))return json(res,400,{error:'Invalid question'});
  try{
   const records=sorted(await getAll(prefixFor(q),320));
   const candidates=records.slice(0,MAX_RESULTS);
   const decoded=await Promise.all(candidates.map(readBlob));
   const ids=new Set(),answers=[];
   for(let i=0;i<decoded.length;i++){
    const row=decoded[i];
    if(!row||!validId(row.id)||row.question!==q||ids.has(row.id))continue;
    ids.add(row.id);
    if(row.deleted||typeof row.answer!=='string'||typeof row.name!=='string')continue;
    answers.push(visible(row,hash));
   }
   return json(res,200,{answers,more:records.length>MAX_RESULTS});
  }catch(err){console.error('Hijama list failed:',err?.message);return json(res,502,{error:'উত্তর লোড করা যায়নি।'});}
 }
 // Mutations require a device-specific secret, not merely a person's name.
 if(!hash)return json(res,401,{error:'উত্তর সম্পাদনার পরিচয় পাওয়া যায়নি। এই ব্রাউজার থেকেই চেষ্টা করুন।'});
 const origin=req.headers.origin;
 if(origin){
  try{if(new URL(origin).host!==req.headers.host)return json(res,403,{error:'Origin rejected'});}
  catch{return json(res,403,{error:'Origin rejected'});}
 }
 let body;try{body=await readBody(req);}catch{return json(res,400,{error:'Invalid request'});}
 if(body.website)return json(res,200,{ok:true});
 const q=Number(body.question);
 if(!validQuestion(q))return json(res,400,{error:'Invalid question'});
 const answer=safe(body.answer);
 if(req.method!=='DELETE'&&(answer.length<4||answer.length>1500||unsafe(answer)))return json(res,400,{error:'উত্তর ৪–১৫০০ অক্ষরের হতে হবে এবং লিংক/বিজ্ঞাপন দেওয়া যাবে না।'});
 try{
  if(req.method==='POST'){
   const proposedName=safe(body.name);
   if(proposedName.length<2||proposedName.length>70||unsafe(proposedName))return json(res,400,{error:'সঠিক নাম লিখুন (২–৭০ অক্ষর)।'});
   // Preserve one consistent visible name for the writer's answers.
   const recent=sorted(await getAll(prefixFor(q),140)).slice(0,100);
   const prior=await Promise.all(recent.map(readBlob));
   const mine=prior.filter(r=>r&&r.ownerHash===hash&&!r.deleted);
   if(mine.length>=25)return json(res,429,{error:'এই প্রশ্নে সর্বোচ্চ ২৫টি উত্তর যোগ করা যাবে।'});
   const name=mine.length?mine[0].name:proposedName;
   const now=new Date().toISOString();
   const post={id:randomUUID(),question:q,name,answer,createdAt:now,updatedAt:now,ownerId:hash.slice(0,24),ownerHash:hash};
   await writeVersion(q,post.id,post);
   return json(res,201,{ok:true,answer:visible(post,hash)});
  }
  if(!validId(body.id))return json(res,400,{error:'Invalid answer ID'});
  const existing=await getPost(q,body.id);
  if(!existing||existing.row.deleted)return json(res,404,{error:'উত্তরটি পাওয়া যায়নি।'});
  if(!existing.row.ownerHash||existing.row.ownerHash!==hash)return json(res,403,{error:'শুধু নিজের উত্তর পরিবর্তন বা মুছতে পারবেন।'});
  if(req.method==='PATCH'){
   const updated={...existing.row,answer,updatedAt:new Date().toISOString()};
   await writeVersion(q,body.id,updated);
   await cleanOld(existing.entries);
   return json(res,200,{ok:true,answer:visible(updated,hash)});
  }
  // A tombstone prevents cached, previously published versions reappearing.
  await writeVersion(q,body.id,{id:body.id,question:q,deleted:true,ownerHash:hash,
   ownerId:existing.row.ownerId||hash.slice(0,24),updatedAt:new Date().toISOString()});
  await cleanOld(existing.entries);
  return json(res,200,{ok:true,deleted:true});
 }catch(err){
  console.error('Hijama mutation failed:',err?.message);
  return json(res,502,{error:'সংরক্ষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।'});
 }
}

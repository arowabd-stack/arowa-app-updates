import {list,put,del} from '@vercel/blob';
import {createHash,randomUUID} from 'node:crypto';

// Reader-submitted questions, displayed after question 84.
// Only an author holding the same browser's secret can edit or delete.
const ROOT='hijama/reader-questions/';
const MAX_SCAN=400,MAX_DISPLAY=120;
const goodId=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/i.test(x);
const trim=x=>typeof x==='string'?x.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,''):'';
const spam=x=>/https?:\/\/|www\.|<[^>]*>|(?:\b(?:telegram|whatsapp)\b).{0,15}\d{6}/i.test(x);
const json=(res,status,payload)=>res.status(status)
 .setHeader('Content-Type','application/json; charset=utf-8')
 .setHeader('Cache-Control','private, no-store')
 .setHeader('X-Content-Type-Options','nosniff').end(JSON.stringify(payload));
const owner=req=>{
 const token=req.headers['x-hijama-edit-key'];
 return typeof token==='string'&&/^[a-f0-9]{64}$/.test(token)
  ?createHash('sha256').update(token).digest('hex'):null;
};
async function readBody(req){
 if(req.body&&typeof req.body==='object')return req.body;
 let text='';
 for await(const chunk of req){text+=chunk;if(text.length>10000)throw Error('Request too large');}
 return JSON.parse(text||'{}');
}
async function scan(prefix=ROOT,maximum=MAX_SCAN){
 const all=[];let cursor;
 do{
  const page=await list({prefix,limit:100,cursor});
  all.push(...page.blobs);
  cursor=page.hasMore?page.cursor:undefined;
 }while(cursor&&all.length<maximum);
 return all.slice(0,maximum).sort((a,b)=>Date.parse(b.uploadedAt)-Date.parse(a.uploadedAt));
}
async function fetchBlob(ref){
 try{
  const response=await fetch(ref.url+(ref.url.includes('?')?'&':'?')+'r='+Date.now(),{cache:'no-store'});
  if(!response.ok)return null;
  return await response.json();
 }catch{return null;}
}
const visible=(row,hash)=>({id:row.id,name:row.name,question:row.question,
 createdAt:row.createdAt,updatedAt:row.updatedAt||row.createdAt,
 ownerId:row.ownerId,mine:!!(hash&&hash===row.ownerHash)});
const options={access:'public',contentType:'application/json',addRandomSuffix:false,cacheControlMaxAge:60};
async function write(row){return put(ROOT+row.id+'/'+randomUUID()+'.json',JSON.stringify(row),options);}
async function clean(refs){
 try{if(refs.length)await del(refs.map(r=>r.url));}
 catch(err){console.error('Reader question cleanup:',err?.message);}
}
export default async function handler(req,res){
 if(!process.env.BLOB_READ_WRITE_TOKEN)return json(res,503,{error:'প্রশ্ন জমা দেওয়ার সার্ভার প্রস্তুত নয়।'});
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 const hash=owner(req);
 if(req.method==='GET'){
  try{
   const refs=await scan();
   const decoded=await Promise.all(refs.slice(0,MAX_DISPLAY).map(fetchBlob));
   const used=new Set(),questions=[];
   for(const row of decoded){
    if(!row||!goodId(row.id)||used.has(row.id))continue;
    used.add(row.id);
    if(row.deleted||typeof row.name!=='string'||typeof row.question!=='string')continue;
    questions.push(visible(row,hash));
   }
   return json(res,200,{questions,more:refs.length>MAX_DISPLAY});
  }catch(err){console.error('Reader question list failed:',err?.message);
   return json(res,502,{error:'পাঠকদের প্রশ্ন লোড করা যায়নি।'});}
 }
 if(!hash)return json(res,401,{error:'এই ব্রাউজারের সম্পাদনার পরিচয় পাওয়া যায়নি।'});
 if(req.headers.origin){
  try{if(new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Origin rejected'});}
  catch{return json(res,403,{error:'Origin rejected'});}
 }
 let body;try{body=await readBody(req);}catch{return json(res,400,{error:'অবৈধ তথ্য পাঠানো হয়েছে।'});}
 if(body.website)return json(res,200,{ok:true});
 try{
  if(req.method==='POST'){
   const name=trim(body.name),question=trim(body.question);
   if(name.length<2||name.length>70||spam(name))return json(res,400,{error:'নাম ২–৭০ অক্ষরের হতে হবে।'});
   if(question.length<8||question.length>1200||spam(question))return json(res,400,{error:'প্রশ্ন ৮–১২০০ অক্ষরের হতে হবে; লিংক দেওয়া যাবে না।'});
   const refs=await scan(ROOT,240);
   const decoded=await Promise.all(refs.slice(0,120).map(fetchBlob));
   const allMine=decoded.filter(x=>x&&x.ownerHash===hash&&!x.deleted);
   if(allMine.length>=20)return json(res,429,{error:'একজন পাঠক সর্বোচ্চ ২০টি প্রশ্ন যোগ করতে পারবেন।'});
   const first=allMine.find(x=>x.name);
   const now=new Date().toISOString();
   const row={id:randomUUID(),name:first?.name||name,question,createdAt:now,updatedAt:now,ownerHash:hash,ownerId:hash.slice(0,24)};
   await write(row);
   return json(res,201,{ok:true,question:visible(row,hash)});
  }
  if(!goodId(body.id))return json(res,400,{error:'অবৈধ প্রশ্ন নম্বর।'});
  const refs=await scan(ROOT+body.id+'/',35);
  if(!refs.length)return json(res,404,{error:'প্রশ্নটি পাওয়া যায়নি।'});
  const versions=await Promise.all(refs.map(fetchBlob));
  const current=versions.find(x=>x&&x.id===body.id);
  if(!current||current.deleted)return json(res,404,{error:'প্রশ্নটি পাওয়া যায়নি।'});
  if(current.ownerHash!==hash)return json(res,403,{error:'শুধু নিজের প্রশ্ন পরিবর্তন করা যাবে।'});
  if(req.method==='PATCH'){
   const question=trim(body.question);
   if(question.length<8||question.length>1200||spam(question))return json(res,400,{error:'প্রশ্ন ৮–১২০০ অক্ষরের হতে হবে।'});
   const next={...current,question,updatedAt:new Date().toISOString()};
   await write(next);await clean(refs);
   return json(res,200,{ok:true,question:visible(next,hash)});
  }
  const tombstone={id:body.id,ownerHash:hash,deleted:true,updatedAt:new Date().toISOString()};
  await write(tombstone);await clean(refs);
  return json(res,200,{ok:true,deleted:true});
 }catch(err){console.error('Reader question mutation failed:',err?.message);
  return json(res,502,{error:'প্রশ্ন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।'});}
}

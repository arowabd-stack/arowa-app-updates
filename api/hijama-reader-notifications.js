import {list} from '@vercel/blob';
import {createHash} from 'node:crypto';

// In-app notifications are private to the question author's device key.
// This does not deliver email, browser push or notifications to other devices.
const root='hijama/reader-notifications/';
const respond=(res,status,payload)=>res.status(status)
 .setHeader('Content-Type','application/json; charset=utf-8')
 .setHeader('Cache-Control','private, no-store')
 .setHeader('X-Content-Type-Options','nosniff')
 .end(JSON.stringify(payload));
const isUuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
async function read(row){
 try{
  const url=row.url+(row.url.includes('?')?'&':'?')+'r='+Date.now();
  const response=await fetch(url,{cache:'no-store'});
  return response.ok?await response.json():null;
 }catch{return null;}
}
export default async function handler(req,res){
 if(req.method!=='GET')return respond(res,405,{error:'Method not allowed'});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return respond(res,503,{error:'নোটিফিকেশন সার্ভার প্রস্তুত নয়।'});
 const key=req.headers['x-hijama-edit-key'];
 if(typeof key!=='string'||!/^[a-f0-9]{64}$/.test(key))return respond(res,401,{error:'এই ব্রাউজারের পরিচয় পাওয়া যায়নি।'});
 const owner=createHash('sha256').update(key).digest('hex');
 try{
  const entries=[];let cursor;
  do{
   const page=await list({prefix:root+owner+'/',limit:100,cursor});
   entries.push(...page.blobs);
   cursor=page.hasMore?page.cursor:undefined;
  }while(cursor&&entries.length<250);
  entries.sort((a,b)=>Date.parse(b.uploadedAt)-Date.parse(a.uploadedAt));
  const recent=entries.slice(0,100);
  const decoded=await Promise.all(recent.map(read));
  const notifications=decoded.filter(n=>n&&isUuid(n.id)&&isUuid(n.questionId))
   .map(n=>({id:n.id,questionId:n.questionId,replyId:n.replyId,
    from:typeof n.from==='string'?n.from.slice(0,70):'পাঠক',
    official:!!n.official,
    question:typeof n.question==='string'?n.question.slice(0,140):'',
    preview:typeof n.preview==='string'?n.preview.slice(0,170):'',
    createdAt:n.createdAt}))
   .sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  return respond(res,200,{notifications,more:entries.length>100});
 }catch(err){
  console.error('Reader notification list failed',err?.message);
  return respond(res,502,{error:'নোটিফিকেশন লোড করা যায়নি।'});
 }
}

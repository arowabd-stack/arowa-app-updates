import {list} from '@vercel/blob';
const PREFIX='hijama/pdf-main/';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.method!=='GET')return res.status(405).end(JSON.stringify({error:'Method not allowed'}));
 if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).end(JSON.stringify({error:'বই সংরক্ষণের ক্লাউড প্রস্তুত নয়।'}));
 try{
  let cursor,entries=[];
  do{
   const p=await list({prefix:PREFIX,limit:100,cursor});
   entries.push(...p.blobs);
   cursor=p.hasMore?p.cursor:undefined;
  }while(cursor&&entries.length<200);
  const books=entries.filter(x=>/\.pdf(?:-|$)/i.test(x.pathname||'')||/\.pdf/i.test(x.url||''))
   .sort((a,b)=>Date.parse(b.uploadedAt)-Date.parse(a.uploadedAt));
  const book=books[0];
  if(!book)return res.status(200).end(JSON.stringify({available:false,pages:126}));
  return res.status(200).end(JSON.stringify({available:true,url:book.url,pages:126,updatedAt:book.uploadedAt,size:book.size||null}));
 }catch(err){console.error('Hijama PDF lookup failed:',err?.message);
  return res.status(502).end(JSON.stringify({error:'মূল PDF-এর তথ্য লোড করা যায়নি।'}))}
}
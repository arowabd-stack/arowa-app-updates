import {list,put} from '@vercel/blob';
import {randomUUID} from 'node:crypto';

const json=(res,status,data)=>{res.status(status).setHeader('Content-Type','application/json; charset=utf-8').setHeader('Cache-Control','no-store').setHeader('X-Content-Type-Options','nosniff').end(JSON.stringify(data))};
const clean=s=>typeof s==='string'?s.trim().replace(/[\u0000-\u001F\u007F]/g,''):''; 
const read=async req=>{if(req.body&&typeof req.body==='object')return req.body;let b='';for await(const c of req){b+=c;if(b.length>10000)throw new Error('TOO_LARGE')}return JSON.parse(b||'{}')};
const getAll=async(prefix,max=250)=>{let cursor,entries=[];do{const page=await list({prefix,limit:100,cursor});entries.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined;}while(cursor&&entries.length<max);return entries.slice(0,max)};
export default async function handler(req,res){
 if(!process.env.BLOB_READ_WRITE_TOKEN)return json(res,503,{error:'Cloud storage is not configured.'});
 if(req.method!=='GET'&&req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 const q=Number(req.method==='GET'?req.query.q:null);
 if(req.method==='GET'){
   if(!Number.isInteger(q)||q<1||q>84)return json(res,400,{error:'Invalid question'});
   try{const found=await getAll('hijama/community/q'+q+'/',300);const sorted=found.sort((a,b)=>+new Date(b.uploadedAt)-+new Date(a.uploadedAt)).slice(0,100);
    const rows=await Promise.all(sorted.map(async x=>{try{const r=await fetch(x.url,{cache:'no-store'});if(!r.ok)return null;return await r.json()}catch{return null}}));
    return json(res,200,{answers:rows.filter(x=>x&&x.question===q).slice(0,60),more:found.length>100});
   }catch(e){return json(res,502,{error:'Could not load cloud answers'});}
 }
 const origin=req.headers.origin;const host=req.headers.host;
 if(origin){try{if(new URL(origin).host!==host)return json(res,403,{error:'Origin rejected'})}catch{return json(res,403,{error:'Origin rejected'})}}
 let b;try{b=await read(req)}catch{return json(res,400,{error:'Invalid request'})}
 if(b.website)return json(res,200,{ok:true});
 const question=Number(b.question),name=clean(b.name),answer=clean(b.answer);
 if(!Number.isInteger(question)||question<1||question>84)return json(res,400,{error:'Invalid question'});
 if(name.length<2||name.length>70||answer.length<12||answer.length>1500)return json(res,400,{error:'নাম ২–৭০ অক্ষর এবং উত্তর ১২–১৫০০ অক্ষর হতে হবে।'});
 if(/https?:\/\/|www\.|<[^>]*>|(?:\b(?:telegram|whatsapp)\b).{0,15}\d{6}/i.test(name+' '+answer))return json(res,400,{error:'লিংক, বিজ্ঞাপন বা HTML দেওয়া যাবে না।'});
 const data={id:randomUUID(),question,name,answer,createdAt:new Date().toISOString()};
 try{await put('hijama/community/q'+question+'/'+data.id+'.json',JSON.stringify(data),{access:'public',contentType:'application/json',addRandomSuffix:false});return json(res,201,{ok:true,answer:data})}
 catch(e){return json(res,502,{error:'ক্লাউডে সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।'});}
}

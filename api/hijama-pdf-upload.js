import {handleUpload} from '@vercel/blob/client';
import {timingSafeEqual} from 'node:crypto';
const same=(a,b)=>{
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length&&timingSafeEqual(x,y);
};
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!process.env.BLOB_READ_WRITE_TOKEN||!process.env.HIJAMA_ADMIN_UPLOAD_KEY)
  return res.status(503).json({error:'আপলোড সার্ভার প্রস্তুত নয়।'});
 try{
  const result=await handleUpload({
   body:typeof req.body==='string'?JSON.parse(req.body):req.body,
   request:req,
   onBeforeGenerateToken:async(pathname,clientPayload)=>{
    let payload={};
    try{payload=JSON.parse(clientPayload||'{}')}catch{}
    if(!same(payload.adminCode,process.env.HIJAMA_ADMIN_UPLOAD_KEY))throw Error('প্রশাসকের আপলোড কোড সঠিক নয়।');
    if(pathname!=='hijama/pdf-main/hijama-guide.pdf')throw Error('এই স্থানে বই ছাড়া অন্য ফাইল আপলোড করা যাবে না।');
    return {allowedContentTypes:['application/pdf'],maximumSizeInBytes:30*1024*1024,
     addRandomSuffix:true,cacheControlMaxAge:60,validUntil:Date.now()+15*60*1000};
   },
   onUploadCompleted:async({blob})=>{
    if(!blob.pathname.startsWith('hijama/pdf-main/'))throw Error('Unexpected uploaded path');
    console.info('Original Hijama PDF uploaded:',blob.pathname);
   }
  });
  return res.status(200).json(result);
 }catch(err){
  console.error('Hijama PDF upload error:',err?.message);
  return res.status(400).json({error:err?.message||'বই আপলোড করা যায়নি।'});
 }
}
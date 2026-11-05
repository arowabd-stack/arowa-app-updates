import {getSession,startSession,endSession,matchingPassword} from '../lib/hijama-training-session.js';
const respond=(res,status,data)=>res.status(status).setHeader('Cache-Control','no-store')
 .setHeader('Content-Type','application/json; charset=utf-8')
 .setHeader('X-Content-Type-Options','nosniff')
 .end(JSON.stringify(data));
function sameOrigin(req){
 if(!req.headers.origin)return true;
 try{return new URL(req.headers.origin).host===req.headers.host}catch{return false}
}
export default async function handler(req,res){
 if(!process.env.HIJAMA_TRAINING_PASSWORD||!process.env.HIJAMA_TRAINING_SESSION_KEY)
  return respond(res,503,{error:'প্রশিক্ষণ লগইন প্রস্তুত নয়।'});
 if(req.method==='GET'){
  const session=getSession(req);
  return respond(res,200,{authenticated:session.ok,reason:session.reason});
 }
 if(req.method==='DELETE'){
  if(!sameOrigin(req))return respond(res,403,{error:'Invalid origin'});
  endSession(res);
  return respond(res,200,{authenticated:false});
 }
 if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 if(!sameOrigin(req))return respond(res,403,{error:'Invalid origin'});
 let body=req.body;
 if(typeof body==='string')try{body=JSON.parse(body)}catch{body={}};
 if(!body||typeof body!=='object')body={};
 if(!matchingPassword(body.password,process.env.HIJAMA_TRAINING_PASSWORD))
  return respond(res,401,{error:'পাসওয়ার্ড সঠিক নয়।'});
 try{
  const result=startSession(res,body.remember!==false);
  return respond(res,200,result);
 }catch(err){
  console.error('Training login session failed',err?.message);
  return respond(res,503,{error:'এই ডিভাইসে লগইন সংরক্ষণ করা যায়নি।'});
 }
}

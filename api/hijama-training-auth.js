import {createHmac,timingSafeEqual} from 'node:crypto';
const cookieName='hijama_training_session';
const defaultMaxAge=12*60*60;
const rememberedMaxAge=30*24*60*60;
const json=(res,status,obj)=>res.status(status).setHeader('Cache-Control','no-store').setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(obj));
const secureCompare=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const makeSign=v=>createHmac('sha256',process.env.HIJAMA_TRAINING_SESSION_KEY||'').update(v).digest('hex');
function auth(req){
 const cookies=(req.headers.cookie||'').split(';').map(x=>x.trim());
 const raw=cookies.find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 if(!raw||!process.env.HIJAMA_TRAINING_SESSION_KEY)return false;
 const [expires,signature,extra]=raw.split('.');
 if(extra||!/^[0-9a-z]+$/.test(expires||'')||!/^[a-f0-9]{64}$/.test(signature||''))return false;
 if(Number.parseInt(expires,36)<Date.now())return false;
 return secureCompare(signature,makeSign(expires));
}
export default async function handler(req,res){
 if(!process.env.HIJAMA_TRAINING_PASSWORD||!process.env.HIJAMA_TRAINING_SESSION_KEY)return json(res,503,{error:'প্রশিক্ষণ লগইন প্রস্তুত নয়।'});
 if(req.method==='GET')return json(res,200,{authenticated:auth(req)});
 if(req.method==='DELETE'){
  res.setHeader('Set-Cookie',cookieName+'=; HttpOnly; Secure; SameSite=Strict; Path=/api/hijama-training; Max-Age=0');
  return json(res,200,{authenticated:false});
 }
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(req.headers.origin){
  try{if(new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Invalid origin'})}catch{return json(res,403,{error:'Invalid origin'})}
 }
 const body=typeof req.body==='object'&&req.body?req.body:{};
 if(!secureCompare(body.password,process.env.HIJAMA_TRAINING_PASSWORD))return json(res,401,{error:'পাসওয়ার্ড সঠিক নয়।'});
 const maxAge=body.remember===true?rememberedMaxAge:defaultMaxAge;
 const expires=(Date.now()+maxAge*1000).toString(36);
 const token=expires+'.'+makeSign(expires);
 res.setHeader('Set-Cookie',cookieName+'='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/api/hijama-training; Max-Age='+maxAge);
 return json(res,200,{authenticated:true});
}

import {createHmac,timingSafeEqual} from 'node:crypto';

// A single first-party session contract shared by every Hijama training route.
// Browser retains a signed, HTTP-only cookie, never the password itself.
const COOKIE='__Host-hijama_training_session';
const LEGACY='hijama_training_session';
const HOURS_12=12*60*60, DAYS_90=90*24*60*60;
const secret=()=>process.env.HIJAMA_TRAINING_SESSION_KEY||'';
const safeEq=(a,b)=>{
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=Buffer.from(a,'utf8'),y=Buffer.from(b,'utf8');
 return x.length===y.length&&timingSafeEqual(x,y);
};
const signature=value=>createHmac('sha256',secret()).update(value).digest('hex');
export function getSession(req){
 if(!secret()||secret().length<24)return {ok:false,reason:'session-not-configured'};
 const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).filter(Boolean);
 let found=false;
 for(const name of [COOKIE,LEGACY]){
  const item=raw.find(x=>x.startsWith(name+'='));
  if(!item)continue;
  found=true;
  const value=item.slice(name.length+1);
  const parts=value.split('.');
  if(parts.length!==2||!/^[0-9a-z]+$/.test(parts[0])||!/^[a-f0-9]{64}$/.test(parts[1]))continue;
  const until=parseInt(parts[0],36);
  if(!Number.isSafeInteger(until)||until<=Date.now())continue;
  if(safeEq(signature(parts[0]),parts[1]))return {ok:true,reason:'ok'};
 }
 return {ok:false,reason:found?'invalid-session':'no-cookie'};
}
export function startSession(res,remember){
 if(!secret()||secret().length<24)throw Error('Missing training session secret');
 const duration=remember?DAYS_90:HOURS_12;
 const expires=(Date.now()+duration*1000).toString(36);
 const value=expires+'.'+signature(expires);
 // __Host- requires Secure + Path=/ + no Domain and avoids ambiguous path scopes.
 res.setHeader('Set-Cookie',[
  COOKIE+'='+value+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age='+duration+'; Expires='+new Date(Date.now()+duration*1000).toUTCString(),
  LEGACY+'=; HttpOnly; Secure; SameSite=Lax; Path=/api/hijama-training; Max-Age=0'
 ]);
 return {authenticated:true,remembered:!!remember,days:remember?90:0};
}
export function endSession(res){
 res.setHeader('Set-Cookie',[
  COOKIE+'=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
  LEGACY+'=; HttpOnly; Secure; SameSite=Lax; Path=/api/hijama-training; Max-Age=0'
 ]);
}
export function matchingPassword(a,b){return safeEq(a,b);}

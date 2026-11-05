import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {getSession} from '../lib/hijama-training-session.js';

const location=fileURLToPath(new URL('../lib/hijama-playlist-player.html',import.meta.url));
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 res.setHeader('X-Frame-Options','SAMEORIGIN');
 if(req.method!=='GET'){
  res.setHeader('Allow','GET');
  return res.status(405).json({error:'Method not allowed'});
 }
 if(!getSession(req).ok){
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.status(401).end('<!doctype html><html lang="bn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>প্রবেশ প্রয়োজন</title><body style="font-family:system-ui;padding:30px;max-width:600px;margin:auto"><h1>হিজামা ট্রেনিংয়ে লগইন প্রয়োজন</h1><p>ভিডিও প্লেয়ার খুলতে প্রথমে ট্রেনিং পেজে লগইন করুন।</p><a href="/hijama-training.html">হিজামা ট্রেনিং পেজে যান</a></body></html>');
 }
 try{
  const html=await readFile(location,'utf8');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src blob:; font-src data:; base-uri 'none'; object-src 'none'; form-action 'none'");
  return res.status(200).end(html);
 }catch(error){
  console.error('Protected Hijama HTML player unavailable',error?.message);
  return res.status(503).json({error:'ভিডিও প্লেয়ার এখন পাওয়া যাচ্ছে না।'});
 }
}

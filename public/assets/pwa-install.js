(()=>{
'use strict';
// Browser-specific, accessible PWA install invitation.
// Chromium provides beforeinstallprompt; Safari requires manual installation.
try{if(window.top!==window.self)return;}catch{return;}
const KEY='ruqyah-pwa-install-snooze-v1', INSTALLED='ruqyah-pwa-installed-v1';
const SESSION='ruqyah-pwa-install-seen-session-v1';
const day=24*60*60*1000;
const ua=navigator.userAgent||'';
const ios=/iPad|iPhone|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&(navigator.maxTouchPoints||0)>1);
const safari=/Safari/i.test(ua)&&!/Chrome|CriOS|Edg|EdgiOS|OPR|FxiOS|Firefox|SamsungBrowser/i.test(ua);
const chrome=/Chrome|Chromium|CriOS|Edg|EdgiOS/i.test(ua);
const mac=/Macintosh|Mac OS X/i.test(ua)&&!ios;
const android=/Android/i.test(ua);
if(!chrome&&!safari)return;
const installed=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.matchMedia?.('(display-mode: fullscreen)').matches||navigator.standalone===true;
const get=(key)=>{try{return localStorage.getItem(key)}catch{return null}};
const set=(key,value)=>{try{localStorage.setItem(key,String(value))}catch{}};
const sessionGet=()=>{try{return sessionStorage.getItem(SESSION)==='1'}catch{return false}};
const sessionSet=()=>{try{sessionStorage.setItem(SESSION,'1')}catch{}};
if(installed())return;

let event=null,panel=null,opened=false,timer=null;
const css=document.createElement('link');
css.rel='stylesheet';css.href=new URL('assets/pwa-install.css',document.baseURI).href;
document.head.append(css);

function instructions(){
 if(ios)return '১. ব্রাউজারের Share (শেয়ার) মেনু খুলুন।\n২. “Add to Home Screen” নির্বাচন করুন।\n৩. “Add” চাপুন।';
 if(safari&&mac)return 'Safari-এর উপরের মেনু থেকে File → Add to Dock নির্বাচন করুন। (macOS Sonoma 14 বা নতুন সংস্করণে)';
 if(android)return 'Chrome-এর ⋮ মেনু থেকে “Add to Home screen” বা “Install app” নির্বাচন করুন।';
 return 'Chrome-এর অ্যাড্রেস বারের Install আইকন অথবা ⋮ মেনু থেকে “Install page as app” নির্বাচন করুন।';
}
function subtitle(){
 if(ios)return 'iPhone বা iPad-এর Home Screen-এ সংরক্ষণ করুন।';
 if(safari&&mac)return 'Mac-এর Dock-এ ওয়েব অ্যাপ হিসেবে রাখুন।';
 return 'রুকইয়াহ ও হিজামা গাইড অ্যাপ হিসেবে সহজে খুলুন।';
}
function buttonText(){
 return event&&typeof event.prompt==='function'?'অ্যাপ ইনস্টল করুন':'ইনস্টল করার নিয়ম';
}
function dismiss(days=14){
 if(timer){clearTimeout(timer);timer=null}
 set(KEY,Date.now()+days*day);
 panel?.remove();panel=null;opened=false;event=null;
}
function closeInstalled(){
 set(INSTALLED,'1');panel?.remove();panel=null;opened=false;event=null;
}
function show(force=false){
 if(opened||installed()||(!force&&(Number(get(KEY)||0)>Date.now()||sessionGet())))return;
 if(!document.body||document.visibilityState==='hidden')return;
 opened=true;sessionSet();
 const section=document.createElement('aside');
 section.className='pwa-install-card';
 section.setAttribute('role','dialog');
 section.setAttribute('aria-labelledby','pwaInstallTitle');
 section.setAttribute('aria-describedby','pwaInstallDescription');
 const icon=document.createElement('img');
 icon.src=new URL('icons/icon-192.png',document.baseURI).href;
 icon.alt='';icon.width=46;icon.height=46;icon.className='pwa-install-icon';
 const content=document.createElement('div');
 content.className='pwa-install-copy';
 const eyebrow=document.createElement('div');
 eyebrow.className='pwa-install-eyebrow';eyebrow.textContent='রুকইয়াহ ও হিজামা';
 const title=document.createElement('h2');
 title.id='pwaInstallTitle';title.textContent='অ্যাপ হিসেবে ইনস্টল করুন';
 const description=document.createElement('p');
 description.id='pwaInstallDescription';description.textContent=subtitle();
 content.append(eyebrow,title,description);
 const close=document.createElement('button');
 close.className='pwa-install-close';close.type='button';close.textContent='×';
 close.setAttribute('aria-label','ইনস্টল পপআপ বন্ধ করুন');
 close.addEventListener('click',()=>dismiss(14));
 const header=document.createElement('div');header.className='pwa-install-header';
 header.append(icon,content,close);
 const steps=document.createElement('p');
 steps.className='pwa-install-steps';steps.hidden=true;
 steps.textContent=instructions();
 const actions=document.createElement('div');actions.className='pwa-install-actions';
 const notNow=document.createElement('button');
 notNow.type='button';notNow.className='pwa-install-later';notNow.textContent='পরে';
 notNow.addEventListener('click',()=>dismiss(14));
 const install=document.createElement('button');
 install.type='button';install.className='pwa-install-primary';install.textContent=buttonText();
 install.addEventListener('click',async()=>{
  if(event&&typeof event.prompt==='function'){
   const prompt=event;event=null;install.disabled=true;install.textContent='ইনস্টল হচ্ছে…';
   try{
    const result=await prompt.prompt();
    // User choice doesn't prove successful installation; appinstalled does.
    if(result?.outcome==='accepted')dismiss(90);
    else dismiss(14);
   }catch{
    install.disabled=false;install.textContent='ইনস্টল করার নিয়ম';
    steps.hidden=false;
   }
  }else{
   steps.hidden=!steps.hidden;
   install.textContent=steps.hidden?'ইনস্টল করার নিয়ম':'নিয়ম লুকান';
  }
 });
 actions.append(notNow,install);
 section.append(header,steps,actions);
 document.body.append(section);
 panel=section;
 // Non-modal: no focus trap and no forced focus while someone is reading.
 section.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss(14)});
}
window.addEventListener('beforeinstallprompt',e=>{
 e.preventDefault();event=e;
 if(panel){
  const install=panel.querySelector('.pwa-install-primary');
  if(install){install.disabled=false;install.textContent=buttonText()}
 }else if(!sessionGet()){
  if(timer)clearTimeout(timer);
  timer=setTimeout(show,1200);
 }
});
window.addEventListener('appinstalled',closeInstalled);
// The explicit install control stays available even if an earlier invitation was dismissed.
window.openRuqyahInstall=()=>show(true);
function addInstallControl(){
 const header=document.querySelector('.site-header');
 if(!header||header.querySelector('.pwa-header-install')||installed())return;
 const button=document.createElement('button');
 button.type='button';button.className='pwa-header-install';
 button.textContent='ইনস্টল';button.setAttribute('aria-label','অ্যাপ ইনস্টল করার উপায়');
 button.addEventListener('click',()=>show(true));
 const before=header.querySelector('.theme-toggle');
 if(before)header.insertBefore(button,before);else header.append(button);
}
const mode=window.matchMedia?.('(display-mode: standalone)');
mode?.addEventListener?.('change',()=>{if(installed())closeInstalled()});
function init(){
 if(installed())return;
 if(timer)clearTimeout(timer);
 timer=setTimeout(show,3500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{addInstallControl();init()},{once:true});
else{addInstallControl();init()};
})();
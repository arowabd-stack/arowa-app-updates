(()=>{
'use strict';
try{if(window.top!==window.self)return}catch{return}
const landing=document.body?.dataset?.pwaInstallLanding==='true'||location.pathname.endsWith('/install.html');
const appUrl=new URL('./',location.href).href;
const mode=window.matchMedia?.('(display-mode: standalone)');
const standalone=()=>!!(mode?.matches||navigator.standalone===true);
let deferredPrompt=null,installedHere=false,busy=false,installRequested=false,settling=false,settled=false,settleTimer=null;
const knownInstalled=()=>standalone()||installedHere;
// Historical flags survive uninstall; only current browser evidence is used.
try{localStorage.removeItem('ruqyah-pwa-installed-v1')}catch{}
if(!document.querySelector('link[href$="pwa-install.css"]')){
 const css=document.createElement('link');css.rel='stylesheet';
 css.href=new URL('./pwa-install.css',document.currentScript?.src||new URL('assets/pwa-install.js',location.href)).href;
 document.head.append(css);
}
function status(message){
 let target=document.getElementById('installLandingStatus')||document.getElementById('pwaInstallStatus');
 if(!target){
  target=document.createElement('p');target.id='pwaInstallStatus';target.className='pwa-inline-status';
  target.setAttribute('role','status');target.setAttribute('aria-live','polite');
  const header=document.querySelector('.site-header');
  if(header)header.after(target);else document.body.prepend(target);
 }
 target.textContent=message;
}
function guide(){
 const ua=navigator.userAgent||'';
 const ios=/iPad|iPhone|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
 if(ios)return 'Safari-র Share মেনু থেকে Add to Home Screen → Add নির্বাচন করুন।';
 if(/Safari/i.test(ua)&&!/Chrome|CriOS|Edg|OPR|Firefox/i.test(ua))return 'Safari-র File মেনু থেকে Add to Dock নির্বাচন করুন।';
 return 'ব্রাউজারের মেনু বা অ্যাড্রেস বার থেকে Install app / Add to Home screen নির্বাচন করুন।';
}
function openApp(){
 if(standalone()){location.replace(appUrl);return}
 // A timed browser navigation does not launch a WebAPK. Android Intents
 // require a real click; let Android resolve this site's installed handler.
 if(/Android/i.test(navigator.userAgent||'')){
  const url=new URL(appUrl);
  location.assign('intent://'+url.host+url.pathname+'#Intent;scheme='+url.protocol.slice(0,-1)+';action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end');
  status('অ্যাপ না খুললে ইনস্টল শেষ হওয়া পর্যন্ত অপেক্ষা করুন, তারপর হোম স্ক্রিনের অ্যাপ আইকনে চাপুন।');
 }else{
  status('হোম স্ক্রিন বা অ্যাপ তালিকার রুকইয়াহ আইকনে চাপুন। কম্পিউটারে Chrome-এর মেনু থেকে Open in app ব্যবহার করুন।');
 }
}
function prepareLaunch(){
 if(settling||settled)return;
 settling=true;busy=true;
 status('অ্যাপ প্রস্তুত হচ্ছে… একটু অপেক্ষা করুন।');sync();
 settleTimer=window.setTimeout(()=>{
  settleTimer=null;settling=false;settled=true;busy=false;sync();
  if(standalone()){if(landing)openApp();return}
  // Android's appinstalled event may precede actual WebAPK installation.
  // Three seconds is a UI waiting period, never proof of OS readiness.
  status('ইনস্টল শেষ হলে অ্যাপ খুলুন বাটনে চাপুন। না খুললে হোম স্ক্রিনের অ্যাপ আইকনে চাপুন।');
 },3000);
}
function sync(){
 let button=document.querySelector('.pwa-header-install');
 const header=document.querySelector('.site-header');
 if(!button&&header){
  button=document.createElement('button');button.type='button';button.className='pwa-header-install';
  const theme=header.querySelector('.theme-toggle');
  if(theme)header.insertBefore(button,theme);else header.append(button);
 }
 if(button){
  button.hidden=standalone();button.textContent=busy?'প্রস্তুত হচ্ছে…':settled?'অ্যাপ খুলুন':'ইনস্টল';
  button.disabled=busy;button.setAttribute('aria-label',settled?'ইনস্টল করা অ্যাপ খুলুন':'এই ডিভাইসে অ্যাপ ইনস্টল করুন');
  button.onclick=settled?openApp:install;
 }
 const action=document.getElementById('shareLandingInstall');
 if(action){
  action.textContent=busy?'প্রস্তুত হচ্ছে…':settled||standalone()?'অ্যাপ খুলুন':'ইনস্টল করুন';
  action.disabled=busy;action.onclick=settled||standalone()?openApp:install;
  action.setAttribute('aria-busy',String(busy));
 }
 const target=document.getElementById('installLandingStatus')||document.getElementById('pwaInstallStatus');
 if(target)target.classList.toggle('pwa-install-loading',settling);
}
async function install(){
 if(knownInstalled()){if(landing)openApp();return}
 if(busy)return;
 if(!deferredPrompt){status(guide());return}
 const prompt=deferredPrompt;deferredPrompt=null;busy=true;installRequested=true;sync();
 try{
  // Called directly by the user's button click: only the browser's native
  // confirmation is shown, with no intermediate invitation or share popup.
  await prompt.prompt();
  const choice=await prompt.userChoice;
  if(installedHere||standalone())return;
  if(choice?.outcome==='accepted'){
   prepareLaunch();
  }else{
   busy=false;installRequested=false;status('ইনস্টল করা হয়নি। আবার চেষ্টা করতে ইনস্টল বাটনে চাপুন।');sync();
  }
 }catch{
  if(installedHere||standalone())return;
  busy=false;installRequested=false;status(guide());sync();
 }
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferredPrompt=event;if(!settling)busy=false;sync();
});
window.addEventListener('appinstalled',()=>{
 installedHere=true;deferredPrompt=null;
 if(landing||installRequested)prepareLaunch();else sync();
});
mode?.addEventListener?.('change',()=>{
 if(standalone()){
  if(settleTimer!==null)window.clearTimeout(settleTimer);
  settleTimer=null;settling=false;busy=false;
  if(landing)openApp();
 }
 sync();
});
window.addEventListener('pageshow',sync);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
function init(){sync();if(landing&&standalone())openApp()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.openRuqyahInstall=install;
})();

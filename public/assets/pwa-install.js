(()=>{
'use strict';
try{if(window.top!==window.self)return}catch{return}
const landing=document.body?.dataset?.pwaInstallLanding==='true'||location.pathname.endsWith('/install.html');
const appUrl=new URL('./',location.href).href;
const mode=window.matchMedia?.('(display-mode: standalone)');
const standalone=()=>!!(mode?.matches||navigator.standalone===true);
let deferredPrompt=null,installedHere=false,busy=false,installRequested=false;
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
 // The browser/OS owns standalone launching. Never open an extra tab or
 // pretend that a navigation can force a native PWA window on every device.
 location.replace(appUrl);
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
  button.hidden=knownInstalled();button.textContent=busy?'ইনস্টল হচ্ছে…':'ইনস্টল';
  button.disabled=busy;button.setAttribute('aria-label','এই ডিভাইসে অ্যাপ ইনস্টল করুন');
  button.onclick=install;
 }
 const action=document.getElementById('shareLandingInstall');
 if(action){
  action.textContent=knownInstalled()?'অ্যাপ খুলুন':busy?'ইনস্টল হচ্ছে…':'ইনস্টল করুন';
  action.disabled=busy&&!knownInstalled();action.onclick=knownInstalled()?openApp:install;
 }
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
   status('ইনস্টল সম্পন্ন হলে অ্যাপের মূল পাতা খুলবে।');
  }else{
   busy=false;installRequested=false;status('ইনস্টল করা হয়নি। আবার চেষ্টা করতে ইনস্টল বাটনে চাপুন।');sync();
  }
 }catch{
  if(installedHere||standalone())return;
  busy=false;installRequested=false;status(guide());sync();
 }
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferredPrompt=event;busy=false;sync();
});
window.addEventListener('appinstalled',()=>{
 installedHere=true;deferredPrompt=null;busy=false;sync();
 status('ইনস্টল সম্পন্ন হয়েছে।');
 if(landing||installRequested)openApp();
});
mode?.addEventListener?.('change',()=>{
 sync();if(standalone()&&landing)openApp();
});
window.addEventListener('pageshow',sync);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
function init(){sync();if(landing&&standalone())openApp()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.openRuqyahInstall=install;
})();

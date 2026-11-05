(()=>{
'use strict';
// PWA install/share behavior. Autoprompt is ONLY for the dedicated shared link.
try{if(window.top!==window.self)return}catch{return}
const landing=document.body?.dataset?.pwaInstallLanding==='true'||location.pathname.endsWith('/install.html');
const shareUrl=new URL('install.html',new URL('./',location.href)).href;
const INSTALLED='ruqyah-pwa-installed-v1';
const match=window.matchMedia?.('(display-mode: standalone)');
const installed=()=>!!(match?.matches||navigator.standalone===true||window.matchMedia?.('(display-mode: fullscreen)').matches);
const storedInstalled=()=>{try{return localStorage.getItem(INSTALLED)==='1'}catch{return false}};
const setInstalled=()=>{try{localStorage.setItem(INSTALLED,'1')}catch{}};
const isKnownInstalled=()=>installed()||storedInstalled();
const ua=navigator.userAgent||'';
const ios=/iPad|iPhone|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
const safari=/Safari/i.test(ua)&&!/Chrome|CriOS|Edg|EdgiOS|OPR|FxiOS|Firefox|SamsungBrowser/i.test(ua);
const mac=/Macintosh|Mac OS X/i.test(ua)&&!ios;
const android=/Android/i.test(ua);
let deferredPrompt=null,dialog=null,backdrop=null;
const stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';stylesheet.href=new URL('./pwa-install.css',document.currentScript?.src||new URL('assets/pwa-install.js',location.href)).href;
document.head.append(stylesheet);
const make=(tag,cls,content)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=content;return x};
function announce(message){
 const target=document.getElementById('shareLinkStatus');
 if(target)target.textContent=message;
 else if(window.libraryToast)window.libraryToast(message);
 else if(dialog){let t=dialog.querySelector('.pwa-install-status');if(t)t.textContent=message}
}
const guide=()=>{
 if(ios)return 'Safari-র Share (শেয়ার) বাটনে চাপুন → Add to Home Screen → Add। iPhone-এ Chrome ব্যবহার করলে Share মেনু থেকেও চেষ্টা করতে পারেন।';
 if(safari&&mac)return 'Safari → File → Add to Dock (macOS Sonoma বা নতুন সংস্করণ)। পুরোনো macOS-এ এই সুবিধা নাও থাকতে পারে।';
 if(android)return 'Chrome-র ⋮ মেনু খুলুন → Install app অথবা Add to Home screen নির্বাচন করুন।';
 return 'Chrome-র অ্যাড্রেস বারের Install আইকন অথবা ⋮ মেনু থেকে Install page as app নির্বাচন করুন।';
};
function closeDialog(){
 if(dialog)dialog.remove();if(backdrop)backdrop.remove();
 dialog=null;backdrop=null;
}
function syncHeader(){
 const existing=document.querySelector('.pwa-header-install');
 const header=document.querySelector('.site-header');
 if(!header&&!existing)return;
 const button=existing||make('button','pwa-header-install');
 if(!existing){
  button.type='button';
  const before=header.querySelector('.theme-toggle');
  if(before)header.insertBefore(button,before);else header.append(button);
 }
 const share=isKnownInstalled();
 button.textContent=share?'অ্যাপ শেয়ার করুন':'ইনস্টল';
 button.setAttribute('aria-label',share?'অ্যাপের ইনস্টল লিংক শেয়ার করুন':'এই ডিভাইসে অ্যাপ ইনস্টল করুন');
 button.setAttribute('title',share?'অ্যাপ শেয়ার করুন':'অ্যাপ ইনস্টল করুন');
 button.onclick=share?shareApp:()=>showInstall();
}
async function shareApp(){
 const payload={title:'রুকইয়াহ শরইয়্যাহ ও হিজামা গাইড',text:'এই অ্যাপটি আপনার ডিভাইসে ইনস্টল করুন',url:shareUrl};
 if(navigator.share){
  try{await navigator.share(payload);return}catch(error){if(error?.name==='AbortError')return}
 }
 try{await navigator.clipboard.writeText(shareUrl);announce('অ্যাপ ইনস্টলের লিংক কপি হয়েছে।');return}catch{}
 const input=document.getElementById('shareLinkInput');
 if(input){input.value=shareUrl;input.hidden=false;input.focus();input.select();announce('লিংকটি নির্বাচন করে কপি করুন।');}
 else window.prompt('এই ইনস্টল লিংকটি শেয়ার করুন:',shareUrl);
}
function showInstall(){
 if(installed()){
  closeDialog();syncHeader();
  const target=document.getElementById('installLandingStatus');
  if(target)target.textContent='এই ডিভাইসে অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে।';
  return;
 }
 if(dialog)return;
 backdrop=make('div','pwa-install-overlay');
 backdrop.setAttribute('aria-hidden','true');
 dialog=make('section','pwa-install-card');
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
 dialog.setAttribute('aria-labelledby','pwaInstallTitle');
 dialog.setAttribute('aria-describedby','pwaInstallDescription');
 const header=make('div','pwa-install-header');
 const img=make('img','pwa-install-icon');img.src=new URL('icons/icon-192.png',new URL('./',location.href)).href;img.alt='';img.width=46;img.height=46;
 const copy=make('div','pwa-install-copy');
 copy.append(make('div','pwa-install-eyebrow','রুকইয়াহ ও হিজামা'),
  make('h2','','আপনার ডিভাইসে অ্যাপ ইনস্টল করুন'));
 copy.querySelector('h2').id='pwaInstallTitle';
 const subtitle=make('p','','পড়ুন ও ব্যবহার করুন অ্যাপের মতো, সহজেই হোম স্ক্রিন থেকে।');
 subtitle.id='pwaInstallDescription';copy.append(subtitle);
 const close=make('button','pwa-install-close','×');close.type='button';
 close.setAttribute('aria-label','ইনস্টল পপআপ বন্ধ করুন');close.addEventListener('click',closeDialog);
 header.append(img,copy,close);
 const steps=make('p','pwa-install-steps',guide());steps.hidden=true;
 const status=make('p','pwa-install-status','');status.setAttribute('role','status');
 const actions=make('div','pwa-install-actions');
 const later=make('button','pwa-install-later','এখন নয়');later.type='button';later.addEventListener('click',closeDialog);
 const action=make('button','pwa-install-primary',deferredPrompt?'অ্যাপ ইনস্টল করুন':'ইনস্টল করার নিয়ম');
 action.type='button';
 action.addEventListener('click',async()=>{
  if(!deferredPrompt){
   steps.hidden=!steps.hidden;
   action.textContent=steps.hidden?'ইনস্টল করার নিয়ম':'নিয়ম লুকান';
   return;
  }
  const event=deferredPrompt;deferredPrompt=null;
  action.disabled=true;action.textContent='ইনস্টল হচ্ছে…';
  try{
   await event.prompt();
   const choice=await event.userChoice;
   if(choice?.outcome==='accepted'){
    closeDialog();
    const msg=document.getElementById('installLandingStatus');
    if(msg)msg.textContent='ইনস্টলের অনুমতি দেওয়া হয়েছে। অ্যাপটি তৈরি হলে হোম স্ক্রিনে দেখা যাবে।';
   }else{steps.hidden=false;action.textContent='ইনস্টল করার নিয়ম';action.disabled=false}
  }catch{
   steps.hidden=false;action.textContent='ইনস্টল করার নিয়ম';action.disabled=false;
   status.textContent='ব্রাউজারের ইনস্টল বাটন পাওয়া যায়নি। নিচের ধাপগুলো অনুসরণ করুন।';
  }
 });
 actions.append(later,action);
 dialog.append(header,steps,status,actions);
 document.body.append(backdrop,dialog);
 const escape=e=>{if(e.key==='Escape'){closeDialog();document.removeEventListener('keydown',escape)}};
 document.addEventListener('keydown',escape,{once:false});
 close.focus({preventScroll:true});
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferredPrompt=event;
 const action=dialog?.querySelector('.pwa-install-primary');
 if(action){action.disabled=false;action.textContent='অ্যাপ ইনস্টল করুন';}
});
window.addEventListener('appinstalled',()=>{
 setInstalled();closeDialog();syncHeader();
 const status=document.getElementById('installLandingStatus');
 if(status)status.textContent='অ্যাপ ইনস্টল হয়েছে। এখন চাইলে অন্যদের শেয়ার করুন।';
});
match?.addEventListener?.('change',()=>{if(installed()){closeDialog();syncHeader()}});
window.addEventListener('pageshow',syncHeader);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncHeader()});
function init(){
 syncHeader();
 const shareButton=document.getElementById('shareLandingShare');
 if(shareButton)shareButton.addEventListener('click',shareApp);
 const installButton=document.getElementById('shareLandingInstall');
 if(installButton)installButton.addEventListener('click',showInstall);
 const urlInput=document.getElementById('shareLinkInput');
 if(urlInput){urlInput.value=shareUrl;urlInput.hidden=true}
 if(landing&&!isKnownInstalled()){
  // This is deliberately NOT session-snoozed: closing then reloading the share
  // link must present the invitation again. No other app page autoshows it.
  window.setTimeout(showInstall,550);
 }else if(landing&&isKnownInstalled()){
  const status=document.getElementById('installLandingStatus');
  if(status)status.textContent='অ্যাপটি এই ডিভাইসে ইনস্টল করা আছে।';
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
window.openRuqyahInstall=showInstall;
window.shareRuqyahApp=shareApp;
})();
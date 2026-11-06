(()=>{
'use strict';
// PWA install/share behavior. Autoprompt is ONLY for the dedicated shared link.
try{if(window.top!==window.self)return}catch{return}
const landing=document.body?.dataset?.pwaInstallLanding==='true'||location.pathname.endsWith('/install.html');
const shareUrl=new URL('install.html',new URL('./',location.href)).href;
const appUrl=new URL('index.html',new URL('./',location.href)).href;
// Do not trust historical localStorage flags: they survive an app uninstall and
// incorrectly show "Open App" on devices where the PWA is no longer installed.
// Browsers cannot universally detect an installed PWA from a regular tab.
// Only standalone mode or a successful install event in this document is proof.
const match=window.matchMedia?.('(display-mode: standalone)');
let installedDuringThisVisit=false;
const installed=()=>!!(match?.matches||navigator.standalone===true);
const setInstalled=()=>{installedDuringThisVisit=true;};
const isKnownInstalled=()=>installed()||installedDuringThisVisit;
try{localStorage.removeItem('ruqyah-pwa-installed-v1')}catch{}
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
 updateLandingUI();
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
function openApp(){
 closeDialog();
 // Browsers do not provide a guaranteed programmatic way to launch a separately
 // installed PWA window. Navigate to its home URL; compatible OS/browser
 // link-capture settings may hand this link to the installed app.
 window.location.assign(appUrl);
}
function updateLandingUI(){
 const installButton=document.getElementById('shareLandingInstall');
 if(!installButton)return;
 const active=isKnownInstalled();
 installButton.textContent=active?'অ্যাপ খুলুন':'ইনস্টল করুন';
 installButton.setAttribute('aria-label',active?'ইনস্টল করা অ্যাপ খুলুন':'অ্যাপ ইনস্টল করার উপায় দেখুন');
}
function showOpenApp(){
 closeDialog();
 backdrop=make('div','pwa-install-overlay');
 backdrop.setAttribute('aria-hidden','true');
 dialog=make('section','pwa-install-card');
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
 dialog.setAttribute('aria-labelledby','pwaInstallTitle');
 const heading=make('div','pwa-install-header');
 const img=make('img','pwa-install-icon');img.src=new URL('icons/icon-192.png',new URL('./',location.href)).href;
 img.alt='';img.width=46;img.height=46;
 const copy=make('div','pwa-install-copy');
 copy.append(make('div','pwa-install-eyebrow','অ্যাপ প্রস্তুত'),
  make('h2','','অ্যাপটি ইনস্টল হয়েছে'));
 copy.querySelector('h2').id='pwaInstallTitle';
 copy.append(make('p','','এখন অ্যাপ খুলুন অথবা অন্যদের সঙ্গে শেয়ার করুন।'));
 const close=make('button','pwa-install-close','×');close.type='button';
 close.setAttribute('aria-label','পপআপ বন্ধ করুন');close.addEventListener('click',closeDialog);
 heading.append(img,copy,close);
 const actions=make('div','pwa-install-actions');
 const share=make('button','pwa-install-later','শেয়ার করুন');share.type='button';share.addEventListener('click',shareApp);
 const open=make('button','pwa-install-primary','অ্যাপ খুলুন');open.type='button';open.addEventListener('click',openApp);
 actions.append(share,open);
 dialog.append(heading,actions);
 document.body.append(backdrop,dialog);
 updateLandingUI();
 open.focus({preventScroll:true});
}
let installBusy=false;
function installStatus(message){
 let target=document.getElementById('installLandingStatus')||document.getElementById('pwaInlineInstallStatus');
 if(!target){
  target=make('p','pwa-inline-install-status');target.id='pwaInlineInstallStatus';target.setAttribute('role','status');
  const header=document.querySelector('.site-header');
  if(header)header.after(target);else document.body.append(target);
 }
 target.textContent=message;
}
async function showInstall(){
 if(isKnownInstalled()){openApp();return}
 if(installBusy)return;
 if(!deferredPrompt){installStatus(guide());return}
 const event=deferredPrompt;deferredPrompt=null;installBusy=true;
 const buttons=[...document.querySelectorAll('#shareLandingInstall,.pwa-header-install')];
 buttons.forEach(button=>{button.disabled=true;button.setAttribute('aria-busy','true')});
 try{
  // The click goes straight to the browser's native confirmation.
  await event.prompt();
  const choice=await event.userChoice;
  if(!isKnownInstalled())installStatus(choice?.outcome==='accepted'
   ?'ইনস্টলের অনুমতি দেওয়া হয়েছে। অ্যাপটি তৈরি হলে হোম স্ক্রিনে দেখা যাবে।'
   :'ইনস্টল করা হয়নি। আবার চেষ্টা করতে ব্রাউজারের Install অপশন ব্যবহার করুন।');
 }catch{installStatus(guide())}
 finally{
  installBusy=false;
  buttons.forEach(button=>{button.disabled=false;button.removeAttribute('aria-busy')});
 }
}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog)closeDialog()});
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferredPrompt=event;
});
window.addEventListener('appinstalled',()=>{
 setInstalled();syncHeader();showOpenApp();
 const status=document.getElementById('installLandingStatus');
 if(status)status.textContent='অ্যাপটি ইনস্টল হয়েছে। এখন অ্যাপ খুলতে পারবেন।';
});
match?.addEventListener?.('change',()=>{if(installed()){setInstalled();syncHeader()}});
window.addEventListener('pageshow',syncHeader);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncHeader()});
function init(){
 syncHeader();
 const shareButton=document.getElementById('shareLandingShare');
 if(shareButton)shareButton.addEventListener('click',shareApp);
 const installButton=document.getElementById('shareLandingInstall');
 if(installButton)installButton.addEventListener('click',()=>{if(isKnownInstalled())openApp();else showInstall()});
 const urlInput=document.getElementById('shareLinkInput');
 if(urlInput){urlInput.value=shareUrl;urlInput.hidden=true}
 // Keep installation user-triggered; opening the shared page shows its button.
 if(landing&&isKnownInstalled()){
  const status=document.getElementById('installLandingStatus');
  if(status)status.textContent='অ্যাপটি এই ডিভাইসে ইনস্টল করা আছে।';
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
window.openRuqyahInstall=showInstall;
window.shareRuqyahApp=shareApp;
})();
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(require('node:path').join(__dirname,'../public/assets/pwa-install.js'),'utf8');
function setup({landing=false,standalone=false,ios=false}={}){
 const dom=new JSDOM(`<body ${landing?'data-pwa-install-landing="true"':''}><header class="site-header"><button class="theme-toggle"></button></header>${landing?'<button id="shareLandingInstall"></button><p id="installLandingStatus"></p>':''}</body>`,{url:'https://example.test/'+(landing?'install.html':'reader.html')});
 const w=dom.window,redirects=[];w.matchMedia=()=>({matches:standalone,addEventListener(){}});
 vm.runInNewContext(source,{window:w,document:w.document,navigator:{userAgent:ios?'iPhone Safari':'Chrome'},location:{href:w.location.href,pathname:w.location.pathname,replace:url=>redirects.push(url)},localStorage:w.localStorage,URL});
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 function prompt(outcome='accepted'){let calls=0;const e=new w.Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{calls++};e.userChoice=Promise.resolve({outcome});w.dispatchEvent(e);return ()=>calls}
 return {w,redirects,prompt,button:()=>w.document.querySelector(landing?'#shareLandingInstall':'.pwa-header-install')};
}
test('landing waits for click without a custom popup',()=>{const a=setup({landing:true}),calls=a.prompt();assert.equal(calls(),0);assert.equal(a.redirects.length,0);assert.equal(a.w.document.querySelector('[role="dialog"],.pwa-install-overlay'),null)});
test('one click installs; only completion navigates home',async()=>{const a=setup({landing:true}),calls=a.prompt();await a.w.openRuqyahInstall();assert.equal(calls(),1);assert.equal(a.redirects.length,0);a.w.dispatchEvent(new a.w.Event('appinstalled'));assert.deepEqual(a.redirects,['https://example.test/']);assert.equal(a.w.document.querySelector('[role="dialog"]'),null)});
test('dismissed installation permits retry with a fresh browser event',async()=>{const a=setup();a.prompt('dismissed');await a.w.openRuqyahInstall();assert.equal(a.button().disabled,false);assert.equal(a.redirects.length,0);const calls=a.prompt();await a.w.openRuqyahInstall();assert.equal(calls(),1)});
test('Safari instructions are inline and require a click',async()=>{const a=setup({landing:true,ios:true});assert.equal(a.w.document.getElementById('installLandingStatus').textContent,'');await a.w.openRuqyahInstall();assert.match(a.w.document.getElementById('installLandingStatus').textContent,/Add to Home Screen/);assert.equal(a.w.document.querySelector('[role="dialog"]'),null)});
test('standalone hides install/share button; standalone landing opens home',()=>{const a=setup({standalone:true});assert.equal(a.button().hidden,true);assert.deepEqual(setup({standalone:true,landing:true}).redirects,['https://example.test/'])});
test('header button invokes install directly and hides on completion',async()=>{const a=setup(),calls=a.prompt();await a.w.openRuqyahInstall();assert.equal(calls(),1);a.w.dispatchEvent(new a.w.Event('appinstalled'));assert.equal(a.button().hidden,true);assert.deepEqual(a.redirects,['https://example.test/'])});

import {readFileSync,writeFileSync,statSync} from 'node:fs';
// Generate a static 21-chapter index BEFORE deployment, not with document.write in Chrome.
const source='public/app-source-v36.html';
const target='public/reader.html';
let html=readFileSync(source,'utf8');
if(statSync(source).size<10000000)throw new Error('Original 21-chapter book app is incomplete');
const bridge=/<script\s+id="ruqyah-v36-custom-canvas-bridge">[\s\S]*?<\/script>/gi;
const frame=/<iframe\s+id="bookPdfFrame"[^>]*><\/iframe>/gi;
const bridges=html.match(bridge)||[];
const frames=html.match(frame)||[];
if(bridges.length!==1||frames.length!==1)throw new Error('Old PDF viewer structure not found');
const scan=bridges[0].match(/const scanKeys=(\{[^\n;]+\});/);
if(!scan||scan[1].length<1000)throw new Error('Original ayah-to-page data missing');
const replacement='<script id="ruqyah-v38-scan-map">window.__ruqyahScanKeys='+scan[1]+';</script>\n'+'<script id="ruqyah-v38-custom-canvas" src="./assets/book21-direct-v38.js"></script>';
html=html.replace(bridge,replacement);
html=html.replace(frame,'<div id="bookCanvasMount" data-ruqyah-viewer="v38-static-canvas" role="region" aria-label="নিজস্ব PDF Canvas Reader · একটানা স্ক্রল"></div>');
html=html.replace('নিজস্ব রিডার v36','নিজস্ব রিডার v38');
html=html.replace('aria-label="ব্রাউজারের PDF রিডারে খুলুন"','aria-label="মূল PDF ডাউনলোড করুন"');
const css='<style id="ruqyah-v38-static-canvas">\n'
+'#chapter-21 #bookCanvasMount{display:block!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;height:100%!important;background:#e6ebe6!important;overflow:hidden!important}\n'
+'#chapter-21 .book-pdf-reader{display:flex!important;flex-direction:column!important}\n'
+'#chapter-21 .book-pdf-message,#chapter-21 .book-pdf-fallback{display:none!important}\n'
+'#chapter-21 .v36-version-tag{color:#236849!important;font-weight:700!important}\n'
+'</style>';
if(!html.includes('</head>'))throw new Error('Missing HTML head');
html=html.replace('</head>',css+'\n</head>');
if(html.includes('id="bookPdfFrame"')||html.includes('id="ruqyah-v36-custom-canvas-bridge"')||!html.includes('id="bookCanvasMount"'))throw new Error('Native PDF viewer survived build');

// Persistent, accessible return link for the standalone 21-chapter reader.
// Inject into the generated reader, not the original 16 MB source or the homepage.
const homeLink='<nav id="ruqyah-global-nav" aria-label="ওয়েবসাইটে ফিরে যান"><a id="ruqyah-home-back" href="./index.html" aria-label="হোমপেজে ফিরে যান"><span aria-hidden="true">←</span><span>হোমপেজ</span></a><a id="ruqyah-hijama-link" href="./hijama-guide.html" aria-label="হিজামা গাইডে যান">হিজামা</a></nav>';
const homeCss='<style id="ruqyah-home-navigation">\n'
+'#ruqyah-global-nav{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(15px,env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;gap:5px;padding:4px;border:1px solid #b9d7c4;border-radius:999px;background:#f8fdf9;box-shadow:0 5px 24px #143c3052;max-width:calc(100vw - 24px);font:700 13px/1.45 system-ui,"Noto Sans Bengali",sans-serif}\n'
+'#ruqyah-global-nav a{display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;min-height:34px;padding:7px 11px;border-radius:999px;text-decoration:none;color:#155b43}\n'
+'#ruqyah-global-nav #ruqyah-home-back{background:#155b43;color:#fff}\n'
+'#ruqyah-global-nav a:hover{filter:brightness(.94)}#ruqyah-global-nav a:focus-visible{outline:3px solid #dcb95e;outline-offset:2px}\n'
+'@media(max-width:560px){#ruqyah-global-nav{font-size:12px;bottom:max(10px,env(safe-area-inset-bottom))}#ruqyah-global-nav a{padding:6px 9px;min-height:32px}}\n'
+'</style>';
const bodyTag=html.match(/<body\b[^>]*>/i);
if(!bodyTag)throw new Error('Ruqyah reader body tag is missing');
html=html.replace(bodyTag[0],bodyTag[0]+'\n'+homeLink);
html=html.replace('</head>',homeCss+'\n</head>');
if(!html.includes('id="ruqyah-home-back"') || !html.includes('href="./index.html"'))throw new Error('Homepage return link was not injected');

writeFileSync(target,html,'utf8');
if(statSync(target).size<10000000)throw new Error('Built app unexpectedly small');
writeFileSync('public/viewer-version.json',JSON.stringify({version:'v38',renderer:'direct-pdfjs-canvas',nativePdfIframe:false,build:'static-html'},null,2)+'\n','utf8');
console.log('[Ruqyah v38] Static Canvas reader built, native PDF iframe removed: '+statSync(target).size+' bytes');

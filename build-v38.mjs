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
writeFileSync(target,html,'utf8');
if(statSync(target).size<10000000)throw new Error('Built app unexpectedly small');
writeFileSync('public/viewer-version.json',JSON.stringify({version:'v38',renderer:'direct-pdfjs-canvas',nativePdfIframe:false,build:'static-html'},null,2)+'\n','utf8');
console.log('[Ruqyah v38] Static Canvas reader built, native PDF iframe removed: '+statSync(target).size+' bytes');

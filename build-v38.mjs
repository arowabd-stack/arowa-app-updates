import {readFileSync,writeFileSync,statSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Generate a static 21-chapter index BEFORE deployment, not with document.write in Chrome.
const source='public/app-source-v36.html';
const target='public/reader.html';
let html=readFileSync(source,'utf8');
if(statSync(source).size<10000000)throw new Error('Original 21-chapter book app is incomplete');
// Replace the legacy font-only switch before audio, tajweed and search take snapshots.
// These local payloads are lossless SQLite exports, keyed by surah:ayah.
// Restrict the match to a single script (the preceding chapter navigation must survive).
const scripts=html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g)||[];
const legacyFont=scripts.filter(s=>s.includes("const storeKey='ruqyah-arabic-font-v8';"));
if(legacyFont.length!==1)throw new Error('Legacy Arabic font controller not found');
const quranSources={};
for(const script of ['uthmani','indopak']){
 const payload=readFileSync('public/data/quran-'+script+'-v1.js','utf8');
 const match=payload.match(/window\.RuqyahQuranSources\.\w+=(\{[^\n]*\});/);
 if(!match)throw new Error('Invalid '+script+' payload');
 const data=JSON.parse(match[1]);
 quranSources[script]=data;
 const manifest=JSON.parse(readFileSync('public/data/quran-sources.json','utf8'));
 if(createHash('sha256').update(payload).digest('hex')!==manifest.sources[script].payloadSha256)throw new Error('Changed '+script+' text; regenerate from SQLite');
 const keys=[...html.matchAll(/class="[^"]*\bverified-verse\b[^"]*"[^>]*data-key="([^"]+)"|data-key="([^"]+)"[^>]*class="[^"]*\bverified-verse\b/g)].map(m=>m[1]||m[2]);
 if(!keys.length||keys.some(key=>typeof data[key]!=='string'))throw new Error('Missing '+script+' verse; regenerate scripts/export-quran.py');
}
// The initial HTML must also contain the default Indopak text. A cached legacy
// font controller or a disabled/failed script must not expose Uthmani as Indopak.
let seededVerses=0;
html=html.replace(/(<section class="[^"]*\bverified-verse\b[^"]*"[^>]*data-key="(\d+:\d+)"[^>]*>[\s\S]*?<p class="verified-arabic[^>]*>)[\s\S]*?(<\/p>)/g,(_,start,key,end)=>{
 const text=quranSources.indopak[key];
 if(typeof text!=='string')throw new Error('Missing default Indopak verse: '+key);
 seededVerses++;
 return start+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+end;
});
const totalVerseNodes=(html.match(/<section class="[^"]*\bverified-verse\b[^"]*"/g)||[]).length;
if(!seededVerses||seededVerses!==totalVerseNodes)throw new Error('Incomplete initial Indopak scripture');
html=html.replace(legacyFont[0],'<script src="./data/quran-uthmani-v1.js"></script>\n<script src="./data/quran-indopak-v1.js"></script>\n<script src="./assets/reader-scripture.js"></script>');
function replaceOnce(needle,replacement){
 if(html.split(needle).length!==2)throw new Error('Scripture integration point missing or duplicated: '+needle.slice(0,70));
 html=html.replace(needle,replacement);
}
replaceOnce('originals.set(node,node.textContent.trim());','originals.set(node,node.textContent);');
replaceOnce("button.addEventListener('click',()=>toggleState(!enabled));",`window.addEventListener('ruqyah:scripture-changed',()=>{
 for(const node of sourceNodes)originals.set(node,node.textContent);
 for(const key of verses.keys())paintKey(key);
 statusUpdate();
});
button.addEventListener('click',()=>toggleState(!enabled));`);
replaceOnce('// Each named tag corresponds to an identifiable source section/topic rather than an invented diagnosis.',`window.addEventListener('ruqyah:scripture-changed',()=>{
 for(const record of entries){
  if(record.type!=='verse')continue;
  record.fields.arabic=content(record.el,'.verified-arabic');
  record.normalized.arabic=norm(record.fields.arabic);
 }
 if(input.value.trim())performSearch();
});
// Each named tag corresponds to an identifiable source section/topic rather than an invented diagnosis.`);
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
html=html.replace('নিজস্ব রিডার v36','একটানা স্ক্রলে পড়ুন');
html=html.replace('aria-label="ব্রাউজারের PDF রিডারে খুলুন"','aria-label="মূল PDF ডাউনলোড করুন"');
const css='<style id="ruqyah-v38-static-canvas">\n'
+'#chapter-21 #bookCanvasMount{display:block!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;height:100%!important;background:#e6ebe6!important;overflow:hidden!important}\n'
+'#chapter-21 .book-pdf-reader{display:flex!important;flex-direction:column!important}\n'
+'#chapter-21 .book-pdf-message,#chapter-21 .book-pdf-fallback{display:none!important}\n'
+'#chapter-21 .v36-version-tag{color:#236849!important;font-weight:700!important}\n'
+'</style>';
if(!html.includes('</head>'))throw new Error('Missing HTML head');
html=html.replace('</head>',css+'\n</head>');
// Reader without a selected book opens the 21-cover library, not the sidebar.
// Direct #chapter-N links continue to open the original individual readers.
const bookChooserGate='<script>if(!location.hash||location.hash==="#")location.replace(new URL("./ruqyah-guide.html",location.href).href);</script>';
html=html.replace('</head>',bookChooserGate+'\n</head>');
if(html.includes('id="bookPdfFrame"')||html.includes('id="ruqyah-v36-custom-canvas-bridge"')||!html.includes('id="bookCanvasMount"'))throw new Error('Native PDF viewer survived build');

// Shared accessible site navigation and visual system, without rewriting scripture.
const header=readFileSync('public/assets/ruqyah-header.html','utf8');
html=html.replace(/<body\b[^>]*>/i,tag=>tag+'\n'+header);
html=html.replace('</head>','<script>try{document.documentElement.dataset.theme=JSON.parse(localStorage.getItem("library-theme"))||"light"}catch(e){}</script><link rel="stylesheet" href="./assets/hugeicons.css"><link rel="stylesheet" href="./assets/library.css"><link rel="stylesheet" href="./assets/ruqyah-redesign.css"></head>');
html=html.replace('</body>','<div id="toast" class="toast" role="status" aria-live="polite"></div><script src="./assets/library.js"></script><script src="./assets/pwa-install.js"></script><script src="./assets/ruqyah-redesign.js"></script><script src="./assets/ruqyah-library-search-bridge.js"></script><script src="./assets/reader-settings.js"></script></body>');
// The shared shell uses a details drawer at every viewport width.
html=html.replace("const wide=()=>window.matchMedia('(min-width: 1050px)').matches;","const wide=()=>false;");
// Serve only the Arabic fonts a visitor selects instead of downloading every embedded font in HTML.
mkdirSync('public/assets/ruqyah-fonts',{recursive:true});
const offlineFonts=new Set();
html=html.replace(/url\(data:font\/(woff2|ttf|otf|woff);base64,([A-Za-z0-9+/=]+)\)/g,(_,extension,encoded)=>{
 const bytes=Buffer.from(encoded,'base64');
 const filename=createHash('sha256').update(bytes).digest('hex').slice(0,16)+'.'+extension;
 writeFileSync('public/assets/ruqyah-fonts/'+filename,bytes);
 return 'url(./assets/ruqyah-fonts/'+filename+')';
});
// Both writing systems must also have their fonts available before the first offline switch.
for(const family of ['AlQuran IndoPak','Native Uthmani','Ruqyah Hafs']){
 const face=[...html.matchAll(/@font-face\{[^}]+\}/g)].find(m=>m[0].includes("font-family:'"+family+"'"));
 const path=face?.[0].match(/url\(\.\/([^)]*)\)/)?.[1];
 if(!path)throw new Error('Missing offline Arabic font: '+family);
 offlineFonts.add(path);
}
writeFileSync('public/data/reader-fonts.json',JSON.stringify([...offlineFonts],null,2)+'\n');
writeFileSync(target,html,'utf8');
if(statSync(target).size<10000000)throw new Error('Built app unexpectedly small');
writeFileSync('public/viewer-version.json',JSON.stringify({version:'v38',renderer:'direct-pdfjs-canvas',nativePdfIframe:false,build:'static-html'},null,2)+'\n','utf8');
console.log('[Ruqyah v38] Static Canvas reader built, native PDF iframe removed: '+statSync(target).size+' bytes');

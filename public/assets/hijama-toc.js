(()=>{
'use strict';
// Every entry is extracted from the original book's printed TOC (PDF pp. 3-5).
// Printed page N is PDF page N+1, verified against the book's actual labels.
const groups=[{"name":"পরিচিতি ও হাদিস","from":5,"to":18,"items":[{"title":"হিজামার পরিচিতি","printed":5,"pdf":6},{"title":"হিজামা করিয়ে শরীর থেকে কী বের করা হয়?","printed":6,"pdf":7},{"title":"অন্য চিকিৎসার সাথে হিজামার পার্থক্য","printed":7,"pdf":8},{"title":"রক্তদান ও হিজামার পার্থক্য","printed":8,"pdf":9},{"title":"হিজামা চিকিৎসার ইতিহাস","printed":9,"pdf":10},{"title":"হিজামা চিকিৎসা সংক্রান্ত হাদিস","printed":11,"pdf":12},{"title":"শরীরে হিজামার স্থান সংক্রান্ত হাদীস","printed":13,"pdf":14},{"title":"হিজামা করানোর দিন ও তারিখ সংক্রান্ত হাদীস","printed":14,"pdf":15},{"title":"রোজা অবস্থায় হিজামা সংক্রান্ত হাদীস","printed":15,"pdf":16},{"title":"ইহরাম অবস্থায় হিজামা করানো সংক্রান্ত হাদীস","printed":16,"pdf":17},{"title":"হিজামা থেরাপিস্টের পারিশ্রমিক সংক্রান্ত হাদীস","printed":16,"pdf":17},{"title":"হিজামার হুকুম সংক্রান্ত হাদীস","printed":17,"pdf":18},{"title":"হিজামার সাথে জড়িত কিছু বিষয়","printed":18,"pdf":19}]},{"name":"সুফল ও গবেষণা","from":19,"to":47,"items":[{"title":"হিজামার উপকারিতা","printed":19,"pdf":20},{"title":"কোলেস্টেরলের সমস্যায় হিজামার উপকারিতা","printed":25,"pdf":26},{"title":"মহিলাদের বন্ধ্যত্বের চিকিৎসায় হিজামার উপকারিতা","printed":25,"pdf":26},{"title":"রূপচর্চায় হিজামার উপকারিতা","printed":26,"pdf":27},{"title":"চুল পড়া রোধে এবং নতুন চুল গজাতে হিজামার উপকারিতা","printed":26,"pdf":27},{"title":"হিজামার দ্বারা রোগের চিকিৎসা","printed":28,"pdf":29},{"title":"হিজামার দ্বারা যেসব রোগের চিকিৎসা করানো হয় তার তালিকা","printed":29,"pdf":30},{"title":"হিজামার থিওরি সমূহ","printed":30,"pdf":31},{"title":"তাইবা থিওরি","printed":31,"pdf":32},{"title":"নাইট্রিক অক্সাইড থিওরি","printed":32,"pdf":33},{"title":"হিজামা করালে কিভাবে নাইট্রিক অক্সাইড তৈরি হয়?","printed":33,"pdf":34},{"title":"ল্যাব টেস্ট: হিজামার বিজ্ঞানভিত্তিক উপকারিতা","printed":35,"pdf":36},{"title":"চামড়ায় হিজামা করালে রোগ ভাল হয় কিভাবে?","printed":34,"pdf":35},{"title":"একটি গবেষণা","printed":36,"pdf":37},{"title":"ভরাপেটে হিজামা","printed":38,"pdf":39},{"title":"শরীরের বিভিন্ন অর্গান এবং তন্ত্রের উপর হিজামার কার্যকারিতা","printed":40,"pdf":41},{"title":"বিশেষ কিছু রোগের ক্ষেত্রে হিজামার প্রভাব নিয়ে বৈজ্ঞানিক গবেষণা","printed":42,"pdf":43},{"title":"চাঁদের সাথে হিজামার সম্পর্ক","printed":44,"pdf":45},{"title":"হিজামার উত্তম তারিখ","printed":46,"pdf":47},{"title":"হিজামা করানোর জন্য সপ্তাহের সর্বোত্তম বার","printed":46,"pdf":47},{"title":"হিজামা করানোর জন্য দিনের সর্বোত্তম সময়","printed":47,"pdf":48},{"title":"রোগীর ক্ষেত্রে বয়স","printed":47,"pdf":48}]},{"name":"প্রস্তুতি ও নিরাপদ সেবা","from":48,"to":72,"items":[{"title":"হিজামার প্রয়োজনীয় যন্ত্রপাতি","printed":48,"pdf":49},{"title":"শরীরের কোন অংশে কত সাইজের কাপ বসানো উচিৎ?","printed":50,"pdf":51},{"title":"সংক্রামক রোগের বর্ণনা","printed":51,"pdf":52},{"title":"হিজামা থেরাপিস্টের ব্যক্তিগত প্রস্তুতি","printed":52,"pdf":53},{"title":"হিজামার পূর্বে রোগীর প্রস্তুতি এবং কিছু সতর্কতা","printed":53,"pdf":54},{"title":"কেন খালি পেটে হিজামা করাতে হবে?","printed":54,"pdf":55},{"title":"রোজা রাখা অবস্থায় হিজামা","printed":55,"pdf":56},{"title":"রোগীর আসন","printed":56,"pdf":57},{"title":"সাকশনের প্রকারভেদ","printed":57,"pdf":58},{"title":"রোগীর পোশাক","printed":57,"pdf":58},{"title":"যাদের হিজামা করানো যাবেনা","printed":58,"pdf":59},{"title":"হিজামার ধাপ সমূহ","printed":59,"pdf":60},{"title":"স্ক্র্যাচ বা ইন্সিশনের নিয়ম","printed":60,"pdf":61},{"title":"হিজামার পরে রোগীর করণীয়","printed":61,"pdf":62},{"title":"হিজামা করানোর পর গোসল করা নিয়ে কিছু কথাঃ","printed":62,"pdf":63},{"title":"হিজামা করানোর পরে রোগীর সাময়িক কিছু পরিবর্তন","printed":62,"pdf":63},{"title":"হিজামা করানোর সময় রোগীদের কিছু অপ্রত্যাশিত অবস্থা","printed":63,"pdf":64},{"title":"ফোসকা পড়া","printed":63,"pdf":64},{"title":"রোগীর শরীর থেকে রক্ত একেবারেই কম বের হওয়া","printed":64,"pdf":65},{"title":"বিশেষ কিছু রোগীদের ক্ষেত্রে হিজামার নিয়ম","printed":65,"pdf":66},{"title":"ইহরাম বাঁধা অবস্থায় হিজামা","printed":67,"pdf":68},{"title":"জাদুর চিকিৎসায় হিজামা","printed":67,"pdf":68},{"title":"মহিলাদের বিশেষ কিছু ক্ষেত্রে হিজামা","printed":69,"pdf":70},{"title":"থেরাপিস্টের পিরিয়ড চলাকালীন হিজামা","printed":71,"pdf":72},{"title":"থেরাপিস্টের গর্ভাবস্থায় হিজামা","printed":69,"pdf":70},{"title":"রোগীর পিরিয়ড চলাকালীন হিজামা","printed":71,"pdf":72},{"title":"গর্ভবতী রোগীর হিজামা","printed":69,"pdf":70},{"title":"প্রসবের পর হিজামা","printed":70,"pdf":71},{"title":"প্রসুতি মায়ের হিজামা","printed":70,"pdf":71},{"title":"সিজারিয়ান মায়েদের ক্ষেত্রে হিজামা","printed":71,"pdf":72},{"title":"রোগীর মেনোপজ অবস্থায় হিজামা","printed":72,"pdf":73}]},{"name":"অঙ্গ, ডিটক্স ও কাপিং পয়েন্ট","from":73,"to":106,"items":[{"title":"হিজামার কাপ বসানোর মূলনীতি","printed":73,"pdf":74},{"title":"ভাইটাল অর্গান এর বর্ণনা এবং ডিটক্স","printed":73,"pdf":74},{"title":"মেরুদণ্ড","printed":74,"pdf":75},{"title":"হৃদপিন্ড","printed":75,"pdf":76},{"title":"ফুসফুস বা লাংস","printed":77,"pdf":78},{"title":"কিডনি","printed":79,"pdf":80},{"title":"এবডোমেন","printed":80,"pdf":81},{"title":"লিভার","printed":83,"pdf":84},{"title":"স্টোমাক বা পাকস্থলী","printed":85,"pdf":86},{"title":"ক্ষুদ্রান্ত্র, Small Intestine","printed":87,"pdf":88},{"title":"অগ্নাশয়","printed":87,"pdf":88},{"title":"স্প্লীন বা প্লীহা","printed":89,"pdf":90},{"title":"বৃহদান্ত্র, Large Intestine","printed":91,"pdf":92},{"title":"থাইমাস","printed":92,"pdf":93},{"title":"ইউরিনারি ব্লাডার","printed":92,"pdf":93},{"title":"প্রস্টেট","printed":93,"pdf":94},{"title":"স্ত্রী-প্রজননতন্ত্রের অভ্যন্তরীণ অর্গান সমূহের বর্ণনা ও ডিটক্স","printed":94,"pdf":95},{"title":"মস্তিষ্কের বর্ণনা","printed":96,"pdf":97},{"title":"মাথার হিজামা পয়েন্টের বর্ণনা","printed":100,"pdf":101},{"title":"ঘাড়ের হিজামার পয়েন্ট এর আলোচনা","printed":103,"pdf":104},{"title":"কোমরের নিচের অংশের হিজামা পয়েন্টের আলোচনা","printed":103,"pdf":104}]},{"name":"প্রশ্নোত্তর ও সুন্নাহ পয়েন্ট","from":107,"to":122,"items":[{"title":"কিছু প্রশ্নের উত্তর","printed":107,"pdf":108},{"title":"হিজামা কেন করাবো?","printed":107,"pdf":108},{"title":"হিজামার মাধ্যমে বের হওয়া রক্ত চামড়ার কোন অংশ থেকে আসে? হিজামা করালে শিরা বা ধমনী কাটা পড়বে কিনা?","printed":108,"pdf":109},{"title":"হিজামার ক্ষেত্রে ব্লেড নাকি কলম- কোনটা ব্যবহার করব?","printed":109,"pdf":110},{"title":"হিজামা আমাদের শরীরে কিডনির মতো কাজ করে কিনা","printed":111,"pdf":112},{"title":"হিজামা করালে সাথে কি অন্য ঔষুধ সেবন চালিয়ে যাওয়া যায় কিনা","printed":112,"pdf":113},{"title":"কতদিন পর পর বা কতবার হিজামা করানো উচিৎ","printed":113,"pdf":114},{"title":"হিজামার দুই সেশনের মধ্যবর্তী গ্যাপ কতদিন হওয়া উচিৎ?","printed":114,"pdf":115},{"title":"এক সেশনে কতগুলো কাপ বসানো যাবে?","printed":114,"pdf":115},{"title":"কিভাবে বুঝবো আমার হিজামা করানো দরকার?","printed":115,"pdf":116},{"title":"হিজামার সুন্নাহ পয়েন্ট এর আলোচনা","printed":116,"pdf":117},{"title":"বিভিন্ন প্রকার ডিটক্স বা ডিটক্সিফিকেশন পয়েন্ট এর আলোচনা","printed":116,"pdf":117},{"title":"রোগ ভিত্তিক হিজামা পয়েন্ট এর বর্ণনা","printed":120,"pdf":121},{"title":"হিজামার লিফলেট কিভাবে তৈরি করব?","printed":122,"pdf":123}]}];
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const sidebar=document.getElementById('hijamaToc');
const toggle=document.getElementById('hijamaTocToggle');
const closeButton=document.getElementById('hijamaTocClose');
const search=document.getElementById('hijamaTocSearch');
const content=document.getElementById('hijamaTocSections');
const backdrop=document.getElementById('hijamaTocBackdrop');
const count=document.getElementById('hijamaTocCount');
if(!sidebar||!toggle||!content)return;
const buttons=new Map();
const el=(tag,cls,txt)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(txt!==undefined)n.textContent=txt;return n;
};
function setOpen(open){
 document.body.classList.toggle('hijama-toc-open',open);
 sidebar.setAttribute('aria-hidden',String(!open&&matchMedia('(max-width: 850px)').matches));
 toggle.setAttribute('aria-expanded',String(open));
 if(open&&matchMedia('(max-width: 850px)').matches){search.focus({preventScroll:true})}
 else if(!open&&document.activeElement===search)toggle.focus({preventScroll:true});
}
toggle.addEventListener('click',()=>setOpen(!document.body.classList.contains('hijama-toc-open')));
closeButton?.addEventListener('click',()=>setOpen(false));
backdrop?.addEventListener('click',()=>setOpen(false));
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')setOpen(false)});
function draw(){
 content.replaceChildren();buttons.clear();
 const top=document.createElement('div');top.className='hijama-toc-intro';
 const cover=el('button','hijama-toc-link','প্রচ্ছদ');cover.type='button';
 cover.append(el('span','hijama-toc-num',bn(1)));cover.addEventListener('click',()=>go(1));
 const original=el('button','hijama-toc-link','মূল সূচিপত্র');original.type='button';
 original.append(el('span','hijama-toc-num',bn(3)+'–'+bn(5)));original.addEventListener('click',()=>go(3));
 top.append(cover,original);content.append(top);
 for(const group of groups){
  const detail=el('details','hijama-toc-group');
  detail.open=group.from===5;
  const summary=el('summary','hijama-toc-section-title',group.name);
  summary.append(el('span','hijama-toc-group-range',bn(group.from)+'–'+bn(group.to)));
  detail.append(summary);
  const links=el('div','hijama-toc-list');
  for(const item of group.items){
   const button=el('button','hijama-toc-link',item.title);button.type='button';
   button.dataset.page=String(item.pdf);
   button.dataset.printed=String(item.printed);
   button.setAttribute('aria-label',item.title+', মুদ্রিত পৃষ্ঠা '+bn(item.printed));
   button.append(el('span','hijama-toc-num',bn(item.printed)));
   button.addEventListener('click',()=>go(item.pdf));
   links.append(button);buttons.set(button,item);
  }
  detail.append(links);content.append(detail);
 }
 count.textContent=bn(groups.reduce((n,g)=>n+g.items.length,0))+'টি বিষয়';
}
function go(page){
 if(typeof window.HijamaPDFGoToPage==='function')window.HijamaPDFGoToPage(page);
 else window.location.href='hijama-book.html?page='+encodeURIComponent(page);
 setActive(page);
 if(matchMedia('(max-width: 850px)').matches)setOpen(false);
}
function setActive(page){
 const p=Number(page)||1;let active=null, activeStart=-1;
 for(const button of buttons.keys()){
  const n=Number(button.dataset.page);
  if(n<=p&&n>=activeStart){activeStart=n;active=button}
  button.classList.remove('is-active');button.removeAttribute('aria-current');
 }
 if(active){
  active.classList.add('is-active');active.setAttribute('aria-current','location');
  const group=active.closest('details');
  if(group&&!search.value.trim())group.open=true;
 }
}
search.addEventListener('input',()=>{
 const query=search.value.trim().toLocaleLowerCase('bn-BD');
 let hits=0;
 for(const group of content.querySelectorAll('.hijama-toc-group')){
  let groupHits=0;
  for(const btn of group.querySelectorAll('.hijama-toc-link')){
   const row=buttons.get(btn);
   const visible=!query||row.title.toLocaleLowerCase('bn-BD').includes(query)||bn(row.printed).includes(query)||String(row.printed).includes(query);
   btn.hidden=!visible;if(visible){hits++;groupHits++;}
  }
  group.hidden=!!query&&!groupHits;
  if(query&&groupHits)group.open=true;
 }
 const intro=content.querySelector('.hijama-toc-intro');if(intro)intro.hidden=!!query;
 count.textContent=query?bn(hits)+'টি ফলাফল':bn(buttons.size)+'টি বিষয়';
});
document.addEventListener('hijama:pagechange',e=>setActive(e.detail?.page));
window.addEventListener('resize',()=>{if(!matchMedia('(max-width: 850px)').matches)setOpen(false)},{passive:true});
draw();
let initial=1;
try{const n=Number(new URL(location.href).searchParams.get('page')||localStorage.getItem('hijama-last-read-page')||1);if(n>0)initial=n}catch{}
setActive(initial);
})();

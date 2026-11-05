(()=>{
'use strict';
// The 21-book landing hands its search term to the existing full-text
// Arabic/Bangla search. Preserve the original search algorithm and results.
const params=new URL(location.href).searchParams;
if(!params.has('search')&&!params.has('openSearch'))return;
const query=(params.get('search')||'').trim().slice(0,260);
let tries=0;
function openSearch(){
 const trigger=document.getElementById('globalSearchOpen')||document.getElementById('sideGlobalSearch');
 const input=document.getElementById('globalSearchQuery');
 const overlay=document.getElementById('globalSearchOverlay');
 if(!trigger||!input||!overlay){
  if(++tries<22)setTimeout(openSearch,150);
  return;
 }
 trigger.click();
 if(query){
  input.value=query;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
 }
 input.focus({preventScroll:true});
}
if(document.readyState==='complete')setTimeout(openSearch,100);
else window.addEventListener('load',()=>setTimeout(openSearch,120),{once:true});
})();
(()=>{
'use strict';
const form=document.getElementById('ruqyahLibrarySearch');
const field=document.getElementById('ruqyahLibraryQuery');
if(!form||!field)return;
form.addEventListener('submit',event=>{
 event.preventDefault();
 const q=field.value.trim().slice(0,260);
 const target=new URL('reader.html',document.baseURI);
 if(q)target.searchParams.set('search',q);
 else target.searchParams.set('openSearch','1');
 target.hash='chapter-1';
 location.href=target.href;
});
})();
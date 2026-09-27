let state={saved:[],notes:{}};
const featured=[
 ['picasso-celestina-dove','首次公开'],
 ['lu-xun-kollwitz-album','限量103册'],
 ['warhol-flowers','《花》系列'],
 ['picasso','1952年海报'],
 ['miro-work-2','色彩与符号'],
 ['dali-paradise','超现实主义'],
 ['zhao','《四季》系列'],
 ['mucha-untitled-3','装饰艺术'],
 ['xu-kuang-faraway','中国木刻'],
 ['tan-ping-untitled','当代抽象']
];
const featuredLabels=Object.fromEntries(featured);
const featuredWorks=featured.map(([id])=>works.find(w=>w.id===id));
if(featuredWorks.some(w=>!w))throw Error('优先看的作品缺少资料');
const otherWorks=works.filter(w=>!featuredLabels[w.id]);
let storageAvailable=true;
try{
 const v=JSON.parse(localStorage.getItem('print-guide-v1'));
 if(v&&Array.isArray(v.saved)&&v.notes&&typeof v.notes==='object'){
  state.saved=v.saved.filter(id=>works.some(w=>w.id===id));
  for(const w of works)if(typeof v.notes[w.id]==='string')state.notes[w.id]=v.notes[w.id];
 }
}catch{storageAvailable=false}

function persist(){
 try{localStorage.setItem('print-guide-v1',JSON.stringify(state))}
 catch{storageAvailable=false;toast('浏览器未允许保存，本次关闭后记录可能丢失。')}
}
let toastTimer;
function toast(text){
 const e=document.getElementById('toast');
 e.textContent=text;e.style.display='block';clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>e.style.display='none',3500);
}
function setSaved(id,value){
 if(!works.some(w=>w.id===id)||typeof value!=='boolean')throw Error('无效的作品或收藏状态');
 state.saved=state.saved.filter(x=>x!==id);
 if(value)state.saved.push(id);
 persist();render();
 return {id,saved:value};
}
function artworkMeta(w){return [w.year,w.medium,w.size].filter(Boolean).join(' / ')}
function card(w,notes=false,number=null){
 const article=document.createElement('article');
 article.className='art-card';
 article.id=(notes?'saved-':'work-')+w.id;
 const opener=document.createElement('div');
 opener.className='art-card-open';
 opener.setAttribute('role','button');
 opener.setAttribute('tabindex','0');
 opener.setAttribute('aria-haspopup','dialog');
 opener.setAttribute('aria-label',`打开${w.artist}《${w.title}》的详细讲解`);
 const box=document.createElement('div');
 box.className='art-image';
 if(w.image){
  const img=document.createElement('img');
  img.src=w.image;img.alt=w.imageAlt||w.artist+'《'+w.title+'》';img.loading=number!==null&&number<=3?'eager':'lazy';
  box.append(img);
  if(w.imageContext){
   const context=document.createElement('span');
   context.className='image-context';context.textContent=w.imageContext;
   box.append(context);
  }
 }else{
  box.classList.add('art-image-placeholder');
  const notice=document.createElement('span');
  notice.textContent='暂无本展展品图 · 到现场看原件';
  box.append(notice);
 }
 if(number!==null){const num=document.createElement('span');num.className='number';num.textContent=String(number).padStart(2,'0');box.append(num)}
 opener.append(box);
 const body=document.createElement('div');
 body.className='card-body';
 const label=featuredLabels[w.id]||w.kind;
 body.innerHTML=`${label?`<span class="work-kind">${label}</span>`:''}<div class="artist">${w.artist}</div><div class="title-row"><h3>${w.title}</h3></div>${artworkMeta(w)?`<div class="medium">${artworkMeta(w)}</div>`:''}<p class="prompt">${w.summary}</p>`;
 opener.append(body);
 opener.addEventListener('click',()=>showArtwork(w,opener));
 opener.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();showArtwork(w,opener)}
 });
 article.append(opener);
 const favorite=document.createElement('button');
 favorite.type='button';favorite.className='favorite';
 const isSaved=state.saved.includes(w.id);
 favorite.setAttribute('aria-label',(isSaved?'取消收藏':'收藏')+'《'+w.title+'》');
 favorite.setAttribute('aria-pressed',String(isSaved));favorite.textContent=isSaved?'♥':'♡';
 favorite.onclick=event=>{
  event.stopPropagation();
  const next=!state.saved.includes(w.id);
  setSaved(w.id,next);
  const updated=document.getElementById(article.id);
  if(updated)updated.querySelector('.favorite').focus({preventScroll:true});
  toast(next?'已收藏':'已取消收藏');
 };
 article.append(favorite);
 if(notes){
  const label=document.createElement('label');label.className='note-label';label.textContent='我的笔记';
  const ta=document.createElement('textarea');ta.className='note';ta.maxLength=2000;ta.placeholder='记录作品细节或感受';
  ta.value=state.notes[w.id]||'';ta.setAttribute('aria-label',w.title+'的笔记');
  ta.oninput=()=>{state.notes[w.id]=ta.value;persist()};
  label.appendChild(ta);article.appendChild(label);
 }
 return article;
}
function showArtwork(w,trigger){
 const dialog=document.getElementById('art-dialog');
 const content=document.getElementById('art-dialog-content');
 const image=w.image?`<div class="art-dialog-image"><img src="${w.image}" alt="${w.imageAlt||w.artist+'《'+w.title+'》'}"></div>`:'';
 const imageNote=w.imageNote?`<p class="image-note">${w.imageNote}</p>`:'';
 const sections=w.sections.map(s=>`<section class="explanation"><h4>${s.heading}</h4><p>${s.text}</p></section>`).join('');
 const sources=w.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a>`).join('');
 content.innerHTML=`<div class="art-dialog-layout${w.image?'':' art-dialog-text-only'}">${image}<div class="art-dialog-copy"><div class="artist">${w.artist}</div><h2 id="art-dialog-title">${w.title}</h2>${artworkMeta(w)?`<div class="medium">${artworkMeta(w)}</div>`:''}<p class="dialog-summary">${w.summary}</p>${imageNote}${sections}<div class="source-links">${sources}</div></div></div>`;
 dialog.returnValue='';
 dialog.showModal();
 dialog.querySelector('.art-dialog-close').onclick=()=>dialog.close();
 dialog.onclick=event=>{if(event.target===dialog)dialog.close()};
 if(trigger)dialog.addEventListener('close',()=>{if(trigger.isConnected)trigger.focus({preventScroll:true})},{once:true});
}
function render(){
 document.getElementById('art-grid').replaceChildren(...featuredWorks.map((w,i)=>card(w,false,i+1)));
 document.getElementById('more-grid').replaceChildren(...otherWorks.map((w,i)=>card(w,false,featuredWorks.length+i+1)));
 document.getElementById('featured-count').textContent=`${featuredWorks.length} 件（套）`;
 document.getElementById('more-count').textContent=`${otherWorks.length} 件`;
 document.getElementById('saved-grid').replaceChildren(...works.filter(w=>state.saved.includes(w.id)).map(w=>card(w,true)));
 document.getElementById('saved-count').textContent=state.saved.length;
 document.getElementById('empty').hidden=state.saved.length>0;
}
function route(){
 const id=['guide','learn','visit','saved'].includes(location.hash.slice(1))?location.hash.slice(1):'guide';
 document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==id);
 document.querySelectorAll('[data-tab]').forEach(el=>{if(el.dataset.tab===id)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
}
window.addEventListener('hashchange',route);
document.getElementById('share').onclick=async()=>{
 const url=location.origin+location.pathname+'#guide';
 if(navigator.share){
  try{await navigator.share({title:'一起看版画 · 复数的魅力',text:'关山月美术馆国际版画展，重点作品讲解与参观信息。',url});return}
  catch(e){if(e.name==='AbortError')return}
 }
 try{await navigator.clipboard.writeText(url);toast('链接已复制')}
 catch{document.getElementById('share-url').value=url;document.getElementById('share-dialog').showModal();document.getElementById('share-url').select()}
};
render();route();
if(document.modelContext?.registerTool){
 try{
  Promise.resolve(document.modelContext.registerTool({name:'set_artwork_saved',title:'收藏或取消收藏展品',description:'在当前浏览器收藏或取消收藏一件展品。笔记与收藏不共享给其他访客。',inputSchema:{type:'object',properties:{id:{type:'string',enum:works.map(w=>w.id)},saved:{type:'boolean'}},required:['id','saved'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object')throw Error('需要作品ID和收藏状态');return setSaved(input.id,input.saved)}})).catch(()=>{});
 }catch{}
}

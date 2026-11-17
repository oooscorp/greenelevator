(function(){
 'use strict';
 var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var clamp=function(x,a,b){return Math.max(a,Math.min(b,x));},ease=function(x){x=clamp(x,0,1);return x*x*(3-2*x);};
 // Sequential fades never leave two readable contents visible at the same time.
 function fadeSwap(host,change){
  var state=host._fadeState;if(state){state.cancelled=true;state.animations.forEach(function(a){a.cancel();});}
  state={cancelled:false,animations:[]};host._fadeState=state;
  var out=reduced?null:host.animate([{opacity:getComputedStyle(host).opacity},{opacity:0}],{duration:180,easing:'ease-in',fill:'forwards'});if(out)state.animations.push(out);
  return (out?out.finished.catch(function(){}):Promise.resolve()).then(function(){if(state.cancelled)return;change();if(out)out.cancel();var fade=reduced?null:host.animate([{opacity:0},{opacity:1}],{duration:320,easing:'ease-out'});if(fade)state.animations.push(fade);});
 }
 var guide=document.querySelector('.guide-panels');
 if(guide){
  var tabButtons=Array.from(document.querySelectorAll('.guide-tabs button')),tabPanels=Array.from(guide.querySelectorAll(':scope > [role=tabpanel]')),tabIndex=0,optionIndex=0;
  var opts=Array.from(document.querySelectorAll('[data-guide-select]')),panels=Array.from(document.querySelectorAll('[data-guide-option]')),options=document.querySelector('.guide-options');
  function moveDot(){options.style.setProperty('--guide-dot-y',(opts[optionIndex].offsetTop-opts[0].offsetTop)+'px');}
  tabButtons.forEach(function(button,i){button.addEventListener('click',function(){if(tabIndex===i)return;tabIndex=i;tabButtons.forEach(function(b,j){b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});fadeSwap(guide,function(){tabPanels.forEach(function(p,j){p.hidden=j!==i;});guide.dataset.tab=i?'inspection':'maintenance';if(i===1){guide.querySelectorAll('.inspection-table').forEach(function(table,j){table.getAnimations().forEach(function(a){a.cancel();});if(!reduced)table.animate([{opacity:0},{opacity:1}],{duration:550,delay:j*250,easing:'ease-out',fill:'backwards'});});}else moveDot();});});});
  opts.forEach(function(button,i){button.addEventListener('click',function(){if(optionIndex===i)return;optionIndex=i;opts.forEach(function(b,j){b.setAttribute('aria-pressed',String(i===j));});moveDot();fadeSwap(document.querySelector('.guide-option-stage'),function(){panels.forEach(function(p,j){p.hidden=i!==j;});guide.dataset.option=String(i);});});});
  moveDot();addEventListener('resize',moveDot);
 }
 var showcase=document.querySelector('.project-showcase-track'),procedure=document.querySelector('.replacement-procedure-track');
 var smooth=scrollY,raf=0,last=0,phase=-1,numberRun=0,numberTimers=[],photoAnimations=[],currentPhoto=0,captionAnimation=null,shadeStarted=0;
 var years=['2026','2025','2024'],titles=['서울대학교','국립중앙박물관','부산오페라하우스'],places=['서울','서울','부산'];
 var projectImages=showcase?Array.from(showcase.querySelectorAll('.project-photo>img')):[],yearEl=showcase?showcase.querySelector('.project-year'):null,caption=showcase?showcase.querySelector('.project-caption'):null;
 var photoOpts={w:27.155,h:50,t:6,g:.65,on:'#fff',off:'rgba(255,255,255,.2)'};
 function cancelNumbers(){++numberRun;numberTimers.forEach(clearTimeout);numberTimers=[];}
 function later(fn,ms){var run=numberRun;var id=setTimeout(function(){if(run===numberRun)fn();},ms);numberTimers.push(id);return id;}
 function cancelPhotos(){photoAnimations.forEach(function(a){a.cancel();});photoAnimations=[];showcase.querySelectorAll('.green-zoom-ghost').forEach(function(e){e.remove();});}
 function setProject(index){
  if(index===phase)return;var oldPhase=phase;phase=index;cancelNumbers();cancelPhotos();if(captionAnimation)captionAnimation.cancel();
  showcase.dataset.phase=String(index);yearEl.setAttribute('aria-label',years[index]+'년');
  photoAnimations=GreenMotion.photoTransition(projectImages,index,currentPhoto,oldPhase<0&&index===0);currentPhoto=index;
  if(photoAnimations.length){var local=index;photoAnimations[0].finished.then(function(){if(phase===local)cancelPhotos();}).catch(function(){});}
  var run=numberRun;
  // About's numeric cycle starts immediately with the new photo; no whole-year fade.
  Array.from(yearEl.children).forEach(function(cell,i){GreenMotion.animateGlyph(cell,years[index][i],photoOpts,null,later,i);});
  function captionIn(){if(run!==numberRun)return;caption.querySelector('h2').textContent=titles[index];caption.querySelector('p').textContent='승객용 엘리베이터 · '+places[index];caption.style.opacity='1';if(!reduced)captionAnimation=caption.animate([{opacity:0},{opacity:1}],{duration:400,easing:'ease-out'});}
  if(oldPhase<0||reduced){captionIn();}else{captionAnimation=caption.animate([{opacity:getComputedStyle(caption).opacity},{opacity:0}],{duration:180,easing:'ease-in',fill:'forwards'});captionAnimation.finished.then(function(){if(run!==numberRun)return;captionAnimation.cancel();captionIn();}).catch(function(){});}
 }
 if(showcase){
  var countOpts={w:22.127,h:40,t:4.5,g:.6,on:'#000',off:'#d0d0d0'};
  var countDigits=Array.from(showcase.querySelectorAll('[data-motion-digit]'));
  countDigits.forEach(function(cell){cell.replaceChildren(GreenMotion.createGlyph(cell.dataset.motionDigit,countOpts).svg);});
  // The home section-five profile: six 48ms samples, 60ms pause, 65ms segment fill.
  var startCounters=function(){if(showcase.dataset.counted)return;showcase.dataset.counted='true';countDigits.forEach(function(cell,i){GreenMotion.animateGlyph(cell,cell.dataset.motionDigit,countOpts,null,null,i);});};
  var titleLast=showcase.querySelector('h1 .motion-line:last-child>span');titleLast.addEventListener('transitionend',function(e){if(e.propertyName==='transform')startCounters();},{once:true});if(reduced)startCounters();else setTimeout(startCounters,1500);
 }
 function render(now){raf=0;var dt=Math.min(50,last?now-last:16.7);last=now;smooth=reduced?scrollY:smooth+(scrollY-smooth)*(1-Math.exp(-dt/125));smooth=clamp(smooth,scrollY-innerHeight*.18,scrollY+innerHeight*.18);if(Math.abs(smooth-scrollY)<.15)smooth=scrollY;var lag=scrollY-smooth,vh=innerHeight, vw=document.documentElement.clientWidth;
  if(showcase){
   var r=showcase.getBoundingClientRect(),d=Math.max(0,-r.top-lag),expandDistance=vh*.9,p=clamp(d/expandDistance,0,1),u=vw/1440,mobile=vw<=700;
   // Same image expansion measurements and 125ms interpolation as company overview.
   var startY=mobile?Math.max(430,showcase.querySelector('.project-first-copy').offsetTop+showcase.querySelector('.project-first-copy').offsetHeight+50):513*u;
   var startWidth=mobile?vw-48:600*u,width=startWidth+(vw-startWidth)*p,top=startY*(1-p),height=936*u+(vh-936*u)*p;
   var copy=showcase.querySelector('.project-first-copy'),copyBottom=copy.offsetTop+copy.offsetHeight;
   // Keep the Figma's original 97px gap (or mobile 50px) all the way up.
   var gap=startY-copyBottom,shift=Math.min(0,top-gap-copyBottom);
   showcase.style.setProperty('--project-copy-y',shift+'px');showcase.style.setProperty('--project-image-x',((vw-width)/2)+'px');showcase.style.setProperty('--project-image-y',top+'px');showcase.style.setProperty('--project-image-w',width+'px');showcase.style.setProperty('--project-image-h',height+'px');
   // Keep the photograph's size fixed; align it inside the frame from top to center.
   var initialImage=showcase.querySelector('.project-initial-image'),imageAlignment=ease(p);
   Object.assign(initialImage.style,{position:'absolute',width:vw+'px',height:vh+'px',maxWidth:'none',left:((width-vw)/2)+'px',top:((height-vh)*.5*imageAlignment)+'px',objectFit:'cover',objectPosition:'50% '+(50*imageAlignment)+'%',transform:'none'});
   var full=d>=expandDistance-.1,visible=full&&r.bottom>0&&r.top<vh;
   if(visible&&!shadeStarted)shadeStarted=now;
   if(!visible)shadeStarted=0;
   var ready=visible&&(reduced||now-shadeStarted>=450);
   showcase.dataset.expanded=String(full);showcase.style.setProperty('--project-expanded',ready?'1':'0');showcase.style.setProperty('--project-shade',visible?'.3':'0');
   if(visible&&!ready)schedule();
   if(ready){var span=Math.max(1,(r.height-vh-expandDistance)/3),index=clamp(Math.floor((d-expandDistance)/span),0,2);setProject(index);}else if(phase!==-1){phase=-1;cancelNumbers();cancelPhotos();caption.style.opacity='0';}

  }
  if(procedure){var r=procedure.getBoundingClientRect(),p=clamp(-(r.top+lag)/Math.max(1,r.height-procedure.firstElementChild.offsetHeight),0,1),stops=[.12,.3,.52,.72,.91],points=[270,570,870,1170,1470],x=0;
   for(var i=0;i<points.length;i++){var prev=i?stops[i-1]:0,from=i?points[i-1]:0;if(p<=stops[i]){x=from+(points[i]-from)*ease((p-prev)/(stops[i]-prev));break;}x=points[i];}
   var shift=-300*ease((p-.36)/.35);procedure.style.setProperty('--procedure-x',shift+'px');procedure.style.setProperty('--procedure-fill',x+'px');procedure.style.setProperty('--procedure-note',ease((p-.91)/.07));
   var active=-1;stops.forEach(function(stop,i){if(p>=stop)active=i;});procedure.querySelectorAll('[data-procedure-step]').forEach(function(el){var i=Number(el.dataset.procedureStep);el.classList.toggle('is-complete',i<=active);el.classList.toggle('is-active',i===active);});procedure.dataset.activeStep=String(active);procedure.dataset.progress=p.toFixed(4);
  }
  if(smooth!==scrollY)schedule();else last=0;
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(render);}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('pageshow',schedule);schedule();
 // Hover runs once per entry, including keyboard focus. Pointer movement cannot retrigger it.
 var directory=document.querySelector('.project-directory');
 if(directory){var items=Array.from(directory.querySelectorAll('.project-list-item')),image=directory.querySelector('.project-directory-image'),directoryCopy=directory.querySelector('.project-directory-copy'),selected=items[0];
  var suppliedImages=['assets/sub2-ff272.png','assets/sub2-50895.png','assets/sub2-3d9dd.png','assets/sub2-0b689.png','assets/sub2-e4695.png'];
  suppliedImages.forEach(function(src){var preload=new Image();preload.src=src;});
  function selectItem(item,force){if(selected===item&&!force)return;selected=item;items.forEach(function(b){b.classList.toggle('is-active',b===item);});directory.dataset.selection=item.textContent;
   var pool=suppliedImages;var candidates=pool.filter(function(src){return src!==image.querySelector('img').getAttribute('src');});if(!candidates.length)candidates=pool;var chosen=candidates[Math.floor(Math.random()*candidates.length)];directory.dataset.image=chosen;
   fadeSwap(image,function(){image.querySelector('img').src=chosen;image.querySelector('img').alt=item.textContent;});fadeSwap(directoryCopy,function(){directoryCopy.querySelector('h2').textContent=item.textContent;directoryCopy.querySelector('p').textContent=item.dataset.englishTitle;});
  }
  items.forEach(function(item){item.addEventListener('pointerenter',function(e){if(e.pointerType!=='touch')selectItem(item,true);});item.addEventListener('focus',function(){selectItem(item);});item.addEventListener('click',function(){selectItem(item);});});
  var search=directory.querySelector('input');function filter(){var q=search.value.trim();items.forEach(function(item){item.hidden=q&&!item.textContent.includes(q);});}directory.querySelector('.project-search').addEventListener('click',filter);search.addEventListener('input',filter);
 }
})();

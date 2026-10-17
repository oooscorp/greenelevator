(function () {
  'use strict';
  var track=document.getElementById('products'),stage=document.getElementById('productStage');
  var follow=document.getElementById('productFollow'),media=document.getElementById('productMedia');
  var left=document.getElementById('productMaskLeft'),right=document.getElementById('productMaskRight');
  var titles=stage.querySelectorAll('.product-heading'),subtitles=stage.querySelectorAll('.product-subheading');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items=[
    {title:'서울대학교',subtitle:'SEOUL NATIONAL UNIVERSITY',label:'승객용 엘리베이터',src:'assets/home-product-seoul.png',icon:'assets/home-product-up.svg'},
    {title:'삼성전자',subtitle:'SAMSUNG ELECTRONICS',label:'화물용 엘리베이터',src:'assets/home-product-samsung.png',icon:'assets/home-product-middle.svg'},
    {title:'에스컬레이터',subtitle:'ESCALATOR',label:'에스컬레이터',src:'assets/home-product-escalator.png',icon:'assets/home-product-down.svg'}
  ];
  var intro={title:'공간을 넘어 일상을 잇다',subtitle:'사람과 공간이 만나는 곳에 더 나은 이동을 만듭니다.'};
  var started=false,pinned=false,revealed=false,pointer=null,queued=false;
  var distance=0,lastFrame=0,textRun=0,textTimers=[],currentText=-2;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function later(fn,ms){textTimers.push(setTimeout(fn,reduced?0:ms));}
  function slide(frames,text,run,direction){
    frames.forEach(function(frame){
      frame.style.setProperty("--title-in",direction<0?"-110%":"110%");
      frame.style.setProperty("--title-out",direction<0?"110%":"-110%");
      var previous=frame.lastElementChild;
      Array.from(frame.children).forEach(function(child){if(child!==previous)child.remove();});
      var next=document.createElement('span');next.textContent=text;frame.appendChild(next);
      if(frame.id)frame.setAttribute('aria-label',text);
      if(previous){previous.setAttribute('aria-hidden','true');previous.classList.remove('is-current');previous.classList.add('is-outgoing');}
      void next.offsetHeight;
      next.classList.add('is-current');
      later(function(){if(run===textRun&&previous)previous.remove();},870);
    });
  }
  function changeText(index){
    if(index===currentText)return;
    var direction=index<currentText?-1:1;
    currentText=index;
    var item=index<0?intro:items[index],run=++textRun;
    textTimers.forEach(clearTimeout);textTimers=[];
    stage.dataset.textState=index<0?'intro':String(index);
    slide(titles,item.title,run,direction);
    if(index>=0)slide(subtitles,item.subtitle,run,direction);
    else later(function(){if(run===textRun)slide(subtitles,item.subtitle,run,direction);},850);
  }
  var lens=window.GreenLensZoom(media,items.map(function(item){return{src:item.src,alt:item.title};}),{
    className:'product-image-layer',onChange:function(index){
      stage.dataset.zone=String(index);
      var icon=follow.querySelector('.product-follow-icon');icon.dataset.zone=String(index);
      icon.querySelector('img').src=items[index].icon;
      document.getElementById('productType').textContent=items[index].label;
      if(pinned)changeText(index);
    }
  });
  function updatePointer(){
    var rect=stage.getBoundingClientRect();
    var minY=subtitles[0].getBoundingClientRect().bottom-rect.top+40;
    var y=pointer?pointer.y-rect.top:0;
    // The title and subtitle are outside the hover region. They cannot change images.
    var inside=!!(pointer&&pointer.x>=rect.left&&pointer.x<=rect.right&&y>=minY&&y<=rect.height);
    stage.classList.toggle('is-hovered',revealed&&inside);
    if(!revealed||!inside)return;
    follow.style.setProperty('--product-follow-y',clamp(y-36,minY,Math.max(minY,rect.height-84))+'px');
    var zone=clamp(Math.floor((y-minY)/Math.max(1,rect.height-minY)*3),0,2);
    lens.show(zone);
  }
  function render(now){
    queued=false;
    var rect=track.getBoundingClientRect(),vh=stage.offsetHeight;
    if(!started&&rect.top<vh*.35&&rect.bottom>0){started=true;changeText(-1);}
    var target=clamp(-rect.top,0,vh*1.85);
    var dt=lastFrame?Math.min(64,now-lastFrame):16.67;lastFrame=now;
    distance=reduced?target:distance+(target-distance)*(1-Math.exp(-dt/145));
    if(Math.abs(target-distance)<.25)distance=target;
    var move=clamp(distance/(vh*.6),0,1),ease=move*move*(3-2*move);
    var startY=(vh-stage.querySelector('.product-copy').offsetHeight)/2;
    stage.style.setProperty('--product-copy-y',(startY+(vh*130/936-startY)*ease)+'px');
    var nextPinned=move===1;
    if(started&&nextPinned!==pinned){pinned=nextPinned;changeText(pinned?Number(stage.dataset.zone):-1);}
    stage.classList.toggle('is-pinned',pinned);
    var progress=clamp((distance-vh*.85)/vh,0,1),reveal=progress*progress*(3-2*progress);
    left.setAttribute('width',String(reveal/2));right.setAttribute('x',String(1-reveal/2));right.setAttribute('width',String(reveal/2));
    track.dataset.reveal=reveal.toFixed(4);
    revealed=reveal===1&&rect.bottom>0;
    stage.classList.toggle('is-revealed',revealed);
    updatePointer();
    if(distance!==target)schedule();else lastFrame=0;
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
  function movePointer(event){if(event.pointerType==='touch')return;pointer={x:event.clientX,y:event.clientY};updatePointer();}
  function leave(){pointer=null;stage.classList.remove('is-hovered');}
  stage.addEventListener('pointerenter',movePointer);stage.addEventListener('pointermove',movePointer);
  stage.addEventListener('pointerleave',leave);stage.addEventListener('pointercancel',leave);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
  if(document.fonts)document.fonts.ready.then(schedule);
  schedule();
})();

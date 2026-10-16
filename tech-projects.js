(function () {
  'use strict';
  var track = document.getElementById('techProjects');
  var stage = document.getElementById('projectsStage');
  var follow = document.getElementById('projectsFollow');
  var media = document.getElementById('projectsMedia');
  var leftMask = document.getElementById('projectsMaskLeft');
  var rightMask = document.getElementById('projectsMaskRight');
  var subtitle = stage.querySelector('.projects-subtitle');
  var images = [
    {src:'assets/tech-projects-1.png',alt:'유리 승강기와 곡선형 건축 공간'},
    {src:'assets/tech-projects-2.png',alt:'기둥과 천장이 이어지는 건축 공간'},
    {src:'assets/tech-projects-3.png',alt:'실내 에스컬레이터'}
  ];
  var icons = ['assets/tech-projects-icon-top.svg','assets/tech-projects-icon-middle.svg','assets/tech-projects-icon-bottom.svg'];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lens = window.GreenLensZoom(media, images, {className:'projects-image-layer',onChange:function(zone){
    stage.dataset.zone = String(zone);
    var icon = follow.querySelector('.projects-follow-icon');
    icon.dataset.zone = String(zone); icon.querySelector('img').src = icons[zone];
  }});
  var textStarted = false, revealed = false, queued = false, pointer = null;
  var smoothDistance = 0, lastFrame = 0;
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function showCopy(){stage.classList.add('is-copy-visible');}
  var lastLine = document.querySelector('#projectsTitle .text-motion-1-line:last-child > span');
  lastLine.addEventListener('transitionend',function(event){if(event.propertyName==='transform')showCopy();});
  function startText(){
    if(textStarted)return;
    textStarted=true;
    stage.classList.add('is-text-visible');
    // Font-sized clipping frames retain the same .85s/easing as overview S1.
    if(reduced)showCopy();else setTimeout(showCopy,900);
  }
  function followPointer(event){
    if(event.pointerType==='touch')return;
    pointer={x:event.clientX,y:event.clientY};
    updatePointer();
  }
  function updatePointer(){
    var rect=stage.getBoundingClientRect();
    // Keep the complete graphic below the subtitle, including its upper rule.
    var minY=Math.max(12,subtitle.getBoundingClientRect().bottom-rect.top+40);
    var maxY=Math.max(minY,rect.height-follow.offsetHeight-12);
    var y=pointer?pointer.y-rect.top:0;
    follow.style.setProperty('--projects-follow-y',clamp(pointer?y-36:minY,minY,maxY)+'px');
    var inside=pointer&&pointer.x>=rect.left&&pointer.x<=rect.right&&pointer.y>=rect.top&&pointer.y<=rect.bottom;
    stage.classList.toggle('is-hovered',!!(revealed&&inside));
    if(!revealed||!inside)return;
    lens.show(clamp(Math.floor(y/rect.height*3),0,2));
  }
  function update(now){
    queued=false;
    var rect=track.getBoundingClientRect(),vh=stage.offsetHeight;
    if(rect.top<window.innerHeight*.35&&rect.bottom>0)startText();
    var target=clamp(-rect.top,0,vh*1.6);
    // Frame-rate-independent damping removes wheel-step jumps. Both copy and
    // the two mask edges use the same position, so their relationship stays fixed.
    var elapsed=lastFrame?Math.min(64,now-lastFrame):16.67;
    lastFrame=now;
    if(reduced)smoothDistance=target;
    else smoothDistance+=(target-smoothDistance)*(1-Math.exp(-elapsed/145));
    if(Math.abs(target-smoothDistance)<.25)smoothDistance=target;
    var distance=smoothDistance;
    var move=clamp(distance/(vh*.6),0,1);
    var ease=move*move*(3-2*move);
    var y=vh*(388/936+(100/936-388/936)*ease);
    stage.style.setProperty('--projects-copy-y',y+'px');
    var progress=clamp((distance-vh*.6)/vh,0,1);
    var reveal=progress*progress*(3-2*progress);
    leftMask.setAttribute('width',String(reveal/2));
    rightMask.setAttribute('x',String(1-reveal/2));
    rightMask.setAttribute('width',String(reveal/2));
    track.dataset.reveal=reveal.toFixed(4);
    revealed=reveal>=1&&rect.bottom>0;
    stage.classList.toggle('is-revealed',revealed);
    follow.inert=!revealed;
    follow.tabIndex=revealed?0:-1;
    follow.setAttribute('aria-hidden',String(!revealed));
    updatePointer();
    if(smoothDistance!==target)schedule();else lastFrame=0;
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
  stage.addEventListener('pointerenter',followPointer);
  stage.addEventListener('pointermove',followPointer);
  function leave(){pointer=null;stage.classList.remove('is-hovered');}
  stage.addEventListener('pointerleave',leave);stage.addEventListener('pointercancel',leave);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('pageshow',schedule);
  schedule();
})();

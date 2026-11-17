(function(){
 'use strict';
 var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.querySelectorAll('.process-track,.replacement-procedure-track').forEach(function(track){
  var stops=track.matches('.process-track')?[0,.15,.32,.5,.73,.91,1]:[0,.12,.3,.52,.72,.91,1];
  var busy=false,lastWheel=0,touchY=null,touchUsed=false,animation=0;
  function metrics(){var r=track.getBoundingClientRect(),height=track.firstElementChild.offsetHeight;return {top:scrollY+r.top,span:Math.max(1,r.height-height),inside:r.top<=1&&r.bottom>=height-1};}
  function move(direction,event){
   var m=metrics();if(!m.inside)return false;
   if(busy){event.preventDefault();return true;}
   var p=Math.max(0,Math.min(1,(scrollY-m.top)/m.span)),nearest=0;
   stops.forEach(function(stop,i){if(Math.abs(stop-p)<Math.abs(stops[nearest]-p))nearest=i;});
   var index=nearest+direction;
   if(index<0||index>=stops.length)return false;
   event.preventDefault();busy=true;
   var from=scrollY,to=m.top+m.span*stops[index]+(index&&index<stops.length-1?1:0),start=performance.now(),duration=reduced?0:720;
   function frame(now){var t=duration?Math.min(1,(now-start)/duration):1,e=t*t*(3-2*t);window.scrollTo({top:from+(to-from)*e,behavior:'instant'});if(t<1)animation=requestAnimationFrame(frame);else{animation=0;busy=false;}}
   animation=requestAnimationFrame(frame);return true;
  }
  addEventListener('wheel',function(event){
   if(event.ctrlKey||Math.abs(event.deltaY)<=Math.abs(event.deltaX)||!event.deltaY)return;
   var now=performance.now(),sameGesture=now-lastWheel<200;lastWheel=now;
   if(!metrics().inside)return;
   if(busy||sameGesture){event.preventDefault();return;}
   move(event.deltaY>0?1:-1,event);
  },{passive:false});
  addEventListener('keydown',function(event){
   if(event.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;
   var direction=event.key==='ArrowDown'||event.key==='PageDown'||(event.key===' '&&!event.shiftKey)?1:event.key==='ArrowUp'||event.key==='PageUp'||(event.key===' '&&event.shiftKey)?-1:0;
   if(direction)move(direction,event);
  });
  addEventListener('touchstart',function(event){touchY=event.touches.length===1?event.touches[0].clientY:null;touchUsed=false;},{passive:true});
  addEventListener('touchmove',function(event){if(touchY===null||event.touches.length!==1)return;var dy=touchY-event.touches[0].clientY;if(!metrics().inside)return;if(touchUsed||busy){event.preventDefault();return;}if(Math.abs(dy)>18)touchUsed=move(dy>0?1:-1,event);},{passive:false});
  addEventListener('pagehide',function(){cancelAnimationFrame(animation);busy=false;});
 });
})();

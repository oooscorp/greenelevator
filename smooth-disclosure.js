(function(){
 'use strict';
 var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Animate the measured height, so interrupted toggles resume from the visible size.
 window.GreenDisclosure=function(panel,initiallyOpen){
  var open=!!initiallyOpen,animation=null;
  panel.hidden=false;
  panel.style.overflow='hidden';
  function accessibility(){panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));}
  accessibility();
  panel.style.height=open?'auto':'0px';
  panel.style.opacity=open?'1':'0';
  panel.style.visibility=open?'visible':'hidden';
  return function(next,animate){
   next=!!next;if(next===open)return;
   var height=panel.getBoundingClientRect().height;
   var opacity=getComputedStyle(panel).opacity;
   if(animation){animation.cancel();animation=null;}
   open=next;accessibility();panel.style.visibility='visible';
   var target=open?panel.firstElementChild.getBoundingClientRect().height:0;
   if(reduced||animate===false){panel.style.height=open?'auto':'0px';panel.style.opacity=open?'1':'0';panel.style.visibility=open?'visible':'hidden';return;}
   panel.style.height=target+'px';panel.style.opacity=open?'1':'0';
   var active=panel.animate([{height:height+'px',opacity:opacity},{height:target+'px',opacity:open?1:0}],{duration:400,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});
   animation=active;
   active.finished.then(function(){
    if(animation!==active)return;
    panel.style.height=open?'auto':'0px';panel.style.visibility=open?'visible':'hidden';
    active.cancel();animation=null;
   }).catch(function(){});
  };
 };
})();

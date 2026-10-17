(function(){
  'use strict';
  var section=document.getElementById('techProjects');
  var title=section.querySelector('.tech-end-title>span');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started=false;
  function showSubtitle(){section.classList.add('is-subtitle-visible');}
  title.addEventListener('transitionend',function(event){if(event.propertyName==='transform')showSubtitle();});
  function reveal(){
    if(started)return;
    started=true;
    section.classList.add('is-title-visible');
    if(reduced)showSubtitle();else setTimeout(showSubtitle,900);
  }
  var observer=new IntersectionObserver(function(entries){
    if(entries.some(function(entry){return entry.isIntersecting;})){reveal();observer.disconnect();}
  },{threshold:.35});
  observer.observe(section);
})();

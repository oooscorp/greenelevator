(function(){
 'use strict';
 // Dot coordinates and vector paths come directly from Figma 32:724.
 var offices=[
  {name:'본사 및 제1캠퍼스',point:[124.4,202],address:'경기도 평택시 오성면 오성산단로 36-19(양교리)',phone:'031-682-8931',main:true},
  {name:'화성캠퍼스',point:[145,165]},
  {name:'시흥캠퍼스',point:[75.96,130.53],address:'경기도 시흥시 엠티브이 28로 20번길 7'},
  {name:'서울 기술혁신본부',point:[112.31,166.88],address:'서울특별시 송파구 법원로 127 문정대명벨리온 611호'},
  {name:'부산지사',point:[330.44,403.22],address:'부산광역시 동래구 명륜로207번길 36-1, 3층'},
  {name:'대전지사',point:[130.45,330.51],address:'대전광역시 서구 둔산북로 121, 126호'},
  {name:'경기북부지사',point:[130.45,75.96],address:'경기도 의정부시 산단로76번길 113-4'},
  {name:'경기남부지사',point:[103.24,139.60]},
  {name:'충청지사',point:[112.31,248.66]},
  {name:'경남지사',point:[303.23,430.50]},
  {name:'경북지사',point:[230.44,357.72]}
 ];
 document.querySelectorAll('[data-office-map]').forEach(function(section){
  var prefix=section.id, list=section.querySelector('.office-rows'),marker=section.querySelector('.office-marker');
  var name=marker.querySelector('.office-location-name'),buttons=[],panels=[],disclosures=[];
  var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,markerAnimation=null,oldMarker=null,markerRun=0;
  // The SVG mask limits all color to the original map dots.
  var canvas=section.querySelector('.office-map-canvas');
  var ns='http://www.w3.org/2000/svg', effect=document.createElementNS(ns,'svg');
  var maskId=prefix+'-dot-mask', gradientId=prefix+'-wave', coreId=prefix+'-core';
  effect.setAttribute('viewBox','0 0 380 671');effect.setAttribute('aria-hidden','true');effect.classList.add('office-dot-wave');
  effect.innerHTML='<defs><mask id="'+maskId+'" maskUnits="userSpaceOnUse" x="0" y="0" width="380" height="671" style="mask-type:alpha"><image href="assets/nov13-map-latest.svg" width="380" height="671"/></mask><radialGradient id="'+gradientId+'"><stop offset="0" stop-color="#0d5b44" stop-opacity=".22"/><stop offset=".48" stop-color="#0d5b44" stop-opacity=".45"/><stop offset=".72" stop-color="#0d5b44" stop-opacity=".88"/><stop offset=".88" stop-color="#0d5b44" stop-opacity=".35"/><stop offset="1" stop-color="#0d5b44" stop-opacity="0"/></radialGradient><radialGradient id="'+coreId+'"><stop offset="0" stop-color="#0d5b44" stop-opacity=".95"/><stop offset=".3" stop-color="#0d5b44" stop-opacity=".65"/><stop offset="1" stop-color="#0d5b44" stop-opacity="0"/></radialGradient></defs><g mask="url(#'+maskId+')"><circle class="office-wave-core" r="48" fill="url(#'+coreId+')"/><circle class="office-wave-front" fill="url(#'+gradientId+')"/></g>';
  canvas.insertBefore(effect,marker);
  var front=effect.querySelector('.office-wave-front'),core=effect.querySelector('.office-wave-core');
  var waveStart=0,waveFrame=0,visible=true,activePoint=null;
  function startWave(point){
   activePoint=point;waveStart=0;
   effect.hidden=!point;
   if(waveFrame)cancelAnimationFrame(waveFrame);waveFrame=0;
   if(!point)return;
   [front,core].forEach(function(circle){circle.setAttribute('cx',point[0]);circle.setAttribute('cy',point[1]);});
   front.setAttribute('r','0');front.setAttribute('opacity','0');core.setAttribute('r','14');
  }
  var visibility=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(visible)startWave(activePoint);else if(waveFrame){cancelAnimationFrame(waveFrame);waveFrame=0;}});
  visibility.observe(canvas);
  document.addEventListener('visibilitychange',function(){if(document.hidden){cancelAnimationFrame(waveFrame);waveFrame=0;}else startWave(activePoint);});
  offices.forEach(function(office,index){
   if(index===0||office.name==='부산지사'){var group=document.createElement('h3');group.className='nov-office-group';group.textContent=index===0?'메인 캠퍼스':'전국 지사';list.appendChild(group);}
   var row=document.createElement('div');row.className='office-row';
   var header=document.createElement('div');header.className='office-row-heading';
   var title=document.createElement('h3');title.textContent=office.name;header.appendChild(title);
   if(office.main){var badge=document.createElement('span');badge.className='office-badge';badge.textContent='메인 캠퍼스';header.appendChild(badge);}
   var button=document.createElement('button');button.type='button';button.className='office-toggle';button.setAttribute('aria-label',office.name+' 정보');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',prefix+'-office-'+index);header.appendChild(button);
   var panel=document.createElement('div');panel.className='office-details';panel.id=prefix+'-office-'+index;panel.hidden=true;
   [['주소',office.address],['전화',office.phone]].forEach(function(pair){if(!pair[1])return;var line=document.createElement('div');line.className='office-detail-line';var label=document.createElement('span');label.textContent=pair[0];var value=document.createElement('span');value.textContent=pair[1];line.append(label,value);panel.appendChild(line);});
   // The provided design only specifies the headquarters' expanded details.
   // Keep unspecified branches honest: show their location name, not invented contact data.
   if(!panel.children.length){var location=document.createElement('p');location.textContent=office.name;panel.appendChild(location);}
   var inner=document.createElement('div');inner.className='office-details-content';while(panel.firstChild)inner.appendChild(panel.firstChild);panel.appendChild(inner);
   row.append(header,panel);list.appendChild(row);buttons.push(button);panels.push(panel);disclosures.push(window.GreenDisclosure(panel,false));
   button.addEventListener('click',function(){select(button.getAttribute('aria-expanded')==='true'?-1:index);});
  });
  function select(index,animate){
   var run=++markerRun;
   startWave(index>=0?offices[index].point:null);
   buttons.forEach(function(button,i){var active=i===index;button.setAttribute('aria-expanded',String(active));disclosures[i](active,animate);button.closest('.office-row').classList.toggle('is-open',active);});
   if(oldMarker){oldMarker.remove();oldMarker=null;}
   if(markerAnimation){markerAnimation.cancel();markerAnimation=null;}
   section.dataset.office=String(index);
   if(index<0){marker.hidden=true;return;}
   var office=offices[index];name.textContent=office.main?'본사 및 제 1캠퍼스':office.name;
   marker.style.left=(office.point[0]/380*100)+'%';marker.style.top=(office.point[1]/671*100)+'%';marker.hidden=false;
   var ripple=marker.querySelector('.office-ripple');ripple.style.animation='none';void ripple.offsetWidth;ripple.style.animation='';
   if(!reduced&&animate!==false){
    markerAnimation=marker.animate([{opacity:0},{opacity:1}],{duration:300,easing:'ease-out',fill:'both'});
    markerAnimation.finished.then(function(){if(run===markerRun){markerAnimation.cancel();markerAnimation=null;}}).catch(function(){});
   }
  }
  select(0,false);
 });
})();

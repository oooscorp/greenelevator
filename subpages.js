(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var clamp = function(v,a,b){return Math.max(a,Math.min(b,v));};
  var ease = function(v){v=clamp(v,0,1);return v*v*(3-2*v);};
  var scale=1,scheduled=false,lastTime=0,smoothY=window.scrollY;
  var history=document.querySelector('.history-layout');
  var yearBox=document.getElementById('historyYear');
  var historyList=document.querySelector('.history-list');
  var historyItems=history?Array.from(history.querySelectorAll('[data-year]')):[];
  var yearRun=0,selectedYear='2026';
  var yearTimers=[];
  var digitCells=[];
  function paintDigit(cell,ch){
    cell.dataset.digit=ch;
    var existing=cell.firstElementChild;
    if(existing&&existing.tagName==='OBJECT'&&existing.contentDocument){colorDigit(existing.contentDocument.documentElement,ch);return;}
    cell.replaceChildren(makeDigit(ch));
  }
  var periodEls=Array.from(document.querySelectorAll('.history-period'));
  var periodDot=document.querySelector('.history-period-dot');
  var timelines=Array.from(document.querySelectorAll('[data-image-timeline]'));
  var benefits=document.querySelector('.benefits-track');
  var process=document.querySelector('.process-track');
  var benefitsResult=benefits?benefits.querySelector('.benefits-result h3'):null;
  var resultShown=false;
  function measure(){
    scale=document.documentElement.clientWidth/1440;
    root.style.setProperty('--design-scale',scale);
    root.style.setProperty('--u',scale+'px');
    schedule();
  }
  // Dynamic years use the original seven-segment SVG geometry, without redrawing it.
  var SEG={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg'};
  var digitAssets={'0':'5d6e5','1':'faa47','2':'63d89'};
  function colorDigit(svg,ch){
      var box=svg.viewBox.baseVal;
      svg.querySelectorAll('path').forEach(function(path){
        var b=path.getBBox(),x=(b.x+b.width/2)/box.width,y=(b.y+b.height/2)/box.height;
        var segment=b.width>b.height?(y<.25?'a':y>.75?'d':'g'):(x<.5?(y<.5?'f':'e'):(y<.5?'b':'c'));
        path.setAttribute('opacity',SEG[ch].includes(segment)?'1':'.2');
      });
  }
  function makeDigit(ch){
    var asset=digitAssets[ch];
    if(asset){var image=new Image();image.src='assets/sub-'+asset+'.svg';image.alt='';return image;}
    var object=document.createElement('object');
    object.type='image/svg+xml';object.data='assets/sub-5d6e5.svg';object.setAttribute('aria-hidden','true');object.setAttribute('tabindex','-1');
    object.addEventListener('load',function(){
      var svg=object.contentDocument&&object.contentDocument.documentElement;if(!svg)return;
      colorDigit(svg,ch);
    },{once:true});
    return object;
  }
  if(yearBox){yearBox.replaceChildren();selectedYear.split('').forEach(function(ch){var cell=document.createElement('span');cell.className='history-digit-cell';paintDigit(cell,ch);digitCells.push(cell);yearBox.appendChild(cell);});}
  function changeYear(year){
    if(year===selectedYear)return;
    var previous=selectedYear;selectedYear=year;var run=++yearRun;
    yearTimers.forEach(clearTimeout);yearTimers=[];
    year.split('').forEach(function(ch,i){
      var cell=digitCells[i];
      if(previous[i]===ch){if(cell.dataset.digit!==ch)paintDigit(cell,ch);return;}
      if(reduce){paintDigit(cell,ch);return;}
      // A compact version of the overview's segment cycle; unchanged cells stay still.
      ['8','2','9',ch].forEach(function(sample,n){
        yearTimers.push(setTimeout(function(){if(run===yearRun)paintDigit(cell,sample);},n*45));
      });
    });
    yearBox.setAttribute('aria-label',year+'년');yearBox.dataset.year=year;
    var period=Number(year)>=2020?0:Number(year)>=2015?1:Number(year)>=2010?2:Number(year)>=2005?3:4;
    periodEls.forEach(function(el,i){el.classList.toggle('is-current',i===period);});
    var dy=periodEls[period].offsetTop-periodEls[0].offsetTop;
    periodDot.style.setProperty('--period-y',dy+'px');
    history.dataset.year=year;
  }
  // A single observer drives reusable line reveals; organization has an explicit sequence.
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){
    if(!entry.isIntersecting)return;
    var el=entry.target;el.classList.add('is-on');observer.unobserve(el);
  });},{threshold:.12});
  document.querySelectorAll('.text-motion').forEach(function(el){
    el.querySelectorAll('.motion-line').forEach(function(line,i){line.style.setProperty('--line-index',i);});
    if(el.closest('.organization-section')||el===benefitsResult)return;
    observer.observe(el);
  });
  function runOrganization(){
    var org=document.querySelector('.organization-section');if(!org)return;
    var title=org.querySelector('.organization-title'),body=org.querySelector('.organization-copy');
    var lines=body.querySelectorAll('.motion-line');
    requestAnimationFrame(function(){requestAnimationFrame(function(){title.classList.add('is-on');});});
    setTimeout(function(){body.classList.add('is-on');},reduce?0:850);
    var total=850+850+Math.max(0,lines.length-1)*325;
    // Reveal the original dashed SVGs, keeping their pattern and coordinates intact.
    [['.org-main-line',0],['.org-mid-line',800],['.org-low-line',1200]].forEach(function(item){setTimeout(function(){org.querySelector(item[0]).classList.add('is-drawn');},reduce?0:total+item[1]);});
  }
  var cards=benefits?Array.from(benefits.querySelectorAll('.benefit-card')):[];
  cards.forEach(function(el,i){el.style.setProperty('--card-index',i);});
  if(benefits){var cardsObs=new IntersectionObserver(function(entries){if(!entries.some(function(e){return e.isIntersecting;}))return;cards.forEach(function(c){c.classList.add('is-revealed');});cardsObs.disconnect();},{threshold:.12});cardsObs.observe(benefits.querySelector('.benefits-groups'));}
  var table=document.querySelector('.contract-table-section');
  if(table){var tableObs=new IntersectionObserver(function(entries){if(entries.some(function(e){return e.isIntersecting;})){table.classList.add('is-visible');tableObs.disconnect();}},{threshold:.12});tableObs.observe(table.querySelector('.contract-table-image'));}
  function updateHistory(){
    if(!history)return;
    var lag=reduce?0:clamp(window.scrollY-smoothY,-110,110);
    historyList.style.setProperty('--history-lag',lag+'px');
    var anchor=Math.max(100,history.getBoundingClientRect().top);
    var last=historyItems[historyItems.length-1].getBoundingClientRect();
    history.style.setProperty('--year-release',(-Math.max(0,100-last.bottom))+'px');
    var year='2026';
    historyItems.forEach(function(item){if(item.getBoundingClientRect().top<=anchor+.5)year=item.dataset.year;});
    changeYear(year);
  }
  function updateTimelines(){
    var center=window.innerHeight/2;
    timelines.forEach(function(timeline){
      var rect=timeline.getBoundingClientRect();
      var y=clamp(center-rect.top,0,rect.height);
      timeline.style.setProperty('--rail-y',y+'px');
      var photos=Array.from(timeline.querySelectorAll('.timeline-image'));
      var scores=photos.map(function(photo){var r=photo.getBoundingClientRect();var distance=Math.abs((r.top+r.bottom)/2-center);return ease(1-distance/Math.max(1,r.height*.85));});
      var best=Math.max.apply(Math,scores),index=scores.indexOf(best);
      photos.forEach(function(photo,i){photo.style.setProperty('--dim',(.4*(1-(i===index?scores[i]:0))).toFixed(4));});
      timeline.dataset.activeImage=String(index);
    });
  }
  function sceneProgress(track){var r=track.getBoundingClientRect();var sticky=track.firstElementChild;return clamp(-(r.top+(reduce?0:window.scrollY-smoothY))/Math.max(1,r.height-sticky.offsetHeight),0,1);}
  function updateBenefits(){
    if(!benefits)return;
    var p=sceneProgress(benefits),stage=benefits.querySelector('.benefits-stage');
    var shift=ease((p-.18)/.38);
    stage.style.setProperty('--benefit-x',(-600*shift)+'px');
    stage.style.setProperty('--benefit-opacity',String(1-.6*shift));
    var arrows=benefits.querySelectorAll('.benefits-arrows img');
    arrows.forEach(function(arrow,i){arrow.style.setProperty('--arrow-opacity',ease((p-(.58+i*.07))/.07));});
    var result=ease((p-.76)/.12);
    stage.style.setProperty('--result-opacity',result);
    if(p>=.76&&!resultShown){resultShown=true;benefitsResult.classList.add('is-on');}
    if(p<.7&&resultShown){resultShown=false;benefitsResult.classList.remove('is-on');}
    benefits.dataset.phase=p<.18?'initial':p<.56?'moving':p<.76?'arrows':'result';
  }
  function updateProcess(){
    if(!process)return;
    var p=sceneProgress(process),stage=process.querySelector('.process-stage');
    var stops=[.15,.32,.5,.73,.91],positions=[274,570,885,1020];
    var x;
    if(p<stops[0])x=274*ease(p/stops[0]);
    else if(p<stops[1])x=274+(570-274)*ease((p-stops[0])/(stops[1]-stops[0]));
    else if(p<stops[2])x=570+(885-570)*ease((p-stops[1])/(stops[2]-stops[1]));
    else x=885+(1020-885)*ease((p-stops[2])/.11);
    stage.style.setProperty('--main-progress',(x/1020*100)+'%');
    stage.style.setProperty('--upper-progress',(ease((p-.61)/.12)*100)+'%');
    stage.style.setProperty('--lower-progress',(ease((p-.79)/.12)*100)+'%');
    stage.style.setProperty('--upper-stem',ease((p-.59)/.09));
    stage.style.setProperty('--lower-stem',ease((p-.77)/.09));
    var active=-1;stops.forEach(function(stop,i){if(p>=stop-.0001)active=i;});
    process.querySelectorAll('[data-step]').forEach(function(el){var step=Number(el.dataset.step);el.classList.toggle('is-complete',step<=active);el.classList.toggle('is-active',step===active);});
    process.querySelector('.process-branch-top').style.opacity=p>=.73?'1':'.35';
    process.querySelector('.process-branch-bottom').style.opacity=p>=.91?'1':'.35';
    process.dataset.activeStep=String(active);
  }
  // The original three-node gauge is revealed along its original circular arc.
  var diagram=document.querySelector('.maintenance-diagram');
  if(diagram){var clip=diagram.querySelector('.maintenance-gauge-clip'),nodes=Array.from(diagram.querySelectorAll('.maintenance-node'));
    var arc=0,arcRun=0,previousNode=-1;
    function select(index){
      if(index>=0&&diagram.dataset.activeNode===String(index))return;
      nodes.forEach(function(node,i){node.classList.toggle('is-active',i===index);node.setAttribute('aria-pressed',String(i===index));});
      var from=arc,to=index<0?0:(index===0&&previousNode===2?360:[0,122,238][index]),start=performance.now(),run=++arcRun;
      function frame(now){if(run!==arcRun)return;var p=reduce?1:clamp((now-start)/650,0,1);arc=from+(to-from)*ease(p);clip.style.setProperty('--arc-angle',arc+'deg');if(p<1)requestAnimationFrame(frame);}
      requestAnimationFrame(frame);if(index>=0)previousNode=index;diagram.dataset.activeNode=String(index);
    }
    nodes.forEach(function(node,i){node.addEventListener('pointerenter',function(e){if(e.pointerType!=='touch')select(i);});node.addEventListener('pointerleave',function(e){if(e.pointerType!=='touch')select(-1);});node.addEventListener('blur',function(){select(-1);});node.addEventListener('focus',function(){if(node.matches(':focus-visible'))select(i);});node.addEventListener('click',function(){select(i);});});
    diagram.addEventListener('pointerleave',function(){select(-1);});
  }
  document.querySelectorAll('.sub-top').forEach(function(button){button.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduce?'instant':'smooth'});});});
  function render(now){
    scheduled=false;var dt=lastTime?Math.min(50,now-lastTime):16.67;lastTime=now;
    var target=window.scrollY;
    smoothY=reduce?target:smoothY+(target-smoothY)*(1-Math.exp(-dt/85));
    if(Math.abs(target-smoothY)<.1)smoothY=target;
    updateHistory();updateTimelines();updateBenefits();updateProcess();
    if((history||benefits||process)&&smoothY!==target)schedule();else lastTime=0;
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',measure);window.addEventListener('pageshow',function(){smoothY=window.scrollY;measure();});
  if(document.fonts)document.fonts.ready.then(measure);
  measure();runOrganization();
})();

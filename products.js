(function(){
 'use strict';
 var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var hero=document.querySelector('.products-hero'),header=document.getElementById('productsHeader');
 var categories=document.getElementById('productCategories'),tabs=document.getElementById('productTabs'),options=document.getElementById('productOptions');
 var picture=document.getElementById('productPicture'),detail=document.getElementById('productDetail'),stage=document.getElementById('productDetailStage');
 var category=0,tab=0,selected='gold',transition=null,categoryDisclosures=[];
 var catalog=[{name:'승객용엘리베이터',sub:['승객용','전망용','병원용','인화물']},{name:'화물용엘리베이터',sub:['화물용','자동차용','수직반송기','덤웨이터']},{name:'에스컬레이터',sub:[]}];
 var views={
 gold:{image:'assets/products-gold.png',title:'카 디자인',rows:[['천장','디럭스타입/할로겐/LED/ 미러'],['카도어','스텐인리스 바이브레이션+ 골드'],['카벽','스테인리스 바이브레이션 + 미러 + 골드\n스테인리스 +바이브레이션 + 골드'],['핸드레일','스테인리스 1열봉'],['바닥재','인테리어스톤']]},
 cop:{image:'assets/products-cop.png',title:'운전반',rows:[['모델명','돌출형 COP-01']]},
 plan:{image:'assets/products-plan.png',title:'Planning information',rows:[['자료명','Plan of Hoistway']]},
 freight:{image:'assets/products-freight.png',title:'카 디자인',rows:[['천장','스테인리스 헤어라인'],['카도어','스테인리스 헤어라인'],['카벽','스테인리스 헤어라인'],['핸드레일','스테인리스 바'],['바닥재','체크플레이트']]},
 escalator:{image:'assets/products-escalator.png',title:'저속에서의 주파수 감지',body:'일정기간 동안 이용객이 없을 경우,\n저속운전을 함으로써 60% 이상 에너지 절감이 가능합니다.'}
 };
 function showView(key,animate){
  selected=key;var view=views[key];if(transition)transition.cancel();
  var image=document.createElement('img');image.src=view.image;image.alt=view.title;picture.replaceChildren(image);picture.dataset.view=key;
  var dots=document.createElement('div');dots.className='products-dots';dots.setAttribute('aria-hidden','true');for(var i=0;i<4;i++){var dot=document.createElement('span');dot.className='products-dot';dots.appendChild(dot);}picture.appendChild(dots);
  var title=document.createElement('h2');title.textContent=view.title;detail.replaceChildren(title);
  if(view.rows)view.rows.forEach(function(pair){var row=document.createElement('div');row.className='products-spec';var label=document.createElement('strong'),value=document.createElement('span');label.textContent=pair[0];value.textContent=pair[1];row.append(label,value);detail.appendChild(row);});
  if(view.body){var body=document.createElement('p');body.style.whiteSpace='pre-line';body.textContent=view.body;detail.appendChild(body);}
  if(animate&&!reduced)transition=stage.animate([{opacity:0},{opacity:1}],{duration:350,easing:'ease-out'});
 }
 function renderControls(){
  tabs.replaceChildren();options.replaceChildren();
  var labels=category===2?['제품개요','디자인','주요제원']:['의장','표시기','도면자료'];
  labels.forEach(function(label,index){var button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(tab===index));button.disabled=category>0&&index>0;button.addEventListener('click',function(){if(tab===index)return;tab=index;renderControls();showView(category===0?(tab===0?'gold':tab===1?'cop':'plan'):category===1?'freight':'escalator',true);});tabs.appendChild(button);});tabs.setAttribute('role','tablist');
  var labels2=category===0?(tab===0?['GLARE GOLD','BLACK','GENT BRONZE','GLINT SILVER']:tab===1?['운전반','홀버튼','카내부 위치표시기','천장','바닥재']:[]):category===1?['2 UP Sliding Opering','2 Side opening','4 Center opening']:['저속에서의 주파수 감지','자동운행 주파수 감지','지능형 변속 시스템'];
  labels2.forEach(function(label,index){var button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(index===0));button.disabled=index>0;options.appendChild(button);});
 }
 catalog.forEach(function(group,index){
  var container=document.createElement('div');container.className='products-category';var toggle=document.createElement('button');toggle.type='button';toggle.className='products-category-toggle';toggle.setAttribute('aria-expanded',String(index===0));toggle.setAttribute('aria-controls','productsGroup'+index);var name=document.createElement('span'),icon=document.createElement('span');name.textContent=group.name;icon.className='products-category-icon';icon.setAttribute('aria-hidden','true');toggle.append(name,icon);
  var sub=document.createElement('div');sub.className='products-subcategories';sub.id='productsGroup'+index;sub.hidden=index!==0;
  var list=document.createElement('div');list.className='products-subcategory-list';sub.appendChild(list);
  group.sub.forEach(function(label,j){var button=document.createElement('button');button.type='button';button.className='products-subcategory';button.textContent=label;button.disabled=j>0;button.setAttribute('aria-pressed',String(index===0&&j===0));button.addEventListener('click',function(){choose(index);});list.appendChild(button);});
  toggle.addEventListener('click',function(){if(category===index){var open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));categoryDisclosures[index](!open);}else choose(index);});container.append(toggle,sub);categories.appendChild(container);categoryDisclosures.push(window.GreenDisclosure(sub,index===0));
 });
 function choose(index){category=index;tab=0;categories.querySelectorAll('.products-category').forEach(function(group,i){group.querySelector('.products-category-toggle').setAttribute('aria-expanded',String(i===index));categoryDisclosures[i](i===index);group.querySelectorAll('.products-subcategory').forEach(function(button,j){button.setAttribute('aria-pressed',String(i===index&&j===0));});});renderControls();showView(index===0?'gold':index===1?'freight':'escalator',true);}
 var previousY=scrollY;
 function scrollHeader(){var y=Math.max(0,scrollY);var over=y<hero.offsetHeight-60;header.classList.toggle('is-over-hero',over);var logo=header.querySelector('.logo img');var src=over?'assets/products-logo-white.png':'assets/logo.png';if(logo.getAttribute('src')!==src)logo.src=src;if(y<=0)header.classList.remove('is-hidden');else if(Math.abs(y-previousY)>=3)header.classList.toggle('is-hidden',y>previousY);previousY=y;}
 window.addEventListener('scroll',scrollHeader,{passive:true});window.addEventListener('resize',scrollHeader);
 document.getElementById('toTopBtn').addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
 var contact=document.getElementById('productsContact');
 if(contact){var observer=new IntersectionObserver(function(entries){if(entries.some(function(e){return e.isIntersecting;})){contact.classList.add('is-title-visible');setTimeout(function(){contact.classList.add('is-subtitle-visible');},reduced?0:850);observer.disconnect();}},{threshold:.35});observer.observe(contact);}
 renderControls();showView('gold',false);scrollHeader();requestAnimationFrame(function(){requestAnimationFrame(function(){hero.classList.add('is-ready');});});
})();

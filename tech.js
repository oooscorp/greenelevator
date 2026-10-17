(function () {
  'use strict';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Six content states from Figma 회사소개-기술력 (15:732).
  var items = [
  {
    "title": "조달우수",
    "subtitle": "기술과 품질로 쌓은 신뢰",
    "body": "차별화된 기술과 품질 경쟁력을 바탕으로\n공공조달 시장의 다양한 요구에 대응합니다.\n제품의 안전성능과 신뢰성을 높이기 위한 지속적인 기술 개발을 통해 공공시설에 적합한 승강기\n솔루션을 제공하며, 우수한 품질과\n안정적인 제품 공급을 목표로 합니다.",
    "image": "assets/tech-content-procurement.png",
    "crop": {
      "width": "175.49%",
      "height": "100%",
      "left": "-4.96%",
      "top": "0"
    }
  },
  {
    "title": "내진형승강기",
    "subtitle": "외부 충격에 대비한 안전 설계",
    "body": "지진 및 승강로 구조체에 충격이 가해질시 승강기 설비에 가해질수있는 영향을 고려하여 운행 성능을 확보하기 위한 기술을 적용합니다. 건축물과\n설치 환경의 특성을 반영한 설계 및 시공을 통해\n외부충격에 대한 대응력을 높이고, 이용자 안전과\n설비의 신뢰성을 확보합니다.",
    "image": "assets/tech-content-seismic.png"
  },
  {
    "title": "TESS 3.5TON",
    "subtitle": "3.5톤 대용량 운송 솔루션",
    "body": "화물과 중량 장비의 운송이 필요한 현장을 위해\n정격하중 3,500kg까지 대응하는 신형 기계실없는타입 승강기 개발을 완료했습니다.\n다양한 산업시설과 물류·공공시설의 요구에\n대응할 수 있도록 대용량 운송 성능과\n설치 적용성을 고려한 승강기 기술을 제공합니다.",
    "image": "assets/tech-content-tess.png"
  },
  {
    "title": "BF인증",
    "subtitle": "모두를 위한 편리한 이동",
    "body": "장애물 없는 생활환경(Barrier Free)을 고려하여\n다양한 이용자의 이동 편의성과 접근성을 높이는\n승강기 설계 및 설치를 지향합니다. 휠체어 이용자와 교통약자 등 누구나 보다 편리하게 이용할 수 있도록 관련 기준과 현장 여건을 검토하여 편리하고\n포용적인 이동 환경을 조성합니다.",
    "image": "assets/tech-content-bf-v2.png"
  },
  {
    "title": "무용접",
    "subtitle": "화기 작업을 줄인 안전 시공",
    "body": "현장 용접으로 인한 화재 위험을 줄이기 위해\n시공 공정을 개선하고, 최소한의 가용접만으로\n설치가 가능하도록 하는 시공 방식을 적용했습니다. 이를 통해 현장 화기 작업을 최소화하고\n화재 예방과 작업 안전성을 높이며, 보다 효율적이고 안정적인 승강기 설치 환경을 구현합니다.",
    "image": "assets/tech-content-welding.png",
    "crop": {
      "width": "174.98%",
      "height": "100%",
      "left": "-48.07%",
      "top": "0"
    }
  },
  {
    "title": "특허증",
    "subtitle": "",
    "body": "",
    "image": "assets/tech-patent-4.png",
    "patent": true
  }
];
  var overlay = document.getElementById('techOverlay');
  var header = document.getElementById('techHeader');
  var title = document.getElementById('innovationTitle');
  var innovationLines = document.querySelectorAll('.tech-innovation-body p');
  var track = document.getElementById('techTrack');
  var stage = document.getElementById('techStage');
  var titleFrame = document.getElementById('techTitleFrame');
  var imageFrame = document.getElementById('techImageFrame');
  var subtitle = document.getElementById('techSubtitle');
  var body = document.getElementById('techBody');
  var steps = document.getElementById('techSteps');
  var introTimers = [], contentTimers = [], generation = 0, current = -1;
  function clearTimers(list) { list.forEach(clearTimeout); list.length = 0; }
  function later(list, fn, delay) { list.push(setTimeout(fn, reducedMotion ? 0 : delay)); }
  function revealInnovation() {
    title.classList.add('is-visible');
    innovationLines.forEach(function (line, index) { later(introTimers, function () { line.classList.add('is-visible'); }, 870 + index * 140); });
  }
  function runIntro() {
    clearTimers(introTimers);
    var directStep=Number(new URLSearchParams(location.search).get('step'));
    if(Number.isInteger(directStep)&&directStep>=1&&directStep<=6){
      history.scrollRestoration='manual';
      overlay.classList.add('is-done');header.classList.add('is-visible');
      document.documentElement.style.overflow='';
      var index=directStep-1;
      populateImage(imageFrame.firstElementChild,items[index]);
      imageFrame.firstElementChild.className='tech-image-slide is-current';
      setItem(index);
      requestAnimationFrame(function(){
        var top=window.scrollY+track.getBoundingClientRect().top;
        var span=track.offsetHeight-window.innerHeight;
        window.scrollTo({top:top+span*(index+.15)/6,behavior:'instant'});
      });
      return;
    }
    history.scrollRestoration = 'manual';
    window.scrollTo({top:0,behavior:'instant'});
    overlay.classList.remove('is-open','is-done');
    document.documentElement.style.overflow = 'hidden';
    if (reducedMotion) {
      overlay.classList.add('is-done'); header.classList.add('is-visible');
      document.documentElement.style.overflow = ''; revealInnovation(); return;
    }
    later(introTimers, function () {
      overlay.classList.add('is-open');
      window.GreenDoorMotion.open(overlay.querySelector('.tech-door-left'),overlay.querySelector('.tech-door-right'),document.querySelector('.tech-innovation-photo'));
    }, 1750);
    later(introTimers, function () {
      overlay.classList.add('is-done');
      document.documentElement.style.overflow = '';
      header.classList.add('is-visible');
      previousY = window.scrollY;
      revealInnovation(); updateContent();
    }, 1750 + window.GreenDoorMotion.total);
  }
  // Exact segment paths exported from the Figma number vector.
  var segments = {"f": "M1.76317 1.76471L3.51812 3.52941V13.2353L1.76317 15L0 13.2353V3.52941L1.76317 1.76471Z", "b": "M14.6929 1.76465L16.4478 3.52935V13.2352L14.6929 14.9999L12.9297 13.2352V3.52935L14.6929 1.76465Z", "e": "M1.76317 15L3.51812 16.7647V26.4706L1.76317 28.2353L0 26.4706V16.7647L1.76317 15Z", "c": "M14.6929 15L16.4478 16.7647V26.4706L14.6929 28.2353L12.9297 26.4706V16.7647L14.6929 15Z", "a": "M14.1033 1.17176L12.7645 2.51647L11.7548 3.52941H4.6915L2.34766 1.17882L3.52546 0H12.9385L14.1033 1.17176Z", "d": "M2.34766 28.8283L4.6962 26.4707H11.7595L14.1033 28.8213L12.9255 30.0001H3.51253L2.34766 28.8283Z", "g": "M11.7589 13.2354H4.69677L2.93359 15.0001L4.69677 16.7648H11.7589L13.522 15.0001L11.7589 13.2354Z"};
  var digitSegments = ['bc','abdeg','abcdg','bcfg','acdfg','acdefg'];
  items.forEach(function (_, index) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox','0 0 16.4478 30.0001'); svg.classList.add('tech-step-digit');
    svg.setAttribute('role','img'); svg.setAttribute('aria-label', String(index + 1));
    Object.keys(segments).forEach(function (key) {
      var path = document.createElementNS(svg.namespaceURI,'path'); path.setAttribute('d',segments[key]);
      if (digitSegments[index].indexOf(key) !== -1) path.classList.add('is-lit');
      svg.appendChild(path);
    });
    var button=document.createElement('button');
    button.type='button';button.className='tech-step-button';button.setAttribute('aria-label',String(index+1)+' '+items[index].title);
    button.appendChild(svg);steps.appendChild(button);
    button.addEventListener('click',function(){
      var top=window.scrollY+track.getBoundingClientRect().top;
      var span=track.offsetHeight-window.innerHeight;
      setItem(index);
      window.scrollTo({top:top+span*(index+.15)/6,behavior:'instant'});
    });
  });
  function writeBody(text, item) {
    body.replaceChildren();
    stage.classList.toggle('is-patent', !!item.patent);
    if(item.patent) {
      [['특허번호','제 00-0000000호'],['출원일','2000년 00년 00일'],['특허내용','엘리베이터 처짐방지용 정위치\n클램핑 및 비상제동 장치']].forEach(function(pair){
        var row=document.createElement('div');row.className='tech-patent-row';
        var label=document.createElement('strong');label.textContent=pair[0];
        var value=document.createElement('span');value.textContent=pair[1];row.append(label,value);body.appendChild(row);
      });
      return;
    }
    text.split('\n').forEach(function(line,index){if(index)body.appendChild(document.createElement('br'));body.appendChild(document.createTextNode(line));});
  }
  function populateImage(slide,item) {
    slide.replaceChildren();
    if(item.patent) {
      var sheet=document.createElement('div');sheet.className='tech-patent-sheet';
      var sources=['assets/tech-patent-4.png','assets/patent-select-2.png','assets/patent-select-3.png','assets/patent-select-4.png'];
      var image=document.createElement('img');image.src=sources[0];image.alt='특허증 1';image.className='tech-patent-selected';sheet.appendChild(image);
      var indicators=document.createElement('div');indicators.className='tech-patent-buttons';indicators.setAttribute('aria-label','증서 선택');
      sources.forEach(function(src,index){var button=document.createElement('button');button.type='button';button.className='tech-patent-dot';button.setAttribute('aria-label','증서 '+(index+1));button.setAttribute('aria-pressed',String(index===0));button.addEventListener('click',function(){image.src=src;image.alt='증서 '+(index+1);image.classList.toggle('is-credit',index===1);image.animate([{opacity:0},{opacity:1}],{duration:260});indicators.querySelectorAll('button').forEach(function(dot,i){dot.setAttribute('aria-pressed',String(i===index));});});indicators.appendChild(button);});
      sheet.appendChild(indicators);slide.appendChild(sheet);
    } else {
      var crop=document.createElement('div');crop.className='tech-photo-crop';
      if(item.mirror)crop.classList.add('is-mirrored');
      var image=document.createElement('img');image.src=item.image;image.alt=item.title+' 기술 소개 이미지';
      if(item.crop)Object.keys(item.crop).forEach(function(key){image.style[key]=item.crop[key];});
      crop.appendChild(image);slide.appendChild(crop);
    }
  }
  function setItem(index) {
    if (current === index) return;
    var first = current === -1;
    var direction = first || index > current ? 1 : -1;
    if (first) titleFrame.replaceChildren();
    current = index; var token = ++generation; var item = items[index];
    clearTimers(contentTimers);
    stage.dataset.step = String(index + 1);
    stage.dataset.direction = direction > 0 ? 'forward' : 'reverse';
    steps.querySelectorAll('button').forEach(function(button,n){button.setAttribute('aria-pressed',String(n===index));});
    steps.querySelectorAll('svg').forEach(function (digit, n) { digit.classList.toggle('is-active', n === index); if (n === index) digit.setAttribute('aria-current','step'); else digit.removeAttribute('aria-current'); });
    subtitle.classList.remove('is-visible'); body.classList.remove('is-visible');
    var oldTitle = titleFrame.lastElementChild;
    var keepInitialImage = first && (index === 0 || Number(new URLSearchParams(location.search).get('step')) === index + 1);
    var oldImage = keepInitialImage ? null : imageFrame.lastElementChild;
    [titleFrame,imageFrame].forEach(function (frame) {
      var previous = frame.lastElementChild;
      Array.from(frame.children).forEach(function (child) { if (child !== previous) child.remove(); });
    });
    var incomingTitle = document.createElement('h2');
    incomingTitle.className = 'tech-title-slide'; incomingTitle.textContent = item.title;
    incomingTitle.style.setProperty('--enter-offset', direction > 0 ? '110%' : '-110%');
    titleFrame.appendChild(incomingTitle);
    var incomingImage = keepInitialImage ? imageFrame.lastElementChild : document.createElement('div');
    incomingImage.className = 'tech-image-slide' + (keepInitialImage ? ' is-current' : '');
    incomingImage.style.setProperty('--enter-offset', direction > 0 ? '100%' : '-100%');
    if (!keepInitialImage) {
      populateImage(incomingImage,item); imageFrame.appendChild(incomingImage);
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (token !== generation) return;
      if (oldImage) { oldImage.style.setProperty('--exit-offset', direction > 0 ? '-100%' : '100%'); oldImage.classList.remove('is-current'); oldImage.classList.add('is-outgoing'); }
      incomingImage.classList.add('is-current');
      // Image and title start together; subtitle and body retain their staged fades.
      if (oldTitle) { oldTitle.style.setProperty('--exit-offset', direction > 0 ? '-110%' : '110%'); oldTitle.classList.remove('is-current'); oldTitle.classList.add('is-outgoing'); }
      incomingTitle.classList.add('is-current');
      later(contentTimers, function () { subtitle.textContent = item.subtitle; writeBody(item.body,item); }, 320);
      later(contentTimers, function () { subtitle.classList.add('is-visible'); }, 710);
      later(contentTimers, function () { body.classList.add('is-visible'); }, 1050);
      later(contentTimers, function () { if (oldImage) oldImage.remove(); if (oldTitle) oldTitle.remove(); }, 760);
    }); });
  }
  function updateContent() {
    var rect = track.getBoundingClientRect();
    if (rect.top >= window.innerHeight * .55 || rect.bottom <= 0) return;
    var span = rect.height - window.innerHeight;
    var progress = Math.max(0, Math.min(.99999, -rect.top / span));
    setItem(Math.min(5, Math.floor(progress * 6)));
  }
  var previousY = window.scrollY, queued = false;
  function update() {
    queued = false; updateContent();
    var y = Math.max(0, window.scrollY);
    if (header.classList.contains('is-visible')) {
      if (y <= 1) header.classList.remove('is-hidden');
      else if (Math.abs(y - previousY) >= 3) header.classList.toggle('is-hidden', y > previousY);
    }
    previousY = y;
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, {passive:true});
  window.addEventListener('resize', updateContent);
  document.getElementById('toTopBtn').addEventListener('click', function () { window.scrollTo({top:0,behavior:reducedMotion ? 'instant' : 'smooth'}); });
  // Preload all three exact Figma images before their fixed-frame transitions.
  items.forEach(function (item) { var image = new Image(); image.src = item.image; });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) { document.documentElement.style.overflow = ''; overlay.classList.add('is-done'); header.classList.add('is-visible'); current = -1; updateContent(); }
  });
  runIntro();
})();

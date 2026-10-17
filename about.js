(function () {
  'use strict';

  /* ===================== 7-segment glyph renderer (shared) ===================== */
  var SEG = { '0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','A':'abcefg','b':'cdefg','C':'adef','d':'bcdeg','E':'adefg','F':'aefg','H':'bcefg','L':'def','P':'abefg','U':'bcdef',' ':'' };
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var FILL_ORDER = ['a','f','b','g','e','c','d'];

  function createGlyph(ch, o) {
    var W = o.w, H = o.h, t = o.t, g = o.g, h = t / 2;
    var L = h, R = W - h, T = h, M = H / 2, B = H - h;
    var hz = function (x1, x2, y) { return x1+','+y+' '+(x1+h)+','+(y-h)+' '+(x2-h)+','+(y-h)+' '+x2+','+y+' '+(x2-h)+','+(y+h)+' '+(x1+h)+','+(y+h); };
    var vt = function (x, y1, y2) { return x+','+y1+' '+(x+h)+','+(y1+h)+' '+(x+h)+','+(y2-h)+' '+x+','+y2+' '+(x-h)+','+(y2-h)+' '+(x-h)+','+(y1+h); };
    var p = { a:hz(L+g,R-g,T), b:vt(R,T+g,M-g), c:vt(R,M+g,B-g), d:hz(L+g,R-g,B), e:vt(L,M+g,B-g), f:vt(L,T+g,M-g), g:hz(L+g,R-g,M) };
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    var segs = {};
    Object.keys(p).forEach(function (s) {
      var poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', p[s]);
      poly.setAttribute('fill', o.off);
      poly.style.transition = 'fill .18s ease';
      svg.appendChild(poly);
      segs[s] = poly;
    });
    return { svg: svg, segs: segs };
  }

  function animateGlyph(container, ch, opts, onDone, schedule) {
    var later = schedule || setTimeout;
    var r = createGlyph(ch, opts);
    container.innerHTML = '';
    container.appendChild(r.svg);
    var samples = ['8','H','2','E','9','P','4','U','6','F','3','b','7','C','0','L'];
    var frame = 0;
    function paint(value) {
      Object.keys(r.segs).forEach(function(name) {
        r.segs[name].style.transition = 'fill .07s ease';
        r.segs[name].setAttribute('fill', (SEG[value] || '').indexOf(name) >= 0 ? opts.on : opts.off);
      });
    }
    function cycle() {
      if (frame < 6) { paint(samples[(frame++ * 5 + STAT_GLYPHS.indexOf(ch) * 3) % samples.length]); later(cycle,48); return; }
      Object.keys(r.segs).forEach(function(name) { r.segs[name].style.transition='fill .16s ease'; r.segs[name].setAttribute('fill',opts.off); });
      var order=FILL_ORDER.filter(function(name) { return (SEG[ch] || '').indexOf(name)>=0; }), index=0;
      function settle() {
        if(index<order.length) { r.segs[order[index++]].setAttribute('fill',opts.on); later(settle,65); }
        else { container.dataset.displayedGlyph=ch; container.dataset.state='settled'; if(onDone) onDone(); }
      }
      later(settle,60);
    }
    container.dataset.state='cycling'; cycle();
  }

  /* ===================== Utility ===================== */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function getScrollProgress(el) {
    var r = el.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    if (span <= 0) return 0;
    return clamp(-r.top / span, 0, 1);
  }

  /* ===================== S1 — Parallax image ===================== */
  var s1Wrap = document.getElementById('s1');
  var s1Image = document.getElementById('s1Image');
  var s1Title = document.getElementById('s1Title');

  var s1White = document.getElementById('s1TitleWhite');
  var s1Layout;
  function measureS1() {
    s1Layout = {top:s1Title.offsetTop, left:s1Title.offsetLeft, width:s1Title.offsetWidth, height:s1Title.offsetHeight};
  }
  function showS1Copy() { s1Wrap.classList.add('is-copy-visible'); }
  var lastS1Line = s1Title.querySelector('.s1-title-base .s1-line:last-child > span');
  lastS1Line.addEventListener('transitionend', function(e) {
    if (e.propertyName === 'transform') showS1Copy();
  }, { once:true });
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    s1Wrap.classList.add('is-ready');
    setTimeout(showS1Copy, 1220);
  }); });
  function updateS1(distance) {
    if (!s1Wrap) return;
    var vh = window.innerHeight, vw = document.documentElement.clientWidth;
    if (!s1Layout) measureS1();
    var expandDistance = vh * .9;
    var expand = clamp(distance / expandDistance, 0, 1);
    var margin = Math.min(120, Math.max(24, vw * .0833));
    var width = lerp(vw - 2 * margin, vw, expand);
    var top = lerp(vh * .57, 0, expand) - Math.max(0, distance - expandDistance);
    var height = lerp(vh * .43, vh, expand);
    var bottom = top + height;
    s1Image.style.top = '0px';
    s1Image.style.left = '0px';
    s1Image.style.transform = 'translate3d(' + ((vw - width) / 2) + 'px,' + top + 'px,0)';
    s1Image.style.width = width + 'px';
    s1Image.style.height = height + 'px';
    // Use untransformed layout coordinates; scrolling back reverses without feedback drift.
    var titleBottom = s1Layout.top + s1Layout.height;
    var shift = Math.min(0, bottom - 40 - titleBottom);
    s1Title.style.transform = 'translateY(' + shift + 'px)';
    var imageLeft = (vw - width) / 2, textTop = s1Layout.top + shift;
    var left = Math.max(0, imageLeft - s1Layout.left);
    var right = Math.max(0, s1Layout.left + s1Layout.width - imageLeft - width);
    var clipTop = Math.max(0, top - textTop);
    var clipBottom = Math.max(0, textTop + s1Layout.height - bottom);
    if (left + right >= s1Layout.width || clipTop + clipBottom >= s1Layout.height) {
      s1White.style.clipPath = 'inset(100% 0 0 0)';
    } else {
      s1White.style.clipPath = 'inset(' + clipTop + 'px ' + right + 'px ' + clipBottom + 'px ' + left + 'px)';
    }
  }

  var s6Section=document.getElementById('s6Section');
  if(s6Section) {
    var s6Observer=new IntersectionObserver(function(entries) {
      if(!entries.some(function(entry){return entry.isIntersecting;})) return;
      s6Section.classList.add('is-ready');
      setTimeout(function(){s6Section.classList.add('is-copy-visible');},1220);
      s6Observer.disconnect();
    },{threshold:.35});
    s6Observer.observe(s6Section);
  }

  /* ===================== S2 — Reveal lines ===================== */
  var s2 = document.getElementById('s2');
  var s2Lines = s2 ? s2.querySelectorAll('.reveal-line') : [];
  var s2Done = false;

  function checkS2() {
    if (s2Done || !s2) return;
    var r = s2.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.7) {
      s2Done = true;
      s2Lines.forEach(function (line, i) {
        setTimeout(function () { line.classList.add('is-on'); }, i * 180);
      });
      setTimeout(function () { s2.classList.add('is-on'); }, s2Lines.length * 250 + 200);
    }
  }

  /* ===================== S3–S4 — Sticky transition ===================== */
  var s34Wrap = document.getElementById('s34');
  var s3Header = document.getElementById('s3Header');
  var s4Header = document.getElementById('s4Header');
  var s3Title = s3Header ? s3Header.querySelector('.reveal-up') : null;
  var s4Title = s4Header ? s4Header.querySelector('.reveal-up') : null;
  var s3TitleRevealed = false;
  var safetyCards = document.querySelectorAll('#s3Cards .s-card');
  var safetyCardsShown = false;

  function updateS34() {
    if (!s34Wrap) return;
    var p = getScrollProgress(s34Wrap);
    if (!s3TitleRevealed && s3Title && s34Wrap.getBoundingClientRect().top < window.innerHeight * .55) {
      s3TitleRevealed = true;
      function showSafetyCards() {
        if (safetyCardsShown) return;
        safetyCardsShown = true;
        safetyCards.forEach(function(card, i) {
          setTimeout(function () { card.classList.add('is-revealed'); }, i * 240);
        });
      }
      s3Title.firstElementChild.addEventListener('transitionend', function(e) {
        if (e.propertyName === 'transform') showSafetyCards();
      }, {once:true});
      s3Title.classList.add('is-on');
      setTimeout(showSafetyCards, 970);
    }

    if (p < 0.45) {
      s34Wrap.classList.remove('phase-4');
      s3Header.classList.add('is-active');
      s4Header.classList.remove('is-active');
    } else {
      s34Wrap.classList.add('phase-4');
      s3Header.classList.remove('is-active');
      s4Header.classList.add('is-active');
      if (s4Title && !s4Title.classList.contains('is-on')) {
        setTimeout(function () { s4Title.classList.add('is-on'); }, 400);
      }
    }
  }

  /* ===================== S5 — Circular diagram ===================== */
  var s5Wrap = document.getElementById('s5');
  var s5Nodes = s5Wrap ? s5Wrap.querySelectorAll('.s5-node') : [];
  var s5Phase = -1, previousDiagramNode = -1;
  var hoverGauge = document.getElementById('s5HoverGauge');
  function fitDiagram() {
    var stage = document.getElementById('s5DiagramStage');
    if (!stage) return;
    var parent = stage.parentElement;
    var scale = Math.min(1.05, parent.clientWidth / 720, (parent.clientHeight - 120) / 720);
    scale = Math.max(0.1, scale);
    stage.style.transform = 'scale(' + scale + ')';
    s5Wrap.style.setProperty('--diagram-top', Math.max(0,(parent.clientHeight-720*scale)/2)+'px');
  }
  function selectDiagramNode(index) {
    if (!hoverGauge || index === s5Phase) return;
    var progress=index===0 && previousDiagramNode===3?100:index*25;
    s5Phase = index;
    previousDiagramNode=index;
    s5Wrap.dataset.selectedNode = String(index);
    s5Nodes.forEach(function(node,i){
      node.classList.toggle('is-active',i===index);
      node.setAttribute('aria-pressed',String(i===index));
    });
    // Clockwise from the existing 12 o'clock origin: 0 / 25 / 50 / 75%.
    hoverGauge.style.strokeDashoffset = String(100-progress);
    hoverGauge.dataset.progress = String(progress);
  }
  function resetDiagram(){
    s5Phase=-1;
    hoverGauge.style.strokeDashoffset="100";hoverGauge.dataset.progress="0";
    s5Nodes.forEach(function(node){node.classList.remove("is-active");node.setAttribute("aria-pressed","false");});
  }
  s5Nodes.forEach(function (node, index) {
    node.addEventListener("pointerleave",resetDiagram);
    node.addEventListener("blur",function(){if(s5Phase===index)resetDiagram();});
    node.addEventListener("focus",function(){if(node.matches(":focus-visible"))selectDiagramNode(index);});
    node.addEventListener('pointerenter', function (event) { if (event.pointerType !== 'touch') selectDiagramNode(index); });
    node.addEventListener('click', function () { selectDiagramNode(index); });
    node.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectDiagramNode(index); }
    });
  });

  /* ===================== S5 bottom items — IntersectionObserver ===================== */
  var s5BottomEl = document.getElementById('s5Bottom');
  var s5BottomItems = s5BottomEl ? s5BottomEl.querySelectorAll('.s5-item') : [];
  if (s5BottomItems.length) {
    var s5ItemObs = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        s5BottomItems.forEach(function (item, i) {
          setTimeout(function () { item.classList.add('is-on'); }, i * 200);
        });
        s5ItemObs.disconnect();
      }
    }, { threshold: 0.1 });
    s5ItemObs.observe(s5BottomItems[0]);
  }

  /* ===================== S7–S9 — Stat cycling ===================== */
  var s69Wrap = document.getElementById('s69');
  var s7Frame = document.getElementById('s7Frame');
  var s7Images = s7Frame ? s7Frame.querySelectorAll('.s7-img') : [];
  var s7Stats = s7Frame ? s7Frame.querySelectorAll('.s7-stat') : [];
  var s69Phase = -1;
  var s69Inside = false;
  var statTimers = [];
  var statRun = 0;
  var STAT_GLYPHS = ['1', '5', 'A'];
  var GLYPH_OPTS = { w:77, h:140, t:16, g:1.9, on:'#fff', off:'rgba(255,255,255,.2)' };
  function prepareStatGlyph(stat) {
    var container = stat.querySelector('.s7-glyph');
    // All seven segments start equally dim, including those that will fill later.
    container.replaceChildren(createGlyph(container.dataset.glyph, GLYPH_OPTS).svg);
  }
  s7Stats.forEach(prepareStatGlyph);

  function statLater(fn, delay) {
    var run = statRun;
    var id = setTimeout(function() { if (run === statRun) fn(); }, delay);
    statTimers.push(id);
    return id;
  }
  function resetStatText(statEl) {
    statEl.querySelectorAll('.reveal-line').forEach(function(line) { line.classList.remove('is-on'); });
  }
  var photoAnimations=[];
  var photoCurrent=0;
  function cancelPhotoMotion() {
    photoAnimations.forEach(function(animation){animation.cancel();}); photoAnimations=[];
    s7Frame.querySelectorAll('.s7-zoom-ghost').forEach(function(ghost){ghost.remove();});
  }
  function switchPhoto(index, first) {
    cancelPhotoMotion();
    var old=s7Images[photoCurrent], next=s7Images[index];
    s7Images.forEach(function(img,i){img.style.zIndex=i===index?'2':'0';img.style.opacity=i===index?'1':'0';img.style.transform='none';img.style.filter='none';});
    photoCurrent=index;
    if(first || old===next || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    old.style.opacity='1';old.style.zIndex='1';
    var easing='cubic-bezier(.16,.8,.2,1)';
    var motion=next.animate([{transform:'scale(1.35)',filter:'blur(14px)'},{transform:'scale(1)',filter:'blur(0px)'}],{duration:1050,easing:easing});
    photoAnimations.push(motion,next.animate([{opacity:0},{opacity:1}],{duration:367.5,easing:'linear'}),old.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.045)',filter:'brightness(.76)'}],{duration:1050,easing:easing}));
    [1.5,1.65].forEach(function(scale,i){
      var ghost=next.cloneNode(false);ghost.classList.add('s7-zoom-ghost');ghost.removeAttribute('data-slide');ghost.style.zIndex=String(3+i);next.parentElement.appendChild(ghost);
      photoAnimations.push(ghost.animate([{transform:'scale('+scale+')',filter:'blur(14px)',opacity:.12-i*.035},{transform:'scale(1)',filter:'blur(0px)',opacity:0}],{duration:1050,easing:easing,fill:'forwards'}));
    });
    motion.finished.then(function(){if(photoCurrent!==index)return;cancelPhotoMotion();old.style.opacity='0';}).catch(function(){});
  }
  function resetS69() {
    cancelPhotoMotion();
    statRun++;
    statTimers.forEach(clearTimeout);
    statTimers = [];
    s69Phase = -1;
    s69Inside = false;
    s7Images.forEach(function(image,i) { image.classList.remove('is-active','is-darkened'); image.style.opacity=i===0?'1':'0'; image.style.transform='none'; image.style.filter='none'; });
    photoCurrent=0;
    s7Stats.forEach(function(stat) {
      resetStatText(stat);
      prepareStatGlyph(stat);
      stat.classList.remove('is-active','is-playing');
    });
  }
  function updateS69() {
    if (!s69Wrap) return;
    var rect = s69Wrap.getBoundingClientRect();
    var visible = rect.top < window.innerHeight * .25 && rect.bottom > window.innerHeight * .65;
    if (!visible) {
      if (s69Inside) resetS69();
      return;
    }
    var p = getScrollProgress(s69Wrap);
    var phase = p < .25 ? 0 : p < .55 ? 1 : 2;
    if (s69Inside && phase === s69Phase) return;
    var entering = !s69Inside;
    statRun++;
    statTimers.forEach(clearTimeout);
    statTimers = [];
    s69Inside = true;
    s69Phase = phase;
    var detailsIcon = document.querySelector('.s7-details-icon');
    detailsIcon.dataset.phase = String(phase);
    detailsIcon.querySelector('img').src = ['assets/r4-details-up.svg','assets/r4-details-middle.svg','assets/r4-details-down.svg'][phase];
    if (entering) s69Wrap.dataset.entryCount = String(Number(s69Wrap.dataset.entryCount || 0) + 1);
    s7Images.forEach(function(img,i) { img.classList.remove('is-darkened'); img.classList.toggle('is-active', i === phase); });
    s7Stats.forEach(function(stat,i) {
      resetStatText(stat);
      prepareStatGlyph(stat);
      stat.classList.remove('is-playing');
      stat.classList.toggle('is-active', i === phase);
    });
    switchPhoto(phase, entering && phase===0);
    var current = s7Stats[phase];
    var image = s7Images[phase];
    var run = statRun;
    var started = false;
    function playStat() {
      if (started || run !== statRun) return;
      started = true;
      current.classList.add('is-playing');
      animateGlyph(current.querySelector('.s7-glyph'), STAT_GLYPHS[phase], GLYPH_OPTS, function() {
        current.querySelectorAll('.reveal-line').forEach(function(line,i) {
          statLater(function() { line.classList.add('is-on'); }, i * 180);
        });
      }, statLater);
    }
    // The first photograph already exists. Darkening and the glyph start together.
    requestAnimationFrame(function(){if(run!==statRun)return;image.classList.add('is-darkened');});
    playStat();
  }

  var detailsPlane=document.getElementById('s7DetailsPlane');
  s7Frame.addEventListener('pointermove',function(event){
    if(event.pointerType==='touch')return;
    var rect=s7Frame.querySelector('.s7-images').getBoundingClientRect();
    var inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
    detailsPlane.classList.toggle('is-hovered',inside);
    if(inside)detailsPlane.style.setProperty('--details-y',clamp(event.clientY-rect.top-36,12,Math.max(12,rect.height-84))+'px');
  });
  s7Frame.addEventListener('pointerleave',function(){detailsPlane.classList.remove('is-hovered');});

  /* ===================== Scroll to top ===================== */
  var toTopBtn = document.getElementById('toTopBtn');
  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // Measure the actual fixed lines once per resize; all offsets use the same grid.
  function measurePageGrid() {
    var lines = document.querySelectorAll('.page-grid-line');
    if (lines.length < 2) return;
    var left = lines[0].getBoundingClientRect().left;
    var step = lines[1].getBoundingClientRect().left - left;
    document.documentElement.style.setProperty('--about-grid-gutter', left + 'px');
    document.documentElement.style.setProperty('--about-grid-column', step + 'px');
  }
  measurePageGrid();
  /* Fixed header visibility follows scroll direction without shifting content. */
  var header = document.getElementById('aboutHeader');
  var previousY = window.scrollY;
  function updateHeader() {
    var y = Math.max(0, window.scrollY);
    if (!header) return;
    if (y <= 0) header.classList.remove('is-hidden');
    else if (Math.abs(y - previousY) >= 3) {
      header.classList.toggle('is-hidden', y > previousY);
    }
    previousY = y;
  }

  /* Short, time-based interpolation keeps image and text/mask synchronized. */
  var frameId = null, lastFrame = 0, smoothDistance = null;
  function renderFrame(now) {
    frameId = null;
    var vh = window.innerHeight;
    var target = clamp(-s1Wrap.getBoundingClientRect().top, 0, s1Wrap.offsetHeight - vh);
    var dt = Math.min(50, Math.max(1, now - (lastFrame || now - 16.7)));
    lastFrame = now;
    if (smoothDistance === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) smoothDistance = target;
    else smoothDistance += (target - smoothDistance) * (1 - Math.exp(-dt / 125));
    if (Math.abs(target - smoothDistance) < .15) smoothDistance = target;
    updateS1(smoothDistance);
    checkS2();
    updateS34();
    updateS69();
    if (smoothDistance !== target) frameId = requestAnimationFrame(renderFrame);
  }
  function onScroll() {
    updateHeader();
    if (frameId === null) frameId = requestAnimationFrame(renderFrame);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', function() {
    measurePageGrid(); measureS1(); fitDiagram(); smoothDistance = null; onScroll();
  });
  window.addEventListener('pagehide', resetS69);
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) { resetS69(); smoothDistance = null; onScroll(); }
  });
  if (document.fonts) document.fonts.ready.then(function() { measureS1(); onScroll(); });
  measureS1();
  fitDiagram();
  onScroll();
})();

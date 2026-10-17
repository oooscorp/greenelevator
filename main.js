(function () {
  'use strict';

  /* ===================== 7-segment glyph renderer ===================== */
  const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', 'A': 'abcefg', 'b': 'cdefg', 'C': 'adef', 'd': 'bcdeg', 'E': 'adefg', 'F': 'aefg', 'H': 'bcefg', 'L': 'def', 'P': 'abefg', 'U': 'bcdef', ' ': '' };
  const POOL = '0123456789AbCdEFHLPU';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function glyph(ch, o) {
    const W = o.w, H = o.h, t = o.t, g = o.g, h = t / 2;
    const L = h, R = W - h, T = h, M = H / 2, B = H - h;
    const hz = (x1, x2, y) => `${x1},${y} ${x1 + h},${y - h} ${x2 - h},${y - h} ${x2},${y} ${x2 - h},${y + h} ${x1 + h},${y + h}`;
    const vt = (x, y1, y2) => `${x},${y1} ${x + h},${y1 + h} ${x + h},${y2 - h} ${x},${y2} ${x - h},${y2 - h} ${x - h},${y1 + h}`;
    const p = { a: hz(L + g, R - g, T), b: vt(R, T + g, M - g), c: vt(R, M + g, B - g), d: hz(L + g, R - g, B), e: vt(L, M + g, B - g), f: vt(L, T + g, M - g), g: hz(L + g, R - g, M) };
    const on = SEG[ch] ?? '';
    const k = o.skew ? H * 0.176 : 0;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', W + k);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W + k} ${H}`);
    svg.style.display = 'block';
    svg.style.overflow = 'visible';

    const g_el = document.createElementNS(SVG_NS, 'g');
    if (o.skew) g_el.setAttribute('transform', `translate(${k},0) skewX(-10)`);

    Object.keys(p).forEach(s => {
      const lit = on.includes(s);
      if (!lit && o.off === 'none') return;
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', p[s]);
      poly.setAttribute('fill', lit ? o.on : o.off);
      if (o.tr) poly.style.transition = o.tr;
      g_el.appendChild(poly);
    });
    svg.appendChild(g_el);
    return svg;
  }

  function renderDigits(container, str, opts) {
    container.innerHTML = '';
    str.split('').forEach(ch => container.appendChild(glyph(ch, opts)));
  }

  /* ===================== Hero intro ===================== */
  const hero = document.getElementById('hero');
  const gaugeLine = document.getElementById('gaugeLine');
  const gaugeDigits = document.getElementById('gaugeDigits');

  let timers = [];
  let introRaf = null;

  function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearIntroTimers() {
    timers.forEach(clearTimeout); timers = [];
    if (introRaf) cancelAnimationFrame(introRaf);
  }
  function lockScroll(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; }

  function setGauge(p) {
    const max = hero.clientHeight;
    const hgt = max * p;
    gaugeLine.style.height = hgt + 'px';
    const numberProgress = Math.min(p, 0.97);
    gaugeDigits.parentElement.style.transform = `translateY(${-max * numberProgress + 14 * numberProgress}px)`;
  }

  function setPhase(n) {
    hero.classList.add('p' + n);
    if (n === 2) hero.classList.add('seam-on');
    if (n === 3) {
      hero.dataset.openStartedAt = String(Date.now());
      hero.classList.remove('seam-on');
      window.GreenDoorMotion.open(document.getElementById('doorLeft'),document.getElementById('doorRight'),document.getElementById('heroMedia'));
    }
    if (n === 4) hero.dataset.shrinkStartedAt = String(Date.now());
  }
  function enableHomeNavigation() {
    hero.classList.add('is-navigation-ready');
    hero.dataset.navigationReadyAt = String(Date.now());
    homeHeader.inert = false;
    homeHeader.removeAttribute('aria-hidden');
    homeHeader.classList.remove('is-hidden');
    headerScrollY = window.scrollY;
  }

  function runSteps() {
    setPhase(2);
    later(() => {
      setPhase(3);
      later(() => {
        // Restore the shrink to the moment the doors finish opening.
        setPhase(4);
        enableHomeNavigation();
        later(() => {
          setPhase(5);
          later(() => { lockScroll(false); }, 1000);
        }, 600);
      }, window.GreenDoorMotion.total);
    }, 450);
  }

  function startIntro() {
    clearIntroTimers();
    window.scrollTo(0, 0);
    lockScroll(true);
    setGauge(0);
    const dur = 2400, t0 = performance.now();
    const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    let lastCount = -1;
    function tick(now) {
      const p = ease(Math.min(1, (now - t0) / dur));
      setGauge(p);
      const n = Math.round(p * 100);
      if (n !== lastCount) {
        lastCount = n;
        renderDigits(gaugeDigits, String(n), { w: 15, h: 24, t: 3.2, g: 0.7, on: '#5f5f5f', off: 'none', skew: true });
      }
      if (p < 1) introRaf = requestAnimationFrame(tick);
      else later(runSteps, 250);
    }
    introRaf = requestAnimationFrame(tick);
  }

  function skipIntroToEnd() {
    clearIntroTimers();
    lockScroll(false);
    [2, 3, 4, 5].forEach(setPhase);
    enableHomeNavigation();
    hero.classList.remove('seam-on');
  }

  const heroVideo = document.getElementById('heroVideo');
  heroVideo.muted = true;
  function playHeroVideo() { const result=heroVideo.play(); if(result) result.catch(() => {}); }
  playHeroVideo();
  window.addEventListener('pageshow',playHeroVideo);

  /* ===================== Performance stat segment-fill ===================== */
  const FILL_ORDER = ['a', 'f', 'b', 'g', 'e', 'c', 'd'];
  const statEls = Array.from(document.querySelectorAll('.stat'));
  const STATS = statEls.map((el, i) => ({
    glyphEl: el.querySelector('[data-stat-glyph]'),
    final: el.dataset.final,
  }));
  let flickerStarted = false;

  function createStatGlyph(ch, opts) {
    const W = opts.w, H = opts.h, t = opts.t, g = opts.g, h = t / 2;
    const L = h, R = W - h, T = h, M = H / 2, B = H - h;
    const hz = (x1, x2, y) => `${x1},${y} ${x1+h},${y-h} ${x2-h},${y-h} ${x2},${y} ${x2-h},${y+h} ${x1+h},${y+h}`;
    const vt = (x, y1, y2) => `${x},${y1} ${x+h},${y1+h} ${x+h},${y2-h} ${x},${y2} ${x-h},${y2-h} ${x-h},${y1+h}`;
    const p = { a: hz(L+g,R-g,T), b: vt(R,T+g,M-g), c: vt(R,M+g,B-g), d: hz(L+g,R-g,B), e: vt(L,M+g,B-g), f: vt(L,T+g,M-g), g: hz(L+g,R-g,M) };
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    const segs = {};
    Object.keys(p).forEach(s => {
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', p[s]);
      poly.setAttribute('fill', opts.off);
      poly.style.transition = 'fill .25s ease';
      svg.appendChild(poly);
      segs[s] = poly;
    });
    return { svg: svg, segs: segs };
  }

  function startFlicker() {
    if (flickerStarted) return;
    flickerStarted = true;
    const opts = { w:45, h:80, t:9, g:1.2, on:'#000', off:'#D0D0D0' };
    const views = STATS.map(st => {
      const view = createStatGlyph(st.final, opts);
      st.glyphEl.replaceChildren(view.svg);
      return view;
    });
    function paint(index, ch) {
      const active = SEG[ch] || '';
      Object.entries(views[index].segs).forEach(([name, poly]) => {
        poly.style.transition = 'fill .07s ease';
        poly.setAttribute('fill', active.includes(name) ? opts.on : opts.off);
      });
      STATS[index].glyphEl.dataset.displayedGlyph = ch;
    }
    function animateStat(index) {
      if (index >= STATS.length) return;
      const st = STATS[index], segs = views[index].segs;
      const samples = ['8','H','2','E','9','P','4','U','6','F','3','b','7','C','0','L'];
      let frame = 0;
      function cycle() {
        if (frame < 6) {
          paint(index, samples[(frame * 5 + index * 3) % samples.length]);
          frame++;
          setTimeout(cycle, 48);
          return;
        }
        Object.values(segs).forEach(poly => {
          poly.style.transition = 'fill .16s ease';
          poly.setAttribute('fill', opts.off);
        });
        const order = FILL_ORDER.filter(name => SEG[st.final].includes(name));
        let segment = 0;
        function settle() {
          if (segment < order.length) {
            segs[order[segment++]].setAttribute('fill', opts.on);
            setTimeout(settle, 65);
          } else {
            st.glyphEl.dataset.displayedGlyph = st.final;
            st.glyphEl.dataset.state = 'settled';
          }
        }
        setTimeout(settle, 60);
      }
      st.glyphEl.dataset.state = 'cycling';
      cycle();
    }
    STATS.forEach((_, index) => animateStat(index));
  }

  const statGrid = document.getElementById('statGrid');
  if (statGrid) {
    const statObserver = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) startFlicker();
    }, { threshold: 0.4 });
    statObserver.observe(statGrid);
  }

  /* ===================== Partners grid ===================== */
  const partnersGrid = document.getElementById('partnersGrid');
  for (let i = 1; i <= 21; i++) {
    const slot = document.createElement('div');
    slot.className = 'partner-slot';
    const img = document.createElement('img');
    img.src = `assets/plogo-${((i - 1) % 16) + 1}.png`;
    img.alt = '파트너사 로고';
    img.loading = 'lazy';
    slot.appendChild(img);
    partnersGrid.appendChild(slot);
  }

  /* ===================== Scroll to top ===================== */
  const toTopBtn = document.getElementById('toTopBtn');
  if (toTopBtn) {
    toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const homeHeader = document.querySelector('.site-header');
  homeHeader.inert = true;
  homeHeader.setAttribute('aria-hidden', 'true');
  let headerScrollY = window.scrollY;
  function updateHomeHeader() {
    const y = Math.max(0, window.scrollY);
    if (!hero.classList.contains('is-navigation-ready')) { headerScrollY = y; return; }
    if (y <= 0) homeHeader.classList.remove('is-hidden');
    else if (Math.abs(y - headerScrollY) >= 3) homeHeader.classList.toggle('is-hidden', y > headerScrollY);
    headerScrollY = y;
  }
  window.addEventListener('scroll', updateHomeHeader, {passive:true});
  window.addEventListener('pageshow', updateHomeHeader);
  updateHomeHeader();

  /* ===================== Boot ===================== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    skipIntroToEnd();
  } else {
    startIntro();
  }
})();

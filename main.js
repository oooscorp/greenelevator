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
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));

  let timers = [];
  let introRaf = null;
  let rotateTimer = null;

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
    gaugeDigits.parentElement.style.transform = `translateY(${-hgt + 14 * p}px)`;
  }

  function setPhase(n) {
    hero.classList.add('p' + n);
    if (n === 2) hero.classList.add('seam-on');
    if (n === 3) hero.classList.remove('seam-on');
  }

  function startRotation() {
    clearInterval(rotateTimer);
    let idx = 0;
    rotateTimer = setInterval(() => {
      idx = (idx + 1) % heroSlides.length;
      heroSlides.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    }, 2000);
  }

  function runSteps() {
    setPhase(2);
    later(() => {
      setPhase(3);
      later(() => {
        setPhase(4);
        later(() => {
          setPhase(5);
          later(() => { lockScroll(false); startRotation(); }, 1000);
        }, 1400);
      }, 1550);
    }, 1300);
  }

  function startIntro() {
    clearIntroTimers();
    window.scrollTo(0, 0);
    lockScroll(true);
    setGauge(0);
    const dur = 3200, t0 = performance.now();
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
    hero.classList.remove('seam-on');
    startRotation();
  }

  /* ===================== Performance stat flicker ===================== */
  const statEls = Array.from(document.querySelectorAll('.stat'));
  const STATS = statEls.map((el, i) => ({
    glyphEl: el.querySelector('[data-stat-glyph]'),
    final: el.dataset.final,
    lockAt: [1300, 1600, 1900][i] ?? 1300,
  }));
  let flickerStarted = false;
  let flickerTimer = null;

  function startFlicker() {
    if (flickerStarted) return;
    flickerStarted = true;
    const t0 = performance.now();
    flickerTimer = setInterval(() => {
      const el = performance.now() - t0;
      let allLocked = true;
      STATS.forEach(st => {
        let ch;
        if (el >= st.lockAt) {
          ch = st.final;
        } else {
          allLocked = false;
          ch = Math.random() < 0.18 ? ' ' : POOL[Math.floor(Math.random() * POOL.length)];
        }
        renderDigits(st.glyphEl, ch, { w: 45, h: 80, t: 9, g: 1.2, on: '#000', off: '#D0D0D0' });
      });
      if (allLocked) clearInterval(flickerTimer);
    }, 70);
  }

  const statGrid = document.getElementById('statGrid');
  if (statGrid) {
    const statObserver = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) startFlicker();
    }, { threshold: 0.4 });
    statObserver.observe(statGrid);
  }

  /* ===================== Categories (scroll-pinned) ===================== */
  const CATS = [
    { label: '공공청사', title: '대표 프로젝트명' },
    { label: '연구기관', title: '대표 프로젝트명' },
    { label: '예술문화시설', title: '국립중앙박물관' },
    { label: '교육시설', title: '대표 프로젝트명' },
    { label: '보건시설', title: '대표 프로젝트명' },
    { label: '교육청사', title: '대표 프로젝트명' },
  ];
  const CAT_TINTS = ['#1b2a4a', '#2a2130', '#143327', '#3a2410', '#1a3a3a', '#2a1a3a'];

  const categoriesSection = document.getElementById('products');
  const categoryBgs = document.getElementById('categoryBgs');
  const categoryTitle = document.getElementById('categoryTitle');
  const categoryList = document.getElementById('categoryList');

  CATS.forEach((c, i) => {
    const bg = document.createElement('div');
    bg.className = 'category-bg';
    bg.style.background = CAT_TINTS[i % CAT_TINTS.length];
    const ph = document.createElement('span');
    ph.className = 'ph-label';
    ph.textContent = c.label + ' 대표 이미지 — 업로드 필요';
    bg.appendChild(ph);
    categoryBgs.appendChild(bg);

    const item = document.createElement('div');
    item.className = 'category-item';
    const glyphWrap = document.createElement('div');
    glyphWrap.className = 'glyph';
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = c.label;
    item.appendChild(glyphWrap);
    item.appendChild(label);
    categoryList.appendChild(item);
  });

  const categoryBgEls = Array.from(categoryBgs.children);
  const categoryItemEls = Array.from(categoryList.children);

  function setActiveCategory(idx) {
    CATS.forEach((c, i) => {
      const active = i === idx;
      categoryBgEls[i].classList.toggle('is-active', active);
      const item = categoryItemEls[i];
      item.classList.toggle('is-active', active);
      const glyphWrap = item.querySelector('.glyph');
      glyphWrap.innerHTML = '';
      glyphWrap.appendChild(glyph(String(i + 1), {
        w: 12, h: 24, t: 2.8, g: 0.6,
        on: active ? '#1FE08C' : '#d6d6d6',
        off: active ? 'rgba(31,224,140,.18)' : 'rgba(255,255,255,.18)',
        tr: 'fill .3s ease',
      }));
    });
    categoryTitle.textContent = CATS[idx].title;
  }
  setActiveCategory(0);

  let currentCat = 0;
  function handleCategoryScroll() {
    if (!categoriesSection) return;
    const r = categoriesSection.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    if (span <= 0) return;
    const prog = Math.max(0, Math.min(0.9999, -r.top / span));
    const cat = Math.floor(prog * CATS.length);
    if (cat !== currentCat) {
      currentCat = cat;
      setActiveCategory(cat);
    }
  }
  window.addEventListener('scroll', handleCategoryScroll, { passive: true });
  window.addEventListener('resize', handleCategoryScroll);

  /* ===================== Partners grid ===================== */
  const partnersGrid = document.getElementById('partnersGrid');
  for (let i = 1; i <= 16; i++) {
    const slot = document.createElement('div');
    slot.className = 'partner-slot';
    const img = document.createElement('img');
    img.src = `assets/plogo-${i}.png`;
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

  /* ===================== Boot ===================== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    skipIntroToEnd();
  } else {
    startIntro();
  }
  handleCategoryScroll();
})();

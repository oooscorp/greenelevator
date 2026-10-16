(function () {
  'use strict';
  // Anisotropic blur: horizontal only. Kept on a texture overlay, never on text.
  var motionDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  motionDefs.setAttribute('width', '0');
  motionDefs.setAttribute('height', '0');
  motionDefs.setAttribute('aria-hidden', 'true');
  motionDefs.setAttribute('focusable', 'false');
  motionDefs.classList.add('door-motion-defs');
  motionDefs.innerHTML = '<defs><filter id="door-panel-horizontal-blur" x="-2%" y="0" width="104%" height="100%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.6 0" edgeMode="duplicate"/></filter></defs>';
  document.body.appendChild(motionDefs);

  // Motion reference: elevator-focus-reveal, V1 Original / A Blur -> Sharp.
  // Shared with home reveal, technology reveal and the source-page closing curtain.
  var doorProfile = { lead:0, duration:1450, focusDelay:80, focusDuration:1370, total:1450, easing:'cubic-bezier(.78,0,.18,1)' };
  var sceneAnimations = new WeakMap();
  function focusScene(visual, opening) {
    if (!visual) return;
    var previous = sceneAnimations.get(visual);
    if (previous) previous.cancel();
    var soft = {filter:'blur(44px) brightness(.68) saturate(.55)',transform:'scale(1.1)'};
    var sharp = {filter:'blur(0px) brightness(1) saturate(1)',transform:'scale(1)'};
    var from = opening ? soft : sharp;
    var to = opening ? sharp : soft;
    visual.style.animation = 'none';
    visual.style.filter = from.filter; visual.style.transform = from.transform;
    var animation = visual.animate([
      {filter:from.filter,transform:from.transform,offset:0},
      {filter:from.filter,transform:from.transform,offset:.46,easing:'cubic-bezier(.22,1,.36,1)'},
      {filter:to.filter,transform:to.transform,offset:.92},
      {filter:to.filter,transform:to.transform,offset:1}
    ],{delay:doorProfile.focusDelay,duration:doorProfile.focusDuration,easing:'linear',fill:'both'});
    sceneAnimations.set(visual,animation);
    animation.finished.then(function () {
      if (sceneAnimations.get(visual) !== animation) return;
      visual.style.filter = opening ? 'none' : to.filter;
      visual.style.transform = opening ? 'none' : to.transform;
      animation.cancel(); sceneAnimations.delete(visual);
    }).catch(function () {});
  }
  function playDoorMotion(left, right, visual, opening) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var panels = [left,right];
    if (reduce) {
      panels.forEach(function(panel,index) { panel.style.transition = 'none'; panel.style.transform = opening ? 'translateX('+(index ? '100%' : '-100%')+')' : 'translateX(0)'; });
      if (visual) { visual.style.filter = 'none'; visual.style.transform = 'none'; }
      return {finished:Promise.resolve()};
    }
    var animations = panels.map(function(panel,index) {
      var closed = 'translateX(0)';
      var open = 'translateX('+(index ? '100%' : '-100%')+')';
      var from = opening ? closed : open;
      var to = opening ? open : closed;
      panel.style.transition = 'none';
      panel.style.transform = from;
      var animation = panel.animate([{transform:from,offset:0},{transform:to,offset:1}],{delay:doorProfile.lead,duration:doorProfile.duration,easing:doorProfile.easing,fill:'both'});
      return animation.finished.then(function () { panel.style.transform = to; animation.cancel(); }).catch(function () {});
    });
    focusScene(visual,opening);
    return {finished:Promise.all(animations)};
  }
  window.GreenDoorMotion = {
    total:doorProfile.total,
    open:function(left,right,visual) { return playDoorMotion(left,right,visual,true); },
    close:function(left,right,visual) { return playDoorMotion(left,right,visual,false); }
  };
  var header = document.querySelector('.gnb-shell');
  if (header) {
    var toggle = header.querySelector('.gnb-company-toggle');
    var menu = header.querySelector('.gnb-submenu');
    var company = header.querySelector('.gnb-company');
    function expand(on) { header.classList.toggle('is-expanded', on); toggle.setAttribute('aria-expanded', String(on)); menu.hidden = !on; }
    company.addEventListener('pointerenter', function (event) { if (event.pointerType !== 'touch') expand(true); });
    header.addEventListener('pointerleave', function (event) { if (event.pointerType !== 'touch' && !header.contains(document.activeElement)) expand(false); });
    toggle.addEventListener('click', function (event) { expand(event.pointerType === 'mouse' || toggle.getAttribute('aria-expanded') !== 'true'); });
    company.addEventListener('focusin', function (event) { if (event.target !== toggle) expand(true); });
    header.addEventListener('focusout', function () { setTimeout(function () { if (!header.contains(document.activeElement)) expand(false); }, 0); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !menu.hidden) { expand(false); toggle.focus(); } });
    document.addEventListener('pointerdown', function (event) { if (!header.contains(event.target)) expand(false); });
    window.addEventListener('scroll', function () { expand(false); }, {passive:true});
  }
  var navigating = false;
  document.addEventListener('click', function (event) {
    var anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    var destination = new URL(anchor.href, location.href);
    if (destination.origin !== location.origin || !destination.pathname.endsWith('/tech.html') || location.pathname.endsWith('/tech.html')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    var curtain = document.createElement('div');
    curtain.className = 'navigation-curtain';
    curtain.setAttribute('aria-hidden','true');
    curtain.innerHTML = '<div class="navigation-door navigation-door-left silver-door"></div><div class="navigation-door navigation-door-right silver-door"></div><div class="navigation-door-seam"></div>';
    document.body.appendChild(curtain);
    // The source DOM remains visible in the opening between the moving doors.
    requestAnimationFrame(function () { requestAnimationFrame(function () { curtain.classList.add('is-closed'); }); });
    var closingFinished = false;
    function finishClosing() {
      if (closingFinished) return;
      closingFinished = true;
      curtain.classList.add('doors-shut');
      // Show the seam only after the doors meet; the destination keeps it visible.
      setTimeout(function () { location.assign(destination.href); }, 100);
    }
    var visual = document.querySelector('.hero-media') || document.querySelector('.tech-innovation-photo');
    window.GreenDoorMotion.close(curtain.querySelector('.navigation-door-left'),curtain.querySelector('.navigation-door-right'),visual).finished.then(finishClosing);
    setTimeout(finishClosing, doorProfile.total + 200);
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      var curtain = document.querySelector('.navigation-curtain'); if (curtain) curtain.remove(); navigating = false;
      document.querySelectorAll('.hero-media,.tech-innovation-photo').forEach(function(visual) {
        var animation = sceneAnimations.get(visual); if (animation) animation.cancel();
        sceneAnimations.delete(visual); visual.style.filter = 'none'; visual.style.transform = 'none';
      });
    }
  });
})();

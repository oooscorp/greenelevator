(function () {
  'use strict';
  // Shared by the home hero and the technology page's project reveal.
  // Keep these timings together so both always use the same lens transition.
  window.GreenLensZoom = function (media, images, options) {
    options = options || {};
    var zone = 0, generation = 0, current = media.firstElementChild;
    var incoming = null, animations = [];
    var className = options.className || 'hero-image-layer';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    images.forEach(function (item) { var image = new Image(); image.src = item.src; });
    function makeLayer(index, ghost) {
      var layer = document.createElement('div');
      layer.className = className + (ghost ? ' lens-ghost' : '');
      layer.dataset.image = String(index);
      var image = document.createElement('img');
      image.src = images[index].src; image.alt = ghost ? '' : images[index].alt;
      if (ghost) { layer.setAttribute('aria-hidden', 'true'); layer.style.pointerEvents = 'none'; }
      layer.appendChild(image);
      return layer;
    }
    function show(index) {
      if (index === zone) return;
      zone = index;
      if (options.onChange) options.onChange(index);
      var run = ++generation;
      var old = current;
      if (incoming && parseFloat(getComputedStyle(incoming).opacity) >= .5) old = incoming;
      var previous = getComputedStyle(old);
      var oldTransform = previous.transform, oldFilter = previous.filter;
      animations.forEach(function (animation) { animation.cancel(); }); animations = [];
      Array.from(media.children).forEach(function (layer) { if (layer !== old) layer.remove(); });
      old.style.cssText = 'z-index:1;opacity:1';
      old.style.transform = oldTransform; old.style.filter = oldFilter;
      current = old;
      var next = makeLayer(index, false);
      next.style.zIndex = '2'; media.appendChild(next); incoming = next;
      media.dataset.zone = String(index); media.dataset.transitioning = 'true';
      function finish() {
        if (run !== generation) return;
        next.style.cssText = 'z-index:1;opacity:1;transform:none;filter:none';
        animations.forEach(function (animation) { animation.cancel(); }); animations = [];
        Array.from(media.children).forEach(function (layer) { if (layer !== next) layer.remove(); });
        current = next; incoming = null; media.dataset.transitioning = 'false';
      }
      if (reduced) { finish(); return; }
      var easing = 'cubic-bezier(0.16,0.8,0.2,1)';
      var motion = next.animate([{transform:'scale(1.35)',filter:'blur(14px)'},{transform:'scale(1)',filter:'blur(0px)'}], {duration:1050,easing:easing,fill:'forwards'});
      animations.push(motion);
      animations.push(next.animate([{opacity:0},{opacity:1}], {duration:367.5,easing:'linear',fill:'forwards'}));
      animations.push(old.animate([{transform:oldTransform,filter:oldFilter},{transform:'scale(1.045)',filter:'brightness(.76)'}], {duration:1050,easing:easing,fill:'forwards'}));
      [1.5,1.65].forEach(function (scale, i) {
        var ghost = makeLayer(index, true); ghost.style.zIndex = String(3+i); media.appendChild(ghost);
        animations.push(ghost.animate([
          {transform:'scale('+scale+')',filter:'blur(18px)',opacity:0,offset:0},
          {opacity:i ? .07 : .1,offset:.16},
          {opacity:0,offset:.8},
          {transform:'scale(1.01)',filter:'blur(0px)',opacity:0,offset:1}
        ], {duration:1050,easing:easing,fill:'forwards'}));
      });
      motion.finished.then(finish).catch(function () {});
    }
    return {show:show};
  };
})();

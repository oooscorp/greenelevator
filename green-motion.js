/* Shared original home/about numeric and photographic motion. */
(function(){'use strict';
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

  function animateGlyph(container, ch, opts, onDone, schedule, seed) {
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
      if (frame < 6) { paint(samples[(frame++ * 5 + (seed == null ? ['1','5','A'].indexOf(ch) : seed) * 3) % samples.length]); later(cycle,48); return; }
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


  // Unchanged photo profile extracted from about.js switchPhoto: 1050ms focus,
  // 367.5ms opacity and the two fading focus layers.
  function photoTransition(images,index,previous,first){
    var old=images[previous],next=images[index],animations=[];
    images.forEach(function(img,i){img.style.zIndex=i===index?'2':'0';img.style.opacity=i===index?'1':'0';img.style.transform='none';img.style.filter='none';});
    if(first||old===next||matchMedia('(prefers-reduced-motion: reduce)').matches)return animations;
    old.style.opacity='1';old.style.zIndex='1';
    var easing='cubic-bezier(.16,.8,.2,1)';
    animations.push(next.animate([{transform:'scale(1.35)',filter:'blur(14px)'},{transform:'scale(1)',filter:'blur(0px)'}],{duration:1050,easing:easing}));
    animations.push(next.animate([{opacity:0},{opacity:1}],{duration:367.5,easing:'linear'}),old.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.045)',filter:'brightness(.76)'}],{duration:1050,easing:easing}));
    [1.5,1.65].forEach(function(scale,i){var ghost=next.cloneNode(false);ghost.classList.add('green-zoom-ghost');ghost.removeAttribute('data-slide');ghost.style.zIndex=String(3+i);next.parentElement.appendChild(ghost);animations.push(ghost.animate([{transform:'scale('+scale+')',filter:'blur(14px)',opacity:.12-i*.035},{transform:'scale(1)',filter:'blur(0px)',opacity:0}],{duration:1050,easing:easing,fill:'forwards'}));});
    return animations;
  }
  window.GreenMotion={createGlyph:createGlyph,animateGlyph:animateGlyph,photoTransition:photoTransition};
})();

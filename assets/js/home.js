
(function(){
  "use strict";
  var root   = document.documentElement;
  var toggle = document.getElementById('devtoggle');
  var btns   = toggle.querySelectorAll('button');
  var autoChip = document.getElementById('autochip');
  var autoLabel = document.getElementById('autoLabel');
  var toast  = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var detected = window.__yoriDetected || 'desktop';
  var userOverrode = false;
  var toastTimer;

  function currentView(){ return root.getAttribute('data-view'); }

  function applyView(v, opts){
    opts = opts || {};
    root.setAttribute('data-view', v);
    toggle.setAttribute('data-active', v);
    btns.forEach(function(b){
      var on = b.getAttribute('data-set') === v;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    // show floating return chip only when preview != native device
    if(v !== detected){
      autoChip.classList.add('show');
      autoLabel.textContent = 'auto · ' + (detected === 'mobile' ? 'mobile' : 'PC');
    } else {
      autoChip.classList.remove('show');
    }
    if(opts.toast){
      toastMsg.textContent = (v === 'mobile' ? 'Mobile layout' : 'PC layout') +
        (v === detected ? ' (your device)' : ' preview');
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 1800);
    }
  }

  btns.forEach(function(b){
    b.addEventListener('click', function(){
      userOverrode = true;
      applyView(b.getAttribute('data-set'), {toast:true});
    });
  });
  autoChip.addEventListener('click', function(){
    userOverrode = false;
    applyView(detected, {toast:true});
  });

  // re-detect on resize only if user hasn't manually overridden
  var rT;
  window.addEventListener('resize', function(){
    clearTimeout(rT);
    rT = setTimeout(function(){
      if(userOverrode) return;
      var mq = window.matchMedia('(max-width: 860px)').matches;
      var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      detected = (mq || touch) ? 'mobile' : 'desktop';
      applyView(detected, {});
    }, 150);
  });

  // init (uses synchronous value already set in <head>)
  applyView(currentView(), {});

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mmenu  = document.getElementById('mmenu');
  burger.addEventListener('click', function(){
    var open = mmenu.classList.toggle('open');
    burger.classList.toggle('open', open);
  });
  mmenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      mmenu.classList.remove('open'); burger.classList.remove('open');
    });
  });

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:.14, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ---------- waveform bars ---------- */
  var wave = document.getElementById('wave');
  var bars = 44;
  for(var i=0;i<bars;i++){
    var bar = document.createElement('i');
    bar.style.animationDelay = (Math.random()*-1.1).toFixed(2)+'s';
    bar.style.height = (20 + Math.random()*70).toFixed(0)+'%';
    wave.appendChild(bar);
  }
  var player = document.getElementById('player');
  var playBtn = document.getElementById('playBtn');
  var playIco = document.getElementById('playIco');
  var playing = false;
  playBtn.addEventListener('click', function(){
    playing = !playing;
    player.classList.toggle('playing', playing);
    playIco.innerHTML = playing
      ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
  });

  /* ---------- cursor glow (desktop + fine pointer only) ---------- */
  var cg = document.getElementById('cg');
  var fine = window.matchMedia('(pointer:fine)').matches;
  if(fine){
    var cx=0, cy=0, tx=0, ty=0;
    window.addEventListener('mousemove', function(e){
      tx=e.clientX; ty=e.clientY; cg.style.opacity='1';
    });
    window.addEventListener('mouseleave', function(){ cg.style.opacity='0'; });
    (function loop(){
      cx += (tx-cx)*0.14; cy += (ty-cy)*0.14;
      cg.style.transform = 'translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- ambient starfield / fireflies ---------- */
  var cv = document.getElementById('stars');
  var ctx = cv.getContext('2d');
  var W, H, motes = [];
  function size(){
    W = cv.width = window.innerWidth * devicePixelRatio;
    H = cv.height = window.innerHeight * devicePixelRatio;
    cv.style.width = window.innerWidth+'px';
    cv.style.height = window.innerHeight+'px';
  }
  function build(){
    motes = [];
    var n = Math.min(70, Math.floor(window.innerWidth/22));
    for(var i=0;i<n;i++){
      motes.push({
        x:Math.random()*W, y:Math.random()*H,
        r:(Math.random()*1.6+0.4)*devicePixelRatio,
        vx:(Math.random()-0.5)*0.18*devicePixelRatio,
        vy:(Math.random()-0.5)*0.18*devicePixelRatio,
        a:Math.random()*0.5+0.15,
        tw:Math.random()*Math.PI*2,
        warm:Math.random()>0.45
      });
    }
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<motes.length;i++){
      var m = motes[i];
      m.x+=m.vx; m.y+=m.vy; m.tw+=0.02;
      if(m.x<0)m.x=W; if(m.x>W)m.x=0; if(m.y<0)m.y=H; if(m.y>H)m.y=0;
      var alpha = m.a * (0.6 + 0.4*Math.sin(m.tw));
      ctx.beginPath();
      ctx.arc(m.x,m.y,m.r,0,Math.PI*2);
      ctx.fillStyle = m.warm
        ? 'rgba(240,194,122,'+alpha+')'
        : 'rgba(182,155,255,'+alpha+')';
      ctx.shadowBlur = 8*devicePixelRatio;
      ctx.shadowColor = m.warm ? 'rgba(240,194,122,.6)' : 'rgba(182,155,255,.6)';
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  }
  size(); build(); draw();
  var sT;
  window.addEventListener('resize', function(){
    clearTimeout(sT); sT=setTimeout(function(){ size(); build(); }, 200);
  });
})();

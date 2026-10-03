/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
/* TripCast — 홈 3D 히어로
 * 산악 지형(simplex-noise heightmap) + 경로 드로잉(uProgress 0→1)
 * + 웨이포인트 팝인 + 곡선 카메라 패닝 + 마우스 패럴랙스.
 * three.js를 쓸 수 없는 환경에서는 동일 연출의 2.5D 캔버스로 대체한다. */
(function (global) {
  'use strict';

  /* ── 2D Simplex noise ──────────────────────────────────────────── */
  var GRAD = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

  function buildPerm(seed) {
    var p = new Uint8Array(256), i;
    for (i = 0; i < 256; i++) p[i] = i;
    var s = seed >>> 0;
    for (i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      var j = s % (i + 1);
      var t = p[i]; p[i] = p[j]; p[j] = t;
    }
    var perm = new Uint8Array(512);
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    return perm;
  }

  function makeNoise2D(seed) {
    var perm = buildPerm(seed);
    var F2 = 0.5 * (Math.sqrt(3) - 1);
    var G2 = (3 - Math.sqrt(3)) / 6;

    return function (xin, yin) {
      var s = (xin + yin) * F2;
      var i = Math.floor(xin + s), j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var x0 = xin - (i - t), y0 = yin - (j - t);
      var i1, j1;
      if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
      var x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
      var x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      var ii = i & 255, jj = j & 255;
      var n = 0, g, tt;

      tt = 0.5 - x0 * x0 - y0 * y0;
      if (tt > 0) { g = GRAD[perm[ii + perm[jj]] & 7]; tt *= tt; n += tt * tt * (g[0] * x0 + g[1] * y0); }
      tt = 0.5 - x1 * x1 - y1 * y1;
      if (tt > 0) { g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x1 + g[1] * y1); }
      tt = 0.5 - x2 * x2 - y2 * y2;
      if (tt > 0) { g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x2 + g[1] * y2); }

      return 70 * n;
    };
  }

  var noise2D = makeNoise2D(20260926);

  /* 능선 형태의 fbm — ridged noise로 산맥 실루엣을 만든다. */
  function terrainHeight(x, z) {
    var amp = 1, freq = 0.012, sum = 0, norm = 0;
    for (var o = 0; o < 5; o++) {
      var n = noise2D(x * freq, z * freq);
      n = 1 - Math.abs(n);
      n *= n;
      sum += n * amp;
      norm += amp;
      amp *= 0.48;
      freq *= 2.05;
    }
    var h = (sum / norm) - 0.42;
    /* 화면 중앙(경로가 지나는 골짜기)은 낮게 눌러준다. */
    var valley = Math.exp(-(x * x) / 5200) * 0.42;
    return Math.max(-2, (h - valley) * 96);
  }

  /* 경로가 지나는 5개 지점 — 골짜기를 따라 남쪽에서 북쪽으로. */
  var WAYPOINTS_XZ = [
    [-8, 150], [22, 74], [-16, 6], [26, -66], [-6, -142]
  ];

  /* ── 테마 팔레트 ───────────────────────────────────────────────── */
  /* 색은 CSS 토큰이 단일 출처다. WebGL/Canvas는 CSS를 못 읽으므로
   * mount 시점에 현재 테마의 값을 한 번 꺼내 온다. */
  function readPalette() {
    var cs = global.getComputedStyle(global.document.documentElement);
    function v(name, fallback) {
      var out = cs.getPropertyValue(name);
      out = out ? out.trim() : '';
      return out || fallback;
    }
    return {
      bg:      v('--hero-bg', '#0b0b0b'),
      fog:     v('--hero-fog', '#121212'),
      terrain: v('--hero-terrain', '#1c1c1c'),
      wire:    v('--hero-wire', '#3a3a3a'),
      ridge:   v('--hero-ridge', 'rgba(160,160,160,1)'),
      key:     v('--hero-key', '#dedede'),
      ambient: v('--hero-ambient', '#2a2a2a'),
      route:   v('--hero-route', '#1ed760')
    };
  }

  /* ── three.js 렌더러 ───────────────────────────────────────────── */
  function createWebGLHero(host, opts) {
    var THREE = global.THREE;
    var reduced = opts.reducedMotion;
    var P = opts.palette;
    var width = host.clientWidth || 1440;
    var height = host.clientHeight || 800;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (err) {
      return null;
    }
    if (!renderer || !renderer.getContext || !renderer.getContext()) return null;

    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(new THREE.Color(P.bg), 1);

    var canvas = renderer.domElement;
    canvas.className = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(new THREE.Color(P.fog), 0.0062);

    var camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 900);

    /* 지형 — 데스크톱 대형 화면 기준으로 폴리곤 수를 올린다. */
    var SEG = 260, SIZE = 560;
    var geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    var terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: new THREE.Color(P.terrain), roughness: 0.96, metalness: 0.02, flatShading: false
    }));
    terrain.position.y = -6;
    scene.add(terrain);

    var wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: new THREE.Color(P.wire), wireframe: true, transparent: true, opacity: 0.12
    }));
    wire.position.y = -5.4;
    scene.add(wire);

    scene.add(new THREE.AmbientLight(new THREE.Color(P.ambient), 1.2));
    var key = new THREE.DirectionalLight(new THREE.Color(P.key), 1.35);
    key.position.set(-120, 150, 80);
    scene.add(key);
    var rim = new THREE.DirectionalLight(new THREE.Color(P.wire), 0.5);
    rim.position.set(140, 60, -120);
    scene.add(rim);

    /* 경로 곡선 — 지형 표면 위를 따라간다. */
    var points = WAYPOINTS_XZ.map(function (p) {
      return new THREE.Vector3(p[0], terrainHeight(p[0], p[1]) - 3.2, p[1]);
    });
    var curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);

    var tubeGeo = new THREE.TubeGeometry(curve, 420, 0.75, 10, false);
    var routeUniforms = {
      uProgress: { value: reduced ? 1 : 0 },
      uColor: { value: new THREE.Color(P.route) }
    };
    var routeMat = new THREE.ShaderMaterial({
      uniforms: routeUniforms,
      transparent: true,
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uProgress;',
        'uniform vec3 uColor;',
        'void main() {',
        '  if (vUv.x > uProgress) discard;',
        '  float head = smoothstep(uProgress - 0.05, uProgress, vUv.x);',
        '  vec3 c = mix(uColor, vec3(1.0), head * 0.8);',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'
      ].join('\n')
    });
    scene.add(new THREE.Mesh(tubeGeo, routeMat));

    var glowGeo = new THREE.TubeGeometry(curve, 420, 2.3, 10, false);
    var glowMat = new THREE.ShaderMaterial({
      uniforms: routeUniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uProgress;',
        'uniform vec3 uColor;',
        'void main() {',
        '  if (vUv.x > uProgress) discard;',
        '  gl_FragColor = vec4(uColor, 0.16);',
        '}'
      ].join('\n')
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    /* 웨이포인트 — 팝인(scale 오버슈트)으로 등장 */
    var markerMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(P.route) });
    var haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(P.route), transparent: true, opacity: 0.22,
      side: THREE.DoubleSide, depthWrite: false
    });
    var markers = points.map(function (p) {
      var g = new THREE.Group();
      var pin = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 16), markerMat);
      pin.position.y = 5.5;
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.5, 8), markerMat);
      stem.position.y = 2.75;
      var halo = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.4, 40), haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.35;
      g.add(pin); g.add(stem); g.add(halo);
      g.position.copy(p);
      g.scale.setScalar(reduced ? 1 : 0.001);
      scene.add(g);
      return g;
    });

    /* 카메라 경로 — 곡선 위를 따라가며 패닝 */
    var camCurve = new THREE.CatmullRomCurve3(points.map(function (p, i) {
      return new THREE.Vector3(p.x + (i % 2 ? 34 : -34), p.y + 46, p.z + 26);
    }), false, 'catmullrom', 0.5);

    var parallax = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    var state = { camT: 0 };
    var raf = null, running = false, disposed = false;
    var tmpLook = new THREE.Vector3();

    function placeCamera(t) {
      var p = camCurve.getPointAt(Math.min(0.999, Math.max(0, t)));
      camera.position.set(
        p.x + parallax.x * 12,
        p.y + parallax.y * 7,
        p.z
      );
      var ahead = curve.getPointAt(Math.min(0.999, Math.max(0, t + 0.12)));
      tmpLook.set(ahead.x + parallax.x * 4, ahead.y + 6 - parallax.y * 3, ahead.z);
      camera.lookAt(tmpLook);
    }

    function onPointerMove(e) {
      var r = host.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }

    function resize() {
      if (disposed) return;
      var w = host.clientWidth || 1440, h = host.clientHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (!running) renderer.render(scene, camera);
    }

    function loop() {
      if (disposed) return;
      raf = global.requestAnimationFrame(loop);
      parallax.x += (target.x - parallax.x) * 0.045;
      parallax.y += (target.y - parallax.y) * 0.045;
      state.camT += 0.00042;
      if (state.camT > 0.86) state.camT = 0;
      placeCamera(state.camT);
      renderer.render(scene, camera);
    }

    /* 진입 연출 */
    function start() {
      if (reduced) {
        placeCamera(0.22);
        renderer.render(scene, camera);
        host.classList.add('is-ready');
        return;
      }

      host.addEventListener('pointermove', onPointerMove);
      state.camT = 0;
      placeCamera(0);
      renderer.render(scene, camera);
      host.classList.add('is-ready');
      running = true;
      loop();

      if (global.anime) {
        global.anime({
          targets: routeUniforms.uProgress,
          value: 1,
          duration: 3200,
          easing: 'easeOutExpo'
        });
        markers.forEach(function (m, i) {
          var s = { v: 0.001 };
          global.anime({
            targets: s,
            v: 1,
            duration: 720,
            delay: 700 + i * 520,
            easing: 'easeOutElastic(1, 0.55)',
            update: function () { m.scale.setScalar(s.v); }
          });
        });
      } else {
        routeUniforms.uProgress.value = 1;
        markers.forEach(function (m) { m.scale.setScalar(1); });
      }
    }

    global.addEventListener('resize', resize);

    return {
      start: start,
      destroy: function () {
        disposed = true;
        running = false;
        if (raf) global.cancelAnimationFrame(raf);
        global.removeEventListener('resize', resize);
        host.removeEventListener('pointermove', onPointerMove);
        scene.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
            else o.material.dispose();
          }
        });
        renderer.dispose();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  /* ── 2.5D 캔버스 대체 렌더러 ───────────────────────────────────── */
  function createCanvasHero(host, opts) {
    var reduced = opts.reducedMotion;
    var P = opts.palette;
    var canvas = global.document.createElement('canvas');
    canvas.className = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) { host.removeChild(canvas); return null; }

    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var parallax = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    var progress = reduced ? 1 : 0;
    var popped = WAYPOINTS_XZ.map(function () { return reduced ? 1 : 0; });
    var raf = null, disposed = false, t0 = 0;

    function resize() {
      w = host.clientWidth || 1440;
      h = host.clientHeight || 800;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    /* 간단한 등각 투영 */
    function project(x, y, z) {
      var cz = z + 240;
      var scale = 560 / Math.max(40, cz);
      return {
        x: w / 2 + (x + parallax.x * 26) * scale,
        y: h * 0.62 - (y + 40 + parallax.y * 14) * scale * 0.9,
        s: scale
      };
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, w, h);

      /* 능선 라인 — 뒤에서 앞으로 */
      for (var z = 180; z >= -180; z -= 9) {
        ctx.beginPath();
        var started = false;
        for (var x = -260; x <= 260; x += 6) {
          var p = project(x, terrainHeight(x, z), z);
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        }
        var fade = 1 - Math.abs(z) / 260;
        ctx.globalAlpha = 0.05 + fade * 0.16;
        ctx.strokeStyle = P.ridge;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      /* 경로 */
      var pts = [];
      for (var i = 0; i <= 160; i++) {
        var t = i / 160;
        var idx = t * (WAYPOINTS_XZ.length - 1);
        var a = WAYPOINTS_XZ[Math.floor(idx)];
        var b = WAYPOINTS_XZ[Math.min(WAYPOINTS_XZ.length - 1, Math.floor(idx) + 1)];
        var f = idx - Math.floor(idx);
        var px = a[0] + (b[0] - a[0]) * f;
        var pz = a[1] + (b[1] - a[1]) * f;
        pts.push(project(px, terrainHeight(px, pz) + 3, pz));
      }
      var drawn = Math.max(1, Math.floor(pts.length * progress));
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < drawn; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.strokeStyle = P.route;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = P.route;
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* 웨이포인트 */
      WAYPOINTS_XZ.forEach(function (wp, wi) {
        var s = popped[wi];
        if (s <= 0.01) return;
        var p = project(wp[0], terrainHeight(wp[0], wp[1]) + 8, wp[1]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * s * p.s * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = P.route;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13 * s * p.s * 1.1, 0, Math.PI * 2);
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = P.route;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }

    function onPointerMove(e) {
      var r = host.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }

    function loop(ts) {
      if (disposed) return;
      if (!t0) t0 = ts;
      var elapsed = ts - t0;
      raf = global.requestAnimationFrame(loop);
      parallax.x += (target.x - parallax.x) * 0.05;
      parallax.y += (target.y - parallax.y) * 0.05;
      progress = Math.min(1, elapsed / 3000);
      popped = popped.map(function (v, i) {
        var startAt = 700 + i * 520;
        if (elapsed < startAt) return 0;
        var p = Math.min(1, (elapsed - startAt) / 620);
        return 1 + Math.sin(p * Math.PI) * 0.25 * (1 - p) - (1 - p) * 0.9;
      });
      draw();
    }

    global.addEventListener('resize', resize);

    return {
      start: function () {
        resize();
        host.classList.add('is-ready');
        if (reduced) { draw(); return; }
        host.addEventListener('pointermove', onPointerMove);
        raf = global.requestAnimationFrame(loop);
      },
      destroy: function () {
        disposed = true;
        if (raf) global.cancelAnimationFrame(raf);
        global.removeEventListener('resize', resize);
        host.removeEventListener('pointermove', onPointerMove);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  /* ── 공개 API ──────────────────────────────────────────────────── */
  var current = null;

  function mount(host) {
    unmount();
    if (!host) return;
    var reducedMotion = global.matchMedia &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var opts = { reducedMotion: !!reducedMotion, palette: readPalette() };

    /* 정적 블러 이미지를 먼저 보여주고, Canvas는 지연 로드 후 페이드 전환 */
    var boot = function () {
      if (!host.isConnected) return;
      var hero = null;
      if (global.THREE) {
        try { hero = createWebGLHero(host, opts); } catch (err) { hero = null; }
      }
      if (!hero) hero = createCanvasHero(host, opts);
      if (!hero) { host.classList.add('is-ready'); return; }
      current = hero;
      hero.start();
    };

    if (opts.reducedMotion) boot();
    else if (global.requestIdleCallback) global.requestIdleCallback(boot, { timeout: 600 });
    else global.setTimeout(boot, 120);
  }

  function unmount() {
    if (current) {
      try { current.destroy(); } catch (err) { /* 이미 정리됨 */ }
      current = null;
    }
  }

  global.TripCastHero = { mount: mount, unmount: unmount, terrainHeight: terrainHeight };
})(window);

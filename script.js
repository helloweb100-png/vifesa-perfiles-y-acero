/* =========================================================
   VIFESA Perfiles y Acero · script.js
   Vanilla JS, sin librerías. Un solo motor de scroll (rAF).
   ========================================================= */

// Número de WhatsApp (formato internacional sin "+"). Si queda vacío se ocultan
// los botones de WhatsApp y el envío del formulario.
const WHATSAPP = "528445018634";

window.__vf = true;

(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = window.matchMedia && matchMedia("(pointer:fine)").matches;
  const waUrl = (msg) => "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
  let vw = innerWidth, vh = innerHeight;

  /* ---------- 1 · WhatsApp ---------- */
  if (!WHATSAPP) {
    root.classList.add("wa-off");
  } else {
    $$("[data-wa]").forEach((a) => {
      a.href = waUrl(a.dataset.wa);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  }

  /* ---------- 2 · Rack 3D (hero y cotizador) ---------- */
  $$("[data-rack]").forEach((rack) => {
    const t = $(".rack-t", rack);
    if (!t) return;
    let h = "";
    for (let k = 0; k < 4; k++) {
      h += '<div class="tubo-w" style="--k:' + k + '"><div class="tubo" style="--k:' + k + ";--dir:" + (k % 2 ? "reverse" : "normal") + '"><i></i><i></i><i></i><i></i></div></div>';
    }
    t.innerHTML = h;
  });

  /* ---------- 3 · Reveal a prueba de fallos ---------- */
  const revEls = $$(".rv, .dl-f");
  revEls.forEach((el) => {
    const sib = Array.from(el.parentElement.children).filter((c) => c.classList.contains("rv"));
    const idx = Math.max(0, sib.indexOf(el));
    el.style.setProperty("--rd", (idx % 5) * 0.08 + "s");
  });
  const show = (el) => el.classList.add("in");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revEls.forEach((el) => io.observe(el));
  }
  function geoReveal() {
    revEls.forEach((el) => {
      if (el.classList.contains("in")) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.96) show(el);
    });
  }
  let geoQ = false;
  function qGeo() { if (geoQ) return; geoQ = true; requestAnimationFrame(() => { geoQ = false; geoReveal(); }); }
  addEventListener("scroll", qGeo, { passive: true });
  addEventListener("resize", qGeo);
  setTimeout(geoReveal, 2000);
  setTimeout(geoReveal, 4500);
  if (RM) revEls.forEach(show);

  /* ---------- 4 · Header, menú, riel, progreso ---------- */
  const hdr = $("#hdr"), burger = $("#burger"), menu = $("#menu"), prog = $("#prog");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.classList.toggle("lock", open);
  }
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  const secs = $$("[data-rail]");
  const rail = $("#rail");
  secs.forEach((s) => {
    const a = document.createElement("a");
    a.href = "#" + s.id;
    a.dataset.t = s.dataset.rail;
    a.setAttribute("aria-label", "Ir a " + s.dataset.rail);
    rail.appendChild(a);
  });
  const railA = $$("a", rail);
  const navA = $$(".hdr-nav a");

  /* ---------- 5 · Chispas de soldadura (canvas) ---------- */
  const hero = $("#inicio"), cv = $("#chispas");
  const ctx = cv.getContext("2d");
  let cw = 0, ch = 0, dpr = 1, heroVis = true;
  const parts = [], motes = [];
  const MAXP = vw < 700 ? 45 : 90;
  let emX = 0, emY = 0, ptr = null, nextBurst = 0, lastTorch = 0;
  function sizeCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cw = hero.clientWidth; ch = hero.clientHeight;
    cv.width = cw * dpr; cv.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!ptr) { emX = cw * (cw < 900 ? 0.74 : 0.72); emY = ch * (cw < 900 ? 0.8 : 0.6); }
    const nm = cw < 700 ? 14 : 30;
    while (motes.length < nm) motes.push({ x: Math.random() * cw, y: Math.random() * ch, v: 0.15 + Math.random() * 0.4, r: 0.8 + Math.random() * 1.6, a: Math.random() });
    motes.length = nm;
  }
  function burst(n, x, y, spread) {
    for (let i = 0; i < n && parts.length < MAXP; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * (spread || 2.4);
      const s = 1.6 + Math.random() * 4.6;
      const life = 60 + Math.random() * 60;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life });
    }
  }
  function drawSparks(now) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      m.y -= m.v; m.a += 0.01;
      if (m.y < -4) { m.y = ch + 4; m.x = Math.random() * cw; }
      ctx.fillStyle = "rgba(85,104,255," + (0.25 + 0.25 * Math.sin(m.a * 3)).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill();
    }
    ctx.lineCap = "round";
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += 0.06; p.vx *= 0.995; p.vy *= 0.995;
      const ox = p.x, oy = p.y;
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const r = p.life / p.max;
      ctx.strokeStyle = r > 0.66 ? "#FFD08A" : r > 0.33 ? "#FF7A1A" : "#8A2A00";
      ctx.globalAlpha = clamp(r * 1.4);
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(ox - p.vx * 1.6, oy - p.vy * 1.6); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (now && now > nextBurst) {
      burst(14 + Math.floor(Math.random() * 13), emX, emY);
      nextBurst = now + 1200 + Math.random() * 1200;
    }
  }
  function sparkLoop(now) {
    if (heroVis && !document.hidden) drawSparks(now);
    requestAnimationFrame(sparkLoop);
  }
  sizeCanvas();
  if (RM) {
    burst(40, emX, emY, 3);
    for (let i = 0; i < 18; i++) {
      parts.forEach((p) => { p.vy += 0.06; p.x += p.vx; p.y += p.vy; });
    }
    drawSparks(0);
  } else {
    requestAnimationFrame(sparkLoop);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => { heroVis = es[0].isIntersecting; }).observe(hero);
  }
  if (FINE) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
      emX = ptr.x; emY = ptr.y;
      const t = performance.now();
      if (!RM && t - lastTorch > 60) { burst(3, emX, emY, 1.6); lastTorch = t; }
      const nx = (e.clientX / vw - 0.5) * 2, ny = (e.clientY / vh - 0.5) * 2;
      tgt.my = nx * 8; tgt.mx = -ny * 8;
    });
    hero.addEventListener("pointerleave", () => { ptr = null; tgt.mx = 0; tgt.my = 0; sizeCanvas(); });
  }

  /* ---------- 6 · Manifiesto: palabras ---------- */
  const mT = $("#manifT");
  const words = [];
  (function splitWords() {
    function wrap(node) {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/\s+/).filter(Boolean).forEach((w) => {
            const s = document.createElement("span");
            s.className = "w"; s.textContent = w;
            words.push(s); frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    }
    wrap(mT);
  })();

  /* ---------- 7 · Mediciones cacheadas ---------- */
  const patio = $("#patio"), patioIn = $(".patio-st"), marcoImg = $("#marcoImg"), marcoI = $("img", marcoImg);
  const patioTxt = $("#patioTxt"), wL = $(".patio-wl"), wR = $(".patio-wr");
  $$(".chips li", patioTxt).forEach((li, i) => li.style.setProperty("--n", i));
  const mat = $("#materiales"), matTr = $("#matTr"), matVp = $("#matVp");
  const matBar = $("#matBar"), matCnt = $("#matCnt"), bg1 = $("#bgw1"), bg2 = $("#bgw2");
  const nPan = $$(".pn", matTr).length;
  const cards = $$(".card"), pasos = $("#pasos"), pasoEls = $$(".paso"), wordm = $("#wordm");
  const casaFr = $(".casa-fr");
  let M = { patioTop: 0, patioH: 0, matTop: 0, dist: 0, pin: false, heroH: 1 };
  function measure() {
    vw = innerWidth; vh = innerHeight;
    // pin horizontal
    const wasPin = mat.classList.contains("hz");
    if (!RM) {
      const gut = parseFloat(getComputedStyle(matVp).paddingLeft) || 20;
      mat.classList.add("hz");
      const trW = matTr.getBoundingClientRect().width + gut * 2;
      M.dist = Math.max(0, trW - vw);
      M.pin = M.dist > 40;
      if (M.pin) { mat.style.height = vh + M.dist + "px"; }
      else { mat.classList.remove("hz"); mat.style.height = ""; matTr.style.transform = ""; }
    } else { mat.classList.remove("hz"); mat.style.height = ""; M.pin = false; }
    const sy = scrollY;
    M.patioTop = patio.getBoundingClientRect().top + sy;
    M.patioH = patio.offsetHeight;
    M.matTop = mat.getBoundingClientRect().top + sy;
    M.heroH = hero.offsetHeight || 1;
    if (wasPin !== mat.classList.contains("hz")) qGeo();
    sizeCanvas();
  }

  /* ---------- 8 · Motor de scroll ---------- */
  const S = { hero: 0, manif: 0, patio: 0, mat: 0, beam: 0, foot: 0, mx: 0, my: 0, cardS: [0, 0, 0, 0] };
  const tgt = { mx: 0, my: 0 };
  const hrack = $(".rack-hero");
  let lastY = scrollY, patioOn = false, stepLit = -1;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (k, key, t, f) => { S[key] += (t - S[key]) * (f || 0.09); if (Math.abs(t - S[key]) < 0.0004) S[key] = t; return S[key]; };

  function frame() {
    const y = scrollY;

    // header
    hdr.classList.toggle("sc", y > 40);
    if (menu.classList.contains("open")) hdr.classList.remove("hide");
    else if (y > lastY + 4 && y > 400) hdr.classList.add("hide");
    else if (y < lastY - 4) hdr.classList.remove("hide");
    lastY = y;

    // progreso de lectura
    const doc = document.documentElement.scrollHeight - vh;
    prog.style.transform = "scaleX(" + (doc > 0 ? clamp(y / doc) : 0).toFixed(4) + ")";

    // scroll-spy
    let act = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.4) act = i; });
    railA.forEach((a, i) => a.classList.toggle("on", i === act));
    navA.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + secs[act].id));

    // FAB
    $("#waFab").classList.toggle("show", y > M.heroH * 0.8);

    // HERO
    if (y < M.heroH * 1.3) {
      const hp = lerp(0, "hero", clamp(y / M.heroH), 0.1);
      hero.style.setProperty("--p", hp.toFixed(4));
      const ht = $("#heroTxt");
      ht.style.transform = "translate3d(0," + (-hp * 12).toFixed(2) + "%,0)";
      ht.style.opacity = (1 - clamp((hp - 0.35) / 0.4)).toFixed(3);
    }
    if (FINE && hrack) {
      S.mx += (tgt.mx - S.mx) * 0.07; S.my += (tgt.my - S.my) * 0.07;
      hrack.style.setProperty("--mx", S.mx.toFixed(2) + "deg");
      hrack.style.setProperty("--my", S.my.toFixed(2) + "deg");
    }

    // MANIFIESTO
    if (!RM) {
      const r = mT.getBoundingClientRect();
      const t = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.4));
      const p = lerp(0, "manif", t, 0.1);
      const n = words.length;
      for (let i = 0; i < n; i++) {
        const o = 0.16 + 0.84 * clamp((p * (n + 8) - i) / 8);
        words[i].style.opacity = o.toFixed(3);
      }
    } else words.forEach((w) => (w.style.opacity = 1));

    // PATIO
    if (!RM) {
      const range = Math.max(1, M.patioH - vh);
      const pp = lerp(0, "patio", clamp((y - M.patioTop) / range), 0.1);
      const e = ease(clamp(pp / 0.7));
      const m = vw < 900 ? 8 : 12;
      marcoImg.style.clipPath = "inset(" + (22 * (1 - e)).toFixed(2) + "% " + (m * (1 - e)).toFixed(2) + "% round " + (36 * (1 - e)).toFixed(1) + "px)";
      marcoI.style.transform = "scale(" + (1.25 - 0.25 * e).toFixed(4) + ")";
      const tw = clamp(pp / 0.3);
      const dx = tw * (vw < 900 ? 60 : 38);
      wL.style.transform = "translate3d(" + (-dx).toFixed(1) + "vw,0,0)";
      wR.style.transform = "translate3d(" + dx.toFixed(1) + "vw,0,0)";
      wL.style.opacity = wR.style.opacity = (1 - tw).toFixed(3);
      const on = pp > 0.5 || y > M.patioTop + range;
      if (on !== patioOn) { patioOn = on; patioTxt.classList.toggle("on", on); }
    } else { patioTxt.classList.add("on"); }

    // MATERIALES (pista horizontal fijada)
    if (M.pin) {
      const mp = lerp(0, "mat", clamp((y - M.matTop) / M.dist), 0.1);
      const x = mp * M.dist;
      matTr.style.transform = "translate3d(" + (-x).toFixed(1) + "px,0,0)";
      bg1.style.transform = "translate3d(" + (-x * 0.25).toFixed(1) + "px,0,0)";
      bg2.style.transform = "translate3d(" + (-x * 0.45).toFixed(1) + "px,0,0)";
      matBar.style.transform = "scaleX(" + (1 / nPan + mp * (1 - 1 / nPan)).toFixed(4) + ")";
      const idx = Math.min(nPan, Math.round(mp * (nPan - 1)) + 1);
      matCnt.textContent = ("0" + idx).slice(-2) + " / 0" + nPan;
    }

    // TARJETAS APILADAS
    if (cards.length && !RM) {
      const rects = cards.map((c) => c.getBoundingClientRect());
      const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hh")) || 72;
      cards.forEach((c, i) => {
        let s = 0;
        for (let j = i + 1; j < cards.length; j++) {
          const topJ = hh + 16 + j * 20;
          s += clamp(1 - (rects[j].top - topJ) / rects[j].height);
        }
        const cur = S.cardS[i] + (s - S.cardS[i]) * 0.2;
        S.cardS[i] = Math.abs(s - cur) < 0.001 ? s : cur;
        c.style.setProperty("--sc", (1 - 0.04 * S.cardS[i]).toFixed(4));
        c.style.setProperty("--o", (0.14 * S.cardS[i]).toFixed(3));
      });
    }

    // VIGA (proceso)
    {
      const r = pasos.getBoundingClientRect();
      const p = lerp(0, "beam", clamp((vh * 0.65 - r.top) / r.height), 0.1);
      pasos.style.setProperty("--vp", p.toFixed(4));
      const tipY = r.top + p * r.height;
      pasoEls.forEach((el) => {
        const er = el.getBoundingClientRect();
        el.classList.toggle("lit", er.top + 20 <= tipY + 4);
      });
    }

    // LA CASA (parallax interno)
    {
      const r = casaFr.getBoundingClientRect();
      if (r.bottom > -100 && r.top < vh + 100) {
        const q = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
        casaFr.style.setProperty("--py", (q * 8).toFixed(2) + "%");
        casaFr.style.setProperty("--sz", "1.12");
      }
    }

    // PIE: wordmark que se rellena
    {
      const r = wordm.getBoundingClientRect();
      const f = lerp(0, "foot", clamp((vh * 0.95 - r.top) / (r.height + vh * 0.25)), 0.08);
      wordm.style.setProperty("--f", f.toFixed(4));
    }

    requestAnimationFrame(frame);
  }

  /* ---------- 9 · Catálogo (terminal) ---------- */
  const CATALOGO = {
    CUADRO: ["CUADRO 1 1/2.18", "CUADRO 1 1/2.20", "CUADRO 1 1/4.18", "CUADRO 1 1/4.20", "CUADRO 1.18", "CUADRO 1.20", "CUADRO 1/2.18", "CUADRO 1/2.20", "CUADRO 2.18", "CUADRO 3/4.18", "CUADRO 3/4.20"],
    REC: ["REC 1x1/2.18", "REC 1x1/2.20", "REC 1 1/4x3/4.18", "REC 1 1/4x3/4.20", "REC 1 3/4x3/4.18", "REC 2 1/2x1 1/4.18", "REC 2 1/2x1 1/4.20"],
    PTR: ["PTR 1.14", "PTR 1.9", "PTR 2.14", "PTR 2 1/2.14", "PTR 3.14", "PTR 3/4.14", "PTR 4.14"],
    PLACA: ["PLACA 3x10.18", "PLACA 3x10.22", "PLACA 4x10.14", "PLACA 4x10.18"]
  };
  const flat = [];
  Object.keys(CATALOGO).forEach((f) => CATALOGO[f].forEach((r) => flat.push({ ref: r, fam: f })));
  const q = $("#q"), lista = $("#lista"), cnt = $("#cnt"), term = $(".term"), cur = $(".cur");
  const tabs = $$(".tab");
  let auto = true, active = 0, results = [], catVis = true;
  const waRef = (ref) => waUrl("Hola VIFESA, quiero cotizar: " + ref);

  function setTab(fam) { tabs.forEach((t) => { const on = t.dataset.q === fam; t.classList.toggle("on", on); t.setAttribute("aria-selected", on); }); }
  function renderList(text) {
    const k = text.trim().toUpperCase();
    results = k ? flat.filter((e) => e.ref.indexOf(k) !== -1) : flat.slice();
    if (active >= results.length) active = 0;
    cnt.textContent = results.length + (results.length === 1 ? " referencia" : " referencias");
    if (!results.length) { lista.innerHTML = '<li class="vacio">Sin coincidencias. Pregúntanos, manejamos más medidas.</li>'; return; }
    lista.innerHTML = results.slice(0, 8).map((e, i) =>
      '<li role="option" data-i="' + i + '" style="--i:' + i + '" class="' + (i === active ? "act" : "") + '" aria-selected="' + (i === active) + '"><span>' + e.ref + "</span>" +
      '<a class="go" data-wa="x" href="' + (WHATSAPP ? waRef(e.ref) : "#contacto") + '" target="_blank" rel="noopener noreferrer">Cotizar esta medida →</a></li>').join("");
  }
  function markActive() {
    $$("li[data-i]", lista).forEach((li) => {
      const on = +li.dataset.i === active;
      li.classList.toggle("act", on); li.setAttribute("aria-selected", on);
    });
  }
  function stopAuto() { auto = false; term.classList.remove("auto"); }
  lista.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li) return;
    stopAuto(); active = +li.dataset.i; markActive();
  });
  lista.addEventListener("mouseover", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li && !auto) { active = +li.dataset.i; markActive(); }
  });
  q.addEventListener("focus", stopAuto);
  term.addEventListener("pointerdown", (e) => { if (e.target !== q) stopAuto(); });
  q.addEventListener("input", () => {
    stopAuto(); active = 0; renderList(q.value);
    if (results[0]) setTab(results[0].fam);
  });
  q.addEventListener("keydown", (e) => {
    const vis = Math.min(8, results.length);
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(1, vis); markActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + vis) % Math.max(1, vis); markActive(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (WHATSAPP && results[active]) window.open(waRef(results[active].ref), "_blank", "noopener");
    }
  });
  tabs.forEach((t) => t.addEventListener("click", () => {
    stopAuto(); active = 0; q.value = t.dataset.q; renderList(q.value); setTab(t.dataset.q);
  }));
  // escritura automática en bucle
  const AUTO_W = ["CUAD", "REC", "PTR", "PLACA"];
  const AUTO_F = ["CUADRO", "REC", "PTR", "PLACA"];
  let wi = 0, ci = 0, dir = 1;
  function autoStep() {
    if (!auto) return;
    let delay = 130;
    if (catVis && !document.hidden) {
      const w = AUTO_W[wi];
      if (dir === 1) {
        ci++; if (ci >= w.length) { dir = -1; delay = 1700; setTab(AUTO_F[wi]); }
      } else {
        ci--; delay = 55;
        if (ci <= 0) { ci = 0; dir = 1; wi = (wi + 1) % AUTO_W.length; delay = 400; }
      }
      const txt = w.slice(0, ci);
      q.value = txt; cur.style.setProperty("--len", txt.length);
      active = 0; renderList(txt);
    }
    setTimeout(autoStep, delay);
  }
  term.classList.add("auto");
  renderList("CUAD");
  if (RM) { auto = false; term.classList.remove("auto"); q.value = "CUADRO"; renderList("CUADRO"); }
  else setTimeout(autoStep, 900);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => { catVis = es[0].isIntersecting; }).observe($("#catalogo"));
  }

  /* ---------- 10 · Cobertura: píldoras ↔ nodos ---------- */
  const nodes = $$(".nd"), pills = $$("#pills button");
  function hl(n, on) {
    nodes.forEach((g) => g.classList.toggle("hl", on && g.dataset.n === n));
    pills.forEach((b) => b.classList.toggle("on", on && b.dataset.n === n));
  }
  pills.forEach((b) => {
    b.addEventListener("mouseenter", () => hl(b.dataset.n, true));
    b.addEventListener("mouseleave", () => hl(b.dataset.n, false));
    b.addEventListener("focus", () => hl(b.dataset.n, true));
    b.addEventListener("blur", () => hl(b.dataset.n, false));
    b.addEventListener("click", () => hl(b.dataset.n, true));
  });
  nodes.forEach((g) => {
    g.addEventListener("mouseenter", () => hl(g.dataset.n, true));
    g.addEventListener("mouseleave", () => hl(g.dataset.n, false));
  });

  /* ---------- 11 · Interacciones de puntero ---------- */
  if (FINE) {
    // inclinación 3D de paneles con brillo
    $$(".pn").forEach((p) => {
      p.addEventListener("pointermove", (e) => {
        const r = p.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y2 = (e.clientY - r.top) / r.height;
        p.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        p.style.setProperty("--my", (y2 * 100).toFixed(1) + "%");
        p.style.transform = "perspective(900px) rotateX(" + ((0.5 - y2) * 12).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 12).toFixed(2) + "deg)";
      });
      p.addEventListener("pointerleave", () => { p.style.transform = ""; });
    });
    // placa del letrero
    const placa = $("#placa"), cf = $(".casa-f");
    cf.addEventListener("pointermove", (e) => {
      const r = placa.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / vw, y2 = (e.clientY - (r.top + r.height / 2)) / vh;
      placa.style.setProperty("--ry", clamp(x * 40 - 6, -16, 12).toFixed(1) + "deg");
      placa.style.setProperty("--rx", clamp(-y2 * 30, -12, 12).toFixed(1) + "deg");
    });
    cf.addEventListener("pointerleave", () => { placa.style.removeProperty("--ry"); placa.style.removeProperty("--rx"); });
    // botones magnéticos
    $$(".mag").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.18, -8, 8);
        const dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.25, -8, 8);
        b.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
    // cursor
    const cu = $("#cursor");
    addEventListener("pointermove", (e) => {
      cu.classList.add("on");
      cu.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
      cu.classList.toggle("big", !!e.target.closest("a,button,summary,.tab,label,.pn,[role=option]"));
    }, { passive: true });
    document.addEventListener("mouseleave", () => cu.classList.remove("on"));
  }

  /* ---------- 12 · Formulario → WhatsApp ---------- */
  const form = $("#form"), fBtn = $("#fBtn"), fNota = $("#fNota");
  if (!WHATSAPP) {
    fBtn.hidden = true;
    fNota.textContent = "El envío por WhatsApp estará disponible pronto.";
  }
  function setErr(id, msg) {
    const el = $("#" + id);
    el.textContent = msg;
    el.parentElement.classList.toggle("bad", !!msg);
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!WHATSAPP) return;
    const nombre = form.nombre.value.trim();
    const zona = form.zona.value;
    let ok = true;
    setErr("eNom", ""); setErr("eZona", "");
    if (nombre.length < 2) { setErr("eNom", "Dinos tu nombre para atenderte."); ok = false; }
    if (!zona) { setErr("eZona", "Elige tu zona de entrega."); ok = false; }
    if (!ok) { (nombre.length < 2 ? form.nombre : form.zona).focus(); return; }
    const mats = $$("input[name=mat]:checked", form).map((i) => i.value).join(", ") || "material por definir";
    const det = form.detalle.value.trim() || "te lo comparto por aquí";
    const msg = "Hola VIFESA, soy " + nombre + ". Quiero cotizar: " + mats + ". Zona de entrega: " + zona + ". Detalle: " + det;
    window.open(waUrl(msg), "_blank", "noopener");
    const span = $("span", fBtn);
    span.textContent = "Abriendo WhatsApp…";
    fNota.textContent = "Si WhatsApp no se abrió, toca el botón verde de la esquina.";
    setTimeout(() => { span.textContent = "Mandar mi pedido por WhatsApp"; }, 4000);
  });
  ["fNom"].forEach((id) => $("#" + id).addEventListener("input", () => setErr("eNom", "")));
  $("#fZona").addEventListener("change", () => setErr("eZona", ""));

  /* ---------- 13 · Etiqueta del botón flotante ---------- */
  const fab = $("#waFab");
  if (!RM && window.matchMedia("(min-width:640px)").matches) {
    setTimeout(() => fab.classList.add("lab-open"), 4000);
    setTimeout(() => fab.classList.remove("lab-open"), 9000);
  }

  /* ---------- 14 · Arranque ---------- */
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 120); });
  addEventListener("load", () => { measure(); setTimeout(measure, 800); setTimeout(measure, 2500); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();
  geoReveal();
  requestAnimationFrame(frame);
})();

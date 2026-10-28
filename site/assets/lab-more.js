// Labs for the maps that had none: titration (chemistry), genetic drift (biology), beam bending
// (mechanical), CI pipeline and bisect (DevOps) and an agent cold-start simulator (Teaching Agents).
(function () {
  const { stage, poe, css, esc, fmt, errPct } = window.DULTA_LAB_KIT;
  const $ = (id) => document.getElementById(id);
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------- Titration: pH from the charge balance ----------
  (function titration() {
    const lab = $("titration"); if (!lab) return;
    const S = stage($("tiCanvas")), acid = $("tiAcid");
    const VA = 25, CA = 0.1, CB = 0.1, KW = 1e-14;
    let curve = null;
    // Solve [H+] + [Na+] = [OH-] + [A-] by bisection on log10[H+].
    function pH(vb) {
      const ka = acid.value === "strong" ? 1e8 : 1.8e-5, vt = (VA + vb) / 1000;
      const ca = CA * VA / 1000 / vt, na = CB * vb / 1000 / vt;
      const f = (h) => h + na - KW / h - ca * ka / (ka + h);
      let lo = -14, hi = 0;
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(10 ** mid) > 0) hi = mid; else lo = mid; }
      return -(lo + hi) / 2;
    }
    function draw(progress = 1) {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const x0 = 50, y0 = 20, w = W - 80, h = H - 60, X = (v) => x0 + v / 50 * w, Y = (p) => y0 + h - p / 14 * h;
      ctx.strokeStyle = css("--line-2"); ctx.strokeRect(x0, y0, w, h);
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      for (let p = 0; p <= 14; p += 2) { ctx.fillText(p, x0 - 22, Y(p) + 4); }
      for (let v = 0; v <= 50; v += 10) ctx.fillText(`${v} mL`, X(v) - 12, y0 + h + 16);
      ctx.fillText("pH", x0 - 30, y0 + 8); ctx.fillText("NaOH added", x0 + w - 70, y0 + h + 32);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = css("--line-2");
      ctx.beginPath(); ctx.moveTo(X(25), y0); ctx.lineTo(X(25), y0 + h); ctx.moveTo(x0, Y(7)); ctx.lineTo(x0 + w, Y(7)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillText("equivalence (25 mL)", X(25) + 4, y0 + 14);
      if (!curve) return;
      const n = Math.max(2, Math.floor(curve.length * progress));
      ctx.strokeStyle = css("--chemistry"); ctx.lineWidth = 2.4; ctx.beginPath();
      curve.slice(0, n).forEach(([v, p], i) => (i ? ctx.lineTo(X(v), Y(p)) : ctx.moveTo(X(v), Y(p)))); ctx.stroke(); ctx.lineWidth = 1;
      if (progress >= 1) {
        const pe = pH(25); ctx.fillStyle = css("--chemistry"); ctx.beginPath(); ctx.arc(X(25), Y(pe), 6, 0, 7); ctx.fill();
        if (acid.value === "weak") { const ph = pH(12.5); ctx.fillStyle = css("--threshold"); ctx.beginPath(); ctx.arc(X(12.5), Y(ph), 5, 0, 7); ctx.fill(); ctx.fillText(`half-equivalence: pH ${fmt(ph, 2)} = pKa`, X(12.5) + 8, Y(ph) + 18); }
      }
    }
    const ctl = poe(lab, {
      guessInput: $("tiGuess"),
      onReset() { curve = null; draw(); },
      run(g) {
        curve = Array.from({ length: 501 }, (_, i) => [i / 10, pH(i / 10)]);
        const pe = pH(25), weak = acid.value === "weak";
        return new Promise((resolve) => {
          const t0 = performance.now(), dur = document.hidden ? 0 : 1200;
          (function frame(t) {
            const p = dur ? Math.min(1, (t - t0) / dur) : 1; draw(p);
            if (p < 1) return requestAnimationFrame(frame);
            resolve({
              out: `<span>pH at equivalence <b>${fmt(pe, 2)}</b></span><span>your prediction <b>${fmt(g, 2)}</b> · off by <b>${fmt(Math.abs(g - pe), 2)}</b> pH units</span><span>start pH ${fmt(pH(0), 2)} · after 26 mL ${fmt(pH(26), 2)}</span>`,
              explain: weak
                ? `At equivalence, all the acetic acid has become acetate. Acetate is a weak base and takes protons from water, so the solution is basic (pH ${fmt(pe, 2)}), not neutral. Halfway there, acid and acetate are equal, so pH = pKa = ${fmt(pH(12.5), 2)}: the buffer zone, where the curve is flattest. That's why phenolphthalein, not methyl orange, is the indicator for this titration.`
                : `A strong acid and a strong base leave only water and Na⁺/Cl⁻, which neither give nor take protons, so the equivalence point is neutral (pH ${fmt(pe, 2)}). Near equivalence the pH jumps by about 6 units within a fraction of a mL, because [H⁺] is a logarithmic scale. Now switch to the weak acid and predict again.`,
            });
          })(t0);
        });
      },
    });
    acid.addEventListener("change", () => { if (ctl.state.committed) ctl.reset(); else draw(); });
    draw(); document.addEventListener("dulta:theme", () => draw());
  })();

  // ---------- Genetic drift: Wright-Fisher populations ----------
  (function drift() {
    const lab = $("drift"); if (!lab) return;
    const S = stage($("drCanvas")), nR = $("drN"), sR = $("drS");
    const POPS = 20, GENS = 100;
    let runs = null;
    const N = () => Math.round(10 * Math.pow(100, nR.value / 100)), sel = () => sR.value / 1000;
    function label() { $("drNv").textContent = N(); $("drSv").textContent = fmt(sel(), 3); $("drQ").textContent = `${POPS} populations of ${N()} plants start with the allele at 50%. After ${GENS} generations, in how many will it be fixed (100%) or lost (0%)?`; }
    function simulate() {
      const r = rng(N() * 31 + sR.value * 7), n2 = 2 * N(), s = sel();
      return Array.from({ length: POPS }, () => {
        let p = 0.5; const path = [p];
        for (let g = 0; g < GENS; g++) {
          const pp = p * (1 + s) / (1 + s * p); let k = 0;
          if (p > 0 && p < 1) for (let i = 0; i < n2; i++) if (r() < pp) k++;
          p = p > 0 && p < 1 ? k / n2 : p; path.push(p);
        }
        return path;
      });
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const x0 = 46, y0 = 20, w = W - 70, h = H - 56;
      ctx.strokeStyle = css("--line-2"); ctx.strokeRect(x0, y0, w, h);
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      ["100%", "50%", "0%"].forEach((t, i) => ctx.fillText(t, 4, y0 + i * h / 2 + 4));
      ctx.fillText("generation →", x0 + w - 90, y0 + h + 18); ctx.fillText(`0`, x0, y0 + h + 18); ctx.fillText(`${GENS}`, x0 + w - 18, y0 + h + 18);
      if (!runs) { ctx.fillText("Trajectories appear after you predict.", x0 + 20, y0 + 30); return; }
      runs.forEach((path, i) => {
        const end = path[path.length - 1];
        ctx.strokeStyle = end === 1 ? css("--biology") : end === 0 ? css("--misconception") : css("--ink");
        ctx.globalAlpha = end === 0 || end === 1 ? 0.9 : 0.45; ctx.lineWidth = 1.4; ctx.beginPath();
        path.forEach((p, g) => { const X = x0 + g / GENS * w, Y = y0 + (1 - p) * h; g ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
    const ctl = poe(lab, {
      guessInput: $("drGuess"),
      onReset() { runs = null; label(); draw(); },
      run(g) {
        runs = simulate(); draw();
        const fixed = runs.filter((p) => p[GENS] === 1).length, lost = runs.filter((p) => p[GENS] === 0).length, done = fixed + lost;
        return {
          out: `<span>fixed <b>${fixed}</b> · lost <b>${lost}</b> · still segregating ${POPS - done}</span><span>your prediction <b>${Math.round(g)}</b> of ${POPS}</span><span>N = ${N()}, selection s = ${fmt(sel(), 3)}, Ns = ${fmt(N() * sel(), 1)}</span>`,
          explain: `Each generation is a random sample of 2N gene copies from the last one, so allele frequencies wander even with no selection at all. The smaller the population, the bigger each random step: with N = ${N()}, ${done} of ${POPS} populations hit 0% or 100% and stay there. Selection beats drift only when Ns is well above 1${sel() ? ` (here Ns = ${fmt(N() * sel(), 1)})` : ""}. Try N = 10, then N = 1000, then add selection.`,
        };
      },
    });
    [nR, sR].forEach((el) => el.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else { label(); draw(); } }));
    label(); draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Beam bending: same steel, same area, different shape ----------
  (function beam() {
    const lab = $("beam"); if (!lab) return;
    const S = stage($("bmCanvas")), shapeSel = $("bmShape");
    const E = 200000, P = 1000, L = 2000;  // N/mm², N, mm
    const SHAPES = {  // all 2000 mm² of steel
      flat: { name: "flat plank 100 × 20", h: 20, b: 100, I: 100 * 20 ** 3 / 12 },
      edge: { name: "plank on edge 20 × 100", h: 100, b: 20, I: 20 * 100 ** 3 / 12 },
      tube: { name: "square tube 60 × 60, 10 wall", h: 60, b: 60, I: (60 ** 4 - 40 ** 4) / 12 },
      ibeam: { name: "I-beam 100 × 100, 7 flanges and web", h: 100, b: 100, I: (100 * 100 ** 3 - 93 * 86 ** 3) / 12 },
    };
    let shown = false;
    const sh = () => SHAPES[shapeSel.value];
    const defl = (I) => P * L ** 3 / (48 * E * I), stress = (s) => (P * L / 4) * (s.h / 2) / s.I;
    function drawSection(ctx, s, cx, cy, sc) {
      ctx.fillStyle = css("--mechanical");
      const k = shapeSel.value, w = s.b * sc, h = s.h * sc;
      if (k === "tube") { ctx.fillRect(cx - w / 2, cy - h / 2, w, h); ctx.clearRect(cx - 20 * sc, cy - 20 * sc, 40 * sc, 40 * sc); }
      else if (k === "ibeam") { ctx.fillRect(cx - w / 2, cy - h / 2, w, 7 * sc); ctx.fillRect(cx - w / 2, cy + h / 2 - 7 * sc, w, 7 * sc); ctx.fillRect(cx - 3.5 * sc, cy - h / 2, 7 * sc, h); }
      else ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.strokeStyle = css("--threshold"); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cx - w / 2 - 10, cy); ctx.lineTo(cx + w / 2 + 10, cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css("--muted"); ctx.fillText("neutral axis", cx + w / 2 + 14, cy + 4);
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const s = sh(); ctx.font = "11px JetBrains Mono, monospace";
      const d = defl(s.I), scale = shown ? Math.min(90, d * 6) : 0;
      const x0 = 40, x1 = W - 300, yb = 120;
      ctx.strokeStyle = css("--ink"); ctx.lineWidth = 6; ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const t = i / 100, x = x0 + t * (x1 - x0), y = yb + scale * (t <= 0.5 ? (3 * t - 4 * t ** 3) : (3 * (1 - t) - 4 * (1 - t) ** 3)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = css("--muted");
      [[x0, yb + 6], [x1, yb + 6]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 16); ctx.lineTo(x + 10, y + 16); ctx.closePath(); ctx.fill(); });
      const xm = (x0 + x1) / 2; ctx.strokeStyle = css("--misconception"); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xm, yb - 60); ctx.lineTo(xm, yb - 10 + scale); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = css("--misconception"); ctx.fillText("1 kN", xm + 6, yb - 50);
      ctx.fillStyle = css("--muted"); ctx.fillText("2 m span, simply supported, steel" + (shown ? " (deflection exaggerated)" : ""), x0, H - 20);
      drawSection(ctx, s, W - 160, 130, 1.2);
      ctx.fillStyle = css("--ink"); ctx.fillText(s.name, W - 270, 230);
      ctx.fillText(`area 2000 mm² · I = ${Math.round(s.I).toLocaleString()} mm⁴`, W - 270, 250);
      if (shown) { ctx.fillText(`deflection ${fmt(d, 2)} mm · max stress ${fmt(stress(s), 0)} MPa`, W - 270, 270); }
    }
    const ctl = poe(lab, {
      guessInput: $("bmGuess"),
      onReset() { shown = false; draw(); },
      run(g) {
        shown = true; draw();
        const s = sh(), d = defl(s.I), rows = Object.values(SHAPES).map((x) => `${x.name}: ${fmt(defl(x.I), 2)} mm`);
        return {
          out: `<span>midspan deflection <b>${fmt(d, 2)} mm</b> (δ = PL³ / 48EI)</span><span>your prediction <b>${fmt(g, 2)} mm</b> · off by <b>${fmt(errPct(g, d), 0)}%</b></span>${rows.map((r) => `<span>${esc(r)}</span>`).join("")}`,
          explain: `Every shape uses the same 2000 mm² of steel. Bending stiffness depends on the second moment of area, I = Σ y² dA, which counts material by the square of its distance from the neutral axis. A plank on edge is ${fmt(SHAPES.edge.I / SHAPES.flat.I, 0)} times stiffer than the same plank flat, because I grows with depth cubed. The I-beam goes further, putting most of its steel in the flanges where stress is highest. The material near the middle carries almost nothing. Pick another shape and predict again.`,
        };
      },
    });
    shapeSel.addEventListener("change", () => { if (ctl.state.committed) ctl.reset(); else draw(); });
    draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- CI pipeline and git bisect ----------
  (function pipeline() {
    const lab = $("pipeline"); if (!lab) return;
    const S = stage($("piCanvas")), nR = $("piN");
    let bad = 0, tested = new Map(), steps = [], ctl;
    const n = () => Math.pow(2, +nR.value);
    function newHistory() { const r = rng(+nR.value * 97); bad = 1 + Math.floor(r() * (n() - 1)); tested = new Map(); steps = []; label(); }
    function label() { $("piNv").textContent = n(); $("piQ").textContent = `The last green build was ${n()} commits ago; the latest commit fails its tests. In the worst case, how many builds does git bisect need to find the commit that broke it?`; $("piBuilds").textContent = `builds run by you: ${[...tested.keys()].filter((k) => k !== 0 && k !== n()).length}`; }
    const isBad = (c) => c >= bad;
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const N = n(), x0 = 30, w = W - 60, y = 70, cw = w / (N + 1);
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      ctx.fillText("older ←  commits  → newer   (click a commit to run its pipeline)", x0, 30);
      for (let c = 0; c <= N; c++) {
        const x = x0 + c * cw + cw / 2, known = tested.has(c) || c === 0 || c === N, b = c === N || (tested.has(c) && tested.get(c));
        ctx.fillStyle = !known ? css("--line-2") : b ? css("--misconception") : css("--mastered");
        ctx.beginPath(); ctx.arc(x, y, Math.max(2, Math.min(7, cw / 2.5)), 0, 7); ctx.fill();
      }
      ctx.fillStyle = css("--mastered"); ctx.fillText("last green", x0, y + 28); ctx.fillStyle = css("--misconception"); ctx.fillText("HEAD (red)", x0 + w - 70, y + 28);
      // Pipeline stages for the most recent step
      const last = steps[steps.length - 1], stages = ["lint", "build", "unit tests", "integration", "canary deploy"];
      stages.forEach((s, i) => {
        const bx = x0 + i * (w / 5), ok = last ? !(last.bad && i >= 2) && !(last.bad && i > 2) : null;
        ctx.fillStyle = last ? (last.bad && i === 2 ? css("--misconception") : last.bad && i > 2 ? css("--line") : css("--mastered")) : css("--line");
        ctx.globalAlpha = 0.85; ctx.fillRect(bx + 4, 130, w / 5 - 12, 44); ctx.globalAlpha = 1;
        ctx.fillStyle = css("--ink"); ctx.fillText(s, bx + 12, 156);
        if (i < 4) { ctx.strokeStyle = css("--line-2"); ctx.beginPath(); ctx.moveTo(bx + w / 5 - 8, 152); ctx.lineTo(bx + w / 5 + 4, 152); ctx.stroke(); }
      });
      ctx.fillStyle = css("--muted");
      ctx.fillText(last ? `pipeline for commit ${last.c}: ${last.bad ? "unit tests FAILED, later stages skipped" : "all green"}` : "no pipeline run yet", x0, 200);
      steps.slice(-6).forEach((s, i) => ctx.fillText(`${s.who} build ${i + 1 + Math.max(0, steps.length - 6)}: commit ${s.c} → ${s.bad ? "bad" : "good"}`, x0, 228 + i * 16));
    }
    function runAt(c, who) { const b = isBad(c); tested.set(c, b); steps.push({ c, bad: b, who }); label(); draw(); }
    $("piCanvas").addEventListener("click", (e) => {
      const r = e.target.getBoundingClientRect(), N = n(), cw = (S.W - 60) / (N + 1);
      const c = Math.round(((e.clientX - r.left) / r.width * S.W - 30 - cw / 2) / cw);
      if (c > 0 && c < N) runAt(c, "your");
    });
    ctl = poe(lab, {
      guessInput: $("piGuess"),
      onReset() { newHistory(); draw(); },
      run(g) {
        tested = new Map(); steps = [];
        let lo = 0, hi = n();
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; runAt(mid, "bisect"); if (isBad(mid)) hi = mid; else lo = mid; }
        const worst = Math.ceil(Math.log2(n()));
        return {
          out: `<span>bisect found commit <b>${hi}</b> in <b>${steps.length}</b> builds</span><span>worst case for ${n()} commits: log₂ ${n()} = <b>${worst}</b> builds</span><span>your prediction <b>${Math.round(g)}</b></span>`,
          explain: `Bisect is binary search on history. Each build tests the middle commit, and its result throws away half of the suspects, so ${n()} commits need at most ${worst} builds, against up to ${n()} if you tested every commit in turn. It only works if every commit builds and its tests are deterministic. One flaky test sends the search down the wrong half, which is why CI blocks merges on red and teams quarantine flaky tests. Click commits to try bisecting by hand.`,
        };
      },
    });
    nR.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else { newHistory(); draw(); } });
    newHistory(); draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Agent cold-start simulator ----------
  (function coldstart() {
    const lab = $("coldstart"); if (!lab || !window.DULTA_MAPS) return;
    const byKey = Object.fromEntries(window.DULTA_MAPS.nodes.map((x) => [x.key, x]));
    const ITEMS = ["embedded/gpio", "embedded/misc-float", "embedded/timing", "embedded/misc-delay", "embedded/debounce", "embedded/interrupts", "embedded/misc-volatile", "embedded/buses"].map((k) => byKey[k]).filter(Boolean);
    const notes = $("csNotes");
    $("csItems").innerHTML = ITEMS.map((x, i) => `<li><b>${i + 1}.</b> ${esc(x.check)}</li>`).join("");
    const shingles = (t) => { const w = String(t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean); const s = new Set(); for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(" ")); return s; };
    function evaluate(text) {
      const words = text.trim().split(/\s+/).filter(Boolean), long = words.length > 250;
      const edges = long ? words.slice(0, Math.floor(words.length / 4)).concat(words.slice(-Math.floor(words.length / 4))).join(" ") : text;
      const ns = shingles(text);
      return ITEMS.map((x) => {
        const as = shingles(x.answer), leaked = as.size > 0 && [...as].filter((s) => ns.has(s)).length / as.size >= 0.5;
        if (leaked) return { x, status: "leaked" };
        const full = DULTA.grade(x.grade, text).correct;
        if (!full) return { x, status: "fail" };
        if (long && !DULTA.grade(x.grade, edges).correct) return { x, status: "lost" };
        return { x, status: "pass" };
      });
    }
    function count() { const w = notes.value.trim().split(/\s+/).filter(Boolean).length; $("csCount").textContent = `${w} words${w > 250 ? " (over 250: ideas buried in the middle may be missed)" : ""}`; }
    notes.addEventListener("input", count); count();
    const label = { pass: "✓ answered from the notes", fail: "✗ the notes don't cover it", leaked: "⚠ answer key pasted in: void", lost: "✗ lost in the middle of long notes" };
    poe(lab, {
      guessInput: $("csGuess"),
      onReset() { $("csOut").innerHTML = ""; },
      run(g) {
        const res = evaluate(notes.value), pass = res.filter((r) => r.status === "pass").length;
        $("csOut").innerHTML = res.map((r, i) => `<div class="${r.status === "pass" ? "pass" : "fail"}">${i + 1}. ${label[r.status]}</div>`).join("");
        const leaked = res.filter((r) => r.status === "leaked").length, lost = res.filter((r) => r.status === "lost").length;
        return {
          out: `<span>cold-start score <b>${pass}/${ITEMS.length}</b> (baseline with no notes: 0/${ITEMS.length})</span><span>normalised gain <b>${fmt(pass / ITEMS.length, 2)}</b></span><span>your prediction <b>${Math.round(g)}</b> · leaked ${leaked} · lost in the middle ${lost}</span>`,
          explain: `This is a simulation, not a language model. The "fresh agent" can only answer from the key ideas your notes contain, checked with DultA's own grader. It enforces the three rules of the agent-learner protocol. Notes must teach the principle rather than paste the answer key: pasted answers are caught, as by <span class="mono">dulta.py leak</span>, and voided. Long notes get diluted: past 250 words, ideas buried in the middle are missed. And the score that counts comes from a fresh reader, never the tutor who wrote the notes. Revise the notes and run again. A real run uses a fresh subagent and a separate grader.`,
        };
      },
    });
  })();
})();

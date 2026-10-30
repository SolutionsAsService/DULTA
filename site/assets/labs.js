// Labs. Every lab is Predict-Observe-Explain: the run stays locked until a
// prediction is committed, and the explanation until the run has been seen.
(function () {
  const $ = (id) => document.getElementById(id);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const tr = (k, f) => (window.DULTA && DULTA.t ? DULTA.t(k, f) : f);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (x, d = 2) => Number(x).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
  const errPct = (guess, actual) => Math.abs(guess - actual) / Math.abs(actual) * 100;
  const G = 9.81;

  function stage(canvas) {
    const W = +canvas.getAttribute("width"), H = +canvas.getAttribute("height");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
  }

  // Wires the three POE steps of one lab. `run` returns {out, explain} (HTML strings).
  function poe(lab, { guessInput, run, onReset }) {
    const steps = Object.fromEntries([...lab.querySelectorAll(".poe-step")].map((s) => [s.dataset.step, s]));
    const commit = lab.querySelector("[data-commit]");
    const runBtn = lab.querySelector("[data-run]");
    const out = lab.querySelector("[data-out]");
    const explain = lab.querySelector("[data-explain]");
    const state = { committed: false, guess: null };
    function setStep(name) {
      ["predict", "observe", "explain"].forEach((k, i, arr) => {
        const idx = arr.indexOf(name);
        steps[k].classList.toggle("active", k === name);
        steps[k].classList.toggle("done", i < idx);
      });
    }
    function reset() {
      state.committed = false;
      guessInput.readOnly = false; commit.disabled = false; commit.textContent = tr("commit", "Commit prediction");
      if (runBtn) runBtn.disabled = true;
      if (out) out.hidden = true;
      explain.hidden = true;
      setStep("predict");
      onReset && onReset();
    }
    commit.addEventListener("click", () => {
      const v = parseFloat(guessInput.value);
      if (!isFinite(v)) { guessInput.focus(); guessInput.setAttribute("aria-invalid", "true"); return; }
      guessInput.removeAttribute("aria-invalid");
      state.committed = true; state.guess = v;
      guessInput.readOnly = true; commit.disabled = true; commit.textContent = tr("committed", "Prediction committed");
      setStep("observe");
      if (runBtn) { runBtn.disabled = false; runBtn.focus(); } else doRun();
    });
    async function doRun() {
      if (!state.committed) return;
      if (runBtn) runBtn.disabled = true;
      const r = await run(state.guess);
      if (out) { out.innerHTML = r.out; out.hidden = false; }
      explain.innerHTML = r.explain; explain.hidden = false;
      setStep("explain");
      if (runBtn) runBtn.disabled = false;
    }
    if (runBtn) runBtn.addEventListener("click", doRun);
    return { reset, state, doRun };
  }
  window.DULTA_LAB_KIT = { stage, poe, css, esc, fmt, errPct };

  // ---------- Projectile ----------
  (function projectile() {
    const lab = $("projectile"), cv = $("projCanvas"), S = stage(cv);
    const v = $("projV"), a = $("projA"), drag = $("projDrag");
    let last = null, sweep = null, guess = null;
    function sim(speed, angDeg, withDrag) {
      const k = withDrag ? 0.0061 : 0; // ½ρC_dA/m for a baseball, per metre
      const th = angDeg * Math.PI / 180, dt = 0.002;
      let x = 0, y = 0, vx = speed * Math.cos(th), vy = speed * Math.sin(th), t = 0, top = 0;
      const pts = [[0, 0]];
      while (true) {
        const s = Math.hypot(vx, vy);
        vx += -k * s * vx * dt; vy += (-G - k * s * vy) * dt;
        const nx = x + vx * dt, ny = y + vy * dt; t += dt;
        if (ny < 0) { const f = y / (y - ny); x = x + (nx - x) * f; pts.push([x, 0]); break; }
        x = nx; y = ny; top = Math.max(top, y);
        if (pts.length < 4000 && Math.round(t / dt) % 5 === 0) pts.push([x, y]);
      }
      return { pts, range: x, top, t };
    }
    function label() { $("projVv").textContent = `${v.value} m/s`; $("projAv").textContent = `${a.value}°`; }
    function draw(progress = 1) {
      const { ctx, W, H } = S;
      ctx.clearRect(0, 0, W, H);
      const ink = css("--ink"), muted = css("--muted"), line = css("--line-2"), acc = css("--physics"), th = css("--threshold");
      const xmax = Math.max(last ? last.range : 60, guess || 0, 40) * 1.12;
      const ymax = Math.max(last ? last.top : 20, 10) * 1.25;
      const sc = Math.min((W - 60) / xmax, (H - 60) / ymax);
      const ox = 36, oy = H - 34;
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 10, oy); ctx.stroke();
      ctx.fillStyle = muted; ctx.font = "11px JetBrains Mono, monospace";
      const step = xmax > 120 ? 40 : xmax > 60 ? 20 : 10;
      for (let m = 0; m <= xmax; m += step) { const X = ox + m * sc; ctx.fillRect(X, oy, 1, 5); ctx.fillText(`${m} m`, X - 8, oy + 18); }
      if (guess) {
        const X = ox + guess * sc;
        ctx.strokeStyle = th; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X, oy); ctx.lineTo(X, oy - 70); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = th; ctx.fillText("your prediction", X + 5, oy - 60);
      }
      if (last) {
        const n = Math.max(2, Math.floor(last.pts.length * progress));
        ctx.strokeStyle = acc; ctx.lineWidth = 2.2; ctx.beginPath();
        last.pts.slice(0, n).forEach(([x, y], i) => { const X = ox + x * sc, Y = oy - y * sc; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.stroke();
        const [bx, by] = last.pts[n - 1];
        ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(ox + bx * sc, oy - by * sc, 6, 0, 7); ctx.fill();
      }
      if (sweep) {
        const bw = 220, bh = 110, bx0 = W - bw - 16, by0 = 16;
        ctx.fillStyle = css("--card"); ctx.strokeStyle = line; ctx.fillRect(bx0, by0, bw, bh); ctx.strokeRect(bx0, by0, bw, bh);
        const rmax = Math.max(...sweep.map((s) => s[1]));
        ctx.strokeStyle = acc; ctx.lineWidth = 1.6; ctx.beginPath();
        sweep.forEach(([ang, r], i) => { const X = bx0 + 10 + (ang - 5) / 80 * (bw - 20), Y = by0 + bh - 18 - r / rmax * (bh - 36); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.stroke();
        const best = sweep.reduce((p, c) => (c[1] > p[1] ? c : p));
        const X = bx0 + 10 + (best[0] - 5) / 80 * (bw - 20);
        ctx.strokeStyle = th; ctx.beginPath(); ctx.moveTo(X, by0 + 10); ctx.lineTo(X, by0 + bh - 18); ctx.stroke();
        ctx.fillStyle = muted; ctx.fillText(`range vs angle · best ${best[0]}°`, bx0 + 10, by0 + bh - 5);
      }
    }
    const ctl = poe(lab, {
      guessInput: $("projGuess"),
      onReset() { last = null; sweep = null; guess = null; $("projSweep").hidden = true; draw(); },
      run(g) {
        guess = g; sweep = null;
        last = sim(+v.value, +a.value, drag.checked);
        return new Promise((resolve) => {
          const t0 = performance.now(), dur = matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden ? 0 : 1400;
          (function frame(t) {
            const p = dur ? Math.min(1, (t - t0) / dur) : 1;
            draw(p);
            if (p < 1) return requestAnimationFrame(frame);
            const analytic = (+v.value) ** 2 * Math.sin(2 * a.value * Math.PI / 180) / G;
            $("projSweep").hidden = false;
            resolve({
              out: `<span>measured range <b>${fmt(last.range, 1)} m</b></span><span>your prediction <b>${fmt(g, 1)} m</b> · off by <b>${fmt(errPct(g, last.range), 0)}%</b></span><span>flight time ${fmt(last.t)} s · peak ${fmt(last.top, 1)} m</span>`,
              explain: drag.checked
                ? `With drag, the ball lands at ${fmt(last.range, 1)} m, while a vacuum would give v²·sin 2θ / g = ${fmt(analytic, 1)} m. Drag grows with speed squared, so long, high flights lose the most. That pushes the best angle below 45°. Sweep the angles to find it.`
                : `In a vacuum the range is v²·sin 2θ / g = ${fmt(analytic, 1)} m, which matches what you measured. The horizontal and vertical motions are independent, so time in the air depends only on the vertical launch speed. Since sin 2θ peaks at 45°, so does the range, and 30° and 60° land at the same spot. Now turn on drag.`,
            });
          })(t0);
        });
      },
    });
    $("projSweep").addEventListener("click", () => {
      sweep = [];
      for (let ang = 5; ang <= 85; ang++) sweep.push([ang, sim(+v.value, ang, drag.checked).range]);
      draw();
    });
    [v, a, drag].forEach((el) => el.addEventListener("input", () => { label(); if (ctl.state.committed) ctl.reset(); }));
    label(); draw();
    document.addEventListener("dulta:theme", () => draw());
  })();

  // ---------- Pendulum ----------
  (function pendulum() {
    const lab = $("pendulum"), cv = $("pendCanvas"), S = stage(cv);
    const Lr = $("pendL"), Ar = $("pendA"), Mr = $("pendM");
    let anim = null, th = 0, om = 0;
    const L = () => Lr.value / 100, A0 = () => Ar.value * Math.PI / 180, M = () => +Mr.value;
    function label() { $("pendLv").textContent = `${fmt(L())} m`; $("pendAv").textContent = `${Ar.value}°`; $("pendMv").textContent = `${Mr.value} kg`; }
    function deriv(t, w, len) { return [w, -(G / len) * Math.sin(t)]; }
    function rk4(t, w, len, dt) {
      const k1 = deriv(t, w, len), k2 = deriv(t + k1[0] * dt / 2, w + k1[1] * dt / 2, len);
      const k3 = deriv(t + k2[0] * dt / 2, w + k2[1] * dt / 2, len), k4 = deriv(t + k3[0] * dt, w + k3[1] * dt, len);
      return [t + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), w + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    }
    function measurePeriod(len, a0) {
      let t = a0, w = 0, time = 0;
      const dt = 0.0005, crossings = [];
      while (crossings.length < 3 && time < 120) {
        const [nt, nw] = rk4(t, w, len, dt);
        if (t > 0 && nt <= 0) crossings.push(time + dt * t / (t - nt));
        t = nt; w = nw; time += dt;
      }
      return crossings[2] - crossings[1];
    }
    function draw() {
      const { ctx, W, H } = S;
      ctx.clearRect(0, 0, W, H);
      const len = L(), px = W * 0.42, py = 30, sc = (H - 70) / 3;
      const bx = px + Math.sin(th) * len * sc, by = py + Math.cos(th) * len * sc;
      ctx.strokeStyle = css("--line-2"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - 60, py); ctx.lineTo(px + 60, py); ctx.stroke();
      ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + len * sc); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = css("--physics"); ctx.beginPath(); ctx.arc(bx, by, 8 + Math.sqrt(M()) * 2.2, 0, 7); ctx.fill();
      // Energy bars: kinetic and potential, scaled to the total.
      const ke = 0.5 * M() * len * len * om * om, pe = M() * G * len * (1 - Math.cos(th)), tot = ke + pe || 1;
      const bx0 = W - 150, bh = H - 90;
      [["KE", ke, css("--physics")], ["PE", pe, css("--mathematics")]].forEach(([n, e, c], i) => {
        const x = bx0 + i * 56, h = bh * e / tot;
        ctx.fillStyle = css("--line"); ctx.fillRect(x, 30, 36, bh);
        ctx.fillStyle = c; ctx.fillRect(x, 30 + bh - h, 36, h);
        ctx.fillStyle = css("--muted"); ctx.font = "11px JetBrains Mono, monospace"; ctx.fillText(n, x + 8, 30 + bh + 18);
      });
      ctx.fillStyle = css("--muted"); ctx.fillText("energy", bx0 + 20, 20);
    }
    function start() {
      cancelAnimationFrame(anim);
      th = A0(); om = 0;
      let prev = performance.now();
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      (function frame(t) {
        const dtw = Math.min(0.05, (t - prev) / 1000); prev = t;
        for (let i = 0; i < 20; i++) [th, om] = rk4(th, om, L(), dtw / 20);
        draw();
        if (!reduce) anim = requestAnimationFrame(frame);
      })(prev);
    }
    const ctl = poe(lab, {
      guessInput: $("pendGuess"),
      onReset() { cancelAnimationFrame(anim); th = A0(); om = 0; draw(); },
      run(g) {
        start();
        const T = measurePeriod(L(), A0()), T0 = 2 * Math.PI * Math.sqrt(L() / G);
        const big = Ar.value > 25;
        return {
          out: `<span>measured period <b>${fmt(T, 3)} s</b></span><span>your prediction <b>${fmt(g, 2)} s</b> · off by <b>${fmt(errPct(g, T), 0)}%</b></span><span>small-angle 2π√(L/g) = ${fmt(T0, 3)} s · ratio ${fmt(T / T0, 3)}</span>`,
          explain: big
            ? `At ${Ar.value}° the swing takes ${fmt((T / T0 - 1) * 100, 1)}% longer than 2π√(L/g). That formula assumes sin θ ≈ θ, which stops being true at wide angles: the restoring force grows more slowly than the angle, so the swing slows down. The mass still makes no difference.`
            : `The measured period is within ${fmt(Math.abs(T / T0 - 1) * 100, 2)}% of 2π√(L/g). The mass appears in both the force (mg) and the inertia (m), so it cancels. That is why the slider for mass changes nothing. Now try a release angle above 60°.`,
        };
      },
    });
    [Lr, Ar, Mr].forEach((el) => el.addEventListener("input", () => { label(); if (ctl.state.committed) ctl.reset(); else { th = A0(); draw(); } }));
    label(); th = A0(); draw();
    document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Fourier ----------
  (function fourier() {
    const lab = $("fourier"), cv = $("fourCanvas"), S = stage(cv);
    const wave = $("fourWave"), N = $("fourN");
    let committed = false;
    const target = {
      square: (x) => (Math.sin(x) >= 0 ? 1 : -1),
      saw: (x) => { const y = ((x + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return y / Math.PI; },
      tri: (x) => (2 / Math.PI) * Math.asin(Math.sin(x)),
    };
    function partial(type, n, x) {
      let s = 0;
      for (let i = 1; i <= n; i++) {
        if (type === "square") { const k = 2 * i - 1; s += Math.sin(k * x) / k; }
        else if (type === "saw") s += ((i % 2 ? 1 : -1) * Math.sin(i * x)) / i;
        else { const k = 2 * i - 1; s += ((i % 2 ? 1 : -1) * Math.sin(k * x)) / (k * k); }
      }
      return type === "square" ? (4 / Math.PI) * s : type === "saw" ? (2 / Math.PI) * s : (8 / (Math.PI * Math.PI)) * s;
    }
    function overshoot(n) {
      let mx = -Infinity;
      for (let x = 1e-4; x <= Math.PI / 2; x += Math.PI / (n * 400)) mx = Math.max(mx, partial("square", n, x));
      return (mx - 1) / 2 * 100;
    }
    function draw() {
      const { ctx, W, H } = S;
      ctx.clearRect(0, 0, W, H);
      const type = wave.value, n = +N.value;
      $("fourNv").textContent = n;
      const x0 = -Math.PI, x1 = 3 * Math.PI, X = (x) => 20 + (x - x0) / (x1 - x0) * (W - 40), Y = (y) => H / 2 - y * (H * 0.36);
      ctx.strokeStyle = css("--line-2"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(20, H / 2); ctx.lineTo(W - 20, H / 2); ctx.stroke();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i <= 800; i++) { const x = x0 + (x1 - x0) * i / 800, y = target[type](x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = css("--mathematics"); ctx.lineWidth = 2.2; ctx.beginPath();
      for (let i = 0; i <= 1600; i++) { const x = x0 + (x1 - x0) * i / 1600, y = partial(type, n, x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }
      ctx.stroke();
      // Harmonic amplitudes
      const amps = Array.from({ length: Math.min(n, 30) }, (_, i) => (type === "tri" ? 1 / ((2 * i + 1) ** 2) : type === "square" ? 1 / (2 * i + 1) : 1 / (i + 1)));
      const bw = 6, by0 = H - 14;
      amps.forEach((a, i) => { ctx.fillStyle = css("--threshold"); ctx.fillRect(24 + i * (bw + 3), by0 - a * 46, bw, a * 46); });
      ctx.fillStyle = css("--muted"); ctx.font = "11px JetBrains Mono, monospace";
      ctx.fillText(`${n} harmonic${n > 1 ? "s" : ""}`, W - 120, 22);
      if (committed && type === "square") ctx.fillText(`overshoot ${fmt(overshoot(n), 2)}%`, W - 160, 40);
    }
    poe(lab, {
      guessInput: $("fourGuess"),
      onReset() { committed = false; draw(); },
      run(g) {
        committed = true; wave.value = "square"; N.value = 60; draw();
        const o = overshoot(60);
        return {
          out: `<span>measured overshoot at N = 60 <b>${fmt(o, 2)}% of the jump</b></span><span>your prediction <b>${fmt(g, 1)}%</b></span><span>N = 5: ${fmt(overshoot(5), 2)}% · N = 20: ${fmt(overshoot(20), 2)}%</span>`,
          explain: `This is the Gibbs phenomenon. Adding harmonics squeezes the overshoot closer to the jump, but its height settles near 8.95% of the jump instead of going to zero. The series still converges at every point, just not uniformly. The difference between those two kinds of convergence is the threshold. Move the slider and watch the spike narrow without shrinking.`,
        };
      },
    });
    [wave, N].forEach((el) => el.addEventListener("input", draw));
    draw();
    document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Test-first code ----------
  (function code() {
    const katas = [
      {
        id: "sumNested", title: "sumNested: recursion", fn: "sumNested",
        spec: "Return the sum of every number in an array that may contain arrays nested to any depth.",
        starter: "function sumNested(xs) {\n  let total = 0;\n  for (const x of xs) total += x;\n  return total;\n}\n",
        tests: [{ args: [[1, 2, 3]], expect: 6 }, { args: [[1, [2, 3]]], expect: 6 }, { args: [[]], expect: 0 }, { args: [[[[[5]]]]], expect: 5 }],
        hidden: { args: [[-1, [], [-2, [3, [4]]]]], expect: 4, label: "negatives and empty arrays" },
        lesson: "The fix needs a base case (a number) and a recursive case (an array), with the call trusted to sum its own sub-array. That trust is the leap of faith that makes recursion a threshold concept.",
      },
      {
        id: "binarySearch", title: "binarySearch: complexity", fn: "binarySearch",
        spec: "Return the index of target in the sorted array xs, or -1. The spec says O(log n).",
        starter: "function binarySearch(xs, target) {\n  for (let i = 0; i < xs.length; i++) {\n    if (xs[i] === target) return i;\n  }\n  return -1;\n}\n",
        tests: [{ args: [[1, 3, 5, 7], 5], expect: 2 }, { args: [[1, 3, 5, 7], 4], expect: -1 }, { args: [[], 1], expect: -1 }, { args: [[2], 2], expect: 0 }],
        hidden: { special: "bigsearch", label: "1,000,000 items, at most 40 element reads" },
        lesson: "The starter passes every visible test and still breaks the spec: it reads up to a million elements where binary search needs about 20. Tests check the cases someone thought to write, never the ones they missed (Dijkstra).",
      },
      {
        id: "isBalanced", title: "isBalanced: data structures", fn: "isBalanced",
        spec: "Return true if every bracket ( [ { in the string is closed by the matching bracket in the right order.",
        starter: "function isBalanced(s) {\n  let open = 0, close = 0;\n  for (const c of s) {\n    if ('([{'.includes(c)) open++;\n    if (')]}'.includes(c)) close++;\n  }\n  return open === close;\n}\n",
        tests: [{ args: ["()"], expect: true }, { args: ["([]{})"], expect: true }, { args: ["(]"], expect: false }, { args: ["(("], expect: false }, { args: [")("], expect: false }],
        hidden: { args: ["([)]"], expect: false, label: "crossed pairs" },
        lesson: "Counting cannot see order. A stack can: push each opener and pop on each closer, and the popped bracket must match. Picking the right data structure is what turns this problem from hard to easy.",
      },
    ];
    const worker = `self.onmessage = (e) => {
      const { code, fn, tests } = e.data; let f;
      try { f = new Function(code + "\\nreturn " + fn + ";")(); } catch (err) { postMessage({ error: String(err.message || err) }); return; }
      const results = tests.map((t) => {
        try {
          if (t.special === "bigsearch") {
            let reads = 0; const base = Array.from({ length: 1e6 }, (_, i) => i);
            const p = new Proxy(base, { get(o, k) { if (typeof k === "string" && /^\\d+$/.test(k)) reads++; return o[k]; } });
            const r = f(p, 765432);
            return { ok: r === 765432 && reads <= 40, got: "index " + r + ", " + reads + " element reads" };
          }
          const got = f(...JSON.parse(JSON.stringify(t.args)));
          return { ok: JSON.stringify(got) === JSON.stringify(t.expect), got: JSON.stringify(got) };
        } catch (err) { return { ok: false, got: "threw " + (err.message || err) }; }
      });
      postMessage({ results });
    };`;
    const workerUrl = URL.createObjectURL(new Blob([worker], { type: "text/javascript" }));
    const lab = $("code"), sel = $("kata"), ed = $("editor"), out = $("testOut"), runBtn = $("runTests");
    let kata = katas[0], ctl, hiddenShown = false;
    sel.innerHTML = katas.map((k) => `<option value="${k.id}">${k.title}</option>`).join("");

    function execute(tests) {
      return new Promise((resolve) => {
        const w = new Worker(workerUrl);
        const timer = setTimeout(() => { w.terminate(); resolve({ error: "Timed out after 3 s (an infinite loop?)" }); }, 3000);
        w.onmessage = (e) => { clearTimeout(timer); w.terminate(); resolve(e.data); };
        w.postMessage({ code: ed.value, fn: kata.fn, tests });
      });
    }
    function show(res, tests, hiddenRes) {
      if (res.error) { out.innerHTML = `<div class="fail">Error: ${esc(res.error)}</div>`; return 0; }
      const pass = res.results.filter((r) => r.ok).length;
      out.innerHTML = res.results.map((r, i) => `<div class="${r.ok ? "pass" : "fail"}">${r.ok ? "✓" : "✗"} ${kata.fn}(${esc(tests[i].args.map((a) => JSON.stringify(a)).join(", "))}) → ${esc(r.got)}${r.ok ? "" : ", expected " + esc(JSON.stringify(tests[i].expect))}</div>`).join("")
        + `<div><b>${pass}/${tests.length}</b> visible tests pass</div>`
        + (hiddenRes ? `<div class="${hiddenRes.ok ? "pass" : "fail"}">${hiddenRes.ok ? "✓" : "✗"} hidden test: ${esc(kata.hidden.label)} → ${esc(hiddenRes.got)}</div>` : "");
      return pass;
    }
    async function runAll() {
      runBtn.disabled = true;
      const res = await execute(kata.tests);
      let hiddenRes = null;
      const pass = res.error ? 0 : res.results.filter((r) => r.ok).length;
      if (!res.error && pass === kata.tests.length) {
        const h = await execute([kata.hidden]);
        hiddenRes = h.error ? { ok: false, got: h.error } : h.results[0];
        hiddenShown = true;
      }
      show(res, kata.tests, hiddenRes);
      runBtn.disabled = false;
      return { pass, hiddenRes };
    }
    function load(k) {
      kata = k; ed.value = k.starter; hiddenShown = false;
      $("kataSpec").textContent = k.spec;
      $("codeGuess").max = k.tests.length;
      out.innerHTML = k.tests.map((t) => `<div>${k.fn}(${esc(t.args.map((a) => JSON.stringify(a)).join(", "))}) should be ${esc(JSON.stringify(t.expect))}</div>`).join("") + `<div>+ 1 hidden test, revealed when all visible tests pass</div>`;
      if (ctl) ctl.reset();
    }
    ctl = poe(lab, {
      guessInput: $("codeGuess"),
      onReset() { runBtn.disabled = true; },
      async run(g) {
        ed.value = kata.starter;
        const { pass } = await runAll();
        return {
          explain: `You predicted ${g}; the starter passes ${pass} of ${kata.tests.length}. ${esc(kata.lesson)} Now edit the code until every test is green, and see what the hidden test says.`,
        };
      },
    });
    runBtn.addEventListener("click", runAll);
    $("resetCode").addEventListener("click", () => { ed.value = kata.starter; });
    sel.addEventListener("change", () => load(katas.find((k) => k.id === sel.value)));
    ed.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        const s = ed.selectionStart; ed.setRangeText("  ", s, ed.selectionEnd, "end");
      }
    });
    load(katas[0]);
  })();

  // ---------- Complexity ----------
  (function complexity() {
    const lab = $("complexity"), cv = $("cxCanvas"), S = stage(cv), algo = $("cxAlgo");
    const NS = [8, 16, 32, 64, 128, 256, 512, 1024];
    let measured = null;
    function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; }
    const count = {
      linear(n) { const xs = Array.from({ length: n }, (_, i) => i); let c = 0; for (const x of xs) { c++; if (x === -1) break; } return c; },
      binary(n) { let lo = 0, hi = n - 1, c = 0; while (lo <= hi) { const mid = (lo + hi) >> 1; c++; if (mid < n) lo = mid + 1; else hi = mid - 1; } return c; },
      bubble(n) { const xs = Array.from({ length: n }, (_, i) => n - i); let c = 0; for (let i = 0; i < n - 1; i++) { let swapped = false; for (let j = 0; j < n - 1 - i; j++) { c++; if (xs[j] > xs[j + 1]) { [xs[j], xs[j + 1]] = [xs[j + 1], xs[j]]; swapped = true; } } if (!swapped) break; } return c; },
      merge(n) {
        const r = rng(n), xs = Array.from({ length: n }, () => r());
        let c = 0;
        (function sort(a) {
          if (a.length < 2) return a;
          const m = a.length >> 1, L = sort(a.slice(0, m)), R = sort(a.slice(m)), out = [];
          let i = 0, j = 0;
          while (i < L.length && j < R.length) { c++; out.push(L[i] <= R[j] ? L[i++] : R[j++]); }
          return out.concat(L.slice(i), R.slice(j));
        })(xs);
        return c;
      },
    };
    const names = { linear: "O(n)", binary: "O(log n)", bubble: "O(n²)", merge: "O(n log n)" };
    function base() {
      const rows = NS.slice(0, 5).map((n) => [n, count[algo.value](n)]);
      $("cxBase").innerHTML = `<span>Measured so far (comparisons):</span>` + rows.map(([n, c]) => `<span>n = ${n}: <b>${c.toLocaleString()}</b></span>`).join("");
    }
    function draw() {
      const { ctx, W, H } = S;
      ctx.clearRect(0, 0, W, H);
      const pts = (measured || NS.slice(0, 5).map((n) => [n, count[algo.value](n)]));
      const lx = (n) => 50 + (Math.log2(n) - 3) / 7 * (W - 80);
      const ymax = Math.log10(1024 * 1024 / 2);
      const ly = (c) => H - 40 - Math.log10(Math.max(c, 1)) / ymax * (H - 70);
      ctx.strokeStyle = css("--line-2"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(50, 20); ctx.lineTo(50, H - 40); ctx.lineTo(W - 20, H - 40); ctx.stroke();
      ctx.fillStyle = css("--muted"); ctx.font = "11px JetBrains Mono, monospace";
      NS.forEach((n) => ctx.fillText(n, lx(n) - 8, H - 22));
      [1, 10, 100, 1e3, 1e4, 1e5].forEach((c) => ctx.fillText(c >= 1e3 ? c / 1e3 + "k" : c, 8, ly(c) + 4));
      ctx.fillText("n (log scale)", W - 110, H - 6);
      const refs = [["n", (n) => n], ["n log n", (n) => n * Math.log2(n)], ["n²/2", (n) => n * n / 2], ["log n", (n) => Math.log2(n) + 1]];
      ctx.setLineDash([3, 4]);
      refs.forEach(([label, f]) => {
        ctx.strokeStyle = css("--line-2"); ctx.beginPath();
        NS.forEach((n, i) => (i ? ctx.lineTo(lx(n), ly(f(n))) : ctx.moveTo(lx(n), ly(f(n)))));
        ctx.stroke(); ctx.fillText(label, lx(1024) - 50, ly(f(1024)) - 6);
      });
      ctx.setLineDash([]);
      ctx.strokeStyle = css("--developer"); ctx.fillStyle = css("--developer"); ctx.lineWidth = 2.2; ctx.beginPath();
      pts.forEach(([n, c], i) => (i ? ctx.lineTo(lx(n), ly(c)) : ctx.moveTo(lx(n), ly(c))));
      ctx.stroke();
      pts.forEach(([n, c]) => { ctx.beginPath(); ctx.arc(lx(n), ly(c), 4, 0, 7); ctx.fill(); });
    }
    const ctl = poe(lab, {
      guessInput: $("cxGuess"),
      onReset() { measured = null; base(); draw(); },
      run(g) {
        measured = NS.map((n) => [n, count[algo.value](n)]);
        draw();
        const c = measured[measured.length - 1][1], prev = measured[measured.length - 2][1];
        return {
          out: `<span>measured at n = 1024 <b>${c.toLocaleString()}</b> comparisons</span><span>your prediction <b>${Math.round(g).toLocaleString()}</b> · off by <b>${fmt(errPct(g, c), 0)}%</b></span><span>doubling n from 512 to 1024 multiplied comparisons by <b>${fmt(c / prev, 2)}</b></span>`,
          explain: `This is ${names[algo.value]}. Look at what happens each time n doubles. ${algo.value === "bubble" ? "The count roughly quadruples, because every pair gets compared." : algo.value === "binary" ? "The count goes up by just one, because each comparison halves what is left." : algo.value === "merge" ? "The count slightly more than doubles: log n halvings, each with about n comparisons." : "The count doubles, because each item is looked at once."} On a log-log plot the growth class shows up as a slope, and slopes beat constant factors once n gets large.`,
        };
      },
    });
    algo.addEventListener("change", () => { if (ctl.state.committed) ctl.reset(); else { base(); draw(); } });
    base(); draw();
    document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Retrieval & calibration ----------
  (function retrieval() {
    const D = window.DULTA_MAPS;
    const deck = $("deck"), flash = $("flash");
    deck.innerHTML += (D.fields || [null]).map((f) => `<optgroup label="${esc(f || "Maps")}">${D.maps.filter((m) => !f || m.field === f).map((m) => `<option value="${m.id}">${esc(m.title)}</option>`).join("")}</optgroup>`).join("");
    let card = null, conf = null, lastKey = null;
    function pick() {
      const s = DULTA.load();
      const pool = D.nodes.filter((n) => !deck.value || n.map === deck.value);
      const fr = new Set(DULTA.frontier(D, deck.value || null));
      const seen = new Set(s.log.map((l) => l.key));
      const tiers = [
        pool.filter((n) => DULTA.isDue(n.key)),
        pool.filter((n) => fr.has(n.key)),
        pool.filter((n) => n.kind === "misconception" && !s.probed.includes(n.key)),
        pool.filter((n) => !seen.has(n.key)),
        pool,
      ];
      for (const t of tiers) {
        const c = t.filter((n) => n.key !== lastKey);
        if (c.length) return { node: c[Math.floor(Math.random() * c.length)], why: ["review due", "on your frontier", "misconception probe", "new", "practice"][tiers.indexOf(t)] };
      }
    }
    function render() {
      const p = pick(); card = p.node; conf = null; lastKey = card.key;
      flash.innerHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag ${card.kind}">${card.kind}</span><span class="tag concept">${card.map} · ${esc(card.label)}</span><span class="tag concept">${p.why}</span></div>
        <div class="q">${esc(card.check)}</div>
        <label for="rAttempt" style="margin:0">${tr("attempt", "Your attempt")}</label>
        <textarea id="rAttempt" rows="3" placeholder="Answer from memory before revealing."></textarea>
        <div class="conf" id="rConf">${[20, 40, 60, 80, 100].map((c) => `<button type="button" aria-pressed="false" data-c="${c}">${c}%</button>`).join("")}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" id="rReveal" type="button" disabled>${card.grade ? tr("check", "Check my answer") : "Reveal"}</button><button class="btn small ghost" id="rSkip" type="button">Skip</button></div>
        <div id="rAns" hidden><div id="rVerdict"></div><div class="detail" style="position:static;padding:0;box-shadow:none"><div class="answer">${esc(card.answer)}</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px" id="rActions">${card.grade ? "" : `<button class="btn small" id="rRight" type="button">I was right</button><button class="btn small ghost" id="rWrong" type="button">I was wrong</button>`}</div></div>`;
      const gate = () => { $("rReveal").disabled = !($("rAttempt").value.trim() && conf); };
      $("rAttempt").addEventListener("input", gate);
      $("rConf").addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        conf = +b.dataset.c; $("rConf").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b)); gate();
      });
      $("rReveal").onclick = () => {
        $("rAns").hidden = false; $("rReveal").disabled = true; $("rAttempt").readOnly = true;
        $("rConf").querySelectorAll("button").forEach((b) => { b.disabled = true; });
        if (!card.grade) return;
        const g = DULTA.grade(card.grade, $("rAttempt").value, card.check);
        let snap = DULTA.record(card.key, card.kind, g.correct, conf, { auto: true }), correct = g.correct, overridden = false;
        const show = () => {
          $("rVerdict").innerHTML = `<div class="verdict-box ${correct ? "ok" : "no"}" role="status"><b>${correct ? "✓ " + tr("correct", "Correct") : "✗ " + tr("notyet", "Not yet")}</b>
            <span>${correct ? "Recorded as mastered" : esc(g.reason) + ". Recorded for review"}${overridden ? " (your override)" : ""}</span></div>`;
          $("rActions").innerHTML = `<button class="btn small" id="rNext" type="button">Next card</button>
            <button class="btn small ghost" id="rDispute" type="button">${overridden ? "Undo my override" : correct ? "I was actually wrong" : "The grader got this wrong"}</button>`;
          $("rNext").onclick = render;
          $("rDispute").onclick = () => { correct = !correct; overridden = !overridden; snap = DULTA.amend(snap, correct); show(); };
        };
        show();
      };
      $("rSkip").onclick = render;
      if ($("rRight")) $("rRight").onclick = () => { DULTA.record(card.key, card.kind, true, conf); render(); };
      if ($("rWrong")) $("rWrong").onclick = () => { DULTA.record(card.key, card.kind, false, conf); render(); };
    }
    function calib() {
      const log = DULTA.load().log.filter((l) => l.confidence);
      const bins = [20, 40, 60, 80, 100].map((c) => {
        const xs = log.filter((l) => l.confidence === c);
        return { c, n: xs.length, acc: xs.length ? xs.filter((l) => l.correct).length / xs.length * 100 : null };
      });
      $("calib").innerHTML = bins.map((b) => `<div title="${b.c}% confidence: ${b.n} answers">
        <b class="bar" style="height:${b.acc == null ? 0 : Math.max(3, b.acc)}%"></b>
        <i class="ideal" style="bottom:${b.c}%" aria-hidden="true"></i>
        <span>${b.c}%${b.n ? ` · ${b.n}` : ""}</span></div>`).join("");
      const n = log.length;
      if (!n) { $("calibText").innerHTML = "<span>No answers yet. Each one you make here is scored.</span>"; return; }
      const acc = log.filter((l) => l.correct).length / n * 100;
      const meanC = log.reduce((a, l) => a + l.confidence, 0) / n;
      const gap = meanC - acc;
      $("calibText").innerHTML = `<span>answers <b>${n}</b> · accuracy <b>${fmt(acc, 0)}%</b> · mean confidence <b>${fmt(meanC, 0)}%</b></span>
        <span>${Math.abs(gap) < 8 ? "well calibrated" : gap > 0 ? "overconfident" : "underconfident"} by <b>${fmt(Math.abs(gap), 0)}</b> points</span>`;
    }
    const want = new URLSearchParams(location.search).get("deck");
    if (want && D.maps.some((m) => m.id === want)) deck.value = want;
    deck.addEventListener("change", render);
    document.addEventListener("dulta:state", calib);
    render(); calib();
  })();
})();

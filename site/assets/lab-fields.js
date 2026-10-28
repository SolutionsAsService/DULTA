// Labs for the newer fields: overfitting (ML), A* pathfinding (games, robotics), QAM (telecoms),
// qubit gates (quantum) and selective breeding (plant genetics). Same Predict-Observe-Explain kit.
(function () {
  const { stage, poe, css, esc, fmt, errPct } = window.DULTA_LAB_KIT;
  const $ = (id) => document.getElementById(id);
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

  // ---------- Overfitting: polynomial regression with a held-out set ----------
  (function polyfit() {
    const lab = $("polyfit"); if (!lab) return;
    const S = stage($("pfCanvas")), deg = $("pfDeg"), lam = $("pfLam");
    const truth = (x) => Math.sin(2 * Math.PI * x);
    const r = rng(7);
    const train = Array.from({ length: 12 }, (_, i) => { const x = (i + 0.2 + 0.6 * r()) / 12; return [x, truth(x) + 0.25 * gauss(r)]; });
    const val = Array.from({ length: 200 }, () => { const x = r(); return [x, truth(x) + 0.25 * gauss(r)]; });
    let committed = false, curve = null;
    const lambda = () => (+lam.value === 0 ? 0 : Math.pow(10, -8 + lam.value * 0.08));
    function fit(d, l) {
      const n = d + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
      for (const [x, y] of train) {
        const t = 2 * x - 1, phi = Array.from({ length: n }, (_, k) => Math.pow(t, k));
        for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += phi[i] * phi[j]; A[i][n] += phi[i] * y; }
      }
      for (let i = 1; i < n; i++) A[i][i] += l;
      for (let c = 0; c < n; c++) {
        let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
        [A[c], A[p]] = [A[p], A[c]];
        for (let i = 0; i < n; i++) if (i !== c) { const f = A[i][c] / A[c][c]; for (let j = c; j <= n; j++) A[i][j] -= f * A[c][j]; }
      }
      const w = A.map((row, i) => row[n] / row[i]);
      return (x) => { const t = 2 * x - 1; let s = 0, p = 1; for (const wk of w) { s += wk * p; p *= t; } return s; };
    }
    const rmse = (f, pts) => Math.sqrt(mean(pts.map(([x, y]) => (f(x) - y) ** 2)));
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const d = +deg.value, l = lambda(), f = fit(d, l);
      $("pfDegv").textContent = d; $("pfLamv").textContent = l ? l.toExponential(0) : "0";
      const X = (x) => 30 + x * (W - 60), Y = (y) => H / 2 - y * (H / 4.2);
      ctx.strokeStyle = css("--line-2"); ctx.beginPath(); ctx.moveTo(30, H / 2); ctx.lineTo(W - 30, H / 2); ctx.stroke();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = css("--muted"); ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = i / 200; i ? ctx.lineTo(X(x), Y(truth(x))) : ctx.moveTo(X(x), Y(truth(x))); } ctx.stroke(); ctx.setLineDash([]);
      if (committed) { ctx.fillStyle = css("--line-2"); val.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(X(x), Y(y), 2, 0, 7); ctx.fill(); }); }
      ctx.save(); ctx.beginPath(); ctx.rect(0, 10, W, H - 20); ctx.clip();
      ctx.strokeStyle = css("--ml"); ctx.lineWidth = 2.4; ctx.beginPath();
      for (let i = 0; i <= 400; i++) { const x = i / 400; i ? ctx.lineTo(X(x), Y(f(x))) : ctx.moveTo(X(x), Y(f(x))); } ctx.stroke(); ctx.restore(); ctx.lineWidth = 1;
      ctx.fillStyle = css("--ink"); train.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(X(x), Y(y), 5, 0, 7); ctx.fill(); });
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      ctx.fillText(`degree ${d} · train RMSE ${fmt(rmse(f, train), 3)}` + (committed ? ` · validation RMSE ${fmt(rmse(f, val), 3)}` : " · validation hidden until you predict"), 34, 22);
      if (curve) {
        const bw = 230, bh = 120, x0 = W - bw - 14, y0 = H - bh - 14;
        ctx.fillStyle = css("--card"); ctx.strokeStyle = css("--line-2"); ctx.fillRect(x0, y0, bw, bh); ctx.strokeRect(x0, y0, bw, bh);
        const mx = Math.min(1.2, Math.max(...curve.map((c) => c[2])));
        [[1, css("--ink")], [2, css("--ml")]].forEach(([k, col]) => {
          ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
          curve.forEach((c, i) => { const px = x0 + 14 + i / 10 * (bw - 28), py = y0 + bh - 18 - Math.min(c[k], mx) / mx * (bh - 34); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
          ctx.stroke();
        });
        ctx.lineWidth = 1; ctx.fillStyle = css("--muted"); ctx.fillText("error vs degree: train (ink), validation", x0 + 8, y0 + 14);
        ctx.fillText("1", x0 + 12, y0 + bh - 4); ctx.fillText("11", x0 + bw - 24, y0 + bh - 4);
      }
    }
    poe(lab, {
      guessInput: $("pfGuess"),
      onReset() { committed = false; curve = null; draw(); },
      run(g) {
        committed = true;
        curve = Array.from({ length: 11 }, (_, i) => { const f = fit(i + 1, lambda()); return [i + 1, rmse(f, train), rmse(f, val)]; });
        const best = curve.reduce((a, c) => (c[2] < a[2] ? c : a));
        draw();
        return {
          out: `<span>lowest validation error at degree <b>${best[0]}</b> (RMSE ${fmt(best[2], 3)})</span><span>your prediction <b>degree ${g}</b></span><span>degree 11: train ${fmt(curve[10][1], 3)} · validation ${fmt(curve[10][2], 3)}</span>`,
          explain: `Training error falls at every degree: with 11, the curve can pass almost through all 12 points. Validation error is U-shaped instead, lowest around degree ${best[0]}, and much worse at the top end, where the model is fitting the noise. That is overfitting. Move the degree slider to see it, then raise regularisation λ to calm the high-degree wiggles without changing the degree.`,
        };
      },
    });
    [deg, lam].forEach((el) => el.addEventListener("input", draw));
    draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- A* pathfinding ----------
  (function astar() {
    const lab = $("astar"); if (!lab) return;
    const cv = $("asCanvas"), S = stage(cv), GW = 28, GH = 16, start = [3, 8], goal = [22, 8];
    const C = S.W / GW;
    let walls = new Set(), result = null, ctl;
    const key = (x, y) => x + "," + y;
    function defaultWalls() {
      walls = new Set();
      for (let y = 3; y <= 13; y++) walls.add(key(18, y));
      for (let x = 12; x <= 18; x++) { walls.add(key(x, 3)); walls.add(key(x, 13)); }
    }
    const nbrs = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < GW && b < GH && !walls.has(key(a, b)));
    const h = ([x, y]) => Math.abs(x - goal[0]) + Math.abs(y - goal[1]);
    function search(useH) {
      const g = new Map([[key(...start), 0]]), prev = new Map(), closed = new Set(), open = [[useH ? h(start) : 0, 0, start]];
      while (open.length) {
        open.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
        const [, gc, cur] = open.shift(), k = key(...cur);
        if (closed.has(k)) continue;
        closed.add(k);
        if (cur[0] === goal[0] && cur[1] === goal[1]) {
          const path = [cur]; let p = k; while (prev.has(p)) { p = prev.get(p); path.unshift(p.split(",").map(Number)); }
          return { closed, path };
        }
        for (const n of nbrs(cur)) {
          const nk = key(...n), ng = gc + 1;
          if (!g.has(nk) || ng < g.get(nk)) { g.set(nk, ng); prev.set(nk, k); open.push([ng + (useH ? h(n) : 0), ng, n]); }
        }
      }
      return { closed, path: null };
    }
    function greedy() {
      let cur = start; const trail = [cur];
      for (let i = 0; i < 200; i++) {
        if (h(cur) === 0) return { trail, reached: true };
        const best = nbrs(cur).sort((a, b) => h(a) - h(b))[0];
        if (!best || h(best) >= h(cur)) return { trail, reached: false };
        cur = best; trail.push(cur);
      }
      return { trail, reached: false };
    }
    function prompt() {
      const d = search(false);
      $("asQ").textContent = d.path ? `On this map, Dijkstra's algorithm (no heuristic) explores ${d.closed.size} cells before reaching the goal. How many will A* explore?` : "The goal is walled off. Remove a wall so a path exists.";
      return d;
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const acc = css("--gamedev"), ink = css("--ink"), line = css("--line");
      for (let x = 0; x < GW; x++) for (let y = 0; y < GH; y++) {
        const k = key(x, y);
        const fill = walls.has(k) ? [ink, 1] : result && result.astar.closed.has(k) ? [acc, 0.3] : result && result.dijkstra.closed.has(k) ? [css("--muted"), 0.2] : null;
        if (fill) { ctx.fillStyle = fill[0]; ctx.globalAlpha = fill[1]; ctx.fillRect(x * C, y * C, C, C); ctx.globalAlpha = 1; }
        ctx.strokeStyle = line; ctx.strokeRect(x * C, y * C, C, C);
      }
      if (result) {
        if (result.astar.path) { ctx.strokeStyle = acc; ctx.lineWidth = 4; ctx.beginPath(); result.astar.path.forEach(([x, y], i) => (i ? ctx.lineTo(x * C + C / 2, y * C + C / 2) : ctx.moveTo(x * C + C / 2, y * C + C / 2))); ctx.stroke(); ctx.lineWidth = 1; }
        ctx.fillStyle = css("--misconception");
        result.greedy.trail.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * C + C / 2, y * C + C / 2, 3.5, 0, 7); ctx.fill(); });
      }
      [[start, "S", css("--developer")], [goal, "G", css("--threshold")]].forEach(([[x, y], t, col]) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x * C + C / 2, y * C + C / 2, C * 0.38, 0, 7); ctx.fill();
        ctx.fillStyle = "#111"; ctx.font = "bold 12px IBM Plex Sans, sans-serif"; ctx.fillText(t, x * C + C / 2 - 4, y * C + C / 2 + 4);
      });
    }
    let painting = null;
    function cellAt(e) { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * GW), Math.floor((e.clientY - r.top) / r.height * GH)]; }
    function paint(e) {
      const [x, y] = cellAt(e); if (x < 0 || y < 0 || x >= GW || y >= GH) return;
      if ((x === start[0] && y === start[1]) || (x === goal[0] && y === goal[1])) return;
      const k = key(x, y); if (painting === null) painting = !walls.has(k);
      painting ? walls.add(k) : walls.delete(k);
      if (ctl.state.committed) ctl.reset(); else { result = null; prompt(); draw(); }
    }
    cv.addEventListener("pointerdown", (e) => { painting = null; cv.setPointerCapture(e.pointerId); paint(e); });
    cv.addEventListener("pointermove", (e) => { if (e.buttons) paint(e); });
    cv.addEventListener("pointerup", () => { painting = null; });
    ctl = poe(lab, {
      guessInput: $("asGuess"),
      onReset() { result = null; prompt(); draw(); },
      run(g) {
        result = { astar: search(true), dijkstra: search(false), greedy: greedy() };
        draw();
        const a = result.astar, d = result.dijkstra, gr = result.greedy;
        if (!a.path) return { out: "<span>No path exists.</span>", explain: "The goal is walled in. Remove a wall and try again." };
        return {
          out: `<span>A* explored <b>${a.closed.size}</b> cells · path ${a.path.length - 1} steps</span><span>Dijkstra explored <b>${d.closed.size}</b> cells · path ${d.path.length - 1} steps</span><span>your prediction <b>${Math.round(g)}</b> · off by <b>${fmt(errPct(g, a.closed.size), 0)}%</b></span><span>greedy chaser: <b>${gr.reached ? "reached the goal in " + (gr.trail.length - 1) + " steps" : "stuck after " + (gr.trail.length - 1) + " steps"}</b></span>`,
          explain: `Both searches find a ${a.path.length - 1}-step shortest path. A* gets there after exploring ${a.closed.size} cells instead of ${d.closed.size}, because its Manhattan-distance heuristic never overestimates the remaining cost and so steers the search toward the goal. The red dots show the greedy chaser, which always steps toward the goal: ${gr.reached ? "on this map it got lucky" : "it walks into the U and stops, because escaping means moving away from the goal first"}. Paint walls to build your own maze and predict again.`,
        };
      },
    });
    $("asReset").addEventListener("click", () => { defaultWalls(); ctl.reset(); });
    $("asClear").addEventListener("click", () => { walls = new Set(); ctl.reset(); });
    defaultWalls(); prompt(); draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- QAM constellations and noise ----------
  (function qam() {
    const lab = $("qam"); if (!lab) return;
    const S = stage($("qamCanvas")), Msel = $("qamM"), snrR = $("qamSnr");
    let rx = null;
    function constellation(M) {
      const m = Math.sqrt(M), lv = Array.from({ length: m }, (_, i) => 2 * i - (m - 1)), norm = Math.sqrt(2 * (M - 1) / 3);
      return { m, lv, norm, pts: lv.flatMap((a) => lv.map((b) => [a / norm, b / norm])) };
    }
    function simulate() {
      const M = +Msel.value, c = constellation(M), snr = Math.pow(10, snrR.value / 10), sigma = Math.sqrt(1 / (2 * snr)), r = rng(M * 1000 + +snrR.value);
      const N = 3000, pts = []; let err = 0;
      const detect = (v) => Math.max(-(c.m - 1), Math.min(c.m - 1, 2 * Math.round((v * c.norm + (c.m - 1)) / 2) - (c.m - 1)));
      for (let i = 0; i < N; i++) {
        const ai = Math.floor(r() * c.m), bi = Math.floor(r() * c.m), I = c.lv[ai] / c.norm, Q = c.lv[bi] / c.norm;
        const ri = I + sigma * gauss(r), rq = Q + sigma * gauss(r);
        if (detect(ri) !== c.lv[ai] || detect(rq) !== c.lv[bi]) err++;
        if (pts.length < 1500) pts.push([ri, rq]);
      }
      return { pts, ser: err / N, bits: Math.log2(M), cap: Math.log2(1 + snr) };
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const M = +Msel.value, c = constellation(M); $("qamSnrv").textContent = `${snrR.value} dB`;
      const cx = H / 2 + 20, cy = H / 2, sc = H * 0.33;
      ctx.strokeStyle = css("--line-2"); ctx.beginPath(); ctx.moveTo(cx - H / 2 + 10, cy); ctx.lineTo(cx + H / 2 - 10, cy); ctx.moveTo(cx, 10); ctx.lineTo(cx, H - 10); ctx.stroke();
      if (rx) { ctx.fillStyle = css("--telecom"); ctx.globalAlpha = 0.35; rx.pts.forEach(([i, q]) => ctx.fillRect(cx + i * sc - 1, cy - q * sc - 1, 2, 2)); ctx.globalAlpha = 1; }
      ctx.fillStyle = css("--ink"); c.pts.forEach(([i, q]) => { ctx.beginPath(); ctx.arc(cx + i * sc, cy - q * sc, M > 16 ? 3 : 5, 0, 7); ctx.fill(); });
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      ctx.fillText("I", cx + H / 2 - 20, cy - 6); ctx.fillText("Q", cx + 6, 20);
      const tx = H + 70;
      const lines = [`${M}-QAM: ${Math.log2(M)} bits per symbol`, `SNR ${snrR.value} dB = ${fmt(Math.pow(10, snrR.value / 10), 1)}×`, `Shannon limit log₂(1+SNR) = ${fmt(Math.log2(1 + Math.pow(10, snrR.value / 10)), 2)} bit/s/Hz`];
      if (rx) lines.push(`measured symbol error rate ${fmt(rx.ser * 100, 2)}%`, `goodput ≈ ${fmt(rx.bits * (1 - rx.ser), 2)} bits/symbol`);
      else lines.push("noise cloud hidden until you predict");
      lines.forEach((t, i) => ctx.fillText(t, tx, 60 + i * 22));
    }
    const ctl = poe(lab, {
      guessInput: $("qamGuess"),
      onReset() { rx = null; draw(); },
      run(g) {
        rx = simulate(); draw();
        const M = +Msel.value, over = rx.bits > rx.cap;
        return {
          out: `<span>measured symbol error rate <b>${fmt(rx.ser * 100, 2)}%</b></span><span>your prediction <b>${fmt(g, 1)}%</b></span><span>${rx.bits} bits/symbol vs Shannon ${fmt(rx.cap, 2)} bit/s/Hz</span>`,
          explain: `Noise spreads each received symbol into a cloud. Errors happen when a cloud crosses into its neighbour's decision region. ${M}-QAM packs points ${M > 16 ? "tightly, so it needs a high SNR" : "with wide spacing, so it tolerates noise"}. ${over ? "Here it asks for more bits per symbol than Shannon's limit allows at this SNR, so errors cannot be avoided." : "Here it stays under Shannon's limit, so error-correcting codes could clean up the remaining errors."} That trade-off is why Wi-Fi and 5G switch modulation as signal quality changes. Try 64-QAM at 25 dB, then at 10 dB.`,
        };
      },
    });
    [Msel, snrR].forEach((el) => el.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else draw(); }));
    draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Qubit gates and measurement ----------
  (function qubit() {
    const lab = $("qubit"); if (!lab) return;
    const S = stage($("qbCanvas"));
    const r2 = Math.SQRT1_2;
    const GATES = {  // 2x2 complex matrices as [[re, im], ...] row-major
      H: [[r2, 0], [r2, 0], [r2, 0], [-r2, 0]], X: [[0, 0], [1, 0], [1, 0], [0, 0]], Y: [[0, 0], [0, -1], [0, 1], [0, 0]],
      Z: [[1, 0], [0, 0], [0, 0], [-1, 0]], S: [[1, 0], [0, 0], [0, 0], [0, 1]],
    };
    let circuit = ["H", "Z", "H"], shots = null, ctl;
    const mul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c], add = ([a, b], [c, d]) => [a + c, b + d];
    function state() {
      let s = [[1, 0], [0, 0]];
      for (const g of circuit) { const m = GATES[g]; s = [add(mul(m[0], s[0]), mul(m[1], s[1])), add(mul(m[2], s[0]), mul(m[3], s[1]))]; }
      return s;
    }
    const p1 = (s) => s[1][0] ** 2 + s[1][1] ** 2;
    const cfmt = ([a, b]) => { const re = Math.abs(a) < 1e-9 ? 0 : a, im = Math.abs(b) < 1e-9 ? 0 : b; return im ? `${fmt(re, 3)} ${im < 0 ? "−" : "+"} ${fmt(Math.abs(im), 3)}i` : fmt(re, 3); };
    function renderCircuit() {
      $("qbCircuit").innerHTML = `<span class="mono">|0⟩ →</span> ` + (circuit.length ? circuit.map((g, i) => `<button type="button" class="tag concept" data-i="${i}" title="Remove" ${ctl && ctl.state.committed ? "disabled" : ""}>${g}</button>`).join(" ") : `<span class="empty">no gates yet</span>`) + ` <span class="mono">→ measure</span>`;
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      ctx.font = "12px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      const committed = ctl && ctl.state.committed;
      if (!committed) { ctx.fillText("The state stays hidden until you commit a prediction.", 30, 40); renderCircuit(); return; }
      const s = state(), P1 = p1(s);
      // Bloch vector
      const re = s[0][0] * s[1][0] + s[0][1] * s[1][1], im = s[0][0] * s[1][1] - s[0][1] * s[1][0];
      const bx = 2 * re, by = 2 * im, bz = (s[0][0] ** 2 + s[0][1] ** 2) - P1;
      const cx = 150, cy = H / 2, R = 110;
      ctx.strokeStyle = css("--line-2"); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.3, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = css("--muted"); ctx.fillText("|0⟩", cx - 10, cy - R - 8); ctx.fillText("|1⟩", cx - 10, cy + R + 18); ctx.fillText("+x", cx + R + 6, cy + 4);
      ctx.strokeStyle = css("--quantum"); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + bx * R, cy - bz * R + by * R * 0.3); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = css("--quantum"); ctx.beginPath(); ctx.arc(cx + bx * R, cy - bz * R + by * R * 0.3, 6, 0, 7); ctx.fill();
      ctx.fillStyle = css("--muted"); ctx.fillText(`Bloch (x, y, z) = (${fmt(bx, 2)}, ${fmt(by, 2)}, ${fmt(bz, 2)})`, 30, H - 14);
      // Amplitudes and probabilities
      const x0 = 330;
      ctx.fillStyle = css("--ink"); ctx.fillText(`amplitude of |0⟩: ${cfmt(s[0])}`, x0, 50); ctx.fillText(`amplitude of |1⟩: ${cfmt(s[1])}`, x0, 72);
      [[0, 1 - P1], [1, P1]].forEach(([k, p], i) => {
        const y = 110 + i * 50; ctx.fillStyle = css("--line"); ctx.fillRect(x0, y, 360, 22); ctx.fillStyle = css("--quantum"); ctx.fillRect(x0, y, 360 * p, 22);
        ctx.fillStyle = css("--ink"); ctx.fillText(`P(${k}) = ${fmt(p * 100, 1)}%` + (shots ? ` · measured ${fmt(shots[k] / 10, 1)}%` : ""), x0, y - 6);
      });
      if (shots) { ctx.fillStyle = css("--muted"); ctx.fillText(`1000 shots: ${shots[0]} × 0, ${shots[1]} × 1`, x0, 230); }
      renderCircuit();
    }
    $("qbGates").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-g]"); if (!b || ctl.state.committed) return;
      if (b.dataset.g === "clear") circuit = [];
      else if (b.dataset.g === "preset") circuit = b.dataset.preset.split(" ");
      else circuit.push(b.dataset.g);
      draw();
    });
    $("qbCircuit").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b && !ctl.state.committed) { circuit.splice(+b.dataset.i, 1); draw(); } });
    ctl = poe(lab, {
      guessInput: $("qbGuess"),
      onReset() { shots = null; draw(); },
      run(g) {
        const P1 = p1(state()), r = rng(circuit.length * 7919 + circuit.join("").length);
        shots = [0, 0]; for (let i = 0; i < 1000; i++) shots[r() < P1 ? 1 : 0]++;
        draw();
        const hzh = circuit.join(" ") === "H Z H", hh = circuit.join(" ") === "H H";
        return {
          out: `<span>exact P(1) <b>${fmt(P1 * 100, 1)}%</b> · measured ${fmt(shots[1] / 10, 1)}% in 1000 shots</span><span>your prediction <b>${fmt(g, 1)}%</b></span>`,
          explain: hzh
            ? "H puts |0⟩ into an equal superposition. Z flips the sign of the |1⟩ amplitude. The second H then sends the two paths to |0⟩ in with opposite signs, so they cancel, while the paths to |1⟩ add. The result is |1⟩ every time. That is interference, not randomness, and it's the engine behind every quantum algorithm. Now try H H, where the paths to |1⟩ cancel instead."
            : hh ? "The two paths to |1⟩ arrive with opposite signs and cancel, so H H returns |0⟩ with certainty. H is its own inverse." : `Amplitudes, not probabilities, are what the gates transform. Measurement then turns them into frequencies (Born rule: P = |amplitude|²). With 1000 shots, expect about ±${fmt(Math.sqrt(P1 * (1 - P1) / 1000) * 100, 1)} percentage points of scatter.`,
        };
      },
    });
    draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Selective breeding: the breeder's equation ----------
  (function breeding() {
    const lab = $("breeding"); if (!lab) return;
    const S = stage($("brCanvas")), hR = $("brH"), pR = $("brP");
    const N = 600, MU = 50, SD = 10;
    let pop = null, sel = null, kids = null, gens = null, ctl;
    const h2 = () => hR.value / 100, frac = () => pR.value / 100;
    function makePop(seed) {
      const r = rng(seed);
      return Array.from({ length: N }, () => { const G = gauss(r) * SD * Math.sqrt(h2()); return { G, P: MU + G + gauss(r) * SD * Math.sqrt(1 - h2()) }; });
    }
    function select(p) { return [...p].sort((a, b) => b.P - a.P).slice(0, Math.max(2, Math.round(p.length * frac()))); }
    function offspring(parents, seed) {
      const r = rng(seed), seg = SD * Math.sqrt(h2() / 2), env = SD * Math.sqrt(1 - h2());
      return Array.from({ length: N }, () => {
        const a = parents[Math.floor(r() * parents.length)], b = parents[Math.floor(r() * parents.length)];
        const G = (a.G + b.G) / 2 + gauss(r) * seg; return { G, P: MU + G + gauss(r) * env };
      });
    }
    function setup() {
      pop = makePop(Math.round(hR.value * 31 + pR.value)); sel = select(pop); kids = null; gens = null;
      const Sd = mean(sel.map((x) => x.P)) - mean(pop.map((x) => x.P));
      $("brHv").textContent = fmt(h2(), 2); $("brPv").textContent = `${pR.value}%`;
      $("brQ").textContent = `You keep the top ${pR.value}% as parents. They beat the population mean by S = ${fmt(Sd, 2)} units. How much higher will their offspring's mean be?`;
      draw();
      return Sd;
    }
    function hist(ctx, arr, x0, y0, w, h, lo, hi, col, fill) {
      const bins = 40, counts = new Array(bins).fill(0);
      arr.forEach((v) => { const i = Math.floor((v - lo) / (hi - lo) * bins); if (i >= 0 && i < bins) counts[i]++; });
      const mx = 70; ctx.beginPath(); ctx.moveTo(x0, y0 + h);
      counts.forEach((c, i) => { const x = x0 + i * w / bins, y = y0 + h - Math.min(c, mx) / mx * h; ctx.lineTo(x, y); ctx.lineTo(x + w / bins, y); });
      ctx.lineTo(x0 + w, y0 + h); ctx.closePath();
      if (fill) { ctx.fillStyle = col; ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke(); ctx.lineWidth = 1;
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const lo = MU - 40, hi = MU + 50, x0 = 30, w = W - 60, y0 = 30, h = H - 90;
      const X = (v) => x0 + (v - lo) / (hi - lo) * w;
      hist(ctx, pop.map((x) => x.P), x0, y0, w, h, lo, hi, css("--muted"), true);
      hist(ctx, sel.map((x) => x.P), x0, y0, w, h, lo, hi, css("--threshold"), false);
      if (kids) hist(ctx, kids.map((x) => x.P), x0, y0, w, h, lo, hi, css("--plant"), true);
      const line = (v, col, t, dy) => { ctx.strokeStyle = col; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X(v), y0); ctx.lineTo(X(v), y0 + h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col; ctx.fillText(t, X(v) + 4, y0 + 12 + dy); };
      ctx.font = "11px JetBrains Mono, monospace";
      line(mean(pop.map((x) => x.P)), css("--muted"), "population", 0);
      line(mean(sel.map((x) => x.P)), css("--threshold"), "selected parents", 14);
      if (kids) line(mean(kids.map((x) => x.P)), css("--plant"), "offspring", 28);
      ctx.fillStyle = css("--muted");
      for (let v = lo; v <= hi; v += 10) ctx.fillText(v, X(v) - 6, y0 + h + 16);
      ctx.fillText("trait value (e.g. yield)", x0 + w - 150, y0 + h + 34);
      if (gens) {
        const bw = 220, bh = 100, gx = W - bw - 20, gy = 36;
        ctx.fillStyle = css("--card"); ctx.strokeStyle = css("--line-2"); ctx.fillRect(gx, gy, bw, bh); ctx.strokeRect(gx, gy, bw, bh);
        const mx = Math.max(...gens), mn = gens[0];
        ctx.strokeStyle = css("--plant"); ctx.lineWidth = 2; ctx.beginPath();
        gens.forEach((m, i) => { const px = gx + 12 + i / (gens.length - 1) * (bw - 24), py = gy + bh - 16 - (m - mn) / Math.max(1e-9, mx - mn) * (bh - 32); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.stroke(); ctx.lineWidth = 1; ctx.fillStyle = css("--muted"); ctx.fillText(`mean over 10 generations: ${fmt(mn, 1)} → ${fmt(mx, 1)}`, gx + 8, gy + 14);
      }
    }
    ctl = poe(lab, {
      guessInput: $("brGuess"),
      onReset() { setup(); $("brGens").hidden = true; },
      run(g) {
        const Sd = mean(sel.map((x) => x.P)) - mean(pop.map((x) => x.P));
        kids = offspring(sel, 99 + +hR.value); draw();
        const R = mean(kids.map((x) => x.P)) - mean(pop.map((x) => x.P)), pred = h2() * Sd;
        $("brGens").hidden = false;
        return {
          out: `<span>measured response R = <b>${fmt(R, 2)}</b> units</span><span>breeder's equation h²S = ${fmt(h2(), 2)} × ${fmt(Sd, 2)} = <b>${fmt(pred, 2)}</b></span><span>your prediction <b>${fmt(g, 2)}</b> · realised heritability R/S = ${fmt(R / Sd, 2)}</span>`,
          explain: `The parents were ${fmt(Sd, 1)} units above average, but only part of that advantage is genetic. With h² = ${fmt(h2(), 2)}, about ${fmt(h2() * 100, 0)}% of their edge came from genes they can pass on. The rest was good soil, luck, the environment. So the offspring rise by about h² × S = ${fmt(pred, 1)}. Lower h² and the same selection buys much less. Run 10 generations to watch the gains add up.`,
        };
      },
    });
    $("brGens").addEventListener("click", () => {
      let p = pop; gens = [mean(p.map((x) => x.P))];
      for (let i = 0; i < 10; i++) { p = offspring(select(p), 500 + i); gens.push(mean(p.map((x) => x.P))); }
      draw();
    });
    [hR, pR].forEach((el) => el.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else setup(); }));
    setup(); document.addEventListener("dulta:theme", draw);
  })();
})();

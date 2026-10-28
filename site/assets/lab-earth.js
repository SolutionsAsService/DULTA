// Civil, aerospace, environmental and geoscience labs: truss solver, catchment water-flow model,
// glider flight simulator, orbit-transfer optimiser, river water-quality monitor, two-box climate
// model and earthquake location. Same Predict-Observe-Explain kit.
(function () {
  const { stage, poe, css, esc, fmt, errPct } = window.DULTA_LAB_KIT;
  const $ = (id) => document.getElementById(id);
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  function solve(A, b) {  // Gaussian elimination with partial pivoting; A is n×n, b length n
    const n = b.length, M = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
      [M[c], M[p]] = [M[p], M[c]];
      for (let i = 0; i < n; i++) if (i !== c) { const f = M[i][c] / M[c][c]; for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j]; }
    }
    return M.map((row, i) => row[n] / row[i]);
  }
  function animate(draw, resolve, result, ms = 1200) {
    const t0 = performance.now(), dur = document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
    (function frame(t) { const p = dur ? Math.min(1, (t - t0) / dur) : 1; draw(p); if (p < 1) return requestAnimationFrame(frame); resolve(result()); })(t0);
  }

  // ---------- Truss: direct stiffness method ----------
  (function truss() {
    const lab = $("truss"); if (!lab) return;
    const S = stage($("trCanvas")), typeSel = $("trType"), posSel = $("trPos"), loadR = $("trLoad");
    // 8 m span, 2 m panels, 2 m deep. Nodes 0-4 bottom chord, 5-7 top chord.
    const N = [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [2, 2], [4, 2], [6, 2]];
    const base = [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [0, 5], [7, 4], [1, 5], [2, 6], [3, 7]];
    const diag = { pratt: [[5, 2], [7, 2]], howe: [[1, 6], [3, 6]] };
    let forces = null;
    const members = () => base.concat(diag[typeSel.value]);
    function analyse() {
      const M = members(), n = N.length * 2, K = Array.from({ length: n }, () => new Array(n).fill(0)), F = new Array(n).fill(0);
      M.forEach(([a, b]) => {
        const dx = N[b][0] - N[a][0], dy = N[b][1] - N[a][1], L = Math.hypot(dx, dy), c = dx / L, s = dy / L, k = 1 / L;
        const m = [[c * c, c * s], [c * s, s * s]];
        [[a, a, 1], [b, b, 1], [a, b, -1], [b, a, -1]].forEach(([i, j, sg]) => { for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) K[2 * i + r][2 * j + q] += sg * k * m[r][q]; });
      });
      F[2 * +posSel.value + 1] = -+loadR.value;  // kN downward at the chosen bottom node
      const fixed = new Set([0, 1, 9]);  // pin at node 0 (x, y), roller at node 4 (y)
      const free = [...Array(n).keys()].filter((d) => !fixed.has(d));
      const u = new Array(n).fill(0), sol = solve(free.map((i) => free.map((j) => K[i][j])), free.map((i) => F[i]));
      free.forEach((d, i) => { u[d] = sol[i]; });
      return M.map(([a, b]) => {
        const dx = N[b][0] - N[a][0], dy = N[b][1] - N[a][1], L = Math.hypot(dx, dy);
        return { a, b, f: ((u[2 * b] - u[2 * a]) * dx + (u[2 * b + 1] - u[2 * a + 1]) * dy) / (L * L) };  // EA cancels (determinate)
      });
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      $("trLoadv").textContent = `${loadR.value} kN`;
      const X = (x) => 70 + x / 8 * (W - 140), Y = (y) => H - 90 - y / 2 * (H - 190);
      const fmax = forces ? Math.max(...forces.map((m) => Math.abs(m.f))) : 1;
      (forces || members().map(([a, b]) => ({ a, b, f: null }))).forEach((m) => {
        const t = m.f === null ? null : m.f;
        ctx.strokeStyle = t === null ? css("--line-2") : Math.abs(t) < 1e-6 ? css("--muted") : t > 0 ? css("--mathematics") : css("--misconception");
        ctx.lineWidth = t === null ? 3 : 2 + 7 * Math.abs(t) / fmax;
        ctx.beginPath(); ctx.moveTo(X(N[m.a][0]), Y(N[m.a][1])); ctx.lineTo(X(N[m.b][0]), Y(N[m.b][1])); ctx.stroke();
        if (t !== null && Math.abs(t) > 1e-6) {
          ctx.fillStyle = css("--ink"); ctx.font = "11px JetBrains Mono, monospace";
          ctx.fillText(fmt(t, 1), (X(N[m.a][0]) + X(N[m.b][0])) / 2 + 4, (Y(N[m.a][1]) + Y(N[m.b][1])) / 2 - 4);
        }
      });
      ctx.lineWidth = 1;
      N.forEach(([x, y]) => { ctx.fillStyle = css("--ink"); ctx.beginPath(); ctx.arc(X(x), Y(y), 5, 0, 7); ctx.fill(); });
      const sup = (x, roller) => { ctx.fillStyle = css("--muted"); ctx.beginPath(); ctx.moveTo(X(x), Y(0) + 6); ctx.lineTo(X(x) - 12, Y(0) + 26); ctx.lineTo(X(x) + 12, Y(0) + 26); ctx.closePath(); ctx.fill(); if (roller) { ctx.beginPath(); ctx.arc(X(x) - 6, Y(0) + 31, 4, 0, 7); ctx.arc(X(x) + 6, Y(0) + 31, 4, 0, 7); ctx.fill(); } };
      sup(0, false); sup(8, true);
      const lx = X(N[+posSel.value][0]); ctx.strokeStyle = css("--threshold"); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, Y(0) + 70); ctx.lineTo(lx, Y(0) + 12); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = css("--threshold"); ctx.beginPath(); ctx.moveTo(lx, Y(0) + 8); ctx.lineTo(lx - 7, Y(0) + 20); ctx.lineTo(lx + 7, Y(0) + 20); ctx.fill();
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillText(`${loadR.value} kN`, lx + 10, Y(0) + 60);
      ctx.fillStyle = css("--muted"); ctx.fillText(forces ? "blue = tension, red = compression (kN); thickness ∝ force" : "forces appear after you predict", 70, 24);
      ctx.fillText("8 m span · 2 m deep", W - 200, 24);
    }
    const ctl = poe(lab, {
      guessInput: $("trGuess"),
      onReset() { forces = null; draw(); },
      run(g) {
        forces = analyse(); draw();
        const top = forces.find((m) => (m.a === 5 && m.b === 6)), worst = forces.reduce((a, m) => (Math.abs(m.f) > Math.abs(a.f) ? m : a));
        const mag = Math.abs(top.f);
        return {
          out: `<span>top chord beside midspan: <b>${fmt(top.f, 2)} kN</b> (${top.f < 0 ? "compression" : "tension"})</span><span>your prediction <b>${fmt(g, 2)} kN</b> · off by <b>${fmt(errPct(g, mag), 0)}%</b></span><span>most loaded member: ${fmt(worst.f, 2)} kN between nodes ${worst.a} and ${worst.b}</span>`,
          explain: `A truss carries bending as a couple: the top chord is squeezed and the bottom chord stretched, so the two chords resist the bending moment like the flanges of an I-beam. With the load at midspan, the moment there is (load/2) × 4 m, and dividing by the 2 m depth gives the chord force. That's why deeper trusses carry the same load with smaller forces. In a ${typeSel.value === "pratt" ? "Pratt truss the long diagonals are in tension, which suits slender steel" : "Howe truss the diagonals are in compression, which suits timber struts"}. Switch truss types and move the load.`,
        };
      },
    });
    [typeSel, posSel, loadR].forEach((el) => el.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else draw(); }));
    draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Water-flow model: rainfall-runoff with a linear reservoir ----------
  (function runoff() {
    const lab = $("runoff"); if (!lab) return;
    const S = stage($("roCanvas")), impR = $("roImp"), pond = $("roPond");
    const A = 5, RAIN = 30, DUR = 1, F = 20, DT = 1 / 12, T = 12;  // km², mm/h, h, mm/h infiltration, h step, h
    let curves = null;
    function model(imp, withPond) {
      // Nash cascade: two linear reservoirs in series, each with time constant k/2, so smoother
      // (more paved) catchments with smaller k peak both higher and sooner.
      const k = 3 * (1 - 0.7 * imp) / 2, q = [];
      let s1 = 0, s2 = 0, s3 = 0;  // storages in (m³/s)·h
      for (let t = 0; t <= T + 1e-9; t += DT) {
        const i = t < DUR ? RAIN : 0, excess = imp * i * 0.95 + (1 - imp) * Math.max(0, i - F);
        const qin = excess / 1000 * A * 1e6 / 3600;  // m³/s
        s1 += (qin - s1 / k) * DT;
        s2 += (s1 / k - s2 / k) * DT;
        let out = s2 / k;
        if (withPond) { s3 += (out - s3 / 2) * DT; out = s3 / 2; }
        q.push([t, out]);
      }
      return q;
    }
    const peak = (q) => q.reduce((a, p) => (p[1] > a[1] ? p : a));
    function label() { $("roImpv").textContent = `${impR.value}%`; $("roQ").textContent = `With 10% of the 5 km² catchment paved, a 30 mm storm peaks at ${fmt(peak(model(0.1, false))[1], 1)} m³/s. With ${impR.value}% paved${pond.checked ? " and a detention pond" : ""}, what will the peak flow be (m³/s)?`; }
    function draw(p = 1) {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const x0 = 50, y0 = 20, w = W - 80, h = H - 60, base = model(0.1, false), qmax = 1.15 * Math.max(peak(base)[1], peak(model(+impR.value / 100, pond.checked))[1], peak(model(0.9, false))[1] * 0.6);
      const X = (t) => x0 + t / T * w, Y = (q) => y0 + h - q / qmax * h;
      ctx.strokeStyle = css("--line-2"); ctx.strokeRect(x0, y0, w, h);
      ctx.fillStyle = css("--mathematics"); ctx.globalAlpha = 0.18; ctx.fillRect(X(0), y0, X(DUR) - X(0), h); ctx.globalAlpha = 1;
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      ctx.fillText("rain: 30 mm in 1 h", X(0) + 4, y0 + 14);
      for (let t = 0; t <= T; t += 2) ctx.fillText(`${t} h`, X(t) - 8, y0 + h + 16);
      ctx.fillText("flow at the outlet (m³/s)", x0 + 4, y0 + h - 6);
      const line = (q, col, frac) => { ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); q.slice(0, Math.max(2, Math.floor(q.length * frac))).forEach(([t, v], i) => (i ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v)))); ctx.stroke(); ctx.lineWidth = 1; };
      line(base, css("--muted"), 1);
      ctx.fillStyle = css("--muted"); const pb = peak(base); ctx.fillText(`10% paved: ${fmt(pb[1], 1)} m³/s`, X(pb[0]) + 6, Y(pb[1]) - 6);
      if (curves) { line(curves, css("--civil"), p); if (p >= 1) { const pk = peak(curves); ctx.fillStyle = css("--civil"); ctx.beginPath(); ctx.arc(X(pk[0]), Y(pk[1]), 5, 0, 7); ctx.fill(); ctx.fillText(`${impR.value}% paved${pond.checked ? " + pond" : ""}: ${fmt(pk[1], 1)} m³/s at ${fmt(pk[0], 1)} h`, X(pk[0]) + 8, Y(pk[1]) - 8); } }
    }
    const ctl = poe(lab, {
      guessInput: $("roGuess"),
      onReset() { curves = null; label(); draw(); },
      run(g) {
        curves = model(+impR.value / 100, pond.checked);
        return new Promise((resolve) => animate(draw, resolve, () => {
          const pk = peak(curves), pb = peak(model(0.1, false));
          return {
            out: `<span>peak flow <b>${fmt(pk[1], 2)} m³/s</b> at ${fmt(pk[0], 1)} h</span><span>your prediction <b>${fmt(g, 2)}</b> · off by <b>${fmt(errPct(g, pk[1]), 0)}%</b></span><span>10% paved: ${fmt(pb[1], 2)} m³/s at ${fmt(pb[0], 1)} h · ratio ${fmt(pk[1] / pb[1], 2)}×</span>`,
            explain: `Paving does two things at once. Less rain soaks in (pervious ground here absorbs 20 mm/h), and what runs off reaches the outlet faster over smooth surfaces and through pipes. Together they make the peak higher and earlier, which is why towns flood after development upstream. ${pond.checked ? "The detention pond stores the surge and releases it slowly, cutting the peak without changing the total volume." : "Tick the detention pond and predict again: it holds the surge back and releases it slowly."}`,
          };
        }));
      },
    });
    [impR, pond].forEach((el) => el.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else { label(); draw(); } }));
    label(); draw(); document.addEventListener("dulta:theme", () => draw());
  })();

  // ---------- Flight simulator: a glider from 1,000 m ----------
  (function glider() {
    const lab = $("glider"); if (!lab) return;
    const S = stage($("glCanvas")), aR = $("glAlpha");
    const M = 400, SW = 12, AR = 20, E = 0.85, CD0 = 0.012, G = 9.81, H0 = 1000;
    let path = null, sweep = null;
    const rho = (h) => 1.225 * Math.exp(-h / 8500);
    function coeffs(adeg) {
      if (adeg <= 14) { const cl = 2 * Math.PI * adeg * Math.PI / 180 * 0.9; return [cl, CD0 + cl * cl / (Math.PI * AR * E)]; }
      const cl = Math.max(0.5, 1.39 - (adeg - 14) * 0.08); return [cl, CD0 + cl * cl / (Math.PI * AR * E) + 0.1 + 0.02 * (adeg - 14)];
    }
    function fly(adeg) {
      const [cl, cd] = coeffs(adeg);
      const v0 = Math.sqrt(2 * M * G / (rho(H0) * SW * Math.hypot(cl, cd)));
      const gam0 = Math.atan(cd / cl);
      let x = 0, h = H0, vx = v0 * Math.cos(gam0), vz = -v0 * Math.sin(gam0), t = 0;
      const pts = [[0, H0, v0]], dt = 0.05;
      while (h > 0 && t < 4000) {
        const v = Math.hypot(vx, vz), q = 0.5 * rho(h) * v * v * SW, L = q * cl, D = q * cd;
        const ax = (-D * vx / v - L * vz / v) / M, az = (-D * vz / v + L * vx / v) / M - G;
        vx += ax * dt; vz += az * dt; x += vx * dt; h += vz * dt; t += dt;
        if (Math.round(t / dt) % 10 === 0) pts.push([x, Math.max(0, h), v]);
      }
      return { pts, dist: x, time: t, ld: cl / cd, v0 };
    }
    function draw(p = 1) {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const [cl, cd] = coeffs(+aR.value); $("glAlphav").textContent = `${aR.value}°`;
      const xmax = Math.max(40000, path ? path.dist * 1.1 : 0), x0 = 50, y0 = 30, w = W - 80, h = H - 80;
      const X = (x) => x0 + x / xmax * w, Y = (z) => y0 + h - z / 1200 * h;
      ctx.fillStyle = css("--line"); ctx.fillRect(x0, Y(0), w, 4);
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      for (let k = 0; k <= xmax / 1000; k += 10) ctx.fillText(`${k} km`, X(k * 1000) - 10, Y(0) + 18);
      ctx.fillText("1000 m", 4, Y(1000) + 4);
      if (path) {
        const n = Math.max(2, Math.floor(path.pts.length * p));
        ctx.strokeStyle = css("--aerospace"); ctx.lineWidth = 2.2; ctx.beginPath();
        path.pts.slice(0, n).forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z)))); ctx.stroke(); ctx.lineWidth = 1;
        const [gx, gz, gv] = path.pts[n - 1];
        ctx.save(); ctx.translate(X(gx), Y(gz)); ctx.fillStyle = css("--ink"); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-10, -3); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill(); ctx.fillRect(-4, -9, 3, 18); ctx.restore();
        ctx.fillStyle = css("--ink"); ctx.fillText(`altitude ${fmt(gz, 0)} m · airspeed ${fmt(gv * 3.6, 0)} km/h · distance ${fmt(gx / 1000, 1)} km`, x0, 20);
      } else { ctx.fillStyle = css("--muted"); ctx.fillText(`angle of attack ${aR.value}°${+aR.value > 14 ? " (past the stall)" : ""}`, x0, 20); }
      if (sweep) {
        const bw = 240, bh = 110, bx = W - bw - 20, by = 40, mx = Math.max(...sweep.map((s) => s[1]));
        ctx.fillStyle = css("--card"); ctx.strokeStyle = css("--line-2"); ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
        ctx.strokeStyle = css("--aerospace"); ctx.lineWidth = 1.8; ctx.beginPath();
        sweep.forEach(([a, d], i) => { const px = bx + 12 + (a - 1) / 19 * (bw - 24), py = by + bh - 18 - d / mx * (bh - 34); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); ctx.lineWidth = 1;
        const best = sweep.reduce((a, s) => (s[1] > a[1] ? s : a));
        ctx.fillStyle = css("--muted"); ctx.fillText(`glide distance vs α · best ${best[0]}° → ${fmt(best[1] / 1000, 1)} km`, bx + 8, by + 14);
      }
    }
    const ctl = poe(lab, {
      guessInput: $("glGuess"),
      onReset() { path = null; sweep = null; $("glSweep").hidden = true; draw(); },
      run(g) {
        path = fly(+aR.value);
        return new Promise((resolve) => animate(draw, resolve, () => {
          $("glSweep").hidden = false;
          return {
            out: `<span>glide distance <b>${fmt(path.dist / 1000, 2)} km</b> in ${fmt(path.time / 60, 1)} min</span><span>your prediction <b>${fmt(g, 1)} km</b> · off by <b>${fmt(errPct(g, path.dist / 1000), 0)}%</b></span><span>lift/drag at ${aR.value}° = ${fmt(path.ld, 1)} · trimmed airspeed ${fmt(path.v0 * 3.6, 0)} km/h</span>`,
            explain: `In a steady glide, distance divided by height lost equals lift over drag, so from 1 km the glider covers about L/D kilometres (${fmt(path.ld, 1)} here). A low angle of attack means fast flight and high parasite drag. A high angle means slow flight and high induced drag. Best L/D sits where the two are equal, around 8° for this wing. Past about 14° the wing stalls, lift collapses and the glide falls apart. Sweep the angles to find the best one.`,
          };
        }, 1600));
      },
    });
    $("glSweep").addEventListener("click", () => { sweep = []; for (let a = 1; a <= 20; a++) sweep.push([a, fly(a).dist]); draw(); });
    aR.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else draw(); });
    draw(); document.addEventListener("dulta:theme", () => draw());
  })();

  // ---------- Trajectory optimiser: orbit transfers ----------
  (function orbit() {
    const lab = $("orbit"); if (!lab) return;
    const S = stage($("obCanvas")), target = $("obTarget"), dvR = $("obDv");
    const MU = 398600, RE = 6371, R1 = 6771;
    let shown = false;
    const r2 = () => +target.value;
    const vc = (r) => Math.sqrt(MU / r);
    function hohmann(a, b) { const at = (a + b) / 2; return [vc(a) * (Math.sqrt(b / at) - 1), vc(b) * (1 - Math.sqrt(a / at))]; }
    function manual(dv1) {  // burn dv1 prograde at R1; apoapsis and the circularisation burn there
      const v = vc(R1) + dv1, eps = v * v / 2 - MU / R1;
      if (eps >= 0) return { escape: true };
      const a = -MU / (2 * eps), ra = 2 * a - R1;
      const va = R1 * v / ra;  // angular momentum conserved
      return { a, ra, dv2: Math.abs(vc(ra) - va) };
    }
    function hohmannDv1() {  // the optimiser: bisect dv1 until apoapsis = target radius
      let lo = 0, hi = 4;
      for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2, r = manual(m); if (r.escape || r.ra > r2()) hi = m; else lo = m; }
      return (lo + hi) / 2;
    }
    function label() {
      $("obDvv").textContent = `${fmt(+dvR.value, 2)} km/s`;
      const m = manual(+dvR.value);
      $("obManual").innerHTML = m.escape ? "<span>That burn escapes Earth entirely.</span>" : `<span>your first burn: ${fmt(+dvR.value, 2)} km/s → apoapsis ${Math.round(m.ra - RE).toLocaleString()} km altitude</span><span>burn to circularise there: ${fmt(m.dv2, 2)} km/s · total <b>${fmt(+dvR.value + m.dv2, 2)} km/s</b></span><span>${Math.abs(m.ra - r2()) / r2() < 0.01 ? "✓ on target" : m.ra < r2() ? "falls short of the target orbit" : "overshoots the target orbit"}</span>`;
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const cx = W * 0.4, cy = H / 2, sc = (H / 2 - 20) / Math.max(r2(), R1) / 1.05;
      ctx.fillStyle = css("--aerospace"); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx, cy, RE * sc, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = css("--line-2"); ctx.setLineDash([4, 4]);
      [R1, r2()].forEach((r) => { ctx.beginPath(); ctx.arc(cx, cy, r * sc, 0, 7); ctx.stroke(); });
      ctx.setLineDash([]);
      const ell = (dv, col, wdt) => {
        const m = manual(dv); if (m.escape) return;
        const a = m.a, e = (m.ra - R1) / (m.ra + R1), b = a * Math.sqrt(1 - e * e);
        ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath();
        for (let th = 0; th <= Math.PI + 1e-6; th += Math.PI / 120) { const r = a * (1 - e * e) / (1 + e * Math.cos(th)); const x = cx + r * Math.cos(th) * sc, y = cy - r * Math.sin(th) * sc; th ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.lineWidth = 1;
      };
      ell(+dvR.value, css("--threshold"), 1.6);
      if (shown) ell(hohmannDv1(), css("--aerospace"), 2.6);
      ctx.fillStyle = css("--ink"); ctx.beginPath(); ctx.arc(cx + R1 * sc, cy, 4, 0, 7); ctx.fill();
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      ctx.fillText("LEO 400 km", cx + R1 * sc + 6, cy + 14);
      ctx.fillText("target orbit", cx - r2() * sc * 0.72, cy - r2() * sc * 0.72);
      ctx.fillText(shown ? "amber: your transfer · blue: optimiser (Hohmann)" : "amber: your transfer; the optimiser's path appears after you predict", 14, H - 12);
    }
    const ctl = poe(lab, {
      guessInput: $("obGuess"),
      onReset() { shown = false; label(); draw(); },
      run(g) {
        shown = true; draw();
        const [d1, d2] = hohmann(R1, r2()), tot = d1 + d2, tof = Math.PI * Math.sqrt(((R1 + r2()) / 2) ** 3 / MU) / 3600;
        const fast = (() => { const m = manual(d1 + 0.5); if (m.escape) return null; const v = vc(R1) + d1 + 0.5, h = R1 * v, eps = v * v / 2 - MU / R1, vr = Math.sqrt(Math.max(0, 2 * (eps + MU / r2()) - (h / r2()) ** 2)), vt = h / r2(); return d1 + 0.5 + Math.hypot(vr, vc(r2()) - vt); })();
        return {
          out: `<span>optimal (Hohmann) total <b>${fmt(tot, 2)} km/s</b> = ${fmt(d1, 2)} + ${fmt(d2, 2)}</span><span>your prediction <b>${fmt(g, 2)} km/s</b> · off by <b>${fmt(errPct(g, tot), 0)}%</b></span><span>transfer time ${fmt(tof, 1)} h${fast ? ` · a faster transfer (+0.5 km/s first burn) costs ${fmt(fast, 2)} km/s in total` : ""}</span>`,
          explain: `The cheapest two-burn route is an ellipse that just touches both orbits. The first burn stretches the orbit out to the target, and a second burn at the top rounds it off. Overshooting arrives sooner, but the second burn must then also cancel your sideways motion, so the total goes up. With the rocket equation, every extra km/s costs exponentially more propellant, which is why mission designers optimise transfers so hard. Drag the first-burn slider to find the optimum yourself.`,
        };
      },
    });
    target.addEventListener("change", () => { if (ctl.state.committed) ctl.reset(); else { label(); draw(); } });
    dvR.addEventListener("input", () => { label(); draw(); });
    label(); draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Water-quality monitoring: the oxygen sag (Streeter-Phelps) ----------
  (function dosag() {
    const lab = $("dosag"); if (!lab) return;
    const S = stage($("dsCanvas")), bodR = $("dsBod"), tR = $("dsTemp"), vR = $("dsVel");
    let shown = false;
    const sat = (T) => 14.62 - 0.3898 * T + 0.006969 * T * T - 0.00005896 * T ** 3;
    function model() {
      const T = +tR.value, L0 = +bodR.value, u = vR.value / 10, H = 2;
      const kd = 0.35 * Math.pow(1.047, T - 20), ka = 3.93 * Math.sqrt(u) / Math.pow(H, 1.5) * Math.pow(1.024, T - 20), D0 = 1;
      const pts = [];
      for (let x = 0; x <= 200; x += 1) { const t = x * 1000 / u / 86400; const D = kd * L0 / (ka - kd) * (Math.exp(-kd * t) - Math.exp(-ka * t)) + D0 * Math.exp(-ka * t); pts.push([x, Math.max(0, sat(T) - D)]); }
      return { pts, T, sat: sat(T), kd, ka, min: pts.reduce((a, p) => (p[1] < a[1] ? p : a)) };
    }
    function label() { $("dsBodv").textContent = `${bodR.value} mg/L`; $("dsTempv").textContent = `${tR.value} °C`; $("dsVelv").textContent = `${fmt(vR.value / 10, 1)} m/s`; }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const m = model(), x0 = 50, y0 = 20, w = W - 80, h = H - 60, X = (x) => x0 + x / 200 * w, Y = (d) => y0 + h - d / 14 * h;
      ctx.strokeStyle = css("--line-2"); ctx.strokeRect(x0, y0, w, h);
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      for (let d = 0; d <= 14; d += 2) ctx.fillText(d, x0 - 20, Y(d) + 4);
      for (let x = 0; x <= 200; x += 25) ctx.fillText(`${x} km`, X(x) - 12, y0 + h + 16);
      ctx.fillText("dissolved oxygen (mg/L) downstream of the outfall", x0 + 4, y0 + 12);
      ctx.strokeStyle = css("--misconception"); ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(x0, Y(5)); ctx.lineTo(x0 + w, Y(5)); ctx.stroke();
      ctx.strokeStyle = css("--line-2"); ctx.beginPath(); ctx.moveTo(x0, Y(m.sat)); ctx.lineTo(x0 + w, Y(m.sat)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css("--misconception"); ctx.fillText("5 mg/L: most fish stressed below", x0 + w - 230, Y(5) - 6);
      ctx.fillStyle = css("--muted"); ctx.fillText(`saturation ${fmt(m.sat, 1)} mg/L at ${m.T} °C`, x0 + w - 200, Y(m.sat) - 6);
      // Monitoring stations: noisy samples, always visible, as a field team would see them.
      const r = rng(+bodR.value * 13 + +tR.value * 7 + +vR.value);
      [5, 15, 30, 60, 100, 160].forEach((xs) => { const d = m.pts[xs][1] + 0.25 * gauss(r); ctx.fillStyle = css("--environmental"); ctx.beginPath(); ctx.arc(X(xs), Y(d), 5, 0, 7); ctx.fill(); ctx.fillStyle = css("--muted"); ctx.fillText(fmt(d, 1), X(xs) + 7, Y(d) + 4); });
      if (shown) {
        ctx.strokeStyle = css("--environmental"); ctx.lineWidth = 2.4; ctx.beginPath(); m.pts.forEach(([x, d], i) => (i ? ctx.lineTo(X(x), Y(d)) : ctx.moveTo(X(x), Y(d)))); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = css("--threshold"); ctx.beginPath(); ctx.arc(X(m.min[0]), Y(m.min[1]), 6, 0, 7); ctx.fill();
        ctx.fillText(`minimum ${fmt(m.min[1], 2)} mg/L at ${m.min[0]} km`, X(m.min[0]) + 8, Y(m.min[1]) + 18);
      }
    }
    const ctl = poe(lab, {
      guessInput: $("dsGuess"),
      onReset() { shown = false; draw(); },
      run(g) {
        shown = true; draw();
        const m = model(), below = m.pts.filter((p) => p[1] < 5);
        return {
          out: `<span>lowest dissolved oxygen <b>${fmt(m.min[1], 2)} mg/L</b> at ${m.min[0]} km</span><span>your prediction <b>${fmt(g, 2)} mg/L</b> · off by <b>${fmt(Math.abs(g - m.min[1]), 2)}</b></span><span>${below.length ? `below 5 mg/L for about ${below.length} km of river` : "never below 5 mg/L"} · decay ${fmt(m.kd, 2)}/day, reaeration ${fmt(m.ka, 2)}/day</span>`,
          explain: `Two processes compete. Bacteria eat the sewage's organic matter and use up oxygen (BOD decay), while the river takes oxygen back from the air (reaeration). Near the outfall consumption wins and oxygen falls. Downstream, once the BOD is used up, reaeration wins and the river recovers. Warm water holds less oxygen and its bacteria work faster, so summer is the danger season. The green dots are noisy field samples: monitoring means spotting this sag in real, imperfect data. Try 28 °C, then a faster river.`,
        };
      },
    });
    [bodR, tR, vR].forEach((el) => el.addEventListener("input", () => { label(); if (ctl.state.committed) ctl.reset(); else draw(); }));
    label(); draw(); document.addEventListener("dulta:theme", draw);
  })();

  // ---------- Climate model: a two-box energy balance ----------
  (function climate() {
    const lab = $("climate"); if (!lab) return;
    const S = stage($("clCanvas")), lamR = $("clLam"), scen = $("clScen");
    const F2X = 3.7, C1 = 8, C2 = 100, GAM = 0.7, YEARS = 300;
    let run = null;
    const lam = () => lamR.value / 100;
    function forcing(t) { return scen.value === "abrupt" ? F2X : scen.value === "ramp" ? F2X * Math.min(1, t / 70) : t < 100 ? F2X * t / 100 : Math.max(0, F2X * (1 - (t - 100) / 100)); }
    function simulate() {
      let T1 = 0, T2 = 0; const out = [];
      for (let t = 0; t <= YEARS; t += 0.1) {
        if (Math.abs(t - Math.round(t)) < 0.05) out.push([Math.round(t), T1, forcing(t)]);
        const dT1 = (forcing(t) - lam() * T1 - GAM * (T1 - T2)) / C1, dT2 = GAM * (T1 - T2) / C2;
        T1 += dT1 * 0.1; T2 += dT2 * 0.1;
      }
      return out;
    }
    const at = (yr) => run.find((p) => p[0] === yr)[1];
    function label() {
      $("clLamv").textContent = `${fmt(lam(), 2)} W/m²/K`;
      $("clQ").textContent = `With this feedback strength, equilibrium warming for doubled CO₂ is F/λ = 3.7 / ${fmt(lam(), 2)} = ${fmt(F2X / lam(), 2)} °C. ${scen.value === "abrupt" ? "If CO₂ doubles overnight" : scen.value === "ramp" ? "If CO₂ rises steadily to double over 70 years" : "If forcing rises for 100 years, then falls back to zero over the next 100"}, how much warming will there be after 20 years (°C)?`;
    }
    function draw(p = 1) {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const x0 = 50, y0 = 20, w = W - 90, h = H - 60, tmax = Math.max(4, F2X / 0.8 + 0.3);
      const X = (t) => x0 + t / YEARS * w, Y = (T) => y0 + h - T / tmax * h;
      ctx.strokeStyle = css("--line-2"); ctx.strokeRect(x0, y0, w, h);
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = css("--muted");
      for (let T = 0; T <= tmax; T += 1) ctx.fillText(`${T} °C`, 6, Y(T) + 4);
      for (let t = 0; t <= YEARS; t += 50) ctx.fillText(`${t} y`, X(t) - 10, y0 + h + 16);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = css("--threshold"); ctx.beginPath(); ctx.moveTo(x0, Y(F2X / lam())); ctx.lineTo(x0 + w, Y(F2X / lam())); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css("--threshold"); ctx.fillText(`equilibrium ${fmt(F2X / lam(), 2)} °C`, x0 + w - 150, Y(F2X / lam()) - 6);
      if (!run) { ctx.fillStyle = css("--muted"); ctx.fillText("The warming curve appears after you predict.", x0 + 20, y0 + 30); return; }
      const n = Math.max(2, Math.floor(run.length * p));
      ctx.strokeStyle = css("--muted"); ctx.beginPath(); run.slice(0, n).forEach(([t, , f], i) => (i ? ctx.lineTo(X(t), Y(f / lam())) : ctx.moveTo(X(t), Y(f / lam())))); ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = css("--environmental"); ctx.lineWidth = 2.4; ctx.beginPath(); run.slice(0, n).forEach(([t, T], i) => (i ? ctx.lineTo(X(t), Y(T)) : ctx.moveTo(X(t), Y(T)))); ctx.stroke(); ctx.lineWidth = 1;
      if (p >= 1) { [20, 70, 300].forEach((yr) => { const T = at(yr); ctx.fillStyle = css("--environmental"); ctx.beginPath(); ctx.arc(X(yr), Y(T), 4, 0, 7); ctx.fill(); ctx.fillText(`${fmt(T, 2)} °C @ ${yr} y`, X(yr) - (yr === 300 ? 110 : -6), Y(T) - 8); }); }
      ctx.fillStyle = css("--muted"); ctx.fillText("grey: warming the forcing would cause if the oceans adjusted instantly", x0 + 8, y0 + h - 8);
    }
    const ctl = poe(lab, {
      guessInput: $("clGuess"),
      onReset() { run = null; label(); draw(); },
      run(g) {
        run = simulate();
        return new Promise((resolve) => animate(draw, resolve, () => {
          const t20 = at(20), ecs = F2X / lam();
          return {
            out: `<span>warming after 20 years <b>${fmt(t20, 2)} °C</b></span><span>your prediction <b>${fmt(g, 2)} °C</b> · off by <b>${fmt(Math.abs(g - t20), 2)}</b></span><span>after 70 years ${fmt(at(70), 2)} °C · after 300 years ${fmt(at(300), 2)} °C · equilibrium ${fmt(ecs, 2)} °C</span>`,
            explain: `The surface warms in two stages. The upper ocean (about 8 W·yr/m²/K of heat capacity) catches up within a decade or so. The deep ocean then keeps absorbing heat for centuries, so warming keeps creeping towards ${fmt(ecs, 2)} °C long after the forcing stops changing. Twenty years in, the planet has realised ${fmt(t20 / ecs * 100, 0)}% of its equilibrium warming. This committed warming is why today's emissions shape the climate for centuries. Stronger feedbacks (smaller λ) mean more warming and a slower approach. Try λ = 0.8, then switch scenarios.`,
          };
        }));
      },
    });
    [lamR, scen].forEach((el) => el.addEventListener("input", () => { if (ctl.state.committed) ctl.reset(); else { label(); draw(); } }));
    label(); draw(); document.addEventListener("dulta:theme", () => draw());
  })();

  // ---------- Earthquake location from S-P times ----------
  (function quake() {
    const lab = $("quake"); if (!lab) return;
    const S = stage($("qkCanvas"));
    const VP = 6, VS = 3.5, K = VP * VS / (VP - VS), STA = [["A", 120, 300], ["B", 460, 340], ["C", 300, 80]];  // km on a 600 × 400 km map
    let epi = null, shown = false, seed = 3;
    function newQuake() { const r = rng(seed++); epi = [80 + r() * 440, 60 + r() * 280]; shown = false; label(); }
    const dist = (s) => Math.hypot(s[1] - epi[0], s[2] - epi[1]);
    const sp = (s) => dist(s) / K;
    function label() { $("qkQ").textContent = `Station A records the S wave ${fmt(sp(STA[0]), 1)} s after the P wave. With vp = 6 km/s and vs = 3.5 km/s, how far is the earthquake from station A (km)?`; }
    function locate() {  // grid search for the point that best fits all three S-P times
      let best = null;
      for (let x = 0; x <= 600; x += 2) for (let y = 0; y <= 400; y += 2) {
        const e = STA.reduce((a, s) => a + (Math.hypot(s[1] - x, s[2] - y) - sp(s) * K) ** 2, 0);
        if (!best || e < best[2]) best = [x, y, e];
      }
      return best;
    }
    function draw() {
      const { ctx, W, H } = S; ctx.clearRect(0, 0, W, H);
      const mw = 470, sc = mw / 600, X = (x) => 10 + x * sc, Y = (y) => 10 + y * sc;
      ctx.strokeStyle = css("--line-2"); ctx.strokeRect(10, 10, 600 * sc, 400 * sc);
      ctx.font = "11px JetBrains Mono, monospace";
      if (shown) {
        STA.forEach((s) => { ctx.strokeStyle = css("--geoscience"); ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(X(s[1]), Y(s[2]), sp(s) * K * sc, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; });
        const loc = locate(); ctx.fillStyle = css("--misconception"); ctx.beginPath(); ctx.arc(X(loc[0]), Y(loc[1]), 7, 0, 7); ctx.fill();
        ctx.fillText("epicentre", X(loc[0]) + 10, Y(loc[1]) + 4);
      }
      STA.forEach((s) => { ctx.fillStyle = css("--ink"); ctx.beginPath(); ctx.moveTo(X(s[1]), Y(s[2]) - 8); ctx.lineTo(X(s[1]) - 7, Y(s[2]) + 5); ctx.lineTo(X(s[1]) + 7, Y(s[2]) + 5); ctx.closePath(); ctx.fill(); ctx.fillText(s[0], X(s[1]) + 9, Y(s[2]) + 4); });
      ctx.fillStyle = css("--muted"); ctx.fillText("600 × 400 km", 14, 400 * sc + 24);
      // Seismograms
      const gx = mw + 30, gw = W - gx - 10;
      STA.forEach((s, i) => {
        const gy = 30 + i * 100, tp = dist(s) / VP, ts = dist(s) / VS, r = rng(i * 17 + seed);
        ctx.fillStyle = css("--ink"); ctx.fillText(`station ${s[0]}`, gx, gy - 8);
        ctx.strokeStyle = css("--ink"); ctx.beginPath();
        for (let k = 0; k <= gw; k++) {
          const t = k / gw * 120; let a = 0.6 * gauss(r);
          if (t > tp) a += 6 * Math.exp(-(t - tp) / 6) * Math.sin(t * 6);
          if (t > ts) a += 16 * Math.exp(-(t - ts) / 10) * Math.sin(t * 3);
          k ? ctx.lineTo(gx + k, gy + 30 - a) : ctx.moveTo(gx + k, gy + 30 - a);
        }
        ctx.stroke();
        ctx.fillStyle = css("--muted"); ctx.fillText(`S − P = ${fmt(ts - tp, 1)} s`, gx + gw - 100, gy + 66);
        [[tp, "P"], [ts, "S"]].forEach(([t, l]) => { const px = gx + t / 120 * gw; ctx.fillStyle = css("--geoscience"); ctx.fillRect(px, gy + 2, 1.5, 56); ctx.fillText(l, px + 3, gy + 10); });
      });
      ctx.fillStyle = css("--muted"); ctx.fillText("0 – 120 s after origin", gx, H - 6);
    }
    const ctl = poe(lab, {
      guessInput: $("qkGuess"),
      onReset() { shown = false; label(); draw(); },
      run(g) {
        shown = true; draw();
        const dA = dist(STA[0]), loc = locate(), err = Math.hypot(loc[0] - epi[0], loc[1] - epi[1]);
        return {
          out: `<span>distance from A <b>${fmt(dA, 0)} km</b> = S−P × vp·vs/(vp−vs) = ${fmt(sp(STA[0]), 1)} × ${fmt(K, 1)}</span><span>your prediction <b>${fmt(g, 0)} km</b> · off by <b>${fmt(errPct(g, dA), 0)}%</b></span><span>three circles locate the epicentre to within ${fmt(err, 1)} km</span>`,
          explain: `P waves outrun S waves, so the gap between their arrivals grows with distance: each second of S−P is about ${fmt(K, 1)} km here. One station tells you how far away the quake was, but not in which direction: it could be anywhere on a circle. Two circles narrow it to two points, and the third circle picks one. That's why seismic networks need at least three stations. Real locations also solve for depth and origin time, using many stations and a layered Earth model.`,
        };
      },
    });
    $("qkNew").addEventListener("click", () => { newQuake(); ctl.reset(); });
    newQuake(); draw(); document.addEventListener("dulta:theme", draw);
  })();
})();

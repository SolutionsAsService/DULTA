// Engineering labs: a simulated microcontroller and an RC circuit.
(function () {
  const { stage, poe, css, esc, fmt, errPct } = window.DULTA_LAB_KIT;
  const $ = (id) => document.getElementById(id);

  // ---------- Microcontroller ----------
  // The chip runs in a Worker. Time is simulated in microseconds: each loop() pass
  // costs 10 µs, each millis()/micros()/PINB read costs 1 µs, delay(ms) costs ms.
  const WORKER = `
  const END = 5e6, MAX_TRACE = 200000;
  self.onmessage = (e) => {
    const { code } = e.data;
    let now = 0, seed = 12345;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    // Button on PB0 to ground: pressed at 0.5, 2.0 and 3.5 s for 300 ms; every edge bounces for 5 ms.
    const btn = [0, 1];
    for (const t0 of [500e3, 2000e3, 3500e3]) for (const [edge, final] of [[t0, 0], [t0 + 300e3, 1]]) {
      let t = edge, lvl = final;
      while (t < edge + 5000) { btn.push(t, lvl); lvl ^= 1; t += 50 + rnd() * 350; }
      btn.push(edge + 5000, final);
    }
    const contact = (t) => { let lo = 0, hi = btn.length / 2 - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (btn[m * 2] <= t) lo = m; else hi = m - 1; } return btn[lo * 2 + 1]; };
    let ddrb = 0, portb = 0, led = 0, lastT = 0, highTime = 0, transitions = 0, rising = 0;
    const trace = [0, 0], times = [];
    function ledUpdate() {
      const v = ((ddrb >> 5) & 1) && ((portb >> 5) & 1) ? 1 : 0;
      if (v === led) return;
      const t = Math.min(now, END);
      if (led) highTime += t - lastT;
      lastT = t; led = v; transitions++; if (v) rising++;
      if (trace.length < MAX_TRACE * 2) trace.push(t, v);
      if (times.length < 5000) times.push(t);
    }
    function pinb() {
      let v = 0;
      for (let b = 0; b < 8; b++) {
        let bit;
        if ((ddrb >> b) & 1) bit = (portb >> b) & 1;
        else if (b === 0 && contact(now) === 0) bit = 0;
        else if ((portb >> b) & 1) bit = 1;             // pull-up enabled
        else bit = rnd() < 0.5 ? 1 : 0;                 // floating input
        v |= bit << b;
      }
      return v;
    }
    const io = {
      get DDRB() { return ddrb; }, set DDRB(v) { ddrb = v & 255; ledUpdate(); },
      get PORTB() { return portb; }, set PORTB(v) { portb = v & 255; ledUpdate(); },
      get PINB() { now += 1; return pinb(); }, set PINB(v) { portb ^= v & 255; ledUpdate(); },
    };
    const millis = () => { now += 1; return Math.floor(now / 1000); };
    const micros = () => { now += 1; return now; };
    const delay = (ms) => { now += ms * 1000; };
    let fw;
    try {
      fw = new Function("io", "millis", "micros", "delay", code +
        "\\n;return { setup: typeof setup === 'function' ? setup : () => {}, loop: typeof loop === 'function' ? loop : () => {}," +
        " presses: () => (typeof presses === 'undefined' ? undefined : presses) };")(io, millis, micros, delay);
    } catch (err) { postMessage({ error: "Compile error: " + err.message }); return; }
    let loops = 0;
    try { fw.setup(); while (now < END) { fw.loop(); now += 10; loops++; } }
    catch (err) { postMessage({ error: "Runtime error at t = " + (now / 1000).toFixed(1) + " ms: " + err.message }); return; }
    if (led) highTime += END - lastT;
    postMessage({ trace: new Float64Array(trace), truncated: trace.length >= MAX_TRACE * 2, transitions, rising,
      duty: highTime / END, times, presses: fw.presses(), ddrb, portb, btn: new Float64Array(btn), loops });
  };`;
  const workerUrl = URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" }));

  const tasks = [
    {
      id: "blink", title: "1 · Blink without blocking",
      spec: "Blink the LED on PB5: 500 ms on, 500 ms off, for the whole run. Pass: PB5 is an output, 9–11 state changes in 5 s, every interval 500 ± 10 ms.",
      q: "How many times will the starter change the LED's state in 5 s?",
      starter: "function setup() {\n  io.DDRB |= (1 << 5);      // PB5 is an output\n}\n\nfunction loop() {\n  io.PORTB ^= (1 << 5);     // toggle the LED\n}\n",
      measure: (r) => r.transitions,
      tests(r) {
        const iv = r.times.slice(1).map((t, i) => t - r.times[i]);
        const worst = iv.length ? iv.reduce((w, x) => (Math.abs(x - 5e5) > Math.abs(w - 5e5) ? x : w)) : 0;
        return [
          ["PB5 configured as output", (r.ddrb >> 5) & 1, `DDRB = ${bin(r.ddrb)}`],
          ["9–11 LED state changes", r.transitions >= 9 && r.transitions <= 11, `${r.transitions.toLocaleString()} changes`],
          ["every interval 500 ± 10 ms", iv.length > 0 && Math.abs(worst - 5e5) <= 1e4, iv.length ? `worst interval ${fmt(worst / 1000, 3)} ms` : "no intervals"],
        ];
      },
      lesson: (r, g) => `You predicted ${Number(g).toLocaleString()}; the starter changed state ${r.transitions.toLocaleString()} times. loop() runs about 100,000 times a second, so toggling on every pass flickers the LED at about 50 kHz. It looks half-bright, which makes it a PWM signal by accident. Store a timestamp and toggle only when <span class="mono">millis() - last &gt;= 500</span>. Avoid <span class="mono">delay()</span> too: it works here but freezes everything else, which task 2 will expose.`,
    },
    {
      id: "debounce", title: "2 · Count button presses (debounce)",
      spec: "The button is pressed 3 times (at 0.5, 2.0 and 3.5 s); each contact edge bounces for about 5 ms. Keep a global `presses` equal to the number of real presses. Pass: pull-up enabled on PB0, presses === 3.",
      q: "The button is pressed 3 times. How many presses will the naive starter count?",
      starter: "let presses = 0;\nlet last = 1;\n\nfunction setup() {\n  io.DDRB &= ~(1 << 0);     // PB0 is an input\n  io.PORTB |= (1 << 0);     // enable its pull-up: released reads 1\n}\n\nfunction loop() {\n  const now = (io.PINB >> 0) & 1;\n  if (last === 1 && now === 0) presses++;   // falling edge = press\n  last = now;\n}\n",
      measure: (r) => r.presses,
      tests: (r) => [
        ["PB0 input with pull-up", !((r.ddrb >> 0) & 1) && ((r.portb >> 0) & 1), `DDRB = ${bin(r.ddrb)}, PORTB = ${bin(r.portb)}`],
        ["presses === 3", r.presses === 3, `presses = ${r.presses}`],
      ],
      lesson: (r, g) => `You predicted ${g}; the starter counted ${r.presses}. Set the scope to "first press" to see why: the contacts chatter for about 5 ms, and every bounce looks like a new press. Accept a change only after the pin has held steady longer than the bounce, say 20 ms, and count only the stable transition to 0. Remove the pull-up line and run it again to see a floating input.`,
    },
    {
      id: "pwm", title: "3 · Dim the LED with PWM",
      spec: "Make the LED look 25% bright with software PWM. Pass: duty cycle 25 ± 3% and at least 200 Hz, so the eye sees steady dimming instead of flicker.",
      q: "What PWM frequency, in Hz, does the starter produce?",
      starter: "function setup() {\n  io.DDRB |= (1 << 5);\n}\n\nfunction loop() {\n  const t = millis() % 1000;           // one cycle per second\n  if (t < 250) io.PORTB |= (1 << 5);   // on for 25% of the cycle\n  else io.PORTB &= ~(1 << 5);\n}\n",
      measure: (r) => r.rising / 5,
      tests: (r) => [
        ["duty cycle 25 ± 3%", Math.abs(r.duty * 100 - 25) <= 3, `duty ${fmt(r.duty * 100, 1)}%`],
        ["frequency ≥ 200 Hz", r.rising / 5 >= 200, `${fmt(r.rising / 5, 1)} Hz`],
      ],
      lesson: (r, g) => `You predicted ${g} Hz; the starter runs at ${fmt(r.rising / 5, 1)} Hz. Its duty cycle is right (25%), but at 1 Hz the eye sees a slow blink, not dimming. Use the same 25% ratio over a much shorter period, for example with <span class="mono">micros() % 2000 &lt; 500</span> for 500 Hz. Set the scope to "1.000 – 1.025 s" to check the waveform. Hardware timers do the same job without spending CPU time.`,
    },
  ];
  const bin = (v) => "0b" + v.toString(2).padStart(8, "0");

  const lab = $("mcu"), cv = $("mcuCanvas"), S = stage(cv), sel = $("mcuTask"), ed = $("mcuEditor"), out = $("mcuOut"), runBtn = $("mcuRun");
  let task = tasks[0], result = null, playhead = 0, anim = null, ctl;
  sel.innerHTML = tasks.map((t) => `<option value="${t.id}">${t.title}</option>`).join("");

  function flash() {
    return new Promise((resolve) => {
      const w = new Worker(workerUrl);
      const timer = setTimeout(() => { w.terminate(); resolve({ error: "The chip hung for 4 s of real time: a loop that never lets time pass?" }); }, 4000);
      w.onmessage = (e) => { clearTimeout(timer); w.terminate(); resolve(e.data); };
      w.postMessage({ code: ed.value });
    });
  }
  function levelAt(flat, t) {
    let lo = 0, hi = flat.length / 2 - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (flat[m * 2] <= t) lo = m; else hi = m - 1; }
    return lo;
  }
  function window_() {
    return { full: [0, 5e6], first: [0, 2000], press: [495e3, 515e3], pwm: [1e6, 1.025e6] }[$("mcuZoom").value];
  }
  function drawTrace(ctx, flat, x0, y, w, h, t0, t1, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath();
    const dt = (t1 - t0) / w;
    let idx = levelAt(flat, t0);
    for (let i = 0; i < w; i++) {
      const a = t0 + i * dt, b = a + dt;
      const lvl = flat[idx * 2 + 1];
      let changed = false;
      while (idx * 2 + 2 < flat.length && flat[idx * 2 + 2] <= b) { idx++; changed = true; }
      const X = x0 + i;
      if (changed) { ctx.moveTo(X, y + h); ctx.lineTo(X, y); ctx.moveTo(X, y + (flat[idx * 2 + 1] ? 0 : h)); }
      else { const Y = y + (lvl ? 0 : h); i ? ctx.lineTo(X + 1, Y) : (ctx.moveTo(X, Y), ctx.lineTo(X + 1, Y)); }
    }
    ctx.stroke();
  }
  function brightness(t) {
    if (!result || result.error) return 0;
    const tr = result.trace;
    if (result.truncated && t > tr[tr.length - 2]) return result.duty;
    const a = Math.max(0, t - 20000);
    let i = levelAt(tr, a), high = 0, cur = a;
    while (cur < t) {
      const next = i * 2 + 2 < tr.length ? Math.min(tr[i * 2 + 2], t) : t;
      if (tr[i * 2 + 1]) high += next - cur;
      cur = next; i++;
      if (i * 2 >= tr.length) { if (tr[tr.length - 1]) high += t - cur; break; }
    }
    return (t - a) > 0 ? high / (t - a) : 0;
  }
  function draw() {
    const { ctx, W, H } = S;
    ctx.clearRect(0, 0, W, H);
    const ink = css("--ink"), muted = css("--muted"), line = css("--line-2"), acc = css("--embedded"), mc = css("--misconception");
    ctx.font = "11px JetBrains Mono, monospace";
    // Board
    ctx.fillStyle = css("--card"); ctx.strokeStyle = line; ctx.lineWidth = 1.2;
    ctx.fillRect(20, 40, 120, 200); ctx.strokeRect(20, 40, 120, 200);
    ctx.fillStyle = ink; ctx.fillText("MCU", 64, 70);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = line; ctx.fillRect(140, 60 + i * 22, 10, 4); ctx.fillStyle = muted; ctx.fillText(`PB${i}`, 108, 66 + i * 22); }
    const b = brightness(playhead);
    const ly = 60 + 5 * 22 + 2;
    ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(150, ly); ctx.lineTo(176, ly); ctx.stroke();
    const g = ctx.createRadialGradient(186, ly, 2, 186, ly, 28);
    g.addColorStop(0, `rgba(255,80,60,${0.25 + 0.75 * b})`); g.addColorStop(1, "rgba(255,80,60,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(186, ly, 28, 0, 7); ctx.fill();
    ctx.fillStyle = b > 0.02 ? `rgba(255,${120 - 60 * b},90,1)` : css("--line"); ctx.beginPath(); ctx.arc(186, ly, 8, 0, 7); ctx.fill();
    ctx.fillStyle = muted; ctx.fillText("LED", 176, ly + 26);
    const by = 62, pressed = result && !result.error ? result.btn[levelAt(result.btn, playhead) * 2 + 1] === 0 : false;
    ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(150, by); ctx.lineTo(172, by); ctx.stroke();
    ctx.fillStyle = pressed ? acc : css("--card"); ctx.strokeStyle = ink; ctx.fillRect(172, by - 9, 18, 18); ctx.strokeRect(172, by - 9, 18, 18);
    ctx.fillStyle = muted; ctx.fillText("BTN", 196, by + 4);
    ctx.fillText(`t = ${fmt(playhead / 1e6, 3)} s`, 22, 262);
    // Scope
    const sx = 240, sw = W - sx - 16, [t0, t1] = window_();
    ctx.strokeStyle = line; ctx.strokeRect(sx, 30, sw, 230);
    for (let i = 1; i < 10; i++) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(sx + sw * i / 10, 30); ctx.lineTo(sx + sw * i / 10, 260); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = muted;
    ctx.fillText("CH1 PB5 (LED)", sx + 6, 46); ctx.fillText("CH2 PB0 (button)", sx + 6, 156);
    const span = t1 - t0, unit = span >= 1e6 ? [1e6, "s"] : span >= 1e3 ? [1e3, "ms"] : [1, "µs"];
    ctx.fillText(`${fmt(t0 / unit[0], span >= 1e6 ? 1 : 0)} ${unit[1]}`, sx, 278);
    ctx.fillText(`${fmt(t1 / unit[0], span >= 1e6 ? 1 : 0)} ${unit[1]}`, sx + sw - 60, 278);
    if (result && !result.error) {
      drawTrace(ctx, result.trace, sx + 1, 60, sw - 2, 60, t0, t1, acc);
      drawTrace(ctx, result.btn, sx + 1, 170, sw - 2, 60, t0, t1, ink);
      if (result.truncated) { ctx.fillStyle = mc; ctx.fillText("trace truncated (too many edges)", sx + sw - 250, 46); }
      if (playhead >= t0 && playhead <= t1) { const X = sx + (playhead - t0) / span * sw; ctx.strokeStyle = css("--threshold"); ctx.beginPath(); ctx.moveTo(X, 30); ctx.lineTo(X, 260); ctx.stroke(); }
    } else { ctx.fillText("no signal", sx + sw / 2 - 30, 145); }
  }
  function play() {
    cancelAnimationFrame(anim);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) { playhead = 5e6; draw(); return; }
    const start = performance.now();
    (function frame(t) { playhead = Math.min(5e6, (t - start) * 1000); draw(); if (playhead < 5e6) anim = requestAnimationFrame(frame); })(start);
  }
  function report(r) {
    if (r.error) { out.innerHTML = `<div class="fail">${esc(r.error)}</div>`; $("mcuRegs").innerHTML = "<span>no registers: the run failed</span>"; return; }
    const tests = task.tests(r);
    out.innerHTML = tests.map(([name, ok, got]) => `<div class="${ok ? "pass" : "fail"}">${ok ? "✓" : "✗"} ${esc(name)} → ${esc(got)}</div>`).join("")
      + `<div><b>${tests.filter((t) => t[1]).length}/${tests.length}</b> pass · ${r.loops.toLocaleString()} loop passes</div>`;
    $("mcuRegs").innerHTML = `<span>DDRB  <b>${bin(r.ddrb)}</b></span><span>PORTB <b>${bin(r.portb)}</b></span><span>LED duty <b>${fmt(r.duty * 100, 1)}%</b> · edges <b>${r.transitions.toLocaleString()}</b></span>`;
  }
  async function runFirmware() {
    runBtn.disabled = true;
    result = await flash();
    report(result); play();
    runBtn.disabled = false;
    return result;
  }
  function load(t) {
    task = t; ed.value = t.starter; result = null; playhead = 0;
    $("mcuSpec").textContent = t.spec; $("mcuQ").textContent = t.q;
    $("mcuZoom").value = t.id === "debounce" ? "press" : t.id === "pwm" ? "pwm" : "first";
    out.innerHTML = "<div>Commit a prediction to flash the starter firmware.</div>";
    if (ctl) ctl.reset();
    draw();
  }
  ctl = poe(lab, {
    guessInput: $("mcuGuess"),
    onReset() { runBtn.disabled = true; },
    async run(g) {
      ed.value = task.starter;
      const r = await runFirmware();
      if (r.error) return { explain: esc(r.error) };
      return { explain: task.lesson(r, g) + " Now edit the firmware and flash it until every test passes." };
    },
  });
  runBtn.addEventListener("click", runFirmware);
  $("mcuReset").addEventListener("click", () => { ed.value = task.starter; });
  $("mcuZoom").addEventListener("change", draw);
  sel.addEventListener("change", () => load(tasks.find((t) => t.id === sel.value)));
  ed.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); ed.setRangeText("  ", ed.selectionStart, ed.selectionEnd, "end"); }
  });
  document.addEventListener("dulta:theme", draw);
  load(tasks[0]);

  // ---------- RC circuit ----------
  (function rc() {
    const lab = $("rc"), cv = $("rcCanvas"), S = stage(cv), Rr = $("rcR"), Cr = $("rcC");
    const VS = 5;
    let curve = null, guess = null, prog = 1;
    const R = () => 1000 * Math.pow(100, Rr.value / 100), C = () => 1e-6 * Math.pow(100, Cr.value / 100);
    const human = (v, u) => v >= 1e6 ? fmt(v / 1e6, 2) + " M" + u : v >= 1e3 ? fmt(v / 1e3, 1) + " k" + u : fmt(v, 1) + " " + u;
    function label() { $("rcRv").textContent = human(R(), "Ω"); $("rcCv").textContent = fmt(C() * 1e6, 1) + " µF"; }
    // Measure by integrating dV/dt = (Vs − V) / RC rather than quoting the formula.
    function simulate() {
      const tau = R() * C(), dt = tau / 4000, pts = [];
      let v = 0, t = 0, t63 = null, t99 = null;
      while (t < 5 * tau) {
        if (pts.length === 0 || t - pts[pts.length - 1][0] >= tau / 200) pts.push([t, v]);
        v += (VS - v) / tau * dt; t += dt;
        if (t63 === null && v >= 0.632 * VS) t63 = t;
        if (t99 === null && v >= 0.99 * VS) t99 = t;
      }
      return { pts, tau, t63, t99 };
    }
    function draw() {
      const { ctx, W, H } = S;
      ctx.clearRect(0, 0, W, H);
      const ink = css("--ink"), muted = css("--muted"), line = css("--line-2"), acc = css("--electrical"), th = css("--threshold");
      ctx.font = "11px JetBrains Mono, monospace";
      // Schematic
      ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(40, 110); ctx.moveTo(30, 70); ctx.lineTo(50, 70); ctx.moveTo(34, 78); ctx.lineTo(46, 78);
      ctx.moveTo(40, 40); ctx.lineTo(70, 40); ctx.lineTo(90, curve ? 40 : 30);
      ctx.moveTo(92, 40); ctx.lineTo(100, 40);
      for (let i = 0; i < 6; i++) ctx.lineTo(104 + i * 6, i % 2 ? 34 : 46);
      ctx.lineTo(140, 40); ctx.lineTo(170, 40); ctx.lineTo(170, 68); ctx.moveTo(158, 68); ctx.lineTo(182, 68); ctx.moveTo(158, 76); ctx.lineTo(182, 76);
      ctx.moveTo(170, 76); ctx.lineTo(170, 110); ctx.lineTo(40, 110); ctx.stroke();
      ctx.fillStyle = muted; ctx.fillText("5 V", 8, 76); ctx.fillText("R", 114, 28); ctx.fillText("C", 188, 76);
      // Axes
      const x0 = 230, y0 = H - 40, w = W - x0 - 20, h = H - 80;
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, 20); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.stroke();
      const tau = R() * C(), tmax = 5 * tau;
      const X = (t) => x0 + t / tmax * w, Y = (v) => y0 - v / VS * h;
      ctx.fillStyle = muted;
      for (let k = 0; k <= 5; k++) { ctx.fillText(`${k}τ`, X(k * tau) - 6, y0 + 16); }
      ctx.fillText(`τ = RC = ${fmt(tau * 1000, 2)} ms`, x0 + w - 170, y0 + 32);
      [0, 2.5, 5].forEach((v) => ctx.fillText(`${v} V`, x0 - 34, Y(v) + 4));
      ctx.setLineDash([4, 4]); ctx.strokeStyle = line;
      ctx.beginPath(); ctx.moveTo(x0, Y(0.632 * VS)); ctx.lineTo(x0 + w, Y(0.632 * VS)); ctx.stroke();
      ctx.fillText("63.2%", x0 + w - 44, Y(0.632 * VS) - 6);
      if (guess !== null) {
        const gx = X(guess / 1000);
        if (gx <= x0 + w) { ctx.strokeStyle = th; ctx.beginPath(); ctx.moveTo(gx, 20); ctx.lineTo(gx, y0); ctx.stroke(); ctx.fillStyle = th; ctx.fillText("your prediction", gx + 4, 34); }
        else { ctx.fillStyle = th; ctx.fillText(`your prediction (${fmt(guess, 1)} ms) is off the chart →`, x0 + 10, 34); }
      }
      ctx.setLineDash([]);
      if (curve) {
        const n = Math.max(2, Math.floor(curve.pts.length * prog));
        ctx.strokeStyle = acc; ctx.lineWidth = 2.4; ctx.beginPath();
        curve.pts.slice(0, n).forEach(([t, v], i) => (i ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v))));
        ctx.stroke();
        if (prog >= 1) { ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(X(curve.t63), Y(0.632 * VS), 5, 0, 7); ctx.fill(); }
      }
    }
    const ctl = poe(lab, {
      guessInput: $("rcGuess"),
      onReset() { curve = null; guess = null; draw(); },
      run(g) {
        guess = g; curve = simulate(); prog = 0;
        return new Promise((resolve) => {
          const start = performance.now(), dur = matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden ? 0 : 1200;
          (function frame(t) {
            prog = dur ? Math.min(1, (t - start) / dur) : 1; draw();
            if (prog < 1) return requestAnimationFrame(frame);
            const t63 = curve.t63 * 1000;
            resolve({
              out: `<span>measured time to 63.2% <b>${fmt(t63, 2)} ms</b></span><span>your prediction <b>${fmt(g, 2)} ms</b> · off by <b>${fmt(errPct(g, t63), 0)}%</b></span><span>R × C = ${fmt(curve.tau * 1000, 2)} ms · 99% reached at ${fmt(curve.t99 * 1000, 1)} ms · start current ${fmt(VS / R() * 1000, 3)} mA</span>`,
              explain: `The capacitor reaches 63.2% after one time constant, τ = R × C = ${human(R(), "Ω")} × ${fmt(C() * 1e6, 1)} µF = ${fmt(curve.tau * 1000, 2)} ms. The current is proportional to the voltage still to go, so every τ closes 63% of the remaining gap: 63%, 86%, 95%, 98%, then 99.3% at 5τ. Doubling either R or C doubles the time. This is the same exponential behind debounce filters, sensor smoothing and the reset delay on a microcontroller.`,
            });
          })(start);
        });
      },
    });
    [Rr, Cr].forEach((el) => el.addEventListener("input", () => { label(); if (ctl.state.committed) ctl.reset(); else draw(); }));
    label(); draw();
    document.addEventListener("dulta:theme", draw);
  })();
})();

// Shared site behaviour: theme, scroll reveal, and the learner store.
// The learner store uses the same schema as `scripts/dulta.py frontier --state`,
// so an exported learner.json runs through the CLI unchanged.
(function () {
  const THEME_KEY = "dulta.theme";
  const STATE_KEY = "dulta.learner";
  const LEITNER_DAYS = [1, 3, 7, 16, 35];

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode: state lives for this page only */ } }

  // Theme
  const saved = safeGet(THEME_KEY);
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  function currentTheme() {
    const set = document.documentElement.getAttribute("data-theme");
    if (set) return set;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-btn");
    if (!btn) return;
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    safeSet(THEME_KEY, next);
    document.dispatchEvent(new CustomEvent("dulta:theme"));
  });

  // Scroll reveal
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".reveal").forEach((el) => io ? io.observe(el) : el.classList.add("in"));
  });

  // Learner store
  let memory = null;
  function load() {
    if (memory) return memory;
    try { memory = JSON.parse(safeGet(STATE_KEY)) || null; } catch (e) { memory = null; }
    if (!memory || typeof memory !== "object") memory = {};
    memory.mastered = memory.mastered || {};
    memory.probed = memory.probed || [];
    memory.log = memory.log || [];
    return memory;
  }
  function save() { safeSet(STATE_KEY, JSON.stringify(load())); document.dispatchEvent(new CustomEvent("dulta:state")); }
  const today = () => new Date().toISOString().slice(0, 10);

  // Record one unaided attempt. Correct: master or promote a Leitner box. Wrong: back to box 0 (REOPENED).
  // Returns a snapshot so a disputed auto-grade can be amended without double-counting.
  function record(key, kind, correct, confidence, meta) {
    const s = load();
    const snap = { key, kind, prev: s.mastered[key] ? { ...s.mastered[key] } : null, probed: s.probed.includes(key), at: s.log.length, confidence };
    s.log.push({ key, correct, confidence, date: today(), auto: !!(meta && meta.auto), override: !!(meta && meta.override) });
    if (kind === "misconception") {
      if (correct && !s.probed.includes(key)) s.probed.push(key);
      save(); return snap;
    }
    const prev = s.mastered[key];
    if (correct) s.mastered[key] = { date: today(), box: prev ? Math.min(prev.box + 1, LEITNER_DAYS.length - 1) : 0 };
    else if (prev) s.mastered[key] = { date: prev.date, box: 0, reopened: true };
    save();
    return snap;
  }
  // The learner disputes the auto-grade: undo that attempt and record it again, marked as an override.
  function amend(snap, correct) {
    const s = load();
    if (snap.prev) s.mastered[snap.key] = snap.prev; else delete s.mastered[snap.key];
    s.probed = s.probed.filter((k) => k !== snap.key);
    if (snap.probed) s.probed.push(snap.key);
    s.log.splice(snap.at, 1);
    return record(snap.key, snap.kind, correct, snap.confidence, { override: true });
  }

  // Auto-grading. scripts/dulta.py `grade()` implements the same rules; keep the two in step.
  const SYMBOLS = [["√", " sqrt "], ["π", " pi "], ["Ω", " ohm "], ["µ", " u "], ["μ", " u "], ["°", " deg "], ["τ", " tau "],
    ["ω", " omega "], ["Δ", " delta "], ["ρ", " rho "], ["−", "-"], ["–", "-"], ["×", " x "]];
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  function prep(text) {
    let s = String(text).toLowerCase();
    SYMBOLS.forEach(([k, v]) => { s = s.split(k.toLowerCase()).join(v); });
    return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => " " + [...m].map((c) => SUP.indexOf(c)).join(""));
  }
  const words = (t) => " " + prep(t).replace(/[^a-z0-9]+/g, " ").trim() + " ";
  function has(w, phrase) {
    const stem = phrase.endsWith("*");
    const p = prep(phrase.replace(/\*+$/, "")).replace(/[^a-z0-9]+/g, " ").trim();
    return stem ? w.includes(" " + p) : w.includes(" " + p + " ");
  }
  function numbers(t) {
    const s = prep(t).replace(/(\d),(?=\d{3}\b)/g, "$1");
    const out = (s.match(/(?<![\w.])-?\d+(?:\.\d+)?(?:e-?\d+)?/g) || []).map(Number);
    for (const m of s.matchAll(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g)) if (+m[2]) out.push(+m[1] / +m[2]);
    return out;
  }
  function grade(spec, answer, question) {
    if (!spec) return null;
    const w = words(answer), nums = numbers(answer), tol = spec.tol == null ? 0.02 : spec.tol;
    if (question) {  // an answer made almost entirely of the question's own words is the question pasted back
      const aw = w.trim().split(" ").filter(Boolean), qw = new Set(words(question).trim().split(" "));
      const covered = [...qw].filter((x) => aw.includes(x)).length / Math.max(qw.size, 1);
      if (aw.length >= 6 && aw.filter((x) => qw.has(x)).length / aw.length >= 0.8 && covered >= 0.6) return { correct: false, reason: "that repeats the question" };
    }
    for (const g of spec.numbers || []) {
      if (!g.some((v) => nums.some((x) => Math.abs(x - v) <= (v ? tol * Math.abs(v) : 1e-9)))) return { correct: false, reason: `expected a value near ${g[0]}` };
    }
    for (const g of spec.all || []) {
      if (!g.some((p) => has(w, p))) return { correct: false, reason: `missing an idea like “${g[0].replace(/\*+$/, "")}”` };
    }
    for (const p of spec.none || []) if (has(w, p)) return { correct: false, reason: `contains “${p}”, which points the wrong way` };
    if (spec.code && spec.code.length) {
      const flat = String(answer).toLowerCase().replace(/\s+/g, "");
      if (!spec.code.some((c) => flat.includes(c.replace(/ /g, "")))) return { correct: false, reason: "the expression does not match" };
    }
    return { correct: true, reason: "matches the key" };
  }
  function unmaster(key) { delete load().mastered[key]; save(); }
  function reset() { memory = { mastered: {}, probed: [], log: [] }; save(); }

  function isDue(key) {
    const rec = load().mastered[key];
    if (!rec) return false;
    if (rec.reopened) return true;
    const due = new Date(rec.date);
    due.setDate(due.getDate() + LEITNER_DAYS[Math.min(rec.box, LEITNER_DAYS.length - 1)]);
    return due <= new Date();
  }

  // Knowledge Space Theory's outer fringe: not mastered, every prerequisite mastered.
  function frontier(data, mapId) {
    const s = load();
    const pre = {};
    data.edges.forEach((e) => { if (e.type === "prereq") (pre[e.to] = pre[e.to] || []).push(e.from); });
    return data.nodes.filter((n) => n.kind !== "misconception" && (!mapId || n.map === mapId) && !s.mastered[n.key]
      && (pre[n.key] || []).every((p) => s.mastered[p])).map((n) => n.key);
  }

  function exportState() {
    const s = load();
    const blob = new Blob([JSON.stringify({ mastered: s.mastered, probed: s.probed }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learner.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function importState(file) {
    return file.text().then((t) => {
      const parsed = JSON.parse(t);
      memory = { mastered: parsed.mastered || {}, probed: parsed.probed || [], log: load().log };
      save();
    });
  }

  window.DULTA = { load, save, record, amend, grade, unmaster, reset, isDue, frontier, exportState, importState, today };
})();

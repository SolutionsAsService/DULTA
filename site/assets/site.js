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
  function record(key, kind, correct, confidence) {
    const s = load();
    s.log.push({ key, correct, confidence, date: today() });
    if (kind === "misconception") {
      if (correct && !s.probed.includes(key)) s.probed.push(key);
      save(); return;
    }
    const prev = s.mastered[key];
    if (correct) s.mastered[key] = { date: today(), box: prev ? Math.min(prev.box + 1, LEITNER_DAYS.length - 1) : 0 };
    else if (prev) s.mastered[key] = { date: prev.date, box: 0, reopened: true };
    save();
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

  window.DULTA = { load, save, record, unmaster, reset, isDue, frontier, exportState, importState, today };
})();

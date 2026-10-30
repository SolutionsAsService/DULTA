// Map explorer: a layered drawing of one domain map, coloured by the learner's state.
(function () {
  const D = window.DULTA_MAPS;
  const byKey = Object.fromEntries(D.nodes.map((n) => [n.key, n]));
  const NW = 178, NH = 56, GAP = 64, RG = 16, PAD = 20;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let mapId = D.maps[0].id, selected = null, pendingConfidence = null, lastResult = null;

  function wrap(label, max) {
    const words = label.split(" "), lines = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function mapEdges(id) { return D.edges.filter((e) => e.map === id); }

  function layout(id) {
    const edges = mapEdges(id);
    const local = D.nodes.filter((n) => n.map === id);
    const ext = [...new Set(edges.filter((e) => !e.from.startsWith(id + "/")).map((e) => e.from))].map((k) => byKey[k]);
    const col = {};
    local.forEach((n) => { col[n.key] = n.depth; });
    ext.forEach((n) => {
      const targets = edges.filter((e) => e.from === n.key).map((e) => col[e.to]);
      col[n.key] = Math.min(...targets) - 1;
    });
    const minC = Math.min(...Object.values(col));
    Object.keys(col).forEach((k) => { col[k] -= minC; });
    const all = [...local, ...ext];
    const ncols = Math.max(...Object.values(col)) + 1;
    const preds = {}, succs = {};
    edges.filter((e) => e.type === "prereq").forEach((e) => {
      (preds[e.to] = preds[e.to] || []).push(e.from);
      (succs[e.from] = succs[e.from] || []).push(e.to);
    });
    const counterOf = {};
    edges.filter((e) => e.type === "counter").forEach((e) => { counterOf[e.from] = e.to; });
    const columns = Array.from({ length: ncols }, (_, c) => all.filter((n) => col[n.key] === c && !counterOf[n.key]));
    const pos = {};
    columns.forEach((c) => c.forEach((n, i) => { pos[n.key] = i; }));
    const bary = (n, nbrs) => {
      const ps = (nbrs[n.key] || []).filter((k) => pos[k] !== undefined);
      return ps.length ? ps.reduce((a, k) => a + pos[k], 0) / ps.length : pos[n.key];
    };
    for (const dir of ["lr", "rl", "lr", "rl", "lr"]) {
      const order = dir === "lr" ? columns : [...columns].reverse();
      order.forEach((c) => {
        c.sort((a, b) => bary(a, dir === "lr" ? preds : succs) - bary(b, dir === "lr" ? preds : succs));
        c.forEach((n, i) => { pos[n.key] = i; });
      });
    }
    // Misconceptions sit directly beneath the concept they block.
    const finalCols = columns.map((c) => {
      const out = [];
      c.forEach((n) => {
        out.push(n);
        all.filter((m) => counterOf[m.key] === n.key).forEach((m) => out.push(m));
      });
      return out;
    });
    const maxRows = Math.max(...finalCols.map((c) => c.length));
    const xy = {};
    finalCols.forEach((c, ci) => {
      const off = ((maxRows - c.length) * (NH + RG)) / 2;
      c.forEach((n, ri) => { xy[n.key] = { x: PAD + ci * (NW + GAP), y: PAD + off + ri * (NH + RG) }; });
    });
    return { nodes: all, edges, xy, w: PAD * 2 + ncols * NW + (ncols - 1) * GAP, h: PAD * 2 + maxRows * (NH + RG) - RG, ext: new Set(ext.map((n) => n.key)) };
  }

  function nodeState(n, frontierSet) {
    const s = DULTA.load();
    const cls = [n.kind];
    if (s.mastered[n.key]) cls.push("mastered");
    if (n.kind === "misconception" && s.probed.includes(n.key)) cls.push("mastered");
    if (frontierSet.has(n.key)) cls.push("frontier");
    if (DULTA.isDue(n.key)) cls.push("due");
    return cls;
  }

  function draw() {
    const m = D.maps.find((x) => x.id === mapId);
    document.documentElement.style.setProperty("--accent", `var(--${mapId})`);
    $("mapTitle").textContent = m.title;
    $("mapSummary").textContent = m.summary;
    document.querySelectorAll("#tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.id === mapId));
    const L = layout(mapId);
    const frontierSet = new Set(DULTA.frontier(D, mapId));
    const paths = L.edges.map((e) => {
      const a = L.xy[e.from], b = L.xy[e.to];
      if (!a || !b) return "";
      let d;
      if (e.type === "counter") {
        d = `M${a.x + NW / 2},${a.y} L${b.x + NW / 2},${b.y + NH}`;
      } else {
        const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      }
      const cls = e.type === "counter" ? "counter" : L.ext.has(e.from) ? "cross" : "";
      return `<path class="gedge ${cls}" data-from="${e.from}" data-to="${e.to}" d="${d}" marker-end="url(#arr${e.type === "counter" ? "c" : ""})"/>`;
    }).join("");
    const nodes = L.nodes.map((n) => {
      const { x, y } = L.xy[n.key];
      const ext = L.ext.has(n.key);
      const cls = ext ? ["external", ...(DULTA.load().mastered[n.key] ? ["mastered"] : [])] : nodeState(n, frontierSet);
      if (n.key === selected) cls.push("selected");
      const lines = wrap(n.label + (ext ? ` (${n.map})` : ""), 24);
      const lh = lines.length > 2 ? 13.5 : 15.5;
      const ty = y + NH / 2 - ((lines.length - 1) * lh) / 2 + 4.5;
      const text = lines.map((l, i) => `<tspan x="${x + 14}" y="${ty + i * lh}">${esc(l)}</tspan>`).join("");
      const due = !ext && cls.includes("due") ? `<circle class="due" cx="${x + NW - 10}" cy="${y + 10}" r="4.5"/>` : "";
      const status = cls.includes("mastered") ? ", mastered" : cls.includes("frontier") ? ", on your frontier" : "";
      return `<g class="gnode ${cls.join(" ")}" tabindex="0" role="button" data-key="${n.key}" aria-label="${esc(n.label)}, ${n.kind}${status}">
        <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="10"/><text>${text}</text>${due}</g>`;
    }).join("");
    $("graphBox").innerHTML = `<svg width="${L.w}" height="${L.h}" viewBox="0 0 ${L.w} ${L.h}" role="group" aria-label="${esc(m.title)} map">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--line-2)"/></marker>
        <marker id="arrc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--misconception)"/></marker>
      </defs>${paths}${nodes}</svg>`;
    stats(frontierSet);
    if (selected) highlight(selected);
  }

  function stats(frontierSet) {
    const s = DULTA.load();
    const local = D.nodes.filter((n) => n.map === mapId && n.kind !== "misconception");
    const mastered = local.filter((n) => s.mastered[n.key]).length;
    const due = local.filter((n) => DULTA.isDue(n.key)).length;
    const misc = D.nodes.filter((n) => n.map === mapId && n.kind === "misconception");
    const probed = misc.filter((n) => s.probed.includes(n.key)).length;
    $("stats").innerHTML = `<span>mastered <b>${mastered}/${local.length}</b></span>
      <span>frontier <b>${frontierSet.size}</b></span><span>reviews due <b>${due}</b></span>
      <span>misconceptions cleared <b>${probed}/${misc.length}</b></span>
      ${elsewhere()}
      <button class="btn small ghost" id="exp" type="button">Export learner.json</button>
      <label class="btn small ghost" style="margin:0;color:var(--ink)">Import<input type="file" accept="application/json" id="imp" hidden></label>
      <button class="btn small ghost" id="rst" type="button">Reset</button>`;
    $("stats").querySelectorAll("[data-map]").forEach((b) => b.onclick = () => { mapId = b.dataset.map; selected = null; history.replaceState(null, "", `#${mapId}`); draw(); });
    $("exp").onclick = DULTA.exportState;
    $("imp").onchange = (e) => e.target.files[0] && DULTA.importState(e.target.files[0]).catch(() => alert("That file is not a learner.json."));
    $("rst").onclick = () => { if (confirm("Forget all progress in this browser?")) DULTA.reset(); };
  }

  // When this map's frontier is empty because a prerequisite lives in another map, say where to go.
  function elsewhere() {
    if (DULTA.frontier(D, mapId).length) return "";
    const s = DULTA.load();
    const blocked = mapEdges(mapId).filter((e) => e.type === "prereq" && !e.from.startsWith(mapId + "/") && !s.mastered[e.from]);
    const maps = [...new Set(blocked.map((e) => byKey[e.from].map))];
    if (!maps.length) return "";
    return `<span>next steps are in ${maps.map((m) => `<button class="btn small" type="button" data-map="${m}">${esc(D.maps.find((x) => x.id === m).title)}</button>`).join(" ")}</span>`;
  }

  function highlight(key) {
    document.querySelectorAll(".gedge").forEach((p) => p.classList.toggle("hot", p.dataset.from === key || p.dataset.to === key));
  }

  function chips(keys, label) {
    if (!keys.length) return "";
    return `<div><div class="k">${label}</div><div class="chips">${keys.map((k) => `<button type="button" data-go="${k}">${esc(byKey[k].label)}${byKey[k].map !== mapId ? " · " + byKey[k].map : ""}</button>`).join("")}</div></div>`;
  }

  function detail(key) {
    const n = byKey[key];
    if (!n) return;
    if (n.map !== mapId) { mapId = n.map; }
    selected = key;
    pendingConfidence = null;
    const s = DULTA.load();
    const pre = D.edges.filter((e) => e.to === key && e.type === "prereq").map((e) => e.from);
    const next = D.edges.filter((e) => e.from === key && e.type === "prereq").map((e) => e.to);
    const misc = D.edges.filter((e) => e.to === key && e.type === "counter").map((e) => e.from);
    const blocks = D.edges.filter((e) => e.from === key && e.type === "counter").map((e) => e.to);
    const rec = s.mastered[key];
    const missing = pre.filter((p) => !s.mastered[p]);
    let status;
    if (n.kind === "misconception") status = s.probed.includes(key) ? "Cleared: you answered this probe correctly." : "Not yet probed. Try it before learning the concept it blocks.";
    else if (rec) {
      const due = DULTA.isDue(key);
      status = rec.reopened ? "Reopened: a later check failed. Answer it again." : `Mastered ${rec.date} · Leitner box ${rec.box}${due ? " · review due now" : ""}`;
    } else if (!missing.length) status = "On your frontier: you have proven everything it needs.";
    else status = `Locked for now. First: ${missing.map((k) => byKey[k].label).join(", ")}. You can still try it.`;
    const lab = n.lab ? `<a class="btn small ghost" href="labs.html${n.lab === "retrieval" ? `?deck=${n.map}` : ""}#${n.lab}">Open the ${n.lab} lab →</a>` : "";
    $("detail").innerHTML = `
      <div class="row"><span class="tag ${n.kind}">${n.kind === "threshold" ? "threshold concept" : n.kind}</span><span class="tag concept">${n.map}</span></div>
      <h3>${esc(n.label)}</h3>
      <p style="margin:0">${esc(n.summary)}</p>
      <div><div class="k">Outcome</div>${esc(n.outcome)}</div>
      <div><div class="k">Status</div>${esc(status)}</div>
      <div class="check">
        <div class="k">Retrieval check: attempt first, then reveal</div>
        <div style="font-family:var(--serif);font-size:19px;line-height:1.35">${esc(n.check)}</div>
        <label for="attempt" style="margin:0">Your attempt</label>
        <textarea id="attempt" rows="3" placeholder="Write your answer before revealing."></textarea>
        <div><div class="k">Confidence</div><div class="conf" id="conf">${[20, 40, 60, 80, 100].map((c) => `<button type="button" aria-pressed="false" data-c="${c}">${c}%</button>`).join("")}</div></div>
        <div class="row"><button class="btn small" id="reveal" type="button" disabled>${n.grade ? "Check my answer" : "Reveal answer"}</button></div>
        <div id="ans" hidden>
          <div id="verdict"></div>
          <div class="answer">${esc(n.answer)}</div>
          <div class="row" style="margin-top:10px" id="ansActions">${n.grade ? "" : `<button class="btn small" id="right" type="button">I was right</button><button class="btn small ghost" id="wrong" type="button">I was wrong</button>`}</div>
        </div>
      </div>
      ${lab}
      ${chips(pre, "Needs")}${chips(next, "Unlocks")}${chips(misc, "Misconceptions to probe")}${chips(blocks, "Blocks")}
      ${rec ? `<button class="btn small ghost" id="forget" type="button">Forget this node</button>` : ""}`;
    const gate = () => { $("reveal").disabled = !($("attempt").value.trim() && pendingConfidence); };
    $("attempt").addEventListener("input", gate);
    $("conf").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      pendingConfidence = +b.dataset.c;
      $("conf").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      gate();
    });
    $("reveal").onclick = () => {
      const attempt = $("attempt").value;
      if (!n.grade) { $("ans").hidden = false; $("reveal").disabled = true; $("attempt").readOnly = true; return; }
      const g = DULTA.grade(n.grade, attempt, n.check);
      lastResult = { key, attempt, confidence: pendingConfidence, ...g, snap: null, overridden: false };
      lastResult.snap = DULTA.record(key, n.kind, g.correct, pendingConfidence, { auto: true });  // re-renders via dulta:state
    };
    if ($("right")) $("right").onclick = () => DULTA.record(key, n.kind, true, pendingConfidence);
    if ($("wrong")) $("wrong").onclick = () => DULTA.record(key, n.kind, false, pendingConfidence);
    if (lastResult && lastResult.key === key) showResult(n);
    if ($("forget")) $("forget").onclick = () => DULTA.unmaster(key);
    $("detail").querySelectorAll("[data-go]").forEach((b) => b.onclick = () => go(b.dataset.go));
    history.replaceState(null, "", `#${key}`);
  }

  // After an auto-graded attempt: the attempt stays visible, with the verdict, the key and a dispute link.
  function showResult(n) {
    const r = lastResult;
    $("attempt").value = r.attempt; $("attempt").readOnly = true;
    $("conf").querySelectorAll("button").forEach((b) => { b.setAttribute("aria-pressed", +b.dataset.c === r.confidence); b.disabled = true; });
    $("reveal").hidden = true;
    $("ans").hidden = false;
    $("verdict").innerHTML = `<div class="verdict-box ${r.correct ? "ok" : "no"}" role="status">
      <b>${r.correct ? "✓ Correct" : "✗ Not yet"}</b> <span>${r.correct ? "Recorded as mastered" : esc(r.reason) + ". Recorded for review"}${r.overridden ? " (your override)" : ""} · you said ${r.confidence}% sure</span></div>`;
    $("ansActions").innerHTML = `<button class="btn small" id="again" type="button">Try another node</button>
      <button class="btn small ghost" id="dispute" type="button">${r.overridden ? "Undo my override" : r.correct ? "I was actually wrong" : "The grader got this wrong"}</button>`;
    $("again").onclick = () => { lastResult = null; const fr = DULTA.frontier(D, mapId).find((k) => k !== n.key); go(fr || n.key); };
    $("dispute").onclick = () => {
      r.correct = !r.correct; r.overridden = !r.overridden;
      r.snap = DULTA.amend(r.snap, r.correct);
    };
  }

  function go(key) { if (!lastResult || lastResult.key !== key) lastResult = null; detail(key); draw(); }

  // Tabs grouped by field, so 17 maps stay scannable.
  $("tabs").innerHTML = (D.fields || [null]).map((f) => {
    const ms = D.maps.filter((m) => !f || m.field === f);
    return ms.length ? `<div class="tabgroup"><span class="eyebrow">${esc(f || "Maps")}</span><div>${ms.map((m) => `<button role="tab" type="button" data-id="${m.id}" style="--accent:var(--${m.id})">${esc(m.title)}</button>`).join("")}</div></div>` : "";
  }).join("");
  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    mapId = b.dataset.id; selected = null; history.replaceState(null, "", `#${mapId}`); draw();
  });
  $("graphBox").addEventListener("click", (e) => { const g = e.target.closest(".gnode"); if (g) go(g.dataset.key); });
  $("graphBox").addEventListener("keydown", (e) => {
    const g = e.target.closest(".gnode");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(g.dataset.key); $("detail").focus(); }
  });
  $("detail").tabIndex = -1;
  document.addEventListener("dulta:state", () => { draw(); if (selected) detail(selected); });

  // Search across every map: label first, then summary and check text.
  const q = $("q"), list = $("qResults");
  let hits = [], cursor = -1;
  function search() {
    const term = q.value.trim().toLowerCase();
    if (term.length < 2) { list.hidden = true; q.setAttribute("aria-expanded", "false"); return; }
    const score = (n) => n.label.toLowerCase().includes(term) ? 0 : (n.summary + " " + n.check).toLowerCase().includes(term) ? 1 : 2;
    hits = D.nodes.filter((n) => score(n) < 2).sort((a, b) => score(a) - score(b)).slice(0, 10);
    cursor = -1;
    list.innerHTML = hits.length ? hits.map((n, i) => `<li role="option" id="qr${i}" data-key="${n.key}" aria-selected="false" style="--accent-m:var(--${n.map})">
      <i>${esc(D.maps.find((m) => m.id === n.map).title)} · ${n.kind}</i><b>${esc(n.label)}</b><span>${esc(n.summary.slice(0, 90))}${n.summary.length > 90 ? "…" : ""}</span></li>`).join("")
      : `<li aria-disabled="true"><span>No node matches “${esc(q.value.trim())}”.</span></li>`;
    list.hidden = false; q.setAttribute("aria-expanded", "true");
  }
  function pick(key) { list.hidden = true; q.setAttribute("aria-expanded", "false"); q.value = ""; go(key); $("detail").focus(); }
  q.addEventListener("input", search);
  q.addEventListener("keydown", (e) => {
    if (list.hidden || !hits.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      cursor = (cursor + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length;
      list.querySelectorAll("li").forEach((li, i) => li.setAttribute("aria-selected", i === cursor));
      q.setAttribute("aria-activedescendant", `qr${cursor}`);
    } else if (e.key === "Enter") { e.preventDefault(); pick(hits[Math.max(cursor, 0)].key); }
    else if (e.key === "Escape") { list.hidden = true; q.setAttribute("aria-expanded", "false"); }
  });
  list.addEventListener("click", (e) => { const li = e.target.closest("li[data-key]"); if (li) pick(li.dataset.key); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".search")) list.hidden = true; });

  const hash = decodeURIComponent(location.hash.slice(1));
  if (byKey[hash]) { mapId = byKey[hash].map; detail(hash); }
  else if (D.maps.some((m) => m.id === hash)) mapId = hash;
  draw();
})();

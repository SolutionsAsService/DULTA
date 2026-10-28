"""DULTA command line: validate and render the domain maps, compute a learner's
frontier, compute normalized gain, audit course alignment, and collect panel
verdicts.

    python scripts/dulta.py validate
    python scripts/dulta.py render
    python scripts/dulta.py frontier --state learner.json [--map physics] [--today 2026-10-28]
    python scripts/dulta.py gain --pre 42 --post 71 [--max 100]
    python scripts/dulta.py align course.json
    python scripts/dulta.py panel <panel_dir> <seat> [<seat> ...]

The maps in maps/*.json are the single source of truth. `render` derives the
Mermaid references and the site's data file from them; never edit those by hand.
"""
import argparse
import datetime as dt
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAPS = ROOT / "maps"
KINDS = {"concept", "threshold", "misconception"}
NODE_FIELDS = ("id", "label", "kind", "summary", "outcome", "check", "answer")
LEITNER_DAYS = (1, 3, 7, 16, 35)  # review interval for box 0..4
MIN_WORDS = 20  # a verdict names an anchor and points at the work


def load_maps():
    maps = {}
    for path in sorted(MAPS.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        maps[data["id"]] = data
    return maps


def qualify(map_id, ref):
    return ref if "/" in ref else f"{map_id}/{ref}"


def global_graph(maps):
    """Every node keyed 'map/id', every edge with qualified endpoints."""
    nodes, edges = {}, []
    for mid, m in maps.items():
        for n in m["nodes"]:
            nodes[f"{mid}/{n['id']}"] = dict(n, map=mid)
        for e in m["edges"]:
            edges.append({
                "from": qualify(mid, e["from"]),
                "to": qualify(mid, e["to"]),
                "type": e.get("type", "prereq"),
                "map": mid,
            })
    return nodes, edges


def prereqs_of(edges):
    pre = {}
    for e in edges:
        if e["type"] == "prereq":
            pre.setdefault(e["to"], []).append(e["from"])
    return pre


def depths(nodes, edges):
    """Longest prerequisite chain to each node; misconceptions sit beside their target."""
    pre = prereqs_of(edges)
    memo = {}

    def depth(k, trail=()):
        if k in memo:
            return memo[k]
        if k in trail:
            raise ValueError("prerequisite cycle: " + " -> ".join(trail + (k,)))
        ps = [p for p in pre.get(k, []) if p.split("/")[0] == k.split("/")[0]]
        memo[k] = 0 if not ps else 1 + max(depth(p, trail + (k,)) for p in ps)
        return memo[k]

    out = {k: depth(k) for k in nodes if nodes[k]["kind"] != "misconception"}
    for e in edges:
        if e["type"] == "counter":
            out[e["from"]] = out.get(e["to"], 0)
    return out


def cmd_validate(_args):
    maps = load_maps()
    nodes, edges = global_graph(maps)
    errors = []
    seen = set()
    for mid, m in maps.items():
        for field in ("title", "accent", "summary", "nodes", "edges"):
            if field not in m:
                errors.append(f"{mid}: missing {field}")
        for n in m["nodes"]:
            key = f"{mid}/{n['id']}"
            if key in seen:
                errors.append(f"{key}: duplicate id")
            seen.add(key)
            for field in NODE_FIELDS:
                if not n.get(field):
                    errors.append(f"{key}: missing {field}")
            if n.get("kind") not in KINDS:
                errors.append(f"{key}: kind must be one of {sorted(KINDS)}")
    for e in edges:
        for end in ("from", "to"):
            if e[end] not in nodes:
                errors.append(f"{e['map']}: edge {e['from']} -> {e['to']}: unknown {end}")
        if e["type"] == "counter" and nodes.get(e["from"], {}).get("kind") != "misconception":
            errors.append(f"{e['from']}: counter edges must start at a misconception")
    for k, n in nodes.items():
        if n["kind"] == "misconception" and not any(e["from"] == k for e in edges):
            errors.append(f"{k}: misconception is not attached to any concept")
    if not errors:
        try:
            depths(nodes, edges)
        except ValueError as exc:
            errors.append(str(exc))
    counts = {mid: len(m["nodes"]) for mid, m in maps.items()}
    print(f"maps: {len(maps)}  nodes: {len(nodes)}  edges: {len(edges)}  {counts}")
    for err in errors:
        print("ERROR", err)
    print("OK" if not errors else f"{len(errors)} error(s)")
    return 1 if errors else 0


def mermaid(mid, m, nodes, edges):
    lines = ["```mermaid", "flowchart LR"]
    local = [k for k in nodes if k.startswith(mid + "/")]
    external = sorted({e["from"] for e in edges if e["map"] == mid and not e["from"].startswith(mid + "/")})
    mid_of = lambda k: k.replace("/", "__").replace("-", "_")
    for k in local:
        n = nodes[k]
        label = n["label"].replace('"', "#quot;")
        lines.append(f'  {mid_of(k)}["{label}"]:::{n["kind"]}')
    for k in external:
        label = nodes[k]["label"].replace('"', "#quot;")
        lines.append(f'  {mid_of(k)}["{label} ({nodes[k]["map"]})"]:::external')
    for e in edges:
        if e["map"] != mid:
            continue
        arrow = "-.->|misconception about|" if e["type"] == "counter" else "-->"
        lines.append(f"  {mid_of(e['from'])} {arrow} {mid_of(e['to'])}")
    lines += [
        "  classDef concept fill:#f1f3f5,stroke:#495057,color:#111827",
        "  classDef threshold fill:#fff3bf,stroke:#e67700,stroke-width:3px,color:#111827",
        "  classDef misconception fill:#ffe3e3,stroke:#c92a2a,stroke-dasharray:4,color:#111827",
        "  classDef external fill:#e7f5ff,stroke:#1971c2,color:#111827",
        "  classDef mastered fill:#d3f9d8,stroke:#2b8a3e,color:#111827",
        "  classDef frontier fill:#ffffff,stroke:#111827,stroke-width:3px,color:#111827",
        "```",
    ]
    return "\n".join(lines)


def cmd_render(_args):
    if cmd_validate(_args):
        return 1
    maps = load_maps()
    nodes, edges = global_graph(maps)
    d = depths(nodes, edges)
    out_dir = ROOT / "references" / "maps"
    out_dir.mkdir(parents=True, exist_ok=True)
    for mid, m in maps.items():
        body = [
            f"# {m['title']} map",
            "",
            "_Generated by `python scripts/dulta.py render` from "
            f"`maps/{mid}.json`. Edit the JSON, not this file._",
            "",
            m["summary"],
            "",
            "Solid arrows: prerequisite (A grounds B). Dotted arrows: a misconception that blocks the concept it points at. "
            "Thick amber nodes are threshold concepts (Meyer & Land): transformative, troublesome, irreversible.",
            "",
            mermaid(mid, m, nodes, edges),
            "",
            "| Node | Kind | Outcome | Retrieval check |",
            "|---|---|---|---|",
        ]
        for n in m["nodes"]:
            body.append(f"| `{n['id']}` {n['label']} | {n['kind']} | {n['outcome']} | {n['check']} |")
        body += ["", "Sources: " + "; ".join(m.get("sources", []))]
        (out_dir / f"{mid}.md").write_text("\n".join(body) + "\n", encoding="utf-8")
    payload = {
        "maps": [{k: m[k] for k in ("id", "title", "accent", "summary", "sources")} for m in maps.values()],
        "nodes": [dict(n, key=k, depth=d.get(k, 0)) for k, n in nodes.items()],
        "edges": edges,
    }
    graph_md = (ROOT / "references" / "anchor-graph.md").read_text(encoding="utf-8")
    anchor_graph = graph_md.split("```mermaid", 1)[1].split("```", 1)[0].strip()
    site = ROOT / "site" / "assets" / "maps-data.js"
    site.write_text(
        "// Generated by `python scripts/dulta.py render` from maps/*.json and\n"
        "// references/anchor-graph.md. Do not edit.\n"
        "window.DULTA_MAPS = " + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n"
        "window.DULTA_ANCHOR_GRAPH = " + json.dumps(anchor_graph, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"wrote {len(maps)} references/maps/*.md and {site.relative_to(ROOT)}")
    return 0


def cmd_frontier(args):
    """The learner frontier is Knowledge Space Theory's outer fringe: every node
    not yet mastered whose prerequisites all are. Misconceptions attached to the
    fringe or to mastered nodes are probes; mastered nodes past their Leitner
    interval are REOPENED for review."""
    maps = load_maps()
    nodes, edges = global_graph(maps)
    state = json.loads(pathlib.Path(args.state).read_text(encoding="utf-8"))
    mastered = state.get("mastered", {})
    probed = set(state.get("probed", []))
    today = dt.date.fromisoformat(args.today) if args.today else dt.date.today()
    pre = prereqs_of(edges)
    in_scope = lambda k: not args.map or k.startswith(args.map + "/")

    fringe = [
        k for k, n in nodes.items()
        if in_scope(k) and n["kind"] != "misconception" and k not in mastered
        and all(p in mastered for p in pre.get(k, []))
    ]
    near = set(fringe) | set(mastered)
    probes = [
        e["from"] for e in edges
        if e["type"] == "counter" and e["to"] in near and e["from"] not in probed and in_scope(e["from"])
    ]
    reviews = []
    for k, rec in mastered.items():
        if not in_scope(k) or k not in nodes:
            continue
        box = min(int(rec.get("box", 0)), len(LEITNER_DAYS) - 1)
        due = dt.date.fromisoformat(rec["date"]) + dt.timedelta(days=LEITNER_DAYS[box])
        if due <= today:
            reviews.append((k, due.isoformat(), box))

    # Threshold concepts first: they reorganise what comes after them.
    fringe.sort(key=lambda k: (nodes[k]["kind"] != "threshold", k))
    print("## Frontier")
    print("| Candidate | Reached via | Kind | Status |")
    print("|---|---|---|---|")
    for k, due, box in reviews:
        print(f"| {k} | review due {due} (box {box}) | {nodes[k]['kind']} | REOPENED |")
    for k in probes:
        print(f"| {k} | misconception, dotted edge | misconception | OPEN (probe) |")
    for k in fringe:
        via = ", ".join(pre.get(k, [])) or "no prerequisites"
        print(f"| {k} | prerequisites met: {via} | {nodes[k]['kind']} | OPEN |")
    total = sum(1 for k, n in nodes.items() if in_scope(k) and n["kind"] != "misconception")
    done = sum(1 for k in mastered if in_scope(k) and k in nodes)
    print(f"\nmastered {done}/{total}; frontier {len(fringe)}; probes {len(probes)}; reviews due {len(reviews)}")
    return 0


def cmd_gain(args):
    """Hake's normalized gain <g> = (post - pre) / (max - pre)."""
    if args.pre >= args.max:
        print("pre-test is at ceiling; normalized gain is undefined")
        return 1
    g = (args.post - args.pre) / (args.max - args.pre)
    band = "high" if g >= 0.7 else "medium" if g >= 0.3 else "low"
    print(f"<g> = ({args.post} - {args.pre}) / ({args.max} - {args.pre}) = {g:.3f}  ({band}-g; Hake 1998: "
          "traditional courses averaged 0.23, interactive engagement 0.48)")
    return 0


def cmd_align(args):
    """Constructive alignment audit (Biggs): every outcome needs at least one
    activity and one assessment, and every activity and assessment must serve
    an outcome."""
    course = json.loads(pathlib.Path(args.course).read_text(encoding="utf-8"))
    outcomes = course.get("outcomes", [])
    ids = {o["id"] for o in outcomes}
    holes = 0
    print("| Outcome | Activities | Assessments | Aligned |")
    print("|---|---|---|---|")
    for o in outcomes:
        acts, tests = o.get("activities", []), o.get("assessments", [])
        ok = bool(acts) and bool(tests)
        holes += not ok
        print(f"| {o['id']}: {o.get('text', '')} | {len(acts)} | {len(tests)} | {'yes' if ok else 'NO'} |")
    orphans = [a for a in course.get("activities", []) + course.get("assessments", [])
               if not set(a.get("serves", [])) & ids]
    for a in orphans:
        print(f"ORPHAN {a['id']}: serves no stated outcome")
    print(f"\noutcomes {len(outcomes)}; unaligned {holes}; orphans {len(orphans)}")
    return 1 if holes or orphans else 0


def cmd_panel(args):
    panel = pathlib.Path(args.panel_dir)
    missing, empty = [], []
    for seat in args.seats:
        f = panel / f"{seat}.md"
        if not f.exists():
            missing.append(seat)
        elif len(f.read_text(encoding="utf-8").split()) < MIN_WORDS:
            empty.append(seat)
        else:
            print(f"REPORTED {seat}")
    for seat in missing:
        print(f"MISSING  {seat}")
    for seat in empty:
        print(f"EMPTY    {seat} (fewer than {MIN_WORDS} words; not a verdict)")
    return 1 if missing or empty else 0


def main(argv=None):
    p = argparse.ArgumentParser(prog="dulta", description=__doc__.split("\n\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("validate")
    sub.add_parser("render")
    f = sub.add_parser("frontier")
    f.add_argument("--state", required=True)
    f.add_argument("--map")
    f.add_argument("--today")
    g = sub.add_parser("gain")
    g.add_argument("--pre", type=float, required=True)
    g.add_argument("--post", type=float, required=True)
    g.add_argument("--max", type=float, default=100.0)
    a = sub.add_parser("align")
    a.add_argument("course")
    pn = sub.add_parser("panel")
    pn.add_argument("panel_dir")
    pn.add_argument("seats", nargs="+")
    args = p.parse_args(argv)
    return {"validate": cmd_validate, "render": cmd_render, "frontier": cmd_frontier,
            "gain": cmd_gain, "align": cmd_align, "panel": cmd_panel}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())

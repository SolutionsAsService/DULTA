# LEARNING-LOG: DULTA's own catalogue (expansion plan)

**Status: Lite run, incomplete by request.** The user stopped the full run for cost before the R0 panel. No panel seat
was convened, so no Panel Report exists and S2/S3 are not met. This log records the diagnosis and the plan it led to.
Resume point: convene R0 (seats below) on `audit-pre.md` and the site as it stands after this commit.

## 1. Traversal Plan

- Brief: plan the expansion of DULTA's subjects (DevOps and other STEM careers), labs and tests, and improve DULTA from what the run finds.
- Mode: **Directed Teaching**, because the artifact is instruction (the catalogue) rather than a learner in conversation.
- Learner: **both**. The maps teach people on the site and agents through `quiz` and the cold-start protocol.
- Domain map: the catalogue itself (`maps/*.json`), measured with the new `python scripts/dulta.py audit`.
- Tooling: map, Frontier and audit via `dulta.py`; workflow state via the app's plan tool; browser pane for render checks; panel: subagent tool available, **not used** (cost stop).
- Seed (verbatim): Stance `Experience and Education (John Dewey)` | Rules `Constructive Alignment (John Biggs)` → `Understanding by Design (Grant Wiggins, Jay McTighe)` → `Inside the Black Box: Formative Assessment (Paul Black, Dylan Wiliam)` | Breaker `Threshold Concepts (Jan Meyer, Ray Land)` | Counterpoint `Pedagogy of the Oppressed (Paulo Freire)` (dotted edge to Constructive Alignment).
- Planned R0 seats (not convened): Biggs, Wiggins, Hake, Wieman, hooks, Rose, Ericsson, Zheng, Liu.

### Diagnosis (pre-test): `python scripts/dulta.py audit`, saved in `audit-pre.md`

| Finding | Value | Why it matters |
|---|---|---|
| Maps without any lab | 4 of 10 (chemistry, biology, mechanical, agents) | Outcomes without an activity break constructive alignment |
| Auto-gradable checks | 0 of 209 | Every human check is self-graded ("I was right"), the bias the agent protocol forbids |
| Check variants | 0 | Spaced reviews repeat the same item, so recall of the answer passes (Goodhart) |
| Thresholds without a misconception probe | 12 | S5 cannot be met on those nodes |
| Outcome levels | apply 107, create 22, understand 21, analyse 12, evaluate 6, remember 1 | Few analyse/evaluate outcomes; S4 has little room |
| Career tracks | 0 | The catalogue has subjects but no path from a subject to a job |

## Frontier
| Candidate | Reached via | Kind | Status |
|---|---|---|---|
| Career tracks across maps, with a page on the site | audit: 0 tracks; Dewey (experience) | Cross | TAKEN (M1) |
| DevOps map | user brief; developer map outgoing edges (shell, git, http, testing) | Consolidate | TAKEN (M2) |
| Search across 200+ nodes | site usability at 11 maps | Consolidate | TAKEN (M3) |
| Auto-gradable checks (`grade` field: numeric or choice) | audit: 0; Black & Wiliam | Cross | DEFERRED (data for 200+ nodes; next run) |
| Check variants (`variants` field) | audit: 0; Goodhart's Law | Consolidate | DEFERRED (next run) |
| Labs for chemistry, biology, mechanical, agents | audit: 4 maps without labs | Consolidate | DEFERRED (titration, Hardy–Weinberg drift, beam deflection, cold-start simulator) |
| Misconceptions for 12 unprobed thresholds | audit | Consolidate | DEFERRED |
| More STEM maps: statistics and data science, civil, aerospace, robotics, cybersecurity, environmental science | user brief | Consolidate | DEFERRED (one per run, each with a lab) |
| R0 and R1 panels | workflow | — | DEFERRED (cost stop by the user) |

## 2. Decision Records

## Move M1: Career tracks  (Cross)
Node: catalogue (new layer `tracks/*.json`)   Depends on: none
Anchors: Stance Experience and Education (John Dewey) | Rule Constructive Alignment (John Biggs) | Breaker Threshold Concepts (Jan Meyer, Ray Land) | Counterpoint Pedagogy of the Oppressed (Paulo Freire) (dotted edge to Constructive Alignment)
Intent: a learner picks a career and sees the ordered nodes, across maps, that the job needs, with progress and the next node.
Formal argument: Claim, a track gives every map an outcome a learner already wants. Grounds, the audit shows 0 tracks and maps that mostly feed each other. Warrant, outcomes stated first (Wiggins & McTighe) and experience-anchored learning (Dewey) raise relevance without adding content.
Alternatives rejected: a career field on each node (scatters one path across 11 files); free-text career pages (not computable, so progress cannot be shown).
Load: 1 new concept (a track = ordered node list + capstone).
Consequence: tracks must be validated against node ids, or they rot when maps change.
Fence: Freire's objection, pre-set paths can become banking; tracks are offered, never imposed, and the map stays fully open.
Frontier effect: capstone labs per track; track-level pre/post tests.
Exit test: `dulta.py validate` checks every track node exists; the Careers page shows each track's progress computed from `learner.json`.

## Move M2: DevOps map  (Consolidate)
Node: new map `devops`   Depends on: none
Anchors: Rule Understanding by Design (Grant Wiggins, Jay McTighe) | Breaker Threshold Concepts (Jan Meyer, Ray Land)
Intent: a learner can build, ship and operate software reliably: containers, CI, infrastructure as code, observability, incident response.
Formal argument: the developer map stops at code review; DevOps is the most-requested next step and links to existing nodes (shell, git, testing, http, security, concurrency).
Alternatives rejected: fold DevOps into the developer map (too large for one view); a cloud-vendor map (vendor-specific, ages fast).
Load: per node as in the map; thresholds marked.
Consequence: no lab yet (deferred: pipeline-repair lab).
Fence: none broken.
Frontier effect: DevOps/SRE track (M1), pipeline lab.
Exit test: `dulta.py validate` OK; every node has an outcome, a check and an answer.

## Move M3: Search on the map explorer  (Consolidate)
Node: site   Depends on: M2 (more nodes)
Anchors: Rule Inside the Black Box: Formative Assessment (Paul Black, Dylan Wiliam)
Intent: find any node by name across all maps and open it.
Alternatives rejected: a separate search page (an extra hop); browser find (misses other maps).
Load: 0 for content.
Exit test: typing a term lists matches from every map; choosing one opens it in its map.

## 3. Panel Reports

None. The run was stopped for cost before R0. No verdict is reconstructed.

## 4. Anchor and Map Ledger
| Anchor or node | Role | Status | Evidence | Note |
|---|---|---|---|---|
| Experience and Education (John Dewey) | Stance | KEEP (untested by panel) | M1 | |
| Constructive Alignment (John Biggs) | Rule | KEEP (untested by panel) | audit rows on labs | 4 maps unaligned |
| Understanding by Design (Grant Wiggins, Jay McTighe) | Rule | KEEP (untested by panel) | M1, M2 | |
| Inside the Black Box: Formative Assessment (Paul Black, Dylan Wiliam) | Rule | KEEP (untested by panel) | audit: 0 auto-gradable | drives the deferred `grade` field |
| Threshold Concepts (Jan Meyer, Ray Land) | Breaker | KEEP (untested by panel) | audit: 12 unprobed | |
| Pedagogy of the Oppressed (Paulo Freire) | Counterpoint | applied | M1 fence | tracks are optional |

## 5. Compliance Check
- [x] Tooling inventory (Traversal Plan)
- [x] Mode and learner stated
- [x] Diagnosis before the first move (`audit-pre.md`)
- [x] Seed with exact labels and a dotted counterpoint
- [x] At least one Cross (M1)
- [x] Decision Record before each move
- [ ] Panel Reports: **skipped by request (cost)**
- [ ] WHOLE rounds, S1–S5: **not met**; S1 has DEFERRED items with reasons, S2 and S3 need a panel, S4 and S5 not attempted
- [x] Figures re-measured at final state (`audit-post.md`)
- [ ] Double loop: one amendment only, below

## Graph amendments
- Add an `audit` row to the skill's tooling table (done in this commit): a catalogue can be pre/post-tested like a course.
- Next: a `grade` field so the site can score checks itself instead of trusting "I was right".

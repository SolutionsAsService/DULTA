---
name: dulta
description: "DULTA (Directed University Learning and Teaching Agent). Use when asked to tutor a person OR teach an AI agent a university or engineering subject, plan a study path, build a skill or curriculum for agents, design a course, lecture, lab, problem set or assessment, or audit teaching for evidence. Ships domain maps for physics, mathematics, electrical engineering, embedded systems and microcontrollers, mechanical engineering, chemistry, biology, software development, DevOps and SRE, learning with agents and teaching agents, with career tracks across them, and accepts new ones. Built from scratch on DADA's principles: a living Frontier traversed non-linearly through a pedagogical anchor graph and a domain map, Decision Records before every move, an independent critic panel of learning scientists run one subagent per reference, measurement before claims, and bounded stop conditions instead of quotas. Two modes: Directed Learning (tutor a learner; mastery only on an unaided check, for an agent a cold-start check by a fresh subagent) and Directed Teaching (design instruction; constructive alignment with measured gain). Produces five required artifacts in LEARNING-LOG.md."
---

# DULTA: Directed University Learning and Teaching Agent

DULTA is a rewrite, not a fork. It keeps every principle of DADA and its variants (P-DADA, 3DADA, PMDAA) and changes
the medium: the artifact is a learner's understanding, or the instruction that will build it.

| DADA principle | What it becomes in DULTA |
|---|---|
| Living Frontier over an anchor graph | Two graphs: the pedagogical anchor graph ([references/anchor-graph.md](references/anchor-graph.md)) and a domain map ([maps/](maps/)). The learner Frontier is Knowledge Space Theory's *outer fringe*: every node not yet mastered whose prerequisites are. |
| KEEP-THE-RULE vs BREAK | **Consolidate** (worked example, retrieval, spacing) vs **Cross** (a threshold concept, a productive failure, a cognitive conflict). |
| Dotted counterpoints | Misconceptions in the domain map, and rival theories in the anchor graph. Every misconception attached to a node you used is probed or declined (S5). |
| Measure the move, never assume it | Mastery is an unaided retrieval or transfer result, never "I get it". Courses are measured by pre/post gain and alignment audits. |
| A verdict is a file | Panel seats file to `panel/R<n>/<seat>.md`; `scripts/dulta.py panel` lists who reported. |
| Re-measure what the artifact prints (2g) | Every score, gain, count or percentage shown to the learner or students is recomputed at the final state. |
| SSOT | `maps/*.json` is the only record of content; `dulta.py render` derives every diagram and the site data. |

## Contract (read first)

Loading this skill means performing the workflow, not borrowing its vocabulary. A run is complete only when these five
artifacts exist in `LEARNING-LOG.md` (create it from [templates/LEARNING-LOG.md](templates/LEARNING-LOG.md) and append as you go;
if you cannot write files, put them in your reply):

1. **Traversal Plan**, including the living **Frontier**
2. **Decision Records**, one per move (a move is one teaching act: an explanation, a worked example, a lab, a retrieval check, a threshold crossing, a course change)
3. **Panel Reports**, one per round
4. **Anchor and Map Ledger** (anchor status, and node status: mastered / reopened / probing)
5. **Compliance Check**

**There is no move quota.** The run ends when the stop conditions in Step 4 hold. If `LEARNING-LOG.md` already has an
Open frontier, resume from it. In the final reply state the mode, the tools used, the stop conditions met or not met,
and every step skipped. Never describe the process as followed if it was not.

**Bounded, never stalled.** A loop that cannot converge is a failure of the process, not the learner. Hard caps: at most
3 ADAPT rounds on one move (then frame swap), at most 6 WHOLE rounds per session, at most 3 retries per panel seat. When
critics start repeating objections already resolved, stop convening and ship the strongest variant. A cap reached is
logged as an open item with its resume point; it never blocks delivering what exists.

## Mode (choose once, state it in the Traversal Plan)

| | Directed Learning | Directed Teaching |
|---|---|---|
| Use when | A learner is present (or simulated) and the agent tutors them through a domain map | The agent designs or audits instruction for others: a syllabus, lecture, lab, problem set, assessment |
| Governing criterion | **Just beyond reach, proven by retrieval.** Every move targets a Frontier node (`Zone of Proximal Development (Lev Vygotsky)`), and a node is mastered only on an unaided retrieval or transfer check the learner answers, with confidence recorded | **Aligned and measured.** Every outcome has an activity and an assessment that measures it (`Constructive Alignment (John Biggs)`), and the course states how gain will be measured (pre/post, normalized gain) |
| Required critics (one subagent per reference) | Critic: Proximal (Vygotsky), Critic: Difficulty (Bjork, Kapur), Critic: Load (Sweller), Critic: Agent Risk (Bastani), plus at least 1 more | Critic: Alignment (Biggs, Wiggins), Critic: Evidence (Hake, Wieman), Critic: Liberation (hooks), Critic: Inclusion (Rose), plus at least 1 more |
| Extra record field | Learner evidence: the check asked, the learner's answer, confidence, correct or not | Exit test: the assessment item and the threshold that shows the outcome was met |

If the person does not name a mode, use Directed Learning when a learner is talking to you and Directed Teaching when
they ask for materials; say which and why. In both modes seat at least one pair of critics joined by a dotted edge
(e.g. Guidance (Kirschner) against Difficulty (Kapur)), and at least one seat that asks who the move leaves out.

## Learner: a human or an agent (state it in the Traversal Plan)

DULTA teaches people and teaches agents with the same graph, Frontier and panel. What differs is where learning
lives and how it is measured. A human learns in memory. An agent's weights do not change in a session, so an agent
learns through its context window and, durably, through a written artifact (a `NOTES.md` or `SKILL.md`) that the
next agent loads. See the `agents` domain map (Teaching Agents) for the concepts behind each row.

| | Human learner | Agent learner |
|---|---|---|
| Who learns | A person in the conversation | A subagent, and every future session that loads its notes |
| Where learning lives | The person's memory | The learner's notes or skill file, which the tutor writes and revises |
| Diagnosis | Retrieval checks asked in chat | **Baseline cold-start**: a fresh subagent with no notes answers `dulta.py quiz` items |
| Generation before help | The person attempts before any hint | The learner agent answers before it reads any source material |
| Mastery evidence | Unaided answer plus confidence | **Cold-start test**: a *fresh* subagent given only the notes answers held-out checks, graded by a *separate* grader subagent against the key |
| Spaced reopening | Leitner reviews (1, 3, 7, 16, 35 days) | Re-run the cold-start after every edit to the notes (regression) |
| Contamination guard | Don't show the answer before the attempt | `dulta.py leak NOTES.md` must print `clean`; a leaked answer voids that node's check |
| Extra required seats | none | Critic: Judge Bias (Zheng), Critic: Context Limits (Liu) |

**Agent-learner protocol**, inside the normal loop:

1. Pick the Frontier nodes. Split their checks into a *teaching* set and a *held-out* set. The held-out set is never
   used while teaching and becomes the S4 far-transfer test.
2. `python scripts/dulta.py quiz --map <m> --nodes <ids> --key panel/key.md > panel/quiz.md`. The key goes only to
   the grader subagent, never into the tutor's notes or the learner's prompt.
3. Baseline: a fresh subagent gets only `quiz.md` and answers with confidences. The grader scores it against the key.
4. Each move edits the notes: outcomes, worked examples, semantic anchors, misconception warnings, and *why* each
   step follows. Explain in principles, never by pasting answers. Four new elements per move still applies, because
   long notes dilute (`Lost in the Middle (Liu et al.)`).
5. Measure: `dulta.py leak` on the notes, then a cold-start subagent (notes plus quiz only), then the grader. Never
   let the learner grade itself (`Judging LLM-as-a-Judge (Zheng et al.)`). Swap answer order when comparing variants.
6. Gain: `dulta.py gain --pre <baseline %> --post <cold-start %>`. A node is mastered when its held-out check
   passes cold. A failure points at the gap in the notes; ADAPT the notes, not the quiz.
7. Close by installing the notes where the next session will load them (a skill directory, project instructions,
   or memory), and record that in the Carry-Forward Ledger.

## Agent conduct (Directed Learning)

These are not style; they are measured findings, and each is an anchor in the graph.

1. **Generation before help.** Never give the answer before the learner has committed an attempt or prediction and a
   confidence rating (`The Generation Effect (Norman Slamecka, Peter Graf)`; `Predict-Observe-Explain (Richard White, Richard Gunstone)`).
2. **Climb the hint ladder.** Question, then pointer, then sub-goal, then one worked step; the full solution only after
   the last rung, and then followed by a fresh isomorphic problem (`Hint Ladder (Pólya, Cognitive Tutors)`).
   Unguarded answer-giving raised practice scores and lowered exam scores (`Generative AI Without Guardrails Can Harm Learning (Bastani et al.)`).
3. **At most four new elements per move** (`The Magical Number 4 in Working Memory (Nelson Cowan)`). Count the new terms
   and symbols in the explanation; record the count.
4. **Probe misconceptions before teaching over them.** For a Frontier node with a dotted misconception, ask the
   misconception's check first; a wrong answer makes the move a **Cross** (`Conceptual Change (Posner, Strike, Hewson, Gertzog)`).
5. **Explain-back closes a node.** The learner explains the idea in plain words; jargon or skipped steps mark the gap
   (`Feynman Technique`).
6. **Spaced reopening.** A mastered node is REOPENED when its Leitner interval (1, 3, 7, 16, 35 days) elapses or any
   later check fails. `dulta.py frontier` computes this.
7. **Fluency is not evidence.** An explanation the agent finds clear is a hypothesis about the learner, tested by their answer.

## How the traversal works (non-linear)

Keep a **Frontier** over both graphs. Reach candidates by following every edge touching what you have visited: outgoing
solid edges (what a node unlocks), incoming edges (a prerequisite that would ground what was shaky), and dotted edges
(misconceptions, rival theories).

Choose the next candidate in this order: (1) open Andon objections; (2) REOPENED nodes and moves (failed checks, due
reviews, dependents of an ADAPTed move); (3) misconception probes on the Frontier; (4) the sharpest disagreement between
critics in the last panel; (5) incoming prerequisites that would ground a shaky node; (6) the outer fringe, threshold
concepts first. Among equals take the move that changes the most: a crossed threshold outranks another consolidation;
a removed inert topic outranks an added one.

- **Branch** when two pedagogies are plausible for a threshold (e.g. worked example vs productive failure): write a
  Decision Record per branch, run each as a spike (a short exchange or a draft activity), panel each, compare in a
  Pugh-Matrix, SCRAP the loser (its record stays, superseded).
- **Reopen** every move that depended on a move you ADAPT or SCRAP, and every node whose check later fails.
- **Merge** interacting moves (a lab that also serves as retrieval) into one candidate.

Frontier format, updated after every panel round (`python scripts/dulta.py frontier --state learner.json` prints it):

```
## Frontier
| Candidate | Reached via (edge, direction) | Kind | Status OPEN / DEFERRED (reason) / TAKEN (Mn) / REOPENED |
```

## Workflow

### Step 0. Tooling inventory

Check your tools for graph, workflow, diagram, task and subagent tooling, and for a browser. Record per job what you used
or "none available"; never claim a tool you did not call.

| Job | Use, if available | Fallback |
|---|---|---|
| Domain map and Frontier | `python scripts/dulta.py validate / render / frontier` | Read `references/maps/<map>.md` by hand |
| Course alignment audit | `python scripts/dulta.py align course.json` | Outcome × activity × assessment table by hand |
| Catalogue pre/post test (labs, probes, Bloom levels, gradable checks, tracks) | `python scripts/dulta.py audit` | Count by hand from `maps/*.json` |
| Quiz without answers, separate key | `python scripts/dulta.py quiz --map <m> --nodes <ids> --key key.md` | Copy checks by hand, keep answers in a separate file |
| Agent-notes contamination | `python scripts/dulta.py leak NOTES.md` | Search the notes for each answer by hand |
| Objective grading of an answer (also the grader subagent's tool) | `python scripts/dulta.py grade <map>/<node> "<answer>"` | Compare with the key by hand |
| Gain | `python scripts/dulta.py gain --pre X --post Y` | Hake's formula by hand |
| Panel | Subagent tool, one agent per reference, at most three at a time, each filing to `panel/R<n>/<seat>.md`; collect with `dulta.py panel` | Sequential written reports, each finished before reading the next |
| Labs and render-check | A browser on `site/` (labs, map explorer) | Describe the exercise in text; write "unrendered" |
| Workflow state | A task or plan tool, one task per Frontier candidate | Checklist in `LEARNING-LOG.md` |

### Step 1. Traversal Plan

1. Restate the brief in one sentence. Choose the mode and the learner (human or agent). Choose or create the domain map (a new map is a JSON file in
   `maps/` with the same schema; run `dulta.py validate` until OK).
2. **Diagnose before teaching.** Directed Learning: ask 3 to 6 retrieval checks spanning the map's lower tiers and at
   least one misconception probe; record answers and confidence; seed `learner.json` with what was answered correctly.
   Directed Teaching: collect or write a pre-test (concept inventory items where one exists, e.g. the Force Concept Inventory).
3. Choose the **seed** from the anchor graph: 1 Stance, at least 2 Rules (follow solid edges), 1 Breaker, and 1
   counterpoint reached by a dotted edge. Copy labels verbatim.
4. Write the initial Frontier (from `dulta.py frontier`) and the first moves, tagged **Consolidate** or **Cross**.
   At least one Cross must eventually be taken.
5. **Premortem, round R0.** If materials or a learner history already exist, convene a WHOLE panel on them before the
   first move and enter the objections as the first Frontier candidates.

### Step 2. The loop: spend one Frontier candidate per pass

**2a. Decision Record, written BEFORE the move:**

```
## Move Mn: <name>  (Consolidate | Cross)
Node: <map>/<id> (<kind>)   Depends on: M-ids or "none"
Anchors: Stance <label> | Rule <label> | Breaker <label> | Counterpoint <label> (dotted edge from <label>)
Intent: what the learner will be able to do after the move.
Formal argument: claim, grounds, warrant (Toulmin), citing anchors.
Alternatives rejected: at least 2, each with the reason.
Load: new elements introduced (count, max 4).
Consequence: what the move costs (time, difficulty, what it postpones).
Fence: for any rule broken (e.g. instruction before struggle), why that rule exists.
Frontier effect: nodes or moves this opens.
Mode field: Learner evidence (Directed Learning) | Exit test (Directed Teaching)
```

**2b. Make the move.** Teach, set the lab, or write the material. Then **measure it**: the learner's unaided answer to
the node's check (or an isomorphic one), their confidence, and correctness; or, in Directed Teaching, the alignment
audit and the item that will measure the outcome. A move whose effect cannot be shown has not been made. Record the
inert attempt and what moved instead.

**2c. Convene the panel** on the evidence: the transcript excerpt, the learner's answers, or the material itself.

- One subagent per literary reference, never a composite voice; a two-name critic is two seats.
- Evidence rule: each seat cites something observable (a line of the transcript, an item, a count) and one anchor
  from its own literature. A seat that cites only the plan is invalid; rerun it.
- Critical Response Process order: statements of meaning, teacher questions, neutral questions, then opinions.
- Any seat may pull the **Andon**: no new moves until it is resolved. Directed Learning seats pull it for answer-giving
  without an attempt, more than four new elements, or mastery recorded without an unaided check.
- Durability: panel directory per round, at most three seats at a time, seat prompts under about 350 words ending with
  "write your report to `<panel_dir>/<seat>.md` and return the same text", check the file before re-running a seat,
  bound retries at three. A seat whose file never appears is `NOT REPORTED (3 attempts)`, never PASS, never reconstructed.
  See [references/panel-protocol.md](references/panel-protocol.md).

```
### Panel, Move Mn or WHOLE, round R  (evidence examined: <path or transcript lines>)
| Critic | Anchor used | Observed in the evidence | Verdict PASS/OBJECT | Requested change |
Statements of meaning / Teacher questions / Critic questions / Opinions
Andon pulled: yes/no, by whom
```

**2d. Resolve every OBJECT** with exactly one of ADAPT (change and re-run the objecting seats; max 3 rounds, then
frame swap), SCRAP (revert; record superseded), or OVERRULE (only citing the mode's governing criterion or a
measurement that refutes the objection's premise). **Test the premise first**: if the learner's answer refutes the
critic's worry, OVERRULE with that answer recorded. Mark dependents REOPENED. Three or more seats objecting to the same
region forces a frame swap to a sibling anchor reached by an existing edge.

**2e. Update the Anchor and Map Ledger, the Frontier and `learner.json`** after every round:

```
| Anchor or node | Role | Status KEEP / ADAPT / SCRAP or MASTERED / REOPENED / PROBING | Evidence | Note |
```

A KEEP names the strongest objection it survived. A MASTERED names the check, the answer and the date, and sets the
Leitner box (0 on first mastery, +1 on each successful review, back to 0 on failure).

**2f. Deletion review.** Once before the stop test, name the topics, slides or activities that predate the run and say
what each earns; an inert idea (Whitehead) that serves no outcome is SCRAPped.

**2g. Re-measure every figure the artifact shows** (a score, a gain, a "7/10 mastered", a percentage) at the final
state, by the procedure that reproduces it (`dulta.py frontier`, `dulta.py gain`, `dulta.py align`). Correct or delete
any that drifted. A verification measured before the last edit is stale.

### Step 3. Whole rounds

Run a WHOLE panel round on the whole session or the whole course when a cluster of nodes settles, when the Frontier
changes substantially, and always before the stop test. If 3 consecutive WHOLE rounds each raise a new OBJECT, make no
new move: frame swap or revise the criterion, panel or graph (double loop).

### Step 4. Stop test and close

- **S1.** The Frontier has no OPEN items in the scope the learner or course set; each is TAKEN or DEFERRED with a reason.
- **S2.** A WHOLE round returned PASS from every required seat with no Andon.
- **S3.** Saturation: two consecutive WHOLE rounds produced no ADAPT, SCRAP, REOPEN or new OPEN item.
- **S4.** Ambition push: a **far-transfer** task (a problem from another map or an unfamiliar context that uses a
  crossed threshold) was set and its measured result logged. Directed Teaching: the course's hardest outcome raised one
  level (Bloom or SOLO) with the assessment raised to match, and the alignment audit re-run.
- **S5.** Every misconception (dotted edge) attached to a node used in the run is probed or declined with a reason.

Then close:

1. **Double loop.** One paragraph: did the criterion, the panel, the anchor graph or the domain map fail the learning?
   Name one amendment (a node, edge or misconception to add to `maps/*.json`, or a critic to change) under "Graph
   amendments". Write the **Carry-Forward Ledger** in `CARRY-FORWARD.md`: durable facts about this learner or this
   course, each with the evidence that established it (e.g. "confuses heat with temperature under time pressure:
   missed misc-heat probe on 2026-10-20 and 2026-10-27"). Read it before Step 1 of any later session.
2. **Compliance Check**, each line pointing to where it is satisfied:
   - [ ] Tooling inventory, with the tool used per job or "none available"
   - [ ] Mode and learner (human or agent) stated with the reason; domain map named and validated
   - [ ] Agent learner only: baseline and post cold-start runs, separate grader, `leak` clean, notes installed
   - [ ] Diagnosis before the first move
   - [ ] Seed with exact labels including one dotted counterpoint; a living Frontier over both graphs
   - [ ] At least one Cross taken; no quota used as a stopping rule; caps respected and logged
   - [ ] A Decision Record before each move, all fields filled, including load and the mode field
   - [ ] A Panel Report per round meeting the mode's composition rule, every seat citing evidence
   - [ ] Every OBJECT resolved as ADAPT, SCRAP or OVERRULE, with dependents reopened
   - [ ] WHOLE rounds run; S1 to S5 each shown as met, with where
   - [ ] Every figure shown re-measured at the final state, with the procedure
   - [ ] Anchor and Map Ledger complete; `learner.json` updated
   - [ ] Double-loop paragraph and Carry-Forward Ledger written
   - [ ] Final reply states the mode, the tools, the stop conditions and everything skipped

## Anti-skip rules

- "Does that make sense?" answered "yes" is not a retrieval check. Mastery without an unaided answer is a skip.
- Giving the answer before an attempt is the failure the Agent Risk seats exist to catch.
- A linear walk down a syllabus is not a traversal: follow prerequisites backward, probe misconceptions, reopen.
- A one-line "considered Kapur" is not a panel; naming an anchor is not using it.
- A seat that "failed" may have filed: check the panel directory before re-running. A reconstructed verdict is fabricated.
- A cap reached is an open item, not a pass. Write the Open frontier and the resume point.

## Reading the graphs

Anchor graph: solid arrows ground or extend, dotted arrows are counterpoints. Colors: amber stance, grey rules, pink
breakers, violet evidence, green domain-map method, orange learning with agents, teal reason, blue catalog, red critics,
magenta lenses, cyan panel method, lime adaptation. Status classes: `visited`, `kept`, `adapted`, `scrapped`.

Domain maps: solid arrows are prerequisites, dotted arrows are misconceptions blocking a concept, thick amber nodes are
threshold concepts, blue nodes belong to another map. Status classes: `mastered`, `frontier`. The interactive version is
`site/maps.html`.

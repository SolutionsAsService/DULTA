# DultA: Directed University Learning and Teaching Agent

An agent skill for teaching **people and AI agents**, written from scratch on the principles of
[DADA](https://github.com/AnEntrypoint/dada) and its variants (P-DADA, 3DADA, PMDAA). Like DADA, it
works through a living Frontier of an anchor graph, writes a Decision Record before every move, runs an
independent critic panel with one subagent per literary reference, measures before it claims anything, and
stops on stop conditions rather than a quota. What it works on is a learner's understanding, or the teaching
that will build it.

- **[SKILL.md](SKILL.md)**: the agent contract and workflow. Two modes, *Directed Learning* (tutor a learner;
  a node counts as mastered only after an unaided answer) and *Directed Teaching* (design instruction; constructive
  alignment with measured gain).
- **[references/anchor-graph.md](references/anchor-graph.md)**: the pedagogy anchor graph. Learning sciences,
  threshold-crossing practices, discipline-based education research, learning and teaching with agents, 34 critic seats.
- **[maps/](maps/)**: domain maps as JSON, the single source of truth. Physics, Mathematics,
  Electrical Engineering, Embedded Systems (microcontrollers), Mechanical Engineering, Chemistry, Biology,
  Developer, DevOps & SRE, Machine Learning & AI, Game Development, Plant Science & Genetics, Robotics & Agricultural
  Robotics, Telecommunications, Quantum Computing, Civil & Structural, Aerospace, Environmental Science & Engineering,
  Geoscience, Learning with Agents and Teaching Agents, plus two language fields: **Programming Languages** (concepts,
  systems & hardware, web, data & scientific, application & mobile, functional & logic) and **World Languages** (how
  languages work, Romance, Germanic & Slavic, East & Southeast Asian, Middle Eastern, South Asian & African; 25
  languages). 32 maps in seven fields, 512 nodes, every check auto-graded in any script.
- **[tracks/careers.json](tracks/careers.json)**: 31 career tracks in seven fields, including full-stack, systems,
  mobile, compiler and hardware-design engineers, translator, language teacher and computational linguist, and among them civil and structural,
  aerospace, environmental, climate scientist, geoscientist, AI/ML engineer, data scientist, game developer, DevOps/SRE, robotics, telecoms, embedded, quantum researcher, plant geneticist and
  agricultural robotics engineer; each an ordered path across maps with labs and a capstone. Each node carries an outcome, a retrieval check and an answer.
  Misconceptions hang off the concepts they block as dotted edges, and threshold concepts are flagged.
- **[scripts/dulta.py](scripts/dulta.py)**: standard-library CLI used by the skill.
- **[site/](site/)**: the website. Interactive map explorer with your learner frontier, six
  Predict-Observe-Explain labs, and the method.

## Install the skill

Copy (or symlink) this folder to your skills directory as `dulta`:

```bash
git clone https://github.com/SolutionsAsService/DULTA ~/.claude/skills/dulta
```

Then ask your agent to "use dulta to tutor me through mechanics", "use dulta to design week 3 of PHYS 101",
or "use dulta to teach a subagent embedded debouncing and prove it with a cold-start test".

## Humans and agents

The same maps, frontier and panel serve both learners. A person learns in memory: mastery is an unaided answer
with a confidence rating. An agent learns through its context and through notes written for the next agent:
mastery is a **cold-start test**. A fresh subagent, given only the notes (never the answer key), passes held-out
checks graded by a separate agent. `quiz` keeps keys apart and `leak` checks the notes for contamination.

## Command line

```bash
python scripts/dulta.py validate                       # check every map and track: ids, edges, cycles, fields
python scripts/dulta.py audit                          # catalogue coverage: labs, probes, Bloom levels, tracks
python scripts/dulta.py render                         # maps -> references/maps/*.md + site/assets/maps-data.js
python scripts/dulta.py frontier --state examples/learner.json --map physics --today 2026-10-28
python scripts/dulta.py quiz --map embedded --nodes gpio,timing --key key.md  # checks only; key apart
python scripts/dulta.py leak NOTES.md                  # did answers leak into an agent's notes?
python scripts/dulta.py grade physics/energy "9.9 m/s" # auto-grade an answer (same rules as the site)
python scripts/dulta.py gain --pre 42 --post 71        # Hake normalized gain
python scripts/dulta.py align examples/course.json     # constructive-alignment audit
python scripts/dulta.py panel panel/R1 vygotsky bjork  # which panel seats filed a verdict
```

`frontier` computes Knowledge Space Theory's outer fringe (nodes not yet mastered whose prerequisites all are),
the misconception probes to run, and the mastered nodes due for spaced review (Leitner intervals 1, 3, 7, 16, 35 days).

## The website

The site is static and needs no build step. Serve it locally:

```bash
python -m http.server 8765 --directory site
```

- **Maps** draws each domain map as a layered graph. Open a node, write your attempt at its check, rate your
  confidence, and the site **grades it automatically** (numbers with tolerance, key ideas, code patterns); a
  disputed grade can be overridden and is logged as such. A correct answer marks the node mastered and lights up the next
  frontier. Progress stays in your browser and exports as a `learner.json` the CLI reads.
- **Labs** (25, filterable by field; every map and every career track has one): a truss bridge, a catchment
  water-flow model, a glider flight simulator, an orbit-transfer optimiser, a river water-quality monitor, a two-box
  climate model, earthquake location, titration (chemistry), genetic drift
  (biology), beam bending (mechanical), CI pipeline and git bisect (DevOps), an agent cold-start simulator, overfitting (ML), A* pathfinding (games and robotics), QAM and noise (telecoms),
  qubit gates (quantum), selective breeding with the breeder's equation (plant genetics), a simulated microcontroller (blink without blocking, debounce a bouncing button, software PWM,
  on an oscilloscope, against real DDRB/PORTB/PINB registers), an RC circuit, projectile (with and without drag), pendulum (where the small-angle formula breaks down), Fourier
  synthesis (the Gibbs overshoot), test-first code (each kata has a hidden test that the visible tests miss),
  complexity (measured operation counts on log-log axes), and retrieval with a calibration chart.
- **Method**: the DADA-to-DultA mapping, the five artifacts, the stop conditions, the critic pairs that
  disagree, and the anchor graph rendered live.

## Adding a domain map

Create `maps/<id>.json` with `id`, `title`, `accent`, `summary`, `sources`, `nodes` and `edges`. Each node needs
`id`, `label`, `kind` (`concept` | `threshold` | `misconception`), `summary`, `outcome`, `check` and `answer`, and
optionally `lab`. An edge is `{"from", "to"}` for a prerequisite, or adds `"type": "counter"` for a misconception.
Prefix an id with `<map>/` to point into another map. Run `validate`, then `render`, and add an accent colour
variable named after the map id in `site/assets/style.css`.

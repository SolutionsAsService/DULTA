# Panel protocol: no verdict is lost

Subagent transports drop connections. A seat can finish its work and lose its verdict on the way back, and the caller
sees only "failed". DULTA assumes this will happen and makes the verdict survive it.

## The rule

**A verdict is a file, not a return value.** A seat has reported when `panel/R<n>/<seat>.md` exists with at least 20
words. Nothing else counts.

## The caller

1. Make the round's directory before launching anything: `panel/R1/`, `panel/R2/`, … It is the round's state; a
   restarted session lists it instead of re-running seats.
2. Launch at most three seats at a time.
3. Keep each seat prompt under about 350 words: the seat, its one text, the evidence pointer (a file of transcript
   excerpts, learner answers or the material, never a paraphrase), and the output fields below.
4. End every prompt with: *Write your report to `<absolute panel_dir>/<seat>.md` as your last action, then return the
   same text.*
5. Before re-running a seat that appeared to fail, check for its file.
6. Retry a seat at most three times. Then record it `NOT REPORTED (3 attempts, transport failure)`; the round is
   incomplete, never passed.
7. Collect with `python scripts/dulta.py panel panel/R1 <seat> <seat> ...` and only then write the Panel Report.

## The seat prompt

```
You are <Critic: Difficulty (Kapur)>, arguing only from <Productive Failure (Manu Kapur)>.
Mode: <Directed Learning | Directed Teaching>. Governing criterion: <...>.
Evidence: read <absolute path to evidence file>.
Return, in this order:
1. Statement of meaning: what this move seems to teach.
2. One neutral question.
3. Observed: quote one line, answer or item from the evidence.
4. Verdict: PASS or OBJECT, with the anchor from your text that grounds it.
5. Requested change (if OBJECT), concrete enough to act on.
6. Andon: yes/no, and why.
Write your report to <panel_dir>/<seat>.md as your last action, then return the same text.
```

## Independence

Seats never see each other's verdicts in the same round. Disagreement between dotted-edge pairs (Guidance against
Difficulty, Load against Difficulty, Alignment against Liberation) is the point of the panel, not a defect to smooth.

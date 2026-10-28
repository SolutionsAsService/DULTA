## Anchor graph

The pedagogical anchor graph DULTA traverses. It is DADA's structure rebuilt for learning and teaching: stance, rules
(the learning sciences the work must master), breakers (practices that break the lecture to cross a threshold),
evidence, the domain-map method, learning with agents, reason, the catalog of reused semantic anchors, the critics
and their lenses, the panel method, and adaptation. Copy labels exactly; every label in a record must occur verbatim here.

The **domain maps** (`maps/*.json`, rendered to `references/maps/*.md`) are a second graph of the *content*. This graph
is about the *pedagogy* of each move; the domain map is about *what* the move teaches. A Decision Record cites both.

```mermaid
flowchart LR
  subgraph STANCE["Stance: Why Learn, Why Teach"]
    dewey["Experience and Education (John Dewey)"]:::stance
    freire["Pedagogy of the Oppressed (Paulo Freire)"]:::stance
    hooks["Teaching to Transgress (bell hooks)"]:::stance
    papertM["Mindstorms (Seymour Papert)"]:::stance
    whitehead["The Aims of Education (Alfred North Whitehead)"]:::stance
    ranciere["The Ignorant Schoolmaster (Jacques Rancière)"]:::stance
    brunerP["The Process of Education (Jerome Bruner)"]:::stance
    feynmanL["The Feynman Lectures on Physics (Richard Feynman)"]:::stance
    illich["Deschooling Society (Ivan Illich)"]:::stance
  end
  subgraph RULES["Rules: The Learning Sciences to Master First"]
    zpd["Zone of Proximal Development (Lev Vygotsky)"]:::rules
    scaffold["Scaffolding (Wood, Bruner, Ross)"]:::rules
    clt["Cognitive Load Theory (John Sweller)"]:::rules
    worked["Worked-Example Effect (Sweller, Cooper)"]:::rules
    mayer["Multimedia Learning (Richard Mayer)"]:::rules
    cowan["The Magical Number 4 in Working Memory (Nelson Cowan)"]:::rules
    bloom["Bloom's Taxonomy, revised (Anderson, Krathwohl)"]:::rules
    solo["SOLO Taxonomy (John Biggs, Kevin Collis)"]:::rules
    align["Constructive Alignment (John Biggs)"]:::rules
    ubd["Understanding by Design (Grant Wiggins, Jay McTighe)"]:::rules
    testing["The Testing Effect (Henry Roediger, Jeffrey Karpicke)"]:::rules
    spacing["The Spacing Effect (Hermann Ebbinghaus)"]:::rules
    interleave["Interleaved Practice (Doug Rohrer)"]:::rules
    desirable["Desirable Difficulties (Robert Bjork, Elizabeth Bjork)"]:::rules
    stick["Make It Stick (Brown, Roediger, McDaniel)"]:::rules
    hpl["How People Learn (Bransford, Brown, Cocking)"]:::rules
    hlw["How Learning Works (Ambrose et al.)"]:::rules
    mastery["Mastery Learning and the 2 Sigma Problem (Benjamin Bloom)"]:::rules
    deliberate["Deliberate Practice (K. Anders Ericsson)"]:::rules
    blackbox["Inside the Black Box: Formative Assessment (Paul Black, Dylan Wiliam)"]:::rules
    selfexp["Self-Explanation Effect (Michelene Chi)"]:::rules
    icap["ICAP Framework (Michelene Chi, Ruth Wylie)"]:::rules
    udl["Universal Design for Learning (David Rose, CAST)"]:::rules
  end
  subgraph BREAK["Breakers: Practices That Break the Lecture"]
    threshold["Threshold Concepts (Jan Meyer, Ray Land)"]:::break
    productive["Productive Failure (Manu Kapur)"]:::break
    conflict["Conceptual Change (Posner, Strike, Hewson, Gertzog)"]:::break
    poe["Predict-Observe-Explain (Richard White, Richard Gunstone)"]:::break
    peer["Peer Instruction (Eric Mazur)"]:::break
    modeling["Modeling Instruction (David Hestenes)"]:::break
    isle["Investigative Science Learning Environment (Eugenia Etkina)"]:::break
    pbl["Problem-Based Learning (Howard Barrows)"]:::break
    construct["Constructionism (Seymour Papert, Idit Harel)"]:::break
    socratic["Socratic Elenchus (Plato, Meno)"]:::break
    confusion["Confusion Can Be Beneficial (Sidney D'Mello)"]:::break
    flipped["Flipped Classroom (Bergmann, Sams)"]:::break
  end
  subgraph EVIDENCE["Evidence: Discipline-Based Education Research"]
    fci["Force Concept Inventory (Hestenes, Wells, Swackhamer)"]:::evidence
    hake["Interactive-Engagement versus Traditional Methods (Richard Hake)"]:::evidence
    freeman["Active Learning Increases Student Performance (Freeman et al.)"]:::evidence
    wieman["Improving How Universities Teach Science (Carl Wieman)"]:::evidence
    duboulay["Some Difficulties of Learning to Program (Benedict du Boulay)"]:::evidence
    sorva["Notional Machines in Introductory Programming (Juha Sorva)"]:::evidence
    tallvinner["Concept Image and Concept Definition (David Tall, Shlomo Vinner)"]:::evidence
    kirschner["Why Minimal Guidance During Instruction Does Not Work (Kirschner, Sweller, Clark)"]:::evidence
    pashler["Learning Styles: Concepts and Evidence (Pashler et al.)"]:::evidence
    dunlosky["Improving Students' Learning with Effective Techniques (Dunlosky et al.)"]:::evidence
    steele["Whistling Vivaldi: Stereotype Threat (Claude Steele)"]:::evidence
  end
  subgraph MAPS["Domain Maps: Knowledge as a Graph"]
    kst["Knowledge Space Theory (Jean-Paul Doignon, Jean-Claude Falmagne)"]:::maps
    novak["Concept Maps (Joseph Novak)"]:::maps
    ausubel["Meaningful Learning: Assimilation Theory (David Ausubel)"]:::maps
    gagne["Learning Hierarchies (Robert Gagné)"]:::maps
    polya["How to Solve It (George Pólya)"]:::maps
    sicp["Structure and Interpretation of Computer Programs (Abelson, Sussman)"]:::maps
    spiral["The Spiral Curriculum (Jerome Bruner)"]:::maps
  end
  subgraph AGENTS["Learning with Agents"]
    tutoring["The Relative Effectiveness of Human Tutoring (Kurt VanLehn)"]:::agents
    cogtutor["Cognitive Tutors (John Anderson, Albert Corbett, Kenneth Koedinger)"]:::agents
    bkt["Bayesian Knowledge Tracing (Albert Corbett, John Anderson)"]:::agents
    generation["The Generation Effect (Norman Slamecka, Peter Graf)"]:::agents
    bastani["Generative AI Without Guardrails Can Harm Learning (Bastani et al.)"]:::agents
    hintladder["Hint Ladder (Pólya, Cognitive Tutors)"]:::agents
    mollick["Co-Intelligence (Ethan Mollick)"]:::agents
    calibration["Calibration of Confidence (Koriat, Dunlosky)"]:::agents
    fewshot["Language Models are Few-Shot Learners (Brown et al.)"]:::agents
    lostmiddle["Lost in the Middle (Liu et al.)"]:::agents
    llmjudge["Judging LLM-as-a-Judge (Zheng et al.)"]:::agents
    semanchors["Semantic Anchors (LLM Coding catalog)"]:::agents
    coldstart["Cold-Start Test (DULTA)"]:::agents
  end
  subgraph REASON["Reason: Rationale for Every Move"]
    schon["The Reflective Practitioner (Donald Schön)"]:::reason
    brookfield["Becoming a Critically Reflective Teacher (Stephen Brookfield)"]:::reason
    kolb["Experiential Learning Cycle (David Kolb)"]:::reason
    toulmin["The Uses of Argument (Stephen Toulmin)"]:::reason
    shulman["Pedagogical Content Knowledge (Lee Shulman)"]:::reason
    lave["Situated Learning: Legitimate Peripheral Participation (Jean Lave, Etienne Wenger)"]:::reason
    collins["Cognitive Apprenticeship (Collins, Brown, Newman)"]:::reason
  end
  subgraph CAT["Semantic Anchors Catalog (existing, reused)"]
    c_feynman["Feynman Technique"]:::catalog
    c_socr["Socratic Method"]:::catalog
    c_bloom["Bloom's Taxonomy"]:::catalog
    c_zpd["Zone of Proximal Development"]:::catalog
    c_dreyfus["Dreyfus Model of Skill Acquisition"]:::catalog
    c_curse["Curse of Knowledge"]:::catalog
    c_prog["Progressive Disclosure"]:::catalog
    c_diat["Diátaxis Framework"]:::catalog
    c_chest["Chesterton's Fence"]:::catalog
    c_premortem["Premortem"]:::catalog
    c_pugh["Pugh-Matrix"]:::catalog
    c_spike["Spike Solution"]:::catalog
    c_andon["Andon"]:::catalog
    c_jidoka["Jidoka"]:::catalog
    c_pdca["PDCA"]:::catalog
    c_goodhart["Goodhart's Law"]:::catalog
    c_dod["Definition of Done"]:::catalog
    c_adr["ADR according to Nygard"]:::catalog
    c_ssot["SSOT (Single Source of Truth)"]:::catalog
    c_first["First Principles Thinking"]:::catalog
    c_mutation["Mutation Testing"]:::catalog
  end
  subgraph CRITICS["Critics: A Panel Divided by Theory of Learning"]
    crit_prox_vygotsky["Critic: Proximal (Vygotsky)"]:::critic
    crit_prox_bruner["Critic: Proximal (Bruner)"]:::critic
    crit_load_sweller["Critic: Load (Sweller)"]:::critic
    crit_load_mayer["Critic: Load (Mayer)"]:::critic
    crit_diff_bjork["Critic: Difficulty (Bjork)"]:::critic
    crit_diff_kapur["Critic: Difficulty (Kapur)"]:::critic
    crit_ret_roediger["Critic: Retrieval (Roediger)"]:::critic
    crit_ret_karpicke["Critic: Retrieval (Karpicke)"]:::critic
    crit_align_biggs["Critic: Alignment (Biggs)"]:::critic
    crit_align_wiggins["Critic: Alignment (Wiggins)"]:::critic
    crit_evid_hake["Critic: Evidence (Hake)"]:::critic
    crit_evid_wieman["Critic: Evidence (Wieman)"]:::critic
    crit_change_hestenes["Critic: Conceptual Change (Hestenes)"]:::critic
    crit_change_posner["Critic: Conceptual Change (Posner)"]:::critic
    crit_lib_freire["Critic: Liberation (Freire)"]:::critic
    crit_lib_hooks["Critic: Liberation (hooks)"]:::critic
    crit_inc_rose["Critic: Inclusion (Rose)"]:::critic
    crit_inc_steele["Critic: Inclusion (Steele)"]:::critic
    crit_exp_ericsson["Critic: Expertise (Ericsson)"]:::critic
    crit_exp_dreyfus["Critic: Expertise (Dreyfus)"]:::critic
    crit_guide_kirschner["Critic: Guidance (Kirschner)"]:::critic
    crit_guide_clark["Critic: Guidance (Clark)"]:::critic
    crit_make_papert["Critic: Making (Papert)"]:::critic
    crit_make_resnick["Critic: Making (Resnick)"]:::critic
    crit_clar_feynman["Critic: Clarity (Feynman)"]:::critic
    crit_clar_polya["Critic: Clarity (Pólya)"]:::critic
    crit_eng_chi["Critic: Engagement (Chi)"]:::critic
    crit_eng_mazur["Critic: Engagement (Mazur)"]:::critic
    crit_agent_bastani["Critic: Agent Risk (Bastani)"]:::critic
    crit_agent_vanlehn["Critic: Agent Risk (VanLehn)"]:::critic
    crit_meta_whitehead["Critic: Inert Ideas (Whitehead)"]:::critic
    crit_meta_ranciere["Critic: Emancipation (Rancière)"]:::critic
    crit_judge_zheng["Critic: Judge Bias (Zheng)"]:::critic
    crit_ctx_liu["Critic: Context Limits (Liu)"]:::critic
  end
  subgraph LENSES["Lenses: Each Critic's Own Literature"]
    vygotskyMS["Mind in Society (Lev Vygotsky)"]:::lens
    brunerC["Toward a Theory of Instruction (Jerome Bruner)"]:::lens
    ericssonP["Peak (K. Anders Ericsson, Robert Pool)"]:::lens
    resnickL["Lifelong Kindergarten (Mitchel Resnick)"]:::lens
    mazurPI["Peer Instruction: A User's Manual (Eric Mazur)"]:::lens
    clarkE["Evidence-Based Training Methods (Ruth Colvin Clark)"]:::lens
    dreyfusM["Mind over Machine (Hubert Dreyfus, Stuart Dreyfus)"]:::lens
  end
  subgraph PANEL["Panel Method: Convening Diverse Judges"]
    lerman["Critical Response Process (Liz Lerman, John Borstel)"]:::panel
    surowiecki["The Wisdom of Crowds (James Surowiecki)"]:::panel
    page["The Difference (Scott E. Page)"]:::panel
    brookfieldL["Four Lenses of Critical Reflection (Stephen Brookfield)"]:::panel
  end
  subgraph ADAPT["Adaptation: How the Graph Rewrites Itself"]
    popper["Conjectures and Refutations (Karl Popper)"]:::adapt
    kuhn["The Structure of Scientific Revolutions (Thomas Kuhn)"]:::adapt
    argyris["Theory in Practice: Double-Loop Learning (Chris Argyris, Donald Schön)"]:::adapt
    meadows["Thinking in Systems (Donella Meadows)"]:::adapt
  end

  dewey -->|experience as the ground of| kolb
  dewey -->|inquiry precedes| pbl
  freire -.->|banking model refused by| hooks
  hooks -->|engaged pedagogy extends| freire
  freire -.->|problem-posing counters pre-set outcomes of| align
  papertM -->|objects to think with for| construct
  whitehead -->|inert ideas are the failure of| transfer_note
  transfer_note -->|tested only in a context unlike| c_dod
  whitehead -->|use it or lose it for| testing
  ranciere -.->|equality of intelligence counters explication in| worked
  brunerP -->|any subject in honest form for| spiral
  brunerP -->|coined with Wood and Ross| scaffold
  feynmanL -->|plain-words test for| c_feynman
  illich -.->|deschooling questions| mastery
  zpd -->|operationalized as| scaffold
  zpd -->|names| c_zpd
  scaffold -->|faded as| worked
  clt -->|grounds| worked
  clt -->|capacity limit from| cowan
  mayer -->|applies| clt
  cowan -->|new elements per move capped by| clt
  bloom -.->|structural alternative| solo
  bloom -->|names| c_bloom
  solo -->|levels for| align
  align -->|outcomes first, like| ubd
  ubd -->|backward design for| blackbox
  testing -->|popularized in| stick
  spacing -->|popularized in| stick
  interleave -->|popularized in| stick
  desirable -->|explains| interleave
  desirable -->|explains| spacing
  desirable -->|grounds| testing
  hpl -->|synthesis for| hlw
  mastery -->|motivates| tutoring
  deliberate -->|edge of ability, like| zpd
  blackbox -->|feedback loop for| c_pdca
  selfexp -->|constructive mode in| icap
  udl -->|multiple means for| mayer
  threshold -->|transformative and troublesome, beyond| bloom
  threshold -->|located in the domain map by| kst
  productive -.->|counterpoint to| worked
  productive -->|delayed instruction, like| desirable
  conflict -->|anomaly first, like| kuhn
  conflict -->|staged as| poe
  poe -->|commit before observing, like| generation
  peer -->|vote, discuss, revote for| icap
  peer -->|measured by| fci
  modeling -->|built against| fci
  isle -->|observe, explain, test for| poe
  pbl -.->|questioned by| kirschner
  construct -.->|questioned by| kirschner
  socratic -->|question before telling for| c_socr
  socratic -->|productive confusion for| confusion
  flipped -->|frees class time for| peer
  fci -->|scored as gain in| hake
  hake -->|meta-analysed in| freeman
  freeman -->|policy case in| wieman
  duboulay -->|formalized as| sorva
  tallvinner -->|concept image vs definition for| conflict
  kirschner -->|guidance argument from| clt
  kirschner -.->|challenges| productive
  pashler -.->|refutes matching styles; supports| udl
  dunlosky -->|rates retrieval and spacing high, as in| stick
  steele -->|threat raises load, per| clt
  kst -->|outer fringe is the learner frontier for| zpd
  kst -->|engine behind| cogtutor
  novak -->|grounded in| ausubel
  ausubel -->|prior knowledge first for| gagne
  gagne -->|prerequisite hierarchy for| kst
  polya -->|heuristics for| hintladder
  sicp -->|abstraction ladder for| spiral
  spiral -->|revisits nodes like| spacing
  tutoring -->|realized by| cogtutor
  cogtutor -->|learner model from| bkt
  bkt -->|mastery estimate for| mastery
  generation -->|attempt first for| hintladder
  bastani -->|guardrail evidence for| hintladder
  bastani -.->|warns| mollick
  mollick -->|agent as partner for| tutoring
  calibration -->|confidence vs correctness for| blackbox
  fewshot -->|in-context examples, like| worked
  semanchors -->|named methods compress instruction, per| clt
  lostmiddle -.->|long notes dilute; caps context like| cowan
  llmjudge -.->|the learner must not grade itself; grader independent, like| surowiecki
  coldstart -->|retrieval by a fresh agent from notes alone, per| testing
  coldstart -->|outer fringe measured cold, for| kst
  generation -->|agent answers before reading sources, in| coldstart
  crit_judge_zheng -->|checks grader independence with| llmjudge
  crit_ctx_liu -->|checks note length and placement with| lostmiddle
  crit_ctx_liu -.->|shorter notes against| crit_clar_feynman
  crit_judge_zheng -.->|independent grading against| crit_agent_vanlehn
  c_goodhart -.->|do not teach the agent to the| coldstart
  schon -->|reflection-in-action for| c_spike
  schon -->|reflection-on-action for| c_adr
  brookfield -->|four lenses for| brookfieldL
  kolb -->|cycle for| c_pdca
  toulmin -->|claim, grounds, warrant for| c_adr
  shulman -->|content-specific pedagogy for| threshold
  lave -->|peripheral to full participation for| collins
  collins -->|modeling, coaching, fading for| scaffold
  c_dreyfus -->|novice follows rules in| worked
  c_dreyfus -->|expert breaks rules in| productive
  c_chest -->|know why the rule exists before| productive
  c_curse -.->|hazard for| feynmanL
  c_feynman -.->|antidote to| c_curse
  c_prog -->|layered entry for| scaffold
  c_diat -->|tutorial, how-to, reference, explanation for| c_adr
  c_ssot -->|maps/*.json as the one record for| kst
  c_goodhart -.->|do not teach to the| fci
  c_mutation -->|remove a scaffold and see whether learning drops, to test| scaffold
  c_first -->|rebuild from| c_feynman
  crit_prox_vygotsky -->|judges reach with| vygotskyMS
  crit_prox_bruner -->|judges scaffolding with| brunerC
  crit_load_sweller -->|counts elements with| clt
  crit_load_mayer -->|checks modality with| mayer
  crit_diff_bjork -->|checks difficulty with| desirable
  crit_diff_kapur -->|checks struggle with| productive
  crit_ret_roediger -->|checks recall with| testing
  crit_ret_karpicke -->|checks recall with| testing
  crit_align_biggs -->|checks alignment with| align
  crit_align_wiggins -->|checks backward design with| ubd
  crit_evid_hake -->|measures gain with| hake
  crit_evid_wieman -->|measures practice with| wieman
  crit_change_hestenes -->|probes misconceptions with| fci
  crit_change_posner -->|probes dissatisfaction with| conflict
  crit_lib_freire -->|asks whose knowledge with| freire
  crit_lib_hooks -->|asks who is present with| hooks
  crit_inc_rose -->|checks multiple means with| udl
  crit_inc_steele -->|checks threat with| steele
  crit_exp_ericsson -->|checks practice with| ericssonP
  crit_exp_dreyfus -->|checks stage with| dreyfusM
  crit_guide_kirschner -->|demands guidance with| kirschner
  crit_guide_clark -->|demands evidence with| clarkE
  crit_make_papert -->|asks what was built with| papertM
  crit_make_resnick -->|asks what was played with| resnickL
  crit_clar_feynman -->|tests plain words with| c_feynman
  crit_clar_polya -->|tests problem-solving with| polya
  crit_eng_chi -->|classifies engagement with| icap
  crit_eng_mazur -->|tests discussion with| mazurPI
  crit_agent_bastani -->|tests over-reliance with| bastani
  crit_agent_vanlehn -->|tests tutoring granularity with| tutoring
  crit_meta_whitehead -->|hunts inert ideas with| whitehead
  crit_meta_ranciere -->|refuses stultification with| ranciere
  crit_guide_kirschner -.->|full guidance against| crit_diff_kapur
  crit_guide_clark -.->|full guidance against| crit_make_papert
  crit_diff_kapur -.->|struggle first against| crit_load_sweller
  crit_load_sweller -.->|load limit against| crit_diff_bjork
  crit_lib_freire -.->|problem-posing against| crit_align_biggs
  crit_lib_hooks -.->|engaged presence against| crit_evid_hake
  crit_make_resnick -.->|play against| crit_ret_roediger
  crit_meta_ranciere -.->|emancipation against| crit_prox_bruner
  crit_agent_bastani -.->|over-reliance against| crit_agent_vanlehn
  crit_exp_dreyfus -.->|intuition against| crit_clar_polya
  crit_eng_mazur -.->|discussion against| crit_clar_feynman
  page -->|choose critics for maximum cognitive difference| CRITICS
  surowiecki -->|keep judgments independent| CRITICS
  lerman -->|four-step feedback for| CRITICS
  brookfieldL -->|learner, colleague, theory, self lenses for| CRITICS
  CRITICS -->|may pull| c_andon
  c_andon -->|signals| c_jidoka
  c_jidoka -->|stop and fix at the source in| c_adr
  CRITICS -->|object to each move recorded in| c_adr
  popper -->|treat every move as a conjecture to refute, for| CRITICS
  CRITICS -.->|anomalies accumulate into| kuhn
  argyris -->|double loop revises the governing criterion and the panel in| CRITICS
  schon -->|co-author of double loop| argyris
  meadows -->|leverage points for| argyris
  c_pdca -->|check step is the critic round of| CRITICS
  c_goodhart -.->|do not optimize the critic score of| CRITICS
  zpd -->|Directed Learning: governing criterion of| c_adr
  align -->|Directed Teaching: governing criterion of| c_adr
  transfer_note["Far Transfer (Perkins, Salomon)"]:::evidence
  classDef stance fill:#fef3c7,stroke:#b45309,color:#111827
  classDef rules fill:#e5e7eb,stroke:#374151,color:#111827
  classDef break fill:#fce7f3,stroke:#be185d,color:#111827
  classDef evidence fill:#ede9fe,stroke:#6d28d9,color:#111827
  classDef maps fill:#dcfce7,stroke:#15803d,color:#111827
  classDef agents fill:#ffedd5,stroke:#c2410c,color:#111827
  classDef reason fill:#ccfbf1,stroke:#0f766e,color:#111827
  classDef catalog fill:#dbeafe,stroke:#1d4ed8,color:#111827
  classDef critic fill:#fee2e2,stroke:#b91c1c,color:#111827
  classDef lens fill:#fae8ff,stroke:#a21caf,color:#111827
  classDef panel fill:#cffafe,stroke:#0e7490,color:#111827
  classDef adapt fill:#ecfccb,stroke:#4d7c0f,color:#111827
  classDef kept fill:#bbf7d0,stroke:#15803d,color:#111827
  classDef adapted fill:#fde68a,stroke:#b45309,color:#111827
  classDef scrapped fill:#fecaca,stroke:#b91c1c,stroke-dasharray:4,color:#111827
  classDef visited fill:#ffffff,stroke:#111827,stroke-width:3px,color:#111827
```

One seat per authority. A critic named for two thinkers is two seats: "Critic: Difficulty (Bjork, Kapur)" is
`crit_diff_bjork` and `crit_diff_kapur`, each its own subagent arguing from its own text alone. 34 seats, 34 authorities.
Judge Bias (Zheng) and Context Limits (Liu) are required whenever the learner is an agent.
Every critic pair joined by a dotted edge is a live disagreement in the learning sciences (guidance versus struggle,
load versus difficulty, alignment versus problem-posing); seat at least one such pair in every round.

// Polyglot lab: the same expression in twelve languages. Results are the documented behaviour of each
// language's default types (checked against each language's reference), not live execution.
(function () {
  const { poe, esc } = window.DULTA_LAB_KIT;
  const $ = (id) => document.getElementById(id);
  const LANGS = ["Python", "JavaScript", "C", "Java", "Rust", "Go", "Ruby", "Haskell", "R", "Julia", "C#", "SQL (PostgreSQL)"];
  const CASES = {
    div: {
      expr: "7 / 2", target: "3.5", q: "How many of these 12 languages give 3.5 for 7 / 2?",
      res: ["3.5", "3.5", "3", "3", "3", "3", "3", "3.5", "3.5", "3.5", "3", "3"],
      note: ["true division", "all numbers are doubles", "integer division", "int / int", "i32 / i32", "untyped int constants", "Integer#/", "/ is Fractional division", "always double", "/ always floats (÷ for integer)", "int / int", "integer / integer"],
      explain: "Two numbers that look like integers raise the same question everywhere: should '/' keep integers or switch to a fraction? Python 3, JavaScript, Haskell, R and Julia answer 3.5. C, Java, Rust, Go, Ruby, C# and PostgreSQL truncate to 3. Python 2 gave 3, which is why Python 3 split the operators into / and //.",
    },
    float: {
      expr: "0.1 + 0.2 == 0.3", target: "true", q: "How many of these 12 languages say 0.1 + 0.2 == 0.3 is true?",
      res: ["False", "false", "0 (false)", "false", "false", "true", "false", "False", "FALSE", "false", "False", "true"],
      note: ["IEEE 754 double", "IEEE 754 double", "IEEE 754 double", "IEEE 754 double", "f64", "untyped constants are exact", "Float is a double", "Double", "double", "Float64", "double", "numeric literals are exact decimals"],
      explain: "Ten languages say false, because 0.1 and 0.2 have no exact binary form, so the sum is 0.30000000000000004. The two exceptions aren't faster floating point. Go evaluates untyped constant expressions exactly at compile time (assign them to float64 variables first and it says false too), and PostgreSQL treats 0.1 as an exact NUMERIC. Use decimals or a tolerance for money and comparisons.",
    },
    mod: {
      expr: "-7 % 3   (Haskell: mod, R: %%)", target: "2", q: "How many of these 12 languages give 2 (not -1) for the remainder of -7 by 3?",
      res: ["2", "-1", "-1", "-1", "-1", "-1", "2", "2", "2", "-1", "-1", "-1"],
      note: ["floored modulo", "truncated remainder", "truncated (C99)", "truncated", "truncated (rem_euclid gives 2)", "truncated", "floored", "mod is floored (rem gives -1)", "%% is floored", "% is rem (mod() gives 2)", "truncated", "truncated"],
      explain: "Two conventions disagree about negative numbers. Truncated division (C, Java, JavaScript, Rust, Go, C#, SQL) gives a remainder with the sign of the dividend, -1. Floored division (Python, Ruby, Haskell's mod, R's %%) gives a result with the sign of the divisor, 2. This matters for clock arithmetic and array wrap-around: x % n can be negative in C.",
    },
    concat: {
      expr: "\"5\" + 3", target: "\"53\"", q: "How many of these 12 languages give the string \"53\" for \"5\" + 3?",
      res: ["TypeError", "\"53\"", "pointer arithmetic (UB)", "\"53\"", "compile error", "compile error", "TypeError", "type error", "error", "MethodError", "\"53\"", "8"],
      note: ["strong typing", "coerces the number to a string", "\"5\"+3 points past the string", "String concatenation", "no implicit conversion", "mismatched types", "no implicit conversion", "no Num instance for String", "non-numeric argument", "no + for String and Int", "string concatenation", "'5' is coerced to integer"],
      explain: "Only JavaScript, Java and C# turn this into \"53\", each by turning the number into text. PostgreSQL goes the other way and gives 8, because an untyped '5' literal is coerced to an integer. Python, Ruby, Haskell, R, Julia, Rust and Go refuse, at run time or at compile time. C silently does pointer arithmetic, landing past the end of the string. That's undefined behaviour, the worst outcome of all. Strong typing turns this bug into an error.",
    },
    overflow: {
      expr: "2147483647 + 1   (each language's default integer)", target: "-2147483648", q: "How many of these 12 languages silently wrap 2147483647 + 1 to -2147483648?",
      res: ["2147483648", "2147483648", "undefined behaviour", "-2147483648", "panic (debug) / wraps (release)", "2147483648", "2147483648", "2147483648", "2147483648", "2147483648", "compile error", "ERROR: out of range"],
      note: ["arbitrary-precision int", "double", "signed overflow is UB", "32-bit int wraps", "i32 overflow is checked in debug", "int is 64-bit", "arbitrary precision", "Integer is unbounded", "literal is a double", "Int64 by default", "constant overflow (CS0220)", "int4 overflow raises"],
      explain: "Only Java wraps silently here, because its int is 32 bits. Python, Ruby and Haskell use unbounded integers. Go and Julia default to 64-bit integers, and JavaScript and R use doubles, so there is room to spare. Rust panics in debug builds and wraps in release, C makes signed overflow undefined behaviour, C# rejects it at compile time and PostgreSQL raises an error. Overflow bugs have crashed rockets (Ariane 5) and games, so know your integer width.",
    },
  };
  const lab = $("polyglot"); if (!lab) return;
  const sel = $("pgCase");
  sel.innerHTML = Object.entries(CASES).map(([k, c]) => `<option value="${k}">${esc(c.expr)}</option>`).join("");
  function table(show) {
    const c = CASES[sel.value];
    $("pgQ").textContent = c.q;
    $("pgTable").innerHTML = `<table><thead><tr><th>Language</th><th>Result</th><th>Why</th></tr></thead><tbody>${LANGS.map((l, i) => {
      const hit = c.res[i] === c.target || c.res[i].replace(/"/g, "") === c.target.replace(/"/g, "");
      return `<tr${show && hit ? ' style="background:color-mix(in srgb, var(--weblang) 16%, transparent)"' : ""}><td>${esc(l)}</td><td class="mono">${show ? esc(c.res[i]) : "?"}</td><td style="color:var(--muted);font-size:14px">${show ? esc(c.note[i]) : ""}</td></tr>`;
    }).join("")}</tbody></table>`;
  }
  const ctl = poe(lab, {
    guessInput: $("pgGuess"),
    onReset() { table(false); },
    run(g) {
      table(true);
      const c = CASES[sel.value], n = c.res.filter((r) => r === c.target || r.replace(/"/g, "") === c.target.replace(/"/g, "")).length;
      return {
        out: `<span>languages giving ${esc(c.target)}: <b>${n} of ${LANGS.length}</b></span><span>your prediction <b>${Math.round(g)}</b></span>`,
        explain: esc(c.explain),
      };
    },
  });
  sel.addEventListener("change", () => ctl.reset());
  table(false);
})();

// engine.js — the adaptive tutor "brain" for Munafa Tutor (P4).
// 1) Bayesian Knowledge Tracing (BKT) for mastery of each skill
// 2) Automatic question generation from templates (skill × level × format)
// 3) Misconception diagnosis from the learner's exact answer
// 4) Rubric scoring of free-text explanations
// 5) The decision rule: harder question / alternative explanation / prerequisite instruction

// ---------- Skills (knowledge components) ----------
const SKILLS = {
  K1: { name: 'Percent of an amount', short: '% of ₹', prereq: null },
  K2: { name: 'Profit / loss %',      short: 'Profit %', prereq: 'K1' },
  K3: { name: 'Discount & final price', short: 'Discount', prereq: 'K1' }
};
const ORDER = ['K2', 'K3'];          // main path; K1 is the prerequisite
const MASTERED = 0.9;                // skill done
const LEVEL_UP = 0.8;                // decision rule threshold for a harder question
const PREREQ_WEAK = 0.5;             // K1 below this → prerequisite instruction

// ---------- BKT ----------
// P(slip) = 0.1, P(transit) = 0.15; P(guess) depends on the format.
const GUESS = { mcq: 0.25, spot: 0.33, num: 0.15, explain: 0.15, hinted: 0.5 }; // a hinted answer is weaker evidence
function bktUpdate(pL, correct, format) {
  const g = GUESS[format] ?? 0.1, s = 0.1, T = 0.15;
  const post = correct
    ? pL * (1 - s) / (pL * (1 - s) + (1 - pL) * g)
    : pL * s / (pL * s + (1 - pL) * (1 - g));
  return Math.min(0.99, post + (1 - post) * T);
}

// ---------- helpers ----------
const pick = a => a[Math.floor(Math.random() * a.length)];
const r1 = x => Math.round(x * 10) / 10;
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const rs = n => '₹' + n.toLocaleString('en-IN');

// ---------- Question generation ----------
// Every question has: skill, level, format, text, answer, check(input) → bool,
// diag(input) → misconception tag ('M1' | 'M2' | 'P' | null), solution (model answer).
function makeQuestion(skill, level, format, myStall) {
  if (skill === 'K1') return genK1(level, format);
  if (skill === 'K2') return genK2(level, format, myStall);
  return genK3(level, format);
}

// K1: P% of ₹A
function genK1(level, format) {
  const P = pick([[10, 50], [25, 20, 5], [15, 12, 30]][level - 1]);
  const A = pick([[200, 400, 600, 800], [240, 360, 500, 160], [250, 450, 700]][level - 1]);
  const ans = A * P / 100;
  const q = {
    skill: 'K1', level, format, answer: ans, unit: '₹',
    text: `What is ${P}% of ${rs(A)}?`,
    hint: `${P}% means ${P} rupees out of every ₹100.`,
    solution: `${P}% of ${rs(A)} = ${A} ÷ 100 × ${P} = ${rs(ans)}`,
    check: v => near(+v, ans, 0.5),
    diag: v => (near(+v, A * P, 1) || near(+v, A / P, 0.5)) ? 'P' : null
  };
  if (format === 'mcq') q.options = shuffle([ans, A * P, r1(A / P), ans * 2].filter((x, i, a) => a.indexOf(x) === i))
    .map(v => ({ v, t: rs(v) }));
  return q;
}

// K2: profit or loss % (base = cost price)
function genK2(level, format, my) {
  let CP, SP, story;
  if (my && my.CP !== my.SP && level < 3 && Math.random() < 0.5) {
    // personalised: the learner's own numbers from her last market day
    CP = my.CP; SP = my.SP;
    story = `🧺 Your own stall: last market day you spent ${rs(CP)} and sold for ${rs(SP)}.`;
  } else if (level === 1) {
    CP = pick([200, 400, 500]); const p = pick([10, 20, 25, 50]); SP = CP + CP * p / 100;
    story = `The group bought papad for ${rs(CP)} and sold it for ${rs(SP)}.`;
  } else if (level === 2) {
    CP = pick([250, 300, 600, 800]); const p = pick([15, 20, 30, 40]);
    const loss = Math.random() < 0.5; SP = loss ? CP - CP * p / 100 : CP + CP * p / 100;
    story = loss ? `Some papad got damp. Bought for ${rs(CP)}, but sold for only ${rs(SP)}.`
                 : `Pickle jars: bought for ${rs(CP)}, sold for ${rs(SP)}.`;
  } else {
    const n = pick([20, 40, 50]), c = pick([20, 25, 40]), p = pick([10, 20, 25]);
    CP = n * c; SP = n * (c + c * p / 100);
    story = `Bought ${n} packets at ${rs(c)} each. Sold all ${n} at ${rs(c + c * p / 100)} each.`;
  }
  const pr = SP - CP, kind = pr >= 0 ? 'profit' : 'loss', amt = Math.abs(pr);
  const ans = r1(amt / CP * 100), m1 = r1(amt / SP * 100), m2 = amt;
  const q = {
    skill: 'K2', level, format, answer: ans, unit: '%', CP, SP, kind, amt, m1,
    text: `${story} What is the ${kind} %?`,
    hint: `Compare the ${kind} with the money you STARTED with (the cost price).`,
    solution: `${kind[0].toUpperCase() + kind.slice(1)} = ${rs(amt)}. ${kind} % = ${amt} ÷ ${CP} (cost price) × 100 = ${ans}%`,
    check: v => near(+v, ans, 0.6),
    diag: v => near(+v, m1, 0.6) ? 'M1' : near(+v, m2, 0.6) ? 'M2' : null
  };
  if (format === 'mcq') q.options = shuffle([ans, m1, m2, r1(ans + 5)].filter((x, i, a) => a.indexOf(x) === i))
    .map(v => ({ v, t: v + '% ' + kind }));
  if (format === 'spot') {
    q.text = `${story} Shabana worked out the ${kind} %. Tap the step with the mistake.`;
    q.steps = [`Step 1: ${kind} = ${rs(Math.max(SP, CP))} − ${rs(Math.min(SP, CP))} = ${rs(amt)}`,
               `Step 2: ${kind} % = ${amt} ÷ ${SP} × 100 = ${m1}%`,
               `Step 3: So the ${kind} is ${m1}%.`];
    q.answer = 1; q.check = v => +v === 1;
    q.diag = v => +v === 0 ? 'M2' : null; // thinks the amount itself is the problem
    q.solution = `Step 2 divides by the selling price ${rs(SP)}. It must divide by the cost price ${rs(CP)}: ${amt} ÷ ${CP} × 100 = ${ans}%.`;
  }
  if (format === 'explain') {
    q.text = `Lata asks: "We bought for ${rs(CP)} and sold for ${rs(SP)}. How do I find the ${kind} %?" Explain the steps in your own words.`;
    q.check = v => scoreExplanation(v, q).correct;
    q.diag = v => scoreExplanation(v, q).tag;
  }
  return q;
}

// K3: discount and final price
function genK3(level, format) {
  if (level === 3) {
    const MP = pick([400, 500, 600]), d = pick([10, 15]), off = pick([50, 60, 80]);
    const pctPrice = MP - MP * d / 100, rsPrice = MP - off;
    const best = pctPrice < rsPrice ? 'B' : 'A';
    return {
      skill: 'K3', level, format: 'mcq', answer: best, unit: '',
      text: `A wholesaler sells a ${rs(MP)} sack of urad dal. Offer A: ${rs(off)} off. Offer B: ${d}% off. Which offer gives the LOWER price?`,
      hint: `Work out the final price for both offers. ${d}% of ${rs(MP)} is not ${rs(d)}.`,
      solution: `A: ${MP} − ${off} = ${rs(rsPrice)}. B: ${d}% of ${MP} = ${rs(MP * d / 100)}, so ${rs(pctPrice)}. Offer ${best} is lower.`,
      options: [{ v: 'A', t: `Offer A: ${rs(off)} off` }, { v: 'B', t: `Offer B: ${d}% off` }],
      check: v => v === best,
      // choosing the % offer only because "15 > ..." or treating % as ₹ → M2
      diag: v => v !== best ? 'M2' : null
    };
  }
  const MP = pick([[100, 200, 500], [240, 360, 450]][level - 1]);
  const d = pick([[10, 20, 50], [15, 25, 30]][level - 1]);
  const disc = MP * d / 100, ans = MP - disc;
  const q = {
    skill: 'K3', level, format, answer: ans, unit: '₹',
    text: `A papad box is marked ${rs(MP)}. The shop gives ${d}% discount. What is the final price?`,
    hint: `First find ${d}% of ${rs(MP)}, then take it away from ${rs(MP)}.`,
    solution: `Discount = ${d}% of ${MP} = ${rs(disc)}. Final price = ${MP} − ${disc} = ${rs(ans)}`,
    check: v => near(+v, ans, 0.5),
    diag: v => near(+v, MP - d, 0.5) ? 'M2' : near(+v, disc, 0.5) ? 'P' : null
  };
  if (format === 'mcq') q.options = shuffle([ans, MP - d, disc, MP + disc].filter((x, i, a) => a.indexOf(x) === i))
    .map(v => ({ v, t: rs(v) }));
  if (format === 'spot') {
    q.text = `Marked ${rs(MP)}, ${d}% discount. Shabana worked out the final price. Tap the step with the mistake.`;
    q.steps = [`Step 1: The discount is ${d}%.`,
               `Step 2: Final price = ${MP} − ${d} = ${rs(MP - d)}`,
               `Step 3: So she pays ${rs(MP - d)}.`];
    q.answer = 1; q.check = v => +v === 1; q.diag = v => null;
    q.solution = `Step 2 takes away ${d} rupees, but ${d}% of ${rs(MP)} is ${rs(disc)}. Final price = ${rs(ans)}.`;
  }
  return q;
}

// ---------- Rubric scoring of an explanation (the "AI" evaluator) ----------
// Criteria: C1 uses the cost price as the base, C2 finds the profit/loss difference,
// C3 divides and turns it into "per 100". A selling-price base is flagged as M1.
function scoreExplanation(text, q) {
  const t = (text || '').toLowerCase();
  const c1 = /(cost|\bcp\b|bought|buy|spent|paid|purchase|started|kharid)/.test(t) || t.includes(String(q.CP));
  const c2 = /(profit|loss|minus|subtract|difference|take away|less|earned|extra|gain|left)/.test(t) || t.includes(String(q.amt));
  const c3 = /(divide|divided|÷|\/|out of|per|by)/.test(t) && /(100|hundred|percent|%)/.test(t);
  const sellBase = /(divide|divided|÷|\/|out of|by)\s*(the\s*)?(sell|sp\b|sold|selling)/.test(t) ||
                   (/(sell|sold|\bsp\b)/.test(t) && !c1 && c3) || t.includes('÷ ' + q.SP) || t.includes('/' + q.SP);
  const amountOnly = !c3 && /(\d+)\s*%/.test(t) && t.includes(String(q.amt) + '%');
  let score = (c1 ? 1 : 0) + (c2 ? 1 : 0) + (c3 ? 1 : 0);
  let tag = null;
  if (sellBase) { tag = 'M1'; score = Math.min(score, 1); }
  else if (amountOnly) { tag = 'M2'; score = Math.min(score, 1); }
  const correct = score >= 2 && c1 && !sellBase;
  const parts = [];
  if (c2) parts.push('✔ You found the ' + q.kind + ' amount.'); else parts.push('✖ First say how much ' + q.kind + ' there is (' + rs(q.amt) + ').');
  if (sellBase) parts.push('✖ You divided by the selling price. Divide by the cost price (' + rs(q.CP) + '), the money you started with.');
  else if (c1) parts.push('✔ You used the cost price as the base.'); else parts.push('✖ Say what you compare it with: the cost price ' + rs(q.CP) + '.');
  if (c3) parts.push('✔ You turned it into "out of 100".'); else parts.push('✖ Then divide and multiply by 100 to get the %.');
  return { score, max: 3, correct, tag, criteria: { c1, c2, c3, sellBase }, feedback: parts.join(' ') };
}

// ---------- Decision rule ----------
// Returns { action, reason } where action is:
// 'harder' | 'same' | 'alt' | 'prereq' | 'prereq-done' | 'next-skill' | 'done'
function decide(st, q, correct, tag) {
  const p = st.mastery[q.skill];
  if (st.mode === 'prereq') {
    if (correct && st.mastery.K1 >= 0.7)
      return { action: 'prereq-done', reason: `K1 mastery is now ${pct(st.mastery.K1)} (≥ 70%), so we go back to ${SKILLS[st.returnSkill].name}.` };
    return { action: 'same', reason: `Still practising the prerequisite: K1 mastery ${pct(st.mastery.K1)} (< 70%).` };
  }
  if (correct) {
    // interaction signals: a hint or a very slow answer holds back "harder"
    const slow = q.secs > 120;
    if ((q.hintUsed || slow) && p < MASTERED)
      return { action: 'same', reason: `Correct, but you ${q.hintUsed ? 'used a hint' : 'took ' + Math.round(q.secs) + ' seconds'} → one more at the same level before it gets harder.` };
    if (p >= MASTERED && st.level[q.skill] === 3) {
      const nxt = ORDER[ORDER.indexOf(q.skill) + 1];
      return nxt ? { action: 'next-skill', reason: `${SKILLS[q.skill].name} mastery ${pct(p)} ≥ 90% at the top level: skill mastered. Moving on to ${SKILLS[nxt].name}.` }
                 : { action: 'done', reason: `All skills mastered (${pct(p)} ≥ 90%).` };
    }
    if (p >= LEVEL_UP && st.level[q.skill] < 3)
      return { action: 'harder', reason: `Correct, and mastery ${pct(p)} ≥ 80% → HARDER question (level ${st.level[q.skill] + 1}).` };
    return { action: 'same', reason: `Correct, but mastery ${pct(p)} < 80% → one more at the same level to be sure.` };
  }
  // wrong
  const streak = st.wrongStreak[q.skill];
  if (tag === 'P' || st.mastery.K1 < PREREQ_WEAK || streak >= 2) {
    const why = tag === 'P' ? 'the answer shows the "% of an amount" step is the problem'
      : st.mastery.K1 < PREREQ_WEAK ? `prerequisite K1 mastery is only ${pct(st.mastery.K1)} (< 50%)`
      : `${streak} wrong in a row on this skill, even after a different explanation`;
    return { action: 'prereq', reason: `Wrong, and ${why} → PREREQUISITE instruction on "${SKILLS.K1.name}".` };
  }
  return { action: 'alt', reason: `Wrong (${tag ? 'misconception ' + tag + ' diagnosed' : 'no clear pattern'}), first miss on this skill → ALTERNATIVE explanation with a different picture, then a similar question.` };
}
const pct = x => Math.round(x * 100) + '%';

// ---------- Alternative explanations (a different representation for each error) ----------
const ALT = {
  M1: q => ({ title: 'Look at it as ₹100 notes 💵',
    body: `You started with ${rs(q.CP)}. That is ${q.CP / 100} notes of ₹100.<br>The ${q.kind} is ${rs(q.amt)}.<br>
      So for <b>each ₹100 you put in</b>, the ${q.kind} is ${q.amt} ÷ ${q.CP / 100} = <b>${rs(r1(q.amt / (q.CP / 100)))}</b>.<br>
      "${q.kind} %" always means "${q.kind} for every ₹100 you <b>spent</b>", never for every ₹100 you got back.` }),
  M2: q => q.skill === 'K3'
    ? { title: '₹ and % are different things 🔍', body: `"₹10 off" takes away 10 rupees. "10% off" takes away 10 rupees <b>for every ₹100</b>.<br>On a ₹500 box, 10% off = 5 × ₹10 = <b>₹50 off</b>.` }
    : { title: 'Rupees vs percent 🔍', body: `The ${q.kind} in money is ${rs(q.amt)}. But the % asks: how much ${q.kind} <b>for every ₹100</b> you spent?<br>
      ${rs(q.CP)} = ${q.CP / 100} × ₹100, so ${q.amt} ÷ ${q.CP / 100} = <b>${r1(q.amt / (q.CP / 100))}%</b>.` },
  none: q => ({ title: 'Let us try a picture 🧺', body: `Think of a basket of ₹100 notes you spent. Count how much ${q.kind || 'change'} comes for <b>each</b> ₹100 note. That number is the %.` })
};
const PREREQ_LESSON = {
  title: 'First, the basic step: % of an amount',
  body: `"%" means <b>out of 100</b>.<br>10% of ₹400 → in every ₹100 take ₹10 → 4 × ₹10 = <b>₹40</b>.<br>
    Quick way: <b>amount ÷ 100 × %</b>. 25% of ₹400 = 400 ÷ 100 × 25 = <b>₹100</b>.`
};

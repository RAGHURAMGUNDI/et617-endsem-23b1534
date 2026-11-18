// app.js — screens for Munafa Tutor.
// STAR Legacy cycle: Challenge → Ideas → Perspectives → Research (lesson) → Test your mettle (adaptive) → Go public.
// Plus: facilitator dashboard (teacher-in-the-loop, C5) and About.

const app = document.getElementById('app');
const STORE = 'munafa-23b1534';
const PIN = '1234';

// ---------- storage (shared phone: many members + one facilitator) ----------
function load() { try { return JSON.parse(localStorage.getItem(STORE)) || { learners: {}, reviews: [] }; } catch { return { learners: {}, reviews: [] }; } }
function save() { try { localStorage.setItem(STORE, JSON.stringify(DB)); } catch {} }
let DB = load();
let L = null;   // current learner record
let Q = null;   // current question

function newLearner(name) {
  return { name, mastery: { K1: 0.6, K2: 0.15, K3: 0.2 }, level: { K1: 1, K2: 1, K3: 1 },
    wrongStreak: { K1: 0, K2: 0, K3: 0 }, attempts: { K1: 0, K2: 0, K3: 0 },
    misc: { M1: 0, M2: 0, P: 0 }, skill: 'K2', mode: 'main', returnSkill: null,
    items: 0, correct: 0, log: [], challenge: null, finished: false };
}
function logEvent(type, data) { L.log.push({ t: new Date().toLocaleTimeString(), type, ...data }); save(); }

// ---------- UI helpers ----------
function screen(html) { app.innerHTML = html; window.scrollTo(0, 0); bindSpeak(); }
function bindSpeak() { app.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say)); }
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ' ')); u.lang = 'en-IN'; u.rate = 0.9;
  speechSynthesis.speak(u);
}
const sayBtn = t => `<button class="speak" data-say="${t.replace(/<[^>]+>/g, ' ').replace(/"/g, '&quot;')}">🔊 Listen</button>`;
const $ = id => document.getElementById(id);
function masteryBars(st) {
  return `<div class="mastery">${Object.keys(SKILLS).map(k => `
    <div class="mrow"><span>${SKILLS[k].short}</span>
      <div class="mbar"><div style="width:${Math.round(st.mastery[k] * 100)}%;background:${st.mastery[k] >= MASTERED ? '#2e8b57' : st.mastery[k] >= LEVEL_UP ? '#7cb342' : st.mastery[k] >= PREREQ_WEAK ? '#f0a030' : '#e05a47'}"></div></div>
      <b>${Math.round(st.mastery[k] * 100)}%</b></div>`).join('')}</div>`;
}
const stepTag = (n, name) => `<div class="step">STAR ${n} OF 6 · ${name}</div>`;

// ---------- Home ----------
function home() {
  const names = Object.keys(DB.learners);
  screen(`
    <div class="big-emoji">🫓💰</div>
    <h1>Did our papad stall make a profit?</h1>
    <p>Learn profit %, loss % and discounts with real stall money. The tutor changes the next question to fit <b>you</b>.</p>
    <div class="card">
      <label for="nm"><b>Your name</b></label>
      <input id="nm" class="inp" placeholder="e.g. Kamla" autocomplete="off">
      <button class="btn" id="start">▶ Start</button>
      ${names.length ? `<p class="muted">Or continue:</p>${names.map(n => `<button class="btn alt" data-n="${n}">👩 ${n} · ${DB.learners[n].items} questions done</button>`).join('')}` : ''}
    </div>
    <button class="btn ghost" id="fac">🧑‍🏫 Facilitator (Didi) dashboard</button>
  `);
  $('start').onclick = () => {
    const n = $('nm').value.trim(); if (!n) { $('nm').focus(); return; }
    DB.learners[n] = DB.learners[n] || newLearner(n); L = DB.learners[n]; save(); resume();
  };
  app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { L = DB.learners[b.dataset.n]; resume(); });
  $('fac').onclick = facilitatorLogin;
}
function resume() {
  const notes = DB.reviews.filter(r => r.learner === L.name && r.status !== 'pending' && !r.seen);
  if (notes.length) return didiNotes(notes);
  if (!L.challenge) return challenge();
  if (L.finished) return summary();
  tutor();
}
function didiNotes(notes) {
  screen(`<h2>💬 Didi checked your answers</h2>
    ${notes.map(r => `<div class="feedback ${r.finalCorrect ? '' : 'support'}">
      <p class="muted">Your explanation: “${r.text}”</p>
      <p>${r.status === 'approved' ? '✔ Didi agreed with the tutor:' : '✏️ Didi\'s own feedback:'} <b>${r.finalFeedback}</b></p></div>`).join('')}
    <button class="btn" id="ok">▶ Continue</button>`);
  notes.forEach(r => r.seen = true); save();
  $('ok').onclick = () => { if (!L.challenge) challenge(); else if (L.finished) summary(); else tutor(); };
}

// ---------- STAR 1 + 2: Challenge and Generate ideas ----------
function challenge() {
  const t = 'Our group bought papad for 400 rupees and sold it all for 500 rupees. Meena says we made 20 percent profit. Lata says 25 percent. Who is right?';
  screen(`${stepTag(1, 'THE CHALLENGE')}
    <h2>Who is right? 🤔</h2>
    <div class="card"><p>We bought papad for <b>₹400</b> and sold it all for <b>₹500</b>.</p>
      <div class="duo"><div class="person">👩🏽 <b>Meena</b><br>"20% profit"</div><div class="person">👩🏾 <b>Lata</b><br>"25% profit"</div></div>
      ${sayBtn(t)}</div>
    ${stepTag(2, 'YOUR IDEA')}
    <p><b>What do you think?</b> There is no wrong answer here, just tell us your idea.</p>
    <button class="btn alt" data-c="meena">👩🏽 Meena is right (20%)</button>
    <button class="btn alt" data-c="lata">👩🏾 Lata is right (25%)</button>
    <button class="btn alt" data-c="unsure">🤷 I am not sure</button>`);
  speak(t);
  app.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
    L.challenge = b.dataset.c;
    // diagnostic first answer feeds the learner model
    if (b.dataset.c === 'lata') L.mastery.K2 = bktUpdate(L.mastery.K2, true, 'mcq');
    if (b.dataset.c === 'meena') { L.mastery.K2 = bktUpdate(L.mastery.K2, false, 'mcq'); L.misc.M1++; }
    logEvent('challenge', { choice: b.dataset.c }); perspectives();
  });
}

// ---------- STAR 3: Multiple perspectives ----------
function perspectives() {
  const t = 'Meena divided the profit, 100 rupees, by the selling price, 500. Lata divided the 100 rupees by the cost price, 400, the money we started with. Profit percent always compares the profit with the money you put in. So Lata is right: 25 percent.';
  screen(`${stepTag(3, 'TWO WAYS OF THINKING')}
    <h2>How did each of them think?</h2>
    <div class="card"><b>👩🏽 Meena:</b> "Profit = 500 − 400 = ₹100. ₹100 out of <u>₹500</u> = 20%."</div>
    <div class="card"><b>👩🏾 Lata:</b> "Profit = ₹100. ₹100 out of <u>₹400</u>, the money we <b>put in</b> = 25%."</div>
    <div class="feedback">Both found the profit (₹100) correctly. The difference is <b>what they compared it with</b>.
      Profit % compares the profit with the money you <b>started with</b> (cost price). So <b>Lata is right: 25%</b>.
      ${L.challenge === 'meena' ? '<p>You thought like Meena. Many sellers do! Now you know the secret: always compare with the cost price.</p>' : ''}
      ${sayBtn(t)}</div>
    <button class="btn" id="go">▶ Learn the method</button>`);
  $('go').onclick = lesson;
}

// ---------- STAR 4: Research & revise (short lesson) ----------
function lesson() {
  const t = 'Profit percent equals profit divided by cost price, times 100. Loss percent is the same with loss. For a discount, find the percent of the marked price, then take it away.';
  screen(`${stepTag(4, 'LEARN THE METHOD')}
    <h2>The ₹100 secret 💵</h2>
    <div class="card">
      <div class="notes">💵💵💵💵 <span class="muted">₹400 spent = 4 notes of ₹100</span></div>
      <p>Profit ₹100 shared over 4 notes = <b>₹25 for each ₹100</b> = <b>25%</b></p>
      <div class="formula">Profit % = profit ÷ <u>cost price</u> × 100</div>
      <div class="formula">Loss % = loss ÷ <u>cost price</u> × 100</div>
      <div class="formula">Discount: final price = marked price − (d% of marked price)</div>
      ${sayBtn(t)}
    </div>
    <p class="muted">Next, the tutor gives you questions. If you get them right, they get harder. If you get stuck, it explains in a new way.</p>
    <button class="btn" id="go">▶ Start practice</button>`);
  $('go').onclick = () => tutor();
}

// ---------- STAR 5: Test your mettle (adaptive tutor) ----------
const FORMATS = { K1: ['num', 'mcq'], K2: ['mcq', 'num', 'spot', 'explain', 'num'], K3: ['num', 'mcq', 'spot', 'num'] };
function nextQuestion() {
  const k = L.mode === 'prereq' ? 'K1' : L.skill;
  const f = FORMATS[k][L.attempts[k] % FORMATS[k].length];
  return makeQuestion(k, L.level[k], f);
}
function tutor(preface) {
  if (L.items >= 14 || L.finished) return summary();
  Q = nextQuestion();
  const fmtName = { mcq: 'Choose one', num: 'Type the number', spot: 'Find the mistake', explain: 'Explain in your words' }[Q.format];
  let input = '';
  if (Q.format === 'mcq') input = Q.options.map(o => `<button class="btn alt" data-v="${o.v}">${o.t}</button>`).join('');
  if (Q.format === 'num') input = `<div class="numrow"><span>${Q.unit === '₹' ? '₹' : ''}</span>
      <input id="ans" class="inp" type="number" inputmode="decimal" step="any" placeholder="answer">
      <span>${Q.unit === '%' ? '%' : ''}</span></div><button class="btn" id="sub">✔ Check</button>`;
  if (Q.format === 'spot') input = Q.steps.map((s, i) => `<button class="btn alt step-btn" data-v="${i}">${s}</button>`).join('');
  if (Q.format === 'explain') input = `<textarea id="ans" class="inp" rows="4" placeholder="Type, or tap 🎤 and speak like a voice note"></textarea>
      <button class="mic" id="mic">🎤 Speak my answer</button><button class="btn" id="sub">✔ Send</button>`;
  screen(`
    ${L.mode === 'prereq' ? '<div class="banner">🧱 Practising the basic step first</div>' : stepTag(5, 'PRACTICE')}
    ${preface || ''}
    <div class="qmeta">${SKILLS[Q.skill].name} · Level ${Q.level} · ${fmtName}</div>
    <h2>${Q.text}</h2>${sayBtn(Q.text)}
    ${input}
    <details class="hint"><summary>💡 Need a hint?</summary>${Q.hint}</details>
    <details class="model"><summary>📊 My progress (what the tutor knows)</summary>${masteryBars(L)}</details>`);
  app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => answer(b.dataset.v));
  if ($('sub')) $('sub').onclick = () => { const v = $('ans').value.trim(); if (v) answer(v); };
  if ($('mic')) $('mic').onclick = dictate;
  const h = app.querySelector('details.hint');
  if (h) h.ontoggle = () => { if (h.open) logEvent('hint', { skill: Q.skill }); };
}
function dictate() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = $('mic');
  if (!SR) { mic.textContent = '🎤 Voice not available here, please type'; return; }
  const r = new SR(); r.lang = 'en-IN'; mic.textContent = '👂 Listening…';
  r.onresult = e => { $('ans').value += (($('ans').value ? ' ' : '') + e.results[0][0].transcript); mic.textContent = '🎤 Speak more'; };
  r.onerror = () => { mic.textContent = '🎤 Did not hear. Try again or type'; };
  r.start();
}

function answer(v) {
  const k = Q.skill;
  let correct = Q.check(v), tag = correct ? null : Q.diag(v), evalRes = null;
  if (Q.format === 'explain') {
    evalRes = scoreExplanation(v, Q);
    DB.reviews.push({ id: Date.now(), learner: L.name, question: Q.text, text: v, score: evalRes.score,
      autoCorrect: evalRes.correct, autoFeedback: evalRes.feedback, tag: evalRes.tag, status: 'pending', t: new Date().toLocaleString() });
  }
  // update learner model
  const before = L.mastery[k];
  L.mastery[k] = bktUpdate(L.mastery[k], correct, Q.format);
  L.attempts[k]++; L.items++; if (correct) { L.correct++; L.wrongStreak[k] = 0; } else L.wrongStreak[k]++;
  if (tag) L.misc[tag]++;
  const d = decide(L, Q, correct, tag);
  logEvent('answer', { skill: k, level: Q.level, format: Q.format, given: String(v).slice(0, 80), correct, tag,
    before: Math.round(before * 100), after: Math.round(L.mastery[k] * 100), action: d.action });

  // apply the decision
  let next = '';
  if (d.action === 'harder') { L.level[k] = Math.min(3, L.level[k] + 1); next = '⬆️ Next: a <b>harder</b> question.'; }
  if (d.action === 'same') next = '➡️ Next: another question like this one.';
  if (d.action === 'alt') next = '➡️ Next: a similar question to try the new way.';
  if (d.action === 'next-skill') { L.skill = ORDER[ORDER.indexOf(k) + 1]; next = '🎯 Skill mastered! Next: <b>' + SKILLS[L.skill].name + '</b>.'; }
  if (d.action === 'done') { L.finished = true; next = '🏆 You mastered everything!'; }
  if (d.action === 'prereq') { L.mode = 'prereq'; L.returnSkill = k; L.wrongStreak[k] = 0; next = '🧱 Next: practice on the basic step.'; }
  if (d.action === 'prereq-done') { L.mode = 'main'; L.skill = L.returnSkill; next = '↩️ Basic step done. Back to <b>' + SKILLS[L.skill].name + '</b>.'; }
  save();

  // feedback content
  let fb;
  if (Q.format === 'explain') {
    fb = `<div class="feedback ${evalRes.correct ? '' : 'support'}">
      <b>${evalRes.correct ? '🎉 Good explanation!' : '🤔 Almost there.'}</b> Rubric score ${evalRes.score}/3.
      <p>${evalRes.feedback}</p><p class="muted">⏳ Didi (your facilitator) will also check this answer.</p>
      <p><b>Model answer:</b> ${Q.solution}</p>${sayBtn(evalRes.feedback)}</div>`;
  } else if (correct) {
    fb = `<div class="feedback">🎉 <b>Correct!</b><p>${Q.solution}</p>${sayBtn('Correct! ' + Q.solution)}</div>`;
  } else {
    const tagMsg = { M1: 'It looks like you compared with the <b>selling price</b>. Profit % compares with the money you <b>put in</b>.',
                     M2: 'It looks like you mixed up <b>rupees</b> and <b>percent</b>.',
                     P: 'The "% of an amount" step needs practice.' }[tag] || 'Not quite.';
    fb = `<div class="feedback support">🤔 <b>Not yet, and that is okay.</b><p>${tagMsg}</p>${sayBtn(tagMsg)}</div>`;
  }
  let extra = '';
  if (d.action === 'alt') {
    const a = (ALT[tag] || ALT.none)(Q);
    extra = `<div class="card alt-exp"><h3>🔄 ${a.title}</h3><p>${a.body}</p>${sayBtn(a.title + '. ' + a.body)}</div>`;
  }
  if (d.action === 'prereq') extra = `<div class="card alt-exp prereq"><h3>🧱 ${PREREQ_LESSON.title}</h3><p>${PREREQ_LESSON.body}</p>${sayBtn(PREREQ_LESSON.body)}</div>`;

  const shown = Q.format === 'spot' ? Q.steps[+v]
    : Q.format === 'mcq' ? (Q.options.find(o => String(o.v) === String(v)) || { t: v }).t : v;
  screen(`<div class="qmeta">${SKILLS[k].name} · Level ${Q.level}</div><h2>${Q.text}</h2>
    <p class="muted">Your answer: <b>${shown}</b></p>
    ${fb}${extra}
    <div class="why"><b>🧭 Why this next?</b> ${d.reason}<br>${next}
      <div class="delta">${SKILLS[k].short} mastery: ${Math.round(before * 100)}% → <b>${Math.round(L.mastery[k] * 100)}%</b></div>
      ${masteryBars(L)}</div>
    <button class="btn" id="go">▶ Next</button>`);
  $('go').onclick = () => (L.finished ? summary() : tutor());
}

// ---------- STAR 6: Go public (summary) ----------
function summary() {
  L.finished = true; save();
  const strong = Object.keys(SKILLS).filter(k => L.mastery[k] >= LEVEL_UP).map(k => SKILLS[k].name);
  screen(`${stepTag(6, 'SHARE WITH YOUR GROUP')}
    <div class="big-emoji">🏅</div><h2>Well done, ${L.name}!</h2>
    <div class="card share">
      <p><b>${L.name}'s stall maths card</b></p>
      <p>✅ ${L.correct} of ${L.items} right</p>
      ${masteryBars(L)}
      <p>${strong.length ? '💪 Strong in: ' + strong.join(', ') : '🌱 Keep practising. You are improving!'}</p>
      <p>🔑 Remember: <b>profit % = profit ÷ cost price × 100</b></p>
    </div>
    <p class="muted">Show this card at the next group meeting and explain one question to a friend. Teaching others is the best test!</p>
    <button class="btn" id="more">🔁 Practise more</button>
    <button class="btn alt" id="home">🏠 Home</button>`);
  $('more').onclick = () => { L.finished = false; L.items = Math.min(L.items, 8); save(); tutor(); };
  $('home').onclick = home;
}

// ---------- Facilitator dashboard (C5 teacher-in-the-loop) ----------
function facilitatorLogin() {
  screen(`<h2>🧑‍🏫 Facilitator login</h2><div class="card">
    <input id="pin" class="inp" type="password" inputmode="numeric" placeholder="PIN (demo: 1234)">
    <button class="btn" id="go">Open dashboard</button></div><button class="btn alt" id="back">← Back</button>`);
  $('go').onclick = () => { if ($('pin').value === PIN) dashboard(); else $('pin').value = ''; };
  $('back').onclick = home;
}
function dashboard() {
  const ls = Object.values(DB.learners);
  const pend = DB.reviews.filter(r => r.status === 'pending');
  const cell = v => `<td style="background:${v >= MASTERED ? '#c8e6c9' : v >= LEVEL_UP ? '#dcedc8' : v >= PREREQ_WEAK ? '#ffe0b2' : '#ffcdd2'}">${Math.round(v * 100)}%</td>`;
  const tot = ls.reduce((a, l) => ({ M1: a.M1 + l.misc.M1, M2: a.M2 + l.misc.M2, P: a.P + l.misc.P }), { M1: 0, M2: 0, P: 0 });
  screen(`<h2>🧑‍🏫 Didi's dashboard</h2>
    <div class="card"><b>Group mastery (BKT estimate)</b>
      <table class="tbl"><tr><th>Member</th><th>% of ₹</th><th>Profit %</th><th>Discount</th><th>Right</th><th>Now on</th></tr>
      ${ls.map(l => `<tr><td>${l.name}</td>${cell(l.mastery.K1)}${cell(l.mastery.K2)}${cell(l.mastery.K3)}
        <td>${l.correct}/${l.items}</td><td>${l.mode === 'prereq' ? '🧱 basics' : SKILLS[l.skill].short}</td></tr>`).join('') || '<tr><td colspan="6">No members yet</td></tr>'}</table>
      <p class="muted">Green ≥ 90% mastered · light green ≥ 80% · orange ≥ 50% · red &lt; 50%</p></div>
    <div class="card"><b>Misconceptions seen in the group</b>
      <p>M1 "profit % on the selling price": <b>${tot.M1}</b> · M2 "₹ = %": <b>${tot.M2}</b> · Basic "% of ₹" gaps: <b>${tot.P}</b></p>
      ${tot.M1 >= tot.M2 && tot.M1 > 0 ? '<p>💡 Suggestion: at the next meeting, redo the Meena vs Lata ₹400/₹500 example together.</p>' : ''}</div>
    <div class="card"><b>Explanations to check (${pend.length})</b>
      ${pend.map(r => `<div class="review" data-id="${r.id}">
        <p class="muted">${r.learner} · ${r.t}</p><p><b>Q:</b> ${r.question}</p><p><b>Answer:</b> “${r.text}”</p>
        <p><b>Tutor's auto-feedback</b> (${r.autoCorrect ? '✔ correct' : '✖ not yet'}, ${r.score}/3${r.tag ? ', ' + r.tag : ''}): ${r.autoFeedback}</p>
        <button class="btn green small" data-act="approve">✔ Approve</button>
        <textarea class="inp" rows="2" placeholder="Or write your own feedback…"></textarea>
        <label><input type="checkbox" class="mark"> Mark the answer as correct</label>
        <button class="btn small" data-act="override">✏️ Override with my feedback</button></div>`).join('') || '<p class="muted">Nothing waiting. 🎉</p>'}</div>
    <div class="card"><b>Decision log (last 12)</b><table class="tbl"><tr><th>Member</th><th>Skill</th><th>Fmt</th><th>✔?</th><th>Tag</th><th>Mastery</th><th>Decision</th></tr>
      ${ls.flatMap(l => l.log.filter(e => e.type === 'answer').map(e => ({ ...e, n: l.name }))).slice(-12).reverse()
        .map(e => `<tr><td>${e.n}</td><td>${e.skill} L${e.level}</td><td>${e.format}</td><td>${e.correct ? '✔' : '✖'}</td><td>${e.tag || ''}</td><td>${e.before}→${e.after}</td><td>${e.action}</td></tr>`).join('')}</table></div>
    <button class="btn alt" id="back">🏠 Home</button>`);
  app.querySelectorAll('.review').forEach(div => {
    const r = DB.reviews.find(x => x.id == div.dataset.id);
    div.querySelector('[data-act=approve]').onclick = () => {
      r.status = 'approved'; r.finalFeedback = r.autoFeedback; r.finalCorrect = r.autoCorrect; save(); dashboard();
    };
    div.querySelector('[data-act=override]').onclick = () => {
      const txt = div.querySelector('textarea').value.trim(); if (!txt) return div.querySelector('textarea').focus();
      r.status = 'overridden'; r.finalFeedback = txt; r.finalCorrect = div.querySelector('.mark').checked;
      // teacher override also corrects the learner model if the tutor was wrong
      const l = DB.learners[r.learner];
      if (l && r.finalCorrect !== r.autoCorrect) l.mastery.K2 = bktUpdate(l.mastery.K2, r.finalCorrect, 'explain');
      save(); dashboard();
    };
  });
  $('back').onclick = home;
}

// ---------- About ----------
function about() {
  screen(`<h2>About Munafa Tutor</h2><div class="card">
    <p>An adaptive tutor for profit, loss and discount, made for women in self-help groups who run market stalls.</p>
    <p><b>Exam card:</b> P4 Adaptive tutor · T9 Percentage: profit, loss, discount · L3 Adult SHG learner · C5 Teacher-in-the-loop</p>
    <p><b>Identity token:</b> 23B1534</p>
    <p><b>Methods:</b> STAR Legacy inquiry cycle; Bayesian Knowledge Tracing; misconception diagnosis from answers; rubric scoring of explanations; open learner model ("Why this next?"); facilitator approve or override.</p>
    <p>ET 617 End-Semester Exam, 18 Nov 2026. Plain HTML, CSS and JavaScript. Built with help from Claude (AI), disclosed in the report.</p>
    <button class="btn alt" id="reset">🗑 Reset all data on this phone</button></div>
    <button class="btn" id="home">🏠 Home</button>`);
  $('home').onclick = home;
  $('reset').onclick = () => { DB = { learners: {}, reviews: [] }; save(); home(); };
}

document.getElementById('aboutLink').onclick = e => { e.preventDefault(); about(); };
document.getElementById('homeLink').onclick = e => { e.preventDefault(); home(); };
home();

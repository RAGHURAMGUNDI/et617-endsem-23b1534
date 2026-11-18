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
    items: 0, correct: 0, log: [], challenge: null, finished: false, pin: null, sessions: [], hist: [] };
}
function logEvent(type, data) { L.log.push({ t: new Date().toLocaleTimeString(), type, ...data }); save(); }

// ---------- UI helpers ----------
function screen(html) { app.innerHTML = html; app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter'); window.scrollTo(0, 0); }
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
  const avatars = FACES.map((_, i) => i); // illustrated Indian women (faces.js)
  screen(`
    <div class="login">
      <div class="logo-orb">🫓<span>₹</span></div>
      <h1 class="hero">Munafa Tutor</h1>
      <p class="hero-sub">Did our papad stall make a profit? Practise profit, loss and discount with your own stall money.</p>
      <div class="seg" role="tablist">
        <button class="seg-btn on" data-tab="member" role="tab">👩🏽 I am a member</button>
        <button class="seg-btn" data-tab="didi" role="tab">👩🏽‍🏫 I am Didi</button>
        <span class="seg-pill"></span>
      </div>
      <div class="card glass pane" id="pane-member">
        <p class="lbl">Pick your picture</p>
        <div class="avatars">${avatars.map((a, i) => `<button class="av ${i === 0 ? 'on' : ''}" data-av="${a}" aria-label="Picture ${i + 1}">${faceSVG(a, 44)}</button>`).join('')}</div>
        <div class="field"><input id="nm" class="inp" placeholder=" " autocomplete="off"><label for="nm">Your name</label></div>
        <div class="field"><input id="mypin" class="inp" type="password" inputmode="numeric" maxlength="4" placeholder=" "><label for="mypin">Make a 4-digit PIN</label></div>
        <button class="btn shine" id="start">Start learning ➜</button>
        ${names.length ? `<p class="lbl">Welcome back, tap your name</p><div class="chips">${names.map(n => `
          <button class="chip-l" data-n="${n}"><span class="chip-face">${avatarHTML(DB.learners[n].avatar, 34)}</span>${n}
            <small>${Math.round(DB.learners[n].mastery.K2 * 100)}% profit %</small></button>`).join('')}</div>` : ''}
      </div>
      <div class="card glass pane hidden" id="pane-didi">
        <p class="lbl">Facilitator PIN</p>
        <div class="pin-dots">${[0, 1, 2, 3].map(i => `<span id="d${i}"></span>`).join('')}</div>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => `<button class="key" data-k="${k}">${k}</button>`).join('')}</div>
        <p class="muted center">Demo PIN: 1234</p>
      </div>
    </div>`);
  let av = avatars[0], pin = '';
  app.querySelectorAll('.seg-btn').forEach(b => b.onclick = () => {
    app.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('on', x === b));
    app.querySelector('.seg').classList.toggle('right', b.dataset.tab === 'didi');
    $('pane-member').classList.toggle('hidden', b.dataset.tab !== 'member');
    $('pane-didi').classList.toggle('hidden', b.dataset.tab !== 'didi');
  });
  app.querySelectorAll('.av').forEach(b => b.onclick = () => {
    av = +b.dataset.av; app.querySelectorAll('.av').forEach(x => x.classList.toggle('on', x === b));
  });
  $('start').onclick = () => {
    const n = $('nm').value.trim(), pn = $('mypin').value.trim();
    const bad = el => { el.focus(); el.parentNode.classList.add('shake'); setTimeout(() => el.parentNode.classList.remove('shake'), 400); };
    if (!n) return bad($('nm'));
    if (DB.learners[n]) return memberLogin(n);           // already registered → PIN login
    if (!/^\d{4}$/.test(pn)) return bad($('mypin'));
    DB.learners[n] = newLearner(n); L = DB.learners[n]; L.avatar = av; L.pin = pn; save(); startSession();
  };
  $('nm').onkeydown = e => { if (e.key === 'Enter') $('start').click(); };
  app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => memberLogin(b.dataset.n));
  const dots = () => [0, 1, 2, 3].forEach(i => $('d' + i).classList.toggle('full', i < pin.length));
  app.querySelectorAll('.key').forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (k === '⌫') pin = pin.slice(0, -1);
    else if (k === '✓' || pin.length >= 3) {
      if (k !== '✓') pin += k;
      if (pin === PIN) return dashboard();
      if (pin.length >= 4 || k === '✓') { app.querySelector('.pin-dots').classList.add('shake'); setTimeout(() => { app.querySelector('.pin-dots').classList.remove('shake'); pin = ''; dots(); }, 400); }
    } else pin += k;
    dots();
  });
}
function resume() {
  const notes = DB.reviews.filter(r => r.learner === L.name && r.status !== 'pending' && !r.seen);
  if (notes.length) return didiNotes(notes);
  profile();
}
function startSession() { L.sessions = L.sessions || []; L.sessions.push(new Date().toISOString()); save(); resume(); }

// ---------- Returning learner: PIN login ----------
function memberLogin(name) {
  const m = DB.learners[name];
  if (!m.pin) { L = m; return startSession(); }       // older profile without PIN
  screen(`<div class="card glass center">
    <div class="avatar-big">${avatarHTML(m.avatar, 64)}</div><h2>Welcome back, ${m.name}!</h2>
    <p class="lbl">Enter your 4-digit PIN</p>
    <div class="pin-dots">${[0, 1, 2, 3].map(i => `<span id="d${i}"></span>`).join('')}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '←'].map(k => `<button class="key" data-k="${k}">${k}</button>`).join('')}</div>
    <p class="muted">Forgot your PIN? Ask Didi.</p></div>`);
  let pin = '';
  const dots = () => [0, 1, 2, 3].forEach(i => $('d' + i).classList.toggle('full', i < pin.length));
  app.querySelectorAll('.key').forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (k === '←') return home();
    if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
    dots();
    if (pin.length === 4) {
      if (pin === m.pin) { L = m; startSession(); }
      else { app.querySelector('.pin-dots').classList.add('shake'); setTimeout(() => { pin = ''; dots(); app.querySelector('.pin-dots').classList.remove('shake'); }, 400); }
    }
  });
}

// ---------- Learner profile hub ----------
function profile() {
  const acc = L.items ? Math.round(L.correct / L.items * 100) : 0;
  const days = new Set((L.sessions || []).map(d => d.slice(0, 10))).size;
  const notes = DB.reviews.filter(r => r.learner === L.name);
  const weakest = Object.keys(SKILLS).reduce((a, k) => L.mastery[k] < L.mastery[a] ? k : a, 'K2');
  screen(`
    <div class="card glass profile-head">
      <div class="avatar-big">${avatarHTML(L.avatar, 64)}</div>
      <div><h2>${L.name}</h2><p class="muted">Ujala Mahila Bachat Gat · member</p></div>
      <button class="chip-out" id="out">Log out</button>
    </div>
    <div class="stats">
      <div><b>${L.items}</b><span>questions</span></div>
      <div><b>${acc}%</b><span>right</span></div>
      <div><b>${days}</b><span>days practised</span></div>
    </div>
    <div class="card glass"><p class="lbl">My skills</p>${masteryBars(L)}
      <p class="muted">💡 Next focus: <b>${SKILLS[weakest].name}</b></p></div>
    <button class="btn shine" id="lesson">📘 Take lesson ${L.challenge ? '<small>(again)</small>' : '<span class="badge">START HERE</span>'}</button>
    <button class="btn ${L.challenge ? '' : 'alt'}" id="practice">🎯 Practise ${L.challenge ? '' : '<small>(after the lesson)</small>'}</button>
    <button class="btn alt" id="rep">📊 My report</button>
    <button class="btn alt" id="plan">🧾 Price planner (for my stall)</button>
    ${notes.length ? `<button class="btn alt" id="notes">💬 Didi's notes (${notes.filter(r => r.status !== 'pending').length} checked · ${notes.filter(r => r.status === 'pending').length} waiting)</button>` : ''}
  `);
  $('out').onclick = () => { L = null; home(); };
  $('lesson').onclick = challenge;
  $('practice').onclick = () => { if (!L.challenge) return challenge(); if (L.finished) { L.finished = false; L.items = Math.min(L.items, 8); } tutor(); };
  $('rep').onclick = report;
  $('plan').onclick = planner;
  if ($('notes')) $('notes').onclick = () => didiNotes(notes.filter(r => r.status !== 'pending'), true);
}

// ---------- Price planner: the reverse problem (transfer to her own stall) ----------
function planner() {
  const st = L.plan || { cost: 20, packets: 30, pct: 20, price: '' };
  screen(`<div class="step">PRICE PLANNER</div><h2>🧾 What price should I charge?</h2>
    <div class="card glass">
      <div class="duo"><div class="field"><input id="pc" class="inp" type="number" inputmode="numeric" placeholder=" " value="${st.cost}"><label for="pc">Cost of 1 packet ₹</label></div>
        <div class="field"><input id="pn" class="inp" type="number" inputmode="numeric" placeholder=" " value="${st.packets}"><label for="pn">Packets</label></div></div>
      <p class="lbl">Profit I want: <b id="pv">${st.pct}%</b></p>
      <input id="pp" type="range" min="0" max="60" step="5" value="${st.pct}" class="range">
    </div>
    <div class="card glass"><p class="lbl">✋ Try it yourself first</p>
      <p>What price per packet gives this profit?</p>
      <div class="numrow"><span>₹</span><input id="guess" class="inp" type="number" inputmode="decimal" step="any" placeholder="your price"></div>
      <button class="btn small" id="chk">Check my price</button><div id="gfb"></div>
      <button class="btn ghost small" id="show">👀 Just show me the answer</button>
      <div id="pout" class="hidden"></div></div>
    <button class="btn" id="back">← My profile</button>`);
  const calc = () => {
    const c = +$('pc').value || 0, n = +$('pn').value || 0, p = +$('pp').value;
    $('pv').textContent = p + '%';
    const price = c + c * p / 100, tot = price * n, prof = tot - c * n;
    const waText = `🧾 Price plan from Munafa Tutor\nCost of 1 packet: ₹${c}\nProfit wanted: ${p}%\nSell at: ₹${r1(price)} each\n${n} packets → ₹${r1(tot)} (profit ₹${r1(prof)})`;
    $('pout').innerHTML = c > 0 ? `<div class="plan-out">
        <div><span>Sell 1 packet at</span><b>${rs(r1(price))}</b></div>
        <div><span>All ${n} packets bring</span><b>${rs(r1(tot))}</b></div>
        <div><span>Your profit</span><b>${rs(r1(prof))}</b></div></div>
      <p class="muted">Why: ${p}% of the cost ${rs(c)} = ${rs(r1(c * p / 100))}, so price = ${c} + ${r1(c * p / 100)}. We add the % of the <b>cost</b>, never of the price.</p>
      <a class="btn wa small" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(waText)}">📲 Send this plan to my group</a>` : '';
    L.plan = { cost: c, packets: n, pct: p }; save();
    return price;
  };
  ['pc', 'pn', 'pp'].forEach(id => $(id).oninput = () => { calc(); $('pout').classList.add('hidden'); $('gfb').innerHTML = ''; });
  $('show').onclick = () => { $('pout').classList.remove('hidden'); logEvent('planner-show', {}); };
  calc();
  $('chk').onclick = () => {
    const g = +$('guess').value, price = calc(), c = +$('pc').value, p = +$('pp').value;
    const m1 = c / (1 - p / 100); // the price that gives p% "on the selling price" (M1 thinking)
    let fb;
    if (Math.abs(g - price) < 0.6) fb = `<div class="feedback">🎉 Exactly right: ${rs(r1(price))} gives ${p}% profit on your cost.</div>`;
    else if (p > 0 && Math.abs(g - m1) < 0.6) fb = `<div class="feedback support">🤔 ${rs(r1(g))} would make the profit ${p}% of the <b>selling price</b>. Profit % is on the <b>cost</b>: add ${p}% of ${rs(c)}.</div>`;
    else if (g < c) fb = `<div class="feedback support">⚠️ ${rs(r1(g))} is less than the cost ${rs(c)}. That is a <b>loss</b>!</div>`;
    else fb = `<div class="feedback support">Not quite. At ${rs(r1(g))} your profit would be <b>${r1((g - c) / c * 100)}%</b> of the cost. Move the slider and compare.</div>`;
    $('gfb').innerHTML = fb; $('pout').classList.remove('hidden');
    logEvent('planner', { cost: c, pct: p, guess: g, correct: Math.abs(g - price) < 0.6 });
  };
  $('back').onclick = profile;
}

// ---------- Learner report ----------
function report() {
  const ans = L.log.filter(e => e.type === 'answer');
  const by = (key) => { const m = {}; ans.forEach(e => { m[e[key]] = m[e[key]] || { n: 0, c: 0 }; m[e[key]].n++; if (e.correct) m[e[key]].c++; }); return m; };
  const bySkill = by('skill'), byFmt = by('format');
  const fmtName = { mcq: 'Choose one', num: 'Type the number', spot: 'Find the mistake', explain: 'Explain' };
  const H = L.hist || [];
  const W = 320, Ht = 120;
  const line = k => H.length < 2 ? '' : `<polyline fill="none" stroke-width="3" stroke-linecap="round" stroke="${{ K1: '#f59e0b', K2: '#7a3ee0', K3: '#22a06b' }[k]}"
      points="${H.map((h, i) => `${(i / (H.length - 1)) * W},${Ht - h[k] * Ht}`).join(' ')}"/>`;
  const hints = ans.filter(e => e.hint).length, avgSec = ans.length ? Math.round(ans.reduce((a, e) => a + (e.secs || 0), 0) / ans.length) : 0;
  screen(`
    <div class="step">MY REPORT</div><h2 class="rep-title">${avatarHTML(L.avatar, 40)} ${L.name}'s progress</h2>
    <div class="card glass"><p class="lbl">Mastery over time</p>
      ${H.length < 2 ? '<p class="muted">Answer a few questions to see your line grow.</p>' : `
      <svg viewBox="0 0 ${W} ${Ht}" class="chart">${[0.5, 0.8].map(y => `<line x1="0" x2="${W}" y1="${Ht - y * Ht}" y2="${Ht - y * Ht}" stroke="#bbb" stroke-dasharray="4 4"/>`).join('')}
        ${line('K1')}${line('K2')}${line('K3')}</svg>
      <p class="legend"><span style="color:#f59e0b">● % of ₹</span> <span style="color:#7a3ee0">● Profit %</span> <span style="color:#22a06b">● Discount</span> · dashed lines = 50% and 80%</p>`}
    </div>
    <div class="card glass"><p class="lbl">By skill</p>
      <table class="tbl"><tr><th>Skill</th><th>Mastery</th><th>Right</th><th>Level</th></tr>
      ${Object.keys(SKILLS).map(k => `<tr><td>${SKILLS[k].name}</td><td>${Math.round(L.mastery[k] * 100)}%</td><td>${bySkill[k] ? bySkill[k].c + '/' + bySkill[k].n : '–'}</td><td>${L.level[k]}</td></tr>`).join('')}</table></div>
    <div class="card glass"><p class="lbl">By question type</p>
      <table class="tbl"><tr><th>Type</th><th>Right</th></tr>${Object.keys(byFmt).map(f => `<tr><td>${fmtName[f]}</td><td>${byFmt[f].c}/${byFmt[f].n}</td></tr>`).join('') || '<tr><td colspan="2">No answers yet</td></tr>'}</table>
      <p class="muted">💡 Hints used: ${hints} · ⏱ average ${avgSec} s per question</p></div>
    <div class="card glass"><p class="lbl">Mistakes to watch</p>
      <p>📉 Dividing by the selling price (M1): <b>${L.misc.M1}</b> times</p>
      <p>💱 Mixing up ₹ and % (M2): <b>${L.misc.M2}</b> times</p>
      <p>🧱 Basic "% of ₹" step: <b>${L.misc.P}</b> times</p>
      ${L.misc.M1 > L.misc.M2 ? '<p class="muted">Tip: always ask "how much did we SPEND?" and divide by that.</p>' : L.misc.M2 ? '<p class="muted">Tip: ₹ is money; % means "for every ₹100".</p>' : ''}</div>
    <div class="card glass"><p class="lbl">Last answers</p>
      ${ans.slice(-6).reverse().map(e => `<p class="recent">${e.correct ? '✅' : '🔸'} ${SKILLS[e.skill].short} L${e.level} · ${fmtName[e.format]} · <i>${e.action}</i></p>`).join('') || '<p class="muted">None yet</p>'}</div>
    <button class="btn" id="back">← My profile</button>`);
  $('back').onclick = profile;
}
function didiNotes(notes, fromProfile) {
  screen(`<h2>💬 Didi checked your answers</h2>
    ${notes.map(r => `<div class="feedback ${r.finalCorrect ? '' : 'support'}">
      <p class="muted">Your explanation: “${r.text}”</p>
      <p>${r.status === 'approved' ? '✔ Didi agreed with the tutor:' : '✏️ Didi\'s own feedback:'} <b>${r.finalFeedback}</b></p></div>`).join('')}
    <button class="btn" id="ok">▶ Continue</button>`);
  notes.forEach(r => r.seen = true); save();
  $('ok').onclick = profile;
}

// ---------- STAR 1 + 2: Challenge and Generate ideas ----------
function challenge() {
  screen(`${stepTag(1, 'THE CHALLENGE')}
    <h2>Who is right? 🤔</h2>
    <div class="card"><p>We bought papad for <b>₹400</b> and sold it all for <b>₹500</b>.</p>
      <div class="duo"><div class="person">${faceSVG(0, 58)}<br><b>Meena</b><br>"20% profit"</div><div class="person">${faceSVG(2, 58)}<br><b>Lata</b><br>"25% profit"</div></div>
      </div>
    ${stepTag(2, 'YOUR IDEA')}
    <p><b>What do you think?</b> There is no wrong answer here, just tell us your idea.</p>
    <button class="btn alt face-btn" data-c="meena">${faceSVG(0, 30)} Meena is right (20%)</button>
    <button class="btn alt face-btn" data-c="lata">${faceSVG(2, 30)} Lata is right (25%)</button>
    <button class="btn alt" data-c="unsure">🤷 I am not sure</button>`);
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
  screen(`${stepTag(3, 'TWO WAYS OF THINKING')}
    <h2>How did each of them think?</h2>
    <div class="card face-row">${faceSVG(0, 40)}<div><b>Meena:</b> "Profit = 500 − 400 = ₹100. ₹100 out of <u>₹500</u> = 20%."</div></div>
    <div class="card face-row">${faceSVG(2, 40)}<div><b>Lata:</b> "Profit = ₹100. ₹100 out of <u>₹400</u>, the money we <b>put in</b> = 25%."</div></div>
    <div class="feedback">Both found the profit (₹100) correctly. The difference is <b>what they compared it with</b>.
      Profit % compares the profit with the money you <b>started with</b> (cost price). So <b>Lata is right: 25%</b>.
      ${L.challenge === 'meena' ? '<p>You thought like Meena. Many sellers do! Now you know the secret: always compare with the cost price.</p>' : ''}
      </div>
    <button class="btn" id="go">▶ Learn the method</button>`);
  $('go').onclick = lesson;
}

// ---------- STAR 4: Research & revise (short lesson) ----------
function lesson() {
  screen(`${stepTag(4, 'LEARN THE METHOD')}
    <h2>The ₹100 secret 💵</h2>
    <div class="card">
      <div class="notes">💵💵💵💵 <span class="muted">₹400 spent = 4 notes of ₹100</span></div>
      <p>Profit ₹100 shared over 4 notes = <b>₹25 for each ₹100</b> = <b>25%</b></p>
      <div class="formula">Profit % = profit ÷ <u>cost price</u> × 100</div>
      <div class="formula">Loss % = loss ÷ <u>cost price</u> × 100</div>
      <div class="formula">Discount: final price = marked price − (d% of marked price)</div>
      
    </div>
    <div class="card glass">
      <p class="lbl">🧺 Use my own stall numbers (optional)</p>
      <p class="muted">What did you spend and earn on your last market day? Some questions will use your real numbers.</p>
      <div class="duo"><div class="field"><input id="cp" class="inp" type="number" inputmode="numeric" placeholder=" " value="${L.myStall ? L.myStall.CP : ''}"><label for="cp">Spent ₹</label></div>
        <div class="field"><input id="sp" class="inp" type="number" inputmode="numeric" placeholder=" " value="${L.myStall ? L.myStall.SP : ''}"><label for="sp">Sold for ₹</label></div></div>
    </div>
    <p class="muted">Next, the tutor gives you questions. If you get them right, they get harder. If you get stuck, it explains in a new way.</p>
    <button class="btn" id="go">▶ Start practice</button>`);
  $('go').onclick = () => {
    const cp = +$('cp').value, sp = +$('sp').value;
    if (cp > 0 && sp > 0) { L.myStall = { CP: cp, SP: sp }; logEvent('my-stall', { CP: cp, SP: sp }); save(); }
    tutor();
  };
}

// ---------- STAR 5: Test your mettle (adaptive tutor) ----------
const FORMATS = { K1: ['num', 'mcq'], K2: ['mcq', 'num', 'spot', 'explain', 'num'], K3: ['num', 'mcq', 'spot', 'num'] };
function nextQuestion() {
  const k = L.mode === 'prereq' ? 'K1' : L.skill;
  const f = FORMATS[k][L.attempts[k] % FORMATS[k].length];
  return makeQuestion(k, L.level[k], f, L.myStall);
}
function tutor(preface) {
  if (L.items >= 14 || L.finished) return summary();
  Q = nextQuestion(); Q.shownAt = Date.now(); Q.hintUsed = false;
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
    <h2>${Q.text}</h2>
    ${input}
    <details class="hint"><summary>💡 Need a hint?</summary>${Q.hint}</details>
    <details class="model"><summary>📊 My progress (what the tutor knows)</summary>${masteryBars(L)}</details>
    <button class="btn ghost small" id="toprof">⏸ Stop and go to my profile</button>`);
  $('toprof').onclick = profile;
  app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => answer(b.dataset.v));
  if ($('sub')) $('sub').onclick = () => { const v = $('ans').value.trim(); if (v) answer(v); };
  if ($('mic')) $('mic').onclick = dictate;
  const h = app.querySelector('details.hint');
  if (h) h.ontoggle = () => { if (h.open) { Q.hintUsed = true; logEvent('hint', { skill: Q.skill }); } };
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
  Q.secs = (Date.now() - Q.shownAt) / 1000;
  let correct = Q.check(v), tag = correct ? null : Q.diag(v), evalRes = null;
  if (Q.format === 'explain') {
    evalRes = scoreExplanation(v, Q);
    DB.reviews.push({ id: Date.now(), learner: L.name, question: Q.text, text: v, score: evalRes.score,
      autoCorrect: evalRes.correct, autoFeedback: evalRes.feedback, tag: evalRes.tag, status: 'pending', t: new Date().toLocaleString() });
  }
  // update learner model
  const before = L.mastery[k];
  L.mastery[k] = bktUpdate(L.mastery[k], correct, Q.hintUsed && correct ? 'hinted' : Q.format);
  L.attempts[k]++; L.items++; if (correct) { L.correct++; L.wrongStreak[k] = 0; } else L.wrongStreak[k]++;
  if (tag) L.misc[tag]++;
  const d = decide(L, Q, correct, tag);
  L.hist = L.hist || []; L.hist.push({ ...L.mastery });
  logEvent('answer', { skill: k, level: Q.level, format: Q.format, given: String(v).slice(0, 80), correct, tag,
    secs: Math.round(Q.secs), hint: Q.hintUsed, own: Q.text.startsWith('🧺'),
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
      <p><b>Model answer:</b> ${Q.solution}</p></div>`;
  } else if (correct) {
    fb = `<div class="feedback">🎉 <b>Correct!</b><p>${Q.solution}</p></div>`;
  } else {
    const tagMsg = { M1: 'It looks like you compared with the <b>selling price</b>. Profit % compares with the money you <b>put in</b>.',
                     M2: 'It looks like you mixed up <b>rupees</b> and <b>percent</b>.',
                     P: 'The "% of an amount" step needs practice.' }[tag] || 'Not quite.';
    fb = `<div class="feedback support">🤔 <b>Not yet, and that is okay.</b><p>${tagMsg}</p></div>`;
  }
  let extra = '';
  if (d.action === 'alt') {
    const a = (ALT[tag] || ALT.none)(Q);
    extra = `<div class="card alt-exp"><h3>🔄 ${a.title}</h3><p>${a.body}</p></div>`;
  }
  if (d.action === 'prereq') extra = `<div class="card alt-exp prereq"><h3>🧱 ${PREREQ_LESSON.title}</h3><p>${PREREQ_LESSON.body}</p></div>`;

  const shown = Q.format === 'spot' ? Q.steps[+v]
    : Q.format === 'mcq' ? (Q.options.find(o => String(o.v) === String(v)) || { t: v }).t : v;
  screen(`<div class="qmeta">${SKILLS[k].name} · Level ${Q.level}</div><h2>${Q.text}</h2>
    <p class="muted">Your answer: <b>${shown}</b></p>
    ${fb}${extra}
    <div class="why"><b>🧭 Why this next?</b> ${d.reason}<br>${next}
      <div class="delta">${SKILLS[k].short} mastery: ${Math.round(before * 100)}% → <b>${Math.round(L.mastery[k] * 100)}%</b></div>
      ${masteryBars(L)}</div>
    <button class="btn" id="go">▶ Next</button><button class="btn ghost small" id="toprof">⏸ Stop and go to my profile</button>`);
  $('go').onclick = () => (L.finished ? summary() : tutor());
  $('toprof').onclick = profile;
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
      ${L.myStall && L.myStall.CP !== L.myStall.SP ? `<p>🧺 Your stall: spent ${rs(L.myStall.CP)}, sold ${rs(L.myStall.SP)} → <b>${L.myStall.SP > L.myStall.CP ? 'profit' : 'loss'} ${r1(Math.abs(L.myStall.SP - L.myStall.CP) / L.myStall.CP * 100)}%</b></p>` : ''}
    </div>
    <p class="muted">Show this card at the next group meeting and explain one question to a friend. Teaching others is the best test!</p>
    <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(
      `🫓 ${L.name}'s stall maths card (Munafa Tutor)\n✅ ${L.correct} of ${L.items} right\n` +
      Object.keys(SKILLS).map(k => `• ${SKILLS[k].name}: ${Math.round(L.mastery[k] * 100)}%`).join('\n') +
      `\n🔑 Profit % = profit ÷ COST price × 100\nTry it: https://et617-23b1534.vercel.app`)}" id="wa">📲 Share my card on WhatsApp</a>
    <button class="btn" id="more">🔁 Practise more</button>
    <button class="btn alt" id="rep">📊 See my full report</button>
    <button class="btn alt" id="home">👤 My profile</button>`);
  $('rep').onclick = report;
  $('wa').onclick = () => logEvent('share', { what: 'card' });
  $('more').onclick = () => { L.finished = false; L.items = Math.min(L.items, 8); save(); tutor(); };
  $('home').onclick = profile;
}

// ---------- Facilitator dashboard (C5 teacher-in-the-loop) ----------
function facilitatorLogin() { home(); app.querySelector('[data-tab=didi]').click(); }
function dashboard() {
  const ls = Object.values(DB.learners);
  const pend = DB.reviews.filter(r => r.status === 'pending');
  const cell = v => `<td style="background:${v >= MASTERED ? '#c8e6c9' : v >= LEVEL_UP ? '#dcedc8' : v >= PREREQ_WEAK ? '#ffe0b2' : '#ffcdd2'}">${Math.round(v * 100)}%</td>`;
  const tot = ls.reduce((a, l) => ({ M1: a.M1 + l.misc.M1, M2: a.M2 + l.misc.M2, P: a.P + l.misc.P }), { M1: 0, M2: 0, P: 0 });
  screen(`<h2>👩🏽‍🏫 Didi's dashboard</h2>
    <div class="card"><b>Group mastery (BKT estimate)</b>
      <table class="tbl"><tr><th>Member</th><th>% of ₹</th><th>Profit %</th><th>Discount</th><th>Right</th><th>Days</th><th>Now on</th></tr>
      ${ls.map(l => `<tr><td>${l.name}</td>${cell(l.mastery.K1)}${cell(l.mastery.K2)}${cell(l.mastery.K3)}
        <td>${l.correct}/${l.items}</td><td>${new Set((l.sessions || []).map(d => d.slice(0, 10))).size}</td><td>${l.mode === 'prereq' ? '🧱 basics' : SKILLS[l.skill].short}</td></tr>`).join('') || '<tr><td colspan="7">No members yet</td></tr>'}</table>
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
    <div class="card"><b>Decision log (last 12)</b><table class="tbl"><tr><th>Member</th><th>Skill</th><th>Fmt</th><th>✔?</th><th>Tag</th><th>💡/⏱</th><th>Mastery</th><th>Decision</th></tr>
      ${ls.flatMap(l => l.log.filter(e => e.type === 'answer').map(e => ({ ...e, n: l.name }))).slice(-12).reverse()
        .map(e => `<tr><td>${e.n}</td><td>${e.skill} L${e.level}</td><td>${e.format}</td><td>${e.correct ? '✔' : '✖'}</td><td>${e.tag || ''}</td><td>${e.hint ? '💡' : ''}${e.secs ?? ''}s</td><td>${e.before}→${e.after}</td><td>${e.action}</td></tr>`).join('')}</table></div>
    <button class="btn green" id="csv">⬇ Download all data (CSV)</button>
    <button class="btn alt" id="back">🏠 Home</button>`);
  $('csv').onclick = () => {
    const rows = [['member', 'time', 'skill', 'level', 'format', 'answer', 'correct', 'misconception', 'seconds', 'hint', 'own_numbers', 'mastery_before', 'mastery_after', 'decision']];
    ls.forEach(l => l.log.filter(e => e.type === 'answer').forEach(e => rows.push([l.name, e.t, e.skill, e.level, e.format, e.given, e.correct, e.tag || '', e.secs ?? '', e.hint ?? '', e.own ?? '', e.before, e.after, e.action])));
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'munafa-tutor-data.csv'; a.click();
  };
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
  screen(`<div class="card glass about">
    <div class="logo-orb small">🫓<span>₹</span></div>
    <h2 class="center">Munafa Tutor</h2>
    <p class="center muted">An adaptive tutor for profit, loss and discount, for women in self-help groups who run market stalls.</p>
    <div class="credit">
      <div><span>Created by</span><b>Raghuram Gundi</b></div>
      <div><span>Course</span><b>ET 617</b></div>
      <div><span>Roll number</span><b>23B1534</b></div>
    </div>
    <p><b>Exam card:</b> P4 Adaptive tutor · T9 Percentage: profit, loss, discount · L3 Adult SHG learner · C5 Teacher-in-the-loop</p>
    <p><b>Methods:</b> STAR Legacy inquiry cycle · Bayesian Knowledge Tracing · misconception diagnosis · rubric scoring of explanations · open learner model ("Why this next?") · facilitator approve or override</p>
    <p class="muted">ET 617 End-Semester Exam, 18 Nov 2026. Plain HTML, CSS and JavaScript. Built with help from Claude (AI), disclosed in the report.</p>
    <button class="btn alt" id="reset">🗑 Reset all data on this phone</button>
    <button class="btn" id="home">🏠 Home</button></div>`);
  $('home').onclick = home;
  $('reset').onclick = () => { DB = { learners: {}, reviews: [] }; save(); home(); };
}

document.getElementById('aboutLink').onclick = e => { e.preventDefault(); about(); };
document.getElementById('homeLink').onclick = e => { e.preventDefault(); L ? profile() : home(); };
home();

// ---------- Pop-up calculator (floating, on every screen) ----------
// Takes away the arithmetic load so the learner can focus on WHICH numbers to use (the concept).
(function calculator() {
  const fab = document.createElement('button');
  fab.className = 'calc-fab'; fab.id = 'calcFab'; fab.setAttribute('aria-label', 'Open calculator'); fab.textContent = '🧮';
  const pop = document.createElement('div');
  pop.className = 'calc-pop hidden'; pop.id = 'calcPop';
  pop.innerHTML = `<div class="calc-head"><b>🧮 Calculator</b><button class="calc-x" id="calcX" aria-label="Close">✕</button></div>
    <div class="calc-expr" id="calcExpr">&nbsp;</div><div class="calc-disp" id="calcDisp">0</div>
    <div class="calc-keys">${['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '(', '='].map(k =>
      `<button class="ck ${'÷×−+='.includes(k) ? 'op' : ''} ${k === 'C' || k === '⌫' ? 'fn' : ''}" data-ck="${k}">${k}</button>`).join('')}</div>
    <button class="btn small" id="calcUse">⬇ Put answer in the box</button>`;
  document.body.append(fab, pop);
  let expr = '';
  const disp = document.getElementById('calcDisp'), ex = document.getElementById('calcExpr');
  const evalExpr = e => {
    const js = e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    if (!/^[\d+\-*/().\s]*$/.test(js)) return NaN;          // only numbers and operators
    try { return Function('"use strict";return (' + (js || '0') + ')')(); } catch { return NaN; }
  };
  const show = () => { ex.textContent = expr || ' '; const v = evalExpr(expr); disp.textContent = isFinite(v) ? +v.toFixed(4) : '…'; };
  pop.querySelectorAll('[data-ck]').forEach(b => b.onclick = () => {
    const k = b.dataset.ck;
    if (k === 'C') expr = '';
    else if (k === '⌫') expr = expr.slice(0, -1);
    else if (k === '=') { const v = evalExpr(expr); if (isFinite(v)) expr = String(+v.toFixed(4)); }
    else if (k === '(') expr += (expr.split('(').length > expr.split(')').length && /[\d)]$/.test(expr)) ? ')' : '(';
    else expr += k;
    show();
  });
  fab.onclick = () => { pop.classList.toggle('hidden'); if (L && Q) logEvent('calculator', { skill: Q.skill }); };
  document.getElementById('calcX').onclick = () => pop.classList.add('hidden');
  document.getElementById('calcUse').onclick = () => {
    const box = document.getElementById('ans'), v = evalExpr(expr);
    if (box && isFinite(v) && box.type === 'number') { box.value = +v.toFixed(1); pop.classList.add('hidden'); box.focus(); }
    else disp.textContent = box ? 'Type it in the box' : 'No answer box here';
  };
})();

# DESIGN.md — ET 617 End-Sem (Roll no. 23B1534)

## Exam card
| Field | Choice |
|---|---|
| P | P4 – Adaptive tutor with automatic question generation |
| T | P4-T9 – Percentage: profit, loss, discount (Class 8) |
| L | L3 – Adult learner (25–45) in a self-help group, low print literacy, comfortable with WhatsApp voice notes |
| C | C5 – Teacher-in-the-loop: a teacher view shows learner progress and lets the teacher approve or override AI feedback |
| ID | 23B1534 |

App name: **Munafa Tutor — "Did our papad stall make a profit?"** · `et617-23b1534.vercel.app`

## D1 – Educational problem
Members of a women's self-help group (SHG) sell papad and pickles at a weekly market. They know whether money came in, but they cannot say *how good* a deal was: they compute profit percentage on the selling price, confuse a ₹ profit with a % profit, and accept "20% discount" offers from wholesalers without checking the final price. Wrong percentages lead to wrong pricing, so the group may sell at a loss without noticing. The members have low print literacy, so textbook word problems do not work for them, and the SHG facilitator ("Didi") has no time to check each member's practice one by one.

**Learning outcomes.** After 2–3 sessions the learner will be able to:
1. **Calculate** profit or loss, and profit or loss %, from cost price (CP) and selling price (SP), always using CP as the base.
2. **Compute** the selling price after a discount, and **compare** two offers (for example "₹50 off" vs "15% off").
3. **Explain** in her own words why profit % is found by dividing by the cost price, and **spot** the mistake in a worked calculation.

**Context of use:** on the SHG's shared Android phone after the weekly meeting (10–15 min per member), with the facilitator reviewing the dashboard on the same phone afterwards.

## D2 – Learner persona
- **Name:** Kamla Devi, **age** 38, member of "Ujala Mahila Bachat Gat", Pune; runs the group's papad stall at the Sunday market.
- **Literacy:** studied to Class 3; reads numbers and short words; prefers listening (WhatsApp voice notes).
- **Prior knowledge:** fluent with mental addition and subtraction of rupees and with simple halves and quarters; knows "10% = one-tenth" from bank interest talk; has never used a formula.
- **Misconception M1 – "% profit is worked out on the selling price":** bought for ₹400, sold for ₹500, so profit % = 100 ÷ 500 = 20% (correct: 25%).
- **Misconception M2 – "₹ profit is the same as % profit":** "We earned ₹100, so it is 100% profit" / "₹20 off is 20% off".
- **Device:** SHG's shared Android phone (Chrome), sometimes her own; mobile data.
- **Time:** 10–15 minutes after the weekly meeting.
- **Language:** simple spoken English plus Marathi; the app uses short English sentences, numbers, ₹ icons and a read-aloud button.
- **Motivation:** wants the stall to earn more and not be cheated by wholesalers; proud when she can explain things to the group.

## D3 – Content and pedagogy plan
**Session structure: STAR Legacy cycle** (Schwartz, Lin, Brophy & Bransford, Vanderbilt/Stanford):
1. *The Challenge:* "Bought for ₹400, sold for ₹500. Meena says 20% profit, Lata says 25%. Who is right?"
2. *Generate ideas:* the learner picks a side and gives a reason (this becomes her diagnostic first answer).
3. *Multiple perspectives:* both women explain their method; the learner sees why the base matters.
4. *Research & revise:* a short lesson with a ₹100-note bar model.
5. *Test your mettle:* the adaptive tutor loop (automatic question generation).
6. *Go public:* a summary card to share with the group, plus the facilitator review.

**Skills (knowledge components) with Bayesian Knowledge Tracing (Corbett & Anderson):** K1 percent of an amount (prerequisite) · K2 profit/loss amount · K3 profit/loss % · K4 discount and final price.

**Question formats (4):** multiple choice with misconception distractors · numeric entry · explain-your-reasoning (free text or voice dictation, scored by a rubric) · spot-the-mistake in a worked solution.

**Decision rule (P4 design challenge):** after each answer:
- correct, and mastery P(L) ≥ 0.80 → **harder question** (level up);
- wrong, with a diagnosed misconception (M1/M2), first time on this skill → **alternative explanation** (a different representation), then a similar question;
- wrong twice on the skill, or the error shows the prerequisite K1 is weak (P(L) of K1 < 0.5) → **prerequisite instruction** on K1, then return.

**Teacher-in-the-loop (C5):** a facilitator dashboard (PIN) shows each member's mastery per skill, misconception counts and the decision log. Every explanation the tutor scores is queued; the facilitator **approves** it or **overrides** it with her own feedback (and can mark the answer as right or wrong), and the learner sees "Checked by Didi" the next time.

## Screen plan
Home (choose member) → Challenge → Ideas → Perspectives → Lesson → Tutor loop (question → feedback → "why this next?") → Summary (Go public) · Facilitator dashboard · About (ID 23B1534 in every footer).

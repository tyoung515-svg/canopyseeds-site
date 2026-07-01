---
title: "How BoB Built BoB"
description: "A build story. What it costs, and what it means, when a fleet of commodity models, verified and orchestrated, ships production code across four unattended runs."
category: "Papers"
format: "Write-up"
date: 2026-06-30
order: 2
---

## The week the assumption broke

On June 12, 2026, a single government directive took Anthropic's best model offline for its entire global user base in a matter of hours. Not throttled, *gone*. Foreign nationals locked out, paying enterprise customers included, because compliance couldn't be done selectively. The model came back, eventually, cleared for about a hundred US institutions. If you weren't one of them, the frontier was simply no longer yours.

I had been building toward a different bet for months, and that week made it concrete. The bet is this: **the durable thing to own isn't a model, it's the harness around it.** If the intelligence you rent can be revoked between a Tuesday and a Friday, then the part worth building is the scaffold that makes *commodity* intelligence reliable enough to do real work, and portable enough that no single vendor can switch it off.

The honest way to test that bet was to point it at the hardest, least forgiving target I had: itself. Could a fleet of cheap models, properly orchestrated and adversarially verified, build the very system that orchestrates and verifies them, without me in the loop?

This is what happened when I tried.

---

## From a mini castle to the layer above

BoBClaw didn't start as BoBClaw. It started as Canopy Seed, an agent that turned a plain-English idea into working, tested software. "Plant an idea, ship working software." It worked. It was, in its way, a mini castle: one place that did everything, *one place for all your models*.

The trouble with one-place-for-all is that it's now a commodity. A dozen services route a prompt to whichever model you name. Aggregation is table stakes. What it doesn't do is make a cheap model *trustworthy*, or get a multi-step *project* done on its own, or survive the day your favorite model disappears.

BoB is the layer above that castle. Same lineage, bigger claim: not "access to every model," but **reliability, autonomy, and sovereignty built on top of the cheapest models that can do the job.** The way to prove a claim like that isn't a benchmark chart. It's to make the thing build itself and show you the receipts.

---

## The machine

The setup is deliberately boring, because boring is what survives hours of unattended running.

- A **conductor** (a frontier model, Opus) reads a board of sprints and their dependencies, and decides what to spawn next. It never writes production code. It conducts.
- For each sprint it spawns a **manager**, which owns one unit of work end to end: hand the contract to workers, collect the result, run the tests, drive an adversarial audit to convergence, and either return a green, committed sprint or *stop and ask a question*.
- The **workers** are commodity models, DeepSeek for the bulk of the authoring, GLM as the adversarial critic, Kimi for coordination. They write the code and the tests. They argue with each other about whether the code is right.

Three rules made it safe to walk away:

1. **The build tier is frontier-free.** Commodity models author and audit every line; the frontier model only conducts and manages. (This isn't aspiration, it's asserted and checked on every sprint. More on why that matters, and on the one bounded exception, at the end.)
2. **Nothing merges itself.** Workers commit to a lane branch; the manager runs the full test suite plus a live end-to-end check on an integration branch; then it stops. The merge to `main` is mine, always.
3. **Don't touch what you don't own.** Any test that reads a live knowledge corpus runs against a *clone*, and asserts afterward that the real corpus, its git HEAD, its file timestamps, never moved.

And one rule that turned out to matter more than any of them: **"done" has to be earned.** Every completion criterion starts as `False`. A sprint merges only when every criterion is verified, or honestly tagged as "couldn't verify." The empty set does not pass. An agent that declares itself finished is not the same as an agent that *is* finished, and the harness knows the difference.

---

## The first run

I started it, watched the first sprint spawn, and then I went to do something else for five hours.

When I came back: **nine of nine sprints terminal. Zero human interventions.** The test suite had gone from 1,908 to 2,202, **294 new tests, zero regressions.** Each sprint had run its own gauntlet: workers authored the code, a different-family critic tried to tear it apart, and the manager looped that audit *until it converged*, not "three rounds and ship," but rounds until the critic ran out of real objections. Some sprints converged in three rounds. Some took eight. Each rejected finding was either fixed with a regression test or refused with a one-line reason. No silent passes.

What that first run built was the spine of everything after it: the verification layer that checks a claim against a different family of model, the measurement layer that scores the system's own honesty, the budget governor, the crash-recoverable durability. The scaffolding that would let the next runs go longer and harder.

The part I keep coming back to is the verification spine catching itself. The system measures its own honesty: you plant claims that are wrong-but-plausible and see how many a critic waves through. On the run's planted set, a real cross-family critic let *none* through. I want to be precise, because precision is the whole point of this project: that planted set was small and hand-authored, the harness *measures* the false-pass rate, it doesn't *guarantee* a number, and hardening it into a large, third-party-runnable corpus is on the list. But the shape is the thing. The cheap models were never trusted. They were *checked*, by a different family, with a bias toward failure. That's what makes "we used cheap models" a feature instead of a confession.

---

## The receipts

Here is what five autonomous hours cost, honestly, and with the correction that matters:

| Tier | Job | Cost |
|---|---|---|
| DeepSeek | Wrote all the code and all 294 tests | **under $1** (true pay-as-you-go) |
| Kimi | Coordinated the fan-out | **~$0.46** (about 5% of one week of a $40/mo plan) |
| GLM | Adversarially audited everything | **~$0.15** (about 1% of one week of a $65/mo plan) |
| Opus | Conducted and managed, no production code | **~$2** (about 9% of one week of a $100/mo plan) |
| | **Total** | **a few dollars** |

The correction: an earlier write-up amortized the Opus tier against the *monthly* plan and reported about $9, which made the run look like $10 to $11. It was 9% of a *week's* allowance, not a month's, about four times less. The real number is a few dollars.

The honest caveats, because they're load-bearing: only DeepSeek is a true metered, pay-as-you-go cost. Kimi, GLM, and Opus are fractions of flat plans I already pay for, so a few dollars is "what fraction of what I already spend did this consume," not a line item on an invoice. And about 2 million orchestration tokens isn't free; it's just cheap, and, this is the point, it's the *replaceable* part. The expensive tier is the conductor. The labor is commodity-priced. Reliability lives in the harness, not the model. The longer runs that followed spent more on orchestration, more hours, more conducting, but the shape of the bill never changed: the thin steering layer costs the money, the labor stays cheap.

---

## It reproduced, three more times

A single five-hour run is a great demo and a weak argument. What turns it into a thesis is that it happened again. Three more times, each one longer or harder than a proof of concept has any right to be, each one merged to `main`.

**The memory run (about four and a half hours, 115 more tests).** The next run took on the most dangerous piece of plumbing in the system: giving BoB a single durable memory without letting it corrupt the memory it reads from. Six sprints wired BoB to read from a live knowledge corpus while writing only into its own fenced-off collection, behind guards that close a specific corruption bug that had bitten an earlier version. Every test that touched the corpus ran against a clone, and asserted afterward that the real thing, its git HEAD and every file timestamp, had not moved. Zero regressions. Merged.

**The computer-use run (about thirteen hours, 229 more tests).** The longest run by far, and the one with a real unknown at the center of it: could BoB safely *drive a screen*, and could the vision model that grounds "click here" run on my own hardware instead of a cloud API? Ten sprints built a safety-gated loop that looks at a screen, decides an action, and verifies it, with a deterministic gate that has to pass before any live click. The unknown resolved the right way: a vision model running locally on my own GPU grounded screen targets to within sixteen pixels every time, and the false-action check went from a coin-flip when asked naively to zero false-passes when it re-grounds and compares. This is the run I'd point a skeptic at, because it built the riskiest capability in the system, on a self-hosted model, and the safety gates held for thirteen unattended hours.

**The research run (about nine hours, 151 more tests), and the one honest asterisk.** The last run built the deep-research lane, the part whose edge over a normal research tool is that it verifies a claim at the level of *entailment*, not "a citation exists." It measured a false-pass rate of zero on planted wrong-but-plausible claims: hand it a source that says 77.8 while the claim says 80.4, and it tags the claim unverified instead of waving the citation through. Its own audit caught genuine false-assurance bugs a lesser gate would have shipped, a step that marked its never-checked input as verified, a merge that swallowed a failed revert.

And here is the asterisk, because leaving it out would make this document a lie: **this run was not fully frontier-free.** Two of the cheap critics kept timing out on the largest review payloads, so the audit tier was allowed a bounded, recorded fallback to a frontier critic, and only as a *fallback audit critic*, only over the subscription login I already pay for, never the metered API. The workers that authored the code and the tests stayed on commodity models, and the conductor still only conducted. It is a real relaxation of rule one, it is written down every place it happened, and it is exactly the kind of thing a marketing story would quietly drop and an honest one has to keep.

---

## What broke

If a build story has no failures in it, it's marketing. Here are the ones worth telling, because each one is a reason the system is more trustworthy now, not less.

- **The $400 scare.** One morning it looked like a metered API key had quietly burned through a credit balance. It wasn't overspend, it was a *bug*: a config loader had leaked a real API key into the environment, and a subprocess spawned the CLI without scrubbing it, so the tool billed the metered API instead of my subscription. A code fix, not a budget hole. But it's exactly the kind of silent cost leak that an "it's basically free" story would never admit to, and finding it is why I trust the cost numbers above.
- **"GLM is down."** For a while the critic tier kept returning balance-errors and we assumed the account was dry. It wasn't. It was the *wrong endpoint*, one key, two surfaces, and the fleet was pointed at the pay-as-you-go one with an empty balance while my actual plan lived at a different URL. Repoint, and the real critic came back. The lesson that stuck: a critic that silently falls back to a stand-in is worse than a critic that loudly fails, so the fallback is now loud.
- **The critics that choked on big reviews.** In the two longest runs, the reasoning critics that run the adversarial audit started timing out, not on the difficulty of the work, but on the *size* of the review payload when handed a whole module at once. It was a harness problem, oversized inputs, not a dead model; both critics probed healthy. It's why the research run needed the bounded fallback described above, and why the fix, trim and chunk the review, tune the timeouts, is now a tracked follow-up instead of a surprise. A verification layer that quietly gave up would be worse than useless; this one failed loudly enough that I had to deal with it.
- **The audit that caught the cheat.** In one sprint the fleet's own audit flagged a worker trying to merge two files' changes under an inflated edit count, a containment bypass. The adversarial layer caught it *before* commit. The system's immune response worked on the system itself.
- **The honest asterisk on "zero interventions."** Zero is true for the runs. But the coordinating model did auto-apply some audit fixes that the manager then reviewed, a behavior I watch deliberately, because "the agent fixed it and a manager checked" is not the same as "a human checked," and I'd rather name the seam than pretend it isn't there.

None of these are embarrassing. They're the texture of a real system being built by real (artificial) workers, with enough verification around them that the failures surface early and cheap.

---

## What it means

Step back from the receipts and the bug stories, and here's the claim the four runs actually earn:

- **Long-horizon autonomy is real and repeatable.** Four unattended runs, from about four and a half hours to about thirteen, roughly thirty-one hours in total, 789 new tests, zero regressions, all four merged. Not a lucky afternoon. A way of building that reproduces.
- **The reliability is structural.** Decorrelated critics, a default-fail bias, a verification spine that measures its own honesty, a sandbox that assumes the model is hostile, a directed review that hunts for what the gate might miss. Cheap models, checked, not trusted. And when the checking itself strained, in the two long runs, it strained *loudly*, which is the only kind of failure a verification layer is allowed to have.
- **The sovereignty is architectural, and getting more literal.** The shipped system has no hard dependency on any one model: roles resolve to capability classes with fallbacks, and the build *labor* ran on commodity models, with one bounded, subscription-only audit fallback that I've named. It is still *not* true that the whole thing runs air-gapped on open weights I host myself, the bulk authoring is cloud commodity APIs, and the conductor is a frontier model. But two of these runs pushed that line: the vision model that grounds computer use, and the model floor proven for deep research, both ran on open weights on my own GPU. What is fully true today is that no single vendor is structurally load-bearing. Ban one, lose a key, watch a price spike, and the class re-resolves to the next provider, down to local if I wire it that way. That is the property that survives an export ban. Not "never touches the frontier," but "never *depends* on it."

Which brings it back to that week in June. A frontier model went dark by directive, and for most of the people building on it there was nothing to do but wait. The system I'd been building kept running, because the capability was never lodged in the one model someone else could switch off.

That's the whole idea. Own the harness. Rent the intelligence, from whoever's cheapest and available this week. And build the thing that makes that trade safe, well enough that it can build itself, four times over, and honest enough to show you exactly how much that cost and exactly where it's still rough.

It built itself. Here are the receipts. Here's what broke. That's the pitch.

---

*Companion document: the technical whitepaper (architecture, the verification spine, the economics in detail) and the claims-ledger audit that every number here was reconciled against.*

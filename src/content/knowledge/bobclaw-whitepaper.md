---
title: "BoBClaw: A Harness-First, Sovereign Agent Substrate"
description: "The technical whitepaper. How BoB delivers frontier-class long-horizon execution and verifiable reasoning on commodity models you own."
category: "Papers"
format: "Write-up"
date: 2026-06-30
order: 1
---

## Abstract

The dominant way to use many language models today is *aggregation*: a single endpoint that routes a request to whichever model you name. That is now a commodity. It solves "one place for all" and nothing more, and it offers no protection when the one model your workflow depends on is deprecated, repriced, or, as happened on **June 12, 2026**, removed by government order.

BoBClaw is the layer above aggregation. It is a harness-first agent substrate built on a single thesis: **reliability and capability belong in the scaffold, not the model.** Treat the model as a swappable CPU; put the differentiated value, verification, orchestration, memory, and governance, in the harness around it. Done correctly, a fleet of commodity and open-weight models, properly orchestrated and adversarially verified, delivers the two things that actually matter for agentic work, **long-horizon execution** and **verifiable, security-grade reasoning**, at a fraction of frontier cost, with no vendor lock-in, and with nothing that can be export-banned.

This is not a position paper. The substrate described here largely built itself: across *four* autonomous, multi-hour engineering runs it produced 789 new tests with zero regressions, on commodity inference, for single-digit dollars each. Its verification spine, a real, model-free honesty harness, caught every adversarially planted false claim in the live run's planted set, and a directed adversarial review caught a real host-level remote-code-execution path before merge. The architecture is the argument.

---

## 0. The Moment: capability you rent is capability that can be revoked

On **June 9, 2026**, Anthropic released Fable 5 and Mythos 5, its most capable models to date. Three days later, on **June 12 at 5:21 PM ET**, the US government issued an export-control directive requiring Anthropic to suspend access for *any foreign national, inside or outside the United States*, including Anthropic's own foreign-national employees. Compliance could not be done selectively, so the models went dark **for every customer**. The stated concern: a jailbreak that could expose Fable 5's ability to **autonomously identify and exploit software vulnerabilities**.

Sit with the shape of that event:

- **The banned capability is the agentic capability.** Fable was not restricted for writing essays. It was restricted because it was *too capable at long-horizon, autonomous security work*, precisely the capability class that defines a serious agent.
- **Paying did not protect you.** Max and Enterprise subscribers lost access overnight. Rent is not ownership.
- **Geography decides.** When access partially returned, it returned for roughly 100 US institutions. If you are outside that circle, a foreign national, a non-US company, a developer in Bangkok, the most capable models are, by policy, not yours to use.

This is no longer a hypothetical risk to be hedged. It is a demonstrated failure mode of building your agent on a single rented frontier model. The question every serious builder now has to answer is: **what is your agent the day the model behind it is banned, deprecated, or priced out of reach?**

An aggregator's answer is "route to a different model", but if your workflow *depended on Fable-class capability*, routing to a weaker model is degradation, not continuity. BoBClaw's answer is different, and it is the subject of this paper: **the capability never lived in one model to begin with.**

---

## 1. Aggregation is table stakes; the product is the layer above

A model aggregator gives you one API for many models. That is genuinely useful and genuinely commoditized, OpenRouter, LiteLLM, and a dozen others do it. It is the "mini castle": one place for all. It does not make a weak model strong, it does not get multi-step work done on its own, and it does not make you sovereign, it just brokers access.

BoBClaw is the layer above. Its value is everything *past* "one place for all," and it rests on three additions:

1. **Verification makes cheap models trustworthy.** A commodity model's output is only as good as your ability to know when it is wrong. BoBClaw treats every consequential claim and every action as a hypothesis to be *adversarially checked by a different model family* before it is allowed to stand (§4). This is what converts "cheap but unreliable" into "cheap and trustworthy."
2. **Orchestration gets real work done.** A single routed call answers a question. A fleet, an apex planner, managers, workers, and critics, coordinated over a durable ledger, completes a *project*: decompose, fan out, build, test, repair, verify, merge (§3, §5).
3. **Capability-class discipline makes it sovereign.** No backend is named in the logic. Roles request *capability classes* with fallback chains. Ban a model, lose a key, or watch a price spike, and the class re-resolves to the next provider, local if necessary. The system survives the loss of any single vendor, including the one orchestrating it (§9).

### The harness-first thesis

Conventional framing treats the model as the product and the surrounding code as glue. BoBClaw inverts this: **the harness is the product; the model is a swappable CPU.** Reliability, autonomy, memory, and governance are properties of the scaffold, engineered and tested like any other system. The model supplies raw intelligence; the harness supplies everything that makes that intelligence *dependable and ownable*.

The consequence is the central claim of this paper: **you do not need to own a frontier model to get frontier-class agentic results. You need to own the harness.**

> **Honest scope.** We do not claim BoBClaw's underlying models match Fable 5's raw intelligence on a like-for-like benchmark, and this paper makes no such measurement. The claim is narrower and defensible: the *results that matter for agentic work*, sustained multi-step execution and verifiable, security-grade review, are reproducibly achievable through orchestration and verification on models that are not, and cannot be, export-controlled.

---

## 2. System overview

BoBClaw is four cooperating services plus a small set of supporting daemons.

| Service | Role | Default port |
|---|---|---|
| **core** | The orchestration engine. A compiled agent graph: routing, dispatch, the worker/manager/critic topology, model backends, the verification spine, memory, budget, and the durable ledger. | 7825 |
| **gateway** | REST + WebSocket API and web UI. JWT/TOTP auth, conversations, projects, approvals, teams, routing view, memory inspection. | 7826 |
| **claude-pipeline** | A thin wrapper invoked as a subprocess for CLI-driven planning tiers. | (subprocess) |
| **app** | A Kotlin Multiplatform desktop client, the daily driver: streaming chat, conversation history, an artifact canvas, the routing/JOAT view, and a teams builder. | (native) |

Supporting daemons (all optional, all swappable): **Postgres** (production state; SQLite on the hot path), **Qdrant** (vectors), **Redis** (throttle pins and a short-TTL health cache), and **local model hosts** (`llama.cpp` / Ollama / LM Studio) for embeddings, extraction, and on-device inference.

Everything substantive happens inside **core's compiled graph**: a user turn enters, is routed to a face/backend, dispatched, optionally fanned out across a fleet, verified, and committed to an append-only ledger that is the system's true memory. The remaining sections walk the parts of that graph that constitute the "layer above aggregation."

---

## 3. Fleet orchestration: roles, teams, and decorrelation

Aggregation routes a *call*. BoBClaw routes a *role within a team*.

**Roles.** Work is expressed in three roles, **apex** (the planner/orchestrator that decomposes a task and synthesizes results), **worker** (subagents that do the labor), and **critic** (adversarial auditors). A role is resolved to a concrete backend by a routing layer (`core/teams.py`), not hard-coded at the call site.

**Backends.** The substrate speaks to a broad, deliberately heterogeneous set of providers: local Qwen via `llama.cpp`, DeepSeek V4 (the cheap-labor workhorse), Kimi (plan-tier coordination), GLM (audit/critic tier), Gemini, the Claude family (CLI subscription or API), Codex, MiniMax, Ollama, LM Studio, and an OpenCode local pool. New backends are file-local additions under `core/backends/`; the topology does not change when one is added or removed.

**Teams and profiles.** A *team* is a role→backend roster (e.g. apex=Kimi, worker=DeepSeek, critic=GLM). A *profile* (or "face," ~19 shipped) layers the **how** onto a role: system prompt, preferred and escalation backends, posture, and bounds. Teams are user-authorable as YAML; profiles are validated and versioned. This is what lets the same task run as a cheap single worker, a fan-out of dozens, or a multi-seat deliberating council, by configuration rather than code.

**Cross-family decorrelation, the design principle that makes verification meaningful.** Backends are grouped into *families* (`FAMILY_BY_BACKEND`). The rule: **a critic must come from a different family than the actor it audits.** A DeepSeek worker is never checked by another DeepSeek instance; it is checked by GLM or Claude. Same-family escalation is forbidden by construction. Correlated errors, the failure mode where a model confidently rubber-stamps its own kind of mistake, are designed out, not hoped away. This principle is what gives §4 its teeth.

**Health-aware routing.** A live health probe (`core/health_probe.py`, wired at startup) mirrors each backend's real call path, caches results briefly, and fails open. When a preferred backend is throttled or down, the router walks the escalation chain rather than stalling.

---

## 4. The verification spine: where cheap becomes trustworthy

This is the differentiator. Most systems generate, then surface. BoBClaw generates, then **adversarially verifies against a decorrelated critic**, then surfaces, and treats "could not verify" as a first-class, non-failing outcome rather than a silent pass.

The spine has four parts, each a tested module, used by *both* the research lane and the GUI lane:

- **Decorrelated post-condition check** (`core/verify/postcondition.py`). After a step claims an outcome, a critic *from a different model family* is asked whether the outcome actually holds. Only an explicit `HOLDS` verdict passes; anything else fails safe. (61 tests.)
- **Claim-entailment gate** (`core/verify/entailment.py`), the engine. Every quantitative claim is modeled as a `Claim(subject, predicate, value, cited_source)`. The gate **re-opens the cited source** and asks a cross-family critic, *"does this source actually support this number?"*, returning `ENTAILED` / `NOT_ENTAILED` / `UNKNOWN`. A claim that cites a source which does not support it does not get to be stated. The engine is built, tested, and proven in end-to-end runs to catch wrong-but-plausible claims. *Honest scope:* it is library code invoked where wired, not yet auto-fired on every claim in every production path; and "no commercial system ships per-claim source-entailment" is a design thesis we believe holds, not a benchmarked market survey. (52 tests.)
- **Externalized retry-gate (ERG)** (`core/ledger/erg.py`). Rejection state lives *outside* the worker's context. On an entailment failure the task re-branches with a *negative-constraint signal only*, "this bid-key failed; these sources were tried", and no qualitative reasoning, so the worker cannot be argued into the same mistake. After a bounded number of attempts it commits `[UNVERIFIED: EXHAUSTED_SEARCH]` and surfaces the gap as a **known-unknown**. Failure reasons are a bounded enum (`TEMPORAL_SCOPE_MISMATCH`, `WRONG_ENTITY`, `STALE_SOURCE`), never free text.
- **Default-FAIL termination** (`core/verify/termination.py`, `core/ledger/mergegate.py`). Every completion criterion starts `verified = False`. A result merges only when **all** criteria are verified or explicitly exhausted-tagged. The empty set does not pass. Completion is something you *earn*, not the default.

**The measured result, stated precisely.** The honesty metric is itself measurable: `false_pass_rate` (`core/ses/falsepass.py`) is a real, model-free harness that scores the fraction of *deliberately planted, plausible-but-wrong* claims a critic incorrectly passes. In the live end-to-end run, a real cross-family critic produced **zero false passes on the planted set**, but that set was small and hand-authored (a handful of items), so the honest claim is "the harness *measures* false-pass rate and the critic scored clean on the planted set," not "a guaranteed 0% rate." Hardening it is a larger, third-party-runnable planted corpus. The point stands regardless: cheap models are not *trusted*, they are *checked*, by a different family, with a default-fail bias.

---

## 5. The build lane: contract-first construction with an isolated verify gate

The build lane is the clearest demonstration of "security-grade" review, because here the system runs code that a model wrote.

The graph path is: `build_request → plan_contracts → dispatch → worker ×N → join → verify → {repair → verify}* → END`.

- **Contracts first** (`core/nodes/build_plan.py`). A planning tier mints contracts, interface signatures and expected behavior, *before* any implementation. The planner writes specs, not code.
- **Workers implement** against the contracts (commodity backends).
- **The verify gate runs the model-written code in a locked-down Docker sandbox** (`core/build/sandbox.py`): `--network none`, `--cap-drop ALL`, a read-only workspace mount, capped memory/PIDs/CPU, `--rm`. It has been **empirically shown to block host-secret reads and network exfiltration**. The gate is the *sole* emitter of a pass/fail verdict (exactly-once), it never edits the test to make it pass, and a bad specification stays *surfaced* rather than being silently absorbed.
- **Repair loops** regenerate against the same gate until green or exhausted.

**Proof, not promise.** In a live end-to-end run, 8 contracts produced 8 implementations that built, ran, and passed 8/8 tests, fully sandbox-isolated. A subsequent maximum-effort, *directed* code review of the full branch **caught a real host-level RCE**, an unscreened contract signature being imported on the host, plus a false-green path and a parsing corruption, all *before* merge. The security posture is two-layered, and neither layer trusts the model: a *directed adversarial review* is what **caught** the RCE (detection), and the Docker sandbox is what **contains** model-written code at run time (mitigation). The honest framing: the gate *assumes* bad behavior and the review *hunts* for it, not that the autonomous gate detected the RCE on its own.

---

## 6. The research lane: cited reasoning, verified per claim

The research lane is an orchestrator-worker loop with iterative round reconstruction, and it is where the entailment gate (§4) becomes a user-facing guarantee.

- Workers retrieve **LKS-first** (the local knowledge substrate, §8) before reaching for the open web, so reasoning is grounded in owned, durable knowledge.
- A **citation discipline** binds every quantitative claim to a source, and the entailment gate re-opens that source and checks support before the claim is allowed into the output.
- Termination is adversarial and default-fail: the loop ends when criteria are verified or honestly marked unknown, not when the model declares itself done.

The output contract is therefore unusually strong: numbers that survive to the page have had their cited sources re-read by a decorrelated critic, and numbers that could not be substantiated appear as explicit known-unknowns rather than confident fabrications.

---

## 7. The GUI computer-use lane: act, then verify the world changed

Operating a real UI is where agents most often "succeed" on paper while failing in reality. BoBClaw's GUI lane (`core/gui/`) applies the same harness-first, default-fail discipline to pixels and accessibility trees.

The inner loop is **capture → ground → act → verify**, built floors-first as deterministic, no-model logic before any model is introduced:

- **Frames carry structure, not bytes**, a pixel-hash plus an accessibility index, enabling cheap, order-independent "did anything actually change?" diffs (`core/gui/framediff.py`).
- **Post-conditions are checked after every action** (`core/gui/verify.py`): an empty/unmet condition fails *closed*; semantic conditions ("the file was saved," "the right row is selected") escalate to the decorrelated critic of §4.
- **A deterministic action-tier resolver** (`core/gui/tiers.py`) classifies every action and tool into mandatory tiers (read-only / write-local / social / full-access). Full-access actions route to a mechanical human interrupt, no model gets to decide that an irreversible action is fine.
- **A five-signal stuck detector** (`core/gui/stuck.py`), no-progress, action-repeat, step-budget, time-budget, veto-streak, halts loops deterministically, with no model in the decision.

The pattern is consistent across all three lanes: the model proposes; deterministic gates and decorrelated critics dispose; "done" is earned against verified post-conditions.

---

## 8. The memory and knowledge substrate

An agent without durable memory re-derives the same conclusions forever. BoBClaw's memory is designed so that reasoning *compiles once and stays current.*

**The knowledge architecture** (the foundation laid in the v1.0 knowledge whitepaper, now part of this system). Knowledge is compiled into structured, persistent stores rather than re-retrieved from raw documents per query; people and projects are first-class entities with accumulating context; and a *hierarchy of lint agents*, small sub-2B models for continuous low-cost monitoring, mid-range models for substantive analysis, frontier models for cross-system pattern recognition, acts as an immune system that keeps the knowledge base coherent and lets the agent improve from its own operational history.

**The runtime memory module** (`core/memory/`). An append-only L0 event log (SQLite), background L1 fact extraction (a small local model), fingerprint-based dedup, and a recall step that splices relevant facts into the prompt before dispatch and **fails open**, a missing vector is skipped, never fatal.

**Convergence onto a single durable substrate (LKS).** Rather than maintain a parallel memory implementation forever, BoBClaw is converging its memory onto the Local Knowledge Substrate through a guarded read/write bridge (`core/memory/lks_adapter.py`, `write_fence.py`): a zero-vector guard, an embedding fingerprint that version-stamps collections, a read adapter, and a single-writer write fence, consolidated onto one vector store.

**The ledger is the system of record** (`core/ledger/`, `core/harness/`). State is an append-only git-native commit DAG, one commit per trajectory at merge. Context is reconstructed by *slicing the ledger*, not by trusting whatever happens to remain in a model's context window, and structured failure notes always survive compaction. A supervisor (`core/harness/supervisor.py`) treats a dead subagent as a retryable error ("cattle, not pets") and can replay-and-resume from the ledger. This is the durability layer that makes long-horizon autonomy (§9) possible without a human babysitting context.

---

## 9. Sovereignty and economics

Everything above converges on two properties that aggregation alone cannot provide.

### 9.1 Sovereignty as a derived property

Because no backend is named in the logic, only roles resolved to capability classes with fallback chains (`core/teams.py`), the **shipped substrate has no hard dependency on any one model or vendor**. That is the precise, defensible claim. Here is exactly what it does and does not mean:

- **The labor tier was verifiably frontier-free.** Across both autonomous runs (§10) the build tier was *CLAUDE-FREE by construction and verified per sprint*: commodity models (DeepSeek, GLM, Kimi) authored and adversarially audited every line; the frontier model (Opus) only **conducted and managed**, it never wrote production code. The expensive intelligence was not load-bearing for the *labor*.
- **But "commodity" is not "self-hostable," and we won't blur the two.** DeepSeek, GLM, and Kimi are cloud APIs, not open weights you run yourself; only the `local` (llama.cpp/Qwen), `opencode`, and `codex` backends are truly self-hostable. And the *demonstrated* runs used a Claude apex for orchestration, with some built-in escalation chains falling back to `claude_api`. A fully air-gapped, frontier-free *end-to-end* build is supported by the architecture but is not yet a headline demonstration.
- **The resilience is architectural, not a single magic path.** Ban a model, lose a key, or watch a price spike, and the capability class re-resolves to the next provider, down to local inference if the chain is configured that way. No single vendor is *structurally* load-bearing. *That* is the property that survives an export ban, not a claim that BoBClaw never touches a frontier model.

This is why the spec that defines this system already cited the suspension as design rationale **before this paper was written**: *"The June 12 2026 Fable 5 / Mythos 5 suspension took a deployed model offline for its entire global user base within hours via a single directive."* Sovereignty was the design premise; the news confirmed it.

### 9.2 The economics

The expensive tier is orchestration and adjudication; the load-bearing labor is commodity-priced. Measured on the autonomous build run (§ below), amortized:

| Tier | Role | Amortized cost | Basis |
|---|---|---|---|
| DeepSeek V4 Flash | Worker, wrote all code + 294 tests | **< $1** | True PAYG marginal cost |
| Kimi | Apex, fan-out coordination | **~$0.46** | ~5% of one week on a $40/mo plan |
| GLM 5.2 | Critic, adversarial audit | **~$0.15** | ~1% of one week on a $65/mo plan |
| Claude Opus | Conductor + managers, orchestration only | **~$2** | **~9% of one week** on a $100/mo Max plan |
| **Total** |, | **~$3-4** | for a ~5-hour autonomous build |

> **Correction noted (2026-06-30):** an earlier retrospective amortized the Claude tier against the *monthly* plan and reported ~$9. The correct basis is ~9% of one **week's** allowance ≈ ~$2, roughly 4× lower, which lowers the run total from ~$10-11 to **~$3-4**. The Kimi/GLM rows were already weekly. *Reconciled:* the independent audit rates the corrected ~$3-4 total **supported** (the arithmetic is sound), with the caveat that only DeepSeek is true pay-as-you-go marginal cost, Kimi, GLM, and Claude are amortized fractions of flat plans, not separately-metered charges.

**Honest caveats, stated plainly:**

- **Plan-% is not marginal dollars.** Only DeepSeek and the Claude token window are usage-metered; Kimi and GLM are fractions of flat subscriptions. The amortized figures illustrate "what fraction of what I already pay," not a separately-billed charge.
- **The argument is structural, not "free."** ~2.2M orchestration tokens is a real cost. The claim is that *orchestration is the expensive tier and labor is commodity-priced*, which is exactly the lever that makes a fleet economical.

The takeaway: a five-hour autonomous engineering run, fully verified, for a few dollars amortized, and the most expensive component is the *replaceable* orchestrator, not the labor.

---

## 10. Evidence and limitations

### What has been built and measured

- **Long-horizon autonomy, repeated, not a one-off.** **Four** completed autonomous runs, all merged with **zero regressions**, core suite 1908→2697 (**+789 tests** across roughly 31 h): Mega-Sprint #1 (~5 h, 9/9 sprints, **+294**, 0 human interventions until the merge gate), the Mega-Sprint #2 convergence lane (6 sprints, **+115**, the LKS memory substrate), the GUI computer-use lane (~13 h, 10 sprints, **+229**, a local vision-grounding head on a 16GB GPU), and the research lane (~9 h, 8 sprints, **+151**, claim-level entailment). Each sprint passed its own live end-to-end check and an adversarial audit *driven to convergence*, every corpus-touching test run against a clone with the live corpus asserted untouched. The research lane took one bounded, recorded exception to the frontier-free labor rule (a frontier model as a fallback audit critic only, over a subscription login, never the metered API; the authoring tier stayed commodity). The pattern reproduces.
- **Verifiable reasoning.** A real, model-free `false_pass_rate` harness; the cross-family critic scored zero false passes on the (small) planted set in the live run (§4), measured, not guaranteed.
- **Security-grade review.** A network-isolated, capability-dropped Docker sandbox that demonstrably blocks host-secret reads and network egress (mitigation), plus a directed adversarial review that caught a real host RCE before merge (detection) (§5).
- **Sovereign economics.** ~$3-4 amortized for a ~5-hour run; the build labor ran frontier-free on commodity models, with the frontier model used only for orchestration (§9).

### Limitations and honest scope

- **No frontier benchmark.** This paper does not measure BoBClaw's models against Fable 5 head-to-head. The defensible claim is demonstrated *autonomy* and *verifiability*, not benchmarked model parity (§1).
- **Sovereignty is architectural, not yet demonstrated air-gapped.** The shipped code has no hard frontier dependency and the labor tier ran frontier-free, but a fully self-hosted, frontier-free *end-to-end* run (open weights only, no cloud commodity APIs, no Claude apex) has not yet been performed as a headline demo (§9.1).
- **Some lanes are designed ahead of build.** The verification spine, build pipeline, and memory convergence (LKS↔BoB) are built and on the main line; the GUI and research lanes are deterministic floors with model-backed seams still being productized, and the GUI lane's live grounding head is currently *blocked on a local model asset* (Holo3-35B not yet on disk), a dependency the system surfaced rather than faked. The paper distinguishes "built and measured" from "designed" throughout.
- **Budget measurement is approximate** in the run cited; true provider-`usage` threading is a follow-on.
- **Verification cost is real.** Decorrelated critics and entailment checks add calls. The economics in §9 are *net* of that overhead, which is the point, but it is overhead, not magic.

### Reproducibility

The substrate is inspectable. Every claim in this paper maps to a module, a test count, or a run record in the BoBClaw repository, the verification spine (`core/verify/`, `core/ses/`), the build sandbox (`core/build/`), the ledger (`core/ledger/`), and the retrospective and results documents under `tasks/`. The claims-ledger audit accompanying this paper records each load-bearing figure against its source.

---

## 11. Conclusion

The week a frontier model was pulled offline by government order is the week the industry's central assumption, *rent the best model and build on top of it*, stopped being safe. Access is conditional. Geography is decisive. Capability you do not own can be taken away between a Tuesday and a Friday.

BoBClaw is a wager that the durable thing to own is not a model but a **harness**: a substrate that makes commodity models trustworthy through decorrelated verification, productive through orchestration, and yours through capability-class sovereignty. Aggregation gives you a key to someone else's castle. BoBClaw is the layer above, the one that keeps working when the key is revoked.

---

*Draft v0.95, load-bearing claims reconciled against the independent claims-ledger audit (`audits/claims-ledger-v1.md`). Companion document: the build story "How BoB Built BoB" (the dogfooding run, in narrative form).*

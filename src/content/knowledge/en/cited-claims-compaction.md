---
title: "Cited Claims Compaction"
description: "How typed, cited claims preserve context across long conversations—and where lexical validation still falls short."
category: "Architecture"
format: "Write-up"
date: "2026-11-03"
edition: "Architecture note"
status: "Technical note"
order: -20
---

> **Architecture note.** Literal validation checks provenance and certain error classes; it is not a proof that a claim is semantically true. The smaller evaluations did not show an accuracy advantage over iterative prose. The larger experiment and its limits are retained below.

**What it is:** a context-compaction module for a long-running LLM agent. Instead of asking a model to
summarise old conversation into prose, it extracts a set of **typed, ranked, cited claims**, checks every
claim against the messages it cites with plain code, and only puts those claims into the prompt while the
underlying messages are byte-identical to what it verified. Corrected values supersede earlier ones instead
of silently drifting.



**Source snapshot: October 29, 2026.** The original write-up reports a deployed BoB component. This public edition omits private deployment identifiers and the separate runtime-port work plan. It does not establish inclusion in the public installer.

**Why it is worth copying:** the failure it fixes is not "the prompt is too long". It is that a sliding
window forgets, and an iterative prose summary *confidently misremembers*. In a 939K-token, 21-compaction
test, the prose arm turned a "must NOT be enabled" flag into **ALLOWED** — a wrong answer stated with
certainty, not an omission. Claims scored 96/96 there (pooled over both raw-tail sizes); prose 90/96, with two polarities inverted.

---

## 1. The three failures

1. **Silent amnesia.** The original transport window sent the last 20 messages / 8192 characters to every
   model and dropped the rest with no trace — and if the single newest message exceeded 8192 characters, the
   loop kept *nothing*. Real turn bodies reached 120K, 74K, 44K characters.
2. **Positional memory.** A sliding window keeps what is recent, not what matters. The goal, the constraints
   and the decisions live in the opening exchange, which a window is the first thing to throw away.
3. **Summary drift.** An iterative prose summary is a lossy function of a lossy function. Repeated
   compaction compounds the loss, and a summary written before a correction keeps restating the old value.

The design below attacks all three, and treats "no model judges a model" as a hard rule.

## 2. Design principles

- **Claims, not prose.** What survives compaction is a set of atomic statements with a type, an importance
  rank, and at least one citation into the messages they came from.
- **Deterministic validation.** Every literal in a claim (number, path, URL, version, date, identifier,
  quoted string) must appear *verbatim* in a cited message. A claim that fails is rejected by code; nothing
  about the claim's truth is delegated to another model.
- **Merge, don't rewrite.** Claim sets union and supersede. A correction points at the claim it replaces, so
  the latest statement wins across regions — no prose-of-prose.
- **Trust is earned per byte.** A stored compaction is usable only while the messages it covers still hash to
  what it was built from, and only as one unbroken chain from the start of the conversation. An edit, a
  regenerate or a truncation simply invalidates coverage; the prompt falls back to the plain fit.
- **Off the critical path.** Compaction runs in the background after a turn is recorded. A compactor failure
  is a stored result (`failed`), never an exception in a user's turn.
- **Originals are never replaced.** The compaction is a derivative row. Omitted text is still stored and can
  be read back by id.

## 3. Architecture

```
                 ┌─────────────────────── one turn ───────────────────────┐
 user/platform ─►│ gateway: history (ids, roles, timestamps, capped)      │
                 └───────────────────────┬────────────────────────────────┘
                                         ▼
                            ┌────────────────────────┐
                            │ 0. FIT  (budget.py)    │  protect opening exchange
                            │ window = model's real  │  keep newest contiguous tail
                            │ window × 0.5           │  announce the gap in-prompt
                            └───────────┬────────────┘
                                        ▼
                            ┌────────────────────────┐
                            │ 3. ASSEMBLE            │  claims block replaces the
                            │ (assembler.py)         │  oldest omitted messages, inside
                            │ ≤15% of history budget │  the SAME token budget
                            └───────────┬────────────┘
                                        ▼
                                   model call
                                        │
                       turn recorded ───┘
                                        ▼
                            ┌────────────────────────┐
                            │ 2. COMPACT (background)│  select closed region
                            │ compactor.py + cheap   │  → claims-v2 prompt
                            │ long-window seat       │  → parse → VALIDATE
                            └───────────┬────────────┘         │
                                        ▼                    reject
                            ┌────────────────────────┐           │
                            │ 1. STORE (store.py)    │  ◄────────┘ (region stays raw)
                            │ sqlite: conv_messages  │
                            │         compactions    │
                            └────────────────────────┘
```

### Layer 0 — fit to the real window (`windows.py`, `budget.py`, `history.py`)

- Per-backend context windows come from a provider/model table with env overrides; history budget defaults
  to **50% of the window** (clamped 5–90%), to leave room for system prompt, tools, recall, reasoning and the
  answer. A `long` profile raises it to 75%.
- Local/CLI backends get their own caps (a 128K local model is not handed a 1M-token prompt; argv CLIs are
  capped at 100K characters because the whole prompt is one argv entry).
- The block is not one flat string of history: the **opening exchange is protected** (shrunk to ≤15% of the
  budget if needed), the newest messages are kept contiguously, and the newest message is *never* dropped —
  it is truncated in place if it alone blows the budget.
- Whatever sits in between is announced **inside the prompt**, with message ids, so the model knows a gap
  exists and can read it back.
- A call-time guard re-trims the block if routing lands on a backend with a harder cap than the one history
  was fitted against.

This layer is the safety net. It is also the whole system's fallback: with claims switched off, you get
"head + tail + honest marker" behaviour.

### Layer 1 — the index and the store (`store.py`)

One SQLite file per lane (`CONTEXT_DB`, else `dirname($MEMORY_SQLITE_PATH)/bobclaw_context.db`), WAL mode,
separate from the agent's memory database. Two tables:

```sql
conv_messages(message_id, conversation_id, user_id, role, content,
              content_sha256, created_at, seq, parents_json, first_seen_ts,
              PRIMARY KEY (conversation_id, user_id, message_id))

compactions(compaction_id, conversation_id, user_id,
            region_first_id, region_last_id, region_count, input_sha256,
            status, backend, prompt_version, attempts,
            claims_json, narrative_json, validation_json,
            tokens_in_est, tokens_out_est, elapsed_ms, error, created_ts)
```

Notes that matter in practice:

- The index is **derived and rebuildable** from the gateway's message store. It exists so citations resolve
  without a round trip, and so `conv_expand` can return exact text.
- `parents_json` is a **list from day one** even though chat is a linear spine — forks and regenerates fit
  later without a migration.
- Every read is scoped to `(conversation_id, user_id)`. Someone else's message id is indistinguishable from a
  non-existent one.
- `compaction_id = sha256(prompt_version | conversation_id | sha256(region contents) | sha256(prior claims) |
  prefix)[:32]` — so the same input is never paid for twice, and changing the prompt version cannot reuse a
  stale result.
- The composite primary key on `conv_messages` was a real bug in the first slice: a global message-id key
  silently dropped rows when two conversations (or two owners) used the same id. Callers can supply history
  ids, so this was reachable in production.

### Layer 2 — the compactor (`compactor.py`)

**Region selection** is structural, not positional:

- starts after the protected opening, ends before a protected tail (10% of the window, clamped 8K–120K);
- begins on a user message and ends on an assistant message — whole exchanges only, never mid-fan-out;
- at most `BOB_COMPACTOR_REGION_TOKENS` (default **12K**); the oldest part of a larger gap is taken first and
  the next run continues;
- if the first exchange alone exceeds the cap, it is taken whole rather than skipped.

**The claim schema** (claims-v2):

```json
{"claims": [{"id": "c1", "type": "decision", "importance": 3,
             "text": "...", "cites": ["<message id>"], "supersedes": null}],
 "narrative": {"goal": "...", "constraints": "...", "decisions": "...",
               "progress": "...", "open_questions": "...", "next_steps": "..."}}
```

Types: `decision, constraint, definition, commitment, fact, correction, open_question, failure, artifact,
preference`. Importance: **3** = decisions, constraints, prohibitions, definitions, commitments, corrections,
blockers; **2** = identifiers, paths, URLs, versions, thresholds, dates that later work must refer to; **1**
= everything else, sparingly. The prompt explicitly tells the model *not* to write claims for routine status,
counts, prices, quotes, schedules or small talk.

Later regions are shown the **still-active claims of earlier regions** and may supersede them by exact id.
Claim ids are namespaced per region (`r2.c5`) so they stay unique across the conversation.

**Deterministic validation** (`validate_claims`) — a claim is accepted only if all hold:

| Check | Rule |
|---|---|
| Shape | known `type`, non-empty text ≤600 chars, `cites` is a non-empty list of ids inside the region |
| Literals | every number / path / URL / version / UUID / hex / ticket / backticked code / quoted string in the claim appears **verbatim** in the cited messages |
| Numbers | matched as whole tokens — `47` is **not** "supported" because `48213` appears somewhere |
| Polarity | if the cited text carries a negation cue (`not`, `never`, `n't`, `forbidden`, `prohibited`, `off limits`…), a constraint/decision/commitment/preference claim must keep a negation or equivalent (`forbidden`, `disabled`, `avoid`…). A `, not X` contrast is ignored; corrections are exempt |
| Dedupe | identical id or identical `(type, text)` is rejected |
| Supersession | `supersedes` must name an earlier accepted claim; otherwise the link is dropped with a warning |

If more than half the raw claims are rejected (or none survive), the whole region is marked
`shadow_rejected`, the reasons are fed back to the model for **one** retry, and if it still fails the region
is left **uncompacted** — the raw messages stay in the prompt. There is no "accept it anyway" path.

This is deliberately lexical, not semantic. It catches the errors that actually happened (a shifted number, a
transposed identifier, a dropped NOT) and it is honest about what it cannot catch: a claim with no literal at
all, a paraphrase flip with no cue word, or a look-alike twin stated in the *same* cited message.

**Importance chain.** A replacement inherits the highest importance in the chain it replaces, so a correction
can never be filtered out while the value it corrected was still being shown.

### Layer 3 — assembly (`assembler.py`)

When layer 0 had to omit messages, the assembler tries to cover the oldest part of that gap:

1. Requires `head_count == HEAD_PROTECT` (the untouched opening) and claims enabled.
2. Re-reads stored compactions for the conversation and builds the **trusted chain**.
3. Uses only regions that lie **entirely inside** the omitted messages, stopping at the first that doesn't.
4. Formats the claims block and checks it against **15% of the history budget**; if it does not fit it drops
   the *oldest* regions first, then lowers the importance floor from 2 to 3 (identifiers, then decisions).
5. Refits the raw history against `budget − claims`, and verifies the refit still omits everything the claims
   cover. If not, it returns the original fit untouched.
6. Only the messages **not** covered by claims are announced as omitted.

The block itself looks like this:

```
[compacted history: claims extracted from earlier messages that are no longer shown; every value in a
 claim was checked against the message ids it cites (if you have the conv_expand tool, use it to read
 the originals); a claim marked (replaces ...) supersedes an earlier one]
region m2..m333 (332 messages):
- r1.c1 [constraint] Pin libfoo to 3.14.2; do not move to 3.15.0 because ... [cites: m54, m55]
- r2.c4 [correction] The admin API port is 9443 now; 8443 clashed ... [cites: m144, m145] (replaces r1.c2)
```

Only the **newest** region's narrative is rendered by default. Older narratives were written before later
corrections existed and will still state superseded values — a real defect observed in testing, where three
corrected values survived inside older region prose.

**Escape hatch.** Faces with tools get `conv_expand(ids, offset)` (whole ids or the `first..last` range
printed in the omission note, 20 messages / 60K chars per call, paging) and `conv_search(query, limit)`. The
prompt tells the model to expand before relying on an exact value. Tool-less faces see the claims but cannot
expand them — that is a known asymmetry, not a bug.

### The trust chain

A stored compaction is usable only if **all** of these hold, evaluated at prompt time:

- `status == 'shadow_ok'` and `prompt_version` is the current one;
- the region it claims to cover exists at the same position and the same **count**;
- the concatenated content hashes of those messages equal `input_sha256`;
- it starts exactly where the previous trusted compaction ended, beginning right after the protected opening;
- it is owner-scoped and lies entirely inside the messages being omitted.

One edited or regenerated message invalidates its region and every region after it. That is the point: the
system would rather fall back to a raw fit than cite a claim about text that no longer exists.

## 4. Triggers, budgets and guards

| Knob | Default | Meaning |
|---|---|---|
| history budget | 50% of window (`long` profile: 75%) | max tokens of prior conversation |
| soft trigger | 25% of window, capped at 200K (`long`: 70%) | prompt size at which background compaction starts |
| region size | 12K tokens | bigger regions produced 66% noise; 8–12K regions produced 0.6–4.5% |
| regions per run | 4 | run extends the chain this far, then stops |
| max concurrent | 2 | across all conversations |
| failure cooldown | 300 s | after a failed region, per conversation |
| claims share | 15% of history budget | hard cap on the claims block |
| compactor seat | `deepseek_v4_flash` | cheap long-window model, overridable |

Guards: one writer per conversation (async lock); compacting the same content twice is impossible
(content-addressed id); background compaction only runs for conversations whose backend hint is a **known
cloud backend** — local, unknown and unset backends are never shipped to a cloud compactor seat; any
exception inside the assembler falls back to the plain fit and logs.

Kill switches, in increasing scope:

- `BOB_CLAIMS_IN_PROMPT=false` — compaction still runs and stores, but claims are never injected.
- `BOB_COMPACTOR_ENABLED=false` (alias `BOB_COMPACTOR_SHADOW=false`) — no new compactions.
- `BOB_CONTEXT_FIT_ENABLED=false` — the whole module off, legacy flatten restored.

The staged rollout order that made this safe: fit-only → shadow compactor (computes, logs, is never read) →
claims in prompt. Separate the observation that a component runs from evidence that its output is used.

## 5. Evidence

All numbers: DeepSeek Flash as the compactor, exact-value scoring (whole-token match), **no LLM judge**,
repeat runs, arms share the same fixture and budget.

**Eval v1 — 400 messages, 16 planted facts, 10K budget**

| arm | accuracy | context tokens |
|---|---|---|
| full history | 16/16 | 53,782 |
| sliding window | 2/16 | 9,755 |
| plain LLM summary | 16/16 | 10,617 |
| claims + narrative | 16/16 | 12,605 |

The window answered UNKNOWN on every dropped fact — amnesia, not invention. Both compaction arms recovered
everything at about a quarter of the tokens. 60 claims, 60 accepted, 242 literals checked, 0 unsupported, one
attempt, 12.7 s.

**Eval v2 — correctness under iteration and capacity** (sliding window / iterative prose / claims-merge)

| scenario | window | prose_iter | claims |
|---|---|---|---|
| 16 planted facts | 12.5% | — | 100% (v1: 93.8–100%) |
| 330 exchanges, 4 successive compactions | 11% | 97% / 100% | 97% / 100% |
| 182 facts + 20 corrections, 43 questions | 0% | 100% / 96.5% | **100% / 100%** |

Honest reading: at this scale iterative prose is roughly as accurate as claims. Every prose miss was an
omission, not an invention. **Claims are not shown to be more accurate here** — what they add is
verifiability, provenance, supersession and a steadier context size (claims 12.7–18.7K tokens across runs;
prose 12.8–18.3K and climbing).

**Long stage A — 939K tokens, 21 sequential compactions, 24 questions × 2**

| arm | accuracy | context tokens |
|---|---|---|
| prose, 100K raw tail | 91.7% (44/48) | 103.7K |
| prose, 250K raw tail | 95.8% (46/48) | 216.5K |
| claims, 100K raw tail | **100% (48/48)** | 116.8K |
| claims, 250K raw tail | **100% (48/48)** | 225.2K |

Pooled over both tail sizes: claims **96/96**, prose **90/96**.

This is where the design pays. The prose failures were `flag:zeta-sync` answered **ALLOWED** in both repeats
(a polarity inversion of "must NOT be enabled") and two missed corrections; the running summary grew every
cycle (1,095 → 3,723 tokens, no plateau). Claims: 500 claims, 0 rejected, 1,506 literals checked, 0
unsupported, 15/16 corrections carrying `supersedes`, 167/168 planted keys present in the compacted prefix.

**Validator stress on real claims** (one corruption per kind): number shifted by one 151/152; wrong citation
170/170; path tweak 19/19; identifier transposition 53/55; NOT removed from a constraint 7/8 (vs **0/29**
before the polarity check existed). Offline: 227 real claims flagged 0 false positives while catching 31/31
synthetic cue removals.

**Known limitation, not fixed:** at 40K-token regions, 66% of shown claims were filler (bin counts, supplier
quotes) against 0.6% at 8K — the model pads to fill the region. Dropping to the default 12K regions is the
mitigation; it was not re-measured end to end. A proportional claim cap is the obvious next experiment.

## 6. Deployment shape

- One module, one config surface, per lane. Each lane gets its own context DB beside its own memory DB, so
  compaction state never crosses users.
- Two files' worth of integration: the history builder (fit + assemble) and the turn-recording hook
  (index + schedule). In this codebase every surface — API chat, MCP face chat, Discord, Telegram, team runs
  — funnels through the same `/api/chat`, so one integration covers all of them.
- The turn audit record carries the compaction decision: `{regions, importance_floor, claims_shown, tokens,
  messages_covered, messages_uncovered}`. Log lines `context: compaction …` and `context: claims in prompt …`
  make behaviour greppable.
- Deploy script gate order that worked: verify **no drift** against the tested stage → back up → copy →
  compile + import check → **run the context tests from the live tree before any restart** → restart → health
  check → self-undo on failure.
- Rollback is file restore + restart, but the cheaper lever is a kill switch in the unit.

**Operational lesson:** a long-lived process hides a broken restart path. The first restart in weeks
surfaced a memory-DB WAL/SHM pair owned by a different OS user, which crashed that lane at startup when the
old process had merely kept its handles open since September. On any lane you have not restarted recently,
restart it *before* you need to.

## 7. Porting the shape to another agent runtime

The module is four pure-ish functions plus two hooks, which is why it ports:

1. `select_region(messages) → region | None`
2. `build_prompt(region, prior_claims) → messages`
3. `validate_claims(raw, region, prior_ids, prefix) → (accepted, report)`
4. `render_claims_block(results, min_importance) → str`

Hooks needed from the host: a per-turn record of messages **with stable ids and timestamps**, a post-turn
callback to start background work, and a way to swap the history for a single request without mutating the
saved transcript.

The open risk for any port is stated plainly: all the evidence above is **plain chat**. Agent sessions are
tool-heavy, with large tool results and tool-call messages whose ids and semantics differ. Replay real
sessions offline before switching it on.

## 8. Checklist for building the same shape

- [ ] Fit to the model's real window, not a hardcoded 20 messages. Protect the opening exchange; never drop
      the newest message; announce every gap in-prompt with ids.
- [ ] Give history messages stable ids and timestamps. Everything downstream depends on it.
- [ ] Store a derived, rebuildable index in its own DB. Scope every read to (conversation, owner).
- [ ] Compact whole closed exchanges only, never mid-fan-out, never the protected tail.
- [ ] Extract typed claims with at least one citation; render literals verbatim.
- [ ] Validate with code: citation containment, literal presence, whole-token numbers, polarity, dedupe,
      supersession targets. Feed rejections back exactly once. Fail closed — leave the region raw.
- [ ] Make corrections first-class: `supersedes`, namespaced ids, importance inherited along the chain.
- [ ] Trust a compaction only while its input hashes still match and it forms an unbroken chain from the
      start.
- [ ] Put the claims block inside the same token budget (≈15%), and let it displace the oldest raw messages.
- [ ] Run compaction off the critical path, with a per-conversation lock, a failure cooldown, and a
      never-raise contract.
- [ ] Ship fit-only → shadow → live, with kill switches at each layer.
- [ ] Measure with planted facts, corrections, confusable twins and negations; exact-match scoring; no LLM
      judge; include an iterative-prose arm and a full-history upper bound; run the long, many-cycle arm
      before believing anything.
- [ ] Expect noise, not inaccuracy, to be the long-region failure mode. Smaller regions first.

---

*Source: the October 29, 2026 Cited Claims Compaction architecture write-up, based on the BoB context module and author-run evaluations. Results are reported from that record, not independently rerun for this page. The private deployment notes and runtime-specific port plan are omitted from this public edition.*

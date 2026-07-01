---
title: "How BoB is built"
description: "A plain tour of the architecture: the harness, the fleet, the verification spine, and the substrate underneath."
category: "Architecture"
format: "Write-up"
date: 2026-06-30
order: 1
---

Most AI tools treat the model as the product and the code around it as glue. BoB inverts that. The model is a swappable part, like a CPU. The thing that makes BoB reliable, productive, and yours is the **harness** around the model. This is a quick tour of that harness.

## Four services

BoB is four cooperating pieces:

- **core** runs the show: it routes work, dispatches it across a fleet of models, verifies results, and keeps a durable record of everything.
- **gateway** is the door: a web and API layer with login, conversations, projects, and approvals.
- **pipeline** is a thin wrapper for the planning tier.
- **app** is the desktop client, the daily driver, with chat, a routing view, and a team builder.

Everything substantive happens inside core, as a compiled graph that a request flows through.

## The fleet

BoB does not lean on one model. Work is expressed as **roles**, not vendors:

- an **apex** that plans and decomposes a task,
- **workers** that do the labor,
- **critics** that adversarially check the work.

Each role resolves to a concrete model through a routing layer, so the same task can run as a single cheap worker, a fan-out of dozens, or a deliberating council, by configuration rather than code. The deliberate rule is **cross-family decorrelation**: a critic always comes from a different model family than the worker it audits, so one model never rubber-stamps its own kind of mistake.

## The verification spine

This is the part that turns cheap models into trustworthy ones. Before a result is allowed to stand, BoB checks it:

- a **post-condition check** asks a decorrelated critic whether the claimed outcome actually holds,
- a **claim-entailment gate** re-opens the cited source for any quantitative claim and asks, does this source really support this number,
- **default-fail termination** means every completion criterion starts as unverified, and work only ships when each one is verified or honestly marked unknown.

Done is something BoB earns, not something it assumes.

## Three lanes

The same spine drives three kinds of work:

- the **build lane** writes code against contracts and runs it inside a locked-down sandbox before trusting it,
- the **research lane** answers questions with sources it actually re-reads,
- the **computer-use lane** drives real software, checking that the screen changed the way it intended.

## Memory and the substrate

BoB builds on a living local knowledge base. Knowledge is compiled once and kept current, so BoB gets sharper about your work over time instead of starting from zero every session. Underneath, an append-only ledger is the system of record: BoB reconstructs context by slicing that ledger, not by trusting whatever happens to be left in a model's context window.

## Sovereignty, by design

Because no model is named in the logic, only capability classes with fallback chains, no single vendor is load-bearing. Ban a model, lose a key, or watch a price spike, and the class re-resolves to the next provider, down to local inference if you want. That is the property that survives an export ban. You own the harness. You rent the intelligence, from whoever is cheapest and available this week.

For the full treatment, read the [technical whitepaper](/knowledge/bobclaw-whitepaper/).

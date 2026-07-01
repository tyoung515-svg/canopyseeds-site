---
title: "The BoB Long-Horizon Execution Protocol"
description: "How BoB stays on task for hours of unattended work without drifting. A podcast on the protocol behind the autonomous runs: sprints, contracts, verification gates, and durable memory."
category: "Architecture"
format: "Audio"
date: 2026-07-01
order: 4
audioSrc: "/media/long-horizon-execution.m4a"
---

Most AI tools are good for a single answer. The hard part is staying coherent across *hours* of work, dozens of steps, without drifting off the goal or quietly breaking something three steps back. This podcast (about 40 minutes) is on the protocol that makes BoB's long, unattended runs hold together.

- **Work as sprints, not one giant prompt.** A long task is decomposed into scoped units with explicit contracts, so progress is checkpointed and a failure is contained instead of contaminating everything downstream.
- **A verification gate at every seam.** Nothing advances on trust. Each unit is checked, often in an isolated sandbox, and bad work is surfaced and repaired rather than merged.
- **Durable memory as the spine.** State lives in a durable record, not a fragile context window, so a run can be paused, resumed, and audited, and what it learns compounds instead of evaporating.

This is the protocol behind the runs that wrote hundreds of tests with zero regressions, on commodity models, for single-digit dollars. For the full system, see [The BoB Architecture Harness](/knowledge/architecture-harness/) and the build story, [How BoB Built BoB](/knowledge/how-bob-built-bob/).

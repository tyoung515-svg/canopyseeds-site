---
title: "The BoB Architecture Harness"
description: "A guided tour of the harness around the model: the four services, the fleet of roles, and why the model is the swappable part. A short video overview, plus a full podcast deep dive."
category: "Architecture"
format: "Video"
date: 2026-07-01
order: 2
videoSrc: "/media/architecture-harness.mp4"
audioSrc: "/media/architecture-harness-podcast.m4a"
---

Most AI tools treat the model as the product. BoB treats it as a part, like a CPU you can swap. What makes the work reliable is the **harness** around the model, and this is a tour of it.

**Watch the overview** (about 7 minutes) for the shape of the system, then **listen to the deep dive** podcast below for the full walk through how the pieces fit.

## What the harness is

- **Four services.** `core` routes work, dispatches it across a fleet, verifies results, and keeps a durable record. `gateway` is the door (web, API, login, approvals). `pipeline` is a thin planning wrapper. `app` is the desktop daily driver.
- **A fleet of roles, not vendors.** Work is expressed as an **apex** that plans, **workers** that do the labor, and **critics** that adversarially check it. Any given role can be filled by whichever model is cheapest and best this week.
- **A verification spine.** Every meaningful step is checked by a *different* family of model before it's trusted, so no single model is load-bearing and no single mistake goes unchallenged.

## Why it's built this way

When the model is swappable, nothing you build can be repriced, deprecated, or export-banned out from under you. You own the harness; you rent the intelligence. The video and podcast below unpack how that plays out in practice.

For the written version, see [How BoB is built](/knowledge/architecture-overview/) and the [BoBClaw whitepaper](/knowledge/bobclaw-whitepaper/).

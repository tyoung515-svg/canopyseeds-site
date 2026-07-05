---
title: "What's new in BoB v0.97"
description: "BoB now speaks Chinese: the desktop app in English, Simplified (简), and Traditional (繁) with a live language toggle, and the assistant replying in the language you pick. Plus the desktop app is now the GUI, and a few backend fixes."
category: "Tutorials"
format: "Write-up"
date: 2026-07-05
order: 2
draft: false
---

**BoB now speaks Chinese.** That's the headline of v0.97. The rest is a cleaner GUI story and a handful of backend fixes. Here's what changed — and what's still on the honest-to-do list.

## BoB now speaks Chinese

The desktop app is localized in **English, Simplified Chinese (简), and Traditional Chinese (繁)** — 172 UI strings across the three, with a **restart-free language toggle** right in the header (EN → 简 → 繁). Flip it and the interface changes in place; no reload.

The localization goes past the chrome. The backend now threads a per-turn **locale**: when you pick a non-English language, BoB is directed to **reply in that language** too. The desktop app sends the locale with each turn, so switching the toggle switches the language BoB answers in. Leave it on English and nothing changes — the behavior is byte-identical to before.

Two honest caveats, because this is a first localization pass:

- The translations have **not** yet had a full native-speaker review, and the runtime language-toggle *visual* check is still a manual step (it needs a real display; the automated shared-module tests pass). Treat 简/繁 as solid but not yet sign-off-final.
- The language directive is applied to the **surfaced answer** — the apex/synthesis reply you read. Fan-out worker sub-turns don't yet inherit the conversation locale, and a few interpolated status strings still render English. Both are tracked follow-ups.

## The desktop app is now the GUI

The preview **browser UI is gone.** The old `/ui` page was a stopgap; v0.97 removes it, and the gateway now serves the **JSON + WebSocket API only** (hitting `/` returns a small info response instead of redirecting to a web page). Removing it also removes the browser `localStorage` session-token surface that came with it.

The GUI going forward is the **Kotlin Multiplatform desktop app** (`bobclaw-app`), with Android as a preview. One thing to be clear about: it's a real app you **build once** — not a zero-install web page. You need a JDK; `./gradlew :desktopApp:run` from `bobclaw-app` brings it up. If you'd rather not build a GUI at all, the headless front door — the CLI, the MCP server, and the JSON+WebSocket API — is unchanged and fully usable. The [setup guide](/knowledge/setting-up-bob/) walks both paths.

## Backend fixes and touches

- **Codex planner honors a pinned model.** When you pin a specific model on the `gpt` / codex planner tier, a `gpt`-profile face now runs *that* model (e.g. `gpt-5.5`) natively under your ChatGPT login, instead of falling back to the profile default — and without being forced through the LiteLLM proxy. This is a **backend** behavior; a model-picker control *in the GUI* is a separate follow-up, not part of this release.
- **Codex health check no longer strands a native-GPT face.** The check used to gate on the LiteLLM proxy unconditionally, so a `planner-gpt` face — which needs no proxy — was wrongly marked unhealthy whenever the proxy was down. Health is now the codex-CLI's own liveness; a proxy-routed profile that hits a down proxy escalates at runtime through the existing chain.
- **Faces know they're running inside BoB.** A spawn-identity card prepends a short system line naming the platform, the face (its name and role), and the backend serving it — so a face answers "I'm BoB's General Assistant, served by …" instead of having no idea it's deployed. It's opt-in: the code default is off (byte-identical), and the shipped `.env` turns it on.

## Under the hood

Compose Multiplatform moved from 1.6.11 to 1.7.3 for the desktop/Android app. No change to how you install or run BoB beyond the GUI note above.

## Upgrading

Nothing in your setup flow changes except the front door. If you were opening the browser UI, use the desktop app or the headless MCP/API path instead — the **[Setting up BoB](/knowledge/setting-up-bob/)** guide is updated for v0.97 with both.

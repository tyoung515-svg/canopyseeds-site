---
title: "Setting up BoB (v0.96)"
description: "A first install, start to finish: the three prerequisites, the one-command installer, giving BoB a model backend, and your first login. Windows, headless-first, about fifteen minutes."
category: "Tutorials"
format: "Write-up"
date: 2026-07-01
order: 1
draft: true
---

This is the shortest honest path from nothing to a running BoB on your own machine. **v0.96 is Windows-only and headless-first**: the command-line, MCP, and agent front door works today; the web and desktop GUIs ship as a *preview*. Everything runs on `127.0.0.1` by default, with your keys, on your box. Nobody in the middle.

Budget about fifteen minutes, most of it waiting on downloads.

## Before you start: three prerequisites

BoB fails closed without all three. The installer checks for them and stops if any is missing, on purpose.

1. **Docker Desktop**, installed and **running**. It hosts BoB's datastores (Postgres, Redis, Qdrant) *and* it is the locked-down sandbox where BoB runs model-written code before trusting it. Verify:
   ```powershell
   docker info
   ```
   If that errors, start Docker Desktop and wait for the whale icon to settle.

2. **`uv`**, the Python environment manager ([install](https://docs.astral.sh/uv/)). Verify:
   ```powershell
   uv --version
   ```

3. **PowerShell 7+** (`pwsh`). Windows ships only 5.1; BoB's service scripts need 7. Install and use it, not the blue 5.1 window:
   ```powershell
   winget install --id Microsoft.PowerShell
   ```

> Docker isn't optional. It's the isolation boundary that lets BoB run generated code safely. Don't work around it — that's the whole point of the verification step.

## Install: one command

Clone the BoB repository and run the installer from inside it, in a **PowerShell 7** window:

```powershell
git clone https://github.com/tyoung515-svg/bob.git bob
cd bob
./install-bob.ps1
```

That script does the whole first-run for you, and it's **idempotent** — safe to run again any time. In order, it:

- checks the three prerequisites,
- builds the Python environment from pinned lockfiles (no surprises, reproducible),
- brings up the Docker infrastructure and initializes the database,
- bootstraps your secrets **interactively** — it generates a strong admin password, a 2FA secret, and the internal signing key, and shows the password **once**,
- waits for the stack to report healthy,
- smoke-tests your model backend if you've set a key,
- and prints the URL and login.

**Write the admin password down when it appears.** Only its bcrypt hash is stored on disk; there's no "show it again" later.

## Give BoB a brain: enable one backend

BoB is the harness — the intelligence is rented from a model you point it at. It needs **at least one** backend, configured in `.secrets\bobclaw.env`. Pick whichever you already have:

- **A cloud API key** — paste `ANTHROPIC_API_KEY=sk-ant-...` into the env file. The default model is `claude-sonnet-5`; BoB also speaks to Google, DeepSeek, Z.AI/GLM, Moonshot/Kimi, and MiniMax the same way.
- **A Claude subscription, no API key** — if you have the `claude` CLI, run `claude setup-token`. BoB then drives Claude under your own login (see `COMPLIANCE.md` — your subscription, your terms, never proxied).
- **Fully local, no cloud** — run Ollama or LM Studio and set `PREFERRED_LOCAL_MODEL`.

> **Model IDs must match what your provider currently serves.** The example values in the env file are placeholders, not live model names — set the real one.

One catch worth internalizing now: **BoB reads secrets at startup.** If you add or change a key after it's already running, restart core so it picks the change up:

```powershell
./scripts/win/stop-all.ps1
./scripts/win/start-local.ps1
```

## First login

Open the preview web UI:

**http://127.0.0.1:7826/ui**

- Log in as **`admin`** with the password the installer printed.
- Login also needs a **TOTP 2FA code**. Enroll the `TOTP_SECRET` from `.secrets\bobclaw.env` in any authenticator app (Google Authenticator, 1Password, Aegis…) using this URI, then enter the rotating 6-digit code:
  ```
  otpauth://totp/BoB:admin?secret=<TOTP_SECRET>&issuer=BoB
  ```

Prefer to stay in your terminal or drive BoB from another agent? The headless MCP server (`./scripts/win/start-mcp.ps1`) is the intended front door for v0.96 — the web UI is the preview.

## Confirm it's alive

The stack reports its own health:

```powershell
Invoke-RestMethod http://127.0.0.1:7826/health
```

Under the hood, three services are running: **core** (the engine, port 7825), **gateway** (auth + API + the web UI, 7826), and the **Claude pipeline** (7823). If the installer smoke-tested your Anthropic key, your model default is already confirmed; local-only setups validate on your first chat message.

## Stopping and starting again

```powershell
# stop the host services (Docker keeps running its own containers)
./scripts/win/stop-all.ps1

# bring it back up — light path: infra + core + gateway, no local model servers
./scripts/win/start-local.ps1
```

After a reboot, re-running `./install-bob.ps1` also works — it just no-ops the parts that are already done.

## Good-to-knows for a first run

- **Memory is off by default.** BoB's long-term memory (LKS) uses optional local model servers; with them unset, recall simply fails open and never blocks the stack. You can turn it on later.
- **Loopback by default.** Every service binds `127.0.0.1`. Do **not** expose the gateway to a network until you've read `SECURITY.md` — for remote access, an SSH tunnel or the native client beats the preview web UI, which keeps tokens in the browser.
- **Single-operator, this release.** v0.96 is honest about its scope: headless-usable, GUI-preview, not a hardened multi-tenant service. Containerized packaging and cross-platform support are tracked toward v1.0.

## Where to go next

- **[The BoB Architecture Harness](/knowledge/architecture-harness/)** — what you just started, and why the model is the swappable part.
- **[BoBClaw: the whitepaper](/knowledge/bobclaw-whitepaper/)** — the technical depth under the hood.
- In the repo: `ARCHITECTURE.md` (when to council vs. single-dispatch, teams, capability classes), `SECURITY.md` (before you expose anything), and `COMPLIANCE.md` (using your own subscriptions within each vendor's terms).

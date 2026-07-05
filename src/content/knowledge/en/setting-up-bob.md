---
title: "Setting up BoB (v0.97)"
description: "A first install, start to finish: the three prerequisites, the step-by-step setup, giving BoB a model backend, and your first login. Windows, headless-first, about twenty minutes."
category: "Tutorials"
format: "Write-up"
date: 2026-07-05
order: 1
draft: false
---

This is the shortest honest path from nothing to a running BoB on your own machine. **v0.97 is Windows-only and headless-first**: the command-line, MCP, and agent front door is what you use today; the GUI is the **Kotlin Multiplatform desktop app** (Android preview). There is no browser UI — the old zero-install web page was removed in this release. Everything runs on `127.0.0.1` by default, with your keys, on your box. Nobody in the middle.

Budget about twenty minutes, most of it waiting on downloads.

> **On the installer:** v0.97 is set up with the steps below — that's the supported path today. A single-command installer that does all of this for you is landing in **v1.0**. If you're comfortable in a terminal, the manual walk-through here takes about the same time and shows you exactly what's happening.

## Before you start: three prerequisites

BoB fails closed without all three — that's deliberate.

1. **Docker Desktop**, installed and **running**. It hosts BoB's datastores (Postgres, Redis, Qdrant) *and* it is the locked-down sandbox where BoB runs model-written code before trusting it. Verify:
   ```powershell
   docker info
   ```
   If that errors, start Docker Desktop and wait for the whale icon to settle.

2. **`uv`**, the Python environment manager ([install](https://docs.astral.sh/uv/)). Verify:
   ```powershell
   uv --version
   ```

3. **PowerShell 7+** (`pwsh`). Windows ships only 5.1; BoB's service scripts need 7. Install it and run everything below from a **PowerShell 7** window, not the blue 5.1 one:
   ```powershell
   winget install --id Microsoft.PowerShell
   ```

> Docker isn't optional. It's the isolation boundary that lets BoB run generated code safely. Don't work around it — that's the whole point of the verification step.

## Get the code

Clone the BoB repository and `cd` into it. Every command from here runs from the repo root:

```powershell
git clone https://github.com/tyoung515-svg/bob.git bob
cd bob
```

## 1. Python environment + pinned dependencies

Create the virtual environment and install all three services from their **locked** requirement files (fully pinned — reproducible, no surprises):

```powershell
uv venv .venv --python 3.13
uv pip install --python .venv\Scripts\python.exe -r bobclaw-core\requirements.lock
uv pip install --python .venv\Scripts\python.exe -r bobclaw-gateway\requirements.lock
uv pip install --python .venv\Scripts\python.exe -r bobclaw-claude-pipeline\requirements.lock
```

Use the `requirements.lock` files, **not** `requirements.txt`.

## 2. Env file + database password (do this *before* Docker)

```powershell
Copy-Item .secrets\bobclaw.env.example .secrets\bobclaw.env
```

Open `.secrets\bobclaw.env`, set a strong **`POSTGRES_PASSWORD`**, and update **`POSTGRES_URL`** to match:

```
POSTGRES_URL=postgresql://bobclaw:<your-password>@localhost:5432/bobclaw
```

Order matters here: the Postgres volume bakes in whatever password is set on its **first** startup. Setting it now — before step 3 — means the container and the app agree on the first try, with no `docker compose down -v` do-over.

## 3. Bring up the infrastructure

```powershell
docker compose --env-file .secrets\bobclaw.env up -d postgres redis qdrant
```

`--env-file` makes Compose use the same `POSTGRES_PASSWORD` the app reads from `.secrets`. The database schema (`init.sql`) runs automatically on that first start. Wait until Postgres is accepting connections:

```powershell
docker exec bobclaw-postgres pg_isready -U bobclaw
```

All infrastructure binds to `127.0.0.1` only.

## 4. Auth secrets and a model backend

Generate BoB's secrets:

```powershell
.venv\Scripts\python.exe scripts\gen_secrets.py
```

This fills in `BOBCLAW_SECRET` (the internal signing key — one file, read by both core and gateway), `BOBCLAW_PASSWORD_HASH`, and `TOTP_SECRET`. **It prints your admin password once — write it down.** Only its bcrypt hash is stored on disk; there is no "show it again" later.

Then give BoB at least one **model backend** — it's the harness; the intelligence is rented from a model you point it at. Pick whichever you already have and set it in `.secrets\bobclaw.env`:

- **A cloud API key** — paste `ANTHROPIC_API_KEY=sk-ant-...`. The default model is `claude-sonnet-5`; BoB also speaks to Google, DeepSeek, Z.AI/GLM, Moonshot/Kimi, and MiniMax the same way.
- **A Claude subscription, no API key** — if you have the `claude` CLI, run `claude setup-token`. BoB then drives Claude under your own login (see `COMPLIANCE.md` — your subscription, your terms, never proxied).
- **Fully local, no cloud** — run Ollama or LM Studio and set `PREFERRED_LOCAL_MODEL`.

> **Model IDs must match what your provider currently serves.** The example values in the env file are placeholders, not live model names — set the real one. And note: **BoB reads secrets at startup**, so if you add or change a key later, restart core (below) to pick it up.

## 5. Start it up

```powershell
./scripts/win/start-local.ps1
```

`start-local.ps1` brings up infra + core + gateway as plain windows — no local embedding models, no Task Scheduler. Wait for it to report healthy:

```powershell
Invoke-RestMethod http://127.0.0.1:7826/health
```

Three services are now running: **core** (the engine, port 7825), **gateway** (auth + the REST + WebSocket API, JSON only, 7826), and the **Claude pipeline** (7823).

> *Optional:* `./scripts/win/install-durability.ps1 -IncludeModels:$false` registers Task-Scheduler tasks so core/gateway auto-start on logon after a reboot. Skip it if you don't want auto-start.

## 6. First login

BoB has two front doors. Pick whichever fits how you work — the login is the same for both.

**The desktop app (the GUI).** v0.97 removed the browser UI; the client is now the Kotlin Multiplatform **desktop app** in `bobclaw-app`. It's a real app you build once, not a zero-install web page — you need a **JDK 17** (Temurin is fine). From the repo root:

```powershell
cd bobclaw-app
./gradlew :desktopApp:run
```

The first build pulls Gradle and the Compose runtime, so give it a few minutes. The app ships in **English, Simplified Chinese (简), and Traditional Chinese (繁)** with a restart-free language toggle in the header — new in v0.97.

**Headless (terminal or another agent).** Prefer to stay in your terminal, or drive BoB from your own agent? The **MCP server** (`./scripts/win/start-mcp.ps1`) is the intended headless front door; it, the CLI, and the JSON + WebSocket API at `http://127.0.0.1:7826` all speak to the same gateway.

Either way, you log in the same way:

- Log in as **`admin`** with the password `gen_secrets` printed in step 4.
- Login also needs a **TOTP 2FA code**. Enroll the `TOTP_SECRET` from `.secrets\bobclaw.env` in any authenticator app (Google Authenticator, 1Password, Aegis…) using this URI, then enter the rotating 6-digit code:
  ```
  otpauth://totp/BoB:admin?secret=<TOTP_SECRET>&issuer=BoB
  ```

If you set an Anthropic key, your first chat message confirms the model resolves; local-only setups validate on first chat too. To have BoB reply in Chinese, switch the app's language toggle — the assistant follows the app's locale.

## Stopping and starting again

```powershell
# stop the host services (Docker keeps its own containers running)
./scripts/win/stop-all.ps1

# bring it back up
./scripts/win/start-local.ps1
```

Adding or changing a backend key is the one thing that needs a restart — `stop-all` then `start-local`, since env is read at startup.

## Good-to-knows for a first run

- **Memory is off by default.** BoB's long-term memory (LKS) uses optional local model servers; with them unset, recall simply fails open and never blocks the stack. You can turn it on later.
- **Loopback by default.** Every service binds `127.0.0.1`. Do **not** expose the gateway to a network until you've read `SECURITY.md` — for remote access, run the desktop app over an SSH tunnel. (v0.97 removed the browser UI, and with it the browser `localStorage` session-token surface.)
- **Single-operator, this release.** v0.97 is honest about its scope: headless-usable, with a desktop GUI (Android preview), not a hardened multi-tenant service. The one-command installer, containerized packaging, and cross-platform support are tracked toward v1.0.

## Where to go next

- **[The BoB Architecture Harness](/knowledge/architecture-harness/)** — what you just started, and why the model is the swappable part.
- **[BoBClaw: the whitepaper](/knowledge/bobclaw-whitepaper/)** — the technical depth under the hood.
- In the repo: `AGENTS-SETUP.md` (this flow, agent-runnable), `ARCHITECTURE.md` (when to council vs. single-dispatch, teams, capability classes), `SECURITY.md` (before you expose anything), and `COMPLIANCE.md` (using your own subscriptions within each vendor's terms).

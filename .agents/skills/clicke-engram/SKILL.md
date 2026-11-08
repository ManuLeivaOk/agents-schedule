---
name: clicke-engram
description: >-
  Persistent cross-repository memory (Engram SQLite + FTS5), canonical domain enums,
  API endpoint mapping, and cross-stack TypeScript verification for the Clicke Impulso
  ecosystem (nestjs-auth backend, frontend Next.js web, and app-schedule Expo mobile).
  Use this skill to query or persist architectural decisions, API contracts, bug fixes,
  and stage progress across sessions.
---

# Clicke Engram — Persistent Agentic Memory & Ecosystem Reference

Clicke Impulso consists of three separate repositories in `/Users/manuelleiva/Desktop/archivos/appCopada`:
- `nestjs-auth` (Backend API — NestJS 11 + TypeORM + PostgreSQL)
- `frontend` (Web App — Next.js 16 + React 19 + Tailwind v4)
- `app-schedule` (Mobile App — Expo 58 + React Native 0.88 + TanStack Query v5)

The **Clicke Engram** engine ([`.agents/engram/engram.mjs`](../../engram/engram.mjs)) provides a SQLite + FTS5 persistent memory store (`engram.db` + `seed-memories.json` snapshot) available both as an **MCP Server** (`clicke-engram`) and as a **CLI tool**.

---

## 1. Reference Documentation (Progressive Disclosure)

Read these reference files on demand when inspecting contracts or domain types:
- **[Canonical Domain Enums & Types](./references/domain-enums-and-types.md)**: Exact TypeScript enums across Backend, Web, and Mobile (`AppointmentStatus`, `AppointmentSource`, `ResourceType`, `AutomationTrigger`, `AutomationDelayUnit`, `AutomationExecutionStatus`, `OrganizationRole`, `OrganizationFeature`).
- **[API Endpoints & Clients Map](./references/api-endpoints-map.md)**: Full mapping of `nestjs-auth` controllers to `frontend/src/services/*` and `app-schedule/src/*/api.ts`.

---

## 2. Querying Engram Memory

Before modifying shared domain flows (`appointments`, `availability`, `customers`, `services`, `resources`, `auth`, `analytics`, `automations`, `organizations`), check active memories:

```bash
# Load active context (global + contracts + optional scope: backend | web | mobile)
node --no-warnings .agents/engram/engram.mjs context

# Full-text search (FTS5)
node --no-warnings .agents/engram/engram.mjs search "appointments"
```

*(If MCP tools `engram_context` / `engram_search` are mounted in your session, you can call them directly).*

---

## 3. Saving to Engram Memory

Always save or update an Engram before finishing a task when you:
- Add or change a backend endpoint, DTO, or response shape in `nestjs-auth`.
- Complete or advance a stage in `app-schedule/ETAPAS-app-mobile.md`.
- Resolve a non-trivial bug or establish a new pattern across Web/Mobile/Backend.

```bash
node --no-warnings .agents/engram/engram.mjs save \
  --key="contract/nombre-del-contrato" \
  --scope="contracts" \
  --type="contract" \
  --title="Título claro del contrato o decisión" \
  --content="Detalle técnico conciso de los invariantes, endpoints y comportamiento esperado." \
  --files="nestjs-auth/src/...,frontend/src/...,app-schedule/src/..."
```

Valid scopes: `global`, `contracts`, `backend`, `web`, `mobile`.
Valid types: `architecture`, `contract`, `decision`, `bugfix`, `progress`, `pattern`.

---

## 4. Cross-Ecosystem TypeScript Verification Script

To verify that changes across Backend, Web, and Mobile compile cleanly without type drift, run:
[verify-ecosystem.mjs](./scripts/verify-ecosystem.mjs)

```bash
# Verify all 3 repositories (nestjs-auth, frontend, app-schedule)
node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs

# Or verify a single layer (--only=backend | --only=web | --only=mobile)
node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs --only=mobile
```

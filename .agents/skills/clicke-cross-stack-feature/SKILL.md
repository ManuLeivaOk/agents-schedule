---
name: clicke-cross-stack-feature
description: >-
  Step-by-step runbook for implementing or modifying a feature, endpoint, or domain
  model across the 3 Clicke Impulso repositories (be-schedule backend, frontend web,
  and app-schedule mobile) while preserving DTO validation, RBAC/Feature flags,
  visual identity, and contract parity.
---

# Clicke Cross-Stack Feature Runbook (Backend ↔ Web ↔ Mobile)

Use this workflow whenever a user request touches a shared domain (`appointments`, `availability`, `customers`, `services`, `resources`, `analytics`, `automations`, `auth`, or `account`).

---

## Step 1: Check Context & Contracts

1. Search **Clicke Engram** for prior decisions or contracts on the domain:
   ```bash
   node --no-warnings .agents/engram/engram.mjs search "<domain>"
   ```
2. Check the canonical enums and endpoint map in:
   - [domain-enums-and-types.md](../clicke-engram/references/domain-enums-and-types.md)
   - [api-endpoints-map.md](../clicke-engram/references/api-endpoints-map.md)

---

## Step 2: Backend Implementation (`be-schedule`)

1. **Entity & Migration**:
   - If modifying a `*.entity.ts` file, remember `synchronize: false` is enforced. Create or generate a migration in `be-schedule/src/migrations/`.
2. **DTO Validation (`whitelist: true`, `forbidNonWhitelisted: true`)**:
   - Every new request field MUST have `class-validator` decorators (`@IsString()`, `@IsOptional()`, `@IsEnum()`, etc.) on the DTO or the global `ValidationPipe` will reject requests with `400 Bad Request`.
3. **Authorization Guards (`@OrgFeatures` & `@OrgRoles`)**:
   - Ensure the controller/method declares the right `@OrgFeatures(OrganizationFeature.X)` and `@OrgRoles(...)` decorators.
4. **Timezone & Snapshots**:
   - Use `Luxon` (`DateTime`) with `organization.timezone` (fallback `America/Argentina/Cordoba`).

---

## Step 3: Web Implementation (`ft-schedule`)

1. **Types & API Service**:
   - Update the TypeScript interface in `ft-schedule/src/types/*.ts` and the Axios call in `ft-schedule/src/services/*-api.ts`.
2. **Permissions (`useAuth()`)**:
   - Gate UI actions with `canAccess({ adminOnly, requiredFeature })` or `canManageOrganization` from `ft-schedule/src/providers/auth-provider.tsx`.
3. **Visual Identity**:
   - Follow `ft-schedule/docs/clicke-identidad-visual.md`: `Jost` font, semantic CSS variables (`--fondo`, `--superficie`, `--acento-fuerte`), status ring + text label (`status-badge.tsx`), and `es-AR` ARS currency formatting without decimals.

---

## Step 4: Mobile Implementation (`app-schedule`)

1. **Types, Defensive Parser & API**:
   - Update `app-schedule/src/<domain>/types.ts`, the runtime parser `parse.ts` (and its `parse.test.ts` if present), and `api.ts`.
2. **TanStack Query Cache Invalidation**:
   - Ensure mutations invalidate the affected query keys in `app-schedule/src/query/query-client.ts` or screen mutation hooks.
3. **Mobile UI & Accessibility**:
   - Forms and details are stack screens (not web modals) and must respect Android hardware back (`src/navigation/android-back.ts`).
   - Use `AppText` (`src/components/app-text.tsx`) with point-based `letterSpacing`, `StatusBadge` (`src/components/status-badge.tsx`) with 12px ring + text, and minimum touch targets (`44pt` iOS / `48dp` Android).

---

## Step 5: Verify & Persist in Engram

1. Run the cross-ecosystem TypeScript checker:
   ```bash
   node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs
   ```
2. Save the updated contract or decision into Engram:
   ```bash
   node --no-warnings .agents/engram/engram.mjs save \
     --key="contract/<slug>" --scope="contracts" --type="contract" \
     --title="<título>" --content="<resumen técnico>" --files="<archivos>"
   ```


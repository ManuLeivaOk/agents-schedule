<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del Frontend Web (`frontend`) — Clicke Impulso

Aplicación web construida con **Next.js 16.3 (App Router)**, **React 19**, **Tailwind CSS v4**, **Base UI (`@base-ui/react`) / shadcn**, **Schedule-X** y **Recharts**.

---

## 1. Arquitectura de Rutas y Grupos

- `app/(public)/`: Rutas públicas (`/login`, etc.).
- `app/(private)/`: Rutas operativas del SaaS (`/appointments`, `/schedule`, `/customers`, `/services`, `/resources`, `/dashboard`, `/automations`, `/account`).
- `app/backoffice/`: Panel exclusivo para `UserRole.ADMIN` (gestión de organizaciones, usuarios, vigencia `paidUntil`, cupos, features y versiones de Términos y Condiciones).
- `config/navigation.ts`: Fuente de verdad de los ítems de navegación con sus requisitos `adminOnly` y `requiredFeature`.

---

## 2. Sesión, Cliente HTTP y Autorización

1. **Tokens y Sesión ([`src/lib/api-client.ts`](./src/lib/api-client.ts))**:
   - El `accessToken` vive **únicamente en memoria del módulo JS**, nunca en `localStorage` ni `sessionStorage`.
   - El `refresh_token` viaja en cookie `httpOnly` (`withCredentials: true`).
   - La rotación concurrente entre pestañas se coordina con `BroadcastChannel` y `navigator.locks`. No eliminar ni simplificar esa coordinación.
2. **Permisos en UI ([`src/providers/auth-provider.tsx`](./src/providers/auth-provider.tsx))**:
   - Usar el hook `useAuth()` y sus helpers `canAccess({ adminOnly, roles, requiredFeature })`, `hasOrgFeature(feature)`, `canManageOrganization` y `canImportData`.
   - Recordar que un `STAFF` no puede acceder a `/dashboard`, `/automations` ni ejecutar importaciones CSV/Excel.

---

## 3. Identidad Visual y Convenciones de UI

Fuente de verdad: [`docs/clicke-identidad-visual.md`](./docs/clicke-identidad-visual.md) y variables CSS en [`app/globals.css`](./app/globals.css).

- **Tipografía**: `Jost` (pesos livianos 200/300 para títulos con `letter-spacing` amplio, 400 para datos, tablas, horarios y montos).
- **Paleta y Accesibilidad**:
  - Respetar las variables semánticas (`--fondo`, `--superficie`, `--superficie-alt`, `--borde`, `--texto`, `--texto-suave`, `--acento`, `--acento-fuerte`).
  - Nunca usar `#3285C2` como único borde de un control interactivo sobre fondo oscuro (usar `#4A97D0` que cumple contraste 3:1).
- **Estados de Turno (`status-badge.tsx`)**:
  - Anillo de 12 px + texto: `CONFIRMED` (`#3285C2` lleno), `PENDING` (`#D88D26` anillo), `CANCELLED` (`#E4432F` anillo), `COMPLETED` (`#A9D4EC` lleno), `NO_SHOW` (texto suave anillo).
- **Formato de Moneda y Fechas**:
  - Montos siempre en `es-AR` (`ARS`, sin decimales).
  - Al tocar contratos de servicios en [`src/services/`](./src/services) o tipos en [`src/types/`](./src/types), verificar si el cambio impacta también a la app móvil en `../app-schedule/src/`.

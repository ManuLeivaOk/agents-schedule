# Clicke Impulso — Reglas Globales del Ecosistema y Protocolo Engram

Este workspace aloja los **3 repositorios independientes** que conforman la plataforma SaaS **Clicke Impulso** (sistema multi-tenant de gestión de turnos, agenda, clientes, automatizaciones por WhatsApp y analíticas).

---

## 1. Mapa del Ecosistema

| Capa | Directorio | Stack Principal | Puerto / Entorno |
| :--- | :--- | :--- | :--- |
| **Backend API** | [`be-schedule/`](./be-schedule) | NestJS 11, TypeORM 0.3, PostgreSQL, Passport JWT, Argon2, Luxon | `http://localhost:3000` |
| **App Web** | [`ft-schedule/`](./ft-schedule) | Next.js 16 (App Router), React 19, Tailwind CSS v4, Base UI / shadcn, Schedule-X | `http://localhost:3001` |
| **App Mobile** | [`app-schedule/`](./app-schedule) | Expo 58, React Native 0.88, React 19.3, Expo Router, TanStack Query v5 | Expo Metro / iOS & Android |

> **Importante:** No existe un paquete npm compartido (`shared-types`) entre los 3 repositorios. Los contratos HTTP, tipos de dominio y validaciones deben mantenerse **explícitamente sincronizados** entre las tres capas.

---

## 2. Matriz de Paridad Transversal (Backend ↔ Web ↔ Mobile)

Antes de modificar un endpoint, DTO, estado o regla de negocio en cualquiera de los proyectos, verificá sus contrapartes en la siguiente matriz:

| Dominio | Backend (`be-schedule/src/`) | Web (`ft-schedule/src/`) | Mobile (`app-schedule/src/`) |
| :--- | :--- | :--- | :--- |
| **Autenticación** | `auth/auth.controller.ts` (`/auth/*` y `/auth/native/*`) | `lib/api-client.ts`, `providers/auth-provider.tsx` | `auth/api.ts`, `auth/token-store.ts`, `auth/auth-provider.tsx` |
| **Permisos / Roles** | `organizations/guards/org-roles.guard.ts` | `providers/auth-provider.tsx`, `config/navigation.ts` | `auth/roles.ts`, `auth/admin-only.tsx` |
| **Turnos** | `appointments/` | `services/appointments-api.ts`, `components/ui/appointments/` | `appointments/api.ts`, `appointments/parse.ts`, `components/appointment-card.tsx` |
| **Disponibilidad** | `availability/` | `services/availability-rules-api.ts` | `availability/api.ts`, `availability/rules.ts` |
| **Clientes / Servicios** | `customers/`, `services/` | `services/catalog-api.ts` | `catalog/api.ts`, `customers/`, `services/` |
| **Recursos** | `resources/` | `services/resources-api.ts` | `resources/resource-form.tsx`, `catalog/api.ts` |
| **Analíticas** | `analytics/` | `services/analytics-api.ts`, `types/analytics.ts` | `analytics/api.ts`, `analytics/daily-charts.tsx` |
| **Automatizaciones** | `automations/` | `services/automations-api.ts`, `types/automations.ts` | `automations/api.ts`, `automations/rule-form.tsx` |
| **Cuenta / Perfil** | `users/`, `organizations/` | `services/account-api.ts`, `services/terms-api.ts` | `account/api.ts`, `account/use-time-zone.ts` |
| **Backoffice / CSV** | `backoffice/`, `imports/` | `services/backoffice-api.ts`, `services/imports-api.ts` | *Exclusivo Web (no existe en Mobile por diseño)* |

---

## 3. Invariantes de Dominio Compartidos

1. **Estados de Turno (`AppointmentStatus`)**:
   - Valores válidos: `'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'`.
   - Representación visual obligatoria (Web y Mobile): **Anillo de 12 px (borde 2.5 px) + etiqueta de texto en español** (`Pendiente`, `Confirmado`, `Completado`, `Cancelado`, `Ausente`). Nunca comunicar estado únicamente con color.
2. **Moneda y Formato Local**:
   - Idioma `es-AR`, moneda `ARS` sin decimales (`maximumFractionDigits: 0`).
3. **Zona Horaria (`organization.timezone`)**:
   - Cada organización opera en su propia zona horaria (expuesta en `GET /users/me`, fallback `America/Argentina/Cordoba`). Nunca hardcodear offsets UTC fijos al formatear horarios de turnos o calcular slots de disponibilidad.
4. **Autorización por Intersección (`AND`)**:
   - Acceso a un módulo = `(Organización activa y al día)` **AND** `(OrganizationFeature habilitada)` **AND** `(OrganizationRole permitido: OWNER | ADMIN | STAFF)`.
   - `STAFF` no tiene acceso a Dashboard (`ANALYTICS`), Automatizaciones (`AUTOMATIONS`) ni Importaciones (`IMPORTS`).

---

## 4. Protocolo de Memoria Persistente (Clicke Engram)

Este workspace cuenta con el motor de memoria **Clicke Engram** (SQLite + FTS5 en `.agents/engram/engram.mjs`), disponible como servidor MCP (`clicke-engram`) y por CLI:

- **Al iniciar una tarea transversal o de arquitectura**:
  Consultá el contexto activo o buscá decisiones previas usando la herramienta MCP `engram_context` / `engram_search`, o ejecutando:
  ```bash
  node --no-warnings .agents/engram/engram.mjs search "<tema>"
  ```
- **Al cerrar un cambio de contrato HTTP, resolver un bug complejo o completar una etapa**:
  Persistí el aprendizaje con `engram_save` o mediante CLI:
  ```bash
  node --no-warnings .agents/engram/engram.mjs save \
    --key="contract/<slug>" --scope="contracts" --type="contract" \
    --title="<título>" --content="<detalle>" --files="ruta1,ruta2"
  ```

---

## 5. Estilo de Comunicación y Respuestas
- **Concisión estricta**: No dar explicaciones extensas, introducciones teóricas o detalles redundantes a menos que el usuario lo solicite expresamente. Ir directo a la acción y al resultado concreto.

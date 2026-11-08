# Mapa de Endpoints HTTP y Clientes (Backend ↔ Web ↔ Mobile)

Referencia rápida para localizar qué controlador de `be-schedule` responde cada ruta y qué módulos la consumen en `ft-schedule` y `app-schedule`.

| Módulo / Ruta Base | Controlador Backend (`be-schedule/src/`) | Servicio Web (`ft-schedule/src/services/`) | Cliente Mobile (`app-schedule/src/`) | Permisos (`@OrgFeatures` / `@OrgRoles`) |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/*` | `auth/auth.controller.ts` | `lib/api-client.ts`, `providers/auth-provider.tsx` | *No usa cookie web* | `@Public()` en login/register/refresh |
| `/auth/native/*` | `auth/auth.controller.ts` | *No aplica en Web* | `auth/api.ts`, `auth/token-store.ts` | `@Public()` en native login/refresh/logout |
| `/users/me` | `users/users.controller.ts` | `account-api.ts` | `account/api.ts`, `account/use-time-zone.ts` | Usuario autenticado (`JwtAccessGuard`) |
| `/organizations/me/terms` | `organizations/organizations.controller.ts` | `terms-api.ts` | *Gestionado vía web* | `OWNER` para aceptar términos |
| `/appointments` | `appointments/appointments.controller.ts` | `appointments-api.ts` | `appointments/api.ts` | Feature `APPOINTMENTS` (`OWNER`, `ADMIN`, `STAFF`) |
| `/availability` | `availability/availability.controller.ts` | `appointments-api.ts`, `availability-rules-api.ts` | `availability/api.ts` | Reglas editables por `OWNER`/`ADMIN`; consulta por todos |
| `/customers` | `customers/customers.controller.ts` | `catalog-api.ts` | `catalog/api.ts`, `customers/customer-form.tsx` | Feature `CUSTOMERS` (DELETE solo `OWNER`/`ADMIN`) |
| `/services` | `services/services.controller.ts` | `catalog-api.ts` | `catalog/api.ts`, `services/service-form.tsx` | Feature `SERVICES` (mutación `OWNER`/`ADMIN`) |
| `/resources` | `resources/resources.controller.ts` | `resources-api.ts` | `catalog/api.ts`, `resources/resource-form.tsx` | Feature `RESOURCES` (mutación `OWNER`/`ADMIN`) |
| `/analytics/overview` | `analytics/analytics.controller.ts` | `analytics-api.ts` | `analytics/api.ts` | Feature `ANALYTICS` + Rol `OWNER` o `ADMIN` |
| `/automations/*` | `automations/automations.controller.ts` | `automations-api.ts` | `automations/api.ts` | Feature `AUTOMATIONS` + Rol `OWNER` o `ADMIN` |
| `/imports/*` | `imports/imports.controller.ts` | `imports-api.ts` | *Exclusivo Web* | Feature `IMPORTS` + Rol `OWNER` o `ADMIN` |
| `/backoffice/*` | `backoffice/backoffice.controller.ts` | `backoffice-api.ts` | *Exclusivo Web* | Rol global `@Roles(UserRole.ADMIN)` |


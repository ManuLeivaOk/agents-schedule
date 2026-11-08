# Reglas del Backend (`nestjs-auth`) — Clicke Impulso

API REST construida con **NestJS 11**, **TypeORM 0.3**, **PostgreSQL**, **Passport JWT**, **Argon2id** y **Luxon**.

---

## 1. Arquitectura de Seguridad y Guards Globales

En [`src/app.module.ts`](./src/app.module.ts) están registrados **4 guards globales** en este orden exacto:
1. `ThrottlerGuard`: Rate limiting global (100 req/min por IP; rutas críticas de `/auth` tienen `@Throttle()` más estricto).
2. `JwtAccessGuard`: Exige `Authorization: Bearer <accessToken>` válido en **todas** las rutas salvo las decoradas con `@Public()`.
3. `RolesGuard`: Evalúa el rol global de plataforma `@Roles(UserRole.ADMIN)` (usado en `/backoffice`).
4. `OrgRolesGuard`: Evalúa membresía a la organización, vigencia de suscripción (`paidUntil`), aceptación de Términos y Condiciones (`TermsVersion`), `@OrgFeatures(...)` y `@OrgRoles(...)`.

---

## 2. Contrato Dual de Autenticación (Web vs Mobile)

El módulo [`src/auth/`](./src/auth) atiende a dos clientes con mecanismos distintos sobre la misma tabla `refresh_tokens` (hash SHA-256 con rotación y detección de reuso por `family`):

- **Contrato Web (`/auth/login`, `/auth/refresh`, `/auth/logout`)**:
  - Devuelve `{ accessToken, user }` en el body y setea el `refresh_token` en una cookie `httpOnly` (`SameSite=Strict`, `path: /auth`).
- **Contrato Nativo Mobile (`/auth/native/login`, `/auth/native/refresh`, `/auth/native/logout`)**:
  - Devuelve y recibe `refreshToken` en el body JSON (`{ accessToken, refreshToken, user }`) porque React Native almacena el secreto en `expo-secure-store`.
- **Regla de oro**: Cualquier cambio en el payload de usuario (`buildUserResponse` / `/auth/me` / `/users/me`) o en la rotación de tokens debe mantener intactos ambos flujos.

---

## 3. Permisos por Organización (`@OrgRoles` y `@OrgFeatures`)

- **Intersección `AND`**: `OrgRolesGuard` combina (`getAllAndMerge`) los metadatos de clase y de método.
- **Features (`OrganizationFeature`)**: Se almacenan por exclusión en `organizations.disabledFeatures` y se exponen activas como `organizationFeatures` (`APPOINTMENTS`, `CUSTOMERS`, `SERVICES`, `RESOURCES`, `ANALYTICS`, `AUTOMATIONS`, `IMPORTS`).
- **Roles (`OrganizationRole`)**: `OWNER`, `ADMIN`, `STAFF`.

---

## 4. Base de Datos, Entidades y DTOs

1. **Migraciones obligatorias (`synchronize: false`)**:
   - Nunca activar `synchronize: true` en [`src/config/typeorm.config.ts`](./src/config/typeorm.config.ts).
   - Para cambios de esquema: crear o generar la migración en [`src/migrations/`](./src/migrations) (`npm run migration:generate -- src/migrations/NombreMigracion`) y verificarla con `npm run migration:run`.
2. **Validación estricta de DTOs**:
   - `ValidationPipe` en [`src/main.ts`](./src/main.ts) tiene `whitelist: true` y `forbidNonWhitelisted: true`.
   - Toda propiedad nueva enviada por `frontend` o `app-schedule` debe estar declarada en el DTO con su decorador de `class-validator` correspondiente, o la API devolverá `400 Bad Request`.
3. **Fechas y Zonas Horarias**:
   - Usar `Luxon` (`DateTime`) respetando el `timezone` de la organización (`organization.timezone`, por defecto `America/Argentina/Cordoba`).

---

## 5. Documentación Interna de Referencia

- [`docs/Resumen-Features-Actuales.md`](./docs/Resumen-Features-Actuales.md): Mapa funcional completo.
- [`docs/Permisos-Roles-y-Organizaciones.md`](./docs/Permisos-Roles-y-Organizaciones.md): Detalle de las 3 capas de permisos.
- [`docs/Arquitectura-API-y-DB.md`](./docs/Arquitectura-API-y-DB.md) y [`docs/Modelo-de-dominio-del-SaaS.md`](./docs/Modelo-de-dominio-del-SaaS.md): Modelo relacional.
- [`docs/Sistema-de-automatizaciones.md`](./docs/Sistema-de-automatizaciones.md): Motor de reglas y WhatsApp Cloud API.


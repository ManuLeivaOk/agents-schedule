# Reglas de la App Mobile (`app-schedule`) — Clicke Impulso

Aplicación nativa para Android e iOS construida con **Expo 58**, **React Native 0.88**, **React 19.3**, **Expo Router**, **TanStack Query v5** y **TypeScript**.

Fuentes de verdad arquitectónicas en este repositorio:
- [`ADR-001-app-mobile.md`](./ADR-001-app-mobile.md): Decisiones de arquitectura, diseño, sesión y alcance.
- [`ETAPAS-app-mobile.md`](./ETAPAS-app-mobile.md): Hoja de ruta en 20 etapas y sus checklists de verificación.

---

## 1. Sesión Nativa y Seguridad (`src/auth/`)

- **Endpoints exclusivos nativos**:
  - `POST /auth/native/login` → devuelve `{ accessToken, refreshToken, user }`.
  - `POST /auth/native/refresh` → recibe `{ refreshToken }` en el body, lo rota y devuelve el par nuevo.
  - `POST /auth/native/logout` → recibe `{ refreshToken }` en el body y revoca la sesión del dispositivo.
  - `POST /auth/logout-all` → revoca todas las sesiones del usuario.
- **Almacenamiento de tokens ([`src/auth/token-store.ts`](./src/auth/token-store.ts))**:
  - `accessToken`: **Solo en memoria**.
  - `refreshToken`: **Solo en `expo-secure-store`** bajo la clave `clicke.refreshToken` (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` en iOS, excluido de auto-backup en Android). Prohibido guardarlo en `AsyncStorage` o imprimirlo en logs.
- **Un único refresh en vuelo**: Ante un `401` fuera de rutas de auth, se ejecuta un solo refresh y se reintenta la petición; si falla, se limpia `SecureStore` y se redirige a `/login`.

---

## 2. Navegación, Permisos y Alcance (`src/app/`, `src/navigation/`)

- **4 Pestañas principales**:
  1. `Turnos`: Lista del día (pantalla inicial tras el login).
  2. `Agenda`: Línea de tiempo diaria con tira semanal (lunes a domingo) y filtro por recurso.
  3. `Clientes`: Lista completa con búsqueda local en `es-AR` y ficha de detalle.
  4. `Más`: Servicios, Recursos y Mi cuenta. **Dashboard** y **Automatizaciones** solo se muestran y permiten a `OWNER` y `ADMIN` ([`src/auth/admin-only.tsx`](./src/auth/admin-only.tsx) y [`src/auth/roles.ts`](./src/auth/roles.ts)).
- **Formularios en Stack (no modales web)**:
  - Alta/edición de turno (`/turno/nuevo`, `/turno/[id]`), ficha/formulario de cliente, servicio, recurso y automatización son pantallas del stack con soporte completo para el botón atrás físico de Android ([`src/navigation/android-back.ts`](./src/navigation/android-back.ts)).
- **Fuera de alcance en Mobile**: Importación CSV/Excel, registro de usuario, backoffice y modo offline.

---

## 3. Sistema de Diseño, Tipografía y Accesibilidad (`src/theme/`, `src/components/`)

- **Tema inicial**: **Claro** (`#FAFAF8` fondo, `#FFFFFF` superficie, `#F2F1ED` superficie alt). El modo oscuro (`#2f3235` fondo, `#383B3E` superficie) se alterna desde **Mi cuenta** y se persiste en el dispositivo.
- **Tipografía Jost (`expo-font`)**:
  - Pesos `200`, `300`, `400` y `500`. En React Native el `letterSpacing` se define en **puntos** (ej. Título de pantalla: `32pt`, peso `200`, spacing `5.8`, mayúsculas; Encabezado de sección: `14pt`, peso `400`, spacing `2.2`, mayúsculas). Usar [`src/components/app-text.tsx`](./src/components/app-text.tsx).
- **Anillo de Estado ([`src/components/status-badge.tsx`](./src/components/status-badge.tsx))**:
  - Anillo de `12 px` (`borderWidth: 2.5`) + etiqueta de texto (`Confirmado`, `Pendiente`, `Cancelado`, `Completado`, `Ausente`). Nunca solo color.
- **Áreas tocables y movimiento**:
  - Mínimo `44 pt` en iOS y `48 dp` en Android ([`src/theme/hit-target.ts`](./src/theme/hit-target.ts)).
  - Respetar `AccessibilityInfo.isReduceMotionEnabled()`.

---

## 4. Datos, Caché y Zona Horaria

- **TanStack Query v5 ([`src/query/query-client.ts`](./src/query/query-client.ts))**: Todo el estado de servidor se gestiona con queries e invalidación de caché al mutar.
- **Zona Horaria ([`src/account/use-time-zone.ts`](./src/account/use-time-zone.ts))**: Usar `organization.timezone` proveniente de `GET /users/me`, con fallback a `America/Argentina/Cordoba`.
- **Moneda**: Formato `es-AR`, `ARS` sin decimales ([`src/appointments/format.ts`](./src/appointments/format.ts)).


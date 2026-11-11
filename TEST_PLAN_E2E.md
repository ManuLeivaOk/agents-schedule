# Plan de Pruebas End-to-End (E2E) — Clicke Impulso

Este documento define el **Plan de Pruebas de Extremo a Extremo (E2E)** para validar la totalidad del flujo funcional, contratos HTTP, reglas de negocio, permisos multi-tenant e identidad visual de **Clicke Impulso** a través de sus tres capas:
- **Backend API** (`be-schedule` — NestJS 11 + TypeORM + PostgreSQL + Luxon, `http://localhost:3000`)
- **App Web** (`ft-schedule` — Next.js 16 + React 19 + Tailwind CSS v4, `http://localhost:3001`)
- **App Mobile** (`app-schedule` — Expo 58 + React Native 0.88 + TanStack Query v5)

---

## 0. Invariantes Transversales (Checklist Permanente)

Durante la ejecución de **cualquier** caso de prueba en Web o Mobile, verificar siempre estos 5 invariantes globales:

- [x] **Estados de Turno (`AppointmentStatus`)**: Siempre deben mostrarse con **Anillo de 12 px (borde 2.5 px) + etiqueta de texto en español** (nunca solo color):
  - `PENDING` → Anillo `#D88D26` + `"Pendiente"`
  - `CONFIRMED` → Círculo lleno `#3285C2` + `"Confirmado"`
  - `COMPLETED` → Círculo lleno `#A9D4EC` + `"Completado"`
  - `CANCELLED` → Anillo `#E4432F` + `"Cancelado"`
  - `NO_SHOW` → Anillo texto-suave + `"Ausente"`
- [x] **Moneda y Formato Local**: Todos los precios y métricas financieras se formatean en locale `es-AR`, moneda `ARS`, **sin decimales** (`maximumFractionDigits: 0`, ej. `$ 12.500`).
- [x] **Zona Horaria (`organization.timezone`)**: Todos los horarios de turnos y slots de disponibilidad respetan la zona horaria de la organización expuesta en `GET /users/me` (por defecto `America/Argentina/Cordoba`), sin desfases UTC.
- [x] **Identidad Visual y Accesibilidad**: Tipografía `Jost` (pesos 200, 300, 400, 500), controles interactivos con borde accesible (`#4A97D0`), áreas táctiles mínimas de `44pt` (iOS) / `48dp` (Android) y logo completo presente **únicamente** en la pantalla de Login.
- [x] **Validación Estricta de DTOs (`ValidationPipe`)**: Ningún request de Web o Mobile debe enviar propiedades no declaradas en los DTOs (`forbidNonWhitelisted: true`), verificando ausencia de errores HTTP `400 Bad Request` inesperados en la consola de red.

---

## Fase 1: Backoffice SuperAdmin — Términos, Organización Nueva y Usuarios

**Objetivo:** Validar el aprovisionamiento desde cero de un nuevo tenant (organización), sus cupos de usuarios, sus módulos habilitados (`OrganizationFeature`) y la vigencia de Términos y Condiciones.
**Rol requerido:** Usuario con rol global `UserRole.SUPER_ADMIN` en `/backoffice` (exclusivo Web).

### 1.1. Gestión de Términos y Condiciones (`/backoffice/terms`)
- [x] **TC-1.1 — Crear versión de Términos y Condiciones:**
  1. Iniciar sesión en Web con cuenta `SUPER_ADMIN` y navegar a `/backoffice`.
  2. Crear una nueva versión de T&C (`POST /backoffice/terms`) completando:
     - `version`: `"1.1.0"`
     - `title`: `"Términos y Condiciones de Uso Clicke Impulso"`
     - `summary`: `"Actualización de políticas de agenda y WhatsApp"`
     - `content`: Texto legal de al menos 50 caracteres.
     - `gracePeriodDays`: `7`
  3. **Resultado esperado:** La versión queda publicada como vigente y aparece en el listado `GET /backoffice/terms`.

### 1.2. Alta de Organización Nueva y Usuarios Iniciales (`/backoffice/organizations`)
- [x] **TC-1.2 — Crear organización desde cero con sus 3 roles iniciales:**
  1. En `/backoffice`, abrir el formulario de **Nueva Organización** (`POST /backoffice/organizations`).
  2. Configurar los parámetros de la organización:
     - `name`: `"Clínica Integral Demo"`
     - `timezone`: `"America/Argentina/Cordoba"`
     - `currency`: `"ARS"`
     - `active`: `true`
     - `paidUntil`: Fecha ISO futura (ej. dentro de 30 días).
     - Cupos: `maxOwners: 2`, `maxAdmins: 3`, `maxStaff: 5`.
     - `disabledFeatures`: `[]` (todas las features activas: `APPOINTMENTS`, `CUSTOMERS`, `SERVICES`, `RESOURCES`, `ANALYTICS`, `AUTOMATIONS`, `IMPORTS`).
  3. En la misma creación, cargar 3 usuarios iniciales (`users`):
     - `owner@clinicademo.com` → Rol `OWNER` (contraseña ≥ 8 caracteres).
     - `admin@clinicademo.com` → Rol `ADMIN`.
     - `staff@clinicademo.com` → Rol `STAFF`.
  4. **Resultado esperado:** Se crea la organización con sus 3 miembros activos y aparece en `GET /backoffice/organizations`.

### 1.3. Gestión de Miembros, Cupos y Estado de Suscripción
- [x] **TC-1.3 — Agregar usuarios adicionales y validar límite de cupos (`maxOwners` / `maxAdmins` / `maxStaff`):**
  1. Entrar al detalle de `"Clínica Integral Demo"` (`GET /backoffice/organizations/:id`).
  2. Agregar un nuevo usuario `STAFF` vía `POST /backoffice/organizations/:id/users`.
  3. Intentar agregar más usuarios `OWNER` que el límite `maxOwners` configurado.
  4. **Resultado esperado:** El alta dentro del cupo es exitosa; al superar el cupo máximo del rol, el backend rechaza la operación con mensaje claro.
- [x] **TC-1.4 — Edición y baja de miembros (`PATCH` y `DELETE`):**
  1. Cambiar el rol o contraseña de un miembro (`PATCH /backoffice/organizations/:id/users/:memberId`) o desactivarlo (`isActive: false`).
  2. Eliminar un miembro de prueba (`DELETE /backoffice/organizations/:id/users/:memberId`).
  3. **Resultado esperado:** Los cambios se reflejan inmediatamente y el usuario desactivado/eliminado no puede operar en la organización.

---

## Fase 2: Autenticación Dual (Web vs Mobile) y Aceptación de Términos

**Objetivo:** Verificar el contrato dual de sesiones (Cookies `httpOnly` en Web vs Body JSON + `SecureStore` en Mobile) y el flujo legal de aceptación de T&C.

### 2.1. Flujo de Sesión en Web (`ft-schedule`)
- [x] **TC-2.1 — Login, Refresh en memoria/cookie y sincronización multi-pestaña:**
  1. Iniciar sesión en Web (`POST /auth/login`) con `owner@clinicademo.com`.
  2. Verificar que el `accessToken` no se guarda en `localStorage` (vive en memoria) y que se setea la cookie `httpOnly` `refresh_token` (`SameSite=Strict`, `path: /auth`).
  3. Abrir una segunda pestaña de la app: verificar que la sesión se recupera y sincroniza vía `BroadcastChannel`.
  4. Cerrar sesión (`POST /auth/logout`) en una pestaña y comprobar que la otra pestaña también cierra la sesión.

### 2.2. Flujo de Sesión Nativo en Mobile (`app-schedule`)
- [ ] **TC-2.2 — Login nativo, persistencia en `SecureStore` y rotación de Refresh Token:**
  1. Iniciar sesión en la App Mobile (`POST /auth/native/login`) con `owner@clinicademo.com`.
  2. Cerrar y matar la app por completo; volver a abrirla.
  3. **Resultado esperado:** La app restaura la sesión automáticamente invocando `POST /auth/native/refresh` con el token guardado en `expo-secure-store` (`clicke.refreshToken`), rotando la familia de tokens sin pedir credenciales de nuevo.

### 2.3. Aceptación de Términos y Condiciones (`/organizations/me/terms`)
- [x] **TC-2.3 — Verificación de restricción por rol y aceptación por `OWNER`:**
  1. Iniciar sesión con `staff@clinicademo.com` o `admin@clinicademo.com` y consultar el estado de T&C (`GET /organizations/me/terms`). Verificar que solo el `OWNER` tiene permiso para firmar la aceptación (`POST /organizations/me/terms/accept`).
  2. Con la sesión de `owner@clinicademo.com`, aceptar los Términos y Condiciones vigentes.
  3. Volver al Backoffice (`GET /backoffice/terms/:id/acceptances`) y verificar que quedó registrada la aceptación con fecha, usuario, IP y User-Agent.

---

## Fase 3: Matriz de Autorización en 3 Capas (`Vigencia AND Feature AND Rol`)

**Objetivo:** Comprobar que el acceso a cada módulo requiere la intersección `AND` de suscripción activa, feature habilitada y rol permitido.

- [x] **TC-3.1 — Restricciones del rol `STAFF` (Web y Mobile):**
  1. Iniciar sesión con `staff@clinicademo.com` en Web y en Mobile.
  2. Verificar que **SÍ** puede ver y operar:
     - **Turnos y Agenda** (`/appointments`, `/schedule`).
     - **Clientes** (`/customers`): puede listar, buscar, ver detalle, crear y editar, pero **NO puede eliminar clientes** (`DELETE /customers/:id` debe estar oculto en UI y responder `403` en API).
     - **Servicios y Recursos**: solo lectura (para agendar turnos); no puede crear, editar ni eliminar servicios, recursos ni reglas horarias.
  3. Verificar que **NO** tiene acceso (oculto en navegación y bloqueado con `403 Forbidden` en API) a:
     - **Dashboard / Analíticas** (`ANALYTICS`)
     - **Automatizaciones / WhatsApp** (`AUTOMATIONS`)
     - **Importaciones CSV/Excel** (`IMPORTS`)
- [x] **TC-3.2 — Desactivación dinámica de `OrganizationFeature`:**
  1. Desde Backoffice (`PATCH /backoffice/organizations/:id` o `PATCH /organizations/:id/features`), agregar `AUTOMATIONS` e `IMPORTS` a `disabledFeatures`.
  2. Con `owner@clinicademo.com`, refrescar Web y Mobile.
  3. **Resultado esperado:** Aunque el usuario es `OWNER`, los módulos de Automatizaciones e Importaciones desaparecen de la navegación y sus endpoints devuelven `403`.
  4. Rehabilitar todas las features (`disabledFeatures: []`) antes de pasar a la Fase 4.
- [x] **TC-3.3 — Bloqueo por suscripción vencida (`paidUntil`) o cuenta inactiva (`active: false`):**
  1. En Backoffice, configurar `paidUntil` con una fecha pasada para la organización.
  2. Intentar operar con `owner@clinicademo.com`.
  3. **Resultado esperado:** El guard `OrgRolesGuard` bloquea el acceso operativo indicando suscripción vencida. Restaurar `paidUntil` a fecha futura.

---

## Fase 4: Catálogo Manual e Importación Masiva (Recursos, Reglas Horarias, Servicios y Clientes)

**Objetivo:** Probar el alta manual en Web y Mobile y el motor de importación masiva CSV/Excel (`.xlsx`) con sus estrategias de duplicados y creación automática de recursos.
**Rol requerido:** `OWNER` o `ADMIN`.

### 4.1. Recursos (`Resources`) — Alta Manual y Colores de Agenda
- [x] **TC-4.1 — Crear recursos de los 4 tipos canónicos (`ResourceType`):**
  1. En Web (`/resources`) y Mobile (`Recursos`), crear manualmente al menos un recurso de cada tipo:
     - `PERSON`: `"Dra. Sofía Martínez"`
     - `SPACE`: `"Consultorio Central"`
     - `EQUIPMENT`: `"Láser Diodo"`
     - `GENERIC`: `"Box Guardia"`
  2. Asignar un color distintivo en `metadata.color` a cada recurso desde Web y verificar edición y switch de estado `active` (`true`/`false`).
  3. **Resultado esperado:** Los recursos se listan en Web y Mobile con sus etiquetas de tipo en español (`Persona`, `Espacio`, `Equipo`, `Genérico`) y su color asignado.

### 4.2. Reglas de Disponibilidad Horaria por Recurso (`Availability Rules`)
- [x] **TC-4.2 — Configurar horarios semanales (`GET/PUT /availability/resources/:id/rules`):**
  1. Seleccionar el recurso `"Dra. Sofía Martínez"`.
  2. Configurar sus franjas horarias (`dayOfWeek` de `0` Domingo a `6` Sábado, formato `HH:mm`), por ejemplo:
     - Lunes (`1`) a Viernes (`5`): cortado en dos turnos `09:00` a `13:00` y `14:00` a `18:00`.
     - Sábado (`6`): `09:00` a `13:00`.
  3. Intentar guardar dos franjas que se solapen en el mismo día (ej. `09:00–13:00` y `12:00–15:00`) o con `startTime >= endTime`.
  4. **Resultado esperado:** Las franjas válidas se persisten en Web y Mobile; las franjas solapadas o invertidas son rechazadas por validación.

### 4.3. Servicios (`Services`) y Clientes (`Customers`) — Alta Manual
- [x] **TC-4.3 — Crear servicio con buffers y recursos asociados:**
  1. En Web (`/services`) o Mobile (`Servicios`), crear un servicio:
     - `name`: `"Consulta Dermatológica"`
     - `durationMinutes`: `30`
     - `bufferBeforeMinutes`: `5`
     - `bufferAfterMinutes`: `5`
     - `price`: `15000`
     - Recursos vinculados: `"Dra. Sofía Martínez"` y `"Consultorio Central"`.
  2. **Resultado esperado:** El servicio se muestra con precio formateado `$ 15.000` (ARS sin decimales) y vinculado a los recursos elegidos.
- [x] **TC-4.4 — Crear, buscar y editar Cliente:**
  1. En Web (`/customers`) y Mobile (`Clientes`), dar de alta un cliente:
     - `firstName`: `"Lucía"`, `lastName`: `"Fernández"`, `documentNumber`: `"35111222"`, `phone`: `"+54 9 351 555-1234"`, `email`: `"lucia@example.com"`, `birthDate`: `"1992-08-24"`, `notes`: `"Paciente primera vez"`.
  2. Probar el buscador por nombre, DNI, teléfono o email tanto en Web como el filtrado instantáneo en Mobile.
  3. Entrar a la vista de detalle del cliente (`customer-detail-view.tsx`) y verificar sus datos e historial.

### 4.4. Importación Masiva CSV y Excel (`/imports/*` — Exclusivo Web)
- [x] **TC-4.5 — Descarga de plantillas oficiales (`GET /imports/template/:entity`):**
  1. En la sección de Importaciones en Web, descargar las plantillas en formato `.csv` y `.xlsx` para `customers`, `resources`, `services`, y la plantilla unificada `all` (`.xlsx` con las 3 hojas: `Clientes`, `Recursos`, `Servicios`).
  2. Verificar que pedir `entity=all&format=csv` devuelve error controlado (`400`) porque el libro multi-hoja requiere `.xlsx`.
- [x] **TC-4.6 — Simulación (`dryRun: true`) e Importación de Recursos, Servicios y Clientes:**
  1. Subir un archivo de Recursos (`POST /imports/resources`) con `dryRun: true`. Verificar que devuelve el resumen de filas a crear/actualizar sin persistir cambios en base de datos.
  2. Ejecutar la importación real (`dryRun: false`) de Servicios (`POST /imports/services`) incluyendo en la columna `resources` un recurso que **aún no existe** (ej. `"Ecógrafo 4D"`), con el flag `createMissingResources: true`.
  3. **Resultado esperado:** El servicio se importa y el recurso `"Ecógrafo 4D"` se crea y vincula automáticamente.
- [x] **TC-4.7 — Estrategias de duplicados (`strategy`):**
  1. Re-importar el mismo archivo de Clientes o Servicios probando las 3 opciones de `ImportDuplicateStrategy`:
     - `skip_existing`: omite los registros existentes sin modificarlos.
     - `update_existing`: actualiza precios/datos de los registros coincidentes.
     - `create_all`: fuerza la creación según las reglas de la entidad.
- [x] **TC-4.8 — Importación unificada de Workbook (`POST /imports/all`):**
  1. Subir el archivo Excel `.xlsx` con las 3 pestañas (`Clientes`, `Recursos`, `Servicios`) en un solo paso y verificar que las tres entidades quedan creadas y relacionadas.

---

## Fase 5: Turnos (`Appointments`), Grilla Interactiva (`/schedule`) y Exportación PDF

**Objetivo:** Validar la creación de turnos, cálculo de disponibilidad, agendado directo desde grilla, Drag & Drop / Resize, estados e impresión PDF.

### 5.1. Consulta de Disponibilidad y Alta de Turno
- [x] **TC-5.1 — Cálculo de slots disponibles (`GET /availability` y `GET /availability/day`):**
  1. Abrir el diálogo de Nuevo Turno eligiendo Servicio `"Consulta Dermatológica"`, Recurso `"Dra. Sofía Martínez"` y una fecha hábil.
  2. Verificar que los slots ofrecidos respetan las reglas horarias del recurso (`09:00–13:00` y `14:00–18:00`), la duración (`30 min`), los buffers (`5 min` antes/después) y la zona horaria `America/Argentina/Cordoba`.
- [x] **TC-5.2 — Creación de turno tradicional y verificación de Snapshots:**
  1. Crear el turno (`POST /appointments`) para `"Lucía Fernández"` con origen `ADMIN`.
  2. Modificar posteriormente el precio o nombre del servicio en `/services`.
  3. **Resultado esperado:** El turno ya creado conserva intactos sus snapshots (`price`, `durationMinutes`, `serviceNameSnapshot`).

### 5.2. Experiencia Interactiva en Grilla Web (`/schedule`)
- [x] **TC-5.3 — Identidad de color por recurso (`resource.metadata.color`) + Anillo de Estado:**
  1. En `/schedule`, alternar entre las vistas **Día**, **Semana** y **Lista**.
  2. Verificar que el color del recurso (`resource.metadata.color`) se aplica en:
     - Borde izquierdo y fondo translúcido (`color-mix`) del bloque del turno.
     - Punto indicador junto al nombre del recurso en las tarjetas y en el `Select` de filtro de recursos.
     - Bloques de fondo de disponibilidad horaria y modal de detalle del turno (`appointment-detail-dialog.tsx`).
  3. Verificar que el estado del turno dentro del bloque sigue mostrándose con el `StatusRing` + etiqueta en español.
- [x] **TC-5.4 — Agendado directo haciendo clic o arrastrando en hueco libre de la grilla:**
  1. En la vista Día o Semana de `/schedule`, hacer clic y arrastrar verticalmente sobre un hueco libre (ej. de `10:00` a `10:45`) en la columna de un recurso.
  2. **Resultado esperado:** Se abre `CreateAppointmentDialog` pre-cargando automáticamente la fecha seleccionada, la hora de inicio (`defaultTime: "10:00"`), la duración arrastrada (`defaultDurationMinutes: 45`) y el recurso/slot correspondiente.
- [x] **TC-5.5 — Drag & Drop (`move`), Resize de duración y Rollback ante conflicto:**
  1. **Mover hora (vertical):** Arrastrar un turno existente hacia abajo en la grilla; verificar el snap de 15 minutos y la actualización optimista vía `PATCH /appointments/:id`.
  2. **Mover día (horizontal en vista Semana):** Arrastrar un turno de la columna del Martes a la del Jueves y verificar que actualiza su fecha manteniendo o ajustando la hora.
  3. **Resize (estirar borde inferior):** Arrastrar el borde inferior del bloque del turno para extender su `durationMinutes` de `30` a `60` minutos.
  4. **Conflicto y Rollback:** Arrastrar un turno encima de otro turno ocupado del mismo recurso que provoque conflicto en el backend; verificar que el turno vuelve automáticamente a su posición original (rollback optimista) mostrando notificación de error.

### 5.3. Ciclo de Vida de Estados y Privacidad en Exportación PDF
- [x] **TC-5.6 — Transición por los 5 estados (`AppointmentStatus`) en Web y Mobile:**
  1. Cambiar el estado de un turno pasando por `PENDING` (`Pendiente`), `CONFIRMED` (`Confirmado`), `COMPLETED` (`Completado`), `NO_SHOW` (`Ausente`) y `CANCELLED` (`Cancelado`).
  2. Verificar el reflejo inmediato en la agenda diaria/semanal Web y en la tira semanal + lista de turnos en Mobile.
- [x] **TC-5.7 — Exportación PDF de agenda semanal por recurso (`exportResourceWeekPdf`):**
  1. En `/schedule` (Web), filtrar por un recurso y exportar el PDF de la agenda semanal.
  2. Inspeccionar las columnas de clientes en el PDF generado.
  3. **Resultado esperado (Invariante de Privacidad):** La columna de identificación del cliente muestra **únicamente el DNI (`documentNumber`)** y **nunca incluye el número de teléfono**.

---

## Fase 6: Automatizaciones y WhatsApp Cloud API (`/automations`)

**Objetivo:** Validar la configuración segura de WhatsApp Cloud API, las reglas de envío automático por evento y el monitoreo de ejecuciones en Web y Mobile.
**Rol requerido:** `OWNER` o `ADMIN` con feature `AUTOMATIONS`.

- [x] **TC-6.1 — Configuración de WhatsApp con token enmascarado (`accessTokenMasked`):**
  1. Navegar a la configuración de WhatsApp en Web y en Mobile (`Automatizaciones` → `Configuración WhatsApp`).
  2. Cargar el `phoneNumberId` y un `accessToken` de Meta Cloud API y guardar.
  3. Recargar la pantalla e inspeccionar la respuesta de red: verificar que el backend **jamás devuelve el token completo**, sino únicamente `accessTokenMasked`, y que el input para reemplazarlo es de tipo password (`type="password"` en Web / `secureTextEntry` en Mobile).
- [x] **TC-6.2 — Creación de Reglas de Automatización (`AutomationRule`):**
  1. Crear reglas activas para los 4 disparadores (`AutomationTrigger`):
     - `APPOINTMENT_CREATED` (Confirmación inmediata al agendar).
     - `APPOINTMENT_UPCOMING` (Recordatorio antes del turno, probando unidades `AutomationDelayUnit`: `MINUTES`, `HOURS`, `DAYS`, `WEEKS`, `MONTHS`).
     - `APPOINTMENT_COMPLETED` (Mensaje post-atención).
     - `APPOINTMENT_CANCELLED` (Aviso de cancelación).
  2. Verificar alta, edición, activación/desactivación y baja de reglas tanto en Web como en Mobile (`rule-form.tsx`).
- [x] **TC-6.3 — Historial y Estados de Ejecución (`AutomationExecution`):**
  1. Crear un nuevo turno para disparar la regla `APPOINTMENT_CREATED` y `APPOINTMENT_UPCOMING`.
  2. Cancelar el turno para verificar que las ejecuciones pendientes de recordatorio pasan a `CANCELLED` y se encola la de `APPOINTMENT_CANCELLED`.
  3. Revisar la pestaña de **Ejecuciones** en Web y Mobile verificando los estados (`PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`, `CANCELLED`).

---

## Fase 7: Dashboard y Analíticas (`/analytics/overview`)

**Objetivo:** Comprobar la exactitud de los indicadores operativos/financieros y el desglose interactivo diario por estado, servicio y recurso en Web y Mobile.
**Rol requerido:** `OWNER` o `ADMIN` con feature `ANALYTICS`.

- [x] **TC-7.1 — KPIs y Serie Diaria (`GET /analytics/overview`):**
  1. Abrir el Dashboard en Web (`dashboard-view.tsx`) y en Mobile (`Analíticas` / `daily-charts.tsx`) seleccionando un rango de fechas que contenga los turnos creados en la Fase 5.
  2. Verificar que los ingresos estimados/completados se muestran en `ARS` sin decimales y que cada punto de `daily` incluye el conteo de `pending`, `confirmed`, `completed`, `cancelled` y `noShow`.
- [x] **TC-7.2 — Filtrado cruzado del Gráfico de Turnos por Día (`dailyBreakdown`):**
  1. En el gráfico de **Turnos por día** (tanto en Web como en los gráficos SVG de Mobile), aplicar filtros individuales y combinados usando `dailyBreakdown`:
     - Filtrar por **Estado** (ej. solo `CONFIRMED` o `PENDING`).
     - Filtrar por **Servicio** (ej. `"Consulta Dermatológica"`).
     - Filtrar por **Recurso** (ej. `"Dra. Sofía Martínez"`).
  2. **Resultado esperado:** Las barras/series del gráfico diario se recalculan dinámicamente coincidiendo entre Web y Mobile sin necesidad de recargar toda la página.

---

## Fase 8: Verificación Específica Mobile (`app-schedule` — Etapa 20) y Mi Cuenta

**Objetivo:** Completar la validación en dispositivos/emuladores de las 4 pestañas principales, Mi Cuenta y los 4 perfiles de pantalla definidos en `ETAPAS-app-mobile.md`.

- [ ] **TC-8.1 — Mi Cuenta, Zona Horaria y Tema (Claro / Oscuro / Sistema):**
  1. En Mobile, abrir la pantalla **Mi Cuenta**.
  2. Verificar los datos del usuario (`GET /users/me`), el rol en la organización y la zona horaria activa (`useTimeZone()`).
  3. Alternar el tema visual entre **Claro**, **Oscuro** y **Sistema**, verificando que todas las pantallas, badges de estado (`status-badge.tsx`) y gráficos SVG respetan los tokens de contraste de la identidad visual Clicke.
- [ ] **TC-8.2 — Matriz de Dispositivos y Parsers Defensivos (Etapa 20):**
  1. Ejecutar el recorrido completo de las 4 pestañas (Turnos/Agenda, Catálogo/Clientes/Servicios/Recursos, Analíticas/Automatizaciones, Mi Cuenta) en los **4 perfiles de dispositivo** en modo Claro y Oscuro:
     - **Android Chico** (viewport compacto, verificar ausencia de solapamientos en tira semanal y formularios).
     - **Android Grande** (verificar aprovechamiento de espacio y áreas tocables ≥ `48dp`).
     - **iPhone Chico** (verificar `SafeAreaView`, teclado virtual en formularios de turno/cliente y áreas tocables ≥ `44pt`).
     - **iPhone Grande** (verificar grillas, modales y gráficos SVG).
- [x] **TC-8.3 — Verificación de Compilación Transversal (Script de Ecosistema):**
  1. Ejecutar el verificador de tipos en los 3 repositorios para confirmar cero deriva de contratos TypeScript:
     ```bash
     node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs
     ```
  2. **Resultado esperado:** `be-schedule`, `ft-schedule` y `app-schedule` compilan sin errores de tipos.


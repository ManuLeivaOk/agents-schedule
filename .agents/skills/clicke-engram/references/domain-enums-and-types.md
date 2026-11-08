# Diccionario Canónico de Enums y Tipos de Dominio (Backend ↔ Web ↔ Mobile)

Este documento refleja las definiciones reales en código TypeScript de los 3 repositorios. Usalo como referencia antes de crear o modificar DTOs, parsers o componentes.

---

## 1. Turnos (`Appointments`)

- **Backend**: [`nestjs-auth/src/appointments/entities/appointment.entity.ts`](../../../../nestjs-auth/src/appointments/entities/appointment.entity.ts)
- **Web**: [`frontend/src/types/appointments.ts`](../../../../frontend/src/types/appointments.ts)
- **Mobile**: [`app-schedule/src/appointments/types.ts`](../../../../app-schedule/src/appointments/types.ts) y [`parse.ts`](../../../../app-schedule/src/appointments/parse.ts)

```ts
export type AppointmentStatus =
  | 'PENDING'    // Anillo #D88D26 (borde) + "Pendiente"
  | 'CONFIRMED'  // Círculo #3285C2 (lleno) + "Confirmado"
  | 'COMPLETED'  // Círculo #A9D4EC (lleno) + "Completado"
  | 'CANCELLED'  // Anillo #E4432F (borde) + "Cancelado"
  | 'NO_SHOW'    // Anillo texto-suave (borde) + "Ausente"

export type AppointmentSource = 'ADMIN' | 'CUSTOMER' | 'IMPORT'
```

- **Snapshots en `Appointment`**: `durationMinutes` (`int`), `price` (`numeric(12,2)` serializado como `string | null`), `serviceNameSnapshot` (`varchar(120)`).

---

## 2. Recursos (`Resources`) y Disponibilidad (`Availability`)

- **Backend**: [`nestjs-auth/src/resources/entities/resource.entity.ts`](../../../../nestjs-auth/src/resources/entities/resource.entity.ts)
- **Web**: [`frontend/src/services/resources-api.ts`](../../../../frontend/src/services/resources-api.ts)
- **Mobile**: [`app-schedule/src/catalog/types.ts`](../../../../app-schedule/src/catalog/types.ts)

```ts
export type ResourceType = 'PERSON' | 'SPACE' | 'EQUIPMENT' | 'GENERIC'
```

- **Reglas Horarias (`AvailabilityRule`)**:
  - `dayOfWeek`: `0` (Domingo) a `6` (Sábado).
  - `startTime` y `endTime`: formato `'HH:mm'` (ej. `'09:00'`, `'18:00'`).

---

## 3. Automatizaciones y WhatsApp (`Automations`)

- **Backend**: [`nestjs-auth/src/automations/entities/automation-rule.entity.ts`](../../../../nestjs-auth/src/automations/entities/automation-rule.entity.ts) y [`automation-execution.entity.ts`](../../../../nestjs-auth/src/automations/entities/automation-execution.entity.ts)
- **Web**: [`frontend/src/types/automations.ts`](../../../../frontend/src/types/automations.ts)
- **Mobile**: [`app-schedule/src/automations/types.ts`](../../../../app-schedule/src/automations/types.ts)

```ts
export type AutomationTrigger =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPCOMING'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_CANCELLED'

export type AutomationDelayUnit =
  | 'MINUTES'
  | 'HOURS'
  | 'DAYS'
  | 'WEEKS'
  | 'MONTHS'

export type AutomationExecutionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'CANCELLED'
```

- **Seguridad WhatsApp Config**: El token real de Meta Cloud API nunca se devuelve completo al cliente; se expone `accessTokenMasked` y solo se reemplaza enviando un nuevo valor desde un campo de texto seguro (`secureTextEntry` / `type="password"`).

---

## 4. Roles, Organizaciones y Feature Flags

- **Backend**: [`organization.entity.ts`](../../../../nestjs-auth/src/organizations/entities/organization.entity.ts), [`organization-member.entity.ts`](../../../../nestjs-auth/src/organizations/entities/organization-member.entity.ts), [`user.entity.ts`](../../../../nestjs-auth/src/users/entities/user.entity.ts)
- **Web**: [`frontend/src/types/auth.ts`](../../../../frontend/src/types/auth.ts)
- **Mobile**: [`app-schedule/src/auth/types.ts`](../../../../app-schedule/src/auth/types.ts)

```ts
export type UserRole = 'USER' | 'ADMIN' // ADMIN = SuperAdmin de Backoffice

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'STAFF'

export type OrganizationFeature =
  | 'APPOINTMENTS'
  | 'CUSTOMERS'
  | 'SERVICES'
  | 'RESOURCES'
  | 'ANALYTICS'
  | 'AUTOMATIONS'
  | 'IMPORTS'
```


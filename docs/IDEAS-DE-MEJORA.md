# Propuesta de Mejoras y Evolución del Producto (`appCopada`)

Este documento presenta una hoja de ruta técnica y funcional para evolucionar la plataforma SaaS multi-tenant, tomando como base la arquitectura actual en **Next.js (App Router)** y **NestJS 11 + TypeORM + PostgreSQL**.

Las propuestas están diseñadas para maximizar la **conversión de reservas**, **reducir las pérdidas económicas por ausencias (`NO_SHOW`) y cancelaciones (`CANCELLED`)**, y **transformar las métricas del negocio en decisiones automatizadas**.

---

## Pilares Estratégicos Prioritarios

### 1. Turnero Público de Autogestión para el Cliente Final (Self-Service Booking)

Actualmente, aunque la entidad `Appointment` ya contempla el origen `AppointmentSource.CUSTOMER` en la base de datos, la carga de turnos se realiza de forma interna (`ADMIN`). Habilitar un portal público por organización permitirá que el negocio reciba reservas 24/7 sin intervención manual.

#### Funcionalidades Clave
- **URL Pública por Negocio (`Slug` Personalizado)**:
  - Agregar el campo `slug` único en `Organization` (ej. `appcopada.com/reservar/barberia-central` o subdominio).
  - Configuración estética básica por organización: logo, color de acento, descripción corta, dirección con link a Google Maps y políticas de cancelación.
- **Asistente de Reserva Paso a Paso (Mobile-First)**:
  1. **Selección de Servicio**: Muestra los `Service` activos con su duración y precio (ocultando servicios de uso exclusivamente interno si el negocio así lo configura).
  2. **Selección de Recurso / Profesional**: Filtra los `Resource` vinculados mediante `ResourceService`. Incluye la opción **"Cualquier profesional / cancha disponible"** para maximizar la ocupación.
  3. **Grilla de Disponibilidad en Tiempo Real**: Consume el motor dinámico de `AvailabilityService` (que cruza `AvailabilityRule` - `AvailabilityBlock` - `Appointment`), respetando la zona horaria (`timezone`) de la organización y los buffers (`bufferBeforeMinutes` / `bufferAfterMinutes`).
  4. **Identificación Rápida del Cliente y Validación Anti-Spam**:
     - El cliente ingresa su teléfono (normalizado con `phone-normalizer.ts`), nombre y email.
     - Si el teléfono ya existe en `Customer` para esa `Organization`, se asocia automáticamente a su ficha histórica (aplicando incluso overrides de duración/precio si los tuviera).
     - Verificación opcional mediante **código OTP por WhatsApp** (usando `WhatsappCloudService`) para evitar reservas falsas.
- **Autogestión Post-Reserva (Cancelación y Reprogramación)**:
  - Cada turno genera un `publicManageToken` (hash seguro o JWT de propósito específico) enviado en el mensaje de confirmación (`APPOINTMENT_CREATED`).
  - Desde `/reservar/[slug]/turno/[token]`, el cliente puede **confirmar asistencia**, **reprogramar** o **cancelar** su turno siempre que esté dentro de la ventana permitida por el comercio (ej. hasta 12 horas antes).

#### Impacto Técnico en la Arquitectura
- **Backend (`nestjs-auth`)**:
  - Nuevos endpoints públicos decorados con `@Public()` y protegidos con `ThrottlerGuard` estricto por IP/teléfono:
    - `GET /public/organizations/:slug` (catálogo público de servicios y recursos).
    - `GET /public/organizations/:slug/availability` (horarios libres).
    - `POST /public/organizations/:slug/appointments` (crea el turno con `source = AppointmentSource.CUSTOMER`, apoyándose en el índice PostgreSQL `EXCLUDE USING gist` `no_overlapping_appointments` para garantizar cero doble reserva en alta concurrencia).
- **Frontend (`frontend`)**:
  - Nueva ruta en `frontend/app/(public)/reservar/[slug]/page.tsx` desacoplada del layout administrativo privado.

---

### 2. Gestión de Pagos y Señas con Mercado Pago dentro de la App

En el dashboard actual (`DashboardView`), la alerta `LossAlert` evidencia cuánto dinero pierde el negocio por cancelaciones y ausencias (`lostByCancellation` y `lostByNoShow`). Integrar **Mercado Pago** resuelve directamente este dolor del negocio y, además, habilita la monetización del propio SaaS.

#### A. Cobro de Turnos y Señas para los Negocios (Flujo B2B2C)
- **Vinculación de Cuenta vía Mercado Pago OAuth**:
  - Cada `Organization` puede conectar su propia cuenta de Mercado Pago desde `/settings` mediante OAuth 2.0 (almacenando `mpAccessToken`, `mpRefreshToken`, `mpUserId` cifrados en una entidad `OrganizationPaymentConfig`).
  - Soporta opcionalmente **Split de Pagos (Marketplace)** si la plataforma desea cobrar una comisión por transacción procesada.
- **Modalidades de Cobro Configurables por Servicio (`Service`)**:
  - **Sin pago online**: Reserva tradicional.
  - **Seña obligatoria (Fija o Porcentual)**: Ej. abonar el 30% o `$5.000 ARS` para confirmar el turno.
  - **Pago total anticipado**: Abonar el 100% del `price` efectivo del turno.
  - **Descuento por pago online**: Incentivo opcional (ej. 5% off abonando al reservar).
- **Ciclo de Vida del Turno con Pago (`Appointment` + `Payment`)**:
  1. Al reservar desde el turnero público (o al enviarse un link de pago desde administración), el turno se crea con estado `PENDING` y un tiempo de expiración de reserva temporal (`paymentExpiresAt = now + 15 min`).
  2. Se genera una **Preferencia de Pago (Checkout Pro)** o **Checkout Bricks / QR Dinámico** en Mercado Pago con `external_reference = appointment.id` y `notification_url` apuntando al backend.
  3. **Webhook de Mercado Pago (`POST /payments/webhooks/mercadopago`)**:
     - Verifica la firma criptográfica (`x-signature` HMAC SHA-256) de Mercado Pago.
     - Al aprobarse el pago (`approved`), registra la transacción en la tabla `payments`, actualiza el turno a `CONFIRMED` y dispara la automatización de WhatsApp con el comprobante.
     - Si vence el plazo sin pago, un job libera el turno (`CANCELLED` con motivo `PAYMENT_EXPIRED`) para no bloquear la agenda del profesional.
- **Política de Retención o Devolución Automática**:
  - Si el cliente cancela con la anticipación requerida, se puede ejecutar un reembolso parcial/total vía API de Mercado Pago o dejar el saldo a favor como crédito en su ficha de `Customer`.
  - Si el cliente incurre en `NO_SHOW` o cancela sobre la hora, la seña queda retenida y se contabiliza como ingreso recuperado en `AnalyticsService`.

#### B. Cobro de Suscripciones del SaaS (Flujo B2B)
- Integración con **Mercado Pago Suscripciones (`Preapproval`)** en `/account` o `/settings/billing` para gestionar planes mensuales de las organizaciones (Plan Inicial, Plan Pro con WhatsApp + IA, Plan Multi-Sede) con débito automático.

#### Impacto en el Modelo de Datos
- Nueva entidad `Payment`:
  - `id`, `organizationId`, `appointmentId`, `customerId`, `provider` (`MERCADOPAGO`, `CASH`, `TRANSFER`), `externalPaymentId`, `preferenceId`, `amount`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `REFUNDED`), `paymentType` (`DEPOSIT`, `FULL`, `BALANCE`), `paidAt`.
- Nuevos campos en `Service`:
  - `requiresDeposit` (`boolean`), `depositType` (`PERCENTAGE` | `FIXED`), `depositValue` (`numeric`).

---

### 3. Agente de IA Asesor de Salud del Emprendimiento (AI Business Copilot)

El módulo actual de `AnalyticsService` (`GET /analytics/overview`) y la vista `DashboardView` ya calculan indicadores clave: `completionRate`, `cancellationRate`, `noShowRate`, `expectedRevenue`, `realizedRevenue`, `lostByCancellation`, `lostByNoShow`, `averageTicket`, clientes nuevos vs. recurrentes, evolución diaria (`daily`) y rankings de servicios y recursos.

El siguiente paso es incorporar un **Agente de Inteligencia Artificial** que interprete este contexto numérico y operativo para entregar diagnósticos claros y **acciones ejecutables en un clic**.

#### Cómo Funciona el Agente
1. **Recolección de Contexto Enriquecido (`AnalyticsInsightsService`)**:
   - Toma el JSON de `AnalyticsService.getOverview(userId, range)` y lo compara automáticamente con el **período inmediato anterior** (ej. últimos 30 días vs. los 30 días previos) para detectar tendencias (crecimiento o caída).
   - Agrega métricas operativas adicionales:
     - Tasa de ocupación real por `Resource` y por día de la semana/franja horaria.
     - Estado de las `AutomationRule` activas (qué servicios tienen recordatorios configurados y cuáles no).
     - Cantidad de clientes "en riesgo de abandono" (clientes frecuentes cuya última visita supera su ciclo habitual).
2. **Motor de Razonamiento (LLM con Structured Outputs + Tool Calling)**:
   - El agente procesa el snapshot de métricas del tenant (estrictamente aislado por `organizationId`) y genera un reporte estructurado dividido en:
     - **Puntaje de Salud Global (0 a 100)** y resumen ejecutivo en lenguaje natural.
     - **Alertas Críticas (Fugas de Dinero)**.
     - **Oportunidades de Crecimiento y Ocupación**.
     - **Acciones Recomendadas (1-Click Actions)**.

#### Ejemplos Concretos de Consejos y Acciones del Agente en la App
- **Reducción de Ausencias (`NO_SHOW`) y Cancelaciones**:
  - *Detección*: *"En los últimos 30 días perdiste $185.000 ARS por ausencias (tasa de No-Show del 14.2%, concentrada los viernes en el servicio 'Corte + Barba'). Actualmente este servicio no tiene recordatorio previo ni seña."*
  - *Acción en 1 clic*: Botón **"Crear recordatorio de WhatsApp 24h antes"** (pre-llena y activa una `AutomationRule` con `APPOINTMENT_UPCOMING`) o **"Activar seña del 30% con Mercado Pago en este servicio"**.
- **Optimización de Ocupación en Días/Horarios Valle**:
  - *Detección*: *"Los martes y miércoles entre las 10:00 y las 14:00 tu ocupación cae al 22%, mientras que los viernes y sábados estás al 95%."*
  - *Acción en 1 clic*: Sugiere lanzar una campaña de reactivación para clientes inactivos ofreciendo prioridad en esos días o ajustar las `AvailabilityRule`.
- **Retención de Clientes y Recurrencia**:
  - *Detección*: *"El 68% de tus turnos fueron de clientes recurrentes, pero tenés 24 clientes frecuentes que no reservan hace más de 45 días (su promedio histórico era cada 28 días)."*
  - *Acción en 1 clic*: Botón **"Activar automatización de seguimiento post-turno (`APPOINTMENT_COMPLETED` + 30 días)"**.
- **Rentabilidad de Servicios y Balanceo de Recursos**:
  - *Detección*: *"El recurso 'Juan' genera el 65% de los ingresos realizados pero tiene una tasa de cancelación alta por sobrecarga, mientras que 'María' tiene 40% de agenda libre y no tiene habilitado el servicio 'Color' en `ResourceService`."*
  - *Acción en 1 clic*: Sugiere revisar precios, buffers de descanso o asignación de servicios.

#### Experiencia de Usuario en `DashboardView` + WhatsApp
- **Panel "Copiloto de Negocio" en `/dashboard`**:
  - Ubicado de forma destacada sobre las tarjetas de métricas o como un panel lateral interactivo.
  - Muestra 3 tarjetas de **Insights Accionables** priorizadas por impacto económico estimado (ej. *"Recuperá hasta ~$120.000/mes aplicando esta mejora"*).
  - **Chat Contextual con el Dashboard**: El dueño puede preguntarle con texto o voz: *"¿Por qué bajó mi facturación esta semana?"*, *"¿Qué servicio me conviene aumentar de precio?"* o *"¿Quiénes son mis 10 mejores clientes del trimestre?"*.
- **Reporte Semanal Ejecutivo por WhatsApp**:
  - Todos los lunes a las 09:00 AM, el agente envía por WhatsApp al `OWNER` un resumen de 1 minuto con los ingresos de la semana cerrada, el dinero perdido por ausencias, la proyección de turnos ya agendados para la semana que inicia y el consejo principal de la semana.

---

## Otras Ideas de Mejora de Alto Impacto

### 4. Completar los Overrides de Precio y Duración por Cliente (`CustomerServiceOverride`)
En `Modelo-de-dominio-del-SaaS.md` está diseñado conceptualmente el mecanismo de **Configuración particular de un servicio por cliente** (donde un cliente específico requiere más o menos tiempo, o tiene una tarifa especial/congelada).
- **Mejora**: Crear la entidad `CustomerServiceOverride` (`organizationId`, `customerId`, `serviceId`, `durationMinutes?`, `price?`) y exponerla en el detalle del cliente (`/customers/[id]`).
- **Beneficio**: Al agendar un turno (tanto desde el panel como desde el turnero público), `AppointmentsService` y `AvailabilityService` calcularán automáticamente el slot y el snapshot de precio con la regla particular del cliente.

### 5. Lista de Espera Inteligente (Recuperación Automática de Cancelaciones)
Cuando un turno se cancela sobre la fecha en un día muy demandado, ese hueco suele convertirse en `lostByCancellation`.
- **Mejora**: Si en el turnero público un cliente busca lugar en un día completo, permitirle anotarse en la **Lista de Espera (`WaitlistEntry`)** indicando día y franja horaria de preferencia.
- **Beneficio**: Apenas un turno pasa a `CANCELLED`, el motor de automatizaciones envía un WhatsApp automático a los primeros de la lista con un link de reserva rápida. El primero que confirma (y abona la seña en Mercado Pago) se queda con el turno, transformando una pérdida en ingreso realizado sin gestión humana.

### 6. Confirmación Interactiva por WhatsApp (Webhooks Entrantes de Meta)
Actualmente `WhatsappCloudService` envía notificaciones salientes (`APPOINTMENT_UPCOMING`, `APPOINTMENT_CREATED`).
- **Mejora**: Utilizar **Interactive Message Templates (Botones de Respuesta Rápida)** de WhatsApp Cloud API en el recordatorio de 24h antes: `[Confirmar Asistencia]` y `[Necesito Reprogramar]`, procesando el webhook entrante de Meta.
- **Beneficio**: Si el cliente presiona *"Confirmar Asistencia"*, el turno cambia automáticamente de `PENDING` a `CONFIRMED` en la agenda del negocio. Si presiona *"Necesito Reprogramar"*, recibe el link del turnero público y libera el horario con anticipación.

### 7. Paquetes de Sesiones, Abonos y Membresías
Muchos verticales objetivo del SaaS (centros de estética, kinesiología, gimnasios, clases de pádel) venden paquetes prepagos (ej. *"Pack 6 sesiones de depilación definitiva"* o *"Pase mensual de 8 clases"*).
- **Mejora**: Crear las entidades `ServicePackage` y `CustomerPackageBalance`. El cliente puede comprar el paquete con Mercado Pago y, cada vez que reserva un turno, el sistema descuenta 1 sesión de su saldo en lugar de cobrarle nuevamente.
- **Beneficio**: Fideliza al cliente final, adelanta flujo de caja para el comercio y adapta la plataforma al 100% para centros de salud, estética y deporte.

### 8. Liquidación de Comisiones para Profesionales y Cierre de Caja
En negocios con varios profesionales (`Resource` de tipo `PERSON` vinculados a usuarios `STAFF`), el dueño necesita saber cuánto pagarle a cada uno a fin de semana o mes.
- **Mejora**: Permitir configurar un porcentaje de comisión por recurso o por par `ResourceService` (ej. 50% en Corte, 40% en Color). Sumar un reporte de **Liquidación y Caja** que cruce los turnos `COMPLETED`, discrimine qué fue cobrado por Mercado Pago vs. efectivo/transferencia en el local y calcule la comisión neta de cada profesional.

### 9. Sincronización con Google Calendar y Vista Móvil (PWA) para `STAFF`
- **Mejora**:
  - Sincronización bidireccional o feed iCal por `Resource` para que cada profesional vea su agenda actualizada en su celular en Google Calendar / Apple Calendar.
  - Convertir el frontend en una **PWA (Progressive Web App)** instalable con notificaciones Web Push cuando un cliente reserva, paga una seña o cancela un turno en el día.

### 10. Ficha Clínica / Historial Técnico y Adjuntos por Cliente
- **Mejora**: Más allá del campo `notes` plano en `Customer` y `Appointment`, permitir adjuntar fotos del antes/después (estética/peluquería), fórmulas aplicadas (ej. tintura utilizada) o evolución por sesión.
- **Beneficio**: Eleva el valor percibido del CRM y genera un costo de cambio altísimo para los negocios que usan la plataforma.

---

## Matriz de Priorización y Hoja de Ruta Sugerida

| Fase | Módulo / Iniciativa | Impacto en el Negocio | Complejidad Técnica | Dependencias Clave |
| :--- | :--- | :---: | :---: | :--- |
| **Fase 1** | **Turnero Público de Autogestión** (`/reservar/[slug]`) | Muy Alto | Media | Motor actual de `AvailabilityService` + `AppointmentsService` |
| **Fase 2** | **Pagos y Señas con Mercado Pago** (Checkout + Webhooks) | Muy Alto | Media / Alta | Turnero Público + Entidad `Payment` + OAuth Mercado Pago |
| **Fase 3** | **Agente IA Asesor en Dashboard** (Insights + Acciones 1-Clic) | Alto (Diferenciador) | Media | `AnalyticsService` + Proveedor LLM (Gemini / OpenAI) |
| **Fase 4** | **WhatsApp Interactivo + Lista de Espera** | Alto | Media | `WhatsappCloudService` + Webhooks entrantes de Meta |
| **Fase 5** | **Overrides por Cliente + Paquetes de Sesiones y Comisiones** | Medio / Alto | Media | `Customer`, `Service`, `Payment` |


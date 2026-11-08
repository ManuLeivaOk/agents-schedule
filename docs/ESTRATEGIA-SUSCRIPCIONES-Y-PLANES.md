# Estrategia de Monetización, Planes de Suscripción y Segmentación Comercial (`Clicke Impulso`)

**Documento de estrategia comercial y de producto para socios**  
**Objetivo:** Definir el modelo de negocio SaaS B2B, la estructura de planes de suscripción, las métricas de cobro (*Value Metrics*), el manejo de costos variables (WhatsApp Cloud API) y la arquitectura técnica para controlar límites por organización.

---

## 1. Resumen Ejecutivo

Para maximizar la rentabilidad y adopción de **Clicke Impulso** (`appCopada`), el esquema de precios no debe basarse únicamente en la cantidad de usuarios que inician sesión, sino en el **tamaño operativo real del comercio** y en el **retorno de inversión (ROI) directo** que la plataforma le genera al evitar ausencias (*No-Shows*) y cancelaciones.

- **Métrica principal de valor (*Value Metric*):** Combinación de **Recursos Activos** (profesionales, consultorios, sillones o canchas), **Cupo de Automatizaciones por WhatsApp** y **Módulos de Recuperación de Ingresos** (Dashboard analítico de pérdidas, señas con Mercado Pago e IA).
- **Esquema de 3 Planes (*Good – Better – Best*):**
  1. **Plan Inicial ($18.000 ARS/mes):** Para profesionales independientes (1 agenda / recurso).
  2. **Plan Impulso ($29.000 ARS/mes - *Plan Ancla*):** Para comercios en crecimiento (hasta 5 agendas / recursos + WhatsApp automatizado + Analítica de pérdidas).
  3. **Plan Escala ($48.000 ARS/mes):** Para centros grandes o complejos (hasta 15 agendas / recursos + alto volumen de WhatsApp + Copiloto IA y herramientas avanzadas).
- **Margen Bruto Objetivo:** Superior al **70%–85%** incluso absorbiendo el costo de mensajería de Meta en los planes con cupo incluido, y cercano al **98%** en esquemas donde el comercio vincula su propia cuenta de facturación en Meta (*BYO-WABA*).

---

## 2. ¿Por qué segmentar por *Recursos* y no solo por *Usuarios*?

En los sistemas de gestión de turnos tradicionales, cobrar exclusivamente por cantidad de usuarios registrados (`OrganizationMember`) genera una distorsión comercial:

> **Ejemplo del problema:** Un centro de estética con 6 gabinetes o un complejo de 5 canchas de pádel suele operar con **1 sola recepcionista** (`OrganizationRole.ADMIN`) que gestiona toda la agenda desde un único usuario. Si cobráramos por usuario, un negocio que factura millones al mes pagaría el plan más básico de 1 usuario.

### Los 3 Ejes de Segmentación de `Clicke Impulso`

1. **Eje Operativo — Recursos Activos (`Resource`):**
   - Cada `PERSON` (barbero, médico, kinesiólogo), `SPACE` (cancha, consultorio, gabinete) o `EQUIPMENT` (máquina de estética) representa una unidad generadora de ingresos para el cliente.
   - Es una métrica transparente, justa y fácil de entender: *a más agendas trabajando en simultáneo, mayor es el plan*.
2. **Eje de Costo Variable — Mensajes de WhatsApp (`OrganizationWhatsAppConfig`):**
   - Dado que la API Oficial de Meta cobra por plantilla entregada (~$0.015 a $0.026 USD, aprox. **$20 a $35 ARS por mensaje**), cada plan debe tener un tope estricto gobernado por el campo `monthlyMessageLimit` que ya existe en nuestra base de datos.
3. **Eje de Valor Financiero — Recuperación de Dinero y Automatización:**
   - El plan básico resuelve el **orden administrativo** (reemplazar el cuaderno o Excel).
   - Los planes superiores resuelven la **fuga de dinero** (recordatorios automáticos por WhatsApp, cobro de señas con Mercado Pago, métricas de `lostByNoShow` / `lostByCancellation` y Copiloto IA).

---

## 3. Matriz Exhaustiva de Planes de Suscripción

Los precios están expresados en **Pesos Argentinos (ARS)** a valores de referencia actuales, diseñados para ser altamente competitivos frente al mercado local (donde un comercio recupera el valor del abono mensual salvando **apenas 2 o 3 turnos en todo el mes**).

| Categoría | Funcionalidad / Límite del Sistema | 🌱 Plan Inicial *(Independientes)* | 🚀 Plan Impulso *(Comercios - Recomendado)* | 👑 Plan Escala *(Centros y Complejos)* |
| :--- | :--- | :---: | :---: | :---: |
| **Precio y Perfil** | **Abono Mensual Sugerido** | **$18.000 ARS / mes** | **$29.000 ARS / mes** | **$48.000 ARS / mes** |
| | **Pago Anual (2 meses bonificados - ~17% OFF)** | $180.000 ARS / año *($15.000/mes)* | $290.000 ARS / año *($24.167/mes)* | $480.000 ARS / año *($40.000/mes)* |
| | **Target / Cliente Ideal** | Profesionales independientes (psicólogos, manicuras, barberos solos) | Barberías, salones, consultorios compartidos, estética (2 a 5 agendas) | Clínicas, centros multidisciplinarios, complejos deportivos (6 a 15 agendas) |
| **Capacidad Operativa** | **Recursos Activos (`Resource`)** | **1 Recurso** | **Hasta 5 Recursos** | **Hasta 15 Recursos** |
| | **Usuarios con acceso (`OrganizationMember`)** | **1 Usuario** (`OWNER`) | **Hasta 6 Usuarios** (`OWNER`, `ADMIN`, `STAFF`) | **Usuarios Ilimitados** |
| | **Turnos mensuales (`Appointment`)** | Hasta **150 turnos / mes** | **Ilimitados** | **Ilimitados** |
| | **Catálogo de Servicios (`Service`)** | Hasta 10 servicios activos | Ilimitados | Ilimitados |
| **Agenda y Disponibilidad** | **Calendario Inteligente Anti-Solapamiento** | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| | **Horarios Semanales (`AvailabilityRule`)** | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| | **Feriados y Bloqueos (`AvailabilityBlock`)** | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| | **Buffers de descanso/limpieza entre turnos** | ❌ No incluido | ✅ `bufferBefore` y `bufferAfter` | ✅ `bufferBefore` y `bufferAfter` |
| | **Asignación específica Recurso ↔ Servicio** | Básica (1 recurso) | ✅ Matriz `ResourceService` completa | ✅ Matriz `ResourceService` completa |
| **CRM y Clientes** | **Base de Clientes (`Customer`)** | Ilimitados | Ilimitados | Ilimitados |
| | **Importación Masiva (CSV / Excel)** | ✅ Hasta 500 contactos por lote | ✅ Ilimitada con detección de duplicados | ✅ Ilimitada + Migración asistida |
| | **Ficha Histórica y Notas de Turnos** | ✅ Básica | ✅ Historial completo de asistencia y pagos | ✅ Historial completo + Adjuntos / Ficha técnica |
| | **Precios y Duración Especial por Cliente** | ❌ No incluido | ❌ No incluido | ✅ `CustomerServiceOverride` |
| **WhatsApp y Automatización** | **Motor de Reglas (`AutomationRule`)** | ❌ Sin envío automático API *(Solo botón de aviso manual por WhatsApp Web)* | ✅ **Confirmación al agendar** + **Recordatorio previo (24h/2h antes)** | ✅ Todas las reglas + **Seguimiento post-turno y Recuperación de inactivos (`FOLLOW_UP`)** |
| | **Cupo Mensual Incluido (`monthlyMessageLimit`)** | **0 mensajes automáticos** *(o Modo Simulación)* | **Hasta 300 mensajes / mes** incluidos | **Hasta 1.000 mensajes / mes** incluidos |
| | **Confirmación Interactiva (Botones WhatsApp)** | ❌ No incluido | ✅ Botón *Confirmar / Reprogramar* | ✅ Botón *Confirmar / Reprogramar* + Lista de espera |
| **Dashboard y Analítica** | **Métricas Operativas (`AnalyticsService`)** | Vista rápida: Turnos del día y total cobrado en el mes | **Dashboard Completo**: Tasas de asistencia, cancelación y *No-Show* | **Dashboard Completo** + Comparativa entre períodos y exportación |
| | **Detector de Fugas de Dinero (`LossAlert`)** | ❌ Bloqueado *(Se muestra con candado para incentivar upgrade)* | ✅ Cálculo exacto de `$ perdido por No-Show` y `$ perdido por Cancelación` | ✅ Cálculo de pérdidas + Desglose por profesional y día |
| | **Ranking de Servicios y Recursos** | ❌ No incluido | ✅ Top Servicios por facturación | ✅ Top Servicios + Rendimiento y ocupación por Recurso |
| **Nuevos Módulos (Hoja de Ruta)** | **Turnero Público Web (`/reservar/[slug]`)** | ✅ Con marca *Clicke Impulso* | ✅ Personalizado (Logo y colores del local) | ✅ Personalizado + Prioridad en Lista de Espera |
| | **Cobro de Señas con Mercado Pago** | ❌ No incluido | ✅ Seña fija o % para confirmar turno | ✅ Señas + Paquetes de sesiones / Abonos + Liquidación de comisiones |
| | **Agente de IA Asesor (Copiloto de Negocio)** | ❌ No incluido | 💡 1 Diagnóstico mensual resumido | ✅ **Copiloto IA Full**: Alertas semanales por WhatsApp, Chat y Acciones en 1 Clic |
| **Soporte** | **Atención y Onboarding** | Centro de ayuda y videos paso a paso | Soporte por WhatsApp en horario comercial | Onboarding 1 a 1 por videollamada + Soporte prioritario |

---

## 4. Gestión Económica del Costo Variable de WhatsApp (Meta Cloud API)

El envío de mensajes por WhatsApp es el **único costo variable real** de la plataforma. Nuestra entidad `OrganizationWhatsAppConfig` ya cuenta con `monthlyMessageLimit` y `currentMonthMessagesSent`, lo que nos permite controlar el margen milimétricamente.

### 4.1. Análisis de Margen Unitario por Plan (con WhatsApp Incluido)

Suponiendo un costo promedio de Meta de **$0.020 USD por mensaje** (~**$28 ARS** por notificación entregada):

| Plan | Precio de Venta | Cupo WhatsApp (`monthlyMessageLimit`) | Costo Máximo de Meta (si usa el 100% del cupo) | Margen Bruto Mínimo para Nosotros | % de Margen Bruto |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **🌱 Plan Inicial** | $18.000 ARS | 0 mensajes API | $0 ARS | **+$18.000 ARS** | **100%** |
| **🚀 Plan Impulso** | $29.000 ARS | 300 mensajes / mes *(~150 turnos con confirmación + recordatorio)* | ~$8.400 ARS *(si consume los 300)* | **+$20.600 ARS** | **~71% a 85%*** |
| **👑 Plan Escala** | $48.000 ARS | 1.000 mensajes / mes *(~500 turnos)* | ~$28.000 ARS *(si consume los 1.000)* | **+$20.000 ARS** | **~58% a 80%*** |

*\*Nota: En la práctica, el consumo promedio de un comercio suele rondar el 65%–75% de su límite mensual, elevando el margen real por encima del 80%.*

### 4.2. ¿Qué pasa cuando un comercio alcanza su límite mensual de mensajes?

Cuando `currentMonthMessagesSent >= monthlyMessageLimit`, el motor de automatizaciones (`AutomationWorkerService`) detiene el envío de nuevos mensajes para proteger nuestra rentabilidad y activa dos opciones comerciales para el cliente:

1. **Compra de Packs de Recarga (*Add-ons* de Mensajería):**
   - **Pack +250 mensajes WhatsApp:** **$9.500 ARS** (Costo Meta ~$7.000 ARS → Ganancia neta +$2.500 ARS).
   - **Pack +500 mensajes WhatsApp:** **$17.500 ARS** (Costo Meta ~$14.000 ARS → Ganancia neta +$3.500 ARS).
2. **Modalidad *BYO-WABA* (Traé tu propia cuenta de Meta Business):**
   - Ideal para clientes del **Plan Escala** que envían más de 1.000 o 2.000 mensajes al mes.
   - El comercio asocia su propia tarjeta en el administrador comercial de Meta y carga sus credenciales en `OrganizationWhatsAppConfig`.
   - En este esquema, destrabamos el límite (`monthlyMessageLimit = 99999`) y **nuestro margen en el Plan Escala ($48.000 ARS) pasa a ser del 100%**, sin riesgo financiero por volumen de envíos.

---

## 5. Catálogo de Complementos (*Add-ons*) para Maximizar el Ticket Promedio (ARPU)

Muchos comercios tienen necesidades puntuales que no justifican saltar al plan superior completo, pero sí están dispuestos a pagar un pequeño adicional mensual. Esto evita perder ventas y aumenta la facturación por cliente:

| Complemento (*Add-on*) | Precio Sugerido | ¿A quién le sirve? |
| :--- | :---: | :--- |
| **Recurso / Agenda Adicional (`+1 Resource`)** | **+$4.500 ARS / mes** | Una barbería en *Plan Impulso* (tope 5 barberos) que suma un 6.º barbero los fines de semana sin necesitar los 1.000 mensajes del *Plan Escala*. |
| **Pack +250 Mensajes de WhatsApp** | **+$9.500 ARS / mes** | Un profesional individual o comercio chico que tiene mucha rotación de turnos cortos y quiere más recordatorios automáticos. |
| **Sucursal / Sede Adicional (`+1 Organization`)** | **20% OFF en la 2.ª sede** | Dueños (`OWNER`) que abren un segundo local y lo administran con la misma cuenta de usuario. |
| **Servicio de Puesta en Marcha "Llave en Mano" (Pago Único)** | **$25.000 ARS (Único)** | Nosotros le limpiamos su Excel de clientes, le importamos toda la base, le configuramos los servicios, horarios y plantillas de WhatsApp listas para usar. |

---

## 6. Psicología de Conversión: Prueba Gratis, *Upselling* dentro de la App y Retención

### 6.1. Estrategia de Prueba Gratis (14 días en "Modo Impacto")
En lugar de ofrecer un plan gratuito permanente (*Freemium*) que consuma recursos del servidor sin generar ingresos, recomendamos un **Trial de 14 días sin tarjeta de crédito** con acceso a la experiencia del **Plan Impulso**:
- Durante los 14 días, la cuenta tiene activado el dashboard completo y el `simulationMode = true` en WhatsApp (o un bono de bienvenida de **30 mensajes reales bonificados** para que el dueño vea llegar el WhatsApp a su propio teléfono).
- **El gatillo psicológico al día 14:** Tras dos semanas de uso real, el componente `LossAlert` en el Dashboard le mostrará con números reales de su propio negocio: *"En los últimos 14 días tuviste 6 ausencias que representaron $72.000 ARS perdidos"*. En ese momento, suscribirse al **Plan Impulso ($29.000 ARS)** es una decisión obvia porque cuesta menos de la mitad de lo que ya perdió.

### 6.2. *Product-Led Upselling* (Cómo el Plan Inicial vende al Plan Impulso solo)
Para que los clientes del **Plan Inicial ($18.000)** quieran subir al **Plan Impulso ($29.000)** sin que tengamos que llamarlos por teléfono:
- En la vista del Dashboard (`DashboardView`) de un usuario de Plan Inicial, la tarjeta de **Dinero perdido por Ausencias y Cancelaciones** no se oculta: se muestra difuminada (*blur*) con la leyenda: *"Tuviste X turnos no completados este mes. Desbloqueá el Plan Impulso para ver cuánto dinero representan y recuperarlos automáticamente por WhatsApp"*.
- Al intentar crear un 2.º recurso en `/resources`, aparece un modal limpio indicando el límite del plan actual con el botón directo para actualizar al Plan Impulso.

### 6.3. Descuento Anual para Financiar Crecimiento (*Cashflow* Positivo)
- Ofrecer **2 meses gratis** a quienes abonen el año completo por adelantado (pagan 10 meses, usan 12).
- **Impacto directo en nuestros costos ([`ESTIMACION-COSTOS-DESPLIEGUE.md`](./ESTIMACION-COSTOS-DESPLIEGUE.md)):** Un solo comercio que contrate el **Plan Impulso Anual ($290.000 ARS)** paga al contado los **2 años completos del servidor VPS en DonWeb ($220.000 ARS)** y deja **$70.000 ARS de superávit inmediato** desde el primer día.

---

## 7. Diseño Técnico para Implementar los Planes en el Código

Nuestra arquitectura en **NestJS + TypeORM + PostgreSQL** ya está separada por `organizationId` (multi-tenant). Para aplicar estos límites en el sistema de forma limpia y escalable, este es el esquema técnico recomendado:

### 7.1. Evolución de la Entidad `Organization` (o tabla `organization_subscriptions`)

Agregar en la entidad `Organization` (`nestjs-auth/src/organizations/entities/organization.entity.ts`) las columnas de control de suscripción y *entitlements* (límites efectivos):

```typescript
export enum SubscriptionPlan {
  STARTER = 'STARTER', // Plan Inicial
  PRO = 'PRO',         // Plan Impulso
  SCALE = 'SCALE',     // Plan Escala
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',   // En prueba gratis (14 días)
  ACTIVE = 'ACTIVE',       // Suscripción al día
  PAST_DUE = 'PAST_DUE',   // Pago pendiente (período de gracia de 5 días)
  CANCELED = 'CANCELED',   // Suscripción cancelada / Modo solo lectura
}
```

| Campo en Base de Datos | Tipo | Valor en `STARTER` | Valor en `PRO` | Valor en `SCALE` | Propósito en el Backend |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `plan` | `enum` | `'STARTER'` | `'PRO'` | `'SCALE'` | Identifica el plan contratado. |
| `subscriptionStatus` | `enum` | `'ACTIVE'` | `'TRIALING'` / `'ACTIVE'` | `'ACTIVE'` | Controla si la organización puede operar o está vencida. |
| `trialEndsAt` | `timestamptz` | `null` | `now() + 14 days` | `null` | Fecha de corte del período de prueba gratuito. |
| `maxResources` | `int` | `1` | `5` | `15` | Límite validado en `ResourcesService.create()` *(permite sumar +1 si compra Add-on)*. |
| `maxMembers` | `int` | `1` | `6` | `999` | Límite validado al agregar usuarios en `OrganizationMember`. |
| `maxMonthlyAppointments` | `int` | `150` | `999999` | `999999` | Límite validado en `AppointmentsService.create()`. |
| `automationsEnabled` | `boolean` | `false` | `true` | `true` | Habilita o bloquea el disparo de `AutomationRule` en el worker. |
| `advancedAnalyticsEnabled`| `boolean` | `false` | `true` | `true` | Define si `AnalyticsService` devuelve el desglose completo o el resumen básico. |

### 7.2. Puntos de Control (*Enforcement*) en el Backend (`nestjs-auth`)

1. **Creación de Recursos (`ResourcesService`):**
   - Antes de insertar o activar un `Resource` (`active = true`), contar cuántos recursos activos tiene la organización (`count({ where: { organizationId, active: true } })`). Si `count >= organization.maxResources`, lanzar `ForbiddenException('Alcanzaste el límite de recursos de tu plan actual.')`.
2. **Motor de Automatizaciones (`AutomationsService` + `OrganizationWhatsAppConfig`):**
   - Al cambiar de plan (ej. de `STARTER` a `PRO`), actualizar automáticamente `monthlyMessageLimit = 300` y `enabled = true` en `organization_whatsapp_configs`.
3. **Vencimiento de Suscripción (Degradación Amigable):**
   - Si `subscriptionStatus === 'CANCELED'` o vence `trialEndsAt` sin pago, **nunca borrar los datos del comercio**. El sistema pasa a **Modo Solo Lectura**: el dueño puede entrar, ver su agenda y descargar sus clientes, pero no puede cargar nuevos turnos hasta activar un plan con Mercado Pago Suscripciones (`Preapproval`).

---

## 8. Proyección de Facturación Combinada (Escenarios con Mix de Planes)

A diferencia de una estimación plana con un único precio, así rinde la cartera de clientes cuando aplicamos la segmentación de 3 planes (asumiendo un mix realista donde el **25%** elige *Plan Inicial*, el **60%** elige *Plan Impulso* y el **15%** elige *Plan Escala*):

- **Ticket Promedio Ponderado (ARPU):** **~$29.100 ARS / mes por comercio**.

| Etapa de Crecimiento | Total Comercios | Mix de Planes (`Inicial` / `Impulso` / `Escala`) | Facturación Bruta Mensual | Costo Estimado Meta WhatsApp (70% uso cupo) | Costo VPS DonWeb | **Ganancia Neta Mensual (Margen Limpio)** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Lanzamiento** | **5 clientes** | 1 / 3 / 1 | **$153.000 ARS** | ~$28.000 ARS | ~$9.167 ARS | **+$115.833 ARS / mes** |
| **2. Tracción Inicial** | **20 clientes** | 5 / 12 / 3 | **$582.000 ARS** | ~$112.000 ARS | ~$9.167 ARS | **+$460.833 ARS / mes** |
| **3. Consolidación** | **50 clientes** | 12 / 30 / 8 | **$1.470.000 ARS** | ~$288.000 ARS | ~$9.167 ARS | **+$1.172.833 ARS / mes** |
| **4. Escala (Mismo VPS)** | **100 clientes** | 25 / 60 / 15 | **$2.910.000 ARS** | ~$567.000 ARS | ~$9.167 ARS | **+$2.333.833 ARS / mes** |

---

## 9. Hoja de Ruta Comercial Recomendada para Salir al Mercado

1. **Oferta "Clientes Fundadores" (Primeros 10 a 15 comercios):**
   - Ofrecer el **Plan Impulso ($29.000 ARS)** a un precio promocional de lanzamiento de **$19.900 ARS/mes congelado por los primeros 3 meses** (o bonificarles la carga inicial de su base de datos de clientes y servicios) a cambio de feedback directo y casos de éxito reales (testimonios en video/Instagram).
2. **Venta Consultiva Apoyada en el Simulador de Pérdidas:**
   - Al visitar o reunirnos con una barbería, centro de estética o consultorio, hacer una sola pregunta: *"¿Cuántos turnos por semana te cancelan sobre la hora o directamente no vienen?"*.
   - Si responden *"3 o 4 por semana"* y su turno promedio vale $12.000 ARS, están perdiendo **~$160.000 a $200.000 ARS por mes**. Mostrarles en vivo el Dashboard de **Clicke Impulso** con la alerta de pérdidas y el recordatorio automático por WhatsApp cierra la suscripción de **$29.000 ARS/mes** de forma inmediata.

---

## 10. Modelo Alternativo / Híbrido: Pago Inicial Único (*Setup / Licencia*) + Abono Mínimo de Sostenimiento

En el mercado pyme argentino, muchos dueños de comercios tienen **"fatiga de suscripciones"** (prefieren hacer un desembolso fuerte una sola vez cuando tienen efectivo disponible y luego pagar una cuota mínima de mantenimiento mensual casi imperceptible).

Este modelo híbrido no solo es muy fácil de vender puerta a puerta o por recomendación, sino que **financia todo el proyecto en la primera semana**.

### 10.1. ¿Cómo funciona la estructura "Puesta en Marcha + Sostenimiento"?

En lugar de cobrar una suscripción alta todos los meses, dividimos el cobro en **2 componentes**:

1. **Pago Inicial Único (*Derecho de Activación + Puesta en Marcha Llave en Mano*):**
   - Cubre el alta de la organización, configuración personalizada de horarios (`AvailabilityRule`), carga de catálogo de servicios (`Service`), importación de su base histórica de clientes (`Customer` vía CSV) y capacitación de uso.
2. **Abono Mínimo Mensual de Sostenimiento (*Hosting, Backups y Soporte*):**
   - Comienza a correr **a partir del Mes 2** (el primer mes está bonificado dentro del pago inicial).
   - Es un monto fijo muy bajo para cubrir el servidor, las copias de seguridad diarias y el mantenimiento evolutivo.
   - **Regla de Oro para WhatsApp en este esquema:** Como el abono mensual es mínimo, **el costo de los mensajes de Meta no se regala dentro del abono base**, sino que se maneja por **Packs de Recarga prepagos** o vinculando la propia tarjeta del comercio en Meta (*BYO-WABA*). Así tu margen en el abono de sostenimiento es siempre cercano al **100%**.

### 10.2. Tabla de Precios del Esquema "Pago Inicial + Sostenimiento Mensual"

| Nivel / Tamaño del Comercio | 💰 Pago Inicial Único *(Activación + Setup Llave en Mano)* | 🔄 Abono Mínimo de Sostenimiento *(Desde el Mes 2)* | 📱 ¿Cómo se cobran los mensajes de WhatsApp? |
| :--- | :---: | :---: | :--- |
| **🌱 Nivel 1: Independiente** *(1 Recurso / 1 Usuario)* | **$65.000 ARS** *(o 3 cuotas de $25.000)* | **$8.500 ARS / mes** | Opcional: Pack recarga de 150 msj (+$5.500/mes) o aviso manual sin costo. |
| **🚀 Nivel 2: Comercio** *(Hasta 5 Recursos / 6 Usuarios)* | **$110.000 ARS** *(o 3 cuotas de $42.000)* | **$14.500 ARS / mes** | Incluye **100 msj/mes de cortesía** (costo Meta ~$2.800 ARS) + Packs de recarga o tarjeta propia en Meta. |
| **👑 Nivel 3: Centro / Complejo** *(Hasta 15 Recursos / Usuarios Ilim.)* | **$180.000 ARS** *(o 3 cuotas de $68.000)* | **$22.000 ARS / mes** | Conexión directa de su cuenta de Meta (*BYO-WABA*, costo $0 para nosotros) o Pack Mayorista. |

---

### 10.3. Ventajas Estratégicas de este Modelo para los Socios

1. **Recupero inmediato de la inversión del VPS (Con 1 solo cliente):**
   - Mirá el dato clave: el servidor de DonWeb cuesta **$110.000 ARS por todo un año** ([`ESTIMACION-COSTOS-DESPLIEGUE.md`](./ESTIMACION-COSTOS-DESPLIEGUE.md)).
   - Cerrando **1 solo comercio en Nivel 2 ($110.000 ARS de pago inicial)**, el mismo día 1 recuperás el **100% del servidor de todo el año**. A partir del cliente #2, todo pago inicial es ganancia líquida para repartir entre los socios o invertir en publicidad.
2. **Tasa de Cancelación (*Churn*) casi nula (~0%):**
   - En un SaaS tradicional sin costo de entrada, si un cliente un mes está flojo de ventas, se da de baja porque "entrar y salir es gratis".
   - Cuando un comercio ya invirtió **$110.000 ARS** en dejar su sistema configurado y además el mantenimiento mensual le cuesta apenas **$14.500 ARS** (lo que vale **1 solo corte de pelo o 1 sesión** en todo el mes), **nunca da de baja el servicio**.
3. **Barrera total contra "curiosos":**
   - Te asegurás de dedicar tiempo de soporte y configuración únicamente a negocios comprometidos que valoran la herramienta.

---

### 10.4. Comparativa de Flujo de Caja (Año 1): ¿Suscripción Pura vs. Pago Inicial + Sostenimiento?

Supongamos que durante el primer año sumamos **30 comercios en total** (promedio Nivel 2):

| Indicador Financiero (Con 30 clientes) | Modelo A: Suscripción Mensual Pura *($29.000/mes, $0 entrada)* | Modelo B: Pago Inicial + Sostenimiento *($110.000 entrada + $14.500/mes)* |
| :--- | :---: | :---: |
| **Caja generada el Día 1 al cerrar los 30 clientes** | $870.000 ARS *(primer mes)* | **$3.300.000 ARS** *(liquidez inmediata por activaciones)* |
| **Ingreso Recurrente Mensual Fijo (MRR en mes 12)** | **$870.000 ARS / mes** *(menos ~$180k de WhatsApp = ~$690k limpios)* | **$435.000 ARS / mes** *(casi 100% limpios porque WhatsApp va por recarga aparte)* |
| **Facturación Total Acumulada en 12 Meses** | ~$6.200.000 ARS *(incorporando 2.5 clientes/mes)* | **~$5.890.000 ARS** *(pero con la mayor parte del dinero cobrada al principio)* |
| **Riesgo de que el cliente abandone a los 3 meses** | Medio (no tuvo costo de entrada) | **Muy Bajo** (ya pagó la instalación y el mes es muy barato) |

---

### 10.5. La Jugada Maestra: Ofrecer AMBAS Opciones en la Propuesta Comercial

No hace falta elegir uno y descartar el otro. En la reunión de venta con el comercio, podés presentar **las dos modalidades para el mismo Plan Impulso** y dejar que el dueño elija según su bolsillo:

> - **Opción 1 — Suscripción Todo Incluido ($0 costo de instalación):**  
>   Abonás **$29.000 ARS / mes** con 300 recordatorios de WhatsApp incluidos cada mes y sin permanencia mínima.
> - **Opción 2 — Plan Socio / Puesta en Marcha + Mantenimiento Mínimo:**  
>   Abonás por única vez **$110.000 ARS** (incluye migración completa de tus clientes, configuración llave en mano y el primer mes gratis) y luego solo pagás un mantenimiento mínimo de **$14.500 ARS / mes** (50% menos todos los meses para siempre).

**¿Qué logra esto psicológicamente?**
- El cliente deja de preguntarse *"¿Contrato o no contrato el sistema?"* y pasa a preguntarse *"¿Me conviene pagar los $29.000 por mes o pagar los $110.000 ahora y que me quede en $14.500?"*.
- Si tiene liquidez hoy, elige la **Opción 2** y te inyecta caja fuerte de inmediato. Si prefiere no desembolsar de entrada, elige la **Opción 1** y te deja un ingreso recurrente alto todos los meses.



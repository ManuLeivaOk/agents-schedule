# Modelo Comercial de Pago Inicial + Abono Mínimo de Sostenimiento (`Clicke Impulso`)

**Documento de estrategia comercial y financiera para socios**  
**Objetivo:** Estructurar una alternativa (o complemento) al modelo SaaS tradicional, basada en un **Pago Único de Activación y Puesta en Marcha ("Llave en Mano")** seguido de un **Abono Mensual Mínimo de Mantenimiento**, optimizando la liquidez inmediata del proyecto y reduciendo la tasa de cancelación (*Churn*) a casi cero.

---

## 1. Resumen Ejecutivo: ¿Por qué funciona este modelo?

En el mercado de comercios y profesionales en Argentina (barberías, centros de estética, consultorios, complejos deportivos), muchos dueños experimentan **"fatiga de suscripciones"**: rechazan sumar un gasto fijo mensual alto, pero están dispuestos a realizar una **inversión inicial única** para que les entreguen el sistema 100% configurado y luego abonar un mantenimiento mensual mínimo (equivalente a lo que cobran por 1 solo turno al mes).

- **Liquidez Inmediata (Día 1):** Con **1 solo cliente de Nivel Comercio ($110.000 ARS de pago inicial)** se recupera en el acto el **100% del costo anual del servidor VPS en DonWeb ($110.000 ARS/año)** detallado en [`ESTIMACION-COSTOS-DESPLIEGUE.md`](./ESTIMACION-COSTOS-DESPLIEGUE.md).
- **Retención Casi Total (*Churn* ~0%):** Quien ya invirtió en la puesta en marcha de su negocio y solo paga un mantenimiento mínimo de **$8.500 a $14.500 ARS/mes** no da de baja el servicio ni siquiera en meses de menor actividad.
- **Protección Total contra Costos Variables (WhatsApp):** Al cobrar un mantenimiento mensual reducido, el consumo de mensajes de la API Oficial de Meta se independiza mediante **Packs de Recarga Prepagos** o conectando la tarjeta propia del comercio (*BYO-WABA*). Así, el abono mensual de sostenimiento tiene un **margen neto cercano al 100%**.

---

## 2. Anatomía del Modelo en 3 Pilares

Para que el cliente perciba un valor altísimo tanto al entrar como mes a mes, el servicio se divide en tres componentes claros:

### Pilar 1: Pago Inicial Único ("Activación + Puesta en Marcha Llave en Mano")
El cliente no siente que paga un "impuesto por entrar", sino un **servicio profesional de implementación** que le ahorra horas de trabajo:
1. **Creación y Configuración de la Organización (`Organization`):** Parametrización de zona horaria, moneda y políticas del negocio.
2. **Armado de Agendas y Recursos (`Resource` + `AvailabilityRule`):** Carga de sus profesionales, sillones, consultorios o canchas, con sus horarios semanales, descansos y buffers entre turnos.
3. **Carga del Catálogo de Servicios (`Service` + `ResourceService`):** Configuración de precios, duraciones y qué profesional realiza cada servicio.
4. **Migración Histórica de Clientes (`ImportsModule`):** El comercio nos entrega su Excel, agenda de contactos o exportación de su sistema anterior, y nosotros lo normalizamos e importamos en `Customer`.
5. **Capacitación + Primer Mes Bonificado:** Videollamada de 30 minutos con el dueño/recepcionista y **los primeros 30 días de mantenimiento bonificados**.

### Pilar 2: Abono Mínimo Mensual de Sostenimiento (Desde el Mes 2)
Una cuota fija y accesible que cubre:
- **Alojamiento en la Nube 24/7 (Cloud Hosting) y Certificados SSL.**
- **Copias de Seguridad Diarias Automatizadas (Backups de Base de Datos).**
- **Actualizaciones continuas de producto y seguridad.**
- **Soporte técnico por WhatsApp ante dudas operativas.**

### Pilar 3: Mensajería de WhatsApp a Demanda (Recargas o Cuenta Propia)
Como cada notificación automática de WhatsApp tiene un costo real en Meta (~$20 a $35 ARS por mensaje), **no se subsidian cientos de mensajes gratis dentro del abono mínimo**, sino que se ofrecen dos caminos transparentes:
- **Camino A (Packs de Recarga Prepagos):** El comercio compra paquetes de mensajes (ej. 150, 300 o 500 envíos) que se acreditan en `monthlyMessageLimit` dentro de `OrganizationWhatsAppConfig`.
- **Camino B (Cuenta Propia en Meta - *BYO-WABA*):** Conectamos la cuenta de Meta Business del propio comercio con su tarjeta, y Meta le debita directamente los pocos dólares que consuma al mes (costo **$0 ARS** para nosotros).

---

## 3. Matriz Exhaustiva de Planes (Pago Inicial + Sostenimiento)

| Categoría | Característica / Límite | 🌱 Nivel 1: Independiente | 🚀 Nivel 2: Comercio *(El más vendido)* | 👑 Nivel 3: Centro / Complejo |
| :--- | :--- | :---: | :---: | :---: |
| **Inversión de Entrada** | **Pago Inicial Único (Setup + Licenciamiento)** | **$65.000 ARS** | **$110.000 ARS** | **$180.000 ARS** |
| | **Opción Financiada (3 cuotas mensuales)** | 3 cuotas de $25.000 ARS | 3 cuotas de $42.000 ARS | 3 cuotas de $68.000 ARS |
| | **Primer Mes de Sostenimiento** | **Bonificado ($0)** | **Bonificado ($0)** | **Bonificado ($0)** |
| **Costo Mensual** | **Abono Mínimo de Sostenimiento (desde Mes 2)** | **$8.500 ARS / mes** | **$14.500 ARS / mes** | **$22.000 ARS / mes** |
| | **Equivalencia real para el comercio** | *Menos de 1 turno al mes* | *~1 turno promedio al mes* | *~1.5 turnos al mes* |
| **Capacidad Operativa** | **Recursos Activos (`Resource`)** | **1 Recurso** (agenda única) | **Hasta 5 Recursos** | **Hasta 15 Recursos** |
| | **Usuarios con acceso (`OrganizationMember`)** | **1 Usuario** (`OWNER`) | **Hasta 6 Usuarios** (`OWNER`, `ADMIN`, `STAFF`) | **Usuarios Ilimitados** |
| | **Turnos mensuales (`Appointment`)** | Hasta **200 turnos / mes** | **Ilimitados** | **Ilimitados** |
| | **Clientes registrados (`Customer`)** | Ilimitados | Ilimitados | Ilimitados |
| **Implementación Incluida** | **Carga inicial de Servicios y Horarios** | Autoguiada + Revisión nuestra | ✅ **100% hecha por nosotros** | ✅ **100% hecha por nosotros** |
| | **Migración de Base de Clientes (CSV/Excel)** | Hasta 300 contactos | ✅ Hasta 2.500 contactos | ✅ Ilimitada + Limpieza de datos |
| | **Capacitación al Equipo** | Videos paso a paso | ✅ 1 sesión en vivo (30 min) | ✅ 2 sesiones en vivo (Dueño + Staff) |
| **WhatsApp y Automatización** | **Motor de Reglas (`AutomationRule`)** | ✅ Habilitado | ✅ Habilitado (Confirmación + Recordatorios) | ✅ Habilitado Full (+ Seguimiento post-turno) |
| | **Mensajes de Cortesía en el Mes 1** | **50 mensajes reales** de regalo para probar | **150 mensajes reales** de regalo en el Mes 1 | **300 mensajes reales** de regalo en el Mes 1 |
| | **Cupo Mensual Base (desde Mes 2)** | Sin cupo API incluido *(recarga opcional)* | **100 mensajes/mes incluidos** *(o BYO-WABA ilimitado)* | **BYO-WABA Ilimitado** *(o 200 msj/mes incluidos)* |
| **Dashboard y Analítica** | **Métricas y Detector de Pérdidas (`LossAlert`)** | Resumen mensual + Alertas básicas | ✅ **Dashboard Completo** (`lostByNoShow`, `lostByCancellation`, Top Servicios) | ✅ **Dashboard Completo** + Rendimiento por Recurso |
| **Evolución y Mejoras** | **Acceso a Nuevos Módulos ([`IDEAS-DE-MEJORA.md`](./IDEAS-DE-MEJORA.md))** | Turnero público estándar | + Integración Mercado Pago Señas (al activarse) | + Mercado Pago Señas + Copiloto IA + Comisiones |

---

## 4. Esquema de Recargas (*Packs*) y Extras en este Modelo

Como el abono mensual de sostenimiento es bajo ($8.500 a $22.000 ARS), los **Packs de WhatsApp** y las **Ampliaciones** funcionan como una fuente adicional de ingresos recurrentes con margen garantizado:

### 4.1. Packs de Recarga de WhatsApp (Para quienes no usan cuenta propia de Meta)

Tomando un costo real de Meta de **~$28 ARS por mensaje entregado** ($0.020 USD):

| Pack de Mensajes | Precio de Venta al Comercio | Costo Real en Meta API | Ganancia Neta para Nosotros | ¿Para cuántos turnos alcanza? *(Confirmación + Recordatorio 24h)* |
| :--- | :---: | :---: | :---: | :---: |
| **Pack Básico (+150 mensajes)** | **$6.500 ARS** | ~$4.200 ARS | **+$2.300 ARS** | ~75 turnos completos |
| **Pack Comercio (+300 mensajes)** | **$12.000 ARS** | ~$8.400 ARS | **+$3.600 ARS** | ~150 turnos completos |
| **Pack Intensivo (+600 mensajes)** | **$22.000 ARS** | ~$16.800 ARS | **+$5.200 ARS** | ~300 turnos completos |

### 4.2. Ampliaciones de Capacidad (Cuando el negocio crece)

- **Sumar 1 Recurso extra (`+1 Agenda / Profesional`):**
  - **Pago único de configuración:** $15.000 ARS + **Adicional de sostenimiento:** +$2.500 ARS/mes.
- **Upgrade de Nivel 1 (Independiente) a Nivel 2 (Comercio):**
  - El cliente solo abona la **diferencia del pago inicial** ($45.000 ARS) y pasa al abono de sostenimiento de Nivel 2 ($14.500 ARS/mes).

---

## 5. Análisis Financiero y Flujo de Caja para los Socios

La mayor virtud de este esquema es la **velocidad con la que capitaliza a la sociedad** sin depender de esperar 12 meses para ver dinero importante.

### 5.1. Punto de Equilibrio Instantáneo (Cliente #1)

| Concepto | Monto en ARS | Impacto en la Caja de los Socios |
| :--- | :---: | :--- |
| **Costo Anual del Servidor VPS DonWeb (Año 1 completo)** | -$110.000 ARS | Inversión inicial para prender la plataforma 12 meses. |
| **Costo del 1.º Mes de Mantenimiento para el Cliente #1** | $0 ARS | Bonificado por lanzamiento. |
| **Ingreso por 1.º Cliente en Nivel 2 (Pago Inicial)** | **+$110.000 ARS** | **Cubre el 100% del servidor de todo el año en el Día 1.** |
| **Saldo tras el Cliente #1** | **$0 ARS (Deuda Cero)** | Todo cliente a partir del #2 es ganancia neta inmediata. |

*(Incluso si decidimos contratar los **2 años juntos en DonWeb por $220.000 ARS**, con los **primeros 2 clientes** ya quedan pagados los 24 meses de infraestructura).*

### 5.2. Proyección de Ingresos por Etapas (Mix: 30% Nivel 1 / 55% Nivel 2 / 15% Nivel 3)

- **Pago Inicial Promedio Ponderado:** **~$107.000 ARS por nuevo cliente.**
- **Abono Mensual de Sostenimiento Promedio:** **~$13.825 ARS / mes por cliente activo.**

| Escenario Acumulado | Comercios Activos | 💰 Ingresos por Pagos Iniciales *(Caja Fuerte de Entrada)* | 🔄 Ingreso Fijo Mensual por Sostenimiento *(MRR)* | Costo VPS + Mensajes Cortesía | **Margen Neto Mensual Recurrente** *(Sin contar nuevos ingresos iniciales)* |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Etapa 1: Primeros 5 Clientes** | 5 comercios | **+$535.000 ARS** | **$69.125 ARS / mes** | ~$18.000 ARS | **+$51.125 ARS / mes** *(+ los $535k ya cobrados)* |
| **Etapa 2: 15 Clientes** | 15 comercios | **+$1.605.000 ARS** | **$207.375 ARS / mes** | ~$35.000 ARS | **+$172.375 ARS / mes** *(+ $1.6M ya cobrados)* |
| **Etapa 3: 30 Clientes** | 30 comercios | **+$3.210.000 ARS** | **$414.750 ARS / mes** | ~$60.000 ARS | **+$354.750 ARS / mes** *(+ $3.2M ya cobrados)* |
| **Etapa 4: 60 Clientes** | 60 comercios | **+$6.420.000 ARS** | **$829.500 ARS / mes** | ~$110.000 ARS | **+$719.500 ARS / mes** *(+ $6.4M ya cobrados)* |
| **Etapa 5: 100 Clientes** | 100 comercios | **+$10.700.000 ARS** | **$1.382.500 ARS / mes** | ~$180.000 ARS | **+$1.202.500 ARS / mes** *(+ $10.7M ya cobrados)* |

---

## 6. ¿Cómo presentar esto Comercialmente? (Estrategia de Cierre Doble)

La mejor práctica comercial es **no elegir a ciegas por el cliente**, sino usar este modelo en conjunto con el de [`ESTRATEGIA-SUSCRIPCIONES-Y-PLANES.md`](./ESTRATEGIA-SUSCRIPCIONES-Y-PLANES.md) para ofrecer un **"Cierre de Doble Alternativa"**.

Cuando estamos frente al dueño de una barbería, consultorio o centro de estética (Nivel 2), le presentamos las dos formas de contratación para la misma herramienta:

| Característica | 🅰️ Modalidad Suscripción Flexible | 🅱️ Modalidad Puesta en Marcha + Mantenimiento Mínimo |
| :--- | :---: | :---: |
| **Pago Inicial de Instalación y Migración** | **$0 ARS** *(Lo configurás vos mismo)* | **$110.000 ARS (Pago Único)** *(Te entregamos todo cargado y listo)* |
| **Cuota Mensual** | **$29.000 ARS / mes** | **$14.500 ARS / mes** *(50% OFF todos los meses para siempre)* |
| **Primer Mes de Abono** | Se abona al finalizar los 14 días de prueba | **100% Bonificado** (Empezás a pagar el mantenimiento recién el Mes 2) |
| **Punto de Equilibrio para el Cliente** | Ideal si no querés desembolsar hoy | **A partir del 7.º mes ya te ahorraste toda la inversión inicial y pagás la mitad de por vida** |

### ¿Por qué esta tabla multiplica las ventas?
1. **Anclaje de Valor:** El cliente ve que el sistema vale **$29.000 ARS/mes**. Por lo tanto, pagar **$14.500 ARS/mes** en la Modalidad B se percibe inmediatamente como una **oferta irresistible (mitad de precio de por vida)**.
2. **Al revés también funciona:** Si un comercio no tiene los **$110.000 ARS** hoy, ve la Modalidad A de **$29.000 ARS/mes con $0 de entrada** como un alivio inmediato para arrancar sin inversión inicial.

---

## 7. Reglas Contractuales y Técnicas de Protección

Para que este modelo funcione sin fricciones ni malentendidos con los comercios:

1. **Cláusula de Actualización por Inflación del Sostenimiento Mensual:**
   - Aclarar de forma transparente que el abono mínimo de sostenimiento ($8.500 / $14.500 / $22.000 ARS) se actualiza **trimestralmente** según el IPC o el costo de infraestructura local. Como parte de una base muy baja, los ajustes son de apenas unos pocos miles de pesos y nadie se da de baja por ello.
2. **Qué pasa si un comercio deja de pagar el Sostenimiento Mensual (`PAST_DUE` / `CANCELED`):**
   - Si vence el abono mensual y pasan 7 días de gracia sin pago, la cuenta pasa a **Modo Pausa (Solo Lectura)**: el comercio no pierde su configuración ni sus clientes, pero no puede agendar nuevos turnos ni disparar WhatsApps hasta regularizar el mes pendiente (sin tener que volver a pagar el costo de instalación inicial si se pone al día dentro de los 60 días).
3. **Implementación en Base de Datos (`Organization`):**
   - Además de los campos `plan` y `subscriptionStatus`, agregar en `Organization`:
     - `billingModel`: `ENUM('PURE_SUBSCRIPTION', 'SETUP_PLUS_MAINTENANCE')`.
     - `setupFeePaid`: `boolean` (`default: false`).
     - `setupFeeAmount`: `numeric(12, 2)` (registra el ingreso inicial cobrado para reportes internos de los socios).
     - `maintenanceMonthlyAmount`: `numeric(12, 2)` (guarda el abono mensual pactado con esa organización).
     - `extraMessageCredits`: `int` (`default: 0`) — saldo de mensajes de WhatsApp comprados vía **Packs de Recarga** que **no vencen a fin de mes** hasta que el negocio los termine de usar.


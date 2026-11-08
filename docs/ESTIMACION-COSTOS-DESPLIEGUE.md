# Estimación de Costos de Infraestructura y Despliegue (`Clicke Impulso`)

**Documento de análisis técnico-económico para socios**  
**Objetivo:** Evaluar la inversión inicial, los costos operativos mensuales y la capacidad de escalabilidad para poner en producción la plataforma SaaS de gestión de turnos y automatizaciones por WhatsApp.

---

## 1. Resumen Ejecutivo

Gracias a cómo fue diseñada la arquitectura del sistema (contenedores livianos en **Docker**, base de datos y motor de colas unificados en **PostgreSQL**, y compilación externa gratuita en **GitHub Actions**), **no necesitamos contratar múltiples servicios en dólares** para salir al mercado.

- **Inversión inicial anual en servidor + dominio + backups:** **$110.000 ARS / año** _(aprox. **$9.167 ARS por mes**)_ en DonWeb.
- **Costos adicionales obligatorios de software / licencias:** **$0 ARS**.
- **Punto de equilibrio (Break-Even):** Con **1 solo cliente (comercio) abonando la suscripción mensual más básica**, se cubre el 100% del costo mensual del servidor y ya genera margen positivo.

---

## 2. Desglose del Plan Seleccionado en DonWeb (Año 1)

| Ítem / Servicio                   | Especificación Contratada                                                         |     Costo Anual     | Costo Mensual Equivalente |
| :-------------------------------- | :-------------------------------------------------------------------------------- | :-----------------: | :-----------------------: |
| **Cloud VPS (DonWeb)**            | **4 vCPU** / **4 GB RAM** / **20 GB SSD** / **2 TB Transferencia** (Ubuntu 24.04) |   $110.000 ARS\*    |     ~$9.167 ARS / mes     |
| **Dominio Web Propio**            | Registro de dominio incluido por 1 año (promoción DonWeb)                         | **Bonificado ($0)** |          **$0**           |
| **Backups de Servidor**           | 20 GB de Copia de Seguridad Premium Diaria en DonWeb                              |  **Incluido ($0)**  |          **$0**           |
| **Certificados SSL (HTTPS)**      | Renovación automática con Caddy Server (Let's Encrypt)                            |   **Gratis ($0)**   |          **$0**           |
| **Motor de Base de Datos**        | PostgreSQL 16 corriendo en contenedor privado dentro del VPS                      |   **Gratis ($0)**   |          **$0**           |
| **Motor de Automatizaciones**     | Cola transaccional en PostgreSQL + Cron Worker en NestJS                          |   **Gratis ($0)**   |          **$0**           |
| **Despliegue Automático (CI/CD)** | GitHub Actions + GitHub Container Registry (`ghcr.io`)                            |   **Gratis ($0)**   |          **$0**           |
| **TOTAL INFRAESTRUCTURA FIJA**    | **Plataforma 100% operativa 24/7 en Producción**                                  | **$110.000 ARS\***  |  **~$9.167 ARS / mes\***  |

> **\*Nota contable y estrategia de contratación (1 año vs. 2 años) en DonWeb:**
>
> 1. **Impuestos locales (IVA):** Verificar en el paso final del carrito si los `$110.000 ARS` son finales o si DonWeb adiciona el 21% de IVA al facturar (`~$133.100 ARS` finales, es decir `~$11.090 ARS/mes`). Al ser un proveedor argentino, **se paga en pesos y NO aplica recargo de dólar tarjeta / percepciones en moneda extranjera**.
> 2. **Aumento en la renovación vs. Congelar por 2 años:** Al finalizar el primer año promocional, **renovar el servicio pasa a costar casi el doble por mes** (~`$18.300 ARS/mes` a valores de hoy, más actualización). Sin embargo, **contratando 2 años juntos desde el inicio se mantiene el mismo precio mensual promocional** (`~$9.167 ARS/mes`, es decir `~$220.000 ARS` por los 24 meses completos).

### 2.1. Comparativa para Decidir entre Socios: ¿Contratar 1 Año o 2 Años Juntos?

| Opción de Contratación | Inversión Inicial Hoy | Costo Estimado Año 2 (Renovación sin promo) | Gasto Total en 24 Meses | Costo Mensual Promedio (2 años) | Ahorro Real en el Año 2 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Opción A: Pagar 1 Año** *(y renovar al año siguiente)* | **$110.000 ARS** | ~$220.000 ARS *(casi el doble por mes)* | **~$330.000 ARS** | ~$13.750 ARS / mes | $0 ARS |
| **Opción B: Pagar 2 Años Juntos** *(mantiene el precio mensual)* | **$220.000 ARS** | **$0 ARS** *(ya cubierto al precio promo)* | **$220.000 ARS** | **~$9.167 ARS / mes** | **~$110.000 ARS (~50% de ahorro en el Año 2)** |

* **¿Cuándo conviene pagar 1 año ($110.000 ARS)?** Si priorizamos desembolsar la menor plata posible hoy para salir a validar el producto y que la renovación del segundo año (aunque cueste el doble) la paguen las propias suscripciones de los clientes.
* **¿Cuándo conviene pagar los 2 años juntos ($220.000 ARS)?** Si dividimos la inversión entre los socios hoy, congelamos la infraestructura en pesos durante **24 meses completos** al valor promocional (`~$9.167 ARS/mes`), nos olvidamos de aumentos y nos ahorramos pagar el doble el año que viene.

---

## 3. ¿Cuánto nos ahorramos con nuestra arquitectura frente a la nube tradicional?

En muchos proyectos similares se contratan servicios separados en dólares (Frontend en Vercel Pro, Backend en Render/Railway, Base de datos en Supabase/RDS y Colas en Redis Cloud). Así se compara nuestro esquema en DonWeb frente al esquema tradicional:

| Componente del Sistema              | Cómo corre en nuestra arquitectura (VPS DonWeb)             |  Costo en nuestro VPS  | Alternativa en Nube en USD (Vercel + Railway + RDS) |
| :---------------------------------- | :---------------------------------------------------------- | :--------------------: | :-------------------------------------------------: |
| **Frontend (`Next.js 16`)**         | Contenedor `app_frontend` (modo _Standalone_ optimizado)    |        Incluido        |             $20 USD / mes (Vercel Pro)              |
| **Backend (`NestJS 11`)**           | Contenedor `app_backend` (API + Cron de notificaciones)     |        Incluido        |                 $10 a $20 USD / mes                 |
| **Base de Datos (`PostgreSQL 16`)** | Contenedor `app_postgres` en red interna aislada            |        Incluido        |                 $15 a $25 USD / mes                 |
| **Cola de Automatizaciones**        | Tabla `automation_executions` con `SKIP LOCKED` en Postgres |        Incluido        |           $10 USD / mes (Redis / Upstash)           |
| **Reverse Proxy + HTTPS**           | Contenedor `app_caddy` con HTTP/3 y SSL automático          |        Incluido        |                Incluido / Cloudflare                |
| **Gasto Mensual Estimado**          | **Todo unificado y aislado con Docker Compose**             | **~$7 a $9 USD / mes** |    **$55 a $75 USD / mes (~$850.000+ ARS/año)**     |

**Conclusión:** Centralizar todo mediante Docker en este VPS nos ahorra **más de $600 USD al año** durante la etapa de lanzamiento y validación, sin sacrificar seguridad ni velocidad.

---

## 4. Análisis Técnico de Capacidad: ¿Alcanza este VPS para nuestros clientes?

El servidor elegido cuenta con **4 vCPUs y 4 GB de RAM**, que es una capacidad excelente en procesador y memoria. A continuación detallamos cuánto consume realmente nuestra app y cuántos clientes soporta:

### 4.1. Consumo de Memoria RAM y Procesador (4 vCPUs / 4 GB RAM)

Gracias a que utilizamos imágenes `node:22-alpine` y `postgres:16-alpine` (versiones ultralivianas de Linux):

- **Sistema Operativo (Ubuntu 24.04) + Docker:** ~350 MB RAM
- **Proxy Web y SSL (`Caddy`):** ~35 MB RAM
- **Base de Datos (`PostgreSQL 16`):** ~150 MB a 300 MB RAM
- **Backend + Motor de Automatizaciones (`NestJS`):** ~150 MB a 250 MB RAM
- **Frontend (`Next.js Standalone`):** ~150 MB a 250 MB RAM
- **Total consumido en operación normal:** **~1.0 GB a 1.2 GB de RAM** _(queda casi **3 GB de RAM libres** + **2 GB de memoria Swap** de respaldo que configura automáticamente nuestro script de instalación)._

### 4.2. Cuidado de los 20 GB de Disco SSD (El único recurso ajustado y cómo lo resolvimos)

El disco de **20 GB SSD** es suficiente para el primer año **siempre que no se acumule basura en el servidor**. Para garantizar que nunca se llene por accidente, ya dejamos implementadas 4 medidas en la carpeta [`deploy/`](./nestjs-auth/deploy/README-DEPLOY.md):

1. **Compilación afuera del VPS:** El servidor **no compila código** (que es lo que suele llenar el disco con cachés temporales). La compilación ocurre gratis en los servidores de **GitHub Actions**, y el VPS solo descarga la imagen final ya comprimida (~150 MB).
2. **Limpieza automática en cada actualización:** Cada vez que se sube una mejora, el despliegue borra automáticamente la versión anterior (`docker image prune -af`).
3. **Tope estricto a los archivos de registro (Logs):** El script [`setup-vps.sh`](./nestjs-auth/deploy/setup-vps.sh) limita los logs de Docker a un máximo de **30 MB por contenedor**.
4. **¿Cuánto pesan los datos de los turnos? Muy poco:** En PostgreSQL, los datos son texto puro. **100.000 turnos agendados con sus clientes y su historial de automatizaciones ocupan menos de 150 MB** en total.

> **⚠️ Regla de oro para el futuro sobre los 20 GB:**  
> Mientras guardemos datos de turnos, clientes, pagos y reglas de automatización, los 20 GB sobran por años. Si más adelante permitimos que los comercios suban **fotos pesadas** (ej. fotos de antes/después de clientes o catálogos con muchas imágenes), esas imágenes no deben guardarse en los 20 GB del VPS sino en **Cloudflare R2** (que ofrece **10 GB gratis por mes**).

### 4.3. ¿Cuántos comercios (clientes del SaaS) soporta este VPS?

- **Etapa Inicial (1 a 30 comercios activos):** El servidor trabajará a menos del **15% de su capacidad**.
- **Etapa de Crecimiento (30 a 100+ comercios activos):** Suponiendo 100 negocios con un promedio de 200 turnos mensuales cada uno (**20.000 turnos/mes**), eso equivale a menos de 1 reserva por minuto en horario comercial. Los **4 vCPUs y 4 GB de RAM** lo procesan sin ningún esfuerzo.
- **Transferencia (2 TB / mes):** Equivale a más de **500.000 visitas mensuales** a la aplicación. Sobrado para el primer año.

---

## 5. Costos Variables: WhatsApp (Meta API) y Futuras Integraciones

Además del servidor, es importante que como socios tengamos claro qué pasa con los servicios externos a medida que sumamos comercios:

### 5.1. Envío de Notificaciones por WhatsApp (API Oficial de Meta)

Nuestro sistema se conecta directo a la **API Oficial de Meta (WhatsApp Cloud API)** sin intermediarios que cobren comisión extra:

- **Etapa de Desarrollo, Demos y Pruebas:** **$0 ARS**. Meta nos brinda un número de prueba gratuito y nuestro sistema incluye un **Modo Simulación (Sandbox)** para probar todas las automatizaciones sin gastar un centavo.
- **En Producción con Comercios Reales:**
  - Meta no cobra abono fijo mensual; cobra únicamente por mensaje entregado (~**$0.015 a $0.026 USD** por confirmación o recordatorio de turno, aprox. **$20 a $35 ARS** por mensaje).
  - **¿Quién paga ese costo?** Existen dos modelos comerciales que podemos elegir como socios:
    1. **Costo 100% a cargo del comercio cliente (Cero costo para nosotros):** Cada negocio vincula su cuenta de Meta Business con su propia tarjeta, y Meta le debita directamente los pocos dólares que consuma al mes (para una barbería o consultorio con 150 turnos/mes, son apenas ~$4 a $8 USD mensuales).
    2. **Incluido en un "Plan Pro" con cupo mensual:** Le cobramos al comercio un plan más alto que ya incluye, por ejemplo, hasta 300 o 500 mensajes mensuales (protegido por el límite `monthlyMessageLimit` que ya tiene la base de datos para evitar excesos).

### 5.2. Costos de Próximas Fases (Hoja de Ruta)

- **Integración con Mercado Pago (Cobro de señas y turnos):** **$0 de costo fijo** para nosotros. Cada comercio conecta su propia cuenta de Mercado Pago y la comisión por cobro se descuenta de la transacción del turno.
- **Agente de IA Asesor en el Dashboard (Fase futura):** Si activamos el copiloto de IA (usando modelos económicos como _Gemini 2.5 Flash_ o _GPT-4o-mini_), analizar las métricas de un comercio cuesta menos de **$0.10 USD por mes por cliente**.

---

## 6. Proyección de Rentabilidad sobre el Costo del Servidor

Para dimensionar el bajo riesgo de esta inversión inicial de **$110.000 ARS anuales (~$9.167 ARS/mes)**, veamos cómo impacta el costo del servidor suponiendo una suscripción promedio conservadora de **$25.000 ARS / mes por comercio**:

| Escenario                           | Comercios Activos | Ingreso Mensual Estimado | Costo Mensual VPS DonWeb | Peso del Servidor sobre la Facturación |         Margen Bruto tras Servidor         |
| :---------------------------------- | :---------------: | :----------------------: | :----------------------: | :------------------------------------: | :----------------------------------------: |
| **Mes de Lanzamiento**              |     1 cliente     |    $25.000 ARS / mes     |    ~$9.167 ARS / mes     |                 36,6%                  | **+$15.833 ARS / mes** _(Ya se paga solo)_ |
| **Validación Inicial**              |    5 clientes     |    $125.000 ARS / mes    |    ~$9.167 ARS / mes     |                  7,3%                  |          **+$115.833 ARS / mes**           |
| **Tracción**                        |    20 clientes    |    $500.000 ARS / mes    |    ~$9.167 ARS / mes     |                  1,8%                  |          **+$490.833 ARS / mes**           |
| **Consolidación (en el mismo VPS)** |    50 clientes    |   $1.250.000 ARS / mes   |    ~$9.167 ARS / mes     |                **0,7%**                |         **+$1.240.833 ARS / mes**          |

---

## 7. Conclusión y Recomendación para la Compra

1. **La oferta de DonWeb ($110.000 ARS/año por 4 vCPU + 4 GB RAM + Dominio + Backups) es una excelente oportunidad.** Además, dado que al renovar en el segundo año el precio mensual pasa a costar casi el doble, **si entre los socios decidimos pagar los 2 años juntos (~$220.000 ARS), blindamos el mismo costo mensual promocional (~$9.167 ARS/mes) durante 24 meses completos** sin aumentos ni sorpresas de renovación.
2. **Sobre el software preinstalado (`Ubuntu 24.04 + Node.js 22`):** Podés avanzar exactamente con esa selección. Toda nuestra plataforma ya está preparada en [`nestjs-auth/deploy/`](./nestjs-auth/deploy/README-DEPLOY.md) para instalarse encima de Ubuntu 24.04 con un solo comando ([`setup-vps.sh`](./nestjs-auth/deploy/setup-vps.sh)), que levanta Docker, el Firewall, la memoria Swap de protección, el certificado SSL y los backups automáticos de la base de datos.

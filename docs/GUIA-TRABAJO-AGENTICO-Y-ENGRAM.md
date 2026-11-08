# Guía de Trabajo Agéntico y Memoria Persistente (Clicke Engram)

Este documento explica cómo funciona la infraestructura de inteligencia agéntica configurada en el workspace de **Clicke Impulso** (`be-schedule`, `ft-schedule` y `app-schedule`), cómo aprovecharla en el día a día y por qué aporta una ventaja clave para el desarrollo del proyecto.

---

## 1. ¿Qué se instaló y cómo está organizado?

El sistema combina **tres niveles complementarios** para que cualquier agente de IA trabaje con contexto completo sin saturar su ventana de tokens:

```text
agents-schedule/
├── AGENTS.md                                      # 1. Reglas Globales y Matriz de Paridad (Auto-cargado)
├── be-schedule/AGENTS.md                          # 2. Reglas de Backend (Guards, TypeORM, Auth Dual, Luxon)
├── ft-schedule/AGENTS.md                             # 3. Reglas de Web (Next 16, Cookies, Tailwind v4, Identidad)
├── app-schedule/AGENTS.md                         # 4. Reglas de Mobile (Expo 58, SecureStore, Jost, Stack)
└── .agents/
    ├── engram/
    │   ├── engram.mjs                             # Motor SQLite + FTS5 (Servidor MCP + CLI sin dependencias)
    │   ├── engram.db                              # Base de datos local indexada con búsqueda FTS5
    │   └── seed-memories.json                     # Snapshot JSON sincronizado automáticamente (versionable)
    ├── plugins/
    │   └── clicke-engram/                         # Plugin MCP que registra las herramientas en Antigravity
    │       ├── plugin.json
    │       └── mcp_config.json
    └── skills/
        ├── clicke-engram/                         # Skill de memoria + referencias de contratos y script de chequeo
        │   ├── SKILL.md
        │   ├── references/
        │   │   ├── api-endpoints-map.md           # Mapa completo Endpoint Backend ↔ Servicio Web ↔ API Mobile
        │   │   └── domain-enums-and-types.md      # Diccionario canónico de Enums (Turnos, Recursos, WhatsApp, Roles)
        │   └── scripts/
        │       └── verify-ecosystem.mjs           # Verificador TypeScript (tsc --noEmit) en los 3 repositorios
        └── clicke-cross-stack-feature/            # Runbook paso a paso para features transversales
            └── SKILL.md
```

---

## 2. ¿Por qué es tan positivo tenerlo en este proyecto?

1. **Evita rupturas silenciosas entre los 3 repositorios (Cero deriva de contratos)**:
   Como `be-schedule`, `ft-schedule` y `app-schedule` son tres repositorios independientes sin una librería `shared-types`, un cambio en un DTO del backend o en un estado de turno puede romper la web o la app móvil sin dar error al compilar un solo repo. La **Matriz de Paridad** en `AGENTS.md` + el verificador `verify-ecosystem.mjs` obligan al agente a chequear los tres frentes.
2. **Protege los invariantes críticos de seguridad y negocio**:
   - Impide que el agente rompa el **contrato dual de autenticación** (cookies `httpOnly` en Web vs. `refreshToken` en body + `expo-secure-store` en Mobile).
   - Recuerda siempre que `ValidationPipe` tiene `whitelist: true` y `forbidNonWhitelisted: true` (si falta un decorador en un DTO, el request falla con `400`).
   - Asegura que los permisos respeten la **intersección `AND`** (`OrganizationFeature` + `OrganizationRole` + vigencia `paidUntil` + aceptación de Términos y Condiciones).
3. **Fidelidad visual y de UX sin repetir instrucciones**:
   El agente ya sabe desde el primer turno que los estados llevan **anillo de 12 px + texto** (nunca solo color), que la moneda es `ARS` sin decimales en `es-AR`, que el horario usa `organization.timezone` y que Mobile inicia en tema claro con tipografía `Jost` y `letterSpacing` en puntos.
4. **Ahorro de tokens y velocidad (Divulgación Progresiva)**:
   En lugar de pegar miles de líneas de documentación en cada conversación, las reglas fijas son compactas y las tablas detalladas de endpoints/enums o el historial de decisiones en **Engram** se consultan bajo demanda con búsqueda indexada (`FTS5`).
5. **Continuidad real entre sesiones**:
   Cada vez que se cierra una etapa de la app móvil, se resuelve un bug complejo o se agrega un endpoint, queda guardado en `engram.db` y exportado en `.agents/engram/seed-memories.json`. Cuando abras una conversación nueva mañana o la semana que viene, el agente recupera ese estado en milisegundos.

---

## 3. ¿Cómo se usa en el día a día?

### A. Uso 100 % automático (No tenés que hacer nada extra)
- **Al abrir o editar archivos**: Antigravity carga automáticamente [`AGENTS.md`](./AGENTS.md) y el `AGENTS.md` del subproyecto correspondiente (`be-schedule`, `ft-schedule` o `app-schedule`).
- **Al pedir tareas transversales**: El agente activa por sí solo las skills `clicke-engram` o `clicke-cross-stack-feature`, consulta la memoria y verifica los contratos.

### B. Frases útiles que podés pedirle al agente en el chat
- *"Agregá el campo X a los turnos en backend, web y mobile siguiendo la skill cross-stack y verificalo."*
- *"Consultá en el engram cómo funciona el contrato de automatizaciones antes de tocar esta pantalla."*
- *"Guardá en el engram esta decisión que acabamos de tomar sobre los planes y suscripciones."*
- *"Corré el script de verificación del ecosistema para confirmar que los 3 proyectos compilan."*

### C. Uso directo por terminal (CLI de Engram y Verificador)
Si querés consultar o administrar la memoria manualmente desde la terminal:

```bash
# 1. Ver estadísticas de memorias guardadas en Engram
node --no-warnings .agents/engram/engram.mjs stats

# 2. Buscar en la memoria por palabra clave (búsqueda FTS5)
node --no-warnings .agents/engram/engram.mjs search "refreshToken"
node --no-warnings .agents/engram/engram.mjs search "automatizaciones"

# 3. Ver todo el contexto activo de un ámbito (global | contracts | backend | web | mobile)
node --no-warnings .agents/engram/engram.mjs context mobile

# 4. Guardar o actualizar una memoria manualmente
node --no-warnings .agents/engram/engram.mjs save \
  --key="decision/mi-decision" \
  --scope="global" \
  --type="decision" \
  --title="Título de la decisión" \
  --content="Explicación detallada" \
  --files="be-schedule/src/main.ts"

# 5. Ejecutar el chequeo de TypeScript en los 3 repositorios a la vez
node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs
```


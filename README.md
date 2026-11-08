# agents-schedule

Infraestructura de **Trabajo Agéntico, Reglas Jerárquicas (`AGENTS.md`), Skills, Memoria Persistente (`Clicke Engram`) y Documentación Estratégica** para el ecosistema **Clicke Impulso**:

- **Backend (`be-schedule`)**: [`ManuLeivaOk/be-schedule`](https://github.com/ManuLeivaOk/be-schedule)
- **Web (`ft-schedule`)**: [`ManuLeivaOk/ft-schedule`](https://github.com/ManuLeivaOk/ft-schedule)
- **Mobile (`app-schedule`)**: [`ManuLeivaOk/app-schedule`](https://github.com/ManuLeivaOk/app-schedule)

---

## 1. Infraestructura Agéntica y Engram

- [`AGENTS.md`](./AGENTS.md): Reglas globales del workspace, matriz de paridad transversal (Backend ↔ Web ↔ Mobile), invariantes de dominio y protocolo Engram.
- [`docs/GUIA-TRABAJO-AGENTICO-Y-ENGRAM.md`](./docs/GUIA-TRABAJO-AGENTICO-Y-ENGRAM.md): Documentación completa de uso y arquitectura del sistema agéntico.
- [`.agents/engram/engram.mjs`](./.agents/engram/engram.mjs): Motor SQLite + FTS5 (Node 22 `node:sqlite`, cero dependencias externas) que funciona como **Servidor MCP (`clicke-engram`)** y como **CLI**.
- [`.agents/engram/seed-memories.json`](./.agents/engram/seed-memories.json): Memoria persistente versionada en Git (regenera automáticamente `engram.db` al clonar).
- [`.agents/plugins/clicke-engram/`](./.agents/plugins/clicke-engram): Plugin MCP para Antigravity.
- [`.agents/skills/clicke-engram/`](./.agents/skills/clicke-engram): Skill con diccionario canónico de enums, mapa de endpoints HTTP y verificador TypeScript transversal (`verify-ecosystem.mjs`).
- [`.agents/skills/clicke-cross-stack-feature/`](./.agents/skills/clicke-cross-stack-feature): Skill con el runbook paso a paso para implementar features en las 3 capas.
- [`.agents/subprojects/`](./.agents/subprojects): Copias versionadas de los `AGENTS.md` de cada subproyecto (`be-schedule`, `ft-schedule`, `app-schedule`) y script `sync-subproject-rules.mjs` para sincronizarlos.

---

## 2. Documentación de Producto, Negocio e Infraestructura (`docs/`)

- [`docs/GUIA-TRABAJO-AGENTICO-Y-ENGRAM.md`](./docs/GUIA-TRABAJO-AGENTICO-Y-ENGRAM.md): Cómo usar el sistema de memoria y skills agénticas.
- [`docs/ESTIMACION-COSTOS-DESPLIEGUE.md`](./docs/ESTIMACION-COSTOS-DESPLIEGUE.md): Estimación de costos de despliegue e infraestructura.
- [`docs/ESTRATEGIA-SUSCRIPCIONES-Y-PLANES.md`](./docs/ESTRATEGIA-SUSCRIPCIONES-Y-PLANES.md): Estrategia de suscripciones, planes y empaquetado comercial.
- [`docs/MODELO-PAGO-INICIAL-Y-MANTENIMIENTO.md`](./docs/MODELO-PAGO-INICIAL-Y-MANTENIMIENTO.md): Modelo de cobro de setup inicial y mantenimiento mensual.
- [`docs/IDEAS-DE-MEJORA.md`](./docs/IDEAS-DE-MEJORA.md): Backlog de ideas de mejora y evolución del producto.

---

## 3. Puesta en Marcha Rápida

1. Clonar este repositorio como raíz del workspace y dentro de él los 3 repositorios del ecosistema (`be-schedule`, `ft-schedule`, `app-schedule`).
2. Sincronizar los archivos `AGENTS.md` dentro de cada subproyecto e inicializar la base SQLite FTS5 de Engram:
   ```bash
   node --no-warnings .agents/subprojects/sync-subproject-rules.mjs
   node --no-warnings .agents/engram/engram.mjs stats
   ```
3. Verificar compilación TypeScript de las 3 capas:
   ```bash
   node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs
   ```

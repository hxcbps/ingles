# English Sprint - Backlog y Alcance de Ejecucion (V1)

Fecha de baseline: 2026-02-10
Documento base: `guides/SYSTEM_DESIGN_0_B2_V1.md`
Baseline de calidad: auditoria `P0=63`, `P1=46`, `P2=6`

## 1) Objetivo del backlog

Traducir el system design a un plan ejecutable por sprint, con items priorizados por riesgo/impacto y tareas listas para implementacion inmediata.

## 2) Alcance del programa (macro)

### In scope

- Arquitectura modular frontend alineada a bounded contexts.
- Contrato curricular y de runtime versionado (`v4.1` inicial).
- Integridad de prompts, resources y progression CEFR.
- Navegacion canonica de producto.
- Design system gobernado con un unico entrypoint CSS.
- Runtime de sesion resiliente con trazabilidad de eventos.
- Pipeline de calidad con bloqueo por P0.

### Out of scope (en esta fase)

- Backend productivo multi-tenant.
- Apps nativas (iOS/Android).
- Sincronizacion en tiempo real multi-dispositivo.
- Motor de IA propietario en servidor.

## 3) Criterio de priorizacion

Formula operativa: `Prioridad = (Impacto usuario + Riesgo tecnico + Riesgo pedagogico) - Esfuerzo`.

Niveles:
- `P0-Blocker`: rompe validez del aprendizaje o integridad del producto.
- `P1-High`: afecta calidad de progresion o mantenibilidad.
- `P2-Medium`: afecta consistencia UX o percepcion.

## 4) Product backlog por epica (programa completo)

| Rank | Epic ID | Modulo | Objetivo | Severidad | Dependencias | Sprint objetivo |
|---|---|---|---|---|---|---|
| 1 | EP-01 | Curriculum/Data | Eliminar todos los P0 de contenido (CEFR, placeholders, session vacia) | P0 | EP-00 | S1-S2 |
| 2 | EP-02 | Prompt/Resources | Resolver 100% `prompt_ref` y `resource_locator` | P0 | EP-00 | S1-S2 |
| 3 | EP-00 | Governance/Contracts | Congelar contratos `v4.1` y quality gates en CI | P0 | None | S0 |
| 4 | EP-03 | Navigation Shell | Unificar rutas canonicas shell/router | P1 | EP-00 | S0-S1 |
| 5 | EP-04 | Design System | Unico entrypoint CSS y limpieza de estilos stale | P1 | EP-00 | S0-S3 |
| 6 | EP-05 | Frontend Data Wiring | Reemplazar hardcoded KPIs/gamification por estado real | P1 | EP-00, EP-03 | S3-S4 |
| 7 | EP-06 | Session Runtime | Hardening de rehidratacion, recovery y eventos | P1 | EP-00 | S4-S5 |
| 8 | EP-07 | Observabilidad/QA | E2E critical path + telemetria estructurada | P1 | EP-03, EP-06 | S5-S6 |
| 9 | EP-08 | Polish/Release | Accesibilidad AA, performance budgets y go-live checklist | P2 | EP-01..EP-07 | S6 |

## 5) Sprint map recomendado

| Sprint | Objetivo | Resultado esperado |
|---|---|---|
| S0 | Baseline arquitectonico | Contratos y rutas canonicas definidos, CI de quality gates activo |
| S1 | P0 Content Wave 1 | CEFR drift y session integrity corregidos para semanas criticas |
| S2 | P0 Content Wave 2 | Prompt/resource integrity 100% y placeholders eliminados |
| S3 | Frontend integration Wave 1 | Shell data-driven parcial, CSS entrypoint unificado |
| S4 | Frontend integration Wave 2 | Hardcoded removidos, progreso real visible |
| S5 | Runtime hardening | Resume robusto + eventos observables + e2e camino critico |
| S6 | Release readiness | AA + performance + P0/P1 en verde |

## 6) Alcance Sprint 0 (commit)

Objetivo de sprint: establecer la base tecnica para ejecutar el programa sin retrabajo estructural.

### In scope S0

- Contrato de rutas canonicas firmado y aplicado en codigo.
- Contrato de datos `v4.1` congelado con reglas de integridad.
- Quality gate de auditoria P0 bloqueante en pipeline.
- Decision de entrypoint CSS unico y plan de migracion aplicado.
- Backlog de P0 desglosado en lotes ejecutables para S1-S2.

### Out of scope S0

- Reescritura completa de `week01..week20.v4.json`.
- Refactor visual total del shell.
- Integracion backend remota.

Capacidad estimada S0: 34-40 story points.

## 7) Sprint 0 backlog detallado (ready for execution)

## S0-B01 - ADR de rutas canonicas

- Tipo: Architecture Task
- Owner: Frontend Architect
- Estimacion: 3 SP
- Prioridad: P0
- Dependencias: ninguna
- Entregables:
  - `docs/adr/ADR-001-routing-canonical.md`
  - Matriz legacy->canonico
- Aceptacion:
  - Se define una sola tabla de rutas canonicas.
  - Se documentan aliases legacy y fecha de deprecacion.
  - Producto + frontend aprueban el ADR.
- Validacion:
  - Revisión ADR firmada en PR.

## S0-B02 - Unificacion de routing (shell + router)

- Tipo: Engineering Story
- Owner: Frontend Core
- Estimacion: 8 SP
- Prioridad: P0
- Dependencias: S0-B01
- Archivos objetivo:
  - `app/web/js/routing/routes.js`
  - `app/web/js/routing/hash_router.js`
  - `app/web/js/ui/views.js`
  - `app/web/js/ui/learning_shell.js`
- Aceptacion:
  - `LearningShell` y router comparten el mismo contrato de rutas.
  - Navegacion canonica soporta: `hoy/sesion/cierre/evaluacion/modulos/progreso`.
  - Legacy hashes redirigen sin romper flujo.
- Validacion:
  - `node --test app/web/js/tests/routes.test.mjs`
  - `node --test app/web/js/tests/hash_router.test.mjs`
  - `node --test app/web/js/tests/view_switcher.test.mjs`

## S0-B03 - Contrato `v4.1` de contenido y runtime

- Tipo: Data Contract Story
- Owner: Learning Architect + Frontend Architect
- Estimacion: 5 SP
- Prioridad: P0
- Dependencias: S0-B01
- Entregables:
  - `learning/content/schema.v4.1.json`
  - `guides/contracts/CONTENT_CONTRACT_V4_1.md`
  - matriz de compatibilidad `v4 -> v4.1`
- Aceptacion:
  - Enum de `step.type` y `gate.type` versionado y congelado.
  - Reglas fuertes explicitadas (`prompt_ref`, `resource_locator.page`, `assessment_event`).
  - Estrategia de migracion sin romper runtime.
- Validacion:
  - Validador schema ejecuta sobre `week*.v4.json`.

## S0-B04 - Validador de integridad curricular

- Tipo: DevEx Story
- Owner: DevEx
- Estimacion: 5 SP
- Prioridad: P0
- Dependencias: S0-B03
- Entregables:
  - `scripts/validate_curriculum_integrity.py`
  - salida JSON con errores por severidad
- Reglas minimas implementadas:
  - `cefr_target` vs `difficulty_level`
  - `prompt_ref` resoluble
  - `resource_locator.page` presente
  - `session_script` no vacio
- Aceptacion:
  - Script falla con code != 0 cuando hay P0.
  - Reporte con path y evidencia por semana/dia/step.
- Validacion:
  - `python3 scripts/validate_curriculum_integrity.py --repo-root .`

## S0-B05 - Quality gate en CI (block on P0)

- Tipo: Pipeline Story
- Owner: DevEx
- Estimacion: 3 SP
- Prioridad: P0
- Dependencias: S0-B04
- Entregables:
  - workflow CI (`.github/workflows/quality-gates.yml` o equivalente)
  - job `content-audit`
- Aceptacion:
  - CI ejecuta audit canónico versionado en repo y publica artefactos de calidad.
  - En S0-S2 aplica gate de no-regresion (`P0 <= baseline`).
  - En modo release (workflow dispatch estricto) exige `P0 = 0`.
- Validacion:
  - Corrida CI de prueba en branch.

## S0-B06 - ADR de CSS entrypoint unico

- Tipo: Architecture Task
- Owner: UI Platform
- Estimacion: 2 SP
- Prioridad: P1
- Dependencias: ninguna
- Entregables:
  - `docs/adr/ADR-002-css-entrypoint.md`
  - decision entre `app/web/styles.css` y `app/web/css/index.css`
- Aceptacion:
  - Se define entrypoint oficial.
  - Plan de deprecacion del entrypoint secundario.
- Validacion:
  - ADR aprobado en PR.

## S0-B07 - Implementacion de entrypoint CSS unico

- Tipo: Engineering Story
- Owner: UI Platform
- Estimacion: 5 SP
- Prioridad: P1
- Dependencias: S0-B06
- Archivos objetivo:
  - `app/web/index.html`
  - `app/web/css/index.css`
  - `app/web/styles.css`
- Aceptacion:
  - La app carga solo un entrypoint final.
  - No hay regresion visual critica desktop/mobile.
  - Documentada lista de clases stale para limpieza S3.
- Validacion:
  - smoke manual desktop/mobile
  - snapshot visual baseline (si aplica)

## S0-B08 - Catalogo de deuda P0 para S1-S2

- Tipo: Planning Story
- Owner: Learning Architect
- Estimacion: 3 SP
- Prioridad: P0
- Dependencias: S0-B04
- Entregables:
  - `guides/backlog/P0_CONTENT_REMEDIATION_QUEUE.md`
  - lotes por semana y tipo de falla
- Aceptacion:
  - Todas las 63 fallas P0 quedan mapeadas a tareas S1/S2.
  - Cada tarea incluye archivo, criterio de salida y responsable.
- Validacion:
  - Matriz trazable `finding -> task` completa.

## S0-B09 - Baseline de observabilidad de eventos

- Tipo: Runtime Story
- Owner: Frontend Core
- Estimacion: 5 SP
- Prioridad: P1
- Dependencias: S0-B01
- Archivos objetivo:
  - `app/web/js/core/orchestrator.js`
  - `app/web/js/core/bootstrap_v4.js`
  - `guides/contracts/EVENTS_SCHEMA_V1.md`
- Aceptacion:
  - Se define schema de eventos minimo del system design.
  - Cada evento incluye `session_id`, `day_id`, `step_id`, timestamp.
  - Eventos son consumibles para tracking local.
- Validacion:
  - tests unitarios de payload de eventos.

## 7.1) Estado de ejecucion Sprint 0 (actualizado)

| Story | Estado | Evidencia | Validacion |
|---|---|---|---|
| `S0-B01` | `DONE` | `docs/adr/ADR-001-routing-canonical.md` | ADR publicado y usado como contrato canonico |
| `S0-B02` | `DONE` | `app/web/js/routing/routes.js`, `app/web/js/core/bootstrap_v4.js`, `app/web/js/ui/learning_shell.js` | `node --test app/web/js/tests/routes.test.mjs app/web/js/tests/hash_router.test.mjs app/web/js/tests/view_switcher.test.mjs` |
| `S0-B03` | `DONE` | `learning/content/schema.v4.1.json`, `guides/contracts/CONTENT_CONTRACT_V4_1.md` | Contrato `v4.1` congelado y trazable |
| `S0-B04` | `DONE` | `scripts/validate_curriculum_integrity.py` | `python3 scripts/validate_curriculum_integrity.py --repo-root . --fail-on-p0` retorna code `1` cuando hay P0 |
| `S0-B05` | `DONE` | `.github/workflows/quality-gates.yml`, `plan_michael_phelps/.github/workflows/quality-gates.yml` | Quality gate bloqueante en workflow de repositorio y proyecto |
| `S0-B06` | `DONE` | `docs/adr/ADR-002-css-entrypoint.md` | ADR publicado |
| `S0-B07` | `DONE` | `app/web/index.html`, `app/web/css/index.css`, `app/web/styles.css` | Entry point unico activo en shell |
| `S0-B08` | `DONE` | `guides/backlog/P0_CONTENT_REMEDIATION_QUEUE.md` | Trazabilidad `finding -> task` completa (63/63) |
| `S0-B09` | `DONE` | `app/web/js/core/events_schema_v1.js`, `app/web/js/core/orchestrator.js`, `guides/contracts/EVENTS_SCHEMA_V1.md` | `node --test app/web/js/tests/events_schema_v1.test.mjs app/web/js/tests/orchestrator.test.mjs` |

Resultado Sprint 0: base arquitectonica cerrada. El quality gate de contenido sigue fallando por deuda curricular existente (P0 abiertos), lo cual es esperado hasta ejecutar S1-S2.

## 8) Sprint 0 Definition of Done (global)

- Todas las historias `P0` de S0 completadas y aceptadas.
- CI con quality gate activo y visible.
- Contrato de rutas y contrato `v4.1` publicados.
- Sin regressions criticas en tests de routing/runtime.
- Backlog S1-S2 listo con tareas estimadas.

## 9) Backlog S1-S2 listo para refinamiento (preview)

### S1 candidate focus

- Corregir CEFR drift W16-W20.
- Eliminar `session_script: []` en W10.
- Eliminar placeholder URLs en semanas de mayor impacto (W01-W05).

### S2 candidate focus

- Resolver `prompt_ref` faltantes en todo el rango W01-W20.
- Completar `resource_locator.page` y recursos reales.
- Reducir duplicacion semanal y activar `retention_loop` minimo.

## 10) Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Cambios de contrato rompen UI actual | Media | Alta | versionado `v4.1`, compat layer y tests de regresion |
| Carga de correccion de contenido subestimada | Alta | Alta | dividir por waves S1/S2 con lotes pequenos |
| Deriva entre shell y router reaparece | Media | Alta | fuente unica de rutas + test suite obligatoria |
| Deuda CSS frena velocity | Media | Media | ADR + entrada unica + limpieza por etapas |

## 11) KPIs de ejecucion del programa

- `P0 open findings`: 63 -> 0.
- `Prompt resolution rate`: <100% -> 100%.
- `Canonical route conformance`: 100%.
- `Hardcoded dashboard tokens`: >0 -> 0.
- `Critical flow e2e pass rate`: >= 95%.

## 12) Orden recomendado de inicio (dia 1 de sprint)

1. S0-B01 ADR rutas.
2. S0-B06 ADR CSS.
3. S0-B03 contrato `v4.1`.
4. S0-B02 routing unificado.
5. S0-B04 validador integridad.
6. S0-B05 CI gate.
7. S0-B07 entrypoint CSS unico.
8. S0-B08 queue P0 para S1-S2.
9. S0-B09 esquema de eventos.


## 13) Post-S0 stabilization addendum

### S0-H10 - Bootstrap fail-safe (runtime resilience)

- Tipo: Runtime Hardening
- Owner: Frontend Core
- Prioridad: P0
- Objetivo:
  - Evitar estado infinito de "Inicializando arquitectura modular" cuando falle un import de modulo en boot.
- Implementacion:
  - `app/web/js/main.js` cambia de import estatico a carga dinamica con manejo de error fatal.
  - Se publica `renderBootFailure` para fallback uniforme.
- Validacion:
  - `node --test app/web/js/tests/main_bootstrap.test.mjs`

### S0-H11 - Workspace hygiene and cleanup agent

- Tipo: DevEx Hardening
- Owner: Program Lead / DevEx
- Prioridad: P1
- Objetivo:
  - Eliminar artefactos efimeros de paralelizacion que no pertenecen al producto.
- Implementacion:
  - Script `scripts/cleanup_parallel_workspace.sh`
  - Ignore policy en `.gitignore` para `.codex-worktrees/` y `guides/backlog/agents/runs/`.
- Validacion:
  - `bash plan_michael_phelps/scripts/cleanup_parallel_workspace.sh`
  - `git status --short`

### S1 Wave-1 recalibration artifacts

- `guides/backlog/agents/S1_AGENT_ASSIGNMENT_WAVE1.md`
- `scripts/bootstrap_parallel_agents_s1_wave1.sh`
- `scripts/parallel_status_s1_wave1.sh`

## 14) Progress checkpoint after S1 Wave-1

Date: 2026-02-10

- Parallel execution completed for `S1-W1-01..S1-W1-09`.
- Canonical audit improved from `P0=63` to `P0=46`.
- Wave-1 queue IDs marked `DONE`: `P0-001..P0-010`, `P0-015`, `P0-044..P0-048`, `P0-063`.

Current priority to continue development phases:
1. Close remaining P0 (46) in S1/S2 before feature expansion.
2. Then run P1 tracks in parallel (frontend data wiring + curriculum dedup + prompt/content quality).
3. Keep release strict gate (`P0=0`) reserved for pre-release dispatch.

## 15) Progress checkpoint after S1 Wave-2

Date: 2026-02-10

- Parallel execution completed for `S1-W2-01..S1-W2-10`.
- Canonical audit reached `P0=0`.
- Queue now has full closure of `P0-001..P0-063`.

Development phases now unlocked:
1. S2 pedagogical quality pass (`P1 content` reduction).
2. S3 frontend integration debt burn-down (`mock-data`, stale CSS selectors, utility framework alignment).
3. S4 runtime/UX polish for release quality.

## 16) Progress checkpoint after S2 Wave-1

Date: 2026-02-11

- Parallel execution completed for `S2-W1-01..S2-W1-07`.
- Post-wave closure commit added method coverage support (`reading_task`, `recording_task`, `repair_drill`).
- Canonical quality status reached zero findings: `P0=0`, `P1=0`, `P2=0`.

Backlog phase status:
1. Content/data contract integrity: completed against current quality gates.
2. Frontend integration debt (mock-data/scroll/responsive/entrypoint): completed for audited findings.
3. Next work should be feature evolution and regression protection, not debt carryover.

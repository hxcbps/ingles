# EXEC-UX-S7-FIGMA-001 - Frontend Reboot Figma-First (Impacto visual + claridad UX)

Status: active
Owner: Frontend Runtime Agent + UI UX Director Agent
Started: 2026-02-12
Updated: 2026-02-12

## Objective

Diseñar y ejecutar un rediseño frontend altamente profesional, consistente y usable, con planificación Figma-first y orquestación de agentes por lanes para evitar iteraciones sin rumbo.

## Scope

In scope:
- Definir dirección visual y arquitectura de información de navegación.
- Diseñar artefactos Figma para las 6 rutas clave (`Hoy`, `Sesion`, `Cierre`, `Evaluacion`, `Modulos`, `Progreso`).
- Definir sistema de componentes/tokens y estados críticos de UX.
- Dejar handoff exacto para implementación frontend por olas.

Out of scope:
- Cambios curriculares en `learning/content` y `learning/syllabus`.
- Reescritura completa de runtime no relacionada con UX/UI.

## Current Audit Snapshot

Commands executed:
- `bash scripts/run_frontend_ux_gates.sh /Users/dfernandez/code/ingles/plan_michael_phelps`
- `python3 scripts/agent_quality_guardian.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`

Result:
- Gate suite: `PASS` funcional/técnico.
- UX debt: `WARN` (179 valores de color hard-coded fuera de tokens, incluidos overrides S7).
- Agent guardian: `PASS` con warnings heredados de assignments antiguos.

## Findings (severity-first)

| Severity | Finding | Evidence |
|---|---|---|
| P1 | Sistema visual fragmentado entre shell y sesión (dos lenguajes UI distintos). | `app/web/js/ui/learning_shell.js:459`, `app/web/js/ui/session_wizard.js:255`, `app/web/css/wizard.css:6` |
| P1 | Botonería base genérica sin escalas de personalidad por contexto (primary/secondary/ghost únicamente). | `app/web/css/components.css:205`, `app/web/js/ui/session_wizard.js:306` |
| P1 | Deuda de color elevada (125 hard-coded values) dificulta consistencia y evolución estética. | Salida de `scripts/run_frontend_ux_gates.sh`, ejemplo en `app/web/css/base.css:18` y `app/web/css/wizard.css:9` |
| P2 | Navegación móvil oculta labels de ítems no activos y reduce descubribilidad. | `app/web/js/ui/learning_shell.js:679` |
| P2 | Grupos de navegación definidos pero no explicitados visualmente en sidebar (poca orientación IA). | `app/web/js/ui/views.js:1`, `app/web/js/ui/learning_shell.js:627` |

## Work Breakdown

| Item | Description | Status |
|---|---|---|
| W1 | Congelar diagnóstico UX/UI con evidencia de código y gates | Done |
| W2 | Definir playbook Figma-first con artefactos obligatorios | Done |
| W3 | Publicar assignment multi-agente S7 para diseño en paralelo | Done |
| W4 | Publicar comandos/scripts de orquestación S7 (`bootstrap`/`status`) | Done |
| W5 | Ejecutar Wave 1 Figma pages 00-07 | Todo |
| W6 | Integrar handoff aprobado en ola de implementación frontend | In Progress |
| W7 | Aplicar hotfix visual inmediato S7 (navegacion, botoneria, shell/wizard cohesion) | Done |

## Progress Log

- 2026-02-12: Se ejecutaron gates frontend y se confirmó brecha visual (deuda de color hard-coded + inconsistencia shell/sesión).
- 2026-02-12: Se versionó plan activo S7 Figma-first con ruta de ejecución.
- 2026-02-12: Se publicaron assignment, launch commands y scripts de worktree para orquestación paralela de agentes.
- 2026-02-12: Se aplicó hotfix visual S7 en código (reset de botones nativos, sidebar más legible, labels móviles visibles, CTA con mayor jerarquía y cohesión shell/wizard) y se revalidó con gates en verde.

## Decision Log

Related decisions are recorded in:
- `docs/architecture/plans/decisions/DECISION_LOG.md`

Decision delta for this execution:
- Adoptar Figma-first como prerrequisito para cambios visuales de alto impacto antes de nueva ola de implementación frontend.

## Validation Checklist

- [x] `bash scripts/run_frontend_ux_gates.sh /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/agent_quality_guardian.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/lint_architecture_docs.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/check_docs_drift.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`

## Multi-Agent Orchestration (Figma Wave 1)

See:
- `guides/backlog/agents/S7_AGENT_ASSIGNMENT_FIGMA_WAVE1.md`
- `guides/backlog/agents/AGENT_LAUNCH_COMMANDS_S7_FIGMA.md`
- `docs/design/figma/FIGMA_FRONTEND_REDESIGN_PLAYBOOK.md`

## Definition of Done

- Existe arquitectura visual única y consistente entre shell y sesión.
- Navegación desktop y mobile es clara sin necesidad de trial-and-error.
- Botones y CTAs tienen personalidad definida por contexto y estado.
- Artefactos Figma cubren flujos clave y estados edge.
- Implementación pasa:
  - `bash scripts/run_frontend_ux_gates.sh .`
  - `node --test app/web/js/tests/*.test.mjs`
  - `python3 scripts/audit_english_sprint.py --repo-root .`

# EXEC-UX-S7-DESIGN-SKELETON-002 - Design Skeleton Specialist Agents

Status: active
Owner: UI UX Director Agent
Started: 2026-02-12
Updated: 2026-02-12

## Objective

Instituir una ola de agentes especialistas para construir consistencia visual profesional por capas del diseño: paleta, botones, tipografía, motion y storytelling cromático.

## Scope

In scope:
- Definir ownership explícito por esqueleto de diseño.
- Diseñar artefactos Figma por especialista con criterios medibles.
- Establecer integración de resultados en una sola guía de implementación.

Out of scope:
- Reescritura completa de UI en esta ola.
- Cambios curriculares o lógicos de dominio fuera de UI/UX.

## Current Audit Snapshot

Commands executed:
- `bash scripts/run_frontend_ux_gates.sh /Users/dfernandez/code/ingles/plan_michael_phelps`
- `python3 scripts/agent_quality_guardian.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`

Result:
- Calidad funcional: `PASS`.
- Calidad visual: aún `below premium` por inconsistencia cromática entre capas y deuda hard-coded.

## Findings (severity-first)

| Severity | Finding | Evidence |
|---|---|---|
| P1 | La paleta no está gobernada por una narrativa única de marca/producto. | `app/web/css/tokens.css`, `app/web/css/reboot_s7.css` |
| P1 | Botones tienen mejoras, pero faltan reglas completas de jerarquía por contexto y estado. | `app/web/css/components.css:205`, `app/web/js/ui/session_wizard.js:306` |
| P1 | Tipografía carece de una escala editorial con roles semánticos fijos por vista. | `app/web/css/tokens.css:87`, `app/web/js/ui/learning_shell.js:536` |
| P2 | Motion existe, pero no hay scorecard de intencionalidad y narrativa de interacción. | `app/web/css/layout.css:45`, `app/web/css/wizard_polish.css:56` |
| P2 | Combinaciones de color no están evaluadas con framework de storytelling visual. | `app/web/css/reboot_s7.css`, `app/web/css/wizard.css` |

## Work Breakdown

| Item | Description | Status |
|---|---|---|
| W1 | Definir la ola S7 de agentes especialistas de esqueleto de diseño | Done |
| W2 | Publicar assignment de 5 agentes con ownership no solapado | Done |
| W3 | Publicar launch commands y scripts de worktree para ejecución paralela | Done |
| W4 | Ejecutar producción de artefactos Figma por cada especialista | Done |
| W5 | Consolidar output en decisión visual unificada y ruta de implementación | Done |

## Progress Log

- 2026-02-12: Se confirma que la app mejora respecto al estado previo, pero no alcanza consistencia premium integral.
- 2026-02-12: Se crea ejecución especializada por esqueletos de diseño (5 agentes).
- 2026-02-12: Se versionan assignment, launch commands, status y scripts de orquestación.
- 2026-02-12: Se ejecutan lanes S7-DS-01..05 y se publica merge unificado (`S7-W2-06`).

## Decision Log

Related decisions are recorded in:
- `docs/architecture/plans/decisions/DECISION_LOG.md`

Decision delta for this execution:
- Separar calidad visual en ownerships especialistas para eliminar ambigüedad y acelerar convergencia hacia un diseño profesional consistente.

## Validation Checklist

- [x] `python3 scripts/lint_architecture_docs.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/check_docs_drift.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/audit_english_sprint.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `node --test app/web/js/tests/*.test.mjs`

## Multi-Agent Orchestration

See:
- `guides/backlog/agents/S7_AGENT_ASSIGNMENT_DESIGN_SKELETON_WAVE2.md`
- `guides/backlog/agents/AGENT_LAUNCH_COMMANDS_S7_DESIGN_SKELETON.md`
- `docs/design/figma/FIGMA_DESIGN_SKELETON_AGENTS_S7.md`

## Definition of Done

- Cada esqueleto de diseño tiene artefacto Figma aprobado con criterios objetivos.
- Se define un sistema visual único coherente entre shell y wizard.
- Se publica una guía de implementación priorizada por riesgo/impacto.

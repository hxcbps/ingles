# Sprint 6 - Agent Quality Guardian Assignment

Date: 2026-02-12
Source: `guides/SPRINT_BACKLOG_0_B2_V1.md` + `docs/architecture/plans/active/EXEC-UX-S6-WAVE1-001.md`

Objective: crear un agente permanente para detectar y bloquear errores predecibles en `frontend-ux` y elevar la calidad de ejecucion de agentes paralelos.

## Scope

| Lane ID | Agent | Scope | Files | Priority | Status |
|---|---|---|---|---|---|
| `S6-GUARD-01` | `Agent-Quality-Guardian` | Verificar contratos de workflow/frontend-ux, calidad de AGENTS y consistencia de scripts de orquestacion | `scripts/agent_quality_guardian.py`, `.github/workflows/quality-gates.yml`, `.github/workflows/agent-quality-guardian.yml`, `AGENTS.md` | High | `DONE` |

## Integration Order

1. Endurecer precondiciones de `frontend-ux` en CI.
2. Implementar guardian script con reporte JSON.
3. Integrar guardian en `quality-gates` y workflow recurrente.

## Validation Contract

- `python3 scripts/agent_quality_guardian.py --repo-root .`
- `bash scripts/run_frontend_ux_gates.sh .`
- Workflow quality-gates con job `agent-quality-guardian` en verde.

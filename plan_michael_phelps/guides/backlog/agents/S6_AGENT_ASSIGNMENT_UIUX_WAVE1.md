# Sprint 6 UI UX Director - Agent Assignment Wave 1

Date: 2026-02-12
Source: `guides/SPRINT_BACKLOG_0_B2_V1.md` (`S6 Release readiness`) + `docs/architecture/plans/active/EXEC-UX-S6-WAVE1-001.md`

Objective: consolidar fluidez funcional del producto, eliminar friccion en navegacion y reforzar claridad pedagogica accionable por modulo.

## Parallel Lane Plan

| Lane ID | Agent | Scope | Files | Priority | Status |
|---|---|---|---|---|---|
| `S6-UX-01` | `Agent-UX-Accessibility` | Baseline a11y: `:focus-visible` + reduced-motion consistente | `app/web/css/base.css` | High | `DONE` |
| `S6-UX-02` | `Agent-UX-Navigation` | Reducir ruido visual (parpadeo) y estabilidad de estados activos | `app/web/js/ui/learning_shell.js`, `app/web/js/ui/views.js` | High | `DONE` |
| `S6-UX-03` | `Agent-UX-Session-Continuity` | Evitar vista de sesion vacia al navegar entre modulos | `app/web/js/core/bootstrap_v4.js` | High | `DONE` |
| `S6-UX-04` | `Agent-UX-Actionability` | Panel accionable en vista `Sesion` (que hacer ahora + CTA) | `app/web/js/ui/learning_shell.js`, `app/web/css/components.css` | High | `DONE` |
| `S6-UX-05` | `Agent-UX-Gates` | Versionar gate runner de UX y conectar CI | `scripts/run_frontend_ux_gates.sh`, `.github/workflows/quality-gates.yml` | High | `DONE` |
| `S6-UX-06` | `Agent-UX-Orchestrator` | Publicar comandos/lanes/worktrees para ejecucion paralela | `guides/backlog/agents/*.md`, `scripts/bootstrap_parallel_agents_s6_uiux.sh`, `scripts/parallel_status_s6_uiux.sh` | Medium | `DONE` |

## Integration Order

1. `S6-UX-01` + `S6-UX-02` (experiencia base y claridad visual).
2. `S6-UX-03` (continuidad funcional de sesion).
3. `S6-UX-04` (accionabilidad pedagogica).
4. `S6-UX-05` (guardrails de calidad).
5. `S6-UX-06` (orquestacion operativa de agentes).

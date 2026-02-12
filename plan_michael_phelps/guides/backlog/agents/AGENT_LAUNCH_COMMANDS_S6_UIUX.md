# Agent Launch Commands - Sprint 6 UI UX Wave 1

Use one terminal per agent to run in parallel.

## Commands

1. Agent-UX-Accessibility (`S6-UX-01`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s6-uiux/s6-ux-01/plan_michael_phelps
```

2. Agent-UX-Navigation (`S6-UX-02`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s6-uiux/s6-ux-02/plan_michael_phelps
```

3. Agent-UX-Session-Continuity (`S6-UX-03`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s6-uiux/s6-ux-03/plan_michael_phelps
```

4. Agent-UX-Actionability (`S6-UX-04`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s6-uiux/s6-ux-04/plan_michael_phelps
```

5. Agent-UX-Gates (`S6-UX-05`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s6-uiux/s6-ux-05/plan_michael_phelps
```

6. Agent-UX-Orchestrator (`S6-UX-06`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s6-uiux/s6-ux-06/plan_michael_phelps
```

## First instruction to each agent

"Open `guides/backlog/agents/S6_AGENT_ASSIGNMENT_UIUX_WAVE1.md` and execute only your lane scope. Run `bash scripts/run_frontend_ux_gates.sh .` before handoff."

## Monitoring

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/parallel_status_s6_uiux.sh
```

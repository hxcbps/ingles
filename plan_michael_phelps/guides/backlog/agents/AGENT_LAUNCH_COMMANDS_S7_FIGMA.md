# Agent Launch Commands - Sprint 7 Figma Frontend Reboot Wave 1

Use one terminal per agent to run in parallel.

## Prepare worktrees

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/bootstrap_parallel_agents_s7_figma.sh
```

## Commands

1. Agent-Figma-NorthStar (`S7-FG-01`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-01/plan_michael_phelps
```

2. Agent-Figma-IA-Navigation (`S7-FG-02`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-02/plan_michael_phelps
```

3. Agent-Figma-Desktop-Screens (`S7-FG-03`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-03/plan_michael_phelps
```

4. Agent-Figma-Mobile-Screens (`S7-FG-04`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-04/plan_michael_phelps
```

5. Agent-Figma-Components-Tokens (`S7-FG-05`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-05/plan_michael_phelps
```

6. Agent-Figma-States-Feedback (`S7-FG-06`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-06/plan_michael_phelps
```

7. Agent-Figma-Prototyper (`S7-FG-07`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-07/plan_michael_phelps
```

8. Agent-Figma-Handoff (`S7-FG-08`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-figma/s7-fg-08/plan_michael_phelps
```

## First instruction to each agent

"Open `docs/design/figma/FIGMA_FRONTEND_REDESIGN_PLAYBOOK.md` and `guides/backlog/agents/S7_AGENT_ASSIGNMENT_FIGMA_WAVE1.md`. Execute only your lane scope."

## Monitoring

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/parallel_status_s7_figma.sh
```

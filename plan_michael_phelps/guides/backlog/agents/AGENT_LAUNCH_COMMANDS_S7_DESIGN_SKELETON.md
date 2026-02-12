# Agent Launch Commands - Sprint 7 Design Skeleton Wave 2

Use one terminal per agent to run in parallel.

## Prepare worktrees

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/bootstrap_parallel_agents_s7_design_skeleton.sh
```

## Commands

1. Agent-Palette-Architect (`S7-DS-01`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-design-skeleton/s7-ds-01/plan_michael_phelps
```

2. Agent-Button-System (`S7-DS-02`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-design-skeleton/s7-ds-02/plan_michael_phelps
```

3. Agent-Typography-Director (`S7-DS-03`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-design-skeleton/s7-ds-03/plan_michael_phelps
```

4. Agent-Motion-Auditor (`S7-DS-04`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-design-skeleton/s7-ds-04/plan_michael_phelps
```

5. Agent-Color-Story-Reviewer (`S7-DS-05`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s7-design-skeleton/s7-ds-05/plan_michael_phelps
```

## First instruction to each agent

"Open `docs/design/figma/FIGMA_DESIGN_SKELETON_AGENTS_S7.md` and `guides/backlog/agents/S7_AGENT_ASSIGNMENT_DESIGN_SKELETON_WAVE2.md`. Execute only your lane scope."

## Monitoring

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/parallel_status_s7_design_skeleton.sh
```

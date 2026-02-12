# Agent Launch Commands - Sprint 8 Design Factory Wave 1

Use one terminal per agent to run in parallel.

## Prepare worktrees

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/bootstrap_parallel_agents_s8_design_factory.sh
```

## Commands

1. Agent-Palette-System (`S8-DF-01`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory/s8-df-01/plan_michael_phelps
```

2. Agent-Button-System (`S8-DF-02`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory/s8-df-02/plan_michael_phelps
```

3. Agent-Typography-System (`S8-DF-03`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory/s8-df-03/plan_michael_phelps
```

4. Agent-Motion-System (`S8-DF-04`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory/s8-df-04/plan_michael_phelps
```

5. Agent-Color-Story-System (`S8-DF-05`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory/s8-df-05/plan_michael_phelps
```

6. Agent-Factory-Integrator (`S8-DF-06`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory/s8-df-06/plan_michael_phelps
```

## First instruction to each agent

"Open `docs/design/research/WEB_PRODUCT_BENCHMARKS_S8_2026-02-12.md`, `docs/design/figma/FIGMA_DESIGN_FACTORY_PLAYBOOK_S8.md`, and `guides/backlog/agents/S8_AGENT_ASSIGNMENT_DESIGN_FACTORY_WAVE1.md`, and `guides/backlog/agents/S8_AGENT_PROMPT_LIBRARY_DESIGN_FACTORY.md`. Execute only your lane scope and run mandatory gates before handoff."

## Monitoring

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/parallel_status_s8_design_factory.sh
```

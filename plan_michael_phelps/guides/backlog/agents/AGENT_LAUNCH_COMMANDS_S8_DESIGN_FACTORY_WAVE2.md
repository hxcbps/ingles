# Agent Launch Commands - Sprint 8 Design Factory Wave 2

Use one terminal per agent to run in parallel.

## Prepare worktrees

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/bootstrap_parallel_agents_s8_design_factory_wave2.sh
```

## Commands

1. Agent-Factory-Palette (`S8-DF2-01`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory-wave2/s8-df2-01/plan_michael_phelps
```

2. Agent-Factory-Typography (`S8-DF2-02`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory-wave2/s8-df2-02/plan_michael_phelps
```

3. Agent-Factory-Buttons (`S8-DF2-03`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory-wave2/s8-df2-03/plan_michael_phelps
```

4. Agent-Factory-Motion (`S8-DF2-04`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory-wave2/s8-df2-04/plan_michael_phelps
```

5. Agent-Factory-Story (`S8-DF2-05`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory-wave2/s8-df2-05/plan_michael_phelps
```

6. Agent-Factory-Integrator (`S8-DF2-06`)
```bash
codex --cwd /Users/dfernandez/code/ingles/.codex-worktrees/s8-design-factory-wave2/s8-df2-06/plan_michael_phelps
```

## First instruction to each agent

"Open `guides/backlog/agents/S8_AGENT_ASSIGNMENT_DESIGN_FACTORY_WAVE2.md` and `guides/backlog/agents/S8_AGENT_PROMPT_LIBRARY_DESIGN_FACTORY_WAVE2.md` and execute only your lane scope. Validate with mandatory gates before handoff."

## Monitoring

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/parallel_status_s8_design_factory_wave2.sh
```

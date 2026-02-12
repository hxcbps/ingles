# AGENTS.md - English Sprint Operating Contract

Last reviewed: 2026-02-12
Scope: `/Users/dfernandez/code/ingles`
Primary product root: `plan_michael_phelps/`

## Mission

Build English Sprint as an agent-generated and agent-readable system.
If an artifact is not versioned in this repository, it is out of scope.

## Canonical Architecture Rule

Inside each business domain, dependency flow is fixed:

`Types -> Config -> Repo -> Service -> Runtime -> UI`

Cross-cutting concerns enter only through `Providers`.

Forbidden shortcuts:

- `UI -> Repo`
- `Service -> UI`
- `Runtime -> UI` imports

Source of truth:

- `plan_michael_phelps/docs/architecture/DOMAIN_LAYER_MAP.md`

## Progressive Discovery (mandatory order)

1. `plan_michael_phelps/docs/architecture/README.md`
2. `plan_michael_phelps/docs/architecture/DOMAIN_LAYER_MAP.md`
3. `plan_michael_phelps/docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md`
4. Relevant plan in `plan_michael_phelps/docs/architecture/plans/active/`
5. `plan_michael_phelps/docs/architecture/plans/debt/TECH_DEBT_REGISTER.md`
6. `plan_michael_phelps/docs/architecture/plans/decisions/DECISION_LOG.md`

## Golden Rules

1. Keep architecture docs and code in the same commit when behavior changes.
2. Keep plans as first-class artifacts (`active`, `completed`, `debt`, `decisions`).
3. Do not introduce undocumented domain/layer dependencies.
4. Run mandatory validation commands before commit.
5. Direct commits to `main` are the default workflow for this repository.

## Parallel Agent Orchestration

### Ownership model

- One agent owns one task scope at a time (domain + layer + file set).
- Shared file edits are disallowed in parallel waves unless explicitly sequenced.
- Each task must declare touched paths before coding.

### Worktree protocol

- Use separate worktrees for parallel waves under `.codex-worktrees/`.
- Naming convention: `wave-<sprint>-<task-id>-<agent-role>`.
- Rebase/refresh before integration to avoid hidden conflicts.

### Integration order

- Integrate by dependency order only:
  1. `Types`
  2. `Config`
  3. `Repo`
  4. `Service`
  5. `Runtime`
  6. `UI`
- If a task breaks this order, split it into smaller tasks.

### Handoff contract

Each agent handoff must include:

- Goal completed
- Files changed
- Validation commands run + pass/fail
- Debt/decision updates required

## Agent Roles

### Architecture Agent

Owns boundaries, dependency policy, and decision records.
Must update:

- `plan_michael_phelps/docs/architecture/DOMAIN_LAYER_MAP.md`
- `plan_michael_phelps/docs/architecture/plans/decisions/DECISION_LOG.md`

### Product Domain Agent

Owns CEFR/TBLT progression and content integrity.
Must pass:

- `python3 plan_michael_phelps/scripts/audit_english_sprint.py --repo-root plan_michael_phelps`

### Frontend Runtime Agent

Owns route/session/progression coherence and runtime resilience.
Must preserve runtime contracts and pass JS tests.

### Documentation Review Agent

Owns freshness and structure of architecture docs.
Must pass:

- `python3 plan_michael_phelps/scripts/lint_architecture_docs.py --repo-root plan_michael_phelps`
- `python3 plan_michael_phelps/scripts/check_docs_drift.py --repo-root plan_michael_phelps`

## Definition of Done

A task is done only if all conditions are true:

1. Code/tests updated.
2. Architecture docs updated if boundaries/flows changed.
3. Debt register updated if new gaps were introduced.
4. Decision log updated for non-trivial design decisions.
5. Mandatory validations passed locally.

## Mandatory Validation Commands

- `python3 plan_michael_phelps/scripts/lint_architecture_docs.py --repo-root plan_michael_phelps`
- `python3 plan_michael_phelps/scripts/check_docs_drift.py --repo-root plan_michael_phelps`
- `python3 plan_michael_phelps/scripts/audit_english_sprint.py --repo-root plan_michael_phelps`
- `node --test plan_michael_phelps/app/web/js/tests/*.test.mjs`

## Commit Policy

- Default model: direct commit to `main`.
- Do not open PRs as part of normal execution in this repository.

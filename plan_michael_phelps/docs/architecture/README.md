# Architecture Knowledge Base (Agent-First)

Last reviewed: 2026-02-12
Status: active

This folder is the source of truth for architecture, execution plans, and technical debt for English Sprint.

## Progressive Entry Point

Use this order to avoid context overload:

1. `AGENTS.md` (repo root): global rules and execution protocol.
2. `docs/architecture/DOMAIN_LAYER_MAP.md`: product domains, package roots, and allowed dependencies.
3. `docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md`: quality classification by domain/layer plus trend.
4. `docs/architecture/plans/active/`: current execution plans with progress logs.
5. `docs/architecture/plans/debt/TECH_DEBT_REGISTER.md`: known debt backlog.
6. `docs/architecture/plans/decisions/DECISION_LOG.md`: decision history.

## Artifact Classes

- Lightweight blueprint (ephemeral): design sketch for small changes.
  - Location: `docs/architecture/plans/active/BLUEPRINT-*.md`
- Execution plan (durable): complex work with progress and decisions.
  - Location: `docs/architecture/plans/active/EXEC-*.md`
- Completed plans archive.
  - Location: `docs/architecture/plans/completed/`
- Technical debt register.
  - Location: `docs/architecture/plans/debt/TECH_DEBT_REGISTER.md`

## Mechanical Validation

The knowledge base is validated in CI using:

- `python3 scripts/lint_architecture_docs.py --repo-root .`
- `python3 scripts/check_docs_drift.py --repo-root .`

These checks run in:

- `.github/workflows/quality-gates.yml` (`architecture-docs` job on push/PR)
- `.github/workflows/docs-review.yml` (scheduled documentation review)

Both commands must pass before release.

## Update Protocol

When code changes architecture behavior:

1. Update `DOMAIN_LAYER_MAP.md` if dependencies or package boundaries changed.
2. Update `DOMAIN_LAYER_QUALITY_SCOREBOARD.md` with the affected domains/layers.
3. Log decision deltas in `plans/decisions/DECISION_LOG.md`.
4. Update the active execution plan progress log.
5. Run docs linters and commit in the same change set as code.

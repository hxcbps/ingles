# Plan Registry

Last reviewed: 2026-02-12
Status: active

This folder stores architecture plans as first-class repository artifacts.

## Folder Contract

- `active/`: plans currently being executed.
- `completed/`: immutable record of closed plans.
- `debt/`: known technical debt backlog.
- `decisions/`: architecture decision log tied to plan execution.

## Plan Types

- Ephemeral blueprint: small, lightweight sketch.
  - File pattern: `BLUEPRINT-*.md`
- Execution plan: complex and long-running work.
  - File pattern: `EXEC-*.md`

## Mandatory Sections for Execution Plans

Each `EXEC-*` file must include:

1. Objective
2. Scope
3. Work Breakdown
4. Progress Log (dated entries)
5. Decision Log (linked to `DECISION_LOG.md`)
6. Validation Checklist

## Commands

- `python3 scripts/lint_architecture_docs.py --repo-root .`
- `python3 scripts/check_docs_drift.py --repo-root .`

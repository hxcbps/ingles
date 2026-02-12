#!/usr/bin/env python3
"""Agent Quality Guardian.

Purpose:
- Prevent predictable frontend-ux CI failures.
- Validate active agent-orchestration guardrails.
- Produce a machine-readable report for CI artifacts.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate frontend-ux and agent quality guardrails.")
    parser.add_argument("--repo-root", default=".", help="Path to project root (plan_michael_phelps).")
    parser.add_argument("--json-out", help="Optional output report path.")
    return parser.parse_args()


def detect_git_root(project_root: Path) -> Path:
    current = project_root.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".git").exists():
            return candidate
    return project_root.resolve()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def check_exists(path: Path, errors: list[str], *, executable: bool = False) -> None:
    if not path.exists():
        errors.append(f"Missing required file: {path}")
        return

    if executable and not path.stat().st_mode & 0o111:
        errors.append(f"Required executable script is not executable: {path}")


def check_workflow_contract(workflow_path: Path, errors: list[str], warnings: list[str]) -> None:
    if not workflow_path.exists():
        errors.append(f"Missing workflow file: {workflow_path}")
        return

    text = read_text(workflow_path)

    required_snippets = [
        "frontend-ux:",
        "run_frontend_ux_gates.sh",
        "actions/setup-python@v5",
        "actions/setup-node@v4",
        "ripgrep",
    ]

    for snippet in required_snippets:
        if snippet not in text:
            errors.append(f"Workflow contract missing '{snippet}' in {workflow_path}")

    if "agent-quality-guardian:" not in text:
        warnings.append(f"Workflow has no 'agent-quality-guardian' job: {workflow_path}")


def check_agents_contract(root_agents: Path, project_agents: Path, errors: list[str]) -> None:
    check_exists(root_agents, errors)
    check_exists(project_agents, errors)

    if not root_agents.exists():
        return

    text = read_text(root_agents)
    required = [
        "UI UX Director Agent",
        "Agent Quality Guardian",
        "Parallel Agent Orchestration",
        "Mandatory Validation Commands",
        "run_frontend_ux_gates.sh",
        "agent_quality_guardian.py",
    ]
    for snippet in required:
        if snippet not in text:
            errors.append(f"Root AGENTS contract missing '{snippet}' in {root_agents}")


def check_parallel_script_pairs(scripts_dir: Path, errors: list[str], warnings: list[str]) -> None:
    bootstraps = sorted(scripts_dir.glob("bootstrap_parallel_agents_*.sh"))
    statuses = sorted(scripts_dir.glob("parallel_status_*.sh"))

    if not bootstraps:
        warnings.append(f"No bootstrap_parallel_agents_*.sh scripts found under {scripts_dir}")
        return

    bootstrap_suffixes = {p.stem.replace("bootstrap_parallel_agents_", "") for p in bootstraps}
    status_suffixes = {p.stem.replace("parallel_status_", "") for p in statuses}

    for suffix in sorted(bootstrap_suffixes - status_suffixes):
        errors.append(
            f"Missing parallel status script for bootstrap suffix '{suffix}' (expected parallel_status_{suffix}.sh)"
        )

    for suffix in sorted(status_suffixes - bootstrap_suffixes):
        warnings.append(f"Status script has no matching bootstrap script for suffix '{suffix}'")


def parse_lane_ids(markdown_text: str) -> list[str]:
    return re.findall(r"`([A-Z0-9]+-[A-Z0-9-]+)`", markdown_text)


def check_agent_docs(agents_dir: Path, errors: list[str], warnings: list[str]) -> None:
    assignments = sorted(agents_dir.glob("*AGENT_ASSIGNMENT*.md"))

    if not assignments:
        warnings.append(f"No AGENT_ASSIGNMENT docs found under {agents_dir}")
        return

    for assignment in assignments:
        text = read_text(assignment)
        lane_ids = parse_lane_ids(text)
        duplicates = sorted({lane for lane in lane_ids if lane_ids.count(lane) > 1})
        if duplicates:
            warnings.append(f"Duplicated lane IDs in {assignment.name}: {', '.join(duplicates)}")

        # Enforce stricter structure only for active S6 docs.
        if assignment.name.startswith("S6_") and "## Integration Order" not in text:
            errors.append(f"Missing '## Integration Order' section in active assignment {assignment}")

    # Explicit coherence checks for current UIUX wave.
    s6_assignment = agents_dir / "S6_AGENT_ASSIGNMENT_UIUX_WAVE1.md"
    if s6_assignment.exists():
        status_doc = agents_dir / "EXECUTION_STATUS_S6_UIUX_WAVE1.md"
        launch_doc = agents_dir / "AGENT_LAUNCH_COMMANDS_S6_UIUX.md"
        if not status_doc.exists():
            errors.append(f"Missing execution status for S6 UIUX wave: {status_doc}")
        if not launch_doc.exists():
            errors.append(f"Missing launch commands for S6 UIUX wave: {launch_doc}")


def check_frontend_ux_gate_script(script_path: Path, errors: list[str]) -> None:
    check_exists(script_path, errors, executable=True)
    if not script_path.exists():
        return

    text = read_text(script_path)
    must_have = [
        "Architecture docs lint",
        "Architecture docs drift",
        "English Sprint audit",
        "Web runtime tests",
        "Accessibility CSS checks",
        "UI boundary imports",
        "Route/view ID parity",
        "Token discipline advisory",
    ]

    for snippet in must_have:
        if snippet not in text:
            errors.append(f"Frontend UX gate script missing check '{snippet}' in {script_path}")


def main() -> int:
    args = parse_args()
    project_root = Path(args.repo_root).resolve()

    if not project_root.exists():
        print(f"ERROR: repo root not found: {project_root}", file=sys.stderr)
        return 2

    git_root = detect_git_root(project_root)
    errors: list[str] = []
    warnings: list[str] = []

    check_frontend_ux_gate_script(project_root / "scripts/run_frontend_ux_gates.sh", errors)
    check_agents_contract(git_root / "AGENTS.md", project_root / "AGENTS.md", errors)

    check_workflow_contract(git_root / ".github/workflows/quality-gates.yml", errors, warnings)
    check_workflow_contract(project_root / ".github/workflows/quality-gates.yml", errors, warnings)

    check_parallel_script_pairs(project_root / "scripts", errors, warnings)
    check_agent_docs(project_root / "guides/backlog/agents", errors, warnings)

    report = {
        "project_root": str(project_root),
        "git_root": str(git_root),
        "errors": errors,
        "warnings": warnings,
        "summary": {
            "error_count": len(errors),
            "warning_count": len(warnings),
        },
    }

    if args.json_out:
        out = Path(args.json_out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if errors:
        print("Agent Quality Guardian failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("Agent Quality Guardian passed.")
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

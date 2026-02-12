#!/usr/bin/env python3
"""Validate architecture knowledge-base structure for agent readability."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import unquote

RE_EXTERNAL = re.compile(r"^(https?://|mailto:|tel:)", re.IGNORECASE)
RE_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
RE_LAST_REVIEWED = re.compile(r"^Last reviewed:\s*(\d{4}-\d{2}-\d{2})\s*$", re.MULTILINE)
RE_DEBT_ID = re.compile(r"`(TD-\d{3})`")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lint architecture docs for structure and link integrity.")
    parser.add_argument("--repo-root", default=".", help="Path to project root (plan_michael_phelps).")
    return parser.parse_args()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def check_required_paths(project_root: Path, errors: list[str]) -> list[Path]:
    required_files = [
        "docs/architecture/README.md",
        "docs/architecture/DOMAIN_LAYER_MAP.md",
        "docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md",
        "docs/architecture/plans/README.md",
        "docs/architecture/plans/active/EXEC-ARCH-KB-001.md",
        "docs/architecture/plans/completed/README.md",
        "docs/architecture/plans/debt/TECH_DEBT_REGISTER.md",
        "docs/architecture/plans/decisions/DECISION_LOG.md",
        "AGENTS.md",
    ]

    paths: list[Path] = []
    for rel in required_files:
        path = project_root / rel
        if not path.exists():
            errors.append(f"Missing required artifact: {rel}")
        else:
            paths.append(path)

    for rel_dir in [
        "docs/architecture/plans/active",
        "docs/architecture/plans/completed",
        "docs/architecture/plans/debt",
        "docs/architecture/plans/decisions",
    ]:
        directory = project_root / rel_dir
        if not directory.is_dir():
            errors.append(f"Missing required directory: {rel_dir}")
            continue

        md_files = sorted(directory.glob("*.md"))
        if not md_files:
            errors.append(f"Directory has no markdown artifacts: {rel_dir}")
        else:
            paths.extend(md_files)

    return sorted(set(paths))


def parse_package_roots(map_file: Path, errors: list[str]) -> list[str]:
    text = read_text(map_file)
    lines = text.splitlines()

    in_section = False
    package_roots: list[str] = []

    for line in lines:
        if line.startswith("## Package Roots"):
            in_section = True
            continue
        if in_section and line.startswith("## "):
            break
        if not in_section:
            continue
        if not line.strip().startswith("|"):
            continue

        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if not cells or cells[0] == "Path" or cells[0].startswith("---"):
            continue

        match = re.match(r"`([^`]+)`", cells[0])
        if not match:
            continue

        package_roots.append(match.group(1))

    if not package_roots:
        errors.append("No package roots found in DOMAIN_LAYER_MAP.md section '## Package Roots'.")

    return package_roots


def validate_markdown_links(markdown_files: list[Path], project_root: Path, git_root: Path, errors: list[str]) -> None:
    for path in markdown_files:
        text = read_text(path)
        for raw_link in RE_LINK.findall(text):
            link = raw_link.strip()
            if not link or link.startswith("#") or RE_EXTERNAL.match(link):
                continue

            target = link.split("#", 1)[0].split("?", 1)[0].strip()
            target = unquote(target)
            if not target:
                continue

            if target.startswith("/"):
                resolved = git_root / target.lstrip("/")
            else:
                resolved = (path.parent / target).resolve()

            if not resolved.exists():
                try:
                    rel_origin = path.relative_to(project_root)
                except ValueError:
                    rel_origin = path
                errors.append(f"Broken local link in {rel_origin}: {link}")


def validate_last_reviewed(files: list[Path], project_root: Path, errors: list[str]) -> None:
    for path in files:
        if path.suffix != ".md":
            continue
        text = read_text(path)
        if RE_LAST_REVIEWED.search(text):
            continue

        # Active execution plans may use Started/Updated fields instead of Last reviewed.
        if path.name.startswith("EXEC-"):
            if "Updated:" in text:
                continue

        try:
            rel = path.relative_to(project_root)
        except ValueError:
            rel = path
        errors.append(f"Missing 'Last reviewed' or plan 'Updated' field in: {rel}")


def validate_debt_cross_reference(project_root: Path, errors: list[str]) -> None:
    scoreboard = read_text(project_root / "docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md")
    debt_register = read_text(project_root / "docs/architecture/plans/debt/TECH_DEBT_REGISTER.md")

    debt_ids = set(RE_DEBT_ID.findall(debt_register))
    scoreboard_ids = set(RE_DEBT_ID.findall(scoreboard))

    for debt_id in sorted(debt_ids):
        if debt_id not in scoreboard_ids:
            errors.append(
                f"Debt ID {debt_id} exists in debt register but not referenced in quality scoreboard."
            )


def validate_exec_plan_sections(project_root: Path, errors: list[str]) -> None:
    active_plans = sorted((project_root / "docs/architecture/plans/active").glob("EXEC-*.md"))
    required_sections = [
        "## Objective",
        "## Scope",
        "## Work Breakdown",
        "## Progress Log",
        "## Decision Log",
        "## Validation Checklist",
    ]

    if not active_plans:
        errors.append("No active execution plan found (expected EXEC-*.md in docs/architecture/plans/active).")
        return

    for plan in active_plans:
        text = read_text(plan)
        for section in required_sections:
            if section not in text:
                errors.append(f"{plan.relative_to(project_root)} missing required section: {section}")


def detect_git_root(project_root: Path) -> Path:
    current = project_root.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".git").exists():
            return candidate
    return project_root.resolve()


def main() -> int:
    args = parse_args()
    project_root = Path(args.repo_root).resolve()
    errors: list[str] = []

    if not project_root.exists():
        print(f"ERROR: repo root not found: {project_root}", file=sys.stderr)
        return 2

    git_root = detect_git_root(project_root)

    markdown_files = check_required_paths(project_root, errors)

    map_file = project_root / "docs/architecture/DOMAIN_LAYER_MAP.md"
    if map_file.exists():
        package_roots = parse_package_roots(map_file, errors)
        for rel in package_roots:
            target = project_root / rel
            if not target.exists():
                errors.append(f"Package root declared but missing on disk: {rel}")

    validate_markdown_links(markdown_files, project_root, git_root, errors)
    validate_last_reviewed(markdown_files, project_root, errors)

    if (project_root / "docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md").exists() and (
        project_root / "docs/architecture/plans/debt/TECH_DEBT_REGISTER.md"
    ).exists():
        validate_debt_cross_reference(project_root, errors)

    if (project_root / "docs/architecture/plans/active").exists():
        validate_exec_plan_sections(project_root, errors)

    if errors:
        print("Architecture docs lint failed:")
        for item in errors:
            print(f"- {item}")
        return 1

    print("Architecture docs lint passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

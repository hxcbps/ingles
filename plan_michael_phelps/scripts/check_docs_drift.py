#!/usr/bin/env python3
"""Detect architecture documentation drift against source code contracts."""

from __future__ import annotations

import argparse
import json
import re
import shlex
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Iterable

RE_LAST_REVIEWED = re.compile(r"^Last reviewed:\s*(\d{4}-\d{2}-\d{2})\s*$", re.MULTILINE)
RE_DEBT_ID = re.compile(r"`(TD-\d{3})`")
RE_HASH_ROUTE = re.compile(r"#/[-a-zA-Z0-9_/]+")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check architecture docs drift against runtime contracts.")
    parser.add_argument("--repo-root", default=".", help="Path to project root (plan_michael_phelps).")
    parser.add_argument("--max-doc-age-days", type=int, default=45, help="Maximum age for reviewed docs.")
    parser.add_argument("--json-out", help="Optional JSON output path for CI artifacts.")
    return parser.parse_args()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def detect_git_root(project_root: Path) -> Path:
    current = project_root.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".git").exists():
            return candidate
    return project_root.resolve()


def parse_canonical_routes(routes_file: Path, errors: list[str]) -> tuple[set[str], dict[str, str], dict[str, str]]:
    text = read_text(routes_file)
    if "export const CANONICAL_ROUTES" not in text:
        errors.append("Unable to parse CANONICAL_ROUTES block from canonical_routes_s0.js")
        return set(), {}, {}

    route_entries = re.findall(
        r"([a-zA-Z0-9_]+)\s*:\s*Object\.freeze\(\{\s*id:\s*['\"]([^'\"]+)['\"],\s*hash:\s*['\"]([^'\"]+)['\"]",
        text,
    )

    if not route_entries:
        errors.append("No canonical routes found in CANONICAL_ROUTES block.")
        return set(), {}, {}

    canonical_hashes: set[str] = set()
    hash_by_id: dict[str, str] = {}

    for key, route_id, route_hash in route_entries:
        hash_by_id[route_id] = route_hash
        canonical_hashes.add(route_hash)
        if key != route_id:
            errors.append(f"Route key/id mismatch in canonical routes: key={key} id={route_id}")

    legacy_map: dict[str, str] = {}
    if "export const LEGACY_TO_CANONICAL_HASH" not in text:
        errors.append("Unable to parse LEGACY_TO_CANONICAL_HASH block from canonical_routes_s0.js")
    else:
        for legacy, canonical in re.findall(r"['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]", text):
            if legacy.startswith("#"):
                legacy_map[legacy] = canonical

    missing_legacy_targets = sorted({target for target in legacy_map.values() if target not in canonical_hashes})
    for target in missing_legacy_targets:
        errors.append(f"Legacy route map points to unknown canonical hash: {target}")

    return canonical_hashes, hash_by_id, legacy_map


def extract_route_hashes_from_markdown(path: Path) -> set[str]:
    return set(RE_HASH_ROUTE.findall(read_text(path)))


def check_route_doc_coverage(
    canonical_hashes: set[str],
    legacy_map: dict[str, str],
    project_readme: Path,
    root_readme: Path | None,
    errors: list[str],
) -> None:
    if not project_readme.exists():
        errors.append(f"Missing project README for route documentation: {project_readme}")
        return

    if not canonical_hashes:
        return

    project_hashes = extract_route_hashes_from_markdown(project_readme)
    missing_in_project = sorted(canonical_hashes - project_hashes)
    for route_hash in missing_in_project:
        errors.append(f"Project README missing canonical route hash: {route_hash}")

    legacy_hashes = set(legacy_map.keys())
    if legacy_hashes and not (legacy_hashes & project_hashes):
        errors.append("Project README should reference at least one legacy hash route for migration clarity.")

    if root_readme and root_readme.exists():
        root_hashes = extract_route_hashes_from_markdown(root_readme)
        if not (canonical_hashes & root_hashes):
            errors.append("Root README does not mention any canonical '#/modulo/*' route.")


def check_layer_contract_presence(map_file: Path, root_agents: Path | None, errors: list[str]) -> None:
    canonical_flow = "Types -> Config -> Repo -> Service -> Runtime -> UI"

    map_text = read_text(map_file)
    if canonical_flow not in map_text:
        errors.append("DOMAIN_LAYER_MAP.md missing canonical layer flow string.")

    if root_agents and root_agents.exists():
        agents_text = read_text(root_agents)
        if canonical_flow not in agents_text:
            errors.append("Root AGENTS.md missing canonical layer flow string.")


def check_debt_sync(scoreboard: Path, debt_register: Path, errors: list[str]) -> None:
    scoreboard_text = read_text(scoreboard)
    debt_text = read_text(debt_register)

    scoreboard_ids = set(RE_DEBT_ID.findall(scoreboard_text))
    debt_ids = set(RE_DEBT_ID.findall(debt_text))

    missing_in_scoreboard = sorted(debt_ids - scoreboard_ids)
    missing_in_debt = sorted(scoreboard_ids - debt_ids)

    for debt_id in missing_in_scoreboard:
        errors.append(f"Debt ID present in debt register but missing in scoreboard: {debt_id}")
    for debt_id in missing_in_debt:
        errors.append(f"Debt ID present in scoreboard but missing in debt register: {debt_id}")


def parse_markdown_backtick_commands(path: Path) -> list[str]:
    commands: list[str] = []
    text = read_text(path)
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("-"):
            continue
        for command in re.findall(r"`([^`]+)`", line):
            commands.append(command)
    return commands


def validate_command_targets(commands: Iterable[str], git_root: Path, project_root: Path, errors: list[str]) -> None:
    seen_paths: set[str] = set()

    for command in commands:
        try:
            parts = shlex.split(command)
        except ValueError as exc:
            errors.append(f"Unable to parse command in AGENTS.md: {command} ({exc})")
            continue

        if not parts:
            continue

        candidate_paths: list[str] = []

        if parts[0].startswith("python") and len(parts) >= 2:
            candidate_paths.append(parts[1])

        if "--test" in parts:
            idx = parts.index("--test")
            if idx + 1 < len(parts):
                candidate_paths.append(parts[idx + 1])

        for raw in candidate_paths:
            if raw in seen_paths:
                continue
            seen_paths.add(raw)

            if "*" in raw or "?" in raw:
                hits = list(git_root.glob(raw)) + list(project_root.glob(raw))
                if not hits:
                    errors.append(f"Command target glob has no matches: {raw}")
                continue

            git_target = (git_root / raw).resolve()
            project_target = (project_root / raw).resolve()
            if not git_target.exists() and not project_target.exists():
                errors.append(f"Command target path not found: {raw}")


def parse_last_reviewed(path: Path) -> date | None:
    text = read_text(path)
    match = RE_LAST_REVIEWED.search(text)
    if not match:
        return None
    return datetime.strptime(match.group(1), "%Y-%m-%d").date()


def check_doc_freshness(paths: list[Path], max_age_days: int, errors: list[str]) -> None:
    today = date.today()

    for path in paths:
        reviewed = parse_last_reviewed(path)
        if reviewed is None:
            errors.append(f"Missing Last reviewed field: {path}")
            continue

        age_days = (today - reviewed).days
        if age_days > max_age_days:
            errors.append(
                f"Stale documentation (> {max_age_days} days): {path} (Last reviewed {reviewed.isoformat()}, age={age_days})"
            )


def main() -> int:
    args = parse_args()
    project_root = Path(args.repo_root).resolve()

    if not project_root.exists():
        print(f"ERROR: repo root not found: {project_root}", file=sys.stderr)
        return 2

    git_root = detect_git_root(project_root)

    routes_file = project_root / "app/web/js/routing/canonical_routes_s0.js"
    project_readme = project_root / "README.md"
    root_readme = (git_root / "README.md") if (git_root / "README.md").exists() else None
    map_file = project_root / "docs/architecture/DOMAIN_LAYER_MAP.md"
    scoreboard_file = project_root / "docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md"
    debt_file = project_root / "docs/architecture/plans/debt/TECH_DEBT_REGISTER.md"
    root_agents = (git_root / "AGENTS.md") if (git_root / "AGENTS.md").exists() else None

    required_files = [routes_file, project_readme, map_file, scoreboard_file, debt_file]
    missing = [path for path in required_files if not path.exists()]

    errors: list[str] = []
    for path in missing:
        errors.append(f"Missing required file for drift checks: {path}")

    report: dict[str, object] = {
        "project_root": str(project_root),
        "git_root": str(git_root),
        "errors": [],
        "summary": {},
    }

    if not errors:
        canonical_hashes, hash_by_id, legacy_map = parse_canonical_routes(routes_file, errors)
        check_route_doc_coverage(canonical_hashes, legacy_map, project_readme, root_readme, errors)
        check_layer_contract_presence(map_file, root_agents, errors)
        check_debt_sync(scoreboard_file, debt_file, errors)

        commands: list[str] = []
        if root_agents and root_agents.exists():
            commands.extend(parse_markdown_backtick_commands(root_agents))

        local_agents = project_root / "AGENTS.md"
        if local_agents.exists():
            commands.extend(parse_markdown_backtick_commands(local_agents))

        validate_command_targets(commands, git_root, project_root, errors)

        freshness_targets = [
            project_root / "docs/architecture/README.md",
            map_file,
            scoreboard_file,
            project_root / "docs/architecture/plans/README.md",
            project_root / "docs/architecture/plans/debt/TECH_DEBT_REGISTER.md",
            project_root / "docs/architecture/plans/decisions/DECISION_LOG.md",
        ]
        if root_agents and root_agents.exists():
            freshness_targets.append(root_agents)
        if local_agents.exists():
            freshness_targets.append(local_agents)

        check_doc_freshness(freshness_targets, args.max_doc_age_days, errors)

        report["summary"] = {
            "canonical_routes": hash_by_id,
            "canonical_route_count": len(canonical_hashes),
            "legacy_route_count": len(legacy_map),
            "checked_commands": len(commands),
            "max_doc_age_days": args.max_doc_age_days,
        }

    report["errors"] = errors

    if args.json_out:
        out_path = Path(args.json_out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if errors:
        print("Architecture docs drift check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Architecture docs drift check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

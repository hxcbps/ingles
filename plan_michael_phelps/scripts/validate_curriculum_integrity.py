#!/usr/bin/env python3
"""
Curriculum integrity validator for English Sprint V4.1.

Checks:
- CEFR drift by week target vs step difficulty.
- Empty session_script day plans.
- Prompt reference resolution.
- Resource locator page completeness.
- Placeholder content in required fields.
- Milestone assessment event integrity.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


CEFR_ORDER = {
    "A0": 0,
    "A1": 1,
    "A1+": 2,
    "A2": 3,
    "A2+": 4,
    "B1": 5,
    "B1+": 6,
    "B2": 7,
    "C1": 8,
    "C2": 9,
}

MILESTONE_WEEKS = {1, 5, 10, 15, 20}
PROMPT_TOKEN_RE = re.compile(r"\b[A-Z][A-Z0-9_]{2,}\b")
WEEK_FILENAME_RE = re.compile(r"week(\d+)\.v4\.json$", flags=re.IGNORECASE)
PLACEHOLDER_RE = re.compile(
    r"(http://example\.com|https://\.\.\.|youtube\.com/\.\.\.|\bTBD\b)",
    flags=re.IGNORECASE,
)


@dataclass
class Finding:
    severity: str
    code: str
    message: str
    path: str
    week: int | None = None
    day: str | None = None
    step_id: str | None = None


def normalize_level(raw: Any) -> str:
    text = str(raw or "").upper().strip()
    if not text:
        return ""

    text = text.replace(" ", "")
    text = text.replace("->", "-")

    if text.endswith("+") and text[:-1] in CEFR_ORDER:
        return text

    if text in CEFR_ORDER:
        return text

    if "-" in text:
        parts = [p for p in text.split("-") if p]
        if parts:
            last = parts[-1]
            if last in CEFR_ORDER:
                return last

    if text.endswith("+") and text[:-1] in CEFR_ORDER:
        return text

    return text


def level_rank(raw: Any) -> int | None:
    normalized = normalize_level(raw)
    return CEFR_ORDER.get(normalized)


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_prompt_registry(prompt_pack_path: Path) -> tuple[set[str], str | None]:
    if not prompt_pack_path.exists():
        return set(), f"prompt pack not found: {prompt_pack_path}"

    try:
        text = prompt_pack_path.read_text(encoding="utf-8", errors="ignore")
    except OSError as exc:
        return set(), f"prompt pack could not be read: {exc}"

    registry = set(PROMPT_TOKEN_RE.findall(text))
    if not registry:
        return set(), "prompt pack loaded but no prompt tokens were detected"
    return registry, None


def find_week_files(content_dir: Path) -> list[Path]:
    return sorted(content_dir.glob("week*.v4.json"))


def infer_week_from_filename(path: Path) -> int | None:
    match = WEEK_FILENAME_RE.search(path.name)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def parse_week_number(raw: Any, fallback: int | None = None) -> int | None:
    if raw is None or raw == "":
        return fallback
    if isinstance(raw, bool):
        return fallback
    if isinstance(raw, int):
        return raw
    text = str(raw).strip()
    if not text:
        return fallback
    if text.isdigit():
        return int(text)

    match = re.search(r"\d+", text)
    if match:
        return int(match.group(0))
    return fallback


def as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    return {}


def is_truthy_flag(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}
    return False


def validate_week(
    week_file: Path,
    prompt_registry: set[str],
    prompt_check_enabled: bool,
    findings: list[Finding],
) -> None:
    fallback_week = infer_week_from_filename(week_file)
    try:
        data = load_json(week_file)
    except (OSError, json.JSONDecodeError) as exc:
        findings.append(
            Finding(
                severity="P0",
                code="json-load",
                message=f"unable to parse week file JSON: {exc}",
                path=str(week_file),
                week=fallback_week,
            )
        )
        return

    if not isinstance(data, dict):
        findings.append(
            Finding(
                severity="P0",
                code="schema-integrity",
                message="week file root must be a JSON object",
                path=str(week_file),
                week=fallback_week,
            )
        )
        return

    week = parse_week_number(data.get("week"), fallback=fallback_week)
    week_profile = as_dict(data.get("week_profile"))
    week_target = week_profile.get("cefr_target", "")
    week_target_rank = level_rank(week_target)

    raw_days = data.get("days")
    if raw_days is None:
        days: dict[str, Any] = {}
    elif isinstance(raw_days, dict):
        days = raw_days
    else:
        findings.append(
            Finding(
                severity="P0",
                code="day-structure",
                message="days must be a JSON object keyed by day label",
                path=str(week_file),
                week=week,
            )
        )
        days = {}

    has_milestone_assessment = False

    for day_label, day_data in days.items():
        day_label = str(day_label)
        if not isinstance(day_data, dict):
            findings.append(
                Finding(
                    severity="P1",
                    code="day-structure",
                    message="day payload is not an object",
                    path=str(week_file),
                    week=week,
                    day=day_label,
                )
            )
            continue

        session_script = day_data.get("session_script")
        if not isinstance(session_script, list):
            findings.append(
                Finding(
                    severity="P0",
                    code="session-integrity",
                    message="session_script must be a list",
                    path=str(week_file),
                    week=week,
                    day=day_label,
                )
            )
            session_script = []
        elif len(session_script) == 0:
            findings.append(
                Finding(
                    severity="P0",
                    code="session-integrity",
                    message="session_script is empty",
                    path=str(week_file),
                    week=week,
                    day=day_label,
                )
            )

        if is_truthy_flag(day_data.get("assessment_event")):
            has_milestone_assessment = True

        for idx, step in enumerate(session_script):
            if not isinstance(step, dict):
                findings.append(
                    Finding(
                        severity="P1",
                        code="step-structure",
                        message=f"session step at index {idx} is not an object",
                        path=str(week_file),
                        week=week,
                        day=day_label,
                    )
                )
                continue
            step_id = str(step.get("step_id") or "")

            difficulty = step.get("difficulty_level", "")
            difficulty_rank = level_rank(difficulty)
            if week_target_rank is not None and difficulty_rank is not None and difficulty_rank < week_target_rank:
                findings.append(
                    Finding(
                        severity="P0",
                        code="cefr-drift",
                        message=(
                            f"difficulty_level {difficulty} below week target {week_target}"
                        ),
                        path=str(week_file),
                        week=week,
                        day=day_label,
                        step_id=step_id,
                        )
                    )

            raw_content = step.get("content")
            if raw_content is None:
                content: dict[str, Any] = {}
            elif isinstance(raw_content, dict):
                content = raw_content
            else:
                findings.append(
                    Finding(
                        severity="P1",
                        code="content-structure",
                        message="step content must be an object",
                        path=str(week_file),
                        week=week,
                        day=day_label,
                        step_id=step_id,
                    )
                )
                content = {}

            prompt_ref = content.get("prompt_ref") or step.get("prompt_ref")
            if prompt_ref and prompt_check_enabled:
                prompt_ref = str(prompt_ref).strip()
                if prompt_ref not in prompt_registry:
                    findings.append(
                        Finding(
                            severity="P0",
                            code="prompt-integrity",
                            message=f"prompt_ref '{prompt_ref}' not found in prompt registry",
                            path=str(week_file),
                            week=week,
                            day=day_label,
                            step_id=step_id,
                        )
                    )

            locator = content.get("resource_locator")
            if isinstance(locator, dict):
                if "page" not in locator or locator.get("page") in (None, "", "TBD", "None"):
                    findings.append(
                        Finding(
                            severity="P0",
                            code="resource-locator",
                            message="resource_locator is missing required 'page'",
                            path=str(week_file),
                            week=week,
                            day=day_label,
                            step_id=step_id,
                        )
                    )
            elif locator is not None:
                findings.append(
                    Finding(
                        severity="P1",
                        code="resource-locator",
                        message="resource_locator should be an object when provided",
                        path=str(week_file),
                        week=week,
                        day=day_label,
                        step_id=step_id,
                    )
                )

            url = str(content.get("url") or "")
            instructions = str(content.get("instructions") or "")
            title = str(step.get("title") or "")

            if PLACEHOLDER_RE.search(url) or PLACEHOLDER_RE.search(instructions) or PLACEHOLDER_RE.search(title):
                findings.append(
                    Finding(
                        severity="P0",
                        code="placeholder-content",
                        message="placeholder token detected in required content fields",
                        path=str(week_file),
                        week=week,
                        day=day_label,
                        step_id=step_id,
                    )
                )

    if week is not None and week in MILESTONE_WEEKS and not has_milestone_assessment:
        findings.append(
            Finding(
                severity="P0",
                code="milestone-integrity",
                message="milestone week missing assessment_event: true",
                path=str(week_file),
                week=week,
            )
        )


def summarize(findings: list[Finding]) -> dict[str, int]:
    counts = {"P0": 0, "P1": 0, "P2": 0}
    for finding in findings:
        counts[finding.severity] = counts.get(finding.severity, 0) + 1
    return counts


def print_human_report(findings: list[Finding], repo_root: Path) -> None:
    counts = summarize(findings)
    print("# Curriculum Integrity Report")
    print(f"- Repo root: {repo_root}")
    print(f"- Findings: {len(findings)} (P0={counts.get('P0', 0)}, P1={counts.get('P1', 0)}, P2={counts.get('P2', 0)})")

    for sev in ("P0", "P1", "P2"):
        scoped = [f for f in findings if f.severity == sev]
        if not scoped:
            continue
        print(f"\n## {sev} Findings")
        for f in scoped[:200]:
            scope = []
            if f.week is not None:
                scope.append(f"W{f.week:02d}")
            if f.day:
                scope.append(f.day)
            if f.step_id:
                scope.append(f.step_id)
            scope_text = ":".join(scope)
            if scope_text:
                scope_text = f" ({scope_text})"
            print(f"- [{f.code}] {f.message}{scope_text} [{f.path}]")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate English Sprint curriculum integrity.")
    parser.add_argument("--repo-root", required=True, help="Repository root path")
    parser.add_argument("--json-out", default="", help="Optional JSON output path")
    parser.add_argument("--fail-on-p0", action="store_true", help="Exit non-zero when P0 findings exist")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    content_dir = repo_root / "learning" / "content"
    prompt_pack = repo_root / "learning" / "prompts" / "PROMPT_PACK.md"

    week_files = find_week_files(content_dir)
    if not week_files:
        print(f"No week*.v4.json files found at {content_dir}", file=sys.stderr)
        return 2

    findings: list[Finding] = []
    prompt_registry, prompt_registry_issue = load_prompt_registry(prompt_pack)
    prompt_check_enabled = bool(prompt_registry)
    if prompt_registry_issue:
        findings.append(
            Finding(
                severity="P0",
                code="prompt-registry",
                message=prompt_registry_issue,
                path=str(prompt_pack),
            )
        )

    for week_file in week_files:
        try:
            validate_week(week_file, prompt_registry, prompt_check_enabled, findings)
        except Exception as exc:  # pragma: no cover - defensive safety net
            findings.append(
                Finding(
                    severity="P0",
                    code="validator-crash",
                    message=f"unexpected validator exception: {exc.__class__.__name__}: {exc}",
                    path=str(week_file),
                    week=infer_week_from_filename(week_file),
                )
            )

    print_human_report(findings, repo_root)

    if args.json_out:
        out_path = Path(args.json_out)
        payload = {
            "repo_root": str(repo_root),
            "summary": summarize(findings),
            "findings": [asdict(f) for f in findings],
        }
        if out_path.parent != Path(""):
            out_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            out_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
        except OSError as exc:
            print(f"Failed to write JSON report to {out_path}: {exc}", file=sys.stderr)
            return 2
        print(f"\nWrote JSON report to {out_path}")

    p0_count = sum(1 for f in findings if f.severity == "P0")
    if args.fail_on_p0 and p0_count > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

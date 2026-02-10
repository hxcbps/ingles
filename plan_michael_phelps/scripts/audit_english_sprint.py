#!/usr/bin/env python3
"""Audit English Sprint curriculum/frontend consistency for 0->B2 delivery."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2}
MILESTONE_WEEKS = {1, 5, 10, 15, 20}
CONTENT_DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
CEFR_RANK = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6}

PLACEHOLDER_URL_PATTERNS = [
    re.compile(r"youtube\.com/\.\.\.", re.IGNORECASE),
    re.compile(r"^https?://example\.com", re.IGNORECASE),
    re.compile(r"^https?://\.\.\.$", re.IGNORECASE),
]

PLACEHOLDER_TEXT_PATTERNS = [
    re.compile(r"\bTBD\b", re.IGNORECASE),
    re.compile(r"consolidacion guiada", re.IGNORECASE),
    re.compile(r"watch video about", re.IGNORECASE),
    re.compile(r"complete exercises in unit", re.IGNORECASE),
]

GENERIC_TITLES = {"concept input", "core practice", "activation"}


@dataclass
class Finding:
    severity: str
    category: str
    message: str
    path: str


class Auditor:
    def __init__(self, repo_root: Path) -> None:
        self.repo_root = self._normalize_repo_root(repo_root)
        self.content_dir = self.repo_root / "learning" / "content"
        self.schema_path = self.content_dir / "schema.v4.json"
        self.prompts_path = self.repo_root / "learning" / "prompts" / "PROMPT_PACK.md"
        self.web_dir = self.repo_root / "app" / "web"
        self.findings: list[Finding] = []

    @staticmethod
    def _normalize_repo_root(input_root: Path) -> Path:
        root = input_root.expanduser().resolve()
        if (root / "learning" / "content").exists() and (root / "app" / "web").exists():
            return root
        candidate = root / "plan_michael_phelps"
        if (candidate / "learning" / "content").exists() and (candidate / "app" / "web").exists():
            return candidate
        return root

    def add(self, severity: str, category: str, message: str, path: Path | None = None) -> None:
        rel = "-"
        if path is not None:
            try:
                rel = str(path.resolve().relative_to(self.repo_root.resolve()))
            except Exception:
                rel = str(path)
        self.findings.append(Finding(severity, category, message, rel))

    def run(self) -> None:
        self._sanity_checks()
        self._audit_content()
        self._audit_frontend()

    def _sanity_checks(self) -> None:
        required = [
            self.schema_path,
            self.content_dir / "week01.v4.json",
            self.web_dir / "index.html",
        ]
        for path in required:
            if not path.exists():
                self.add("P0", "project-structure", f"Required path missing: {path.name}", path)

    @staticmethod
    def _safe_load_json(path: Path) -> dict[str, Any] | None:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None

    @staticmethod
    def _cefr_base(value: Any) -> str:
        text = str(value or "").upper()
        match = re.search(r"([ABC][12])", text)
        return match.group(1) if match else ""

    @staticmethod
    def _is_placeholder_url(url: str) -> bool:
        if not url:
            return False
        text = url.strip()
        if text.endswith("/..."):
            return True
        return any(pattern.search(text) for pattern in PLACEHOLDER_URL_PATTERNS)

    @staticmethod
    def _has_placeholder_text(text: str) -> bool:
        if not text:
            return False
        return any(pattern.search(text) for pattern in PLACEHOLDER_TEXT_PATTERNS)

    @staticmethod
    def _step_prompt_ref(step: dict[str, Any]) -> str:
        prompt_ref = step.get("prompt_ref")
        if isinstance(prompt_ref, str) and prompt_ref.strip():
            return prompt_ref.strip()
        content = step.get("content")
        if isinstance(content, dict):
            nested = content.get("prompt_ref")
            if isinstance(nested, str) and nested.strip():
                return nested.strip()
        return ""

    @staticmethod
    def _step_is_fallback(step_id: str) -> bool:
        text = step_id.upper()
        return any(token in text for token in ["_EASY", "_REMEDIAL", "_FALLBACK"])

    def _audit_content(self) -> None:
        if not self.schema_path.exists() or not self.content_dir.exists():
            return

        schema = self._safe_load_json(self.schema_path)
        if schema is None:
            self.add("P0", "schema", "Cannot parse schema.v4.json", self.schema_path)
            return

        schema_types = set(
            schema.get("$defs", {})
            .get("step", {})
            .get("properties", {})
            .get("type", {})
            .get("enum", [])
        )

        week_paths = sorted(self.content_dir.glob("week*.v4.json"))
        if not week_paths:
            self.add("P0", "content", "No weekXX.v4.json files found", self.content_dir)
            return

        prompt_pack_text = ""
        if self.prompts_path.exists():
            prompt_pack_text = self.prompts_path.read_text(encoding="utf-8", errors="ignore")

        used_types: Counter[str] = Counter()
        empty_sessions: list[str] = []
        retention_empty = 0
        retention_total = 0
        generic_title_count = 0

        unresolved_refs: dict[str, list[str]] = defaultdict(list)
        cefr_by_week: dict[int, dict[str, Any]] = {}
        placeholder_urls_by_week: dict[int, list[str]] = defaultdict(list)
        invalid_page_by_week: dict[int, list[str]] = defaultdict(list)
        placeholder_text_by_week: dict[int, list[str]] = defaultdict(list)

        for week_path in week_paths:
            data = self._safe_load_json(week_path)
            if data is None:
                self.add("P0", "content-json", "Invalid JSON", week_path)
                continue

            week = int(data.get("week") or 0)
            target = self._cefr_base(data.get("week_profile", {}).get("cefr_target"))
            days = data.get("days") if isinstance(data.get("days"), dict) else {}

            cefr_by_week[week] = {"target": target, "below": 0, "total": 0, "samples": []}

            day_fingerprints: dict[str, str] = {}

            for day_name in CONTENT_DAY_ORDER:
                day = days.get(day_name)
                if not isinstance(day, dict):
                    self.add("P0", "content-day", f"Missing day object: {day_name}", week_path)
                    continue

                session_script = day.get("session_script")
                if not isinstance(session_script, list):
                    self.add("P0", "content-day", f"session_script is not a list ({day_name})", week_path)
                    continue

                retention_total += 1
                if not day.get("retention_loop"):
                    retention_empty += 1

                if len(session_script) == 0:
                    empty_sessions.append(f"W{week:02d} {day_name}")

                if day_name == "Sun" and week in MILESTONE_WEEKS and day.get("assessment_event") is not True:
                    self.add(
                        "P0",
                        "assessment",
                        f"Milestone week W{week:02d} Sunday should have assessment_event=true",
                        week_path,
                    )

                fingerprint_parts: list[str] = []

                for step in session_script:
                    if not isinstance(step, dict):
                        continue

                    step_id = str(step.get("step_id") or "<no-step-id>")
                    step_type = str(step.get("type") or "")
                    title = str(step.get("title") or "")
                    level = self._cefr_base(step.get("difficulty_level"))
                    content = step.get("content") if isinstance(step.get("content"), dict) else {}
                    instructions = str(content.get("instructions") or "")

                    if step_type:
                        used_types[step_type] += 1

                    if title.strip().lower() in GENERIC_TITLES:
                        generic_title_count += 1

                    if self._has_placeholder_text(title) or self._has_placeholder_text(instructions):
                        placeholder_text_by_week[week].append(f"{day_name}:{step_id}")

                    if not self._step_is_fallback(step_id):
                        target_rank = CEFR_RANK.get(target)
                        level_rank = CEFR_RANK.get(level)
                        if target_rank and level_rank:
                            cefr_by_week[week]["total"] += 1
                            if level_rank < target_rank:
                                cefr_by_week[week]["below"] += 1
                                if len(cefr_by_week[week]["samples"]) < 5:
                                    cefr_by_week[week]["samples"].append(f"{day_name}:{step_id}={level}")

                    url = str(content.get("url") or "")
                    if self._is_placeholder_url(url):
                        placeholder_urls_by_week[week].append(f"{day_name}:{step_id} -> {url}")

                    locator = content.get("resource_locator") if isinstance(content.get("resource_locator"), dict) else None
                    if step_type == "textbook_drill" and locator is None:
                        invalid_page_by_week[week].append(f"{day_name}:{step_id} missing resource_locator")

                    if locator is not None:
                        page = locator.get("page")
                        if not isinstance(page, int):
                            invalid_page_by_week[week].append(f"{day_name}:{step_id} page='{page}'")

                        fallback_url = str(locator.get("fallback_url") or "")
                        if self._is_placeholder_url(fallback_url):
                            placeholder_urls_by_week[week].append(
                                f"{day_name}:{step_id} fallback_url -> {fallback_url}"
                            )

                    prompt_ref = self._step_prompt_ref(step)
                    if prompt_ref and prompt_ref not in prompt_pack_text:
                        unresolved_refs[prompt_ref].append(f"W{week:02d} {day_name}:{step_id}")

                    fingerprint_parts.append(
                        "|".join(
                            [
                                step_type.strip().lower(),
                                title.strip().lower(),
                                instructions.strip().lower(),
                                str(step.get("duration_min") or ""),
                                str(step.get("difficulty_level") or ""),
                            ]
                        )
                    )

                if day_name in {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat"} and fingerprint_parts:
                    day_fingerprints[day_name] = "\n".join(fingerprint_parts)

            reverse_fp: dict[str, list[str]] = defaultdict(list)
            for day_name, fp in day_fingerprints.items():
                reverse_fp[fp].append(day_name)
            for same_days in reverse_fp.values():
                if len(same_days) >= 3:
                    joined = ", ".join(same_days)
                    self.add(
                        "P1",
                        "duplicate-day-design",
                        f"W{week:02d}: duplicated day templates across {joined}",
                        week_path,
                    )

        for week, stats in sorted(cefr_by_week.items()):
            total = stats["total"]
            below = stats["below"]
            target = stats["target"]
            if total == 0:
                continue
            ratio = below / total
            if ratio >= 0.6:
                severity = "P0" if target in {"B2", "C1", "C2"} else "P1"
                sample = ", ".join(stats["samples"])
                self.add(
                    severity,
                    "cefr-drift",
                    f"W{week:02d}: {below}/{total} steps below target {target} (samples: {sample})",
                    self.content_dir / f"week{week:02d}.v4.json",
                )

        for week, records in sorted(placeholder_urls_by_week.items()):
            if not records:
                continue
            sample = "; ".join(records[:3])
            self.add(
                "P0",
                "placeholder-url",
                f"W{week:02d}: {len(records)} placeholder URLs (sample: {sample})",
                self.content_dir / f"week{week:02d}.v4.json",
            )

        for week, records in sorted(invalid_page_by_week.items()):
            if not records:
                continue
            sample = "; ".join(records[:3])
            self.add(
                "P0",
                "resource-locator",
                f"W{week:02d}: {len(records)} locator issues (sample: {sample})",
                self.content_dir / f"week{week:02d}.v4.json",
            )

        for week, records in sorted(placeholder_text_by_week.items()):
            if len(records) >= 3:
                sample = ", ".join(records[:4])
                self.add(
                    "P1",
                    "placeholder-content",
                    f"W{week:02d}: {len(records)} steps with placeholder wording (sample: {sample})",
                    self.content_dir / f"week{week:02d}.v4.json",
                )

        for prompt_ref, usages in sorted(unresolved_refs.items()):
            sample = ", ".join(usages[:3])
            self.add(
                "P0",
                "prompt-integrity",
                f"prompt_ref '{prompt_ref}' not found in PROMPT_PACK.md (sample: {sample})",
                self.prompts_path,
            )

        if empty_sessions:
            sample = ", ".join(empty_sessions[:6])
            self.add(
                "P0",
                "session-integrity",
                f"Empty session_script in {len(empty_sessions)} day plans (sample: {sample})",
                self.content_dir,
            )

        missing_types = sorted(schema_types - set(used_types.keys()))
        if missing_types:
            self.add(
                "P1",
                "method-coverage",
                f"Unused V4 step types: {', '.join(missing_types)}",
                self.schema_path,
            )

        if retention_total > 0 and retention_empty / retention_total >= 0.7:
            self.add(
                "P1",
                "retention-loop",
                f"Retention loop empty in {retention_empty}/{retention_total} day plans",
                self.content_dir,
            )

        if generic_title_count > 20:
            self.add(
                "P1",
                "generic-steps",
                f"High use of generic step titles ({generic_title_count})",
                self.content_dir,
            )

    def _audit_frontend(self) -> None:
        if not self.web_dir.exists():
            return

        index_html_path = self.web_dir / "index.html"
        styles_css_path = self.web_dir / "styles.css"
        layered_css_path = self.web_dir / "css" / "index.css"
        responsive_css_path = self.web_dir / "css" / "responsive.css"
        learning_shell_path = self.web_dir / "js" / "ui" / "learning_shell.js"

        index_html = index_html_path.read_text(encoding="utf-8", errors="ignore") if index_html_path.exists() else ""
        learning_shell = learning_shell_path.read_text(encoding="utf-8", errors="ignore") if learning_shell_path.exists() else ""

        linked_styles = re.findall(r"<link[^>]+href=\"([^\"]+)\"", index_html, flags=re.IGNORECASE)

        if styles_css_path.exists() and layered_css_path.exists():
            self.add(
                "P1",
                "css-entrypoint",
                "Both styles.css and css/index.css exist; choose one canonical entrypoint",
                self.web_dir,
            )

        if any(href.endswith("styles.css") for href in linked_styles) and layered_css_path.exists():
            self.add(
                "P1",
                "css-entrypoint",
                "index.html links styles.css while css/index.css also exists",
                index_html_path,
            )

        css_blob = "\n".join(
            p.read_text(encoding="utf-8", errors="ignore")
            for p in (self.web_dir / "css").glob("*.css")
        )
        js_blob = "\n".join(
            p.read_text(encoding="utf-8", errors="ignore")
            for p in (self.web_dir / "js").rglob("*.js")
        )

        if "is-scrolled" in css_blob and "is-scrolled" not in js_blob:
            self.add(
                "P2",
                "header-scroll",
                "CSS expects '.is-scrolled' but JS toggle not found",
                self.web_dir / "css" / "layout.css",
            )

        if "stats = {" in learning_shell and all(token in learning_shell for token in ["streak", "xp", "accuracy"]):
            self.add(
                "P1",
                "mock-data",
                "Dashboard stats are hardcoded in learning_shell.js",
                learning_shell_path,
            )

        for token in ["Top 1% Local", "Liga de Diamante", "+200 XP", "+50 XP"]:
            if token in learning_shell:
                self.add(
                    "P2",
                    "mock-data",
                    f"Gamification token appears hardcoded: '{token}'",
                    learning_shell_path,
                )

        responsive_text = responsive_css_path.read_text(encoding="utf-8", errors="ignore") if responsive_css_path.exists() else ""
        if responsive_text:
            selector_names = set(re.findall(r"\.([a-zA-Z_][a-zA-Z0-9_-]*)", responsive_text))
            corpus_parts = []
            for path in self.web_dir.rglob("*"):
                if not path.is_file() or path == responsive_css_path:
                    continue
                if path.suffix.lower() not in {".js", ".css", ".html"}:
                    continue
                corpus_parts.append(path.read_text(encoding="utf-8", errors="ignore"))
            corpus = "\n".join(corpus_parts)

            stale = []
            for cls in sorted(selector_names):
                pattern = re.compile(rf"(?<![A-Za-z0-9_-]){re.escape(cls)}(?![A-Za-z0-9_-])")
                if not pattern.search(corpus):
                    stale.append(cls)

            if stale:
                sample = ", ".join(stale[:10])
                self.add(
                    "P1",
                    "stale-responsive-css",
                    f"Potential stale responsive selectors ({len(stale)}), sample: {sample}",
                    responsive_css_path,
                )

        utility_tokens = set(re.findall(r"\b(?:sm|md|lg|xl|2xl):[A-Za-z0-9_\-\[\]/.%]+", learning_shell + "\n" + index_html))
        has_tailwind = bool(list(self.repo_root.glob("**/tailwind.config.*"))) or ("tailwindcss" in index_html.lower())
        if utility_tokens and not has_tailwind:
            sample = ", ".join(sorted(list(utility_tokens))[:8])
            self.add(
                "P1",
                "utility-framework",
                f"Tailwind-style utility classes detected without tailwind config/CDN, sample: {sample}",
                learning_shell_path,
            )

        if "fixed bottom-0" in learning_shell and not re.search(r"\bpb-[0-9]", learning_shell):
            self.add(
                "P2",
                "mobile-overlap",
                "Mobile fixed bottom nav detected without explicit bottom padding utility",
                learning_shell_path,
            )

    def render_markdown(self) -> str:
        findings_sorted = sorted(
            self.findings,
            key=lambda f: (SEVERITY_ORDER.get(f.severity, 99), f.category, f.path, f.message),
        )

        counts = Counter(f.severity for f in findings_sorted)
        total = len(findings_sorted)

        lines: list[str] = []
        lines.append("# English Sprint Audit Report")
        lines.append("")
        lines.append(f"- Repo root: `{self.repo_root}`")
        lines.append(f"- Findings: **{total}** (P0={counts.get('P0', 0)}, P1={counts.get('P1', 0)}, P2={counts.get('P2', 0)})")
        lines.append("")

        if not findings_sorted:
            lines.append("No findings detected.")
            return "\n".join(lines)

        grouped: dict[str, list[Finding]] = defaultdict(list)
        for finding in findings_sorted:
            grouped[finding.severity].append(finding)

        for severity in ["P0", "P1", "P2"]:
            items = grouped.get(severity, [])
            if not items:
                continue
            lines.append(f"## {severity} Findings")
            for item in items:
                lines.append(f"- [{item.category}] {item.message} ({item.path})")
            lines.append("")

        lines.append("## Next Actions")
        lines.append("1. Resolve all P0 issues before feature work.")
        lines.append("2. Resolve P1 issues to stabilize pedagogical and UI consistency.")
        lines.append("3. Resolve P2 polish issues before public launch.")
        lines.append("")

        return "\n".join(lines)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit English Sprint curriculum and frontend consistency")
    parser.add_argument(
        "--repo-root",
        default="/Users/dfernandez/code/ingles/plan_michael_phelps",
        help="Path to plan_michael_phelps root or repository root containing it",
    )
    parser.add_argument("--out", default="", help="Optional path to write markdown report")
    parser.add_argument("--fail-on-p0", action="store_true", help="Exit with code 1 if any P0 findings exist")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    auditor = Auditor(Path(args.repo_root))
    auditor.run()
    report = auditor.render_markdown()

    if args.out:
        out_path = Path(args.out).expanduser().resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(report, encoding="utf-8")
        print(f"Wrote report to {out_path}")
    else:
        print(report)

    has_p0 = any(f.severity == "P0" for f in auditor.findings)
    if args.fail_on_p0 and has_p0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

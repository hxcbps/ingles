#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

REPO_ROOT = Path('/Users/dfernandez/code/ingles')
WT_BASE = REPO_ROOT / '.codex-worktrees' / 's0'

WAVES: Dict[str, List[str]] = {
    'A': ['S0-B01', 'S0-B06'],
    'B': ['S0-B02', 'S0-B03', 'S0-B09'],
    'C': ['S0-B04'],
    'D': ['S0-B05', 'S0-B08'],
    'E': ['S0-B07'],
}

STORY_META = {
    'S0-B01': {
        'slug': 's0-b01',
        'agent': 'Agent-S0-01',
        'prompt': (
            'You are Agent-S0-01 executing S0-B01. '
            'Work ONLY on docs/adr/ADR-001-routing-canonical.md and .agent-workpack/S0-B01.md. '
            'Ensure ADR has canonical routes, legacy alias map, deprecation policy, and validation commands. '
            'Then append execution log in .agent-workpack/S0-B01.md with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files. Keep changes minimal and complete quickly.'
        ),
    },
    'S0-B06': {
        'slug': 's0-b06',
        'agent': 'Agent-S0-06',
        'prompt': (
            'You are Agent-S0-06 executing S0-B06. '
            'Work ONLY on docs/adr/ADR-002-css-entrypoint.md and .agent-workpack/S0-B06.md. '
            'Ensure decision is clear: single CSS entrypoint, migration and deprecation strategy, validation. '
            'Append execution log in .agent-workpack/S0-B06.md with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files. Keep changes minimal and complete quickly.'
        ),
    },
    'S0-B02': {
        'slug': 's0-b02',
        'agent': 'Agent-S0-02',
        'prompt': (
            'You are Agent-S0-02 executing S0-B02. '
            'Work ONLY on app/web/js/routing/canonical_routes_s0.js and .agent-workpack/S0-B02.md. '
            'Harden canonical route definitions and legacy map consistency. '
            'Append execution log in .agent-workpack/S0-B02.md with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files.'
        ),
    },
    'S0-B03': {
        'slug': 's0-b03',
        'agent': 'Agent-S0-03',
        'prompt': (
            'You are Agent-S0-03 executing S0-B03. '
            'Work ONLY on learning/content/schema.v4.1.json, guides/contracts/CONTENT_CONTRACT_V4_1.md, and .agent-workpack/S0-B03.md. '
            'Refine contract text and ensure schema metadata is consistent with v4.1 freeze. '
            'Append execution log in .agent-workpack/S0-B03.md with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files.'
        ),
    },
    'S0-B09': {
        'slug': 's0-b09',
        'agent': 'Agent-S0-09',
        'prompt': (
            'You are Agent-S0-09 executing S0-B09. '
            'Work ONLY on app/web/js/core/events_schema_v1.js, guides/contracts/EVENTS_SCHEMA_V1.md, and .agent-workpack/S0-B09.md. '
            'Ensure event names/envelope are coherent and documented. '
            'Append execution log in .agent-workpack/S0-B09.md with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files.'
        ),
    },
    'S0-B04': {
        'slug': 's0-b04',
        'agent': 'Agent-S0-04',
        'prompt': (
            'You are Agent-S0-04 executing S0-B04. '
            'Work ONLY on scripts/validate_curriculum_integrity.py and .agent-workpack/S0-B04.md. '
            'Improve validator robustness while preserving purpose. '
            'Run python3 scripts/validate_curriculum_integrity.py --repo-root . --json-out /tmp/curriculum_integrity_wave.json. '
            'Append execution log with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files.'
        ),
    },
    'S0-B05': {
        'slug': 's0-b05',
        'agent': 'Agent-S0-05',
        'prompt': (
            'You are Agent-S0-05 executing S0-B05. '
            'Work ONLY on .github/workflows/quality-gates.yml and .agent-workpack/S0-B05.md. '
            'Ensure workflow enforces fail-on-p0 and uploads report artifact. '
            'Append execution log with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files.'
        ),
    },
    'S0-B08': {
        'slug': 's0-b08',
        'agent': 'Agent-S0-08',
        'prompt': (
            'You are Agent-S0-08 executing S0-B08. '
            'Work ONLY on guides/backlog/P0_CONTENT_REMEDIATION_QUEUE.md and .agent-workpack/S0-B08.md. '
            'Verify queue has all P0 findings mapped and improve traceability notes. '
            'Append execution log with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files.'
        ),
    },
    'S0-B07': {
        'slug': 's0-b07',
        'agent': 'Agent-S0-07',
        'prompt': (
            'You are Agent-S0-07 executing S0-B07. '
            'Work ONLY on app/web/index.html, app/web/css/index.css, app/web/styles.css, and .agent-workpack/S0-B07.md. '
            'Ensure single CSS entrypoint policy is reflected and document compatibility notes. '
            'Append execution log with status IN_REVIEW and changed files. '
            'Do not inspect or modify unrelated files.'
        ),
    },
}


@dataclass
class RunResult:
    story: str
    agent: str
    exit_code: int
    timed_out: bool
    duration_sec: float
    log_file: str
    last_file: str


def run_story(story: str, timeout_sec: int, output_dir: Path, results: List[RunResult]) -> None:
    meta = STORY_META[story]
    wt = WT_BASE / meta['slug'] / 'plan_michael_phelps'

    output_dir.mkdir(parents=True, exist_ok=True)
    run_log = output_dir / f'{story}.run.log'
    last_file = output_dir / f'{story}.last.txt'

    cmd = [
        'codex', 'exec',
        '--dangerously-bypass-approvals-and-sandbox',
        '-C', str(wt),
        '-o', str(last_file),
        meta['prompt'],
    ]

    start = time.time()
    timed_out = False
    exit_code = 0

    with run_log.open('w', encoding='utf-8') as log:
        try:
            proc = subprocess.run(cmd, stdout=log, stderr=subprocess.STDOUT, timeout=timeout_sec, check=False)
            exit_code = proc.returncode
        except subprocess.TimeoutExpired:
            timed_out = True
            exit_code = 124

    duration = time.time() - start
    results.append(
        RunResult(
            story=story,
            agent=meta['agent'],
            exit_code=exit_code,
            timed_out=timed_out,
            duration_sec=duration,
            log_file=str(run_log),
            last_file=str(last_file),
        )
    )


def write_report(wave: str, results: List[RunResult], output_dir: Path) -> None:
    report_md = output_dir / f'RUN_REPORT_WAVE_{wave}.md'
    report_json = output_dir / f'RUN_REPORT_WAVE_{wave}.json'

    lines = []
    lines.append(f'# Run Report Wave {wave}')
    lines.append('')
    lines.append('| Story | Agent | Exit | Timeout | Duration(s) | Last Message File | Log File |')
    lines.append('|---|---|---:|---|---:|---|---|')
    for r in sorted(results, key=lambda x: x.story):
        lines.append(
            f"| `{r.story}` | `{r.agent}` | `{r.exit_code}` | `{str(r.timed_out)}` | {r.duration_sec:.1f} | `{r.last_file}` | `{r.log_file}` |"
        )

    report_md.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    payload = [r.__dict__ for r in sorted(results, key=lambda x: x.story)]
    report_json.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + '\n', encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(description='Run sprint wave stories in parallel using codex exec.')
    parser.add_argument('--wave', required=True, choices=sorted(WAVES.keys()))
    parser.add_argument('--timeout-sec', type=int, default=240)
    parser.add_argument('--output-dir', default='/Users/dfernandez/code/ingles/plan_michael_phelps/guides/backlog/agents/runs')
    args = parser.parse_args()

    stories = WAVES[args.wave]
    output_dir = Path(args.output_dir)

    results: List[RunResult] = []
    threads: List[threading.Thread] = []

    for story in stories:
        t = threading.Thread(target=run_story, args=(story, args.timeout_sec, output_dir, results), daemon=False)
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    write_report(args.wave, results, output_dir)

    # Return non-zero if any task failed/timed out
    for r in results:
        if r.exit_code != 0:
            return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

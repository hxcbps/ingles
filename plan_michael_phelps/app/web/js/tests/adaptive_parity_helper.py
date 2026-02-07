#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
import sys
from importlib.machinery import SourceFileLoader
from pathlib import Path


def load_today_module():
    today_path = Path(__file__).resolve().parents[4] / "bin" / "today"
    loader = SourceFileLoader("today_module", str(today_path))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


def main() -> int:
    raw = sys.stdin.read().strip() or "{}"
    payload = json.loads(raw)
    module = load_today_module()
    result = module._evaluate_adaptive_plan(
        history=payload.get("history") or [],
        week_number=int(payload.get("weekNumber", 1)),
        targets=payload.get("targets") or {},
        rubric_average=float(payload.get("rubricAverage", 0) or 0),
    )
    print(
        json.dumps(
            {
                "appliedRules": result.get("appliedRules") or [],
                "extensionRisk": bool(result.get("extensionRisk")),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

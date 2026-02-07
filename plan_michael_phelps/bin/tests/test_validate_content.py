#!/usr/bin/env python3

from __future__ import annotations

import copy
import importlib.util
import unittest
from importlib.machinery import SourceFileLoader
from pathlib import Path


def load_validate_module():
    script_path = Path(__file__).resolve().parents[1] / "validate_content"
    loader = SourceFileLoader("validate_content_module", str(script_path))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


class ValidateContentRulesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = load_validate_module()
        cls.root = Path(__file__).resolve().parents[2]
        resources = cls.mod._read_json(
            cls.root / "learning" / "resources" / "resources_catalog.v1.json"
        )
        books = cls.mod._read_json(cls.root / "learning" / "books" / "book_modules.v1.json")
        cls.resource_ids = {
            str(item.get("id"))
            for item in (resources.get("items") or [])
            if isinstance(item, dict) and item.get("id")
        }
        cls.book_ids = {
            str(item.get("id"))
            for item in (books.get("modules") or [])
            if isinstance(item, dict) and item.get("id")
        }

    def _load_week(self, week_number: int) -> dict:
        return self.mod._read_json(
            self.root / "learning" / "content" / f"week{week_number:02d}.json"
        )

    def test_fails_with_invalid_resource_id(self):
        week = self._load_week(10)
        data = copy.deepcopy(week)
        data["days"]["Mon"]["resource_pack"][0]["id"] = "invalid_resource_id"

        errors = self.mod.validate_week_file_v3(
            Path("week10.json"), data, self.resource_ids, self.book_ids
        )
        self.assertTrue(any("unknown resource id 'invalid_resource_id'" in err for err in errors))

    def test_fails_with_invalid_book_module(self):
        week = self._load_week(10)
        data = copy.deepcopy(week)
        data["days"]["Mon"]["book_modules"][0] = "invalid_book_module"

        errors = self.mod.validate_week_file_v3(
            Path("week10.json"), data, self.resource_ids, self.book_ids
        )
        self.assertTrue(any("unknown book modules ['invalid_book_module']" in err for err in errors))

    def test_fails_when_checkpoint_cefr_is_wrong(self):
        week = self._load_week(15)
        data = copy.deepcopy(week)
        data["week_profile"]["cefr_target"] = "B1"

        errors = self.mod.validate_week_file_v3(
            Path("week15.json"), data, self.resource_ids, self.book_ids
        )
        self.assertTrue(any("cefr_target must be 'B2-'" in err for err in errors))


if __name__ == "__main__":
    unittest.main()

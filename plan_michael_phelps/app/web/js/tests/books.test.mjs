import test from "node:test";
import assert from "node:assert/strict";

import {
  flattenBookModules,
  listWeekBookModules,
  markBookModuleComplete,
  summarizeBookProgress
} from "../domain/books.js";

const week = {
  bookModulesByTrack: {
    grammar: ["g1"],
    vocabulary: ["v1", "v2"],
    pronunciation: ["p1"],
    reader: ["r1"],
    theory: ["t1"]
  }
};

test("books returns grouped and flattened modules", () => {
  const grouped = listWeekBookModules(week);
  assert.deepEqual(grouped.grammar, ["g1"]);

  const flat = flattenBookModules(week);
  assert.equal(flat.length, 6);
  assert.equal(flat.includes("t1"), true);
});

test("books progress marks completion and summarizes", () => {
  let progress = { completed: [], last_week: 0 };
  progress = markBookModuleComplete(progress, "g1", 3);
  progress = markBookModuleComplete(progress, "v1", 3);

  const summary = summarizeBookProgress(progress, week);
  assert.equal(summary.done, 2);
  assert.equal(summary.total, 6);
  assert.equal(summary.percent, 33);
});

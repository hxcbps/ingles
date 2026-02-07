import test from "node:test";
import assert from "node:assert/strict";

import { getProgramContext } from "../content/day_model.js";

test("getProgramContext computes weekday minutes and labels", () => {
  const config = {
    start_date: "2026-01-26",
    program_weeks: 16,
    daily_minutes: 120,
    sunday_minutes: 300
  };

  const mondayNoon = new Date(2026, 0, 26, 12, 0, 0);
  const context = getProgramContext(config, mondayNoon);

  assert.equal(context.isoDate, "2026-01-26");
  assert.equal(context.dayLabel, "Mon");
  assert.equal(context.weekNumber, 1);
  assert.equal(context.weekLabel, "01");
  assert.equal(context.sessionMinutes, 120);
  assert.equal(context.isSunday, false);
});

test("getProgramContext uses sunday minutes", () => {
  const config = {
    start_date: "2026-01-26",
    program_weeks: 16,
    daily_minutes: 120,
    sunday_minutes: 300
  };

  const sundayNoon = new Date(2026, 1, 1, 12, 0, 0);
  const context = getProgramContext(config, sundayNoon);

  assert.equal(context.dayLabel, "Sun");
  assert.equal(context.isSunday, true);
  assert.equal(context.sessionMinutes, 300);
  assert.equal(context.weekNumber, 1);
  assert.equal(context.weekLabel, "01");
});

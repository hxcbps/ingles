import test from "node:test";
import assert from "node:assert/strict";

import { generateDailyExercises } from "../domain/exercise_engine.js";

test("exercise engine includes adaptive extras", () => {
  const dayView = {
    dailyExercises: [
      { type: "retrieval_quiz", instructions: "base", output: "ok" },
      { type: "roleplay_task", instructions: "base", output: "ok" }
    ]
  };

  const plan = {
    appliedRules: ["turn_length_support", "pronunciation_intensive_week"]
  };

  const exercises = generateDailyExercises(dayView, plan);
  const types = exercises.map((item) => item.type);

  assert.equal(types.includes("retrieval_quiz"), true);
  assert.equal(types.includes("roleplay_task"), true);
  assert.equal(types.includes("pron_shadow_task"), true);
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function dedupeByType(exercises) {
  const seen = new Set();
  const unique = [];

  exercises.forEach((exercise) => {
    const type = String(exercise?.type || "").trim();
    if (!type || seen.has(type)) return;
    seen.add(type);
    unique.push(exercise);
  });

  return unique;
}

function baseAdaptiveExercises(adaptivePlan) {
  const rules = asArray(adaptivePlan?.appliedRules);
  const extras = [];

  if (rules.includes("turn_length_support")) {
    extras.push({
      type: "roleplay_task",
      instructions: "Long-turn support: answer 90 seconds with structure (point, reason, example).",
      output: "3 long turns recorded"
    });
  }

  if (rules.includes("error_density_precision_cycle")) {
    extras.push({
      type: "error_rewrite",
      instructions: "Precision cycle: rewrite 12 high-frequency errors with explanation.",
      output: "12 corrected patterns"
    });
  }

  if (rules.includes("pronunciation_intensive_week")) {
    extras.push({
      type: "pron_shadow_task",
      instructions: "Pronunciation intensive: 10 extra minutes of shadowing and final consonants.",
      output: "Extra pronunciation audio"
    });
  }

  if (rules.includes("repair_success_boost")) {
    extras.push({
      type: "repair_drill",
      instructions: "Repair boost: simulate 5 misunderstandings and recover in English.",
      output: "5 successful repairs"
    });
  }

  return extras;
}

export function generateDailyExercises(dayView, adaptivePlan) {
  const core = asArray(dayView?.dailyExercises || dayView?.daily_exercises);
  const extras = baseAdaptiveExercises(adaptivePlan);

  return dedupeByType([...core, ...extras]);
}

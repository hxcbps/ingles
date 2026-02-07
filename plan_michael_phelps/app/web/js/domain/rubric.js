export const RUBRIC_FIELDS = [
  { id: "fluency", label: "Fluency" },
  { id: "accuracy", label: "Accuracy" },
  { id: "interaction", label: "Interaction" },
  { id: "pronunciation", label: "Pronunciation" }
];

export function clampRubricScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

export function getDefaultScores() {
  return {
    fluency: 0,
    accuracy: 0,
    interaction: 0,
    pronunciation: 0
  };
}

export function normalizeScores(scores) {
  const base = getDefaultScores();
  return {
    fluency: clampRubricScore(scores?.fluency ?? base.fluency),
    accuracy: clampRubricScore(scores?.accuracy ?? base.accuracy),
    interaction: clampRubricScore(scores?.interaction ?? base.interaction),
    pronunciation: clampRubricScore(scores?.pronunciation ?? base.pronunciation)
  };
}

export function summarizeRubric(scores, rubricTargets) {
  const normalized = normalizeScores(scores);
  let total = 0;
  let metTargets = 0;

  RUBRIC_FIELDS.forEach((field) => {
    total += normalized[field.id];
    const target = Number(rubricTargets?.[field.id]?.target || 2);
    if (normalized[field.id] >= target) metTargets += 1;
  });

  return {
    average: (total / RUBRIC_FIELDS.length).toFixed(2),
    metTargets,
    totalTargets: RUBRIC_FIELDS.length,
    scores: normalized
  };
}

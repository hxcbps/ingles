function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function listWeekBookModules(weekData) {
  const modules = asObject(weekData?.bookModulesByTrack || weekData?.book_modules);
  return {
    grammar: asArray(modules.grammar),
    vocabulary: asArray(modules.vocabulary),
    pronunciation: asArray(modules.pronunciation),
    reader: asArray(modules.reader),
    theory: asArray(modules.theory)
  };
}

export function flattenBookModules(weekData) {
  const grouped = listWeekBookModules(weekData);
  return [
    ...grouped.grammar,
    ...grouped.vocabulary,
    ...grouped.pronunciation,
    ...grouped.reader,
    ...grouped.theory
  ];
}

export function normalizeBookProgress(progress) {
  const safe = asObject(progress);
  return {
    completed: asArray(safe.completed),
    last_week: Number.isInteger(Number(safe.last_week)) ? Number(safe.last_week) : 0
  };
}

export function markBookModuleComplete(progress, moduleId, weekNumber) {
  const current = normalizeBookProgress(progress);
  if (!moduleId || typeof moduleId !== "string") return current;

  const completed = current.completed.includes(moduleId)
    ? current.completed
    : [...current.completed, moduleId];

  return {
    completed,
    last_week: Math.max(current.last_week, Number(weekNumber) || 0)
  };
}

export function summarizeBookProgress(progress, weekData) {
  const current = normalizeBookProgress(progress);
  const required = flattenBookModules(weekData);
  const done = required.filter((id) => current.completed.includes(id)).length;
  const total = required.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return {
    done,
    total,
    percent,
    missing: required.filter((id) => !current.completed.includes(id))
  };
}

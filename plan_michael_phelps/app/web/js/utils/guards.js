export function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function asPositiveInteger(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function assertDayData(dayData, dayLabel) {
  if (!isObject(dayData)) {
    throw new Error(`No day data for ${dayLabel}`);
  }

  if (!Array.isArray(dayData.blocks) || dayData.blocks.length === 0) {
    throw new Error(`Invalid blocks for ${dayLabel}`);
  }

  if (!isObject(dayData.sesame) || !isNonEmptyString(dayData.sesame.prompt)) {
    throw new Error(`Invalid sesame prompt for ${dayLabel}`);
  }

  if (Array.isArray(dayData.daily_exercises) && dayData.daily_exercises.length === 0) {
    throw new Error(`Invalid daily_exercises for ${dayLabel}`);
  }
}

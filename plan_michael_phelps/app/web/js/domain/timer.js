export function getDefaultTimer(sessionMinutes) {
  return {
    remainingSeconds: Math.max(1, Number(sessionMinutes) || 120) * 60,
    running: false,
    lastTick: null
  };
}

export function normalizeTimer(timer, sessionMinutes) {
  const defaults = getDefaultTimer(sessionMinutes);
  return {
    remainingSeconds: Number.isFinite(Number(timer?.remainingSeconds))
      ? Math.max(0, Math.floor(Number(timer.remainingSeconds)))
      : defaults.remainingSeconds,
    running: Boolean(timer?.running),
    lastTick:
      typeof timer?.lastTick === "number" && Number.isFinite(timer.lastTick)
        ? timer.lastTick
        : null
  };
}

export function startTimer(timer, nowMs = Date.now(), sessionMinutes = 120) {
  const normalized = normalizeTimer(timer, sessionMinutes);
  if (normalized.remainingSeconds <= 0) {
    normalized.remainingSeconds = Math.max(1, sessionMinutes) * 60;
  }
  normalized.running = true;
  normalized.lastTick = nowMs;
  return normalized;
}

export function pauseTimer(timer, sessionMinutes = 120) {
  const normalized = normalizeTimer(timer, sessionMinutes);
  normalized.running = false;
  normalized.lastTick = null;
  return normalized;
}

export function resetTimer(sessionMinutes = 120) {
  return getDefaultTimer(sessionMinutes);
}

export function tickTimer(timer, nowMs = Date.now(), sessionMinutes = 120) {
  const normalized = normalizeTimer(timer, sessionMinutes);
  if (!normalized.running) {
    return { timer: normalized, completed: normalized.remainingSeconds === 0 };
  }

  const lastTick = normalized.lastTick || nowMs;
  const elapsed = Math.max(0, Math.floor((nowMs - lastTick) / 1000));

  if (elapsed > 0) {
    normalized.remainingSeconds = Math.max(0, normalized.remainingSeconds - elapsed);
    normalized.lastTick = nowMs;
  }

  if (normalized.remainingSeconds === 0) {
    normalized.running = false;
    normalized.lastTick = null;
    return { timer: normalized, completed: true };
  }

  return { timer: normalized, completed: false };
}

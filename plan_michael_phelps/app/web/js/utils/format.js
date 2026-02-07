export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("-").map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n) || n <= 0)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function floorDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatHMS(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(safeSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function formatWeekLabel(weekNumber) {
  return String(weekNumber).padStart(2, "0");
}

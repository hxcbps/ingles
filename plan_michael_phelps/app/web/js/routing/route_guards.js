import { CHECK_ITEMS } from "../domain/checklist.js";

const CORE_EXECUTION_ITEMS = CHECK_ITEMS.map((item) => item.id).filter((id) => id !== "evidence");

function isChecked(checklist, field) {
  return Boolean(checklist && checklist[field]);
}

export function evaluateSoftGuard({ routeId, checklist = {} } = {}) {
  const missingCore = CORE_EXECUTION_ITEMS.filter((itemId) => !isChecked(checklist, itemId));
  const evidenceReady = isChecked(checklist, "evidence");

  if (routeId === "close" && missingCore.length > 0) {
    return {
      level: "warning",
      message: `Faltan bloques de ejecucion (${missingCore.length}/4) antes del cierre final.`,
      recommendedRouteId: "session"
    };
  }

  if (routeId === "evaluate" && !evidenceReady) {
    return {
      level: "warning",
      message: "Completa evidencia antes de evaluar para que el dia cuente.",
      recommendedRouteId: "close"
    };
  }

  return {
    level: "none",
    message: "",
    recommendedRouteId: routeId || "action"
  };
}

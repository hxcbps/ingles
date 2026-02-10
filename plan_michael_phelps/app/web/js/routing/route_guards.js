import { CHECK_ITEMS } from "../domain/checklist.js";

const CORE_EXECUTION_ITEMS = CHECK_ITEMS.map((item) => item.id).filter((id) => id !== "evidence");

function isChecked(checklist, field) {
  return Boolean(checklist && checklist[field]);
}

export function evaluateSoftGuard({ routeId, checklist = {} } = {}) {
  const missingCore = CORE_EXECUTION_ITEMS.filter((itemId) => !isChecked(checklist, itemId));
  const evidenceReady = isChecked(checklist, "evidence");

  if (routeId === "cierre" && missingCore.length > 0) {
    return {
      level: "warning",
      message: `Faltan bloques de ejecucion (${missingCore.length}/4) antes del cierre final.`,
      recommendedRouteId: "sesion"
    };
  }

  if (routeId === "evaluacion" && !evidenceReady) {
    return {
      level: "warning",
      message: "Completa evidencia antes de evaluar para que el dia cuente.",
      recommendedRouteId: "cierre"
    };
  }

  return {
    level: "none",
    message: "",
    recommendedRouteId: routeId || "hoy"
  };
}

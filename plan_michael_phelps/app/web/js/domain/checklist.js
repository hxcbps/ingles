export const CHECK_ITEMS = [
  { id: "listening", label: "Listening completado" },
  { id: "speaking", label: "Speaking Sesame completado" },
  { id: "reading", label: "Reading completado" },
  { id: "writing", label: "Writing completado" },
  { id: "evidence", label: "Evidencia guardada" }
];

export function getDefaultChecklist() {
  return {
    listening: false,
    speaking: false,
    reading: false,
    writing: false,
    evidence: false
  };
}

export function getChecklistProgress(checklist) {
  const values = CHECK_ITEMS.map((item) => Boolean(checklist[item.id]));
  const done = values.filter(Boolean).length;
  const total = values.length;
  return {
    done,
    total,
    percent: Math.round((done / total) * 100)
  };
}

export function getNextAction(checklist) {
  if (!checklist.listening) return "1) Ejecuta listening intensivo.";
  if (!checklist.speaking) return "2) Haz las rondas de Sesame.";
  if (!checklist.reading) return "3) Completa reading activo.";
  if (!checklist.writing) return "4) Completa writing con salida minima.";
  if (!checklist.evidence) return "5) Guarda evidencia y registra metricas.";
  return "Dia completo. Cierra con revision corta y plan de mejora.";
}

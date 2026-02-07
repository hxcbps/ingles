import { formatWeekLabel } from "../../utils/format.js";

export function buildHeaderStatusMessage(program, config) {
  return `${program.isoDate} | Inicio ${program.startDateISO} | ${program.dayLabel} | ${config.domain} | CEFR ${program.targetCEFR} | ${program.paceMode}`;
}

export function renderHeader(dom, program, config, dayMinutes, setStatusLine) {
  const totalWeeks = Number.isInteger(Number(program.effectiveProgramWeeks))
    ? Number(program.effectiveProgramWeeks)
    : Number(program.programWeeks);
  const message = buildHeaderStatusMessage(program, config);

  if (typeof setStatusLine === "function") {
    setStatusLine(message);
  } else {
    dom.statusLine.textContent = message;
  }

  dom.sessionPill.textContent = `${dayMinutes} min`;
  dom.weekPill.textContent = `Semana ${program.weekLabel}/${formatWeekLabel(totalWeeks)}`;
}

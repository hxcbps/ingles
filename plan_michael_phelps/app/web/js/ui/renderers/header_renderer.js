import { formatWeekLabel } from "../../utils/format.js";

export function buildHeaderStatusMessage(program, config) {
  return `Dia ${program.dayLabel} | Semana ${program.weekLabel}/${formatWeekLabel(program.effectiveProgramWeeks || program.programWeeks)} | CEFR ${program.targetCEFR} | Dominio ${config.domain}`;
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

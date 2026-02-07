import { formatWeekLabel } from "../../utils/format.js";

export function renderHeader(dom, program, config, dayMinutes) {
  const totalWeeks = Number.isInteger(Number(program.effectiveProgramWeeks))
    ? Number(program.effectiveProgramWeeks)
    : Number(program.programWeeks);
  dom.statusLine.textContent = `${program.isoDate} | Inicio ${program.startDateISO} | ${program.dayLabel} | ${
    config.domain
  } | CEFR ${program.targetCEFR} | ${program.paceMode}`;
  dom.sessionPill.textContent = `${dayMinutes} min`;
  dom.weekPill.textContent = `Semana ${program.weekLabel}/${formatWeekLabel(totalWeeks)}`;
}

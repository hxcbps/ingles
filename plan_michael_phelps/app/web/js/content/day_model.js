import { floorDate, formatWeekLabel, parseISODate, toISODate } from "../utils/format.js";
import { asPositiveInteger, asString, assertDayData } from "../utils/guards.js";

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getProgramContext(config, now = new Date()) {
  const today = floorDate(now);
  const startDate = floorDate(parseISODate(config.start_date) || today);
  const diffDays = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
  const weekNumber = Math.max(1, Math.floor(diffDays / 7) + 1);
  const weekLabel = formatWeekLabel(weekNumber);
  const dayLabel = DAY_LABELS[today.getDay()];
  const isSunday = dayLabel === "Sun";

  const dailyMinutes = asPositiveInteger(config.daily_minutes, 120);
  const sundayMinutes = asPositiveInteger(config.sunday_minutes, 300);

  return {
    isoDate: toISODate(today),
    dayLabel,
    isSunday,
    weekNumber,
    weekLabel,
    programWeeks: asPositiveInteger(config.program_weeks, 20),
    sessionMinutes: isSunday ? sundayMinutes : dailyMinutes,
    startDateISO: toISODate(startDate),
    targetCEFR: asString(config.target_cefr, "B2"),
    paceMode: asString(config.pace_mode, "accelerated_sustainable"),
    conversationScope: asString(config.conversation_scope, "general_tech_balanced")
  };
}

function asWeeklyTargets(focus) {
  const items = [];
  (focus?.grammar || []).forEach((item) => items.push(`Grammar: ${item}`));
  (focus?.functions || []).forEach((item) => items.push(`Function: ${item}`));
  (focus?.pronunciation || []).forEach((item) => items.push(`Pronunciation: ${item}`));
  return items;
}

function asSessionPlan(blocks) {
  return (blocks || []).map((block) => `(${block.minutes}') ${block.name}: ${block.instructions}`);
}

export function toViewModel(program, weekData, weekPath) {
  const dayData = weekData?.days?.[program.dayLabel];
  assertDayData(dayData, program.dayLabel);

  const evidencePath = `/Users/dfernandez/ingles/plan_michael_phelps/tracking/daily/${program.isoDate}/`;

  return {
    week: {
      title: asString(weekData?.title, "Semana"),
      targets: asWeeklyTargets(weekData?.focus),
      gateChecks: Array.isArray(weekData?.weekly_gate?.checks) ? weekData.weekly_gate.checks : [],
      profile: weekData?.week_profile || {},
      bookModulesByTrack: weekData?.book_modules || {},
      adaptiveOverrides: Array.isArray(weekData?.adaptive_overrides) ? weekData.adaptive_overrides : [],
      assessment: weekData?.assessment || {},
      sourcePath: `/Users/dfernandez/ingles/plan_michael_phelps${weekPath}`
    },
    day: {
      minutes: asPositiveInteger(dayData.minutes, program.sessionMinutes),
      goal: asString(dayData.goal, "No goal available"),
      taskDesign: asString(dayData.task_design, "No task design available"),
      readingOutput: asString(dayData?.reading?.output, "N/A"),
      writingOutput: asString(dayData?.writing?.output, "N/A"),
      prompt: asString(dayData?.sesame?.prompt, "No prompt available"),
      rounds: Array.isArray(dayData?.sesame?.rounds) ? dayData.sesame.rounds : [],
      sessionPlan: asSessionPlan(dayData.blocks),
      deliverables: Array.isArray(dayData.deliverables) ? dayData.deliverables : [],
      dailyGate: asString(dayData.daily_gate, "N/A"),
      rubric: dayData.rubric || {},
      metrics: dayData.metrics || {},
      metricsTargets: dayData.metrics_targets || {},
      dailyExercises: Array.isArray(dayData.daily_exercises) ? dayData.daily_exercises : [],
      resourcePack: Array.isArray(dayData.resource_pack) ? dayData.resource_pack : [],
      bookModules: Array.isArray(dayData.book_modules) ? dayData.book_modules : [],
      adaptiveOverrides: Array.isArray(dayData.adaptive_overrides) ? dayData.adaptive_overrides : [],
      evidencePath,
      missionBullets: [
        `Task design: ${asString(dayData.task_design, "N/A")}`,
        `Reading output: ${asString(dayData?.reading?.output, "N/A")}`,
        `Writing output: ${asString(dayData?.writing?.output, "N/A")}`,
        `Daily gate: ${asString(dayData.daily_gate, "N/A")}`,
        `CEFR target: ${asString(weekData?.week_profile?.cefr_target, "N/A")}`
      ]
    }
  };
}

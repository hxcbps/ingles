import { formatWeekLabel } from "../utils/format.js";
import { asPositiveInteger } from "../utils/guards.js";

export const FALLBACK_CONFIG = {
  start_date: "",
  program_weeks: 20,
  daily_minutes: 120,
  sunday_minutes: 300,
  content_version: "v4", // FORCE V4 DEFAULT
  target_cefr: "B2",
  pace_mode: "accelerated_sustainable",
  conversation_scope: "general_tech_balanced",
  domain_mix_default: {
    general: 60,
    tech: 40
  },
  adaptation_enabled: true,
  book_track_enabled: true,
  checkpoint_weeks: [1, 5, 10, 15, 20],
  extension_policy: {
    enabled: true,
    min_weeks: 8,
    max_weeks: 12
  },
  focus_mode: "sesame_only",
  domain: "general_tech_balanced"
};

const ROOT_RELATIVE_PREFIX = "../../";

function fromWebRoot(path) {
  return `${ROOT_RELATIVE_PREFIX}${path}`;
}

function mergeConfig(data) {
  return {
    ...FALLBACK_CONFIG,
    ...(data || {}),
    program_weeks: asPositiveInteger(data?.program_weeks, FALLBACK_CONFIG.program_weeks),
    daily_minutes: asPositiveInteger(data?.daily_minutes, FALLBACK_CONFIG.daily_minutes),
    sunday_minutes: asPositiveInteger(data?.sunday_minutes, FALLBACK_CONFIG.sunday_minutes)
  };
}

async function fetchJSON(path, fetcher = fetch) {
  const response = await fetcher(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  return await response.json();
}

export function buildWeekContentPath(weekLabel) {
  return fromWebRoot(`learning/content/week${formatWeekLabel(Number(weekLabel))}.json`);
}

export function buildWeekContentV4Path(weekLabel) {
  return fromWebRoot(`learning/content/week${formatWeekLabel(Number(weekLabel))}.v4.json`);
}

export async function loadConfig(fetcher = fetch) {
  try {
    const data = await fetchJSON(fromWebRoot("config/settings.json"), fetcher);
    return mergeConfig(data);
  } catch {
    return { ...FALLBACK_CONFIG };
  }
}

export async function loadWeekContent(weekLabel, fetcher = fetch) {
  const path = buildWeekContentPath(weekLabel);
  const data = await fetchJSON(path, fetcher);
  return { path, data };
}

export async function loadWeekContentV4(weekLabel, fetcher = fetch) {
  const path = buildWeekContentV4Path(weekLabel);
  const data = await fetchJSON(path, fetcher);
  return { path, data };
}

export async function loadWeekSummariesV4({ fromWeek = 1, toWeek = 20, fetcher = fetch } = {}) {
  const startWeek = Math.max(1, asPositiveInteger(fromWeek, 1));
  const endWeek = Math.max(startWeek, asPositiveInteger(toWeek, startWeek));
  const tasks = [];

  for (let week = startWeek; week <= endWeek; week += 1) {
    tasks.push(
      loadWeekContentV4(week, fetcher)
        .then(({ path, data }) => ({
          week,
          path,
          title: data?.title || `Week ${formatWeekLabel(week)}`,
          week_profile: data?.week_profile || {},
          days: data?.days || {}
        }))
        .catch(() => null)
    );
  }

  const loaded = await Promise.all(tasks);
  return loaded
    .filter(Boolean)
    .sort((a, b) => Number(a.week) - Number(b.week));
}

export async function loadResourcesCatalog(fetcher = fetch) {
  const path = fromWebRoot("learning/resources/resources_catalog.v1.json");
  const data = await fetchJSON(path, fetcher);
  return { path, data };
}

export async function loadBookModulesRegistry(fetcher = fetch) {
  const path = fromWebRoot("learning/books/book_modules.v1.json");
  const data = await fetchJSON(path, fetcher);
  return { path, data };
}

export async function loadModuleBlueprint(fetcher = fetch) {
  const path = fromWebRoot("learning/syllabus/modules_0_b2.v1.json");

  try {
    const data = await fetchJSON(path, fetcher);
    return { path, data };
  } catch {
    return {
      path,
      data: {
        version: "v1",
        title: "Ruta 0 a B2",
        target_cefr: "B2",
        total_weeks: 20,
        methodology_pillars: [],
        weekly_rhythm: [],
        modules: []
      }
    };
  }
}

export async function loadAdaptiveHistory(fetcher = fetch) {
  const path = fromWebRoot("tracking/state/adaptive_history.v1.json");
  try {
    const data = await fetchJSON(path, fetcher);
    return { path, data };
  } catch {
    return {
      path,
      data: {
        version: "v1",
        updated_at: "",
        history: [],
        extension: {
          weeks_assigned: 0,
          trigger_week: 0
        }
      }
    };
  }
}

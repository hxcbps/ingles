import { createDOM } from "./dom.js";
import { createEventRegistry } from "./events.js";
import {
  loadAdaptiveHistory,
  loadBookModulesRegistry,
  loadConfig,
  loadResourcesCatalog,
  loadWeekContent
} from "../content/repository.js";
import { getProgramContext, toViewModel } from "../content/day_model.js";
import { loadDayState, saveDayState } from "../state/store.js";
import { appendHistory, buildTrendSnapshot } from "../domain/history.js";
import { evaluateAdaptivePlan } from "../domain/adaptation.js";
import { generateDailyExercises } from "../domain/exercise_engine.js";
import {
  flattenBookModules,
  markBookModuleComplete,
  summarizeBookProgress
} from "../domain/books.js";
import { renderHeader } from "../ui/renderers/header_renderer.js";
import { renderMission } from "../ui/renderers/mission_renderer.js";
import { renderPlan } from "../ui/renderers/plan_renderer.js";
import { renderChecklist } from "../ui/renderers/checklist_renderer.js";
import { renderRubric } from "../ui/renderers/rubric_renderer.js";
import { renderMetrics } from "../ui/renderers/metrics_renderer.js";
import { renderArtifacts } from "../ui/renderers/artifacts_renderer.js";
import { renderWeekly } from "../ui/renderers/weekly_renderer.js";
import { renderAdaptive } from "../ui/renderers/adaptive_renderer.js";
import { renderExercises } from "../ui/renderers/exercises_renderer.js";
import { renderResources } from "../ui/renderers/resources_renderer.js";
import { renderBookModules } from "../ui/renderers/books_renderer.js";
import { renderTrend } from "../ui/renderers/trend_renderer.js";
import {
  renderFatalError,
  renderNextAction,
  renderRecoverableError,
  renderStatus
} from "../ui/renderers/status_renderer.js";
import { wireClipboardAction } from "../ui/actions/clipboard_actions.js";
import { createTimerController } from "../ui/actions/timer_actions.js";
import { wireNoteActions } from "../ui/actions/note_actions.js";
import { summarizeRubric } from "../domain/rubric.js";
import { createHashRouter } from "../routing/hash_router.js";
import { evaluateSoftGuard } from "../routing/route_guards.js";
import { applyRouteVisibility } from "../routing/view_switcher.js";
import { DEFAULT_ROUTE_ID, getRouteLabel } from "../routing/routes.js";

const VALIDATE_HINT = "Revisa learning/content y ejecuta ./plan_michael_phelps/bin/validate_content.";
const ROUTE_SEQUENCE = ["action", "session", "close", "evaluate"];

function safeRender(dom, sectionName, renderFn, fallbackFn) {
  try {
    renderFn();
  } catch (error) {
    renderRecoverableError(dom, sectionName, error);
    if (typeof fallbackFn === "function") {
      try {
        fallbackFn();
      } catch {
        // Ignore fallback errors.
      }
    }
  }
}

function buildHistoryEntry(program, state) {
  return {
    isoDate: program.isoDate,
    checklist: { ...state.checklist },
    scores: { ...state.scores },
    metrics_numeric: { ...state.metrics_numeric }
  };
}

function getRubricAverage(scores, targets) {
  const summary = summarizeRubric(scores, targets);
  return Number(summary.average);
}

function normalizeSharedAdaptiveHistory(data) {
  const safe = data && typeof data === "object" ? data : {};
  const history = Array.isArray(safe.history) ? safe.history : [];
  const extension = safe.extension && typeof safe.extension === "object" ? safe.extension : {};
  const weeksAssigned = Number(extension.weeks_assigned);
  const triggerWeek = Number(extension.trigger_week);

  return {
    history: history
      .filter((item) => item && typeof item === "object" && typeof item.isoDate === "string")
      .slice(-30),
    extension: {
      weeks_assigned: Number.isInteger(weeksAssigned) && weeksAssigned >= 0 ? weeksAssigned : 0,
      trigger_week: Number.isInteger(triggerWeek) && triggerWeek >= 0 ? triggerWeek : 0
    }
  };
}

function mergeHistoryItems(primary = [], secondary = [], maxEntries = 30) {
  const merged = new Map();
  [...primary, ...secondary].forEach((item) => {
    if (!item || typeof item !== "object" || typeof item.isoDate !== "string") return;
    merged.set(item.isoDate, item);
  });
  return [...merged.values()]
    .sort((a, b) => String(a.isoDate).localeCompare(String(b.isoDate)))
    .slice(-maxEntries);
}

function resolveExtensionWeeks(config) {
  const ext = config?.extension_policy || {};
  const minWeeks = Number.isInteger(Number(ext.min_weeks)) ? Number(ext.min_weeks) : 8;
  const maxWeeks = Number.isInteger(Number(ext.max_weeks)) ? Number(ext.max_weeks) : 12;
  return Math.max(minWeeks, Math.min(10, maxWeeks));
}

function formatRouteGuardMessage(guard) {
  if (!guard || guard.level === "none" || !guard.message) {
    return "";
  }

  if (!guard.recommendedRouteId) {
    return guard.message;
  }

  return `${guard.message} Recomendado: ${getRouteLabel(guard.recommendedRouteId)}.`;
}

function setRouteLinkState(documentRef, routeId, { locked = false, hint = "" } = {}) {
  const link = documentRef.querySelector(`[data-route-link="${routeId}"]`);
  if (!link) return;

  link.classList.toggle("is-locked", locked);
  link.setAttribute("aria-disabled", locked ? "true" : "false");

  if (locked) {
    link.setAttribute("tabindex", "-1");
    if (hint) {
      link.setAttribute("title", hint);
    }
    return;
  }

  if (link.getAttribute("tabindex") === "-1") {
    link.removeAttribute("tabindex");
  }

  if (link.hasAttribute("title")) {
    link.removeAttribute("title");
  }
}

function refreshRouteLinkLocks(documentRef, checklist = {}) {
  ROUTE_SEQUENCE.forEach((routeId) => {
    const guard = evaluateSoftGuard({ routeId, checklist });
    const locked = Boolean(
      guard.level === "warning" && guard.recommendedRouteId && guard.recommendedRouteId !== routeId
    );

    setRouteLinkState(documentRef, routeId, {
      locked,
      hint: guard.message || ""
    });
  });
}
export async function bootstrap({
  documentRef = document,
  windowRef = window,
  fetcher = fetch,
  storageAdapter
} = {}) {
  let dom;

  try {
    dom = createDOM(documentRef);
  } catch (error) {
    console.error(error);
    return { dispose() {} };
  }

  const events = createEventRegistry();
  let timerController = null;
  let state = null;
  let program = null;
  let sessionMinutes = 120;
  let viewModel = null;
  let resourcesCatalog = null;
  let booksRegistry = null;
  let sharedAdaptiveHistory = null;
  let adaptivePlan = null;
  let config = null;
  let router = null;
  let baseStatusMessage = "";
  let routeStatusMessage = "";

  const publishStatus = () => {
    const status = [baseStatusMessage, routeStatusMessage].filter(Boolean).join(" | ");
    renderStatus(dom, status || "Listo.");
  };

  const setStatus = (message) => {
    baseStatusMessage = String(message || "");
    publishStatus();
  };

  const setRouteStatus = (message = "") => {
    routeStatusMessage = String(message || "");
    publishStatus();
  };

  const persistState = () => {
    if (!state || !program) return;
    saveDayState(program.isoDate, state, storageAdapter);
  };

  const updateAdaptiveState = () => {
    const sharedHistory = sharedAdaptiveHistory?.history || [];
    const mergedHistory = mergeHistoryItems(sharedHistory, state.history_last_30_days, 30);
    state.history_last_30_days = appendHistory(mergedHistory, buildHistoryEntry(program, state), 30);

    const rubricAverage = getRubricAverage(state.scores, viewModel.day.rubric);
    adaptivePlan = evaluateAdaptivePlan({
      history: state.history_last_30_days,
      weekNumber: program.weekNumber,
      rubricAverage,
      targets: viewModel.day.metricsTargets
    });

    if (adaptivePlan.appliedRules.includes("extension_auto_w10") && state.extension_weeks_assigned === 0) {
      state.extension_weeks_assigned = resolveExtensionWeeks(config);
      state.extension_trigger_week = program.weekNumber;
    }

    program.effectiveProgramWeeks = program.programWeeks + state.extension_weeks_assigned;

    state.adaptive_focus_today = adaptivePlan.focusLabel;
    state.adaptive_recommendations = adaptivePlan.recommendations;
    state.extension_risk = adaptivePlan.extensionRisk;
    adaptivePlan.extensionWeeksAssigned = state.extension_weeks_assigned;
    adaptivePlan.extensionTriggerWeek = state.extension_trigger_week;
    adaptivePlan.effectiveProgramWeeks = program.effectiveProgramWeeks;
  };

  const renderAdaptivePanels = () => {
    const exercises = generateDailyExercises(viewModel.day, adaptivePlan);
    const trend = buildTrendSnapshot(state.history_last_30_days, 14);
    const weekModules = flattenBookModules(viewModel.week);
    const dayModules = Array.isArray(viewModel.day.bookModules) ? viewModel.day.bookModules : weekModules;
    const progressSummary = summarizeBookProgress(state.book_progress, viewModel.week);

    renderHeader(dom, program, config, viewModel.day.minutes, setStatus);
    renderAdaptive(dom, adaptivePlan);
    renderExercises(dom, exercises);
    renderResources(dom, viewModel.day.resourcePack, resourcesCatalog?.data);
    renderBookModules(dom, dayModules, progressSummary, booksRegistry?.data);
    renderTrend(dom, trend);
  };

  const dispose = () => {
    if (timerController) {
      timerController.dispose();
    }
    if (router) {
      router.dispose();
    }
    events.clear();
  };

  try {
    setStatus("Cargando plan...");

    config = await loadConfig(fetcher);
    program = getProgramContext(config);
    sessionMinutes = program.sessionMinutes;
    state = loadDayState(program.isoDate, sessionMinutes, storageAdapter);

    const sharedAdaptiveFile = await loadAdaptiveHistory(fetcher);
    sharedAdaptiveHistory = normalizeSharedAdaptiveHistory(sharedAdaptiveFile?.data);

    if (state.extension_weeks_assigned === 0 && sharedAdaptiveHistory.extension.weeks_assigned > 0) {
      state.extension_weeks_assigned = sharedAdaptiveHistory.extension.weeks_assigned;
      state.extension_trigger_week = sharedAdaptiveHistory.extension.trigger_week;
    }

    program.effectiveProgramWeeks = program.programWeeks + state.extension_weeks_assigned;

    if (program.weekNumber > program.effectiveProgramWeeks) {
      setRouteStatus("");
      setStatus(
        `Programa completado en semana efectiva ${program.effectiveProgramWeeks}. Reinicia ciclo en config/settings.json.`
      );
      renderNextAction(dom, "Reinicia start_date y vuelve a ejecutar.");
      return { dispose };
    }

    const contentWeek = Math.min(program.weekNumber, program.programWeeks);
    const contentWeekLabel = String(contentWeek).padStart(2, "0");

    const [weekFile, resourcesFile, booksFile] = await Promise.all([
      loadWeekContent(contentWeekLabel, fetcher),
      loadResourcesCatalog(fetcher),
      loadBookModulesRegistry(fetcher)
    ]);

    resourcesCatalog = resourcesFile;
    booksRegistry = booksFile;

    viewModel = toViewModel(program, weekFile.data, weekFile.path);
    sessionMinutes = viewModel.day.minutes;

    if (!state.metrics_notes || !state.metrics_numeric) {
      state.metrics_notes = { ...state.metrics };
      state.metrics_numeric = {
        error_density_per_100w: 0,
        repair_success_pct: 0,
        turn_length_seconds: 0,
        gist_pct: 0,
        detail_pct: 0,
        lexical_reuse_count: 0,
        pronunciation_score: 0
      };
    }

    updateAdaptiveState();
    persistState();

    const refreshRouteStatus = () => {
      if (!router) return;

      const routeState = router.current();
      refreshRouteLinkLocks(documentRef, state.checklist);

      if (routeState.isInvalid) {
        const raw = routeState.rawHash || "#";
        setRouteStatus(`Ruta '${raw}' no valida. Te llevamos a ${getRouteLabel(routeState.routeId)}.`);
        return;
      }

      const guard = evaluateSoftGuard({
        routeId: routeState.routeId,
        checklist: state.checklist
      });

      if (
        guard.level === "warning" &&
        guard.recommendedRouteId &&
        guard.recommendedRouteId !== routeState.routeId
      ) {
        setRouteStatus(`${guard.message} Te llevamos a ${getRouteLabel(guard.recommendedRouteId)}.`);
        router.navigate(guard.recommendedRouteId, { replace: true });
        return;
      }

      const guardMessage = formatRouteGuardMessage(guard);

      if (routeState.redirectedFromLegacy) {
        const legacyMessage = `Ruta anterior convertida a ${getRouteLabel(routeState.routeId)}.`;
        setRouteStatus(guardMessage ? `${legacyMessage} ${guardMessage}` : legacyMessage);
        return;
      }

      setRouteStatus(guardMessage);
    };

    const rerenderChecklist = () => {
      renderChecklist(dom, state.checklist, (itemId, checked) => {
        state.checklist[itemId] = checked;

        if (itemId === "evidence" && checked) {
          const modules = Array.isArray(viewModel.day.bookModules) ? viewModel.day.bookModules : [];
          modules.forEach((moduleId) => {
            state.book_progress = markBookModuleComplete(state.book_progress, moduleId, program.weekNumber);
          });
        }

        updateAdaptiveState();
        persistState();
        rerenderChecklist();
        renderAdaptivePanels();
        refreshRouteStatus();
      });
    };

    const rerenderRubric = () => {
      renderRubric(dom, state.scores, viewModel.day.rubric, (fieldId, value) => {
        state.scores[fieldId] = value;
        updateAdaptiveState();
        persistState();
        rerenderRubric();
        renderAdaptivePanels();
      });
    };

    safeRender(dom, "header", () => {
      renderHeader(dom, program, config, viewModel.day.minutes, setStatus);
    });

    safeRender(
      dom,
      "mission",
      () => {
        renderMission(dom, viewModel.day);
      },
      () => {
        dom.missionTarget.textContent = "Objetivo no disponible.";
        dom.missionBullets.innerHTML = "";
      }
    );

    safeRender(
      dom,
      "plan",
      () => {
        renderPlan(dom, viewModel.day);
      },
      () => {
        dom.sessionPlan.innerHTML = "";
        dom.deliverables.innerHTML = "";
      }
    );

    safeRender(
      dom,
      "weekly",
      () => {
        renderWeekly(dom, viewModel.week);
      },
      () => {
        dom.weekTitle.textContent = "Semana no disponible.";
        dom.weeklyTargets.innerHTML = "";
        dom.weekGateChecks.innerHTML = "";
      }
    );

    safeRender(
      dom,
      "checklist",
      rerenderChecklist,
      () => {
        dom.checklist.innerHTML = "";
        dom.progressText.textContent = "0% completado (0/5)";
        dom.progressFill.style.width = "0%";
        dom.nextAction.textContent = "Ejecuta la primera accion del dia.";
      }
    );

    safeRender(
      dom,
      "rubric",
      rerenderRubric,
      () => {
        dom.rubricGrid.innerHTML = "";
        dom.scoreSummary.textContent = "Rubrica no disponible.";
      }
    );

    safeRender(
      dom,
      "metrics",
      () => {
        renderMetrics(
          dom,
          state.metrics_numeric,
          state.metrics_notes,
          viewModel.day.metricsTargets,
          (fieldId, value) => {
            state.metrics_numeric[fieldId] = value;
            updateAdaptiveState();
            persistState();
            renderAdaptivePanels();
          },
          (fieldId, value) => {
            state.metrics_notes[fieldId] = value;
            state.metrics[fieldId] = value;
            persistState();
          }
        );
      },
      () => {
        dom.metricsGrid.innerHTML = "";
        dom.metricsNotesGrid.innerHTML = "";
      }
    );

    safeRender(dom, "adaptive-panels", () => {
      renderAdaptivePanels();
    });

    safeRender(dom, "artifacts", () => {
      renderArtifacts(dom, state.artifacts, (fieldId, value) => {
        state.artifacts[fieldId] = value;
        persistState();
      });
    });

    safeRender(dom, "clipboard", () => {
      wireClipboardAction({
        events,
        button: dom.copyPrompt,
        textProvider: () => viewModel.day.prompt,
        idleLabel: "Copiar prompt",
        successLabel: "Prompt copiado",
        failureLabel: "Copia manual",
        onStatus: setStatus,
        windowRef,
        navigatorRef: globalThis.navigator
      });

      wireClipboardAction({
        events,
        button: dom.copyEvidence,
        textProvider: () => viewModel.day.evidencePath,
        idleLabel: "Copiar ruta evidencia",
        successLabel: "Ruta copiada",
        failureLabel: "Copia manual",
        onStatus: setStatus,
        windowRef,
        navigatorRef: globalThis.navigator
      });
    });

    safeRender(dom, "note", () => {
      wireNoteActions({
        dom,
        events,
        getNote: () => state.note,
        setNote: (value) => {
          state.note = value;
        },
        persistState
      });
    });

    safeRender(dom, "timer", () => {
      timerController = createTimerController({
        dom,
        events,
        getTimer: () => state.timer,
        setTimer: (timer) => {
          state.timer = timer;
        },
        getSessionMinutes: () => sessionMinutes,
        persistState,
        setStatus,
        windowRef
      });
      timerController.init();
    });

    safeRender(
      dom,
      "router",
      () => {
        router = createHashRouter({
          windowRef,
          onRouteChange: (routeState) => {
            applyRouteVisibility({
              documentRef,
              routeId: routeState.routeId
            });
            refreshRouteStatus();
          },
          onInvalidRoute: ({ rawHash }) => {
            const raw = rawHash || "#";
            setRouteStatus(`Ruta '${raw}' no valida. Te llevamos a ${getRouteLabel(DEFAULT_ROUTE_ID)}.`);
          }
        });
        router.start();
      },
      () => {
        applyRouteVisibility({ documentRef, routeId: DEFAULT_ROUTE_ID });
      }
    );

    events.on(windowRef, "beforeunload", persistState);
    events.on(windowRef, "error", () => {
      setStatus(`Error en runtime UI. ${VALIDATE_HINT}`);
    });
    events.on(windowRef, "unhandledrejection", () => {
      setStatus(`Operacion no completada. ${VALIDATE_HINT}`);
    });

    return { dispose };
  } catch (error) {
    renderFatalError(dom, error, VALIDATE_HINT);
    return { dispose };
  }
}

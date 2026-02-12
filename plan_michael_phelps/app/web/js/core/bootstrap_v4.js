import { loadConfig, loadModuleBlueprint, loadWeekContentV4, loadWeekSummariesV4 } from "../content/repository.js";
import { getProgramContext } from "../content/day_model.js";
import { createHashRouter } from "../routing/hash_router.js";
import { orchestrator } from "./orchestrator.js";
import { createTelemetrySink } from "./telemetry_sink.js";
import { deriveJourneySnapshot, evaluateRuntimeGuard } from "./runtime_flow.js";
import { SessionWizard } from "../ui/session_wizard.js";
import { LearningShell } from "../ui/learning_shell.js";

const MODE_CLASS = "app-mode-v4";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_LABEL_ES = Object.freeze({
  Mon: "Lunes",
  Tue: "Martes",
  Wed: "Miercoles",
  Thu: "Jueves",
  Fri: "Viernes",
  Sat: "Sabado",
  Sun: "Domingo"
});

function formatDayLabel(dayLabel) {
  return DAY_LABEL_ES[dayLabel] || dayLabel || "Dia";
}

function hasExecutableSession(dayData) {
  return Boolean(Array.isArray(dayData?.session_script) && dayData.session_script.length > 0);
}

function resolvePlayableDay(daysByLabel, preferredDayLabel) {
  const days = daysByLabel && typeof daysByLabel === "object" ? daysByLabel : {};

  if (hasExecutableSession(days[preferredDayLabel])) {
    return {
      dayLabel: preferredDayLabel,
      dayContent: days[preferredDayLabel],
      fallbackNotice: ""
    };
  }

  const firstPlayableLabel = DAY_ORDER.find((dayLabel) => hasExecutableSession(days[dayLabel]));
  if (!firstPlayableLabel) return null;

  return {
    dayLabel: firstPlayableLabel,
    dayContent: days[firstPlayableLabel],
    fallbackNotice: `No habia sesion ejecutable para ${formatDayLabel(preferredDayLabel)}. Se cargo ${formatDayLabel(firstPlayableLabel)} como reemplazo.`
  };
}

function buildSessionSnapshot(orchestratorRef) {
  const current = orchestratorRef?.getCurrentStep ? orchestratorRef.getCurrentStep() : {};
  const progressPct = orchestratorRef?.getProgress ? Number(orchestratorRef.getProgress()) || 0 : 0;
  const primarySteps = typeof orchestratorRef?.getPrimaryStepIds === "function" ? orchestratorRef.getPrimaryStepIds() : [];
  const totalSteps = Number(current?.totalSteps) || primarySteps.length || 0;
  const completed = !current?.definition && progressPct >= 100;

  return {
    progressPct,
    completed,
    currentStepTitle: current?.definition?.title || (completed ? "Sesion completada" : "Sesion no iniciada"),
    currentStepType: current?.definition?.type || "-",
    currentStepIndex: Number(current?.stepIndex) || (completed ? totalSteps : 0),
    totalSteps,
    status: current?.status || (completed ? "done" : "locked"),
    retryCount: Number(current?.retryCount) || 0
  };
}

function renderFatal(container, title, message) {
  if (!container) return;

  container.innerHTML = `
    <section class="fatal-shell" aria-live="assertive">
      <article class="fatal-card">
        <p class="section-kicker">Error de inicializacion</p>
        <h2>${title}</h2>
        <p>${message}</p>
        <button id="btn-reload-app" class="btn-primary" type="button">Reintentar</button>
      </article>
    </section>
  `;

  const reloadButton = container.querySelector("#btn-reload-app");
  if (reloadButton) {
    reloadButton.addEventListener("click", () => window.location.reload());
  }
}

function emitTelemetryDocumentEvent(documentRef, event) {
  if (!documentRef || typeof documentRef.dispatchEvent !== "function") {
    return;
  }

  if (typeof CustomEvent === "undefined") {
    return;
  }

  documentRef.dispatchEvent(new CustomEvent("runtime:telemetry", { detail: event }));
}

function isGuardRedirect(guard, routeId) {
  return Boolean(
    guard &&
    guard.level === "warning" &&
    guard.recommendedRouteId &&
    guard.recommendedRouteId !== routeId
  );
}

export async function bootstrapV4({
  documentRef = document,
  windowRef = window,
  fetcher = fetch
} = {}) {
  const rootContainer = documentRef.getElementById("v4-root");
  if (!rootContainer) {
    console.error("Critical: #v4-root not found in DOM");
    return { dispose() {} };
  }

  documentRef.body.classList.add(MODE_CLASS);

  let shell = null;
  let wizard = null;
  let hashRouter = null;
  let unloadHandler = null;
  let currentRouteId = null;
  let routeSource = "startup";
  let scrollHandler = null;

  const telemetrySink = createTelemetrySink();
  const publishTelemetry = (event) => {
    const payload = telemetrySink.write(event);
    console.info("[V4 telemetry]", payload);
    emitTelemetryDocumentEvent(documentRef, payload);
    return payload;
  };

  const getJourneyState = () => {
    const session = buildSessionSnapshot(orchestrator);
    const journey = deriveJourneySnapshot(orchestrator);
    return {
      ...journey,
      session
    };
  };

  const applyRouteGuard = ({ routeId, source = "runtime" } = {}) => {
    const journey = getJourneyState();
    const guard = evaluateRuntimeGuard({ routeId, journey });

    if (shell && typeof shell.setFlowStatus === "function") {
      shell.setFlowStatus(guard);
    }

    if (!isGuardRedirect(guard, routeId) || !hashRouter) {
      return { redirected: false, guard };
    }

    publishTelemetry({
      event: "runtime_route_guard_redirect",
      metadata: {
        from_route: routeId,
        to_route: guard.recommendedRouteId,
        source
      }
    });

    routeSource = "guard_redirect";
    hashRouter.navigate(guard.recommendedRouteId, { replace: true });
    return { redirected: true, guard };
  };

  try {
    const config = await loadConfig(fetcher);
    const program = getProgramContext(config);

    const contentWeekNumber = Math.min(program.weekNumber, program.programWeeks);
    const weekLabel = String(contentWeekNumber).padStart(2, "0");

    const [weekFile, weekSummaries, moduleBlueprintFile] = await Promise.all([
      loadWeekContentV4(weekLabel, fetcher),
      loadWeekSummariesV4({
        fromWeek: 1,
        toWeek: program.programWeeks,
        fetcher
      }),
      loadModuleBlueprint(fetcher)
    ]);

    const days = weekFile?.data?.days || {};
    const resolvedDay = resolvePlayableDay(days, program.dayLabel);

    if (!resolvedDay) {
      publishTelemetry({
        event: "runtime_boot_error",
        metadata: {
          code: "missing_executable_day",
          week: weekLabel,
          requested_day: program.dayLabel
        }
      });

      renderFatal(
        rootContainer,
        "Contenido incompleto",
        `No existe una sesion ejecutable en Week ${weekLabel}. Revisa learning/content/week${weekLabel}.v4.json.`
      );
      return { dispose() {} };
    }

    orchestrator.init(resolvedDay.dayContent, {
      onEvent: (event) => {
        publishTelemetry(event);
        if (shell && typeof shell.refresh === "function") {
          shell.refresh();
        }
      }
    });

    if (resolvedDay.fallbackNotice) {
      orchestrator.emit("content_fallback_used", {
        stepId: null,
        metadata: {
          requested_day: program.dayLabel,
          fallback_day: resolvedDay.dayLabel,
          week: `W${weekLabel}`
        }
      });
    }

    shell = new LearningShell("v4-root", {
      program,
      config,
      weekSummaries,
      moduleBlueprint: moduleBlueprintFile?.data || null,
      activeWeekLabel: weekLabel,
      activeDayLabel: resolvedDay.dayLabel,
      activeDayContent: resolvedDay.dayContent,
      fallbackNotice: resolvedDay.fallbackNotice,
      getSessionSnapshot: () => buildSessionSnapshot(orchestrator),
      getJourneyState,
      onNavigateRoute: ({ routeId, source }) => {
        routeSource = source || "shell_nav";

        if (!hashRouter) {
          shell?.setRoute(routeId);
          return;
        }

        const guardResult = applyRouteGuard({ routeId, source: routeSource });
        if (guardResult.redirected) {
          return;
        }

        hashRouter.navigate(routeId);
      },
      onViewChange: ({ viewId }) => {
        if (viewId === "sesion" && wizard) {
          wizard.render();
        }
      }
    });

    shell.render();

    wizard = new SessionWizard(shell.getSessionHostId(), { orchestrator });
    wizard.render();

    hashRouter = createHashRouter({
      windowRef,
      onRouteChange: (routeState) => {
        const source = routeState.redirectedFromLegacy ? "legacy_redirect" : routeSource;
        const guardResult = applyRouteGuard({ routeId: routeState.routeId, source });
        if (guardResult.redirected) {
          return;
        }

        const fromRoute = currentRouteId;
        currentRouteId = routeState.routeId;
        shell?.setRoute(routeState.routeId);

        orchestrator.emit("route_changed", {
          routeId: routeState.routeId,
          metadata: {
            from_route: fromRoute,
            to_route: routeState.routeId,
            source,
            guard_level: guardResult.guard?.level || "none"
          }
        });

        routeSource = "hashchange";
      },
      onInvalidRoute: ({ rawHash, canonicalHash }) => {
        console.warn("[V4 route] invalid hash redirected", { rawHash, canonicalHash });
        publishTelemetry({
          event: "runtime_route_invalid",
          metadata: {
            raw_hash: rawHash,
            canonical_hash: canonicalHash
          }
        });
      }
    });

    hashRouter.start();

    scrollHandler = () => {
      const header = documentRef.querySelector(".glass-header");
      if (!header) return;
      const scrollTop = Number(windowRef?.scrollY) || 0;
      header.classList.toggle("is-scrolled", scrollTop > 8);
    };
    scrollHandler();
    windowRef.addEventListener("scroll", scrollHandler, { passive: true });

    unloadHandler = () => {
      orchestrator.abandon("before_unload");
    };
    windowRef.addEventListener("beforeunload", unloadHandler);
  } catch (error) {
    publishTelemetry({
      event: "runtime_boot_error",
      metadata: {
        code: "exception",
        message: error?.message || "unknown_error"
      }
    });

    console.error("[V4] Bootstrap error", error);
    renderFatal(rootContainer, "Fallo del sistema", `No se pudo iniciar la app: ${error.message}`);
  }

  return {
    getTelemetrySnapshot() {
      return telemetrySink.list();
    },

    clearTelemetry() {
      telemetrySink.clear();
    },

    dispose() {
      if (hashRouter && typeof hashRouter.dispose === "function") {
        hashRouter.dispose();
      }
      if (wizard && typeof wizard.dispose === "function") {
        wizard.dispose();
      }
      if (shell && typeof shell.dispose === "function") {
        shell.dispose();
      }
      if (unloadHandler) {
        windowRef.removeEventListener("beforeunload", unloadHandler);
      }
      if (scrollHandler) {
        windowRef.removeEventListener("scroll", scrollHandler);
      }
    }
  };
}

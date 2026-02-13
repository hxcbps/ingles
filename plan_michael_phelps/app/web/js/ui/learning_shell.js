import { VIEW_META, VIEW_IDS } from "./views.js";
import { ICONS } from "./icons.js";
import { buildProgressHeatmap, buildProgressHistory, renderProgressPremiumView } from "./renderers/progress_premium_renderer.js";

function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatWeekLabel(weekKey) {
  const num = parseInt((weekKey || "w01").replace("w", ""), 10);
  return `W${String(num).padStart(2, "0")}`;
}

const DAY_SEQUENCE = Object.freeze(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

const DAY_LABEL_PRETTY = Object.freeze({
  Mon: "Lunes",
  Tue: "Martes",
  Wed: "Miercoles",
  Thu: "Jueves",
  Fri: "Viernes",
  Sat: "Sabado",
  Sun: "Domingo"
});

const DAY_LABEL_ALIASES = Object.freeze({
  lunes: "Mon",
  martes: "Tue",
  miercoles: "Wed",
  miércoles: "Wed",
  jueves: "Thu",
  viernes: "Fri",
  sabado: "Sat",
  sábado: "Sat",
  domingo: "Sun"
});

const UI_THEMES = Object.freeze({
  DARK: "dark",
  LIGHT: "light"
});

const THEME_STORAGE_KEY = "hxc_ui_theme";

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function resolveDayCode(dayLabel) {
  const raw = String(dayLabel || "").trim();
  if (!raw) return "Mon";

  const normalized = raw.toLowerCase();
  const fromAlias = DAY_LABEL_ALIASES[normalized];
  if (fromAlias) return fromAlias;

  const short = normalized.slice(0, 3);
  const direct = DAY_SEQUENCE.find((dayCode) => dayCode.toLowerCase() === short);
  return direct || "Mon";
}

function formatDayLabel(dayKey) {
  const dayCode = resolveDayCode(dayKey);
  return DAY_LABEL_PRETTY[dayCode] || dayKey || "Hoy";
}

function toSentence(str, def) {
  if (!str) return def;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


export class LearningShell {
  constructor(containerId, context = {}) {
    this.container = document.getElementById(containerId);
    this.windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);

    // Context mapping from bootstrap_v4
    this.context = context;
    this.program = context.program || {};
    this.config = context.config || {};
    this.weekSummaries = context.weekSummaries || [];
    this.moduleBlueprint = context.moduleBlueprint || null;

    // Profile extraction (assuming config contains user profile or using defaults)
    this.profile = this.config.user || {
      name: "Estudiante",
      level: "Nivel 1",
      progress: {
        current_week: context.activeWeekLabel || "w01",
        phase_id: "phase1"
      }
    };

    // State initialization
    this.activeWeek = context.activeWeekLabel || "w01";
    this.activeDayLabel = context.activeDayLabel || "Mon";
    this.activeDayContent = context.activeDayContent || null;
    this.fallbackNotice = context.fallbackNotice || "";
    this.activeView = "hoy"; // Default view
    this.theme = this.resolveInitialTheme(context.themePreference);

    // Callbacks
    this.onViewChange = context.onViewChange || (() => { });
    this.onNavigateRoute = context.onNavigateRoute || (() => { });
    this.getSessionSnapshot = context.getSessionSnapshot || (() => ({}));
    this.getJourneyState = context.getJourneyState || (() => ({}));
    this.flowStatus = { level: "none", message: "" };
    this.handleClick = null;
  }

  setSessionHostId(id) {
    this.sessionHostId = id;
  }

  getSessionHostId() {
    return this.sessionHostId || "session-host";
  }

  resolveInitialTheme(preferredTheme) {
    const preferred = String(preferredTheme || "").toLowerCase();
    if (preferred === UI_THEMES.DARK || preferred === UI_THEMES.LIGHT) {
      return preferred;
    }

    try {
      const stored = this.windowRef?.localStorage?.getItem(THEME_STORAGE_KEY);
      if (stored === UI_THEMES.DARK || stored === UI_THEMES.LIGHT) {
        return stored;
      }
    } catch {
      // Ignore storage read failures in restricted environments/tests.
    }

    if (this.windowRef?.matchMedia?.("(prefers-color-scheme: dark)")?.matches) {
      return UI_THEMES.DARK;
    }

    return UI_THEMES.LIGHT;
  }

  applyTheme() {
    if (!document?.body) return;

    document.body.setAttribute("data-ui-theme", this.theme);
    document.body.classList.toggle("theme-dark", this.theme === UI_THEMES.DARK);
    document.body.classList.toggle("theme-light", this.theme === UI_THEMES.LIGHT);
  }

  setTheme(nextTheme, { persist = true, rerender = true } = {}) {
    const normalized = String(nextTheme || "").toLowerCase();
    if (normalized !== UI_THEMES.DARK && normalized !== UI_THEMES.LIGHT) {
      return;
    }

    this.theme = normalized;
    this.applyTheme();

    if (persist) {
      try {
        this.windowRef?.localStorage?.setItem(THEME_STORAGE_KEY, this.theme);
      } catch {
        // Ignore storage write failures in restricted environments/tests.
      }
    }

    if (rerender) {
      this.render({ view: this.activeView });
    }
  }

  toggleTheme() {
    const nextTheme = this.theme === UI_THEMES.DARK ? UI_THEMES.LIGHT : UI_THEMES.DARK;
    this.setTheme(nextTheme, { persist: true, rerender: true });
  }

  getThemeToggleCopy() {
    return this.theme === UI_THEMES.DARK
      ? { label: "Modo Luz", icon: ICONS.sun }
      : { label: "Modo Oscuro", icon: ICONS.moon };
  }

  setRoute(viewId) {
    if (!VIEW_META[viewId]) return;

    const shouldRender = this.activeView !== viewId;
    this.activeView = viewId;

    if (shouldRender) {
      this.render({ view: viewId });
      return;
    }

    this.updateActiveState(viewId);
  }

  setFlowStatus(status = {}) {
    const safe = status && typeof status === "object" ? status : {};
    this.flowStatus = {
      level: safe.level || "none",
      message: safe.message || ""
    };
  }

  getConnectionState() {
    const online = this.windowRef?.navigator?.onLine;
    return online === false ? "offline" : "online";
  }

  renderConnectionBanner() {
    if (this.getConnectionState() !== "offline") {
      return "";
    }

    return `
      <article class="shell-network-banner" role="status" aria-live="polite">
        <div>
          <strong>Sin conexion</strong>
          <p>No pudimos conectar con tu ruta de aprendizaje. Puedes reintentar ahora.</p>
          <div class="shell-network-actions">
            <button class="es-btn es-btn--primary" data-shell-action="retry-connection" type="button">Reintentar</button>
            <button class="es-btn es-btn--ghost" data-shell-route="hoy" type="button">Seguir en modo local</button>
          </div>
        </div>
      </article>
    `;
  }


  getJourneyStateSafe() {
    const fallbackSession = this.getSessionSnapshotSafe();
    const raw = this.getJourneyState() || {};

    const checklistRaw = raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {};
    const stageRaw = raw.stage && typeof raw.stage === "object" ? raw.stage : {};
    const guardRaw = raw.guard && typeof raw.guard === "object" ? raw.guard : this.flowStatus;
    const primaryRaw = raw.primary && typeof raw.primary === "object" ? raw.primary : {};
    const sessionRaw = raw.session && typeof raw.session === "object" ? raw.session : {};
    const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];

    const session = {
      ...fallbackSession,
      ...sessionRaw,
      progressPct: clampPercent(sessionRaw.progressPct ?? fallbackSession.progressPct)
    };

    const stageFallbackReady = session.progressPct >= 100;

    return {
      checklist: {
        listening: Boolean(checklistRaw.listening),
        speaking: Boolean(checklistRaw.speaking),
        reading: Boolean(checklistRaw.reading),
        writing: Boolean(checklistRaw.writing),
        evidence: Boolean(checklistRaw.evidence)
      },
      stage: {
        closureReady: stageRaw.closureReady !== undefined ? Boolean(stageRaw.closureReady) : stageFallbackReady,
        evidenceReady: stageRaw.evidenceReady !== undefined ? Boolean(stageRaw.evidenceReady) : stageFallbackReady,
        evaluationReady: stageRaw.evaluationReady !== undefined ? Boolean(stageRaw.evaluationReady) : stageFallbackReady
      },
      primary: {
        completed: Number(primaryRaw.completed) || 0,
        total: Number(primaryRaw.total) || session.totalSteps || 0
      },
      nextRecommendedRoute: typeof raw.nextRecommendedRoute === "string" ? raw.nextRecommendedRoute : "sesion",
      guard: {
        level: guardRaw.level || "none",
        message: guardRaw.message || ""
      },
      steps: stepsRaw
        .filter((step) => step && typeof step === "object")
        .map((step, index) => ({
          stepId: typeof step.stepId === "string" ? step.stepId : "step_" + (index + 1),
          title: typeof step.title === "string" ? step.title : "Paso " + (index + 1),
          status: typeof step.status === "string" ? step.status : "locked",
          durationMin: Number(step.durationMin) || 0
        })),
      session
    };
  }

  navigateTo(viewId, source = "shell") {
    if (!VIEW_META[viewId]) return;

    // Route is the source of truth. Rendering happens when router confirms route change.
    this.onNavigateRoute({ routeId: viewId, source });
  }

  refresh() {
    // Called by bootstrap interval
    this.render({ view: this.activeView, isRefresh: true });
  }

  dispose() {
    if (this.container && this.handleClick) {
      this.container.removeEventListener("click", this.handleClick);
    }

    this.handleClick = null;

    if (this.container) {
      this.container.innerHTML = "";
    }
  }

  render(state = {}) {
    if (!this.container) return;

    this.applyTheme();

    // If state is empty, use current state
    const view = state.view || this.activeView;
    const isRefresh = state.isRefresh || false;

    // Only update active view if explicitly changed
    if (state.view) {
      this.activeView = state.view;
    }

    // Retain scroll position/focus if refreshing? 
    // For now, simple re-render. Ideally we should diff, but innerHTML is fast enough for this scale.
    // To prevent input loss during refresh, we might want to skip full render if just polling unless changes detected.
    // For this fix, we render.

    // Optimization: If refreshing and Wizard is active, we might NOT want to blow away the container 
    // because the Wizard is managing its own DOM in #session-host.
    // We should only re-render the Shell Parts (Sidebar, Header, Widgets) and leave content area properly?
    // The current renderLayout returns a string string, causing full DOM thrash.
    // 'renderShell' pattern usually implies full render. 

    // CRITICAL: If view is 'sesion', we must NOT destroy #session-host if it's already there and we are just refreshing stats.
    // But since we transitioned to a string-template re-render, we might be stuck with replacements.
    // Let's rely on the fact that bootstrap calls render() once, and then refresh() periodically.
    // If refresh() nukes the DOM, the wizard (which is appended to #session-host) will be destroyed!

    // FIX: refresh() should only update specific dynamic elements if possible, or we skip full re-render if we are in 'sesion' mode and just updating stats.

    if (isRefresh && this.activeView === "sesion") {
      // Do not re-render layout to avoid killing the Wizard
      this.updateStats();
      return;
    }

    this.container.innerHTML = this.renderLayout({ view });
    this.bindEvents();
    this.updateActiveState(view);
  }

  updateStats() {
    const snapshot = this.getSessionSnapshot();
    const sessionProgress = this.container?.querySelector("#session-progress-fill");

    if (sessionProgress) {
      const progress = Number(snapshot.progressPct) || 0;
      const boundedProgress = Math.max(0, Math.min(100, progress));
      sessionProgress.style.width = `${boundedProgress}%`;
    }
  }

  updateActiveState(viewId) {
    const safeViewId = VIEW_META[viewId] ? viewId : "hoy";

    const panels = this.container?.querySelectorAll("[data-view-panel]") || [];
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== safeViewId;
    });

    this.onViewChange({ viewId: safeViewId });

    const event = new CustomEvent("shell:view-changed", { detail: { view: safeViewId } });
    document.dispatchEvent(event);
  }

  getActiveWeekSummary() {
    const activeWeek = this.getActiveWeekNumber();
    return this.weekSummaries.find((item) => Number(item?.week) === Number(activeWeek)) || null;
  }

  getCurrentDayContent() {
    if (this.activeDayContent && typeof this.activeDayContent === "object") {
      return this.activeDayContent;
    }

    const summary = this.getActiveWeekSummary();
    const dayCode = resolveDayCode(this.activeDayLabel);
    return summary?.days?.[dayCode] || null;
  }

  getSessionDurationMinutes(dayContent = this.getCurrentDayContent()) {
    const script = Array.isArray(dayContent?.session_script) ? dayContent.session_script : [];
    const scriptedDuration = script.reduce((total, step) => {
      const duration = Number(step?.duration_min);
      return Number.isFinite(duration) ? total + Math.max(0, duration) : total;
    }, 0);

    if (scriptedDuration > 0) {
      return Math.round(scriptedDuration);
    }

    const fallbackMinutes = Number(this.program?.sessionMinutes);
    if (Number.isFinite(fallbackMinutes) && fallbackMinutes > 0) {
      return Math.round(fallbackMinutes);
    }

    return 15;
  }

  getUpcomingSession() {
    const summary = this.getActiveWeekSummary();
    if (!summary?.days || typeof summary.days !== "object") {
      return null;
    }

    const currentIndex = DAY_SEQUENCE.indexOf(resolveDayCode(this.activeDayLabel));
    for (let i = currentIndex + 1; i < DAY_SEQUENCE.length; i += 1) {
      const dayCode = DAY_SEQUENCE[i];
      const dayData = summary.days?.[dayCode];
      const script = Array.isArray(dayData?.session_script) ? dayData.session_script : [];
      if (!script.length) continue;

      const firstStep = script.find((step) => step?.title) || script[0];
      const minutes = this.getSessionDurationMinutes(dayData);
      return {
        tag: formatDayLabel(dayCode).toUpperCase(),
        title: firstStep?.title || `Sesion ${formatDayLabel(dayCode)}`,
        description: `${minutes} min planificados para la siguiente practica.`
      };
    }

    return null;
  }

  getProgramProgress() {
    const activeWeek = this.getActiveWeekNumber();
    const programWeeks = Number(this.program?.programWeeks);
    const totalWeeks = Number.isFinite(programWeeks) && programWeeks > 0
      ? Math.round(programWeeks)
      : Math.max(activeWeek, 1);

    const dayCode = resolveDayCode(this.activeDayLabel);
    const dayIndex = Math.max(1, DAY_SEQUENCE.indexOf(dayCode) + 1);

    const completedDays = Math.max(0, ((activeWeek - 1) * 7) + (dayIndex - 1));
    const totalDays = Math.max(1, totalWeeks * 7);

    return {
      activeWeek,
      totalWeeks,
      dayCode,
      dayIndex,
      completedDays,
      totalDays,
      weekProgressPct: clampPercent((activeWeek / totalWeeks) * 100),
      dayProgressPct: clampPercent((completedDays / totalDays) * 100)
    };
  }

  getSessionSnapshotSafe() {
    const snapshot = this.getSessionSnapshot() || {};
    const progressPct = clampPercent(snapshot.progressPct);

    const totalStepsRaw = Number(snapshot.totalSteps);
    const totalSteps = Number.isFinite(totalStepsRaw) && totalStepsRaw > 0 ? Math.round(totalStepsRaw) : 0;

    const indexRaw = Number(snapshot.currentStepIndex);
    const currentStepIndex = Number.isFinite(indexRaw) && indexRaw > 0
      ? Math.min(Math.round(indexRaw), totalSteps || Math.round(indexRaw))
      : 0;

    return {
      progressPct,
      totalSteps,
      currentStepIndex,
      status: snapshot.status || (progressPct >= 100 ? "done" : "active"),
      currentStepTitle: snapshot.currentStepTitle || "Sesion operativa"
    };
  }

  getDashboardMetrics() {
    const runtimeMetrics = this.context.metrics || {};
    const programProgress = this.getProgramProgress();
    const session = this.getSessionSnapshotSafe();

    const activeWeekSummary = this.getActiveWeekSummary();
    const weekProfile = activeWeekSummary?.week_profile || {};
    const focusTheme = weekProfile.focus_theme || "Speaking operativo";
    const cefrTarget = weekProfile.cefr_target || this.program?.targetCEFR || this.config?.target_cefr || "B2";

    const sessionMinutes = this.getSessionDurationMinutes();
    const upcomingSession = this.getUpcomingSession();

    const stepProgressLabel = session.totalSteps > 0
      ? `${session.currentStepIndex}/${session.totalSteps} pasos`
      : "Sesion pendiente";

    return {
      planName: runtimeMetrics.planName ?? toSentence(this.config?.pace_mode, "Plan guiado"),
      planProgressPct: clampPercent(runtimeMetrics.planProgressPct ?? programProgress.weekProgressPct),
      weeklyProgressPct: clampPercent(runtimeMetrics.weeklyProgressPct ?? programProgress.weekProgressPct),
      weeklyProgressLabel: runtimeMetrics.weeklyProgressLabel ?? `${clampPercent(runtimeMetrics.weeklyProgressPct ?? programProgress.weekProgressPct)}%`,

      streakTitle: runtimeMetrics.streakTitle ?? "Semana activa",
      streakLabel: runtimeMetrics.streakLabel ?? `${formatDayLabel(programProgress.dayCode)} (${programProgress.dayIndex}/7)`,
      xpTitle: runtimeMetrics.xpTitle ?? "Avance sesion",
      xpLabel: runtimeMetrics.xpLabel ?? stepProgressLabel,
      accuracyLabel: runtimeMetrics.accuracyLabel ?? `${session.progressPct}%`,

      rankingTitle: runtimeMetrics.rankingTitle ?? `Semana ${formatWeekLabel(String(programProgress.activeWeek))}`,
      rankingTier: runtimeMetrics.rankingTier ?? `Objetivo ${cefrTarget}`,
      heroRewardLabel: runtimeMetrics.heroRewardLabel ?? `${session.progressPct}% completado`,
      sessionRewardLabel: runtimeMetrics.sessionRewardLabel ?? stepProgressLabel,
      sessionMinutesLabel: runtimeMetrics.sessionMinutesLabel ?? `${sessionMinutes} min`,
      sessionProgressPct: clampPercent(runtimeMetrics.sessionProgressPct ?? session.progressPct),
      sessionStatusLabel: runtimeMetrics.sessionStatusLabel ?? toSentence(session.status, "activo"),

      statPrimaryValue: runtimeMetrics.statPrimaryValue ?? `${programProgress.completedDays}/${programProgress.totalDays}`,
      statPrimaryLabel: runtimeMetrics.statPrimaryLabel ?? "Dias ejecutados",
      statSecondaryValue: runtimeMetrics.statSecondaryValue ?? `${programProgress.activeWeek}/${programProgress.totalWeeks}`,
      statSecondaryLabel: runtimeMetrics.statSecondaryLabel ?? "Semanas",

      themeKicker: runtimeMetrics.themeKicker ?? `Tema ${formatWeekLabel(String(programProgress.activeWeek))}`,
      themeTitle: runtimeMetrics.themeTitle ?? focusTheme,
      themeDescription: runtimeMetrics.themeDescription ?? `Objetivo CEFR: ${cefrTarget}.`,
      themeFootnote: runtimeMetrics.themeFootnote ?? `Paso actual: ${session.currentStepTitle}`,
      peersLabel: runtimeMetrics.peersLabel ?? `Estado: ${toSentence(session.status, "activo")}`,

      upcomingTag: runtimeMetrics.upcomingTag ?? (upcomingSession?.tag || "PROXIMO"),
      upcomingTitle: runtimeMetrics.upcomingTitle ?? (upcomingSession?.title || "Prepara la siguiente sesion"),
      upcomingDescription: runtimeMetrics.upcomingDescription ?? (upcomingSession?.description || "Revisa modulos y checklist antes de iniciar."),

      featureTitle: runtimeMetrics.featureTitle ?? `Dominando ${focusTheme}`,
      featureSubtitle: runtimeMetrics.featureSubtitle ?? `Objetivo: ${cefrTarget}. Mejora tu desempeño con practica guiada.`
    };
  }

  renderHeader({ subtitle = "Conversation System", shellTone = "default" } = {}) {
    const isDark = this.theme === UI_THEMES.DARK;
    const themeToggleCopy = this.getThemeToggleCopy();

    const navMarkup = VIEW_IDS.map((viewId) => {
      const meta = VIEW_META[viewId];
      if (!meta) return "";
      const isActive = this.activeView === viewId;
      return `
        <button data-view-nav="${viewId}" class="es-nav__link ${isActive ? "is-active" : ""}" type="button">
          ${escapeHTML(meta.label)}
        </button>
      `;
    }).join("");

    return `
      <header class="es-header glass-header ${shellTone === "progress" ? "es-header--progress" : ""}">
        <div class="es-header__inner">
          <div class="es-brand">
            <span class="es-brand__mark" aria-hidden="true"></span>
            <div class="es-brand__copy">
              <strong>English Sprint</strong>
              <span>${escapeHTML(subtitle)}</span>
            </div>
          </div>

          <nav class="es-nav" aria-label="Navegación principal">
            ${navMarkup}
          </nav>

          <div class="es-header__actions">
            <button
              data-shell-action="toggle-theme"
              type="button"
              role="switch"
              aria-checked="${isDark ? "true" : "false"}"
              class="es-theme-toggle"
              aria-label="Cambiar tema visual"
              title="Cambiar tema"
            >
              <span class="es-theme-toggle__copy">
                <span class="es-theme-toggle__icon">${themeToggleCopy.icon}</span>
                <span class="es-theme-toggle__label">${themeToggleCopy.label}</span>
              </span>
              <span class="es-theme-toggle__pill" aria-hidden="true"><span class="es-theme-toggle__dot"></span></span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  renderLayout(state) {
    const view = state?.view || this.activeView;

    if (view === "progreso") {
      return this.renderProgressStandaloneLayout();
    }

    const activePhase = this.program.phases?.find((phase) => phase.id === this.profile.progress?.phase_id) || {
      title: "Foundation",
      id: "phase1",
      cefr: "A0 -> A2"
    };

    const metrics = this.getDashboardMetrics();
    const journey = this.getJourneyStateSafe();
    const heroCopyByView = {
      hoy: {
        title: "Execution Hub",
        kicker: `Semana activa ${metrics.weeklyProgressLabel}. Enfoque actual: ${metrics.themeTitle}.`,
        ctaRoute: "sesion",
        ctaLabel: "Iniciar sesión"
      },
      sesion: {
        title: "Sesión Guiada",
        kicker: "Sigue la secuencia operativa y desbloquea cierre con evidencia verificable.",
        ctaRoute: "sesion",
        ctaLabel: "Continuar sesión"
      },
      cierre: {
        title: "Cierre Diario",
        kicker: "Consolida checklist, valida gate y prepara evaluación sin fricción.",
        ctaRoute: "cierre",
        ctaLabel: "Revisar cierre"
      },
      evaluacion: {
        title: "Evaluación",
        kicker: "Control de calidad orientado a desempeño real conversacional.",
        ctaRoute: "evaluacion",
        ctaLabel: "Abrir evaluación"
      },
      modulos: {
        title: "Roadmap 0 → B2",
        kicker: "Módulos semanales con ritmo, KPI y checkpoints explícitos.",
        ctaRoute: "modulos",
        ctaLabel: "Ver módulos"
      }
    };

    const heroCopy = heroCopyByView[view] || heroCopyByView.hoy;

    const checklistDone = [
      journey.checklist?.listening,
      journey.checklist?.speaking,
      journey.checklist?.reading,
      journey.checklist?.writing,
      journey.checklist?.evidence
    ].filter(Boolean).length;

    const checklistTotal = 5;

    return `
      <div class="es-shell" data-ui-theme="${this.theme}">
        ${this.renderHeader({ subtitle: "Conversation System" })}

        <main class="es-main">
          <section class="es-hero">
            <div class="es-hero__copy">
              <p class="es-kicker">English Sprint Platform</p>
              <h1 class="es-title">${escapeHTML(heroCopy.title)}</h1>
              <p class="es-subtitle">${escapeHTML(heroCopy.kicker)}</p>
            </div>

            <div class="es-hero__rail">
              <div class="es-badges">
                <span class="es-badge">${escapeHTML(metrics.rankingTitle)}</span>
                <span class="es-badge">${escapeHTML(metrics.rankingTier)}</span>
                <span class="es-badge">${escapeHTML(metrics.heroRewardLabel)}</span>
                ${this.fallbackNotice ? `<span class="es-badge">${escapeHTML(this.fallbackNotice)}</span>` : ""}
              </div>

              <div class="es-hero__actions">
                <button class="es-btn es-btn--ghost" data-shell-route="progreso" type="button">Ver progreso</button>
                <button class="es-btn es-btn--primary" data-shell-route="${heroCopy.ctaRoute}" type="button">${escapeHTML(heroCopy.ctaLabel)}</button>
              </div>
            </div>
          </section>

          <section class="es-grid">
            <article class="es-card es-card--main">
              ${this.renderConnectionBanner()}
              ${this.renderFlowStatusBanner()}

              <div class="view-container" data-view-panel="hoy" ${this.activeView !== "hoy" ? "hidden" : ""}>
                ${this.renderTodayView(metrics)}
              </div>

              <div class="view-container" data-view-panel="sesion" ${this.activeView !== "sesion" ? "hidden" : ""}>
                ${this.renderSessionView(metrics)}
              </div>

              <div class="view-container" data-view-panel="cierre" ${this.activeView !== "cierre" ? "hidden" : ""}>
                ${this.renderClosureView()}
              </div>

              <div class="view-container" data-view-panel="evaluacion" ${this.activeView !== "evaluacion" ? "hidden" : ""}>
                ${this.renderEvaluationView()}
              </div>

              <div class="view-container" data-view-panel="modulos" ${this.activeView !== "modulos" ? "hidden" : ""}>
                ${this.renderModulesView()}
              </div>
            </article>

            <aside class="es-side" aria-label="Panel lateral">
              <article class="es-card">
                <div class="es-card__head">
                  <h2>Operational Signal</h2>
                  <p>Estado de ejecución y continuidad.</p>
                </div>

                <div class="es-kpis">
                  <article>
                    <span>Semana</span>
                    <strong>${escapeHTML(metrics.weeklyProgressLabel)}</strong>
                  </article>
                  <article>
                    <span>Sesión</span>
                    <strong>${escapeHTML(metrics.sessionRewardLabel)}</strong>
                  </article>
                  <article>
                    <span>Checklist</span>
                    <strong>${checklistDone}/${checklistTotal}</strong>
                  </article>
                </div>

                <div class="es-list">
                  <div class="es-list__item">
                    <div>
                      <strong>Fase activa</strong>
                      <p>${escapeHTML(activePhase.title)} • ${escapeHTML(activePhase.cefr || "")}</p>
                    </div>
                    <span>${escapeHTML(metrics.planName)}</span>
                  </div>
                  <div class="es-list__item">
                    <div>
                      <strong>Siguiente foco</strong>
                      <p>${escapeHTML(metrics.upcomingTitle)}</p>
                    </div>
                    <span>${escapeHTML(metrics.upcomingTag)}</span>
                  </div>
                </div>
              </article>

              <article class="es-card">
                <div class="es-card__head">
                  <h2>Quick Routes</h2>
                  <p>Navegación directa de alta frecuencia.</p>
                </div>

                <div class="es-actions-list">
                  <button class="es-action" type="button" data-shell-route="sesion">
                    <strong>Continuar sesión</strong>
                    <span>Ejecuta pasos guiados del día</span>
                  </button>
                  <button class="es-action" type="button" data-shell-route="cierre">
                    <strong>Completar cierre</strong>
                    <span>Checklist + evidencia</span>
                  </button>
                  <button class="es-action" type="button" data-shell-route="progreso">
                    <strong>Analizar progreso</strong>
                    <span>Métricas y tendencia semanal</span>
                  </button>
                </div>
              </article>
            </aside>
          </section>
        </main>
      </div>
    `;
  }


  renderProgressStandaloneLayout() {
    return `
      <div class="es-shell es-shell--progress" data-ui-theme="${this.theme}">
        ${this.renderHeader({ subtitle: "Progreso • Ruta 0 -> B2", shellTone: "progress" })}
        <main class="es-main es-main--progress">
          ${this.renderProgressView()}
        </main>
      </div>
    `;
  }

  renderTodayView(metrics = this.getDashboardMetrics()) {
    const journey = this.getJourneyStateSafe();
    const itinerarySteps = Array.isArray(journey.steps) ? journey.steps : [];

    const stepStatusLabel = (status) => {
      if (status === "done") return "Completado";
      if (status === "active") return "En curso";
      if (status === "failed") return "Requiere ajuste";
      return "Pendiente";
    };

    const itineraryMarkup = itinerarySteps.length
      ? itinerarySteps
          .map((step, index) => {
            const duration = Number(step.durationMin) > 0 ? `${Number(step.durationMin)} min` : "sin tiempo";
            return `
              <div class="es-list__item">
                <div>
                  <strong>Paso ${index + 1}: ${escapeHTML(step.title)}</strong>
                  <p>${duration}</p>
                </div>
                <span>${stepStatusLabel(step.status)}</span>
              </div>
            `;
          })
          .join("")
      : `
          <div class="es-list__item">
            <div>
              <strong>Sin pasos cargados para hoy</strong>
              <p>Verifica el contenido semanal para habilitar ejecución.</p>
            </div>
            <span>Bloqueado</span>
          </div>
        `;

    return `
      <section class="es-section es-view-stack">
        <article class="es-panel">
          <div class="es-section__head">
            <h2>Hoy</h2>
            <p>Bloque operativo con acción inmediata.</p>
          </div>

          <div class="es-list">
            <div class="es-list__item">
              <div>
                <strong>Sesion operativa del dia</strong>
                <p>${escapeHTML(metrics.sessionMinutesLabel)} • ${escapeHTML(metrics.sessionRewardLabel)} • ${escapeHTML(metrics.sessionStatusLabel)}</p>
              </div>
              <button data-shell-action="open-session" class="es-btn es-btn--primary" type="button">Abrir sesion</button>
            </div>

            <div class="es-list__item">
              <div>
                <strong>Proximo bloque</strong>
                <p>${escapeHTML(metrics.upcomingTitle)}</p>
              </div>
              <button data-shell-route="modulos" class="es-btn es-btn--ghost" type="button">Ver roadmap</button>
            </div>
          </div>
        </article>

        <article class="es-panel">
          <div class="es-section__head">
            <h3>Itinerario del dia</h3>
            <p>Cada paso con estado explicito y duracion.</p>
          </div>

          <div class="es-list">${itineraryMarkup}</div>
        </article>
      </section>
    `;
  }


  renderSessionView(metrics = this.getDashboardMetrics()) {
    const journey = this.getJourneyStateSafe();
    const session = journey.session || {};
    const primary = journey.primary || {};
    const progressPct = clampPercent(session.progressPct);

    const nextRoute = journey.nextRecommendedRoute && VIEW_META[journey.nextRecommendedRoute]
      ? journey.nextRecommendedRoute
      : (session.progressPct >= 100 ? "cierre" : "sesion");

    const nextRouteLabel = VIEW_META[nextRoute]?.label || "Sesion";

    return `
      <section class="es-section es-view-stack">
        <article class="es-panel">
          <div class="es-section__head">
            <h2>Sesion guiada</h2>
            <p>Secuencia operativa para completar el dia con evidencia.</p>
          </div>

          <div class="es-kpis es-kpis--session">
            <article>
              <span>Progreso</span>
              <strong>${progressPct}%</strong>
            </article>
            <article>
              <span>Paso activo</span>
              <strong>${escapeHTML(session.currentStepTitle || "Pendiente")}</strong>
            </article>
            <article>
              <span>Bloques</span>
              <strong>${Number(primary.completed) || 0}/${Number(primary.total) || 0}</strong>
            </article>
          </div>

          <div class="es-list">
            <div class="es-list__item">
              <div>
                <strong>Siguiente accion</strong>
                <p>Ruta recomendada por guardrails runtime.</p>
              </div>
              <button data-shell-route="${nextRoute}" class="es-btn es-btn--primary" type="button">Continuar en ${escapeHTML(nextRouteLabel)}</button>
            </div>
            <div class="es-list__item">
              <div>
                <strong>Duracion objetivo</strong>
                <p>${escapeHTML(metrics.sessionMinutesLabel)}</p>
              </div>
              <span>${escapeHTML(metrics.sessionRewardLabel)}</span>
            </div>
          </div>
        </article>

        <article class="es-panel">
          <div class="es-section__head">
            <h3>Ejecucion guiada</h3>
            <p>Workspace operativo para completar pasos y registrar evidencia.</p>
          </div>
          <div id="${this.getSessionHostId()}" class="es-session-host"></div>
        </article>
      </section>
    `;
  }


  renderFlowStatusBanner() {
    const journey = this.getJourneyStateSafe();
    const message = journey.guard?.message || "";
    if (!message) return "";

    const level = journey.guard.level === "warning" ? "warning" : "info";
    const title = level === "warning" ? "Ruta guiada" : "Estado runtime";

    return `
      <article class="es-banner es-banner--${level}">
        <strong>${escapeHTML(title)}</strong>
        <p>${escapeHTML(message)}</p>
      </article>
    `;
  }


  renderClosureView() {
    const journey = this.getJourneyStateSafe();
    const checklist = journey.checklist;

    const checklistRows = [
      ["listening", "Listening"],
      ["speaking", "Speaking"],
      ["reading", "Reading"],
      ["writing", "Writing"],
      ["evidence", "Evidencia"]
    ]
      .map(([key, label]) => {
        const done = Boolean(checklist[key]);
        return `
          <div class="es-list__item">
            <div>
              <strong>${escapeHTML(label)}</strong>
              <p>${done ? "Gate validado" : "Pendiente"}</p>
            </div>
            <span class="${done ? "is-good" : ""}">${done ? "OK" : "Pendiente"}</span>
          </div>
        `;
      })
      .join("");

    const nextAction = journey.stage.closureReady
      ? { route: "evaluacion", label: "Ir a evaluacion" }
      : { route: "sesion", label: "Completar sesion" };

    return `
      <section class="es-section es-view-stack">
        <article class="es-panel">
          <div class="es-section__head">
            <h2>Cierre diario</h2>
            <p>Checklist de continuidad antes de evaluar.</p>
          </div>

          <div class="es-list">${checklistRows}</div>

          <div class="es-actions-row">
            <button data-shell-route="${nextAction.route}" class="es-btn es-btn--primary" type="button">${nextAction.label}</button>
          </div>
        </article>
      </section>
    `;
  }


  renderEvaluationView() {
    const journey = this.getJourneyStateSafe();
    const progress = Number(journey.session.progressPct) || 0;

    const nextAction = journey.stage.evaluationReady
      ? { route: "evaluacion", label: "Evaluación habilitada" }
      : journey.stage.closureReady
        ? { route: "cierre", label: "Completar evidencia" }
        : { route: "sesion", label: "Completar sesión" };

    return `
      <section class="es-section es-view-stack">
        <article class="es-panel">
          <div class="es-section__head">
            <h2>Evaluacion</h2>
            <p>Control de calidad y readiness de sesion.</p>
          </div>

          <div class="es-list">
            <div class="es-list__item">
              <div>
                <strong>Estado actual</strong>
                <p>${escapeHTML(journey.session.status || "locked")}</p>
              </div>
              <span>${Math.max(0, Math.min(100, progress))}%</span>
            </div>

            <div class="es-list__item">
              <div>
                <strong>Habilitacion</strong>
                <p>${journey.stage.evaluationReady
                  ? "Todo listo para evaluar el dia."
                  : "La evaluacion se habilita al cerrar sesion y registrar evidencia."}</p>
              </div>
              <button data-shell-route="${nextAction.route}" class="es-btn es-btn--ghost" type="button" ${nextAction.route === "evaluacion" ? "disabled" : ""}>${nextAction.label}</button>
            </div>
          </div>
        </article>
      </section>
    `;
  }


  renderProgressView() {
    const activeWeek = this.getActiveWeekNumber();
    const totalWeeks = Number(this.program?.programWeeks) || 20;
    const journey = this.getJourneyStateSafe();
    const modulePlan = this.buildModulePlan();

    const activePhase = this.program.phases?.find((phase) => phase.id === this.profile?.progress?.phase_id) || null;
    const currentBand = activePhase?.cefr || "A1";
    const targetCEFR = this.program?.targetCEFR || this.config?.target_cefr || "B2";

    const programProgress = this.getProgramProgress();
    const sessionPct = clampPercent(journey?.session?.progressPct);
    const overallPct = clampPercent((((activeWeek - 1) + (sessionPct / 100)) / Math.max(totalWeeks, 1)) * 100);

    const completedModules = modulePlan.filter((module) => module.state === "completed").length;
    const activeModule = modulePlan.find((module) => module.state === "active")?.title || "Foundation Core";

    const sessions7d = Math.max(1, Math.min(7, Number(programProgress.dayIndex) || 1));
    const minutesPerSession = this.getSessionDurationMinutes();
    const minutes7d = sessions7d * minutesPerSession;
    const accuracyPct = clampPercent(Math.max(sessionPct, journey.stage?.evaluationReady ? 92 : sessionPct + 18));
    const vocabTotal = Math.max(180, (completedModules * 120) + (activeWeek * 36));

    const milestones = [
      {
        title: `Desbloquear ${activeModule}`,
        note: "Consolidar practica guiada y validacion de cierre con evidencia.",
        etaDays: Math.max(7, (totalWeeks - activeWeek) * 3)
      },
      {
        title: "Subir continuidad semanal",
        note: "Sostener ejecucion minima de 6/7 sesiones con checklist completo.",
        etaDays: 14
      },
      {
        title: "Checkpoint CEFR superior",
        note: "Activar evaluacion con flujo completo y scoring estable en speaking.",
        etaDays: 28
      }
    ];

    const flowRows = [
      { label: "Hoy", done: true },
      { label: "Sesion", done: sessionPct > 0 },
      { label: "Cierre", done: Boolean(journey.stage?.closureReady) },
      { label: "Evaluacion", done: Boolean(journey.stage?.evaluationReady) }
    ];

    const heatmap = buildProgressHeatmap(activeWeek + sessionPct);
    const historyRows = buildProgressHistory({
      journey,
      baselineMinutes: minutesPerSession,
      limit: 4
    });

    return renderProgressPremiumView({
      activeWeek,
      totalWeeks,
      targetCEFR,
      currentBand,
      sessionPct,
      overallPct,
      sessions7d,
      minutes7d,
      accuracyPct,
      vocabTotal,
      completedModules,
      totalModules: modulePlan.length,
      activeModule,
      flowRows,
      milestones,
      heatmap,
      historyRows
    });
  }

  getActiveWeekNumber() {
    const fromLabel = Number.parseInt(String(this.activeWeek || "").replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(fromLabel) && fromLabel > 0) {
      return fromLabel;
    }

    const fromProgram = Number(this.program?.weekNumber);
    return Number.isFinite(fromProgram) && fromProgram > 0 ? fromProgram : 1;
  }

  formatWeekRange(startWeek, endWeek) {
    const start = formatWeekLabel(String(startWeek));
    const end = formatWeekLabel(String(endWeek));
    return startWeek === endWeek ? start : `${start} -> ${end}`;
  }

  buildModulePlan() {
    const rawModules = Array.isArray(this.moduleBlueprint?.modules) ? this.moduleBlueprint.modules : [];
    if (rawModules.length === 0) {
      return [];
    }

    const activeWeek = this.getActiveWeekNumber();

    return rawModules.map((module, index) => {
      const startWeek = Number(module.week_start) || index + 1;
      const endWeek = Math.max(startWeek, Number(module.week_end) || startWeek);
      const spanWeeks = Math.max(1, endWeek - startWeek + 1);

      let state = "upcoming";
      if (activeWeek > endWeek) {
        state = "completed";
      } else if (activeWeek >= startWeek) {
        state = "active";
      }

      const completedWeeks =
        state === "completed" ? spanWeeks : state === "active" ? Math.min(spanWeeks, activeWeek - startWeek + 1) : 0;

      const completionPct = Math.round((completedWeeks / spanWeeks) * 100);

      const attachedWeeks = this.weekSummaries
        .filter((week) => Number(week.week) >= startWeek && Number(week.week) <= endWeek)
        .map((week) => ({
          week: Number(week.week),
          title: week.title || `Week ${formatWeekLabel(String(week.week))}`,
          cefr: week?.week_profile?.cefr_target || ""
        }));

      return {
        ...module,
        startWeek,
        endWeek,
        spanWeeks,
        state,
        completionPct,
        attachedWeeks
      };
    });
  }

  renderModulesView() {
    const modulePlan = this.buildModulePlan();

    if (modulePlan.length === 0) {
      return `
        <section class="es-section">
          <div class="es-section__head">
            <h2>Roadmap</h2>
            <p>Blueprint curricular no disponible.</p>
          </div>
          <div class="es-list">
            <div class="es-list__item">
              <div>
                <strong>Sin blueprint cargado</strong>
                <p>Verifica learning/syllabus/modules_0_b2.v1.json.</p>
              </div>
              <span>Bloqueado</span>
            </div>
          </div>
        </section>
      `;
    }

    const pillars = Array.isArray(this.moduleBlueprint?.methodology_pillars)
      ? this.moduleBlueprint.methodology_pillars
      : [];

    const rhythm = Array.isArray(this.moduleBlueprint?.weekly_rhythm)
      ? this.moduleBlueprint.weekly_rhythm
      : [];

    const pillarsMarkup = pillars.map((pillar) => `<span class="es-badge">${escapeHTML(pillar)}</span>`).join("");

    const rhythmMarkup = rhythm
      .map((line) => `<li class="es-rhythm-item">${escapeHTML(line)}</li>`)
      .join("");

    const cardsMarkup = modulePlan.map((module) => this.renderModuleCard(module)).join("");

    return `
      <section class="es-section es-view-stack">
        <article class="es-panel">
          <div class="es-section__head">
            <h2>Modulos curriculares</h2>
            <p>Ruta granular por semanas con estado de ejecucion.</p>
          </div>

          <div class="es-badges">${pillarsMarkup || '<span class="es-badge">Sin pilares definidos</span>'}</div>

          <section class="es-rhythm-block" aria-label="Cadencia semanal">
            <h3 class="es-rhythm-title">Cadencia semanal</h3>
            ${rhythmMarkup
              ? `<ul class="es-rhythm-grid">${rhythmMarkup}</ul>`
              : '<div class="es-list"><div class="es-list__item"><div><strong>Sin ritmo definido</strong><p>Agrega weekly_rhythm en el blueprint.</p></div><span>Pendiente</span></div></div>'}
          </section>
        </article>

        <article class="es-panel">
          <div class="es-section__head">
            <h3>Mapa de modulos</h3>
            <p>Cada modulo contiene objetivo, KPIs, foco metodologico y semanas asociadas.</p>
          </div>
          <div class="es-modules-grid">${cardsMarkup}</div>
        </article>
      </section>
    `;
  }

  renderModuleCard(module) {
    const stateLabel =
      module.state === "completed"
        ? "Completado"
        : module.state === "active"
          ? "Activo"
          : "Próximo";

    const focusPoints = Array.isArray(module.focus_points) ? module.focus_points.slice(0, 3) : [];
    const checkpoints = Array.isArray(module.checkpoints) ? module.checkpoints.slice(0, 2) : [];
    const kpis = module.kpis || {};

    const focusMarkup = focusPoints.map((point) => `<span class="es-chip">${escapeHTML(point)}</span>`).join("");
    const checkpointsMarkup = checkpoints.map((checkpoint) => `<span class="es-chip">${escapeHTML(checkpoint)}</span>`).join("");

    const attachedWeekMarkup = (module.attachedWeeks || [])
      .slice(0, 4)
      .map((week) => `<span class="es-chip">${escapeHTML(formatWeekLabel(String(week.week)))} ${escapeHTML(week.cefr || "")}</span>`)
      .join("");

    return `
      <article class="es-module-card" data-state="${escapeHTML(module.state)}">
        <header class="es-module-card__head">
          <div>
            <h3>${escapeHTML(module.title || "Modulo")}</h3>
            <p>${escapeHTML(module.objective || "Sin objetivo definido")}</p>
          </div>
          <span>${escapeHTML(stateLabel)}</span>
        </header>

        <div class="es-module-card__meta">
          <span class="es-badge">${escapeHTML(module.cefr_band || "A1")}</span>
          <span class="es-badge">${escapeHTML(this.formatWeekRange(module.startWeek, module.endWeek))}</span>
          <span class="es-badge">${module.spanWeeks} semanas</span>
        </div>

        <div class="es-progress" aria-hidden="true"><span style="width:${module.completionPct}%"></span></div>

        <div class="es-kpis es-kpis--module">
          <article><span>Speaking</span><strong>${Number(kpis.speaking_min_minutes) || 0}m</strong></article>
          <article><span>IA Voice</span><strong>${Number(kpis.ai_voice_min_minutes) || 0}m</strong></article>
          <article><span>Cycles</span><strong>${Number(kpis.task_cycles) || 0}</strong></article>
        </div>

        <section class="es-module-card__group">
          <h4>Focus</h4>
          <div class="es-chips-row">${focusMarkup || '<span class="es-chip">Sin focus points</span>'}</div>
        </section>
        <section class="es-module-card__group">
          <h4>Checkpoints</h4>
          <div class="es-chips-row">${checkpointsMarkup || '<span class="es-chip">Sin checkpoints</span>'}</div>
        </section>
        <section class="es-module-card__group">
          <h4>Semanas</h4>
          <div class="es-chips-row">${attachedWeekMarkup || '<span class="es-chip">Sin semanas adjuntas</span>'}</div>
        </section>
      </article>
    `;
  }


  bindEvents() {
    if (!this.container) return;

    if (this.handleClick) {
      this.container.removeEventListener("click", this.handleClick);
    }

    this.handleClick = (e) => {
      const eventTarget = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (!eventTarget) {
        return;
      }

      const navBtn = eventTarget.closest("[data-view-nav]");
      if (navBtn) {
        const viewId = navBtn.dataset.viewNav;
        if (!VIEW_META[viewId]) {
          return;
        }

        this.navigateTo(viewId, "shell_nav");
        return;
      }

      const routeBtn = eventTarget.closest("[data-shell-route]");
      if (routeBtn) {
        const routeId = routeBtn.dataset.shellRoute;
        if (VIEW_META[routeId]) {
          this.navigateTo(routeId, "journey_cta");
        }
        return;
      }

      const actionBtn = eventTarget.closest("[data-shell-action]");
      if (!actionBtn) {
        return;
      }

      const action = actionBtn.dataset.shellAction;
      if (action === "toggle-theme") {
        this.toggleTheme();
        return;
      }

      if (action === "retry-connection") {
        if (this.windowRef?.location && typeof this.windowRef.location.reload === "function") {
          this.windowRef.location.reload();
        }
        return;
      }

      if (action === "open-session") {
        this.navigateTo("sesion", "hero_cta");
        return;
      }

      if (action === "open-roadmap") {
        this.navigateTo("modulos", "hero_cta");
        return;
      }

      if (action === "open-closure") {
        this.navigateTo("cierre", "hero_cta");
        return;
      }

      if (action === "open-evaluation") {
        this.navigateTo("evaluacion", "hero_cta");
      }
    };

    this.container.addEventListener("click", this.handleClick);
  }
}

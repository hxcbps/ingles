import { VIEW_META, VIEW_IDS, NAV_GROUPS } from "./views.js";
import { ICONS } from "./icons.js";

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

  renderLayout(state) {


    const activePhase = this.program.phases?.find((p) => p.id === this.profile.progress?.phase_id) || {
      title: "Foundation",
      id: "phase1",
      cefr: "A0 -> A2"
    };

    const userName = this.profile.name || "Estudiante";
    const userLevel = this.profile.level || "Nivel 1";

    const metrics = this.getDashboardMetrics();
    const isDark = this.theme === UI_THEMES.DARK;
    const themeToggleCopy = this.getThemeToggleCopy();

    return `
      <div class="app-shell font-sans text-slate-900 bg-slate-50 min-h-screen flex selection:bg-indigo-100 selection:text-indigo-700" data-ui-theme="${this.theme}">
        
        <!-- SIDEBAR -->
        <aside class="shell-sidebar hidden lg-flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-50">
          <div class="p-8">
            <div class="flex items-center gap-3 text-brand-600 font-extrabold text-2xl tracking-tight">
              <div class="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-200">
                ${ICONS.bookOpen}
              </div>
              <span>HXC<span class="text-slate-400 font-light underline decoration-brand-300 underline-offset-4">ENGLISH</span></span>
            </div>
          </div>

          <nav class="flex-1 px-6 space-y-2 mt-4">
            <p class="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Navegacion</p>
            ${this.renderNavItems()}
          </nav>

          <div class="p-6 border-t border-slate-100">
             <div class="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
              <p class="text-xs font-bold text-slate-500 uppercase mb-2">Tu Plan</p>
              <p class="text-sm font-bold text-brand-600">${escapeHTML(metrics.planName)}</p>
              <div class="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div class="bg-brand-500 h-full" style="width:${clampPercent(metrics.planProgressPct)}%"></div>
              </div>
            </div>
            <button class="flex items-center gap-3 w-full p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-medium">
              ${ICONS.logOut}
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <!-- MAIN CONTENT AREA -->
        <main class="shell-main flex-1 flex flex-col min-w-0">
          
          <!-- GLASS HEADER -->
          <header class="glass-header sticky top-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-8">
              <!-- Search Bar -->
              <div class="flex-1 max-w-md relative group">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                  ${ICONS.search}
                </div>
                <input 
                  type="text" 
                  placeholder="Busca lecciones, vocabulario o guías..." 
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <!-- Right Actions -->
              <div class="flex items-center gap-4">
                <button
                  data-shell-action="toggle-theme"
                  type="button"
                  class="theme-toggle-btn flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all"
                  aria-label="Cambiar tema visual"
                  title="Cambiar tema"
                >
                  <span class="theme-toggle-icon">${themeToggleCopy.icon}</span>
                  <span class="theme-toggle-label text-[10px] font-black uppercase tracking-widest">${themeToggleCopy.label}</span>
                </button>
                <button class="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                  ${ICONS.bell}
                  <span class="absolute top-1 right-1.5 w-2.5 h-2.5 ${isDark ? 'bg-rose-400 border-slate-900' : 'bg-rose-500 border-white'} border-2 rounded-full"></span>
                </button>
                <div class="h-8 w-[1px] bg-slate-200"></div>
                <div class="flex items-center gap-3 cursor-pointer group">
                  <div class="text-right hidden sm-block">
                    <p class="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">${escapeHTML(userName)}</p>
                    <p class="text-xs text-slate-400 font-medium">${escapeHTML(userLevel)} • Pro</p>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-brand-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-brand-700 font-bold">
                    ${userName.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <!-- SCROLLABLE CONTENT -->
          <div class="p-6 md-p-10 max-w-7xl mx-auto w-full">
            
            <!-- WELCOME & STATS -->
            <div class="grid lg-grid-cols-4 gap-6 mb-10">
              <div class="lg-col-span-2">
                <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">Bienvenido de nuevo, ${escapeHTML(userName.split(' ')[0])}.</h1>
                <p class="text-slate-500 mt-2 text-lg">Has completado el <span class="text-brand-600 font-bold">${escapeHTML(metrics.weeklyProgressLabel)}</span> de la ruta 0 -> B2. Sigue construyendo consistencia.</p>
              </div>
              
              <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div class="p-3 bg-orange-50 text-orange-500 rounded-2xl">${ICONS.flame}</div>
                <div>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">${escapeHTML(metrics.streakTitle)}</p>
                  <p class="text-xl font-black text-slate-800">${metrics.streakLabel}</p>
                </div>
              </div>

               <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div class="p-3 bg-yellow-50 text-yellow-500 rounded-2xl">${ICONS.zap}</div>
                <div>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">${escapeHTML(metrics.xpTitle)}</p>
                  <p class="text-xl font-black text-slate-800">${metrics.xpLabel}</p>
                </div>
              </div>
            </div>

            <!-- DASHBOARD GRID -->
            <div class="grid lg-grid-cols-3 gap-10">
              
              <!-- LEFT COLUMN (FEED) -->
              <div class="lg-col-span-2 space-y-10">
                
                <!-- HERO CARD -->
                ${this.renderHeroCard(activePhase, metrics)}

                <!-- WORKSPACE AREA (Dynamic View Content) -->
                <section id="shell-workspace" class="workspace-area">
                  <div class="flex items-center justify-between mb-8">
                    <div>
                      <h3 class="text-2xl font-black text-slate-800 tracking-tight">Tu Itinerario</h3>
                      <p class="text-slate-400 text-sm font-medium">Basado en tu nivel actual ${activePhase.title}</p>
                    </div>
                    <button class="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2 rounded-xl text-sm font-bold transition-colors">
                      Ver Historial
                    </button>
                  </div>

                  ${this.renderFlowStatusBanner()}

                  <!-- The Views will be injected here (Hoy, Session, Modules) -->
                  <!-- We wrap them in specific containers to match the new styling -->
                  <div class="view-container" data-view-panel="hoy" ${this.activeView !== "hoy" ? "hidden" : ""}>
                     ${this.renderTodayView(metrics)}
                  </div>

                  <div class="view-container" data-view-panel="sesion" ${this.activeView !== "sesion" ? "hidden" : ""}>
                    ${this.renderSessionView()}
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

                  <div class="view-container" data-view-panel="progreso" ${this.activeView !== "progreso" ? "hidden" : ""}>
                    ${this.renderProgressView()}
                  </div>

                </section>
              </div>

              <!-- RIGHT COLUMN (WIDGETS) -->
              <aside class="space-y-10">
                ${this.renderWidgets(metrics)}
              </aside>

            </div>
          </div>
        </main>

        <!-- MOBILE BOTTOM NAV -->
        <nav class="lg-hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 px-6 py-2 flex justify-around items-center safe-pb pb-24">
           ${this.renderMobileNavItems()}
        </nav>

      </div>
    `;
  }

  renderNavItems() {
    return NAV_GROUPS.map((group) => {
      const heading = group.label || group.groupId;
      const items = VIEW_IDS.filter((viewId) => VIEW_META[viewId]?.group === group.groupId).map((viewId) => {
        const meta = VIEW_META[viewId];
        const isActive = this.activeView === viewId;
        const iconKey = meta.icon || "layout";
        const iconSvg = ICONS[iconKey] || ICONS.layout;

        return `
          <button
            data-view-nav="${viewId}"
            class="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive
            ? 'bg-brand-600 text-white shadow-xl shadow-brand-200'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }"
          >
            <span class="${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 group-hover:rotate-6'} transition-all duration-300">
              ${iconSvg}
            </span>
            <span class="font-bold text-sm tracking-tight ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}">
              ${escapeHTML(meta.label)}
            </span>
            ${isActive ? '<div class="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></div>' : ''}
          </button>
        `;
      }).join("");

      if (!items) return "";

      return `
        <section class="nav-group mb-6" aria-label="${escapeHTML(heading)}">
          <p class="nav-group-label">${escapeHTML(heading)}</p>
          ${items}
        </section>
      `;
    }).join("");
  }

  renderMobileNavItems() {
    const mobileViews = VIEW_IDS;

    return mobileViews.map((viewId) => {
      const meta = VIEW_META[viewId];
      if (!meta) return "";

      const isActive = this.activeView === viewId;
      const iconKey = meta.icon || "layout";
      const iconSvg = ICONS[iconKey] || ICONS.layout;

      return `
        <button
          data-view-nav="${viewId}"
          class="flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${isActive ? 'text-brand-600' : 'text-slate-500'}"
        >
          <div class="${isActive ? 'scale-110' : ''} transition-transform">
             ${iconSvg}
          </div>
          <span class="text-[10px] font-bold mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-75'}">
            ${escapeHTML(meta.label)}
          </span>
          <div class="w-1 h-1 rounded-full mt-1 ${isActive ? 'bg-brand-600' : 'bg-slate-300'}"></div>
        </button>
      `;
    }).join("");
  }

  renderHeroCard(phase, metrics = this.getDashboardMetrics()) {
    return `
      <section class="hero-banner relative rounded-[2.5rem] overflow-hidden group">
        <div class="hero-banner-bg absolute inset-0 bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600"></div>
        <!-- Decorative shapes -->
        <div class="hero-orb hero-orb-primary absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div class="hero-orb hero-orb-secondary absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-brand-400/20 rounded-full blur-2xl"></div>
        
        <div class="hero-banner-content relative p-10 md-p-12 text-white flex flex-col md-flex-row items-center gap-10">
          <div class="flex-1">
            <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <span class="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Fase Activa: ${escapeHTML(phase.title)}
            </div>
            <h2 class="text-4xl md-text-5xl font-black mb-6 leading-[1.1]">${escapeHTML(metrics.featureTitle)}</h2>
            <p class="text-indigo-100 text-lg mb-8 max-w-md font-medium leading-relaxed">
              ${escapeHTML(metrics.featureSubtitle)}
            </p>
            <div class="flex flex-wrap gap-4">
              <button data-shell-action="open-session" class="bg-white text-brand-600 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-brand-900/20 flex items-center gap-2">
                Comenzar Ahora - Dia ${formatDayLabel(this.activeDayLabel)}
                ${ICONS.playCircle}
              </button>
              <button data-shell-action="open-roadmap" class="bg-brand-500/30 backdrop-blur-md text-white border border-brand-400/30 px-8 py-4 rounded-2xl font-bold hover:bg-brand-500/50 transition-all">
                Ver Programa
              </button>
            </div>
          </div>
          <div class="hero-banner-emblem w-48 h-48 md-w-64 md-h-64 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 rotate-6 flex items-center justify-center shadow-2xl relative">
            <div class="text-white opacity-80 scale-150">${ICONS.trendingUp}</div>
            <div class="hero-banner-reward absolute -top-4 -right-4 bg-yellow-400 text-brand-900 font-black p-3 rounded-2xl rotate-12 shadow-lg">
              ${escapeHTML(metrics.heroRewardLabel)}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderWidgets(metrics = this.getDashboardMetrics()) {
    return `
      <!-- PROFILE CARD -->
      <div class="widget-card widget-card-profile bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-[4rem] -z-0"></div>
        <div class="relative z-10 text-center">
          <div class="w-24 h-24 rounded-[2rem] bg-brand-600 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-brand-200 rotate-3">
             <div class="text-white scale-150">${ICONS.trophy}</div>
          </div>
          <h3 class="text-2xl font-black text-slate-800 tracking-tight">${escapeHTML(metrics.rankingTitle)}</h3>
          <p class="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">${escapeHTML(metrics.rankingTier)}</p>
          
          <div class="grid grid-cols-2 gap-4 mt-8">
            <div class="bg-slate-50 p-4 rounded-2xl">
              <p class="text-2xl font-black text-brand-600">${escapeHTML(metrics.statPrimaryValue)}</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase">${escapeHTML(metrics.statPrimaryLabel)}</p>
            </div>
            <div class="bg-slate-50 p-4 rounded-2xl">
              <p class="text-2xl font-black text-emerald-600">${escapeHTML(metrics.statSecondaryValue)}</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase">${escapeHTML(metrics.statSecondaryLabel)}</p>
            </div>
          </div>
        </div>
      </div>

    <!-- WEEK THEME -->
    <div class="widget-card widget-card-theme bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative">
      <div class="flex items-center justify-between mb-8">
        <h3 class="font-bold text-brand-400 text-sm tracking-widest uppercase">${escapeHTML(metrics.themeKicker)}</h3>
        <button class="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" type="button" aria-label="Estado semanal">
          <div class="text-yellow-400">${ICONS.zap}</div>
        </button>
      </div>
      <div class="space-y-4">
        <h4 class="text-4xl font-black italic tracking-tight leading-none">${escapeHTML(metrics.themeTitle)}</h4>
        <p class="text-slate-400 text-sm font-mono">${escapeHTML(metrics.themeDescription)}</p>
        <p class="text-slate-300 text-lg leading-relaxed">${escapeHTML(metrics.themeFootnote)}</p>
        <div class="pt-4 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">OK</div>
          <p class="text-xs text-slate-400">${escapeHTML(metrics.peersLabel)}</p>
        </div>
      </div>
    </div>
  `;
}

  renderTodayView(metrics = this.getDashboardMetrics()) {
    const sessionProgressPct = clampPercent(metrics.sessionProgressPct);
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
            return `<li><span>Paso ${index + 1}: ${escapeHTML(step.title)} (${duration})</span><strong>${stepStatusLabel(step.status)}</strong></li>`;
          })
          .join("")
      : "<li><span>Sin pasos cargados para hoy.</span><strong>Bloqueado</strong></li>";

    return `
      <div class="space-y-4">

        <div class="journey-card journey-card-session bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-brand-500 transition-all flex flex-col sm-flex-row sm-items-center gap-6 group shadow-sm hover:shadow-brand-100/50" data-shell-action="open-session">
          <div class="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center bg-brand-50 text-brand-500 group-hover:scale-110 transition-transform">
            ${ICONS.playCircle}
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-[10px] font-black bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full uppercase tracking-widest">DIARIO</span>
              <span class="text-xs font-bold text-slate-400 flex items-center gap-1">
                ${ICONS.clock} ${escapeHTML(metrics.sessionMinutesLabel)}
              </span>
              <span class="text-xs font-bold text-emerald-600">${escapeHTML(metrics.sessionRewardLabel)}</span>
            </div>
            <h4 class="text-xl font-bold text-slate-800 group-hover:text-brand-600 transition-colors">Sesion Operativa del Dia</h4>
            <p class="text-slate-500 text-sm mt-1 leading-relaxed">Abre la sesion guiada para completar pasos medibles y destrabar cierre/evaluacion.</p>
            <div class="mt-4">
              <button data-shell-action="open-session" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors" type="button">
                Abrir sesion guiada
              </button>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-right hidden md-block">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">${escapeHTML(metrics.sessionStatusLabel)}</p>
              <div class="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-brand-500 h-full" style="width:${sessionProgressPct}%"></div>
              </div>
            </div>
            <div class="p-3 bg-slate-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white transition-all">
              ${ICONS.chevronRight}
            </div>
          </div>
        </div>

        <article class="modules-intro-card">
          <p class="section-kicker">Itinerario del dia</p>
          <h4>Ruta accionable paso a paso</h4>
          <p class="muted-text">Cada paso tiene estado y criterio de avance para que sepas exactamente como progresar.</p>
          <div class="modules-rhythm">
            <ul>${itineraryMarkup}</ul>
          </div>
        </article>

        <div class="journey-card journey-card-roadmap bg-white border border-slate-200 p-6 rounded-[2rem] opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex flex-col sm-flex-row sm-items-center gap-6 group cursor-pointer" data-shell-action="open-roadmap">
          <div class="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-300">
            ${ICONS.playCircle}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-[10px] font-black bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full uppercase tracking-widest">${escapeHTML(metrics.upcomingTag)}</span>
            </div>
            <h4 class="text-xl font-bold text-slate-800">${escapeHTML(metrics.upcomingTitle)}</h4>
            <p class="text-slate-500 text-sm mt-1">${escapeHTML(metrics.upcomingDescription)}</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-2xl">
            ${ICONS.chevronRight}
          </div>
        </div>

      </div>
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
      <div class="space-y-4">
        <article class="modules-intro-card session-intro-card journey-card journey-card-session-overview">
          <p class="section-kicker">Sesion guiada</p>
          <h4>Ruta operativa de hoy</h4>
          <p class="muted-text">
            Ejecuta los pasos en orden: practica, valida gate y registra evidencia para desbloquear cierre y evaluacion.
          </p>

          <div class="modules-rhythm">
            <ul>
              <li><span>Progreso actual</span><strong>${progressPct}%</strong></li>
              <li><span>Paso activo</span><strong>${escapeHTML(session.currentStepTitle || "Pendiente")}</strong></li>
              <li><span>Bloques completados</span><strong>${Number(primary.completed) || 0}/${Number(primary.total) || 0}</strong></li>
            </ul>
          </div>

          <button data-shell-route="${nextRoute}" class="session-mini-cta" type="button">
            Continuar en ${escapeHTML(nextRouteLabel)}
          </button>
        </article>

        <div id="${this.getSessionHostId()}"></div>
      </div>
    `;
  }

  renderFlowStatusBanner() {
    const journey = this.getJourneyStateSafe();
    const message = journey.guard?.message || "";
    if (!message) {
      return "";
    }

    const title = journey.guard.level === "warning" ? "Ruta guiada" : "Estado de navegacion";

    return `
      <article class="modules-intro-card">
        <p class="section-kicker">Navegacion</p>
        <h4>${escapeHTML(title)}</h4>
        <p class="muted-text">${escapeHTML(message)}</p>
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
        return `<li><span>${escapeHTML(label)}</span><strong>${done ? "OK" : "Pendiente"}</strong></li>`;
      })
      .join("");

    const nextAction = journey.stage.closureReady
      ? { route: "evaluacion", label: "Ir a evaluacion" }
      : { route: "sesion", label: "Completar sesion" };

    return `
      <article class="modules-intro-card journey-card journey-card-governance">
        <p class="section-kicker">Cierre diario</p>
        <h4>Consolidacion y checklist</h4>
        <p class="muted-text">${journey.stage.closureReady
          ? "Checklist base completado. Puedes pasar a evaluacion cuando registres evidencia."
          : "Aun faltan bloques base de ejecucion. Completa sesion antes de cierre."}</p>

        <div class="modules-rhythm">
          <h5>Checklist de continuidad</h5>
          <ul>${checklistRows}</ul>
        </div>

        <button data-shell-route="${nextAction.route}" class="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors" type="button">
          ${nextAction.label}
        </button>
      </article>
    `;
  }

  renderEvaluationView() {
    const journey = this.getJourneyStateSafe();
    const progress = Number(journey.session.progressPct) || 0;

    const nextAction = journey.stage.evaluationReady
      ? { route: "evaluacion", label: "Evaluacion habilitada" }
      : journey.stage.closureReady
        ? { route: "cierre", label: "Completar evidencia" }
        : { route: "sesion", label: "Completar sesion" };

    return `
      <article class="modules-intro-card journey-card journey-card-governance">
        <p class="section-kicker">Evaluacion</p>
        <h4>Control de calidad de la sesion</h4>
        <p class="muted-text">Estado: ${escapeHTML(journey.session.status || "locked")} | Avance: ${Math.max(0, Math.min(100, progress))}%</p>
        <p class="muted-text">${journey.stage.evaluationReady
          ? "Todo listo para evaluar el dia."
          : "La evaluacion se habilita al cerrar sesion y registrar evidencia."}</p>

        <button data-shell-route="${nextAction.route}" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-sm font-bold transition-colors" type="button" ${nextAction.route === "evaluacion" ? "disabled" : ""}>
          ${nextAction.label}
        </button>
      </article>
    `;
  }

  renderProgressView() {
    const activeWeek = this.getActiveWeekNumber();
    const totalWeeks = Number(this.program?.programWeeks) || 20;
    const pct = Math.max(0, Math.min(100, Math.round((activeWeek / totalWeeks) * 100)));
    const journey = this.getJourneyStateSafe();
    const modulePlan = this.buildModulePlan();

    const completedModules = modulePlan.filter((module) => module.state === "completed").length;
    const activeModule = modulePlan.find((module) => module.state === "active")?.title || "Sin modulo activo";

    const flowRows = [
      ["Hoy", true],
      ["Sesion", journey.session.progressPct > 0],
      ["Cierre", journey.stage.closureReady],
      ["Evaluacion", journey.stage.evaluationReady]
    ]
      .map(([label, done]) => `<li><span>${label}</span><strong>${done ? "Listo" : "Pendiente"}</strong></li>`)
      .join("");

    return `
      <article class="modules-intro-card journey-card journey-card-governance">
        <p class="section-kicker">Progreso</p>
        <h4>Ruta semanal 0 -> B2</h4>
        <p class="muted-text">Semana activa: ${escapeHTML(formatWeekLabel(String(activeWeek)))} de ${totalWeeks}. Progreso estimado: ${pct}%.</p>

        <div class="modules-rhythm">
          <h5>Continuidad de navegacion</h5>
          <ul>${flowRows}</ul>
        </div>

        <p class="muted-text">Modulo activo: ${escapeHTML(activeModule)} | Modulos completados: ${completedModules}/${modulePlan.length || 0}.</p>
      </article>
    `;
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
        <article class="modules-intro-card">
          <p class="section-kicker">Ruta 0 -> B2</p>
          <h4>Blueprint no disponible</h4>
          <p class="muted-text">No se encontro la definicion curricular. Verifica learning/syllabus/modules_0_b2.v1.json.</p>
        </article>
      `;
    }

    const pillars = Array.isArray(this.moduleBlueprint?.methodology_pillars)
      ? this.moduleBlueprint.methodology_pillars
      : [];

    const rhythm = Array.isArray(this.moduleBlueprint?.weekly_rhythm)
      ? this.moduleBlueprint.weekly_rhythm
      : [];

    const pillarsMarkup = pillars
      .map((pillar) => `<span class="module-pillar-chip">${escapeHTML(pillar)}</span>`)
      .join("");

    const rhythmMarkup = rhythm
      .map((line) => `<li>${escapeHTML(line)}</li>`)
      .join("");

    const cardsMarkup = modulePlan
      .map((module) => this.renderModuleCard(module))
      .join("");

    return `
      <section class="modules-hub">
        <article class="modules-intro-card modules-overview-card">
          <p class="section-kicker">Arquitectura Curricular</p>
          <h4>Ruta 0 -> B2 con TBLT + IA Conversacional</h4>
          <p class="muted-text">Plan granular con input comprensible, tareas comunicativas, practica de voz y checkpoints de desempeno.</p>

          <div class="modules-pillars">${pillarsMarkup}</div>

          <div class="modules-rhythm">
            <h5>Cadencia semanal de ejecucion</h5>
            <ul>${rhythmMarkup}</ul>
          </div>
        </article>

        <div class="modules-grid">${cardsMarkup}</div>
      </section>
    `;
  }

  renderModuleCard(module) {
    const stateLabel =
      module.state === "completed"
        ? "Completado"
        : module.state === "active"
          ? "Activo"
          : "Proximo";

    const focusPoints = Array.isArray(module.focus_points) ? module.focus_points.slice(0, 4) : [];
    const checkpoints = Array.isArray(module.checkpoints) ? module.checkpoints.slice(0, 2) : [];
    const kpis = module.kpis || {};

    const focusMarkup = focusPoints
      .map((point) => `<li>${escapeHTML(point)}</li>`)
      .join("");

    const checkpointsMarkup = checkpoints
      .map((checkpoint) => `<li>${escapeHTML(checkpoint)}</li>`)
      .join("");

    const attachedWeekMarkup = (module.attachedWeeks || [])
      .slice(0, 4)
      .map((week) => `<span class="module-week-pill">${escapeHTML(formatWeekLabel(String(week.week)))} ${escapeHTML(week.cefr || "")}</span>`)
      .join("");

    return `
      <article class="module-card-pro" data-state="${escapeHTML(module.state)}">
        <div class="module-card-head">
          <span class="module-level-badge">${escapeHTML(module.cefr_band || "A1")}</span>
          <span class="module-state-badge">${escapeHTML(stateLabel)}</span>
        </div>

        <h4>${escapeHTML(module.title || "Modulo")}</h4>
        <p class="module-goal">${escapeHTML(module.objective || "Sin objetivo definido.")}</p>

        <div class="module-range-row">
          <span>${escapeHTML(this.formatWeekRange(module.startWeek, module.endWeek))}</span>
          <span>${module.spanWeeks} semanas</span>
        </div>

        <div class="module-progress-track" aria-hidden="true">
          <div class="module-progress-fill" style="width: ${module.completionPct}%"></div>
        </div>

        <div class="module-kpi-grid">
          <article>
            <strong>${Number(kpis.speaking_min_minutes) || 0}m</strong>
            <span>Speaking</span>
          </article>
          <article>
            <strong>${Number(kpis.ai_voice_min_minutes) || 0}m</strong>
            <span>IA Voice</span>
          </article>
          <article>
            <strong>${Number(kpis.task_cycles) || 0}</strong>
            <span>Task Cycles</span>
          </article>
        </div>

        <div class="module-method-box">
          <p><strong>Metodo:</strong> ${escapeHTML(module.primary_method || "N/A")}</p>
          <p><strong>IA:</strong> ${escapeHTML(module.ai_usecase || "N/A")}</p>
          <p><strong>Output:</strong> ${escapeHTML(module.weekly_output || "N/A")}</p>
          <p><strong>Afectivo:</strong> ${escapeHTML(module.anxiety_protocol || "N/A")}</p>
        </div>

        <div class="module-list-block">
          <h5>Focus operativo</h5>
          <ul>${focusMarkup}</ul>
        </div>

        <div class="module-list-block">
          <h5>Checkpoints</h5>
          <ul>${checkpointsMarkup}</ul>
        </div>

        <div class="module-week-strip">${attachedWeekMarkup}</div>
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

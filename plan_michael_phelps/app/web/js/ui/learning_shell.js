const VIEW_IDS = Object.freeze(["hoy", "ruta", "sesion", "modulos", "progreso"]);

const VIEW_META = Object.freeze({
  hoy: Object.freeze({
    label: "Hoy",
    subtitle: "Inicio operativo"
  }),
  ruta: Object.freeze({
    label: "Ruta 0 -> B2",
    subtitle: "Mapa completo"
  }),
  sesion: Object.freeze({
    label: "Sesion guiada",
    subtitle: "Modo enfoque"
  }),
  modulos: Object.freeze({
    label: "Modulos",
    subtitle: "Semanas y dias"
  }),
  progreso: Object.freeze({
    label: "Progreso",
    subtitle: "Control de avance"
  })
});

const HASH_PREFIX = "#/modulo/";

const HASH_ALIASES = Object.freeze({
  "#/today": "hoy",
  "#/today/action": "hoy",
  "#/today/session": "sesion",
  "#/today/close": "modulos",
  "#/today/evaluate": "progreso"
});

const DAY_ORDER = Object.freeze(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

const DAY_LABEL_ES = Object.freeze({
  Mon: "Lunes",
  Tue: "Martes",
  Wed: "Miercoles",
  Thu: "Jueves",
  Fri: "Viernes",
  Sat: "Sabado",
  Sun: "Domingo"
});

const ROADMAP_PHASES = Object.freeze([
  Object.freeze({
    id: "phase-1",
    title: "Fase 1 · Foundation",
    weeks: "W01-W05",
    cefr: "A0 -> A2",
    weekStart: 1,
    weekEnd: 5,
    outcomes: [
      "Habitos diarios de estudio y control de progreso",
      "Comprension basica y produccion guiada",
      "Estructuras esenciales para conversar"
    ]
  }),
  Object.freeze({
    id: "phase-2",
    title: "Fase 2 · Build-up",
    weeks: "W06-W10",
    cefr: "A2 -> B1",
    weekStart: 6,
    weekEnd: 10,
    outcomes: [
      "Fluidez inicial con menos bloqueos",
      "Consolidacion de tiempos verbales nucleares",
      "Primer checkpoint formal de desempeno"
    ]
  }),
  Object.freeze({
    id: "phase-3",
    title: "Fase 3 · Integration",
    weeks: "W11-W15",
    cefr: "B1 -> B2-",
    weekStart: 11,
    weekEnd: 15,
    outcomes: [
      "Conversaciones de mayor duracion",
      "Transferencia lexical y precision",
      "Checkpoint B2- con tareas bajo presion"
    ]
  }),
  Object.freeze({
    id: "phase-4",
    title: "Fase 4 · Performance",
    weeks: "W16-W20",
    cefr: "B2",
    weekStart: 16,
    weekEnd: 20,
    outcomes: [
      "Simulaciones reales y retroalimentacion fina",
      "Control de reparacion y pronunciacion",
      "Mock final y certificacion conversacional B2"
    ]
  })
]);

const METHOD_PILLARS = Object.freeze([
  Object.freeze({
    title: "Control activo",
    detail: "La app dirige ejecucion diaria y evita navegacion desordenada."
  }),
  Object.freeze({
    title: "Practica relevante",
    detail: "Cada paso conecta con un objetivo comunicativo real."
  }),
  Object.freeze({
    title: "Evidencia obligatoria",
    detail: "No hay avance sin pruebas y validacion de gate."
  }),
  Object.freeze({
    title: "Escalado por fases",
    detail: "El plan progresa desde base A0/A1 hasta performance B2."
  })
]);

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHash(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";

  if (trimmed.startsWith("#")) {
    return trimmed.length > 1 && trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `#${trimmed}`;
  }

  return `#/${trimmed}`;
}

function resolveViewIdFromHash(rawHash) {
  const hash = normalizeHash(rawHash);
  if (!hash || hash === "#") return "hoy";

  if (HASH_ALIASES[hash]) {
    return HASH_ALIASES[hash];
  }

  if (hash.startsWith(HASH_PREFIX)) {
    const candidate = hash.slice(HASH_PREFIX.length).trim();
    if (VIEW_IDS.includes(candidate)) {
      return candidate;
    }
  }

  return "hoy";
}

function hashForViewId(viewId) {
  const safe = VIEW_IDS.includes(viewId) ? viewId : "hoy";
  return `${HASH_PREFIX}${safe}`;
}

function formatDayLabel(dayLabel) {
  return DAY_LABEL_ES[dayLabel] || dayLabel || "Dia";
}

function toSentence(value, fallback = "-") {
  const safe = String(value || "").trim();
  return safe || fallback;
}

function hasSession(dayData) {
  return Boolean(Array.isArray(dayData?.session_script) && dayData.session_script.length > 0);
}

function sumStepMinutes(steps = []) {
  return steps.reduce((total, step) => total + (Number(step?.duration_min) || 0), 0);
}

function formatMinutes(totalMinutes) {
  const safe = Math.max(0, Math.round(Number(totalMinutes) || 0));
  return `${safe} min`;
}

function formatWeekLabel(week) {
  return `W${String(week).padStart(2, "0")}`;
}

function getPhaseForWeek(week) {
  const safeWeek = Number(week) || 1;
  return ROADMAP_PHASES.find((phase) => safeWeek >= phase.weekStart && safeWeek <= phase.weekEnd) || ROADMAP_PHASES[0];
}

function defaultSessionSnapshot() {
  return {
    progressPct: 0,
    completed: false,
    currentStepTitle: "Sesion no iniciada",
    currentStepType: "-",
    currentStepIndex: 0,
    totalSteps: 0,
    status: "locked",
    retryCount: 0
  };
}

function mergeSnapshot(rawSnapshot) {
  const safe = rawSnapshot && typeof rawSnapshot === "object" ? rawSnapshot : {};
  const base = defaultSessionSnapshot();
  return {
    ...base,
    ...safe,
    progressPct: clamp(Number(safe.progressPct) || base.progressPct, 0, 100),
    currentStepIndex: Math.max(0, Number(safe.currentStepIndex) || base.currentStepIndex),
    totalSteps: Math.max(0, Number(safe.totalSteps) || base.totalSteps),
    retryCount: Math.max(0, Number(safe.retryCount) || base.retryCount)
  };
}

function summarizeWeek(weekEntry) {
  const days = weekEntry?.days && typeof weekEntry.days === "object" ? weekEntry.days : {};
  const activeDays = DAY_ORDER.filter((dayKey) => hasSession(days[dayKey]));

  const totalSteps = activeDays.reduce((acc, dayKey) => {
    const script = days[dayKey]?.session_script || [];
    return acc + script.length;
  }, 0);

  const totalMinutes = activeDays.reduce((acc, dayKey) => {
    const script = days[dayKey]?.session_script || [];
    return acc + sumStepMinutes(script);
  }, 0);

  return {
    activeDays,
    totalSteps,
    totalMinutes
  };
}

function selectWeeksForCatalog(weekSummaries, totalWeeks) {
  if (Array.isArray(weekSummaries) && weekSummaries.length > 0) {
    return [...weekSummaries].sort((a, b) => Number(a.week) - Number(b.week));
  }

  const safeWeeks = Math.max(1, Number(totalWeeks) || 20);
  return Array.from({ length: safeWeeks }, (_, index) => ({
    week: index + 1,
    title: `Week ${String(index + 1).padStart(2, "0")}`,
    week_profile: {}
  }));
}

export class LearningShell {
  constructor(containerId, {
    program,
    config,
    weekSummaries = [],
    activeWeekLabel,
    activeDayLabel,
    activeDayContent,
    fallbackNotice = "",
    getSessionSnapshot = () => defaultSessionSnapshot(),
    onViewChange = null
  } = {}) {
    this.container = document.getElementById(containerId);
    this.program = program || {};
    this.config = config || {};
    this.weekSummaries = selectWeeksForCatalog(weekSummaries, this.program?.programWeeks);
    this.activeWeek = Number(activeWeekLabel) || Number(this.program?.weekNumber) || 1;
    this.activeDayLabel = activeDayLabel || this.program?.dayLabel || "Mon";
    this.activeDayContent = activeDayContent || {};
    this.fallbackNotice = fallbackNotice;
    this.getSessionSnapshot = typeof getSessionSnapshot === "function" ? getSessionSnapshot : () => defaultSessionSnapshot();
    this.onViewChange = typeof onViewChange === "function" ? onViewChange : null;

    this.state = {
      viewId: "hoy",
      selectedWeek: this.activeWeek
    };

    this.boundHashChange = () => this.syncFromHash();
    this.boundContainerClick = (event) => this.handleContainerClick(event);
    this.boundWeekPickerChange = (event) => this.handleWeekPickerChange(event);
  }

  getSessionHostId() {
    return "session-wizard-host";
  }

  dispose() {
    window.removeEventListener("hashchange", this.boundHashChange);

    if (this.container) {
      this.container.removeEventListener("click", this.boundContainerClick);
    }

    const weekPicker = this.container?.querySelector("#week-picker");
    if (weekPicker) {
      weekPicker.removeEventListener("change", this.boundWeekPickerChange);
    }
  }

  render() {
    if (!this.container) return;

    this.container.classList.add("learning-shell-host");
    this.container.innerHTML = this.renderLayout();

    this.container.addEventListener("click", this.boundContainerClick);

    const weekPicker = this.container.querySelector("#week-picker");
    if (weekPicker) {
      weekPicker.addEventListener("change", this.boundWeekPickerChange);
    }

    window.addEventListener("hashchange", this.boundHashChange);

    this.syncFromHash({ replace: true });
    this.updateWeekDetail();
    this.refresh();
  }

  refresh() {
    if (!this.container) return;

    const snapshot = mergeSnapshot(this.getSessionSnapshot());
    const todayGoal = toSentence(this.activeDayContent?.goal, "Define objetivo del dia.");

    const totalWeeks = Math.max(1, Number(this.program?.programWeeks) || this.weekSummaries.length || 20);
    const safeWeekForProgress = clamp(this.activeWeek, 1, totalWeeks);
    const programProgress = clamp(Math.round((safeWeekForProgress / totalWeeks) * 100), 0, 100);

    const activePhase = getPhaseForWeek(this.activeWeek);
    const statusLine = this.resolveStatusLine(snapshot);

    this.setText("status-line", statusLine.text);
    this.setAttr("status-line", "data-tone", statusLine.tone);

    this.setText("topbar-week", formatWeekLabel(this.activeWeek));
    this.setText("topbar-day", formatDayLabel(this.activeDayLabel));
    this.setText("topbar-cefr", toSentence(this.program?.targetCEFR, "B2"));
    this.setText("topbar-phase", `${activePhase.title} · ${activePhase.cefr}`);

    this.setText("program-progress-value", `${programProgress}%`);
    this.setStyle("program-progress-fill", "width", `${programProgress}%`);

    this.setText("session-progress-value", `${snapshot.progressPct}%`);
    this.setStyle("session-progress-fill", "width", `${snapshot.progressPct}%`);

    this.setText("today-goal", todayGoal);
    this.setText("today-step", this.describeCurrentStep(snapshot));
    this.setText("today-next-action", this.describeNextAction(snapshot));
    this.setText("today-cta", snapshot.progressPct > 0 && !snapshot.completed ? "Reanudar sesion" : "Comenzar sesion");

    this.setText("progress-current-step", this.describeCurrentStep(snapshot));
    this.setText("progress-stage", `${snapshot.currentStepIndex}/${snapshot.totalSteps || 0}`);
    this.setText("progress-gate-state", this.describeSessionState(snapshot));
    this.setText("progress-retries", String(snapshot.retryCount));
    this.setText("progress-program", `${formatWeekLabel(this.activeWeek)} de ${formatWeekLabel(totalWeeks)}`);

    const evidencePath = `tracking/daily/${this.program?.isoDate || "YYYY-MM-DD"}`;
    this.setText("progress-evidence-path", evidencePath);
  }

  navigate(viewId, { replace = false } = {}) {
    const safeView = VIEW_IDS.includes(viewId) ? viewId : "hoy";
    const targetHash = hashForViewId(safeView);
    const currentHash = normalizeHash(window.location.hash);

    if (replace && window.history?.replaceState) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${targetHash}`);
      this.applyView(safeView);
      return;
    }

    if (currentHash === targetHash) {
      this.applyView(safeView);
      return;
    }

    window.location.hash = targetHash;
  }

  syncFromHash({ replace = false } = {}) {
    const safeView = resolveViewIdFromHash(window.location.hash);
    const canonicalHash = hashForViewId(safeView);
    const currentHash = normalizeHash(window.location.hash);

    if (replace || currentHash !== canonicalHash) {
      if (window.history?.replaceState) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${canonicalHash}`);
      } else {
        window.location.hash = canonicalHash;
      }
    }

    this.applyView(safeView);
  }

  applyView(viewId) {
    const safeView = VIEW_IDS.includes(viewId) ? viewId : "hoy";
    const changed = this.state.viewId !== safeView;
    this.state.viewId = safeView;

    this.container.querySelectorAll("[data-view-nav]").forEach((button) => {
      const isActive = button.getAttribute("data-view-nav") === safeView;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });

    this.container.querySelectorAll("[data-view-panel]").forEach((panel) => {
      const visible = panel.getAttribute("data-view-panel") === safeView;
      panel.hidden = !visible;
      panel.setAttribute("aria-hidden", visible ? "false" : "true");
    });

    this.container.setAttribute("data-active-view", safeView);

    const heading = this.container.querySelector(`[data-view-heading="${safeView}"]`);
    if (heading && typeof heading.focus === "function") {
      if (!heading.getAttribute("tabindex")) {
        heading.setAttribute("tabindex", "-1");
      }
      try {
        heading.focus({ preventScroll: true });
      } catch {
        heading.focus();
      }
    }

    if (changed && typeof this.onViewChange === "function") {
      this.onViewChange({ viewId: safeView });
    }
  }

  handleContainerClick(event) {
    const navButton = event.target.closest("[data-view-nav]");
    if (navButton) {
      const targetView = navButton.getAttribute("data-view-nav") || "hoy";
      this.navigate(targetView);
      return;
    }

    const weekCardButton = event.target.closest("[data-week-select]");
    if (weekCardButton) {
      const week = Number(weekCardButton.getAttribute("data-week-select"));
      this.selectWeek(week);
      this.navigate("modulos");
      return;
    }

    const actionNode = event.target.closest("[data-shell-action]");
    if (!actionNode) return;

    const action = actionNode.getAttribute("data-shell-action");
    if (action === "open-session") {
      this.navigate("sesion");
      return;
    }

    if (action === "open-roadmap") {
      this.navigate("ruta");
      return;
    }

    if (action === "open-modules") {
      this.navigate("modulos");
    }
  }

  handleWeekPickerChange(event) {
    const week = Number(event.target?.value);
    this.selectWeek(week);
  }

  selectWeek(week) {
    if (!Number.isInteger(week) || week <= 0) return;
    this.state.selectedWeek = week;

    const picker = this.container.querySelector("#week-picker");
    if (picker && String(picker.value) !== String(week)) {
      picker.value = String(week);
    }

    this.container.querySelectorAll("[data-week-select]").forEach((button) => {
      const isActive = Number(button.getAttribute("data-week-select")) === week;
      button.classList.toggle("is-selected", isActive);
    });

    this.updateWeekDetail();
  }

  updateWeekDetail() {
    const weekDetail = this.container.querySelector("#week-detail");
    const daysGrid = this.container.querySelector("#week-days-grid");

    if (!weekDetail || !daysGrid) return;

    const weekEntry = this.weekSummaries.find((item) => Number(item.week) === Number(this.state.selectedWeek));
    if (!weekEntry) {
      weekDetail.innerHTML = `
        <article class="surface-card info-card">
          <h3>Semana sin contenido</h3>
          <p>La semana seleccionada aun no tiene datos V4 disponibles.</p>
        </article>
      `;
      daysGrid.innerHTML = "";
      return;
    }

    const summary = summarizeWeek(weekEntry);
    const phase = getPhaseForWeek(weekEntry.week);
    const profile = weekEntry.week_profile || {};

    weekDetail.innerHTML = `
      <article class="surface-card week-detail-card">
        <p class="section-kicker">${escapeHTML(formatWeekLabel(weekEntry.week))}</p>
        <h3>${escapeHTML(toSentence(weekEntry.title, "Semana"))}</h3>
        <p class="muted-text">${escapeHTML(toSentence(profile.focus_theme, "Sin tema declarado"))}</p>
        <div class="chip-row">
          <span class="chip">CEFR: ${escapeHTML(toSentence(profile.cefr_target, phase.cefr))}</span>
          <span class="chip">Fase: ${escapeHTML(phase.title)}</span>
          <span class="chip">Dias activos: ${summary.activeDays.length}</span>
          <span class="chip">Pasos: ${summary.totalSteps}</span>
          <span class="chip">Carga: ${formatMinutes(summary.totalMinutes)}</span>
        </div>
      </article>
    `;

    const days = weekEntry.days && typeof weekEntry.days === "object" ? weekEntry.days : {};

    daysGrid.innerHTML = DAY_ORDER.map((dayKey) => {
      const dayData = days[dayKey] || {};
      const script = Array.isArray(dayData.session_script) ? dayData.session_script : [];
      const isActive = script.length > 0;
      const dayName = formatDayLabel(dayKey);
      const goal = toSentence(dayData.goal, "Sin objetivo cargado.");
      const loadText = isActive ? `${script.length} pasos · ${formatMinutes(sumStepMinutes(script))}` : "Sin sesion ejecutable";

      return `
        <article class="day-plan-card ${isActive ? "is-active" : "is-empty"}">
          <header>
            <h4>${escapeHTML(dayName)}</h4>
            <span>${escapeHTML(loadText)}</span>
          </header>
          <p>${escapeHTML(goal)}</p>
        </article>
      `;
    }).join("");
  }

  renderLayout() {
    const activePhase = getPhaseForWeek(this.activeWeek);

    return `
      <section class="learning-shell" aria-label="English Sprint professional shell">
        <aside class="shell-sidebar" aria-label="Navegacion principal por modulos">
          <div class="brand-block">
            <p class="brand-overline">English Sprint</p>
            <h1>Execution Coach</h1>
            <p class="brand-caption">Plan estructurado para pasar de base inicial a nivel B2 conversacional.</p>
          </div>

          <div class="sidebar-phase-card">
            <p class="section-kicker">Fase activa</p>
            <h2>${escapeHTML(activePhase.title)}</h2>
            <p>${escapeHTML(activePhase.cefr)}</p>
          </div>

          <nav class="module-nav" aria-label="Modulos del producto">
            ${VIEW_IDS.map((viewId) => {
              const meta = VIEW_META[viewId];
              return `
                <button class="module-nav-item" type="button" data-view-nav="${viewId}">
                  <span>${escapeHTML(meta.label)}</span>
                  <small>${escapeHTML(meta.subtitle)}</small>
                </button>
              `;
            }).join("")}
          </nav>

          <section class="sidebar-guide">
            <p class="section-kicker">Flujo recomendado</p>
            <ol>
              <li>Revisar ruta y objetivo de hoy.</li>
              <li>Ejecutar sesion guiada completa.</li>
              <li>Consolidar avance semanal y evidencia.</li>
            </ol>
          </section>
        </aside>

        <div class="shell-main">
          <header class="shell-topbar">
            <div>
              <p class="section-kicker">Control diario</p>
              <h2>Arquitectura modular de aprendizaje</h2>
              <p class="muted-text">Navegacion clara, modulos congruentes y ejecucion guiada con gates.</p>
            </div>

            <div class="topbar-chip-grid">
              <article class="topbar-chip">
                <span>Semana</span>
                <strong id="topbar-week">${escapeHTML(formatWeekLabel(this.activeWeek))}</strong>
              </article>
              <article class="topbar-chip">
                <span>Dia</span>
                <strong id="topbar-day">${escapeHTML(formatDayLabel(this.activeDayLabel))}</strong>
              </article>
              <article class="topbar-chip">
                <span>Objetivo CEFR</span>
                <strong id="topbar-cefr">${escapeHTML(toSentence(this.program?.targetCEFR, "B2"))}</strong>
              </article>
            </div>
          </header>

          <section class="status-strip" id="status-line" data-tone="info" aria-live="polite">
            Sistema listo para ejecutar.
          </section>

          <section class="progress-overview">
            <article class="surface-card progress-card">
              <p class="section-kicker">Progreso del programa</p>
              <div class="progress-heading-row">
                <h3 id="topbar-phase">${escapeHTML(activePhase.title)}</h3>
                <strong id="program-progress-value">0%</strong>
              </div>
              <div class="progress-track">
                <div id="program-progress-fill" class="progress-fill"></div>
              </div>
            </article>

            <article class="surface-card progress-card">
              <p class="section-kicker">Progreso de sesion</p>
              <div class="progress-heading-row">
                <h3>Ejecucion del dia</h3>
                <strong id="session-progress-value">0%</strong>
              </div>
              <div class="progress-track">
                <div id="session-progress-fill" class="progress-fill progress-fill-session"></div>
              </div>
            </article>
          </section>

          <main class="module-stage" aria-live="polite">
            <section class="module-panel" data-view-panel="hoy" aria-hidden="true">
              <h3 class="panel-title" data-view-heading="hoy">Inicio operativo del dia</h3>
              <div class="panel-grid panel-grid-2">
                <article class="surface-card hero-card">
                  <p class="section-kicker">Objetivo de hoy</p>
                  <h4 id="today-goal">-</h4>
                  <p class="muted-text">Sigue una secuencia fija para mantener foco y evitar navegacion confusa.</p>
                  <div class="button-row">
                    <button class="btn-primary" type="button" data-shell-action="open-session" id="today-cta">Comenzar sesion</button>
                    <button class="btn-secondary" type="button" data-shell-action="open-roadmap">Ver ruta completa</button>
                  </div>
                </article>

                <article class="surface-card info-card">
                  <p class="section-kicker">Estado de sesion</p>
                  <h4 id="today-step">Sesion no iniciada</h4>
                  <p id="today-next-action" class="muted-text">Comienza por la sesion guiada para desbloquear avance.</p>
                  <button class="btn-ghost" type="button" data-shell-action="open-modules">Explorar modulos semanales</button>
                </article>
              </div>

              <section class="method-grid" aria-label="Pilares metodologicos">
                ${METHOD_PILLARS.map((item) => `
                  <article class="surface-card method-card">
                    <h4>${escapeHTML(item.title)}</h4>
                    <p>${escapeHTML(item.detail)}</p>
                  </article>
                `).join("")}
              </section>
            </section>

            <section class="module-panel" data-view-panel="ruta" aria-hidden="true" hidden>
              <h3 class="panel-title" data-view-heading="ruta">Ruta completa 0 -> B2</h3>
              <section class="phase-grid">
                ${ROADMAP_PHASES.map((phase) => {
                  const isCurrent = this.activeWeek >= phase.weekStart && this.activeWeek <= phase.weekEnd;
                  return `
                    <article class="surface-card phase-card ${isCurrent ? "is-current" : ""}">
                      <header>
                        <p class="section-kicker">${escapeHTML(phase.weeks)}</p>
                        <h4>${escapeHTML(phase.title)}</h4>
                        <span>${escapeHTML(phase.cefr)}</span>
                      </header>
                      <ul>
                        ${phase.outcomes.map((outcome) => `<li>${escapeHTML(outcome)}</li>`).join("")}
                      </ul>
                    </article>
                  `;
                }).join("")}
              </section>
            </section>

            <section class="module-panel" data-view-panel="sesion" aria-hidden="true" hidden>
              <h3 class="panel-title" data-view-heading="sesion">Sesion guiada por pasos</h3>
              <article class="surface-card session-intro-card">
                <p class="section-kicker">Modo ejecucion</p>
                <p>Este modulo bloquea avance hasta validar cada gate. Usa evidencia y timer para asegurar progreso real.</p>
              </article>
              <div class="wizard-workspace">
                <div id="${this.getSessionHostId()}"></div>
              </div>
            </section>

            <section class="module-panel" data-view-panel="modulos" aria-hidden="true" hidden>
              <h3 class="panel-title" data-view-heading="modulos">Modulos semanales estructurados</h3>

              <article class="surface-card week-controls">
                <label for="week-picker">Selecciona semana</label>
                <select id="week-picker" name="week-picker">
                  ${this.weekSummaries.map((weekEntry) => {
                    const isSelected = Number(weekEntry.week) === Number(this.state.selectedWeek);
                    return `<option value="${Number(weekEntry.week)}" ${isSelected ? "selected" : ""}>${escapeHTML(formatWeekLabel(weekEntry.week))} · ${escapeHTML(toSentence(weekEntry.title, "Semana"))}</option>`;
                  }).join("")}
                </select>
              </article>

              <section class="week-catalog-grid">
                ${this.weekSummaries.map((weekEntry) => {
                  const profile = weekEntry.week_profile || {};
                  const summary = summarizeWeek(weekEntry);
                  const phase = getPhaseForWeek(weekEntry.week);
                  const isSelected = Number(weekEntry.week) === Number(this.state.selectedWeek);
                  return `
                    <article class="surface-card week-mini-card">
                      <p class="section-kicker">${escapeHTML(formatWeekLabel(weekEntry.week))}</p>
                      <h4>${escapeHTML(toSentence(weekEntry.title, "Semana"))}</h4>
                      <p class="muted-text">${escapeHTML(toSentence(profile.focus_theme, phase.title))}</p>
                      <div class="chip-row">
                        <span class="chip">${escapeHTML(toSentence(profile.cefr_target, phase.cefr))}</span>
                        <span class="chip">${summary.activeDays.length} dias</span>
                        <span class="chip">${summary.totalSteps} pasos</span>
                      </div>
                      <button class="btn-ghost ${isSelected ? "is-selected" : ""}" type="button" data-week-select="${Number(weekEntry.week)}">Ver detalle</button>
                    </article>
                  `;
                }).join("")}
              </section>

              <div id="week-detail"></div>
              <section id="week-days-grid" class="day-grid"></section>
            </section>

            <section class="module-panel" data-view-panel="progreso" aria-hidden="true" hidden>
              <h3 class="panel-title" data-view-heading="progreso">Control de progreso y calidad</h3>

              <section class="metrics-grid">
                <article class="surface-card metric-card">
                  <p class="section-kicker">Paso actual</p>
                  <h4 id="progress-current-step">Sesion no iniciada</h4>
                </article>
                <article class="surface-card metric-card">
                  <p class="section-kicker">Etapa</p>
                  <h4 id="progress-stage">0/0</h4>
                </article>
                <article class="surface-card metric-card">
                  <p class="section-kicker">Estado gate</p>
                  <h4 id="progress-gate-state">Pendiente</h4>
                </article>
                <article class="surface-card metric-card">
                  <p class="section-kicker">Reintentos</p>
                  <h4 id="progress-retries">0</h4>
                </article>
              </section>

              <div class="panel-grid panel-grid-2">
                <article class="surface-card info-card">
                  <p class="section-kicker">Avance del programa</p>
                  <h4 id="progress-program">W01 de W20</h4>
                  <p class="muted-text">Sigue el orden por modulos para sostener consistencia y llegar a B2 conversacional.</p>
                </article>

                <article class="surface-card info-card">
                  <p class="section-kicker">Ruta de evidencia</p>
                  <h4 id="progress-evidence-path">tracking/daily/YYYY-MM-DD</h4>
                  <p class="muted-text">Registra evidencia diariamente para cerrar loops de mejora.</p>
                </article>
              </div>
            </section>
          </main>
        </div>
      </section>
    `;
  }

  resolveStatusLine(snapshot) {
    if (this.fallbackNotice) {
      return { tone: "warning", text: this.fallbackNotice };
    }

    if (snapshot.completed) {
      return { tone: "success", text: "Sesion del dia completada. Puedes revisar progreso y cerrar evidencia." };
    }

    if (snapshot.progressPct > 0) {
      return {
        tone: "info",
        text: `Sesion en curso (${snapshot.progressPct}%). Continua desde el paso activo.`
      };
    }

    return {
      tone: "info",
      text: "Comienza en el modulo Hoy y ejecuta la sesion guiada para desbloquear avance diario."
    };
  }

  describeCurrentStep(snapshot) {
    if (snapshot.completed) return "Sesion completada";
    if (!snapshot.currentStepTitle || snapshot.currentStepTitle === "Sesion no iniciada") {
      return "Sesion no iniciada";
    }

    const stepIndex = snapshot.currentStepIndex > 0 ? `${snapshot.currentStepIndex}/${snapshot.totalSteps || "-"}` : "-";
    return `${snapshot.currentStepTitle} · ${stepIndex}`;
  }

  describeNextAction(snapshot) {
    if (snapshot.completed) {
      return "Revisa Modulos y Progreso para preparar el siguiente dia.";
    }

    if (snapshot.progressPct > 0) {
      return "Retoma la sesion guiada y valida el gate del paso activo.";
    }

    return "Abre Sesion guiada y completa el primer paso para iniciar traccion.";
  }

  describeSessionState(snapshot) {
    if (snapshot.completed) return "Completada";
    if (snapshot.progressPct === 0) return "Pendiente";

    const status = String(snapshot.status || "active").toLowerCase();
    if (status === "failed") return "Requiere correccion";
    if (status === "recovered") return "Recuperado";
    if (status === "done") return "Validado";
    return "En ejecucion";
  }

  setText(id, value) {
    const node = this.container.querySelector(`#${id}`);
    if (!node) return;
    node.textContent = value;
  }

  setAttr(id, attr, value) {
    const node = this.container.querySelector(`#${id}`);
    if (!node) return;
    node.setAttribute(attr, value);
  }

  setStyle(id, property, value) {
    const node = this.container.querySelector(`#${id}`);
    if (!node) return;
    node.style[property] = value;
  }
}

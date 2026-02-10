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

function formatDayLabel(dayKey) {
  if (!dayKey) return "Hoy";
  return dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
}

function toSentence(str, def) {
  if (!str) return def;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export class LearningShell {
  constructor(containerId, context = {}) {
    this.container = document.getElementById(containerId);

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
    this.activeDayLabel = context.activeDayLabel || "Lunes";
    this.activeView = "hoy"; // Default view

    // Callbacks
    this.onViewChange = context.onViewChange || (() => { });
    this.onNavigateRoute = context.onNavigateRoute || (() => { });
    this.getSessionSnapshot = context.getSessionSnapshot || (() => ({}));
    this.handleClick = null;
  }

  setSessionHostId(id) {
    this.sessionHostId = id;
  }

  getSessionHostId() {
    return this.sessionHostId || "session-host";
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

  navigateTo(viewId, source = "shell") {
    if (!VIEW_META[viewId]) return;

    this.activeView = viewId;
    this.render({ view: viewId });
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

  renderLayout(state) {
    const activePhase = this.program.phases?.find((p) => p.id === this.profile.progress?.phase_id) || {
      title: "Foundation",
      id: "phase1",
      cefr: "A0 -> A2"
    };

    const userName = this.profile.name || "Estudiante";
    const userLevel = this.profile.level || "Nivel 1";

    // Calculate stats (Mocked for now based on user request visual)
    const stats = {
      streak: "12 días",
      xp: "1,240",
      accuracy: "94%"
    };

    return `
      <div class="app-shell font-sans text-slate-900 bg-slate-50 min-h-screen flex selection:bg-indigo-100 selection:text-indigo-700">
        
        <!-- SIDEBAR -->
        <aside class="shell-sidebar hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-50">
          <div class="p-8">
            <div class="flex items-center gap-3 text-brand-600 font-extrabold text-2xl tracking-tight">
              <div class="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-200">
                ${ICONS.bookOpen}
              </div>
              <span>HXC<span class="text-slate-400 font-light underline decoration-brand-300 underline-offset-4">ENGLISH</span></span>
            </div>
          </div>

          <nav class="flex-1 px-6 space-y-2 mt-4">
            <p class="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Menú Principal</p>
            ${this.renderNavItems()}
          </nav>

          <div class="p-6 border-t border-slate-100">
             <div class="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
              <p class="text-xs font-bold text-slate-500 uppercase mb-2">Tu Plan</p>
              <p class="text-sm font-bold text-brand-600">Premium Pro User</p>
              <div class="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div class="bg-brand-500 w-3/4 h-full"></div>
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
              <div class="flex items-center gap-5">
                <button class="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                  ${ICONS.bell}
                  <span class="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                </button>
                <div class="h-8 w-[1px] bg-slate-200"></div>
                <div class="flex items-center gap-3 cursor-pointer group">
                  <div class="text-right hidden sm:block">
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
          <div class="p-6 md:p-10 max-w-7xl mx-auto w-full">
            
            <!-- WELCOME & STATS -->
            <div class="grid lg:grid-cols-4 gap-6 mb-10">
              <div class="lg:col-span-2">
                <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">Bienvenido de nuevo, ${escapeHTML(userName.split(' ')[0])}.</h1>
                <p class="text-slate-500 mt-2 text-lg">Has completado el <span class="text-brand-600 font-bold">85%</span> de tu objetivo semanal. ¡Sigue así!</p>
              </div>
              
              <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div class="p-3 bg-orange-50 text-orange-500 rounded-2xl">${ICONS.flame}</div>
                <div>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Racha</p>
                  <p class="text-xl font-black text-slate-800">${stats.streak}</p>
                </div>
              </div>

               <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div class="p-3 bg-yellow-50 text-yellow-500 rounded-2xl">${ICONS.zap}</div>
                <div>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Puntos XP</p>
                  <p class="text-xl font-black text-slate-800">${stats.xp}</p>
                </div>
              </div>
            </div>

            <!-- DASHBOARD GRID -->
            <div class="grid lg:grid-cols-3 gap-10">
              
              <!-- LEFT COLUMN (FEED) -->
              <div class="lg:col-span-2 space-y-10">
                
                <!-- HERO CARD -->
                ${this.renderHeroCard(activePhase)}

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

                  <!-- The Views will be injected here (Hoy, Session, Modules) -->
                  <!-- We wrap them in specific containers to match the new styling -->
                  <div class="view-container" data-view-panel="hoy" ${this.activeView !== "hoy" ? "hidden" : ""}>
                     ${this.renderTodayView()}
                  </div>

                  <div class="view-container" data-view-panel="sesion" ${this.activeView !== "sesion" ? "hidden" : ""}>
                    <div id="${this.getSessionHostId()}"></div>
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
                ${this.renderWidgets()}
              </aside>

            </div>
          </div>
        </main>

        <!-- MOBILE BOTTOM NAV -->
        <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 px-6 py-2 flex justify-around items-center safe-pb">
           ${this.renderMobileNavItems()}
        </nav>

      </div>
    `;
  }

  renderNavItems() {
    return NAV_GROUPS.map((group) => {
      const items = VIEW_IDS.filter((viewId) => VIEW_META[viewId]?.group === group.id).map((viewId) => {
        const meta = VIEW_META[viewId];
        const isActive = this.activeView === viewId;
        const iconKey = meta.icon || "layout"; // Add icon keys to view meta later
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
            ${isActive ? '<div class="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>' : ''}
          </button>
        `;
      }).join("");

      return `<div class="nav-group mb-6">${items}</div>`;
    }).join("");
  }

  renderMobileNavItems() {
    // Flatten groups for mobile bar, usually just want key destinations
    // For now, render all top-level views defined in VIEW_IDS matching the groups
    const mobileViews = VIEW_IDS;

    return mobileViews.map(viewId => {
      const meta = VIEW_META[viewId];
      if (!meta) return "";
      const isActive = this.activeView === viewId;
      const iconKey = meta.icon || "layout";
      const iconSvg = ICONS[iconKey] || ICONS.layout;

      return `
        <button 
          data-view-nav="${viewId}"
          class="flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400'
        }"
        >
          <div class="${isActive ? 'scale-110' : ''} transition-transform">
             ${iconSvg}
          </div>
          <span class="text-[10px] font-bold mt-1 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'} transition-all">
            ${escapeHTML(meta.label)}
          </span>
           ${isActive ? '<div class="w-1 h-1 bg-brand-600 rounded-full mt-1"></div>' : ''}
        </button>
       `;
    }).join("");
  }

  renderHeroCard(phase) {
    return `
      <section class="relative rounded-[2.5rem] overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600"></div>
        <!-- Decorative shapes -->
        <div class="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-brand-400/20 rounded-full blur-2xl"></div>
        
        <div class="relative p-10 md:p-12 text-white flex flex-col md:flex-row items-center gap-10">
          <div class="flex-1">
            <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Fase Activa: ${escapeHTML(phase.title)}
            </div>
            <h2 class="text-4xl md:text-5xl font-black mb-6 leading-[1.1]">Dominando el Speaking Pro</h2>
            <p class="text-indigo-100 text-lg mb-8 max-w-md font-medium leading-relaxed">
              Objetivo: ${escapeHTML(phase.cefr)}. Mejora tu entonación y conecta ideas como un nativo.
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
          <div class="w-48 h-48 md:w-64 md:h-64 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 rotate-6 flex items-center justify-center shadow-2xl relative">
            <div class="text-white opacity-80 scale-150">${ICONS.trendingUp}</div>
            <div class="absolute -top-4 -right-4 bg-yellow-400 text-brand-900 font-black p-3 rounded-2xl rotate-12 shadow-lg">
              +200 XP
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderWidgets() {
    return `
      <!-- PROFILE CARD -->
      <div class="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-[4rem] -z-0"></div>
        <div class="relative z-10 text-center">
          <div class="w-24 h-24 rounded-[2rem] bg-brand-600 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-brand-200 rotate-3">
             <div class="text-white scale-150">${ICONS.trophy}</div>
          </div>
          <h3 class="text-2xl font-black text-slate-800 tracking-tight">Top 1% Local</h3>
          <p class="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Liga de Diamante</p>
          
          <div class="grid grid-cols-2 gap-4 mt-8">
            <div class="bg-slate-50 p-4 rounded-2xl">
              <p class="text-2xl font-black text-brand-600">842</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase">Días Totales</p>
            </div>
            <div class="bg-slate-50 p-4 rounded-2xl">
              <p class="text-2xl font-black text-emerald-600">12k</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase">Palabras</p>
            </div>
          </div>
        </div>
      </div>

      <!-- WORD OF THE DAY -->
      <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative">
        <div class="flex items-center justify-between mb-8">
          <h3 class="font-bold text-brand-400 text-sm tracking-widest uppercase">Word of the Day</h3>
          <button class="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <div class="text-yellow-400">${ICONS.zap}</div>
          </button>
        </div>
        <div class="space-y-4">
          <h4 class="text-4xl font-black italic tracking-tight leading-none">Substantial</h4>
          <p class="text-slate-400 text-sm font-mono">/səbˈstæn.ʃəl/</p>
          <p class="text-slate-300 text-lg leading-relaxed">
            "Of considerable importance, size, or worth."
          </p>
          <div class="pt-4 flex items-center gap-3">
            <div class="flex -space-x-2">
              <div class="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">A</div>
              <div class="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">B</div>
              <div class="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">C</div>
            </div>
            <p class="text-xs text-slate-400">+12 amigos aprendieron esto</p>
          </div>
        </div>
      </div>
    `;
  }

  renderTodayView() {
    // Replicating the 'Card' style for the lesson list, but adapting logic
    return `
      <div class="space-y-4">
        
        <!-- ACTIVE LESSON (HOY) -->
        <div class="bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-brand-500 transition-all flex flex-col sm:flex-row sm:items-center gap-6 group cursor-pointer shadow-sm hover:shadow-brand-100/50" data-shell-action="open-session">
          <div class="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center bg-brand-50 text-brand-500 group-hover:scale-110 transition-transform">
            ${ICONS.playCircle}
          </div>
          
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-[10px] font-black bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full uppercase tracking-widest">DIARIO</span>
              <span class="text-xs font-bold text-slate-400 flex items-center gap-1">
                ${ICONS.clock} 15 min
              </span>
              <span class="text-xs font-bold text-emerald-600">+50 XP</span>
            </div>
            <h4 class="text-xl font-bold text-slate-800 group-hover:text-brand-600 transition-colors">Sesión Operativa del Día</h4>
            <p class="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-2">Completa tu sesión guiada para avanzar en el roadmap.</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="text-right hidden md:block">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">En curso</p>
              <div class="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-brand-500 w-1/5 h-full"></div>
              </div>
            </div>
            <div class="p-3 bg-slate-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white transition-all">
              ${ICONS.chevronRight}
            </div>
          </div>
        </div>

        <!-- UPCOMING LESSONS (Mocked for visual balance) -->
        <div class="bg-white border border-slate-200 p-6 rounded-[2rem] opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex flex-col sm:flex-row sm:items-center gap-6 group cursor-pointer">
           <div class="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-300">
            ${ICONS.playCircle}
          </div>
           <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-[10px] font-black bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full uppercase tracking-widest">PRÁCTICA</span>
            </div>
            <h4 class="text-xl font-bold text-slate-800">Debate: Futuro de la IA</h4>
            <p class="text-slate-500 text-sm mt-1">Practica tu fluidez discutiendo tendencias.</p>
          </div>
           <div class="p-3 bg-slate-50 rounded-2xl">
              ${ICONS.chevronRight}
            </div>
        </div>

      </div>
    `;
  }

  renderClosureView() {
    return `
      <article class="modules-intro-card">
        <p class="section-kicker">Cierre diario</p>
        <h4>Consolidacion y checklist</h4>
        <p class="muted-text">Revisa los bloques ejecutados, documenta evidencia y confirma el plan de cierre antes de evaluar.</p>
      </article>
    `;
  }

  renderEvaluationView() {
    const snapshot = this.getSessionSnapshot();
    const progress = Number(snapshot.progressPct) || 0;

    return `
      <article class="modules-intro-card">
        <p class="section-kicker">Evaluacion</p>
        <h4>Control de calidad de la sesion</h4>
        <p class="muted-text">Estado actual: ${escapeHTML(snapshot.status || "locked")} | Avance: ${Math.max(0, Math.min(100, progress))}%</p>
      </article>
    `;
  }

  renderProgressView() {
    const activeWeek = this.getActiveWeekNumber();
    const totalWeeks = Number(this.program?.programWeeks) || 20;
    const pct = Math.max(0, Math.min(100, Math.round((activeWeek / totalWeeks) * 100)));

    return `
      <article class="modules-intro-card">
        <p class="section-kicker">Progreso</p>
        <h4>Ruta semanal 0 -> B2</h4>
        <p class="muted-text">Semana activa: ${escapeHTML(formatWeekLabel(String(activeWeek)))} de ${totalWeeks}. Progreso estimado: ${pct}%.</p>
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
        <article class="modules-intro-card">
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
      const navBtn = e.target.closest("[data-view-nav]");
      if (navBtn) {
        const viewId = navBtn.dataset.viewNav;
        if (!VIEW_META[viewId]) {
          return;
        }

        this.navigateTo(viewId, "shell_nav");
        return;
      }

      const actionBtn = e.target.closest("[data-shell-action]");
      if (!actionBtn) {
        return;
      }

      const action = actionBtn.dataset.shellAction;
      if (action === "open-session") {
        this.navigateTo("sesion", "hero_cta");
        return;
      }

      if (action === "open-roadmap") {
        this.navigateTo("modulos", "hero_cta");
      }
    };

    this.container.addEventListener("click", this.handleClick);
  }
}

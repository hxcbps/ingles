import { ROUTES } from "../core/router.js";
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
  constructor(containerId, profile = {}, program = {}) {
    this.container = document.getElementById(containerId);
    this.profile = profile || {};
    this.program = program || {};
    this.activeWeek = this.profile.progress?.current_week || "w01";
    this.activeDayLabel = "Lunes"; // Fallback
    this.activeView = "hoy"; // Default view
  }

  setSessionHostId(id) {
    this.sessionHostId = id;
  }

  getSessionHostId() {
    return this.sessionHostId || "session-host";
  }

  render(state) {
    if (!this.container) return;
    this.activeView = state.view || "hoy";
    this.container.innerHTML = this.renderLayout(state);
    this.bindEvents();
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

                  <div class="view-container" data-view-panel="modulos" ${this.activeView !== "modulos" ? "hidden" : ""}>
                     <!-- Modules View placeholder -->
                     <article class="bg-white p-8 rounded-[2rem] text-center border border-slate-200">
                        <p class="text-slate-500">Vista de Módulos (En desarrollo)</p>
                     </article>
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

  bindEvents() {
    this.container.addEventListener("click", (e) => {
      const navBtn = e.target.closest("[data-view-nav]");
      if (navBtn) {
        const viewId = navBtn.dataset.viewNav;
        this.activeView = viewId;
        this.render({ view: viewId });
        return;
      }

      const actionBtn = e.target.closest("[data-shell-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.shellAction;
        if (action === "open-session") {
          this.activeView = "sesion";
          this.render({ view: "sesion" });
          window.location.hash = "/modulo/sesion";
        }
      }
    });

    // Notify session wizard if it exists
    const event = new CustomEvent("shell:view-changed", { detail: { view: this.activeView } });
    document.dispatchEvent(event);
  }
}

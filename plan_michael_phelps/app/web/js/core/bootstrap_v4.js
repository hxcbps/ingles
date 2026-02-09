import { loadConfig, loadWeekContentV4 } from "../content/repository.js";
import { getProgramContext } from "../content/day_model.js";
import { orchestrator } from "./orchestrator.js";
import { SessionWizard } from "../ui/session_wizard.js";

const MODE_CLASS = "app-mode-v4";

function resolveAppContainer(documentRef = document) {
  return documentRef.getElementById("app") || documentRef.querySelector(".app");
}

function setStatus(documentRef, text) {
  const statusEl = documentRef.getElementById("session-status");
  if (statusEl) {
    statusEl.textContent = text;
  }
}

function renderFatal(container, message) {
  if (!container) {
    console.error("Fatal error (and no container):", message);
    return;
  }
  container.innerHTML = `
    <section class="session-shell" style="display: flex; align-items: center; justify-content: center; height: 80vh;">
      <div class="card" style="border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.2);">
        <h2 style="color: #ef4444;">System Failure</h2>
        <p style="color: #fff; margin: 1rem 0;">${message}</p>
        <button class="btn-secondary" onclick="location.reload()">Reintentar</button>
      </div>
    </section>
  `;
}

function ensureV4Shell(container) {
  // Premium shell is already in index.html. 
  // We only clear it if it's NOT the premium shell
  if (!container.querySelector('.session-shell')) {
    console.log("[V4] Injecting shell (should be pre-rendered)");
    container.innerHTML = `
        <div id="v4-root" class="session-shell">
          <header class="wizard-top">
             <div><h2 style="color:red">Error: Shell not found</h2></div>
          </header>
          <main id="wizard-container" class="wizard-wrapper"></main>
        </div>
      `;
  }
}

export async function bootstrapV4({
  documentRef = document,
  windowRef = window,
  fetcher = fetch
} = {}) {
  // Always target the main root for the cinematic experience
  const rootContainer = documentRef.getElementById("v4-root");

  if (!rootContainer) {
    console.error("Critical: #v4-root not found in DOM");
    return { dispose() { } };
  }

  documentRef.body.classList.add(MODE_CLASS);

  let wizard = null;
  let unloadHandler = null;

  try {
    const config = await loadConfig(fetcher);
    const program = getProgramContext(config);
    const weekLabel = String(program.weekNumber).padStart(2, "0");
    const weekFile = await loadWeekContentV4(weekLabel, fetcher);
    // Safe access
    const days = weekFile?.data?.days || {};
    const dayContent = days[program.dayLabel];

    if (!dayContent || !Array.isArray(dayContent.session_script) || dayContent.session_script.length === 0) {
      // Content missing error
      const msg = `Sin contenido para ${program.dayLabel} (Semana ${weekLabel})`;
      console.warn(msg);
      renderFatal(rootContainer, msg);
      return { dispose() { } };
    }

    orchestrator.init(dayContent, {
      onEvent: (evt) => {
        console.info("[V4 telemetry]", evt);
      }
    });

    // Mount wizard directly to root
    wizard = new SessionWizard("v4-root", { orchestrator });
    wizard.render();

    unloadHandler = () => {
      orchestrator.abandon("before_unload");
    };
    windowRef.addEventListener("beforeunload", unloadHandler);
  } catch (error) {
    console.error("[V4] Bootstrap error", error);
    renderFatal(rootContainer, `Error de inicializacion: ${error.message}`);
  }

  return {
    dispose() {
      if (wizard && typeof wizard.dispose === "function") {
        wizard.dispose();
      }
      if (unloadHandler) {
        windowRef.removeEventListener("beforeunload", unloadHandler);
      }
    }
  };
}

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
  container.innerHTML = `
    <section class="v4-error" role="alert">
      <h2>No se pudo iniciar la sesion V4</h2>
      <p>${message}</p>
      <p>Tip: valida contenido y recarga la pagina.</p>
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
  const appContainer = resolveAppContainer(documentRef);
  if (!appContainer) {
    return { dispose() { } };
  }

  documentRef.body.classList.add(MODE_CLASS);
  documentRef.body.classList.add(MODE_CLASS);

  // ensureV4Shell(appContainer); // Skip overwriting, use existing

  // Clean loader if present
  const existingShell = documentRef.getElementById("v4-root");
  if (existingShell) {
    // Keep shell, but maybe clear inner content if retrying? 
    // For now, let's assume index.html has the "Loading" card, and we replace it.
  }

  let wizard = null;
  let unloadHandler = null;

  try {
    const config = await loadConfig(fetcher);
    const program = getProgramContext(config);
    const weekLabel = String(program.weekNumber).padStart(2, "0");
    const weekFile = await loadWeekContentV4(weekLabel, fetcher);
    const dayContent = weekFile?.data?.days?.[program.dayLabel];

    if (!dayContent || !Array.isArray(dayContent.session_script) || dayContent.session_script.length === 0) {
      setStatus(documentRef, `Sin contenido para ${program.dayLabel} (semana ${weekLabel}).`);
      renderFatal(
        documentRef.getElementById("wizard-container"),
        `No hay session_script valido para ${program.dayLabel}.`
      );
      return { dispose() { } };
    }

    orchestrator.init(dayContent, {
      onEvent: (evt) => {
        console.info("[V4 telemetry]", evt);
      }
    });

    // The wizard will render into 'v4-root' or a specific container
    // Our index.html has <div id="v4-root" class="session-shell">
    // SessionWizard expects a container ID.
    wizard = new SessionWizard("v4-root", { orchestrator });
    wizard.render();

    unloadHandler = () => {
      orchestrator.abandon("before_unload");
    };
    windowRef.addEventListener("beforeunload", unloadHandler);
  } catch (error) {
    console.error("[V4] Bootstrap error", error);
    setStatus(documentRef, "Fallo de inicializacion.");
    renderFatal(documentRef.getElementById("wizard-container"), error.message);
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

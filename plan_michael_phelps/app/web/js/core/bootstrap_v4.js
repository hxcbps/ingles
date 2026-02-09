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
  container.innerHTML = `
    <div id="v4-root" class="v4-container">
      <header class="v4-header" aria-label="Estado de sesion">
        <div class="v4-brand">
          <p class="v4-kicker">English Sprint | Modo enfoque</p>
          <h1>Ejecucion guiada del dia</h1>
          <p class="v4-subtitle">Un solo paso activo. Validacion obligatoria para avanzar.</p>
        </div>
        <p id="session-status" class="v4-status" role="status" aria-live="polite">
          Preparando sesion...
        </p>
      </header>
      <main id="wizard-container" class="wizard-wrapper" aria-label="Wizard de sesion"></main>
    </div>
  `;
}

export async function bootstrapV4({
  documentRef = document,
  windowRef = window,
  fetcher = fetch
} = {}) {
  const appContainer = resolveAppContainer(documentRef);
  if (!appContainer) {
    return { dispose() {} };
  }

  documentRef.body.classList.add(MODE_CLASS);
  ensureV4Shell(appContainer);
  setStatus(documentRef, "Cargando plan del dia...");

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
      return { dispose() {} };
    }

    orchestrator.init(dayContent, {
      onEvent: (evt) => {
        console.info("[V4 telemetry]", evt);
      }
    });

    wizard = new SessionWizard("wizard-container", { orchestrator });
    wizard.render();

    setStatus(
      documentRef,
      `Semana ${weekLabel} | ${program.dayLabel} | ${dayContent.goal || "Sesion activa"}`
    );

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

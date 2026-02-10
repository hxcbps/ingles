function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderBootFailure({
  documentRef = document,
  windowRef = window,
  message = "No se pudo iniciar la app."
} = {}) {
  const root = documentRef?.getElementById?.("v4-root");
  if (!root) return;

  root.innerHTML = `
    <section class="fatal-shell" aria-live="assertive">
      <article class="fatal-card">
        <p class="section-kicker">Error de inicializacion</p>
        <h2>Fallo critico</h2>
        <p>${escapeHTML(message)}</p>
        <button id="btn-fatal-reload" class="btn-primary" type="button">Recargar</button>
      </article>
    </section>
  `;

  const reloadButton = root.querySelector("#btn-fatal-reload");
  if (reloadButton) {
    reloadButton.addEventListener("click", () => {
      if (windowRef?.location && typeof windowRef.location.reload === "function") {
        windowRef.location.reload();
      }
    });
  }
}

export async function startApp({
  documentRef = document,
  windowRef = window,
  loadBootstrapModule = () => import("./core/bootstrap_v4.js")
} = {}) {
  try {
    const module = await loadBootstrapModule();
    const bootstrapV4 = module?.bootstrapV4;

    if (typeof bootstrapV4 !== "function") {
      throw new Error("No se encontro bootstrapV4 en el runtime.");
    }

    await bootstrapV4({
      documentRef,
      windowRef,
      fetcher: typeof windowRef?.fetch === "function" ? windowRef.fetch.bind(windowRef) : undefined
    });
  } catch (error) {
    console.error("Boot failure:", error);
    const message = error instanceof Error ? error.message : String(error);
    renderBootFailure({
      documentRef,
      windowRef,
      message
    });
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void startApp();
}

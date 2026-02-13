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
        <div class="fatal-illustration" aria-hidden="true">
          <svg viewBox="0 0 64 64" role="presentation" focusable="false">
            <path d="M32 6c14.3 0 26 11.7 26 26S46.3 58 32 58 6 46.3 6 32 17.7 6 32 6z" fill="currentColor" opacity="0.12"></path>
            <path d="M32 17c-8.3 0-15 6.7-15 15 0 5.7 3.2 10.7 7.9 13.3l2.2-3.8A10.9 10.9 0 0 1 21 32c0-6.1 4.9-11 11-11a11 11 0 0 1 9.7 16.2l3.8 2.2A15.2 15.2 0 0 0 47 32c0-8.3-6.7-15-15-15z" fill="currentColor"></path>
            <path d="m21 47 4-6.8h14.2L43 47H21z" fill="currentColor"></path>
          </svg>
        </div>
        <p class="section-kicker">Error de inicializacion</p>
        <h2>Fallo critico</h2>
        <p>No pudimos conectar con tu ruta de aprendizaje.</p>
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

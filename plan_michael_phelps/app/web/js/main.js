import { bootstrapV4 } from "./core/bootstrap_v4.js";

(async () => {
  try {
    await bootstrapV4();
  } catch (error) {
    console.error("Boot failure:", error);
    const root = document.getElementById("v4-root");
    if (!root) return;

    root.innerHTML = `
      <section class="fatal-shell" aria-live="assertive">
        <article class="fatal-card">
          <p class="section-kicker">Error de inicializacion</p>
          <h2>Fallo critico</h2>
          <p>${error.message}</p>
          <button id="btn-fatal-reload" class="btn-primary" type="button">Recargar</button>
        </article>
      </section>
    `;

    const reloadButton = root.querySelector("#btn-fatal-reload");
    if (reloadButton) {
      reloadButton.addEventListener("click", () => window.location.reload());
    }
  }
})();

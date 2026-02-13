function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function formatMinutesLabel(totalMinutes) {
  const mins = Number(totalMinutes) || 0;
  if (mins <= 0) return "0 min";
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function buildProgressHeatmap(seed = 0) {
  return Array.from({ length: 14 }, (_, index) => {
    const raw = Math.sin((index + 1) * 1.31 + seed * 0.17);
    return Math.max(0, Math.min(4, Math.round(Math.abs(raw) * 4)));
  });
}

export function buildProgressHistory({ journey = {}, baselineMinutes = 30, limit = 4 } = {}) {
  const steps = Array.isArray(journey?.steps) ? journey.steps : [];
  const fallbackTitle =
    steps.find((step) => step?.status === "active")?.title || steps[0]?.title || "Sesion operativa";
  const scoreScale = ["A", "A-", "B+", "B"];

  return Array.from({ length: limit }, (_, offset) => {
    const stamp = new Date();
    stamp.setDate(stamp.getDate() - offset);

    const focus = steps[offset % Math.max(steps.length, 1)]?.title || fallbackTitle;
    const minutes = Math.max(15, Math.round(baselineMinutes - offset * 4));

    return {
      isoDate: stamp.toISOString().slice(0, 10),
      focus,
      minutes,
      score: scoreScale[offset % scoreScale.length]
    };
  });
}

export function renderProgressPremiumView({
  activeWeek,
  totalWeeks,
  targetCEFR,
  currentBand,
  sessionPct,
  overallPct,
  sessions7d,
  minutes7d,
  accuracyPct,
  vocabTotal,
  completedModules,
  totalModules,
  activeModule,
  flowRows,
  milestones,
  heatmap,
  historyRows
}) {
  const ringRadius = 68;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDash = (clampPercent(overallPct) / 100) * ringCircumference;
  const gradId = `progress-grad-${String(activeWeek || 1).replace(/[^\d]/g, "") || "01"}`;

  const flowMarkup = flowRows
    .map(
      ({ label, done }) => `
        <li class="es-list__item">
          <div>
            <strong>${escapeHTML(label)}</strong>
            <p>${done ? "Gate desbloqueado" : "Aun bloqueado"}</p>
          </div>
          <span class="es-pill ${done ? "is-good" : ""}">${done ? "Listo" : "Pendiente"}</span>
        </li>
      `
    )
    .join("");

  const milestoneMarkup = milestones
    .map(
      (item) => `
        <li class="es-list__item">
          <div>
            <strong>${escapeHTML(item.title)}</strong>
            <p>${escapeHTML(item.note)}</p>
          </div>
          <span class="es-pill">~${escapeHTML(String(item.etaDays))} dias</span>
        </li>
      `
    )
    .join("");

  const heatMarkup = heatmap
    .map(
      (level) =>
        `<div class="es-heatmap__day" data-v="${escapeHTML(String(level))}" title="Actividad: ${escapeHTML(String(level))}"></div>`
    )
    .join("");

  const historyMarkup = historyRows
    .map(
      (row) => `
        <tr>
          <td>${escapeHTML(row.isoDate)}</td>
          <td>${escapeHTML(row.focus)}</td>
          <td>${escapeHTML(formatMinutesLabel(row.minutes))}</td>
          <td>${escapeHTML(row.score)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="es-progress-route">
      <section class="es-hero es-progress-route__hero">
        <div class="es-hero__copy">
          <p class="es-kicker">English Sprint Platform</p>
          <h1 class="es-title">Progreso Premium</h1>
          <p class="es-subtitle">
            Semana ${escapeHTML(String(activeWeek))}/${escapeHTML(String(totalWeeks))}. Senal sobre ruido: continuidad, ejecucion y calidad real de sesion.
          </p>
        </div>

        <div class="es-hero__rail">
          <div class="es-badges">
            <span class="es-badge">Objetivo ${escapeHTML(targetCEFR)}</span>
            <span class="es-badge">Actual ${escapeHTML(currentBand)}</span>
          </div>
          <div class="es-hero__actions">
            <button class="es-btn es-btn--ghost" type="button" data-shell-route="modulos">Roadmap</button>
            <button class="es-btn es-btn--primary" type="button" data-shell-action="open-session">Iniciar sesion</button>
          </div>
        </div>
      </section>

      <section class="es-grid">
        <article class="es-card es-progress-summary" aria-label="Resumen principal">
          <div class="es-progress-summary__layout">
            <div class="es-progress-summary__content">
              <p class="es-kicker">Ruta 0 -> B2</p>
              <p class="es-progress-summary__minutes">${escapeHTML(formatMinutesLabel(minutes7d))} <span>ultimos 7 dias</span></p>
              <p class="es-progress-summary__copy">
                Modulo activo: <strong>${escapeHTML(activeModule)}</strong>. Mantener 6/7 sesiones sostiene la curva de progreso.
              </p>

              <div class="es-kpis" role="list">
                <article role="listitem">
                  <span>Sesion</span>
                  <strong>${escapeHTML(String(sessionPct))}%</strong>
                </article>
                <article role="listitem">
                  <span>Consistencia</span>
                  <strong>${escapeHTML(String(sessions7d))}/7</strong>
                </article>
                <article role="listitem">
                  <span>Precision</span>
                  <strong>${escapeHTML(String(accuracyPct))}%</strong>
                </article>
              </div>
            </div>

            <div class="es-progress-summary__rail">
              <div class="es-progress-ring" aria-label="Progreso general">
                <svg viewBox="0 0 160 160" aria-hidden="true">
                  <defs>
                    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stop-color="rgba(var(--es-accent), 1)" />
                      <stop offset="1" stop-color="rgba(var(--es-accent-2), 1)" />
                    </linearGradient>
                  </defs>
                  <circle cx="80" cy="80" r="${ringRadius}" fill="none" stroke="rgba(var(--es-border), 0.84)" stroke-width="12" />
                  <circle cx="80" cy="80" r="${ringRadius}" fill="none" stroke="url(#${gradId})" stroke-width="12" stroke-linecap="round"
                    stroke-dasharray="${ringDash.toFixed(2)} ${ringCircumference.toFixed(2)}" transform="rotate(-90 80 80)" />
                </svg>
                <div class="es-progress-ring__center">
                  <p class="es-progress-ring__value">${escapeHTML(String(overallPct))}%</p>
                  <p class="es-progress-ring__label">Progreso hacia ${escapeHTML(targetCEFR)}<br/>senal agregada</p>
                </div>
              </div>

              <ul class="es-list es-progress-summary__facts">
                <li class="es-list__item">
                  <div>
                    <strong>Modulos</strong>
                    <p>avance curricular ejecutado</p>
                  </div>
                  <span class="es-pill">${escapeHTML(String(completedModules))}/${escapeHTML(String(totalModules || 0))}</span>
                </li>
                <li class="es-list__item">
                  <div>
                    <strong>Vocabulario activo</strong>
                    <p>estimacion acumulada</p>
                  </div>
                  <span class="es-pill">${escapeHTML(String(vocabTotal))}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="es-divider"></div>

          <section class="es-section">
            <div class="es-section__head">
              <h3>Hitos proximos</h3>
              <p>Objetivos medibles para empujar el sistema sin perder enfoque.</p>
            </div>
            <ul class="es-list">${milestoneMarkup}</ul>
          </section>
        </article>

        <aside class="es-side" aria-label="Panel lateral">
          <article class="es-card">
            <div class="es-card__head">
              <h2>Continuidad del flujo</h2>
              <p>Gates de navegacion y estado actual.</p>
            </div>
            <ul class="es-list">${flowMarkup}</ul>
          </article>

          <article class="es-card">
            <div class="es-card__head">
              <h2>Ultimos 14 dias</h2>
              <p>Heatmap de actividad.</p>
            </div>
            <div class="es-heatmap" aria-label="Mapa de actividad">${heatMarkup}</div>
            <div class="es-heatmap__legend">
              <span>Mas antiguo</span>
              <span>Mas reciente</span>
            </div>
          </article>
        </aside>
      </section>

      <article class="es-card es-progress-history">
        <div class="es-card__head">
          <div>
            <h2>Historial reciente</h2>
            <p>Tabla limpia para detectar patrones de avance.</p>
          </div>
          <button class="es-btn" type="button" data-shell-action="open-session">+ Registrar</button>
        </div>

        <div class="es-table-wrap">
          <table class="es-table" aria-label="Historial reciente">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Enfoque</th>
                <th>Duracion</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>${historyMarkup}</tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}

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
        <li class="listItem">
          <div>
            <strong>${escapeHTML(label)}</strong>
            <span>${done ? "Gate desbloqueado" : "Aun bloqueado"}</span>
          </div>
          <span class="pill ${done ? "pillGood" : ""}">${done ? "Listo" : "Pendiente"}</span>
        </li>
      `
    )
    .join("");

  const milestoneMarkup = milestones
    .map(
      (item) => `
        <div class="listItem">
          <div>
            <strong>${escapeHTML(item.title)}</strong>
            <span>${escapeHTML(item.note)}</span>
          </div>
          <div class="pill">~${escapeHTML(String(item.etaDays))} dias</div>
        </div>
      `
    )
    .join("");

  const heatMarkup = heatmap
    .map((level) => `<div class="day" data-v="${escapeHTML(String(level))}" title="Actividad: ${escapeHTML(String(level))}"></div>`)
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
    <section class="progress-shell page">
      <section class="pageHero">
        <div>
          <h3 class="pageTitle">Progreso <em>Premium</em></h3>
          <p class="pageKicker">
            Semana ${escapeHTML(String(activeWeek))}/${escapeHTML(String(totalWeeks))}. Senal sobre ruido: continuidad, ejecucion y calidad real de sesion.
          </p>
        </div>
        <div class="progress-actions">
          <span class="badge">Objetivo ${escapeHTML(targetCEFR)} • Actual ${escapeHTML(currentBand)}</span>
          <button class="btn btnGhost" type="button" data-shell-route="modulos">Roadmap</button>
          <button class="btn btnPrimary" type="button" data-shell-action="open-session">Iniciar sesion</button>
        </div>
      </section>

      <section class="grid">
        <article class="card heroCard motion" aria-label="Resumen principal">
          <div class="cardInner">
            <div class="heroLayout">
              <div class="bigStat">
                <div class="badge">Ruta 0 -> B2</div>
                <div class="bigStatValue">${escapeHTML(formatMinutesLabel(minutes7d))} <span>ultimos 7 dias</span></div>
                <div class="pageKicker">
                  Modulo activo: <strong>${escapeHTML(activeModule)}</strong>. Mantener 6/7 sesiones sostiene la curva de progreso.
                </div>

                <div class="statRow" role="list">
                  <div class="mini" role="listitem">
                    <div class="miniLabel">Sesion</div>
                    <div class="miniValue">${escapeHTML(String(sessionPct))}%</div>
                  </div>
                  <div class="mini" role="listitem">
                    <div class="miniLabel">Consistencia</div>
                    <div class="miniValue">${escapeHTML(String(sessions7d))}/7</div>
                  </div>
                  <div class="mini" role="listitem">
                    <div class="miniLabel">Precision</div>
                    <div class="miniValue">${escapeHTML(String(accuracyPct))}%</div>
                  </div>
                </div>
              </div>

              <div class="ringWrap">
                <div class="ring" aria-label="Progreso general">
                  <svg viewBox="0 0 160 160" aria-hidden="true">
                    <defs>
                      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="rgba(var(--accent), 1)" />
                        <stop offset="1" stop-color="rgba(var(--accent-2), 1)" />
                      </linearGradient>
                    </defs>
                    <circle cx="80" cy="80" r="${ringRadius}" fill="none" stroke="rgba(var(--border), 0.85)" stroke-width="12" />
                    <circle cx="80" cy="80" r="${ringRadius}" fill="none" stroke="url(#${gradId})" stroke-width="12" stroke-linecap="round"
                      stroke-dasharray="${ringDash.toFixed(2)} ${ringCircumference.toFixed(2)}" transform="rotate(-90 80 80)" />
                  </svg>
                  <div class="ringCenter">
                    <div class="ringPct">${escapeHTML(String(overallPct))}%</div>
                    <div class="ringLabel">Progreso hacia ${escapeHTML(targetCEFR)}<br/>senal agregada</div>
                  </div>
                </div>

                <div class="list" style="min-width:220px;">
                  <div class="listItem">
                    <div>
                      <strong>Modulos</strong>
                      <span>avance curricular ejecutado</span>
                    </div>
                    <div class="pill">${escapeHTML(String(completedModules))}/${escapeHTML(String(totalModules || 0))}</div>
                  </div>
                  <div class="listItem">
                    <div>
                      <strong>Vocabulario activo</strong>
                      <span>estimacion acumulada</span>
                    </div>
                    <div class="pill">${escapeHTML(String(vocabTotal))}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="cardHeader" style="margin-bottom:10px;">
              <div>
                <h4 class="cardTitle">Hitos proximos</h4>
                <p class="cardSubtitle">Objetivos medibles para empujar el sistema sin perder enfoque.</p>
              </div>
              <span class="badge">Ejecucion > intencion</span>
            </div>

            <div class="list">${milestoneMarkup}</div>
          </div>
        </article>

        <aside class="gridRight" aria-label="Panel lateral">
          <article class="card motion">
            <div class="cardInner">
              <div class="cardHeader">
                <div>
                  <h4 class="cardTitle">Continuidad del flujo</h4>
                  <p class="cardSubtitle">Gates de navegacion y estado actual.</p>
                </div>
              </div>
              <div class="list">${flowMarkup}</div>
            </div>
          </article>

          <article class="card motion">
            <div class="cardInner">
              <div class="cardHeader">
                <div>
                  <h4 class="cardTitle">Ultimos 14 dias</h4>
                  <p class="cardSubtitle">Heatmap de actividad.</p>
                </div>
              </div>
              <div class="heatmap" aria-label="Mapa de actividad">${heatMarkup}</div>
              <div class="heatmapLabels">
                <span>Mas antiguo</span>
                <span>Mas reciente</span>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <section class="progress-history-wrap">
        <article class="card motion">
          <div class="cardInner">
            <div class="cardHeader">
              <div>
                <h4 class="cardTitle">Historial reciente</h4>
                <p class="cardSubtitle">Tabla limpia para detectar patrones de avance.</p>
              </div>
              <button class="btn" type="button" data-shell-action="open-session">+ Registrar</button>
            </div>

            <div style="overflow:auto;">
              <table class="table" aria-label="Historial reciente">
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
          </div>
        </article>
      </section>
    </section>
  `;
}

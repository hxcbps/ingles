import { orchestrator as defaultOrchestrator, STEP_STATUS } from "../core/orchestrator.js";

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function countWords(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inputValue(value) {
  if (value === null || value === undefined) return "";
  return escapeHTML(String(value));
}

function statusLabel(status) {
  switch (status) {
    case STEP_STATUS.ACTIVE:
      return "Activo";
    case STEP_STATUS.DONE:
      return "Completado";
    case STEP_STATUS.RECOVERED:
      return "Recuperado";
    case STEP_STATUS.FAILED:
      return "Fallido";
    case STEP_STATUS.LOCKED:
    default:
      return "Bloqueado";
  }
}

function gateTypeLabel(type) {
  switch (type) {
    case "timer_complete":
      return "Tiempo minimo";
    case "self_score":
      return "Auto-score";
    case "manual_check":
      return "Confirmacion manual";
    case "artifact_uploaded":
    case "evidence_upload":
      return "Evidencia cargada";
    case "min_words":
    case "evidence_log_min_words":
      return "Minimo de palabras";
    case "min_turns":
      return "Minimo de turnos";
    case "rubric_min":
      return "Rubrica minima";
    case "metrics_threshold":
      return "Umbral de metricas";
    case "compound":
      return "Validacion compuesta";
    default:
      return type || "manual_check";
  }
}

function formatStepType(stepType) {
  const raw = String(stepType || "step").replaceAll("_", " ").trim();
  if (!raw) return "Paso";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function collectNeeds(gate, needs = {}) {
  if (!gate || typeof gate !== "object") return needs;

  if (gate.type === "compound" && Array.isArray(gate.rules)) {
    gate.rules.forEach((rule) => collectNeeds(rule, needs));
    return needs;
  }

  if (gate.type === "timer_complete") needs.timer = true;
  if (gate.type === "self_score") needs.score = true;
  if (gate.type === "min_words" || gate.type === "evidence_log_min_words") needs.text = true;
  if (gate.type === "artifact_uploaded" || gate.type === "evidence_upload") needs.artifact = true;
  if (gate.type === "manual_check") needs.check = true;
  if (gate.type === "min_turns") needs.turns = true;
  if (gate.type === "rubric_min") needs.rubric = true;
  if (gate.type === "metrics_threshold") needs.metrics = true;
  return needs;
}

function collectMetricKeys(gate, keys = new Set()) {
  if (!gate || typeof gate !== "object") return keys;

  if (gate.type === "compound" && Array.isArray(gate.rules)) {
    gate.rules.forEach((rule) => collectMetricKeys(rule, keys));
    return keys;
  }

  if (gate.type !== "metrics_threshold") return keys;

  if (Array.isArray(gate.value)) {
    gate.value.forEach((rule) => {
      if (rule?.metric) keys.add(String(rule.metric));
    });
    return keys;
  }

  if (gate.value && typeof gate.value === "object") {
    if (gate.value.metric) {
      keys.add(String(gate.value.metric));
      return keys;
    }

    Object.keys(gate.value).forEach((key) => keys.add(key));
    return keys;
  }

  if (typeof gate.value === "string") {
    keys.add(gate.value);
  }

  return keys;
}

function flattenGateTypes(gate, acc = []) {
  if (!gate || typeof gate !== "object") return acc;

  if (gate.type === "compound" && Array.isArray(gate.rules)) {
    gate.rules.forEach((rule) => flattenGateTypes(rule, acc));
    return acc;
  }

  if (gate.type) {
    acc.push(gate.type);
  }
  return acc;
}

function metricLabel(key) {
  const raw = String(key || "").replaceAll("_", " ").trim();
  if (!raw) return "Metrica";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function readResourceLocator(content = {}) {
  if (content.resource_locator) return content.resource_locator;
  return null;
}

function readPromptRef(step) {
  return step?.content?.prompt_ref || step?.prompt_ref || "";
}

export class SessionWizard {
  constructor(containerId, { orchestrator = defaultOrchestrator } = {}) {
    this.container = document.getElementById(containerId);
    this.orchestrator = orchestrator;
    this.timer = {
      stepId: null,
      totalSec: 0,
      leftSec: 0,
      running: false,
      completed: false,
      intervalId: null
    };
    this.feedback = { tone: "info", text: "" };
    this.draftByStep = {};
  }

  dispose() {
    this.stopTimer();
  }

  stopTimer() {
    if (this.timer.intervalId) {
      clearInterval(this.timer.intervalId);
      this.timer.intervalId = null;
    }
    this.timer.running = false;
  }

  ensureTimer(stepId, durationMin) {
    const totalSec = Math.max(0, Math.floor((Number(durationMin) || 0) * 60));
    if (this.timer.stepId === stepId) return;

    this.stopTimer();
    this.timer = {
      stepId,
      totalSec,
      leftSec: totalSec,
      running: false,
      completed: false,
      intervalId: null
    };
  }

  getStepDraft(stepId, fallbackData = {}) {
    if (this.draftByStep[stepId] && typeof this.draftByStep[stepId] === "object") {
      return this.draftByStep[stepId];
    }

    if (fallbackData && typeof fallbackData === "object") {
      return fallbackData;
    }

    return {};
  }

  rememberStepDraft(stepId, input) {
    if (!stepId) return;
    this.draftByStep[stepId] = {
      ...(this.draftByStep[stepId] || {}),
      ...(input || {})
    };
  }

  renderCompletion() {
    const progress = this.orchestrator.getProgress();
    this.container.innerHTML = `
      <section class="wizard-complete animate-in" aria-label="Sesion completada">
        <div class="card" style="text-align: center; max-width: 600px; margin: 4rem auto;">
            <p class="kicker">MISION CUMPLIDA</p>
            <h1>Imparable.</h1>
            <p style="font-size: 1.2rem; color: #94a3b8; margin-bottom: 2rem;">
                Has completado el <strong>${progress}%</strong> de tu objetivo diario.
            </p>
            <div class="timer-panel" style="justify-content: center;">
                <span class="timer-complete">DONE</span>
            </div>
            <br>
            <button class="btn-primary" onclick="location.reload()">Sincronizar Progreso</button>
        </div>
      </section>
    `;
  }

  renderResource(step) {
    const content = step?.content || {};
    const locator = readResourceLocator(content);
    const promptRef = readPromptRef(step);

    if (content.url) {
      return `
        <article class="resource-card" aria-label="Recurso principal del paso">
          <h3>Recurso del paso</h3>
          <p class="resource-help">Abre este recurso y ejecuta exactamente lo indicado en la instruccion.</p>
          <a class="resource-link" href="${escapeHTML(content.url)}" target="_blank" rel="noopener noreferrer">
            Abrir recurso externo
          </a>
          ${content.offline_ref ? `<p class="resource-alt">Alternativa offline: ${escapeHTML(content.offline_ref)}</p>` : ""}
        </article>
      `;
    }

    if (locator) {
      return `
        <article class="resource-card" aria-label="Localizador de recurso">
          <h3>Localizador de recurso</h3>
          <ul class="locator-list">
            <li><span>Libro</span><strong>${escapeHTML(locator.book || "-")}</strong></li>
            <li><span>Unidad</span><strong>${escapeHTML(locator.unit || "-")}</strong></li>
            <li><span>Pagina</span><strong>${escapeHTML(locator.page || "-")}</strong></li>
            <li><span>Ejercicio</span><strong>${escapeHTML(locator.exercise || "-")}</strong></li>
          </ul>
          ${locator.fallback_url ? `<a class="resource-link" href="${escapeHTML(locator.fallback_url)}" target="_blank" rel="noopener noreferrer">Abrir fallback</a>` : ""}
        </article>
      `;
    }

    if (promptRef) {
      const promptVersion = step?.content?.prompt_version || step?.prompt_version || "v1";
      const prompt = `Prompt ref: ${promptRef}\nPrompt version: ${promptVersion}\nInstruccion: ${step?.content?.instructions || ""}`;
      return `
        <article class="resource-card" aria-label="Prompt IA">
          <h3>Prompt IA</h3>
          <p class="resource-help">Copia el prompt y ejecuta la practica sin traducir.</p>
          <textarea id="prompt-text" class="prompt-text" readonly>${escapeHTML(prompt)}</textarea>
          <button id="copy-prompt-v4" class="btn-secondary" type="button">Copiar prompt</button>
        </article>
      `;
    }

    return `
      <article class="resource-card" aria-label="Recurso no especificado">
        <h3>Recurso</h3>
        <p class="resource-help">Sigue la instruccion del paso y registra evidencia valida.</p>
      </article>
    `;
  }

  renderGateChecklist(step) {
    const needs = collectNeeds(step.gate, {});
    const items = [];

    if (needs.timer) items.push("Completa el tiempo del timer del paso.");
    if (needs.text) items.push("Escribe evidencia textual suficiente.");
    if (needs.score) items.push("Registra un auto-score valido.");
    if (needs.turns) items.push("Declara los turnos completados.");
    if (needs.artifact) items.push("Adjunta ruta o enlace de evidencia.");
    if (needs.check) items.push("Marca confirmacion manual del paso.");
    if (needs.rubric) items.push("Completa la rubrica requerida.");
    if (needs.metrics) items.push("Ingresa las metricas solicitadas.");

    if (!items.length) {
      items.push("Cumple la validacion definida para habilitar el siguiente paso.");
    }

    return `
      <article class="gate-spec" aria-label="Checklist de validacion del paso">
        <h4>Checklist de validacion</h4>
        <ul class="gate-spec-list">
          ${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
        </ul>
      </article>
    `;
  }

  renderEvidenceFields(step, draft = {}) {
    const needs = collectNeeds(step.gate, {});
    const metricKeys = [...collectMetricKeys(step.gate)];
    const keys = metricKeys.length ? metricKeys : ["error_density", "pronunciation_score"];
    const draftText = String(draft.text ?? draft.log ?? "");

    return `
      <div class="evidence-grid">
        ${needs.text ? `
          <label class="field-block" for="evidence-text">
            <span>Registro textual</span>
            <textarea id="evidence-text" rows="4" placeholder="Describe output, errores y correcciones aplicadas.">${escapeHTML(draftText)}</textarea>
          </label>
        ` : ""}

        ${needs.score ? `
          <label class="field-block" for="evidence-score">
            <span>Auto-score</span>
            <input id="evidence-score" type="number" min="0" max="100" step="1" placeholder="0-100" value="${inputValue(draft.score)}" />
          </label>
        ` : ""}

        ${needs.turns ? `
          <label class="field-block" for="evidence-turns">
            <span>Turnos completados</span>
            <input id="evidence-turns" type="number" min="0" step="1" placeholder="0" value="${inputValue(draft.turnCount)}" />
          </label>
        ` : ""}

        ${needs.artifact ? `
          <label class="field-block" for="evidence-artifact">
            <span>Ruta o enlace de evidencia</span>
            <input id="evidence-artifact" type="text" placeholder="tracking/daily/YYYY-MM-DD/audio/file.mp3" value="${inputValue(draft.artifactPath)}" />
          </label>
        ` : ""}

        ${needs.check ? `
          <label class="checkbox-row" for="evidence-check">
            <input id="evidence-check" type="checkbox" ${draft.checked ? "checked" : ""} />
            <span>Confirmo que complete el paso segun instrucciones</span>
          </label>
        ` : ""}
      </div>

      ${needs.rubric ? `
        <fieldset class="rubric-grid">
          <legend>Rubrica rapida (0-3)</legend>
          <label for="rubric-fluency">Fluency</label>
          <input data-rubric="fluency" id="rubric-fluency" type="number" min="0" max="3" step="1" value="${inputValue(draft?.rubric?.fluency)}" />
          <label for="rubric-accuracy">Accuracy</label>
          <input data-rubric="accuracy" id="rubric-accuracy" type="number" min="0" max="3" step="1" value="${inputValue(draft?.rubric?.accuracy)}" />
          <label for="rubric-pronunciation">Pronunciation</label>
          <input data-rubric="pronunciation" id="rubric-pronunciation" type="number" min="0" max="3" step="1" value="${inputValue(draft?.rubric?.pronunciation)}" />
          <label for="rubric-completion">Task completion</label>
          <input data-rubric="completion" id="rubric-completion" type="number" min="0" max="3" step="1" value="${inputValue(draft?.rubric?.completion)}" />
        </fieldset>
      ` : ""}

      ${needs.metrics ? `
        <fieldset class="metrics-grid">
          <legend>Metricas requeridas</legend>
          ${keys
          .map(
            (metricKey, index) => `
            <label for="metric-${index}">${escapeHTML(metricLabel(metricKey))}</label>
            <input data-metric="${escapeHTML(metricKey)}" id="metric-${index}" type="number" step="0.1" value="${inputValue(draft?.metrics?.[metricKey])}" />
          `
          )
          .join("")}
        </fieldset>
      ` : ""}
    `;
  }

  render() {
    if (!this.container) return;

    const current = this.orchestrator.getCurrentStep();
    if (!current.definition) {
      this.renderCompletion();
      return;
    }

    const step = current.definition;
    const progress = this.orchestrator.getProgress();
    const instructions = step?.content?.instructions || "Sigue la instruccion del paso.";
    const successCriteria = step?.success_criteria || "Cumplir gate del paso activo.";
    const status = current.status || STEP_STATUS.ACTIVE;
    const gateTypes = flattenGateTypes(step.gate, []);
    const gateSummary = gateTypes.length
      ? gateTypes.map((item) => gateTypeLabel(item)).join(" + ")
      : gateTypeLabel(step?.gate?.type || "manual_check");
    const draft = this.getStepDraft(step.step_id, current.data);

    this.ensureTimer(step.step_id, step.duration_min);

    this.container.innerHTML = `
      <section class="session-shell" aria-label="Ejecucion guiada">
        
        <!-- Header -->
        <header class="wizard-top">
          <div>
            <span class="kicker">Fase ${current.stepIndex} / ${current.totalSteps}</span>
            <h2>${escapeHTML(step.title || "Foco Activo")}</h2>
          </div>
          <div style="text-align: right;">
            <div class="status-active" style="font-family: var(--font-mono); font-size: 0.9rem;">
                ${statusLabel(status).toUpperCase()}
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--brand-primary); line-height: 1;">
                ${progress}%
            </div>
          </div>
        </header>

        <!-- Progress Bar -->
        <div class="progress-track">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>

        <!-- Main Card -->
        <article class="card step-card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
            <span class="step-summary" style="color: var(--brand-primary);">
                /// ${escapeHTML(formatStepType(step.type))}
            </span>
            <span class="step-summary">${escapeHTML(step.duration_min || 0)} MIN</span>
          </div>

          <div class="instruction-grid">
            <div style="grid-column: span 2;">
                <h4>DIRECTIVA PRINCIPAL</h4>
                <p style="font-size: 1.25rem; color: #fff; line-height: 1.5;">
                    ${escapeHTML(instructions)}
                </p>
            </div>
            <div>
                <h4>CRITERIO DE EXITO</h4>
                <p style="color: #cbd5e1;">${escapeHTML(successCriteria)}</p>
            </div>
            <div>
                <h4>PROTOCOLO DE VALIDACION</h4>
                <p style="color: #cbd5e1;">${escapeHTML(gateSummary)}</p>
            </div>
          </div>

          ${this.renderGateChecklist(step)}
          ${this.renderResource(step)}

          <div class="evidence-card" style="margin-top: 2rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: var(--radius-md);">
            <h4 style="margin-bottom: 1rem; color: #fff;">EVIDENCIA REQUERIDA</h4>
            ${this.renderEvidenceFields(step, draft)}
          </div>

        </article>

        <!-- Footer / Timer -->
        <footer class="wizard-footer" style="display: grid; gap: 1rem;">
          <div class="timer-panel">
            <div>
                <div style="font-family: var(--font-mono); font-size: 0.8rem; color: #64748b;">TIEMPO RESTANTE</div>
                <div id="wizard-timer" class="timer-value">${formatClock(this.timer.leftSec)}</div>
            </div>
            <div class="timer-actions">
              <button id="btn-timer-toggle" class="btn-secondary" type="button">
                ${this.timer.running ? "PAUSAR" : "INICIAR"}
              </button>
              <button id="btn-timer-reset" class="btn-ghost" type="button" style="color: #64748b; font-size: 0.9rem;">REINICIAR</button>
            </div>
          </div>

          <button id="btn-submit-step" class="btn-primary" type="button" style="width: 100%; padding: 1.2rem; font-size: 1.2rem;" disabled>
            VALIDAR FASE
          </button>
        </footer>

      </section>
    `;

    this.bindEvents(step);
    this.updateSubmitState(step);
    this.updateTimerUI();
  }

  timerElapsedSec() {
    return Math.max(0, this.timer.totalSec - this.timer.leftSec);
  }

  gatherInput() {
    const text = this.container?.querySelector("#evidence-text")?.value || "";
    const score = asNumber(this.container?.querySelector("#evidence-score")?.value);
    const turnCount = asNumber(this.container?.querySelector("#evidence-turns")?.value);
    const artifactPath = this.container?.querySelector("#evidence-artifact")?.value || "";
    const checked = this.container?.querySelector("#evidence-check")?.checked === true;

    const rubric = {};
    this.container?.querySelectorAll("[data-rubric]").forEach((node) => {
      const key = node.getAttribute("data-rubric");
      const value = asNumber(node.value);
      if (key && value !== null) rubric[key] = value;
    });

    const metrics = {};
    this.container?.querySelectorAll("[data-metric]").forEach((node) => {
      const key = node.getAttribute("data-metric");
      const value = asNumber(node.value);
      if (key && value !== null) metrics[key] = value;
    });

    return {
      text,
      log: text,
      score,
      turnCount,
      artifactPath: String(artifactPath).trim(),
      checked,
      rubric,
      metrics,
      timeElapsedSec: this.timerElapsedSec(),
      timeElapsedMin: this.timerElapsedSec() / 60,
      timeElapsed: this.timerElapsedSec()
    };
  }

  isSoftReady(step, input) {
    const needs = collectNeeds(step.gate, {});

    if (needs.timer && !this.timer.completed) return false;
    if (needs.text && countWords(input.text) < 1) return false;
    if (needs.score && input.score === null) return false;
    if (needs.turns && input.turnCount === null) return false;
    if (needs.artifact && !input.artifactPath) return false;
    if (needs.check && input.checked !== true) return false;
    if (needs.rubric && Object.keys(input.rubric || {}).length === 0) return false;

    if (needs.metrics) {
      const requiredKeys = [...collectMetricKeys(step.gate)];
      if (!requiredKeys.length) {
        return Object.keys(input.metrics || {}).length > 0;
      }
      return requiredKeys.every((key) => asNumber(input.metrics?.[key]) !== null);
    }

    return true;
  }

  setFeedback(tone, text) {
    this.feedback = {
      tone: tone || "info",
      text: text || ""
    };
  }

  updateSubmitState(step) {
    const submit = this.container?.querySelector("#btn-submit-step");
    if (!submit) return;

    const input = this.gatherInput();
    this.rememberStepDraft(step.step_id, input);
    submit.disabled = !this.isSoftReady(step, input);
  }

  updateTimerUI() {
    const timerEl = this.container?.querySelector("#wizard-timer");
    const toggleBtn = this.container?.querySelector("#btn-timer-toggle");

    if (timerEl) {
      timerEl.textContent = this.timer.completed ? "COMPLETADO" : formatClock(this.timer.leftSec);
      timerEl.classList.toggle("timer-complete", this.timer.completed);
    }

    if (toggleBtn) {
      toggleBtn.textContent = this.timer.running ? "Pausar timer" : "Iniciar timer";
    }
  }

  startTimer(step) {
    if (this.timer.running || this.timer.completed) return;

    this.timer.running = true;
    this.updateTimerUI();

    this.timer.intervalId = setInterval(() => {
      if (this.timer.leftSec <= 0) {
        this.stopTimer();
        this.timer.completed = true;
        this.timer.leftSec = 0;
        this.setFeedback("success", `Timer completo para ${step.duration_min} min.`);
        this.updateTimerUI();
        this.updateSubmitState(step);
        return;
      }

      this.timer.leftSec -= 1;
      this.updateTimerUI();
      this.updateSubmitState(step);
    }, 1000);
  }

  pauseTimer() {
    if (!this.timer.running) return;
    this.stopTimer();
    this.updateTimerUI();
  }

  resetTimer(step) {
    this.stopTimer();
    this.timer.leftSec = this.timer.totalSec;
    this.timer.completed = false;
    this.setFeedback("info", "Timer reiniciado.");
    this.updateTimerUI();
    this.updateSubmitState(step);
  }

  async copyPrompt() {
    const promptText = this.container?.querySelector("#prompt-text")?.value || "";
    if (!promptText) return;

    try {
      await navigator.clipboard.writeText(promptText);
      this.setFeedback("success", "Prompt copiado al portapapeles.");
    } catch {
      this.setFeedback("warning", "No se pudo copiar automaticamente. Copia manualmente.");
    }

    this.render();
  }

  handleSubmit(step) {
    const input = this.gatherInput();
    this.rememberStepDraft(step.step_id, input);

    const result = this.orchestrator.submitStep(step.step_id, input);

    if (result.success) {
      delete this.draftByStep[step.step_id];
      this.setFeedback("success", "Gate validado. Pasando al siguiente paso.");
      this.render();
      return;
    }

    if (result.action === "retry") {
      this.setFeedback(
        "warning",
        `${result.error || "Gate no cumplido."} Intento ${result.attempt}/${result.maxRetries}.`
      );
      this.render();
      return;
    }

    if (result.action === "fallback") {
      this.setFeedback("warning", "Gate no cumplido. Entrando en modo recovery.");
      this.render();
      return;
    }

    if (result.action === "blocked") {
      this.setFeedback("error", result.error || "Paso bloqueado por gate.");
      this.render();
      return;
    }

    this.setFeedback("error", result.error || "No se pudo validar el paso.");
    this.render();
  }

  bindEvents(step) {
    const timerToggle = this.container?.querySelector("#btn-timer-toggle");
    const timerReset = this.container?.querySelector("#btn-timer-reset");
    const submit = this.container?.querySelector("#btn-submit-step");
    const copyPrompt = this.container?.querySelector("#copy-prompt-v4");

    if (timerToggle) {
      timerToggle.addEventListener("click", () => {
        if (this.timer.running) {
          this.pauseTimer();
        } else {
          this.startTimer(step);
        }
      });
    }

    if (timerReset) {
      timerReset.addEventListener("click", () => this.resetTimer(step));
    }

    if (submit) {
      submit.addEventListener("click", () => this.handleSubmit(step));
    }

    if (copyPrompt) {
      copyPrompt.addEventListener("click", () => this.copyPrompt());
    }

    this.container?.querySelectorAll("input, textarea").forEach((node) => {
      node.addEventListener("input", () => this.updateSubmitState(step));
      node.addEventListener("change", () => this.updateSubmitState(step));
    });
  }
}

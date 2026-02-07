import { formatHMS } from "../../utils/format.js";
import { pauseTimer, resetTimer, startTimer, tickTimer } from "../../domain/timer.js";

export function createTimerController({
  dom,
  events,
  getTimer,
  setTimer,
  getSessionMinutes,
  persistState,
  setStatus,
  windowRef = window,
  nowProvider = () => Date.now()
}) {
  let handle = null;

  function render() {
    const timer = getTimer();
    dom.timerDisplay.textContent = formatHMS(timer.remainingSeconds);
  }

  function stopInterval() {
    if (!handle) return;
    windowRef.clearInterval(handle);
    handle = null;
  }

  function onTick() {
    const outcome = tickTimer(getTimer(), nowProvider(), getSessionMinutes());
    setTimer(outcome.timer);
    persistState();
    render();

    if (outcome.completed) {
      stopInterval();
      setStatus("Sesion completada. Guarda evidencia, score y metricas.");
    }
  }

  function ensureInterval() {
    if (handle) return;
    handle = windowRef.setInterval(onTick, 1000);
  }

  function start() {
    const next = startTimer(getTimer(), nowProvider(), getSessionMinutes());
    setTimer(next);
    persistState();
    render();
    ensureInterval();
  }

  function pause() {
    const next = pauseTimer(getTimer(), getSessionMinutes());
    setTimer(next);
    persistState();
    render();
    stopInterval();
  }

  function reset() {
    const next = resetTimer(getSessionMinutes());
    setTimer(next);
    persistState();
    render();
    stopInterval();
  }

  function init() {
    events.on(dom.timerStart, "click", start);
    events.on(dom.timerPause, "click", pause);
    events.on(dom.timerReset, "click", reset);

    render();

    if (getTimer().running) {
      const resumed = {
        ...getTimer(),
        lastTick: nowProvider()
      };
      setTimer(resumed);
      persistState();
      ensureInterval();
    }
  }

  return {
    init,
    render,
    dispose() {
      stopInterval();
    }
  };
}

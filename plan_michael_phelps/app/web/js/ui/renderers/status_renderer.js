export function renderStatus(dom, message) {
  dom.statusLine.textContent = message;
}

export function renderNextAction(dom, message) {
  dom.nextAction.textContent = message;
}

export function renderRecoverableError(dom, sectionName, error) {
  const reason = String(error?.message || error || "Error inesperado");
  dom.statusLine.textContent = `Seccion '${sectionName}' con error. ${reason}`;
}

export function renderFatalError(dom, error, nextAction) {
  const reason = String(error?.message || error || "Error inesperado");
  dom.statusLine.textContent = `Error: ${reason}`;
  dom.nextAction.textContent = nextAction;
}

function getClipboard(navigatorRef) {
  return navigatorRef && navigatorRef.clipboard ? navigatorRef.clipboard : null;
}

export function wireClipboardAction({
  events,
  button,
  textProvider,
  idleLabel,
  successLabel,
  failureLabel,
  onStatus,
  windowRef = window,
  navigatorRef = globalThis.navigator
}) {
  const clipboard = getClipboard(navigatorRef);

  events.on(button, "click", async () => {
    const text = String(textProvider() || "");

    try {
      if (!clipboard || typeof clipboard.writeText !== "function") {
        throw new Error("clipboard no disponible");
      }

      await clipboard.writeText(text);
      button.textContent = successLabel;
      if (onStatus) {
        onStatus("Accion completada. Continúa con la sesion.");
      }
    } catch {
      button.textContent = failureLabel;
      if (onStatus) {
        onStatus("Clipboard no disponible. Copia manual desde el campo mostrado.");
      }
    }

    windowRef.setTimeout(() => {
      button.textContent = idleLabel;
    }, 1400);
  });
}

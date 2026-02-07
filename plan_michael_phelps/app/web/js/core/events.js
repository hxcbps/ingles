export function createEventRegistry() {
  const unsubscribers = [];

  function on(target, eventName, handler, options) {
    if (!target || typeof target.addEventListener !== "function") {
      return () => {};
    }

    target.addEventListener(eventName, handler, options);
    const unsubscribe = () => {
      target.removeEventListener(eventName, handler, options);
    };

    unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  function clear() {
    while (unsubscribers.length > 0) {
      const unsubscribe = unsubscribers.pop();
      try {
        unsubscribe();
      } catch {
        // Ignore teardown errors.
      }
    }
  }

  return {
    on,
    clear
  };
}

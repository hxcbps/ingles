export function wireNoteActions({ dom, events, getNote, setNote, persistState }) {
  dom.quickNote.value = getNote();

  events.on(dom.quickNote, "input", () => {
    setNote(dom.quickNote.value);
    persistState();
  });
}

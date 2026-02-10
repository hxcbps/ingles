export const NAV_GROUPS = Object.freeze([
  Object.freeze({ id: "main", label: "Principal" })
]);

export const VIEW_META = Object.freeze({
  hoy: Object.freeze({
    id: "hoy",
    label: "Hoy",
    icon: "layout",
    group: "main"
  }),
  sesion: Object.freeze({
    id: "sesion",
    label: "Sesion",
    icon: "timer",
    group: "main"
  }),
  modulos: Object.freeze({
    id: "modulos",
    label: "Modulos",
    icon: "resource",
    group: "main"
  })
});

export const VIEW_IDS = Object.freeze(Object.keys(VIEW_META));

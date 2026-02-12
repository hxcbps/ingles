export const NAV_GROUPS = Object.freeze([
  Object.freeze({ groupId: "main", label: "Principal" }),
  Object.freeze({ groupId: "journey", label: "Seguimiento" })
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
  cierre: Object.freeze({
    id: "cierre",
    label: "Cierre",
    icon: "check",
    group: "main"
  }),
  evaluacion: Object.freeze({
    id: "evaluacion",
    label: "Evaluacion",
    icon: "trophy",
    group: "main"
  }),
  modulos: Object.freeze({
    id: "modulos",
    label: "Modulos",
    icon: "resource",
    group: "journey"
  }),
  progreso: Object.freeze({
    id: "progreso",
    label: "Progreso",
    icon: "trendingUp",
    group: "journey"
  })
});

export const VIEW_IDS = Object.freeze(Object.keys(VIEW_META));

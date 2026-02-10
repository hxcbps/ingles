// S0 kickoff artifact for story S0-B02.
// This module declares the canonical route contract to be consumed by
// router and shell in the routing unification task.

export const CANONICAL_ROUTE_ORDER = Object.freeze([
  'hoy',
  'sesion',
  'cierre',
  'evaluacion',
  'modulos',
  'progreso'
]);

export const CANONICAL_ROUTES = Object.freeze({
  hoy: Object.freeze({ id: 'hoy', hash: '#/modulo/hoy', label: 'Hoy' }),
  sesion: Object.freeze({ id: 'sesion', hash: '#/modulo/sesion', label: 'Sesion' }),
  cierre: Object.freeze({ id: 'cierre', hash: '#/modulo/cierre', label: 'Cierre' }),
  evaluacion: Object.freeze({ id: 'evaluacion', hash: '#/modulo/evaluacion', label: 'Evaluacion' }),
  modulos: Object.freeze({ id: 'modulos', hash: '#/modulo/modulos', label: 'Modulos' }),
  progreso: Object.freeze({ id: 'progreso', hash: '#/modulo/progreso', label: 'Progreso' })
});

export const LEGACY_TO_CANONICAL_HASH = Object.freeze({
  '#/today/action': '#/modulo/hoy',
  '#/today/session': '#/modulo/sesion',
  '#/today/close': '#/modulo/cierre',
  '#/today/evaluate': '#/modulo/evaluacion',
  '#step-action': '#/modulo/hoy',
  '#step-prompt': '#/modulo/sesion',
  '#step-timer': '#/modulo/sesion',
  '#step-checklist': '#/modulo/cierre',
  '#step-evidence': '#/modulo/evaluacion'
});

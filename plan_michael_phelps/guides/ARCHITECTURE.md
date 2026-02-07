# Arquitectura del proyecto (V3 modular adaptativa)

## Objetivo
Mantener un sistema Basico->B2 medible por desempeno, con baja friccion diaria, adaptacion automatica y frontend mantenible.

## Fuente de verdad
- `learning/content/weekXX.json` es el contrato canonico de contenido.
- `learning/content/schema.v3.json` define estructura esperada.
- `learning/resources/resources_catalog.v1.json` define recursos abiertos.
- `learning/books/book_modules.v1.json` define modulos de libros.
- `learning/weeks/weekXX.md` es vista humana sincronizada.

## Capas
- `app/web/js/core/`
- `bootstrap.js`: inicializacion, flujo principal, manejo de errores globales.
- `dom.js`: mapa de nodos DOM y helpers de listas.
- `events.js`: registro centralizado de listeners y limpieza.
- `app/web/js/routing/`
- `routes.js`: contrato de rutas canonicas, aliases y resolucion de hashes legacy.
- `hash_router.js`: escucha `hashchange`, canonicaliza URL y publica cambios de ruta.
- `route_guards.js`: guardrails suaves por etapa (`close`, `evaluate`) sin bloqueo.
- `view_switcher.js`: visibilidad por `data-route-group`, estado activo y foco accesible.
- `app/web/js/content/`
- `repository.js`: carga de `config/settings.json` y `learning/content/weekXX.json`.
- `day_model.js`: contexto temporal + transformacion de JSON diario a view model.
- `app/web/js/state/`
- `store.js`: persistencia `localStorage` (`english-sprint:<YYYY-MM-DD>`), migracion v1->v2 y normalizacion.
- `app/web/js/domain/`
- `checklist.js`: progreso y next action.
- `timer.js`: reglas de timer start/pause/reset/tick.
- `rubric.js`: escala 0-3, promedio y targets.
- `metrics.js`: metricas leading y normalizacion.
- `artifacts.js`: paths de evidencia.
- `app/web/js/ui/renderers/`
- `header_renderer.js`, `mission_renderer.js`, `plan_renderer.js`, `checklist_renderer.js`, `rubric_renderer.js`, `metrics_renderer.js`, `artifacts_renderer.js`, `weekly_renderer.js`, `status_renderer.js`.
- `app/web/js/ui/actions/`
- `clipboard_actions.js`, `timer_actions.js`, `note_actions.js`.
- `app/web/js/utils/`
- `format.js`, `guards.js`.

## Entry points
- `./dashboard`: UX principal (`http://127.0.0.1:8787/app/web/`).
- `./today`: briefing diario por terminal.
- `./plan_michael_phelps/bin/validate_content`: verificacion estructural y KPI.

## Rutas web
- Base: `#/today/action`.
- Canonicas:
  - `#/today/action`
  - `#/today/session`
  - `#/today/close`
  - `#/today/evaluate`
- Alias:
  - `#/today` -> `#/today/action`.
- Legacy:
  - `#step-action` -> `#/today/action`
  - `#step-prompt` y `#step-timer` -> `#/today/session`
  - `#step-checklist` y `#step-evidence` -> `#/today/close`
- Cualquier hash invalido redirige a `#/today/action`.

## Compatibilidad garantizada
1. Soporta contrato JSON V3 (`learning/content/week01..week20.json`) y mantiene lectura tolerante de V2 legado.
2. No cambia el flujo funcional de dashboard (checklist, timer, rubrica, metricas, artifacts, notes, prompt, gates).
3. No cambia la estrategia de persistencia (`english-sprint:` + migracion automatica).
4. No cambian comandos operativos (`./dashboard`, `./today`, `bin/validate_content`).
5. Mantiene compatibilidad de enlaces legacy con anclas antiguas `#step-*`.

## Runtime errors y degradacion
1. Si una seccion falla al renderizar, la UI mantiene pantalla activa y publica error recuperable en `status-line`.
2. Si falla clipboard, la accion cae a copia manual sin bloquear la app.
3. Si falla `localStorage`, el store usa fallback en memoria.
4. Si falla carga JSON semanal, se muestra error accionable con hint a `validate_content`.

## Testing
- Unit tests frontend sin bundler: `node --test app/web/js/tests/*.test.mjs`
- Checks estaticos: `node --check` sobre modulos JS.
- Validacion contenido: `./plan_michael_phelps/bin/validate_content`

## Legacy
- Parser markdown previo movido a `archive/notes/frontend_legacy/markdown.js`.

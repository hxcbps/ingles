# Plan Michael Phelps V3 (20 semanas) - Adaptive coach

Objetivo: Basico -> B2 conversacional con foco en desempeno real (rubrica + metricas + gates + adaptacion).
Estado tecnico: frontend modular interno (ESM por feature), local-first, uso externo sin cambios.

## Inicio recomendado (web)

1. Corre `./dashboard` desde `/Users/dfernandez/code/ingles`.
2. Abre `http://127.0.0.1:8787/app/web/`.
3. Sigue el flujo modular: `Hoy -> Ruta 0->B2 -> Sesion guiada -> Modulos -> Progreso`.
4. Ejecuta la sesion diaria completa.
5. Guarda evidencia y completa score/metricas.

## Arquitectura frontend modular (V6)

La app web usa un shell de navegacion por modulos con hash routes canonicas:

- `#/modulo/hoy`
- `#/modulo/sesion`
- `#/modulo/cierre`
- `#/modulo/evaluacion`
- `#/modulo/modulos`
- `#/modulo/progreso`

Compatibilidad legacy (migracion):

- `#/today/action` -> `#/modulo/hoy`
- `#/today/session` -> `#/modulo/sesion`
- `#/today/close` -> `#/modulo/cierre`
- `#/today/evaluate` -> `#/modulo/evaluacion`
- `#step-action` -> `#/modulo/hoy`
- `#step-prompt` y `#step-timer` -> `#/modulo/sesion`
- `#step-checklist` -> `#/modulo/cierre`
- `#step-evidence` -> `#/modulo/evaluacion`

Objetivo de arquitectura:

- eliminar confusion de navegacion,
- guiar la ejecucion diaria de forma lineal,
- mostrar mapa completo A0/A1 -> B2 por fases,
- mantener la sesion bloqueante con gates y evidencia.

## Base de conocimiento de arquitectura

Fuente de verdad:

- `docs/architecture/README.md`
- `docs/architecture/DOMAIN_LAYER_MAP.md`
- `docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md`
- `docs/architecture/plans/active/`

## GitHub Pages

- URL publica: `https://hxcbps.github.io/ingles/`.
- Entrada publica del sitio: `index.html` en la raiz de `plan_michael_phelps` (redirige a `app/web/`).

## Inicio alterno (terminal)

- `./today` muestra mision, bloques, deliverables y gate del dia.

## Carga semanal objetivo

- Lunes a sabado: `120 min`.
- Domingo: `300 min`.

## Fuente de verdad de contenido

- `learning/content/week01.v4.json` ... `learning/content/week20.v4.json`.
- `learning/content/schema.v4.json`.
- `learning/resources/resources_catalog.v1.json`.
- `learning/books/book_modules.v1.json`.
- Vista humana sincronizada: `learning/weeks/weekXX.md`.

## Validacion obligatoria

- `./bin/validate_content`
- `python3 scripts/lint_architecture_docs.py --repo-root .`
- `python3 scripts/check_docs_drift.py --repo-root .`
- `python3 scripts/audit_english_sprint.py --repo-root .`
- `bash scripts/run_frontend_ux_gates.sh .`

## Legacy

- Ciclo anterior archivado en `archive/legacy_31_day_cycle/`.

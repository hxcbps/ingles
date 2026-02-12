# Ingles (English Sprint)

## Inicio rapido

1. Ejecuta `./dashboard` desde `/Users/dfernandez/code/ingles`.
2. Abre `http://127.0.0.1:8787/app/web/`.
3. Sigue la sesion diaria completa.

## Punto de entrada de arquitectura

La base de conocimiento arquitectonica vive en:

- `plan_michael_phelps/docs/architecture/README.md`

Orden de lectura recomendado para agentes y humanos:

1. `AGENTS.md`
2. `plan_michael_phelps/docs/architecture/DOMAIN_LAYER_MAP.md`
3. `plan_michael_phelps/docs/architecture/DOMAIN_LAYER_QUALITY_SCOREBOARD.md`
4. `plan_michael_phelps/docs/architecture/plans/active/`
5. `plan_michael_phelps/docs/architecture/plans/debt/TECH_DEBT_REGISTER.md`

## Validacion obligatoria

- `./plan_michael_phelps/bin/validate_content`
- `python3 plan_michael_phelps/scripts/lint_architecture_docs.py --repo-root plan_michael_phelps`
- `python3 plan_michael_phelps/scripts/check_docs_drift.py --repo-root plan_michael_phelps`
- `bash plan_michael_phelps/scripts/run_frontend_ux_gates.sh plan_michael_phelps`

## Publicacion en GitHub Pages

- Workflow: `.github/workflows/deploy-pages.yml`.
- URL publica: `https://hxcbps.github.io/ingles/`.
- La raiz publica redirige a `app/web/`.

## Enrutado web (Hash Router)

Rutas canonicas activas:

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

## Activacion de Pages (una sola vez)

1. Ve a `Settings > Pages`.
2. En `Build and deployment`, selecciona `Source: GitHub Actions`.
3. Haz push a `main`.
4. Revisa `Actions > Deploy GitHub Pages` hasta ver `deploy` en verde.

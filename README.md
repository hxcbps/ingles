# Ingles (modo simple, V3 adaptativo)

## Inicio
1. Ejecuta `./dashboard`
2. Abre `http://127.0.0.1:8787/app/web/`
3. Sigue la sesion diaria completa

## Terminal rapido
- `./today` imprime objetivo, bloques, deliverables y gate.

## Validacion de contenido
- `./plan_michael_phelps/bin/validate_content`

## Configuracion
- Archivo: `plan_michael_phelps/config/settings.json`
- `start_date`: inicio del ciclo
- `daily_minutes`: 120
- `sunday_minutes`: 300
- `program_weeks`: 20
- `target_cefr`: B2

## Publicacion en GitHub Pages
- Workflow: `.github/workflows/deploy-pages.yml` (deploy automatico al hacer push a `main` o `master`).
- URL publica esperada: `https://hxcbps.github.io/ingles/`.
- La raiz publica redirige a `app/web/`, por eso el dashboard abre directo desde la URL principal.

## Enrutado web (Hash Router)
- Ruta base canonica: `#/today/action`.
- Rutas disponibles:
  - `#/today/action`
  - `#/today/session`
  - `#/today/close`
  - `#/today/evaluate`
- Compatibilidad legacy:
  - `#step-action` -> `#/today/action`
  - `#step-prompt` y `#step-timer` -> `#/today/session`
  - `#step-checklist` y `#step-evidence` -> `#/today/close`
- Una ruta invalida redirige a `#/today/action` sin romper el dashboard.

### Activacion (una sola vez en GitHub)
1. Ve a `Settings > Pages`.
2. En `Build and deployment`, selecciona `Source: GitHub Actions`.
3. Haz push a `main`.
4. Revisa `Actions > Deploy GitHub Pages` hasta ver `deploy` en verde.

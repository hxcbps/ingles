# Plan Michael Phelps V3 (20 semanas) - Adaptive coach

Objetivo: Basico -> B2 conversacional con foco en desempeno real (rubrica + metricas + gates + adaptacion).
Estado tecnico: frontend modular interno (ESM por feature), local-first, uso externo sin cambios.

## Inicio recomendado (web)
1. Corre `./dashboard` desde `/Users/dfernandez/ingles`.
2. Abre `http://127.0.0.1:8787/app/web/`.
3. Sigue el flujo modular: `Hoy -> Ruta 0->B2 -> Sesion guiada -> Modulos -> Progreso`.
4. Ejecuta la sesion diaria completa.
5. Guarda evidencia y completa score/metricas.

## Arquitectura frontend modular (V6)
La app web ahora usa un shell de navegacion por modulos con hash routes canonicas:
- `#/modulo/hoy`
- `#/modulo/ruta`
- `#/modulo/sesion`
- `#/modulo/modulos`
- `#/modulo/progreso`

Objetivo de la arquitectura:
- eliminar confusion de navegacion,
- guiar la ejecucion diaria de forma lineal,
- mostrar mapa completo A0/A1 -> B2 por fases,
- mantener la sesion bloqueante con gates y evidencia.

## GitHub Pages
- URL publica: `https://hxcbps.github.io/ingles/`.
- Entrada publica del sitio: `index.html` en la raiz de `plan_michael_phelps` (redirige a `app/web/`).

## Inicio alterno (terminal)
- `./today` muestra mision, bloques, deliverables y gate del dia.

## Carga semanal objetivo
- Lunes a sabado: `120 min`.
- Domingo: `300 min`.

## Fuente de verdad de contenido
- `learning/content/week01.json` ... `week20.json`.
- `learning/content/schema.v3.json`.
- `learning/resources/resources_catalog.v1.json`.
- `learning/books/book_modules.v1.json`.
- Vista humana sincronizada: `learning/weeks/weekXX.md`.

## Validacion obligatoria
- Corre: `./plan_michael_phelps/bin/validate_content`.

## Documentos clave
- `app/web/index.html`: dashboard.
- `guides/ARCHITECTURE.md`: arquitectura v2.
- `learning/sessions/DAILY_SESSION.md`: framework diario.
- `tracking/registro_general.md`: KPI + performance tracking.

## Legacy
- Ciclo anterior archivado en `archive/legacy_31_day_cycle/`.

# START HERE V3 (10 minutos)

Arquitectura modular interna activa. Uso externo igual: `./dashboard`, `./today`, `validate_content`.

## Modo recomendado
1. Ejecuta `./dashboard` desde `/Users/dfernandez/ingles`.
2. Abre `http://127.0.0.1:8787/app/web/`.
3. Sigue objetivo, bloques, deliverables y gate del dia.

## Configuracion unica
Edita `plan_michael_phelps/config/settings.json`:
- `start_date` en formato `YYYY-MM-DD`.
- Si queda vacio, el ciclo inicia hoy.

## Validacion tecnica (antes de arrancar)
Corre:
- `./plan_michael_phelps/bin/validate_content`

Debe pasar sin errores.

## Baseline inicial (solo una vez)
1. EF SET Quick Check: https://www.efset.org/quick-check/
2. Cambridge Test Your English: https://www.cambridgeenglish.org/test-your-english/
3. Audio speaking 2 min (sin notas).
4. Guarda todo en `tracking/daily/YYYY-MM-DD/`.

## Rutina diaria
1. Ejecuta `./today`.
2. Ejecuta la sesion (L-S 120 min / D 300 min).
3. Completa checklist, rubrica (0-3), metricas y evidencia.

## Regla de control
Sin evidencia + score + metricas, el dia no cuenta.

## Modo adaptativo V3
- La app ajusta foco diario segun metricas numericas y rubrica.
- Si hay desvio en W05/W10, activa riesgo de extension automatica (+8 a +12 semanas).

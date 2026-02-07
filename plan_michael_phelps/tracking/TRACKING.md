# Tracking V3 (KPIs + desempeño adaptativo)

## KPI semanal obligatorio
- Speaking total (Sesame + ChatGPT coach): `>= 8h` (objetivo 9h).
- Listening intensivo: `>= 180 min`.
- Reading activo: `>= 120 min`.
- Shadowing: `>= 60 min`.
- Writing: `>= 4 outputs` (3 cortos + 1 largo).
- Accuracy drills: `>= 6` ciclos por semana.

## Métricas leading (calidad)
- `error_density`: errores por 100 palabras (objetivo decreciente por fase).
- `repair_success`: % de bloqueos resueltos sin cambiar a espanol.
- `turn_length`: segundos promedio por turno.
- `comprehension_split`: gist/detail.
- `lexical_reuse`: chunks reutilizados en 48h.
- `pronunciation_score`: score de inteligibilidad (0-3).

## Metricas numericas v3 (motor adaptativo)
- `error_density_per_100w`
- `repair_success_pct`
- `turn_length_seconds`
- `gist_pct`
- `detail_pct`
- `lexical_reuse_count`
- `pronunciation_score`

## Evidencia diaria obligatoria
Carpeta: `tracking/daily/YYYY-MM-DD/`
- `audio/`: speaking summary o drill.
- `writing/`: output del dia.
- `kpi/`: log de minutos + metricas + rubricas.

## Historial adaptativo compartido (CLI + dashboard)
Archivo: `tracking/state/adaptive_history.v1.json`
- `history[]`: snapshots diarios (checklist, scores, metrics_numeric).
- `extension.weeks_assigned`: semanas activadas automaticamente (0 por defecto).
- `extension.trigger_week`: semana que gatillo la extension.
- `updated_at`: fecha ISO del ultimo update.

## Regla de control
Si no hay evidencia y score diario, la sesion no cuenta.

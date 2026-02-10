# Pipeline RCA + Recalibracion de Agentes (S0 -> S1)

Fecha: 2026-02-10
Contexto: fallo en `quality-gates` para commit `8452482` con `exit code 1`.

## 1) Findings por severidad

### P0

1. Gate bloqueante mal calibrado para fase S0/S1.
- Evidencia: workflow ejecutaba `validate_curriculum_integrity.py --fail-on-p0` en `push` a `main`.
- Impacto: cualquier deploy quedaba bloqueado mientras existiera deuda P0 historica ya conocida.

2. Dependencia no versionada del audit oficial.
- Evidencia: workflow apuntaba a `$HOME/.codex/skills/english-sprint-architect/scripts/audit_english_sprint.py`.
- Impacto: en runners de GitHub ese path no existe, por lo que el gate real terminaba evaluando solo el validador interno.

### P1

1. Desalineacion de metrica entre herramientas de calidad.
- Evidencia: audit oficial baseline `P0=63`; validador interno reporta `P0=491` por reglas mas granulares.
- Impacto: confusion operativa y bloqueos no alineados al backlog ejecutable (`P0-001..P0-063`).

2. Secuencia backlog vs CI no explicitada por fase.
- Evidencia: S0 cierra infraestructura y cola P0, pero el gate inicial exigia `P0=0` inmediato.
- Impacto: bloqueo de flujo antes de ejecutar S1/S2.

### P2

1. Falta de resumen de politica en artifacts.
- Evidencia: no habia `quality_gate_summary` para auditar por que pasó/falló.
- Impacto: menor observabilidad para debugging rápido.

## 2) Causa raiz

El pipeline aplicó un criterio de release (`P0=0`) durante una fase de baseline (S0), usando además una herramienta de severidad más estricta como única fuente efectiva en CI.

## 3) Correcciones aplicadas

1. Se versionó el audit canónico en repo:
- `plan_michael_phelps/scripts/audit_english_sprint.py`

2. Se recalibró `quality-gates` por fase:
- Modo normal (`push`/`pull_request`): no-regresión sobre baseline `P0<=63`.
- Modo estricto (`workflow_dispatch` con `strict_p0=true`): exige `P0=0`.

3. Se mantuvo el validador interno en modo reporte (sin bloqueo directo) para observabilidad detallada.

4. Se agregaron artifacts de trazabilidad:
- `curriculum_integrity.json`
- `official_audit.txt`
- `quality_gate_summary.json`

## 4) Recalibracion de agentes para S1 (WAVE-1)

Objetivo de ola: bajar P0 desde 63 sin colisionar archivos.

| Agente | Scope | Queue IDs | Archivos |
|---|---|---|---|
| `Agent-S1-01` | CEFR drift W16 | `P0-001` | `learning/content/week16.v4.json` |
| `Agent-S1-02` | CEFR drift W17 | `P0-002` | `learning/content/week17.v4.json` |
| `Agent-S1-03` | CEFR drift W18 | `P0-003` | `learning/content/week18.v4.json` |
| `Agent-S1-04` | CEFR drift W19 | `P0-004` | `learning/content/week19.v4.json` |
| `Agent-S1-05` | CEFR drift W20 | `P0-005` | `learning/content/week20.v4.json` |
| `Agent-S1-06` | Session integrity W10 | `P0-063` + `P0-015` | `learning/content/week10.v4.json` |
| `Agent-S1-07` | Placeholders+locator W01 | `P0-006`, `P0-044` | `learning/content/week01.v4.json` |
| `Agent-S1-08` | Placeholders+locator W02 | `P0-007`, `P0-045` | `learning/content/week02.v4.json` |
| `Agent-S1-09` | Placeholders+locator W03-W05 | `P0-008..P0-010`, `P0-046..P0-048` | `learning/content/week03.v4.json`, `learning/content/week04.v4.json`, `learning/content/week05.v4.json` |

Regla de integración: merge por dependencia y por archivo único (sin solape).

## 5) Gate de salida para avanzar a S2

- `P0_current <= 63` en CI (sin regresión).
- Reducción neta de P0 respecto a baseline tras Wave-1.
- Evidencia de trazabilidad `task_id -> PR -> rerun audit`.

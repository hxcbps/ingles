# Documento de Diseno de Arquitectura
## Hybrid Executable V4 - Zero Friction English (A1/A2 -> B2 Conversacional)

Estado: Propuesto para implementacion  
Version: 1.0  
Idioma de trabajo: Espanol  
Stack objetivo: HTML + CSS + Vanilla JS (ESM) + localStorage + JSON content-driven

---

## 1. Resumen Ejecutivo

Este documento define el rediseño de `plan_michael_phelps` para convertir la app de un dashboard mayormente informativo a un **orquestador activo de sesiones TBLT** con flujo bloqueante por pasos (Wizard), validaciones estrictas (Hard Gates), evidencia obligatoria y adaptacion por desempeno real.

Meta pedagogica: llevar al usuario de nivel A1/A2 a B2 conversacional funcional con sesiones de:
- Lunes a Sabado: 120 minutos
- Domingo: 300 minutos

Estrategia tecnica: **evolucionar** la base actual sin reescribir todo el stack.

---

## 2. Contexto y Diagnostico

### 2.1 Estado actual (fortalezas)

La base actual ya tiene:
- Arquitectura modular en `app/web/js`.
- Carga de contenido desde JSON semanal (`learning/content/weekXX.json`).
- Persistencia local por fecha (`english-sprint:<YYYY-MM-DD>`).
- Validacion de contenido (`bin/validate_content`) y tests unitarios.

### 2.2 Brechas criticas detectadas

1. Flujo pedagógico poco ejecutable:
- La UI muestra paneles y listas, pero no fuerza una secuencia operativa de pasos.

2. Guardrails suaves:
- La navegacion advierte, pero no bloquea avance cuando faltan evidencias.

3. Granularidad insuficiente del contrato de datos:
- `schema.v3.json` describe bloques, pero no especifica pasos ejecutables con gate por paso, fallback y criterio de exito.

4. Contenido repetitivo entre semanas:
- Parte del contenido se repite en forma demasiado uniforme para un escalado fino por i+1.

5. Integracion de recursos no prescriptiva:
- Se listan recursos/modulos, pero no siempre se indica navegacion exacta por unidad/pagina/ejercicio.

---

## 3. Objetivos y No Objetivos

### 3.1 Objetivos

1. Implementar un **Session Wizard bloqueante** (paso activo unico).
2. Introducir **Schema V4 prescriptivo** para guion diario ejecutable.
3. Implementar **Hard Gates** por paso, por dia y por semana.
4. Integrar navegacion exacta de recursos (libro, unidad, pagina, ejercicio).
5. Medir avance por desempeno conversacional real y evidencia.
6. Mantener compatibilidad temporal con contenido V3 mediante feature flag.

### 3.2 No objetivos (esta fase)

1. Reescritura completa de stack/framework.
2. Backend multiusuario.
3. Objetivo C1 como alcance principal (C1 queda fuera; objetivo oficial B2).
4. Integracion API obligatoria con Sesame/ChatGPT (modo base: copy/paste de prompts).

---

## 4. Principios de Diseno

1. Fidelidad pedagogica:
- TBLT + input comprensible + output guiado + feedback + retencion espaciada (D+1, D+3, D+7).

2. Cero friccion:
- El usuario no decide que sigue; la app define el paso exacto.

3. Ejecucion bloqueante:
- Sin gate cumplido no hay avance.

4. Evidencia sobre percepcion:
- El progreso se valida por artefactos, metricas y desempeno.

5. Evolucion incremental:
- Mantener base tecnica estable y migrar contenido por fases.

---

## 5. Arquitectura Objetivo (V4)

### 5.1 Componentes principales

1. `orchestrator.js` (nuevo)
- Maquina de estados de sesion.
- Fuente de verdad de `current_step`, `step_status`, `gate_status`.

2. `hard_guards.js` (nuevo)
- Motor de validacion de gates.
- Evalua condiciones de avance por tipo de gate.

3. `session_wizard.js` (nuevo)
- UI de ejecucion enfocada en un solo paso activo.
- Timer, evidencia, feedback, CTA "Siguiente".

4. `schema.v4.json` (nuevo)
- Contrato prescriptivo para contenido diario ejecutable.

5. `validate_content_v4` (nuevo)
- Validador estricto de consistencia curricular V4.

6. `checklist.js` (existente, degradado)
- Pasa a vista read-only de progreso, no controlador de flujo.

### 5.2 Integracion con sistema actual

1. Feature flag:
- `content_version: "v4"` activa flujo wizard/orchestrator.
- Si no, fallback temporal a flujo V3.

2. Persistencia:
- Reusar store local actual y extender estructura para estado por paso.

---

## 6. Contrato de Datos V4

### 6.1 Estructura base por dia

```json
{
  "day_id": "W01_D01",
  "content_version": "v4",
  "goal": "Introduce yourself using simple present",
  "session_script": [
    {
      "step_id": "1",
      "type": "input_video",
      "title": "Basic Greetings Input",
      "difficulty_level": "A1",
      "duration_min": 15,
      "content": {
        "url": "https://...",
        "offline_ref": "video_ref",
        "instructions": "Watch focusing on intonation."
      },
      "success_criteria": "Visualizacion completa",
      "evidence_required": "none",
      "gate": { "type": "timer_complete", "value": 15 },
      "retry_policy": "repeat_once",
      "fallback_step_id": "1_easier"
    }
  ],
  "retention_loop": ["d_plus_1_errors", "d_plus_3_chunks", "d_plus_7_patterns"],
  "assessment_event": false
}
```

### 6.2 Campos obligatorios por step

1. `step_id` (unico por dia)
2. `type`
3. `duration_min`
4. `instructions` (directa y accionable)
5. `success_criteria`
6. `evidence_required`
7. `gate`
8. `retry_policy`
9. `fallback_step_id` (opcional pero recomendado en pasos criticos)

### 6.3 Tipos de gate soportados

1. `timer_complete`
2. `manual_check`
3. `self_score` (nunca solo en pasos criticos)
4. `artifact_uploaded`
5. `evidence_log_min_words`
6. `min_turns`
7. `rubric_min`
8. `metrics_threshold`

Regla: pasos de speaking/writing criticos deben combinar al menos un gate objetivo (`artifact_uploaded`, `min_turns`, etc.).

---

## 7. Maquina de Estados de Sesion

Estados por paso:
- `locked`
- `active`
- `done`
- `failed`
- `recovered`

Transiciones permitidas:
1. `locked -> active`
2. `active -> done` (gate validado)
3. `active -> failed` (gate no validado en tiempo/intent)
4. `failed -> recovered` (se ejecuta fallback o retry)
5. `recovered -> done` (si cumple gate posterior)

Reglas:
1. Solo un paso puede estar en `active` al mismo tiempo.
2. Paso siguiente permanece `locked` hasta que actual sea `done`.
3. Si se supera maximo de reintentos, activar `recovery_mode`.

---

## 8. UX Objetivo: Session Wizard (Tunnel UX)

### 8.1 Pantalla principal "Hoy"

1. Titulo de dia y objetivo.
2. CTA principal: `COMENZAR SESION`.
3. Estado resumido: tiempo total, progreso de pasos, racha.

### 8.2 Pantalla de paso activo

1. Progreso segmentado superior.
2. Timer grande y visible.
3. Instruccion central de alto contraste.
4. Workspace segun tipo de paso:
- Video/input: enlace + alternativa offline.
- Libro: instruccion exacta (book/unit/page/exercise).
- IA: prompt copy y campo de log.
5. Boton `Siguiente` deshabilitado hasta gate valido.

### 8.3 Friccion cero

1. Sin menu complejo durante ejecucion.
2. Sin multitarea visual.
3. Una sola accion dominante por pantalla.

---

## 9. Estrategia Pedagogica y de Contenido

### 9.1 Fases curriculares (20 semanas base)

1. Fase 1 (W01-W05) - A1/A2 Foundation:
- Input comprensible, binding, speaking de baja ansiedad.

2. Fase 2 (W06-W15) - B1 Expansion:
- TBLT intensivo, negociacion de significado, repair.

3. Fase 3 (W16-W20) - B2 Consolidation:
- Fluidez sostenida, presion comunicativa, precision funcional.

### 9.2 Hitos evaluativos bloqueantes

1. W01: baseline inicial.
2. W05: checkpoint A2.
3. W10: checkpoint B1.
4. W15: checkpoint B2-.
5. W20: mock final B2.

### 9.3 Navegacion exacta de recursos

Cada paso debe declarar:
1. Recurso.
2. Ubicacion exacta (unidad/capitulo/pagina/ejercicio o URL/time-range).
3. Duracion.
4. Output esperado.
5. Evidencia requerida.

Ejemplo:
- "American English File 1, Unit 1, page 6, Exercise 1A-1B, 20 min, evidencia: foto/audio + respuestas."

---

## 10. Integracion IA (Sesame + ChatGPT)

### 10.1 Politica

1. Sesame: speaking principal (fluency, pressure, repair).
2. ChatGPT: accuracy lab, writing correction, metacognicion.

### 10.2 Versionado de prompts

Cada prompt debe incluir:
1. `prompt_ref`
2. `prompt_version`
3. `target_level`
4. `error_focus`
5. `task_mode`

### 10.3 Modo operativo

1. Base: copy/paste de prompts.
2. Futuro: integracion API opcional sin romper flujo base.

---

## 11. Persistencia y Estado

Extensiones de estado diario:
1. `current_step_id`
2. `steps_status`
3. `gates_status`
4. `retries_by_step`
5. `artifacts_by_step`
6. `session_started_at`, `session_completed_at`

Requisito:
- Reanudacion exacta del paso activo tras refresh/cierre.

---

## 12. Validacion de Contenido V4

`validate_content_v4` debe validar minimo:
1. Estructura JSON y campos obligatorios.
2. Unicidad de `step_id`.
3. Consistencia de `fallback_step_id`.
4. Total de minutos por dia (120/300).
5. Presencia de gate en todos los pasos.
6. Pasos criticos con evidencia objetiva.
7. Referencias de recursos validas (`resource_locator`).
8. Existencia de `assessment_event` en semanas hito.

---

## 13. Plan de Ejecucion (Sprints)

### Sprint 1 (Dia 1-2) - Motor V4 + MVP Semana 1

1. Definir `schema.v4.json`.
2. Implementar `orchestrator.js` + `hard_guards.js`.
3. Implementar `session_wizard.js`.
4. Migrar W01 a V4.
5. Crear `validate_content_v4`.

Entregable:
- Sesion completa W01 ejecutable en modo wizard bloqueante.

### Sprint 2 (Dia 3-4) - Gates avanzados + metrica + fase 1 parcial

1. Agregar gates complejos (`min_turns`, `artifact_uploaded`, `metrics_threshold`).
2. Conectar metricas por competencia al estado.
3. Implementar adaptacion dinamica basica.
4. Migrar W02-W05 a V4.

Entregable:
- Fase 1 completa bajo contrato V4.

### Sprint 3 (Dia 5+) - Migracion progresiva y QA integral

1. Migrar W06-W20 por lotes (no big bang).
2. Ejecutar QA de sesiones 120 y 300 min.
3. Refinar UX visual y microcopy final.

Entregable:
- Programa 20 semanas en V4 con gates y validacion.

---

## 14. Riesgos y Mitigaciones

1. Riesgo: migracion de contenido masiva con baja calidad.
- Mitigacion: migracion por fases + validador estricto + QA de muestra por semana.

2. Riesgo: loops de recovery infinitos.
- Mitigacion: max reintentos + ruta de fallback determinista.

3. Riesgo: gates subjetivos manipulables.
- Mitigacion: combinar self-report con evidencia objetiva.

4. Riesgo: ruptura de compatibilidad.
- Mitigacion: feature flag V4 y fallback temporal a V3.

---

## 15. Definition of Done (DoD)

Se considera completado cuando:
1. El usuario ve una accion clara en menos de 5 segundos.
2. No puede avanzar sin cumplir gate del paso activo.
3. El sistema reanuda exactamente donde quedo.
4. Cada paso tiene recurso, duracion, output y evidencia definidos.
5. Los hitos W01/W05/W10/W15/W20 son bloqueantes y trazables.
6. `validate_content_v4` pasa sin errores para semanas migradas.

---

## 16. Checklist de Implementacion Inmediata

1. Crear `learning/content/schema.v4.json`.
2. Crear `app/web/js/core/orchestrator.js`.
3. Crear `app/web/js/routing/hard_guards.js`.
4. Crear `app/web/js/ui/session_wizard.js`.
5. Extender store para estado por paso.
6. Crear `bin/validate_content_v4`.
7. Migrar `week01.json` a V4 como referencia canonica.

---

## 17. Cierre

La arquitectura Hybrid Executable V4 equilibra:
1. Rigor pedagogico (TBLT + input + retencion).
2. Ejecucion real sin friccion (wizard bloqueante).
3. Estabilidad de producto (evolucion incremental del stack actual).

Este enfoque es el mas conveniente para alcanzar B2 conversacional real sin rehacer el sistema desde cero.

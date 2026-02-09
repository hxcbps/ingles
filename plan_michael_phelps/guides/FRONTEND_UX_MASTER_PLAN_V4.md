# Plan Maestro Frontend + UX
## English Sprint Hybrid Executable V4 (A1/A2 -> B2 Conversacional)

Estado: Aprobado para implementacion  
Version: 1.0  
Alcance: Rediseño total de experiencia frontend/UX sobre stack actual

---

## 1. Objetivo de Producto

Transformar la app en un **coach de ejecucion diario** que:
1. Elimine friccion para usuario principiante.
2. Fuerce secuencia operativa real (no dashboard informativo).
3. Garantice evidencia y calidad minima antes de avanzar.
4. Sostenga progreso real hacia B2 conversacional.

Carga de estudio:
1. Lunes a Sabado: 120 min.
2. Domingo: 300 min.

---

## 2. Diagnostico Consolidado

### Problema raiz
El frontend actual prioriza mostrar informacion, no dirigir accion.

### Brechas principales
1. Exceso de modulos visibles simultaneamente.
2. Navegacion libre entre etapas criticas.
3. Guardrails blandos en lugar de bloqueo real.
4. Renderizadores de listas planas poco accionables.
5. Identidad visual insuficiente para un producto premium de alto rendimiento.

### Decision
Evolucionar arquitectura actual a UX tipo Wizard bloqueante + Orchestrator V4 + Hard Gates.

---

## 3. Principios de Diseno

1. Fidelidad pedagogica:
- TBLT + input comprensible + output + feedback + retencion espaciada.

2. Cero friccion:
- Siempre debe existir una accion principal unica.

3. Ejecucion bloqueante:
- Sin gate cumplido no hay avance.

4. Claridad operacional:
- Cada paso define que hacer, como hacerlo, cuanto dura y como validar.

5. Evolucion segura:
- Mantener stack y migrar por feature flag (`content_version: "v4"`).

---

## 4. Arquitectura de Experiencia (IA)

IA objetivo:
1. `Hoy` (Entry + Reanudar)
2. `Sesion` (Wizard activo)
3. `Cierre` (Review diario)
4. `Progreso` (tendencias y checkpoints)
5. `Biblioteca` (navegacion exacta de recursos)

Regla:
- Durante `Sesion`, se ocultan modulos no relevantes.

---

## 5. Arquitectura Tecnica Frontend

### Core nuevo
1. `app/web/js/core/orchestrator.js`
2. `app/web/js/routing/hard_guards.js`
3. `app/web/js/ui/session_wizard.js`

### Core existente a adaptar
1. `state/store.js` (estado por paso)
2. `routing/*` (compatibilidad + bloqueo)
3. `content/day_model.js` (view model por step, no listas)

### Contrato de contenido
1. `learning/content/schema.v4.json`
2. `learning/content/weekXX.v4.json`
3. `learning/prompts/prompts.v4.json`
4. `learning/resources/resources.v2.json`

---

## 6. Flujo Wizard (estado por paso)

Estados:
1. `locked`
2. `active`
3. `done`
4. `failed`
5. `recovered`

Transiciones:
1. `locked -> active` (desbloqueo por paso previo)
2. `active -> done` (gate valido)
3. `active -> failed` (gate invalido)
4. `failed -> recovered` (retry/fallback)
5. `recovered -> done` (gate valido)

Reglas:
1. Solo un paso activo.
2. Boton siguiente bloqueado por defecto.
3. Maximo de reintentos configurable.
4. Recovery mode obligatorio para pasos criticos.

---

## 7. Hard Gates (motor de validacion)

Tipos de gate soportados:
1. `timer_complete`
2. `manual_check`
3. `self_score`
4. `artifact_uploaded`
5. `evidence_log_min_words`
6. `min_turns`
7. `rubric_min`
8. `metrics_threshold`

Reglas de seguridad:
1. `self_score` nunca puede ser gate unico en speaking/writing criticos.
2. Pasos criticos deben usar gate objetivo + evidencia.
3. El cierre diario requiere evidencia minima y metricas minimas.

---

## 8. Design System V4 (visual profesional)

### Tokens
1. Color:
- `--state-active`
- `--state-locked`
- `--state-done`
- `--state-failed`
- `--state-recovery`

2. Tipografia:
- Familia principal UI
- Familia secundaria para contenido pedagógico

3. Espaciado/radio/sombra:
- Escala consistente y semantica

4. Motion:
- transicion de paso
- exito/fallo de gate
- recovery

### Reglas visuales
1. No usar animaciones decorativas sin objetivo cognitivo.
2. Contraste WCAG AA minimo.
3. Estados siempre visibles por color + texto + icono.

---

## 9. Biblioteca de Componentes (UI V4)

Componentes obligatorios:
1. `SessionShell`
2. `StepCard`
3. `InstructionBlock`
4. `ResourceLocatorCard`
5. `PromptCard`
6. `EvidenceCapture`
7. `GateResult`
8. `ProgressStepper`
9. `RecoveryCard`
10. `DayCompletionSummary`
11. `StickyActionFooter` (mobile)

Cada componente debe documentar:
1. Estados visuales.
2. Interacciones.
3. Error/loading.
4. A11y.

---

## 10. UX Writing y Microcopy

Norma de lenguaje:
1. Espanol operacional claro y consistente.
2. Sin mezcla innecesaria de idiomas.
3. Mensajes orientados a accion.

Plantilla por paso:
1. "Objetivo del paso"
2. "Haz esto ahora"
3. "Duracion"
4. "Criterio de exito"
5. "Como se valida"
6. "Si fallas, haz esto"

---

## 11. Experiencia por Dispositivo

### Desktop
1. Panel principal: ejecucion paso activo.
2. Panel secundario: progreso/contexto minimo.
3. CTA principal siempre visible.

### Mobile
1. Flujo vertical unico.
2. Footer sticky con accion principal.
3. Inputs y botones optimizados para touch.

---

## 12. Alineacion Pedagogica (V4)

Cada paso del `session_script` debe mapear:
1. Objetivo comunicativo.
2. Tarea TBLT.
3. Recurso exacto (unidad/pagina/ejercicio o URL).
4. Output verificable.
5. Gate de calidad.

Checkpoints bloqueantes:
1. W01
2. W05 (A2)
3. W10 (B1)
4. W15 (B2-)
5. W20 (B2)

Retencion espaciada:
1. D+1
2. D+3
3. D+7

---

## 13. Telemetria y Analitica UX

Eventos minimos:
1. `session_started`
2. `step_started`
3. `gate_passed`
4. `gate_failed`
5. `recovery_started`
6. `session_completed`
7. `session_abandoned`

KPIs:
1. Time to First Action < 10s
2. Completion diaria >= 85%
3. Drop-off por paso < 15%
4. Evidencia valida >= 90%
5. Claridad percibida >= 4/5

---

## 14. Accesibilidad y Calidad

1. Contraste WCAG AA.
2. Navegacion por teclado end-to-end.
3. Focus visible y consistente.
4. Roles/ARIA correctos para estado de paso y mensajes.
5. Errores accionables (no solo tecnicos).

---

## 15. Performance Frontend

1. Reducir densidad DOM en modo sesion (render incremental).
2. Evitar relayout innecesario en timer/step updates.
3. Lazy render de paneles secundarios.
4. Carga de contenido por semana activa.

---

## 16. Plan de Implementacion por Sprints

### Sprint 0 - Fundacion (2-3 dias)
1. Definir tokens V4 y convenciones UI.
2. Definir contratos de componentes.
3. Alinear feature flag y estrategia de rollout.

### Sprint 1 - Motor + Shell (4-5 dias)
1. Implementar `orchestrator.js` (MVP).
2. Implementar `hard_guards.js` base.
3. Implementar `SessionShell` y `ProgressStepper`.
4. Activar flujo V4 para W01.

### Sprint 2 - Componentes de ejecucion (4-5 dias)
1. `StepCard`, `InstructionBlock`, `ResourceLocatorCard`.
2. `PromptCard`, `EvidenceCapture`, `GateResult`.
3. CTA bloqueado por gate en todos los pasos.

### Sprint 3 - Cierre y adaptacion (4-5 dias)
1. `RecoveryCard` y `DayCompletionSummary`.
2. Integrar metricas y rubricas de cierre.
3. Migrar W02-W05 a V4.

### Sprint 4 - Escala curricular (5-7 dias)
1. Migrar W06-W10.
2. Ajustar adaptacion por desempeño.
3. Refinar UX por telemetria.

### Sprint 5 - Consolidacion B2 (5-7 dias)
1. Migrar W11-W20.
2. Validar checkpoints W15/W20.
3. QA completo 120/300 min.

### Sprint 6 - Hardening (3-4 dias)
1. Accesibilidad final.
2. Performance final.
3. Limpieza de legado V3 y docs.

---

## 17. Plan de Backlog por Archivo

### HTML
1. `app/web/index.html`
- Reemplazar layout multipanel por shell V4.
- Mantener contenedor legacy tras feature flag durante transicion.

### CSS
1. `app/web/styles.css`
- Introducir tokens V4.
- Definir estilos por estado de paso.
- Implementar layout adaptativo desktop/mobile V4.

### JS Core
1. `app/web/js/core/orchestrator.js` (nuevo)
2. `app/web/js/routing/hard_guards.js` (nuevo)
3. `app/web/js/state/store.js` (extender estado por paso)

### JS UI
1. `app/web/js/ui/session_wizard.js` (nuevo)
2. `app/web/js/ui/components/*` (nuevos)
3. Deprecar renderizadores planos gradualmente.

### Content
1. `learning/content/schema.v4.json`
2. `learning/content/weekXX.v4.json`
3. `learning/prompts/prompts.v4.json`
4. `learning/resources/resources.v2.json`

### Validation
1. `bin/validate_content_v4` (nuevo)
2. tests de orquestacion + gates + flujo.

---

## 18. Definition of Done

Se considera completado cuando:
1. El usuario siempre sabe su siguiente accion.
2. No puede avanzar sin gate valido.
3. Cada paso tiene recurso, output y evidencia definidos.
4. Se completa sesion diaria sin confusion en modo wizard.
5. Checkpoints pedagogicos son bloqueantes y trazables.
6. Frontend es visualmente profesional, consistente y accesible.

---

## 19. Documentos Canonicos de la Iniciativa V4

1. `guides/FRONTEND_UX_MASTER_PLAN_V4.md` (este documento)
2. `guides/HYBRID_EXECUTABLE_V4_DESIGN.md`
3. `guides/HYBRID_EXECUTABLE_V4_ARCH_DIAGRAMS.md`
4. `guides/UX_FRONTEND_AUDIT_AND_REDESIGN_PLAN.md`

Este set reemplaza guias legacy V3 para evitar ruido estrategico y de implementacion.


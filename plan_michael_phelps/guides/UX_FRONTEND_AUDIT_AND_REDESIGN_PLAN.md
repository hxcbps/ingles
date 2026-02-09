# Estudio UX/UI y Plan de Rediseño Frontend
## English Sprint - Diagnostico de Diseno Actual y Plan Profesional V4

Estado: Propuesto  
Version: 1.0  
Enfoque: UX de ejecucion + Frontend profesional + alineacion pedagogica V4

---

## 1. Resumen Ejecutivo

La app actual tiene una base tecnica estable, pero su experiencia visual y de navegacion no corresponde al objetivo de alto rendimiento A1/A2 -> B2.

Problema central:
- El producto se comporta como "tablero de informacion" en vez de "coach de ejecucion".

Impacto:
- Alta carga cognitiva.
- Navegacion confusa.
- Sensacion visual amateur/rustica.
- Bajo soporte a toma de accion inmediata.

Direccion recomendada:
- Migrar a UX tipo **Wizard bloqueante** con jerarquia visual fuerte, microinteracciones utiles, lenguaje accionable y diseno adaptativo por estado pedagogico.

---

## 2. Metodo de Auditoria

Revisión de:
1. Estructura visual y layout.
2. Navegacion y arquitectura de informacion.
3. Renderizado de contenido y utilidad real.
4. Accesibilidad y usabilidad.
5. Consistencia con objetivo pedagogico.

Archivos auditados (muestra clave):
- `plan_michael_phelps/app/web/index.html`
- `plan_michael_phelps/app/web/styles.css`
- `plan_michael_phelps/app/web/js/routing/routes.js`
- `plan_michael_phelps/app/web/js/routing/route_guards.js`
- `plan_michael_phelps/app/web/js/routing/view_switcher.js`
- `plan_michael_phelps/app/web/js/ui/renderers/*.js`
- `plan_michael_phelps/app/web/js/content/day_model.js`

---

## 3. Hallazgos Criticos (ordenados por severidad)

### P0 - Flujo de usuario no orientado a ejecucion

1. Demasiadas tarjetas visibles y doble columna con alta densidad.
- `plan_michael_phelps/app/web/index.html:45`

2. Seccion principal mezcla "accion", "sesion", "cierre", "evaluacion" en un unico canvas.
- `plan_michael_phelps/app/web/index.html:45`

3. El usuario debe decidir manualmente que bloque tocar despues.
- `plan_michael_phelps/app/web/index.html:23`

Resultado:
- Friccion alta en usuario principiante y perdida de foco operacional.

### P0 - Navegacion permisiva en un producto que requiere disciplina

1. Rutas por hash con navegacion libre entre etapas.
- `plan_michael_phelps/app/web/js/routing/routes.js:1`

2. Guardrails solo en modo warning; no bloquean avance.
- `plan_michael_phelps/app/web/js/routing/route_guards.js:9`

Resultado:
- El sistema no impone cumplimiento de evidencia y secuencia.

### P1 - Contenido renderizado como texto plano no accionable

1. Ejercicios se muestran como "type: instructions", sin guion operativo.
- `plan_michael_phelps/app/web/js/ui/renderers/exercises_renderer.js:15`

2. Recursos se muestran como string largo tecnico, no como tarea concreta.
- `plan_michael_phelps/app/web/js/ui/renderers/resources_renderer.js:21`

3. Plan renderizado como listas, sin "paso activo", "criterio de exito", "siguiente accion".
- `plan_michael_phelps/app/web/js/ui/renderers/plan_renderer.js:3`

Resultado:
- Sensacion de app basica y poco inteligente.

### P1 - Lenguaje y microcopy inconsistentes

1. Mezcla espanol/ingles en labels y mensajes.
- `plan_michael_phelps/app/web/index.html:77`
- `plan_michael_phelps/app/web/js/ui/renderers/resources_renderer.js:16`

2. Header con string tecnico poco humano.
- `plan_michael_phelps/app/web/js/ui/renderers/header_renderer.js:4`

Resultado:
- Reduce claridad, percepcion premium y confianza.

### P1 - Sistema visual correcto pero sin identidad profesional distintiva

1. Paleta y componentes son consistentes, pero conservadores y planos en semantica.
- `plan_michael_phelps/app/web/styles.css:1`

2. Falta sistema de estados visuales de sesion (locked/active/done/failed/recovery).

Resultado:
- Visual agradable pero no transmite "coach elite" ni control de ejecucion.

### P2 - Modelo de datos no permite UX de alta precision

1. `day_model` transforma a listas estaticas, no a pasos ejecutables con gate.
- `plan_michael_phelps/app/web/js/content/day_model.js:70`

2. Rutas de evidencia hardcodeadas localmente.
- `plan_michael_phelps/app/web/js/content/day_model.js:49`

Resultado:
- Limitacion para una experiencia adaptativa y portable.

---

## 4. Causa Raiz: por que el front esta asi

1. Prioridad historica en contenido y validacion tecnica sobre producto UX.
2. Evolucion incremental de funcionalidad sin un rediseño integral de IA/flujo.
3. Arquitectura V3 descriptiva (paneles/listas) en lugar de prescriptiva (orquestacion).
4. Ausencia de un Design System orientado a estados de aprendizaje.
5. Falta de modelo formal "paso activo + gate + recovery" en el frontend.

---

## 5. Norte de Rediseño (Vision UX)

Objetivo:
- Que el usuario sepa en menos de 5 segundos "que hacer ahora", "como hacerlo", "cuanto dura", "como se valida".

Patron UX recomendado:
1. **Tunnel UX / Focus Mode** (un paso activo).
2. **Progressive disclosure** (mostrar solo lo relevante del paso actual).
3. **Hard gating visual y funcional** (boton siguiente bloqueado).
4. **Feedback inmediato y concreto** (pass/fail + accion correctiva).
5. **Adaptacion contextual** (mismo layout, contenido dinamico por desempeno).

---

## 6. Principios de Diseno Visual (profesional y unico)

1. Jerarquia semantica fuerte:
- Superficie principal de ejecucion.
- Panel lateral minimo de progreso.
- Eliminacion de ruido informativo simultaneo.

2. Design tokens semanticos:
- `--state-active`, `--state-locked`, `--state-done`, `--state-failed`, `--state-recovery`.

3. Tipografia con personalidad y legibilidad:
- Pareja tipografica distintiva, no apariencia plantilla generica.

4. Color y contraste:
- WCAG AA como base.
- Estado de progreso codificado por color + icono + texto.

5. Motion funcional:
- Transiciones de paso, exito gate, error gate.
- Nada ornamental sin valor cognitivo.

6. Microcomponentes premium:
- Step card, gate badge, evidence dropzone, progress rail, action footer sticky.

---

## 7. Arquitectura Frontend Objetivo (alineada a V4)

### 7.1 Estructura de pantallas

1. `Hoy` (entry)
- CTA principal: Comenzar/Reanudar sesion.

2. `Session Wizard` (core)
- Un solo paso activo.
- Timer, recurso, instrucciones, evidencia, gate.

3. `Review`
- Cierre diario con resumen de desempeno.

4. `Progreso`
- Tendencia y checkpoints.

### 7.2 Layout recomendado

Desktop:
1. Columna principal (70%): paso activo.
2. Columna secundaria (30%): progreso, checkpoints, ayudas.

Mobile:
1. Flujo vertical unico.
2. Footer de accion persistente.

---

## 8. Rediseño de Componentes (UI Library V4)

Componentes core:
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

Cada componente debe definir:
1. Estado visual.
2. Estado interactivo.
3. Estado de error.
4. Estado loading.
5. Estado disabled.

---

## 9. Mapeo Pedagogico -> UX (V4)

Por cada `step` del `session_script`:
1. Mostrar objetivo comunicativo.
2. Mostrar instruccion concreta.
3. Mostrar criterio de exito.
4. Mostrar evidencia obligatoria.
5. Bloquear avance hasta gate valido.

Casos:
1. `textbook_drill`
- Mostrar: libro, unidad, pagina, ejercicio.

2. `ai_roleplay`
- Mostrar: prompt, objetivo de turnos, contador.

3. `writing_transfer`
- Mostrar: minimo de palabras y checklist de calidad.

---

## 10. Tecnicas UX modernas a aplicar

1. Goal-Gradient Effect:
- Barra de progreso por pasos y por sesion total.

2. Implementation Intentions:
- CTA + texto de accion exacta ("Ahora haz X durante Y min").

3. Cognitive Load Management:
- Quitar modulos no relevantes del viewport activo.

4. Reflective Checkpoints:
- Mini autoevaluacion de 1 click al final de cada paso.

5. Adaptive Friction:
- Si fallas gate, baja complejidad sin bajar estandar.

6. Confidence UX:
- Mensajes de feedback claros, no ambiguos, no punitivos.

---

## 11. Plan de Transformacion Frontend (iterativo)

### Fase 0 - Auditoria executable baseline
1. Definir metricas UX actuales.
2. Registrar embudo actual de sesion.

### Fase 1 - UX Shell V4
1. Nuevo layout Session Wizard.
2. Integrar `orchestrator + hard_guards`.
3. Mantener V3 oculto por feature flag.

### Fase 2 - Componentizacion profesional
1. Crear UI library V4.
2. Refactor renderers planos a renderers de pasos.
3. Uniformar copy (espanol operativo coherente).

### Fase 3 - Visual polish + accesibilidad
1. Ajustes finales de branding visual.
2. Navegacion teclado completa.
3. Revision contraste/lectura en mobile.

### Fase 4 - Optimizacion adaptativa
1. Ajustes por telemetria de uso.
2. Personalizacion visual por estado pedagogico.

---

## 12. KPIs de Exito UX

1. Tiempo a primera accion < 10 segundos.
2. Completion rate diaria > 85%.
3. Drop-off por paso < 15%.
4. Error de navegacion percibida < 5%.
5. Claridad de instruccion (self-report) >= 4/5.
6. Cumplimiento de evidencia diaria >= 90%.

---

## 13. Requisitos de Accesibilidad y Calidad

1. Contraste WCAG AA minimo.
2. Focus visible en todos los controles.
3. Navegacion por teclado end-to-end.
4. Estados ARIA consistentes para paso activo y bloqueos.
5. Errores con mensaje accionable y recuperacion clara.

---

## 14. Riesgos y Mitigaciones

1. Riesgo: priorizar solo look and feel.
- Mitigacion: UX ligado a orquestacion y gates.

2. Riesgo: ruptura funcional en migracion.
- Mitigacion: feature flag + rollout por semanas.

3. Riesgo: sobrecarga de UI en desktop.
- Mitigacion: priorizar foco y disclosure progresivo.

---

## 15. Recomendacion Final

El rediseño debe tratarse como **producto de ejecucion pedagogica**, no como embellecimiento visual.

Orden correcto:
1. Flujo y gates.
2. Componentes y jerarquia.
3. Estetica premium.
4. Optimizacion por datos.

Este enfoque corrige la raiz del problema y convierte la app en una experiencia profesional, intuitiva y efectiva para llegar a B2 real.


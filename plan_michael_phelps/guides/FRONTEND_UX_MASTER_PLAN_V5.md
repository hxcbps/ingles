# Plan Maestro Frontend + UX V5
## English Sprint: The Cinematic Execution Coach

**Estado:** Borrador V5 (Propuesta Unificada)
**Objetivo:** Fusionar la rigurosidad pedagógica (V4) con una experiencia de usuario de "Alto Impacto/Premium" (V5).

---

## 1. Visión del Producto: "No es un Dashboard, es un Túnel"

El usuario no entra a "ver su progreso". Entra a **ejecutar**.
La interfaz debe comportarse como un **Túnel de Enfoque Cinemático**:
1.  **Cero Distracción:** Todo lo que no es el "Paso Actual" desaparece o se desenfoca.
2.  **Feedback Táctil:** Cada acción tiene una respuesta inmediata (sonido, moción, color).
3.  **Narrativa Visual:** El fondo y la atmósfera cambian según la intensidad de la tarea (Aprendizaje vs. Evaluación).

---

## 2. Diagnóstico y Rectificación (Resumen)

| Área | Estado V4 (Actual) | Estado V5 (Objetivo) |
| :--- | :--- | :--- |
| **Modelo Mental** | Formulario paso a paso | Sesión entrenada guiada |
| **Validación** | `alert()` nativo (Hostil) | Feedback en sitio + Animación |
| **Arquitectura** | `innerHTML` strings (Rígido) | Sistema de Componentes Reactivos |
| **Schema** | Desalineado con Código | Contrato Estricto (Single Source) |
| **Telemetría** | Genérica | Eventos Tipados por Gate/Step |

---

## 3. Arquitectura de Experiencia (El "Blueprint")

Definición operativa de cada fase de la sesión.

### 3.1. Fase: HOY (Landing)
*   **Objetivo:** Iniciar la sesión en < 5 segundos.
*   **Estado Visual:** "Clean Slate". Fondo tranquilo.
*   **CTA Único:** Botón masivo "START SESSION [XX] MIN". Pulsando suavemente.
*   **Contexto:** Solo muestra: Día actual, Meta del día, Racha actual.
*   **Bloqueo:** No se puede navegar a "Biblioteca" o "Progreso" sin haber completado o explícitamente "saltado" (con penalización) la sesión de hoy.

### 3.2. Fase: SESIÓN (The Tunnel)
*   **Visual:** Modo inmersivo. Navbar y Footer se ocultan/minimizan.
*   **Navegación:** Lineal estricta. No hay "Atrás" libre, solo "Atrás" para revisar (read-only).
*   **Spotlight:** El componente activo tiene elevación (z-index), sombra profunda y opacidad 100%. El resto opacidad 30%.
*   **Micro-interacciones:**
    *   *Timer:* No es texto `00:00`. Es una barra de borde que se consume.
    *   *Input:* Al escribir, partículas sutiles o borde brillante.

### 3.3. Fase: CIERRE Y CALIBRACIÓN
*   **Visual:** "Celebración Sobria". Cambio de paleta a tonos de éxito (Verde/Dorado).
*   **Acción:** 
    1.  Subida de evidencia (Drag & Drop con feedback visual).
    2.  Self-Rating (Selector de estrellas con física).
    3.  Resumen de métricas (Gráficos animados que suben desde 0).

---

## 4. Contrato Técnico Estricto

### 4.1. Tipos de Gate (Sincronizado con Schema V4 Real)
Implementación obligatoria en `hard_guards.js`:

1.  `timer_complete`: Requiere `timeElapsed >= value`.
2.  `min_words`: Requiere `wordCount >= value`.
3.  `min_turns`: Requiere `interactions >= value` (Chat).
4.  `self_score`: Requiere `rating >= min_value`.
5.  `evidence_upload` / `artifact_uploaded`: Requiere URL válida.
6.  `manual_check`: Requiere `boolean true`.
7.  `compound`: AND lógico de múltiples reglas.
8.  `metrics_threshold`: (Nuevo) Valida métricas de API externa (ej: pronunciación).

### 4.2. Fuentes de Datos (Canonical Paths)
*   **Contenido:** `learning/content/weekXX.v4.json`
*   **Schema:** `learning/content/schema.v4.json`
*   **Prompts:** `learning/prompts/PROMPT_PACK.md` (Debe parsearse o migrarse a JSON si se requiere automatización).
*   **Recursos:** `learning/resources/resources_catalog.v1.json`

---

## 5. Sistema de Diseño & Motion (Tokenización)

El "Premium" se define aquí. No usar valores hardcoded.

### 5.1. Variables Semánticas
```css
/* Estados del Túnel */
--tunnel-bg-focus: radial-gradient(circle, #fff 0%, #f0f0f0 100%);
--tunnel-bg-success: radial-gradient(circle, #e6fffa 0%, #b2f5ea 100%);
--tunnel-bg-error:   radial-gradient(circle, #fff5f5 0%, #feb2b2 100%);

/* Animación */
--motion-spring-entry: cubic-bezier(0.34, 1.56, 0.64, 1);
--motion-duration-step: 0.6s;
```

### 5.2. Componentes Clave (JS Classes)
1.  `StageManager`: Controla el "Mount/Unmount" con animaciones de entrada/salida.
2.  `GateKeeper`: Visualiza el estado del Gate (Candado -> Loading -> Check).
3.  `RichInput`: 
    *   `AudioRecorder`: Visualizador de ondas (Canvas).
    *   `SmartTextarea`: Contador de palabras en tiempo real + highlight de errores.

---

## 6. Observabilidad y Telemetría (Data-Driven UX)

Cada evento debe llevar payload completo para debug UX.

### 6.1. Definición de Eventos
*   `step_view`: `{ step_id, step_type, time_since_session_start }`
*   `gate_attempt`: `{ step_id, gate_type, input_value, success (bool), failure_reason }`
*   `session_abandon`: `{ last_step_id, time_spent_total, reason (timeout/manual) }`
*   `ui_error`: `{ component, error_stack, user_context }`

### 6.2. Performance SLIs
*   **LCP (Largest Contentful Paint):** < 1.2s (Landing).
*   **INP (Interaction to Next Paint):** < 100ms (Gate validation).
*   **Step Transition:** < 300ms (Visual complete).

---

## 7. Plan de Implementación Rectificado (3 Fases)

### Fase 1: Core & Estructura (Sprints 1-2)
*   **Objetivo:** Lógica V4 robusta + HTML Semántico.
*   Tareas:
    1.  Refactorizar `orchestrator.js` para soportar todo el Schema V4 real.
    2.  Implementar `hard_guards.js` con validación de tipos estricta y mensajes de error detallados ("Faltan 10 palabras").
    3.  Crear estructura de componentes base (Clases JS, no strings).

### Fase 2: Motion & "Cinematic Layer" (Sprints 3-4)
*   **Objetivo:** Implementar el "Túnel" y Feedback.
*   Tareas:
    1.  Implementar `StageManager` con transiciones CSS/WAAPI.
    2.  Diseñar e implementar `GateKeeper` visual (animaciones de botón).
    3.  Aplicar diseño visual "Premium" (Tipografía, Espacios, Sombras).

### Fase 3: Integración de Contenido & Telemetría (Sprints 5-6)
*   **Objetivo:** Migración de semanas y cierre.
*   Tareas:
    1.  Conectar `metrics_engine` real.
    2.  Migrar W01-W05 a JSON V4 validado.
    3.  Implementar dashboard de cierre y evaluación.

---

**Aprobado por:**
Antigravity (GenAI Agent)
Fecha: 2026-02-08

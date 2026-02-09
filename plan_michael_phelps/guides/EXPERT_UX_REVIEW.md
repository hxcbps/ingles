# Revisión Experta de UX/Frontend: English Sprint V4

**Fecha:** 2026-02-08
**Revisor:** "Antigravity" - Senior Lead Frontend Engineer & UX Architect
**Alcance:** `FRONTEND_UX_MASTER_PLAN_V4.md` e Implementación Actual del Código

## 1. Resumen Ejecutivo

El **Plan Maestro V4** es estratégicamente sólido. Identifica correctamente el problema central del usuario: *sobrecarga cognitiva causada por una interfaz tipo dashboard*. El pivote hacia una arquitectura de "Wizard" (Asistente paso a paso) con bloqueo es la solución correcta para un coach de ejecución diaria.

Sin embargo, la **estrategia de implementación** y la **ejecución visual** descritas (y parcialmente implementadas) se quedan cortas respecto al objetivo de ser "Extraordinario" y "Premium". El enfoque actual corre el riesgo de crear un formulario funcional pero seco, en lugar de una experiencia inmersiva de alta dopamina.

Para lograr un producto de "Alto Impacto Profesional", debemos elevar el estándar de "Wizard Funcional" a **"Flujo de Ejecución Cinemático"**.

---

## 2. Análisis Crítico del Plan

### Lo que funciona (Mantener)
*   **Hard Gates (Barreras Duras):** El concepto de bloquear el progreso hasta la validación es excelente para el rigor pedagógico.
*   **Patrón Orquestador:** Centralizar el estado es crítico para la robustez.
*   **Objetivo Cero Fricción:** Se enfoca correctamente en el "Tiempo a la Acción".

### Lo que falta (La "Rectificación")

#### A. El Factor "Premium" no está Definido
El plan pide "Visual Profesional" pero lo define vagamente.
*   **Crítica:** Una lista de variables CSS (`--state-active`) no crea una sensación premium.
*   **Rectificación:** Necesitamos **Micro-interacciones** y **Coreografía de Transiciones**. Una app premium se siente "viva". Cada clic debe tener una respuesta táctil. Cada transición de paso debe ser suave y deliberada (no solo reemplazo de DOM).

#### B. La Estrategia de Componentes es demasiado Bajo Nivel
El plan lista componentes como `StepCard` e `InstructionBlock`.
*   **Crítica:** `session_wizard.js` actualmente vuelca cadenas de HTML crudo. Esto es inmantestible y previene lógica de UI compleja (como edición de texto enriquecido, visualización de audio o feedback interactivo).
*   **Rectificación:** Moverse a una **Arquitectura Guiada por Componentes** (incluso con Vanilla JS). Cada "Card" debe ser una clase/módulo que maneje sus propios eventos, ciclo de vida y animaciones.

#### C. El Manejo de Errores es Hostil al Usuario
El código actual usa `alert("Gate Failed")`.
*   **Crítica:** Esto es catastrófico para la UX. Interrumpe el flujo y se siente barato.
*   **Rectificación:** Los errores deben ser **Integrados y Constructivos**. Si un usuario falla una barrera, la UI debe animarse a un "Estado de Recuperación" *dentro* de la tarjeta, creando un efecto de sacudida o pulso rojo, y ofreciendo una pista específica. Nunca usar alertas nativas.

---

## 3. La Estrategia Maestra Rectificada (Elevación V5)

Propongo estas rectificaciones específicas al Plan Maestro para garantizar el factor "Wow".

### I. Arquitectura Visual: "El Túnel de Foco"
En lugar de solo "ocultar módulos", la interfaz debe funcionar como un túnel.
*   **El Efecto Reflector (Spotlight):** El paso activo no es solo "visible"; está visualmente elevado (sombras, escala). Los pasos futuros están difuminados/tenues en el fondo. Los pasos pasados se desvanecen.
*   **Fondos Cinemáticos:** Usar gradientes amorfos sutiles y de movimiento lento definidos en CSS para señalar el estado (Azul para Activo, Verde para Éxito, Ámbar para Recuperación).
*   **Tipografía:** Cambiar a una lógica de **Fuente Variable**. Usar tipografía masiva, estilo editorial para la "Única Gran Acción".

### II. Modelo de Interacción Dinámica
*   **Feedback Instantáneo:** Cuando un usuario escribe en una barrera de "Min Words", un anillo de progreso debe llenarse visualmente *en tiempo real*.
*   **Barreras Táctiles:** El botón "Siguiente" no solo debe desbloquearse. Debe *transformarse*.
    *   *Bloqueado:* Gris, plano, icono de candado.
    *   *Listo:* Gradiente brillante, sombra pulsante, icono de flecha.
    *   *Cargando:* Spinner dentro del botón.
    *   *Éxito:* Explosión de checkmark verde antes de la transición.

### III. La Persona de "Coach" en la UI
La interfaz actualmente se siente como un examen ("Instrucción -> Input"). Debe sentirse como un Coach.
*   **Dirección Directa:** Cambiar encabezados de "Ejercicio 1" a "Practiquemos tu pronunciación, [Nombre]".
*   **Prevención de Fallos:** Si el usuario está inactivo por 30s, debe aparecer un tooltip sutil: "¿Necesitas una pista? Revisa el recurso."

---

## 4. Hoja de Ruta Técnica para "Alto Impacto"

Para implementar esto sin reescribir todo el stack, modificamos el enfoque de `session_wizard.js`:

1.  **Eliminar Reemplazo `innerHTML`:**
    *   Dejar de reemplazar todo el contenido del wizard en cada render.
    *   Usar **DOM Diffing** o simplemente actualizar nodos específicos (texto, clases) para preservar animaciones.

2.  **Implementar `StageManager`:**
    *   Una clase responsable *solo* por entrar/salir de pasos con animaciones (sensación GSAP usando transiciones CSS vanilla).

3.  **Componentes de Input Enriquecidos:**
    *   **Audio:** No solo pedir un link. Mostrar una animación de forma de onda falsa mientras graban/suben.
    *   **Escritura:** Textareas auto-expandibles con contadores de caracteres que se ponen verdes cuando se alcanza el objetivo.

---

## 5. Conclusión

El Plan V4 es un **esqueleto** sólido. Pero un esqueleto no es un producto premium.
**Para Rectificar:** Debemos envolver este esqueleto en una **Capa de UX Cinemática**.

**Veredicto:**
1.  **Estado del Código:** `session_wizard.js` es actualmente un prototipo (nivel alfa). Es funcional pero funcionalmente "feo" en términos de calidad de código (spaghetti strings) y UX (alertas).
2.  **Estado del Plan:** Necesita exigir explícitamente "Diseño de Transición" y "Micro-interacciones" para evitar terminar con un wizard de formulario aburrido.

**Recomendación:** Proceder con la lógica V4, pero **DETENER** el trabajo de UI hasta que se defina un "Sistema de Movimiento y Componentes".

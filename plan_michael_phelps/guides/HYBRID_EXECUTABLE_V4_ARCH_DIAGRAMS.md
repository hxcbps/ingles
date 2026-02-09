# Diagramas de Arquitectura
## Hybrid Executable V4 - Zero Friction English (A1/A2 -> B2)

Estado: Propuesto  
Version: 1.0  
Formato: Mermaid (Markdown)

---

## 1) Contexto del Sistema (C4 - Nivel Contexto)

```mermaid
flowchart LR
    U[Usuario<br/>Learner A1-A2 a B2]:::user
    APP[English Sprint Web App<br/>Hybrid Executable V4]:::app
    SES[Sesame<br/>Speaking Coach Externo]:::ext
    GPT[ChatGPT<br/>Feedback/Correccion Externo]:::ext
    RES[Recursos Externos<br/>YouTube, BBC, VOA, etc.]:::ext
    BOOK[Libros Fisicos/Digitales<br/>AEF, EGIU, Speakout, etc.]:::ext

    U -->|Ejecuta sesion diaria| APP
    APP -->|Abre enlace/prompt| SES
    APP -->|Abre enlace/prompt| GPT
    APP -->|Navegacion exacta| RES
    APP -->|Unidad/Pagina/Ejercicio| BOOK
    U -->|Entrega evidencia| APP

    classDef user fill:#d9f5e5,stroke:#1b7f4b,color:#0f3d26;
    classDef app fill:#fff6d6,stroke:#8a6a00,color:#3d2d00;
    classDef ext fill:#e8eefc,stroke:#2d4ea1,color:#102451;
```

---

## 2) Contenedores y Fronteras (C4 - Nivel Contenedor)

```mermaid
flowchart TB
    subgraph Browser[Browser - Single User Runtime]
        UI[Session Wizard UI<br/>session_wizard.js]
        ORCH[Orchestrator<br/>orchestrator.js]
        GUARDS[Hard Guards<br/>hard_guards.js]
        STORE[State Store<br/>localStorage + state/store.js]
        ROUTER[Routing Layer<br/>hash_router + hard guard routing]
    end

    subgraph Content[Local Content Repository]
        WEEK[weekXX.v4.json]
        SCHEMA[schema.v4.json]
        PROMPTS[prompts.v4.json]
        RESCAT[resources.v2.json]
        BOOKCAT[book_modules.v2.json]
    end

    subgraph QA[Validation/QA]
        VAL[bin/validate_content_v4]
        TESTS[node test e integration flows]
    end

    UI --> ORCH
    ORCH --> GUARDS
    ORCH --> STORE
    ORCH --> ROUTER
    ORCH --> WEEK
    WEEK --> SCHEMA
    ORCH --> PROMPTS
    ORCH --> RESCAT
    ORCH --> BOOKCAT
    VAL --> WEEK
    VAL --> SCHEMA
    TESTS --> ORCH
    TESTS --> GUARDS
    TESTS --> UI
```

---

## 3) Componentes Internos y Responsabilidades

```mermaid
flowchart LR
    subgraph Core[Core Runtime]
        BOOT[bootstrap_v4]
        ORCH[orchestrator.js]
        GUARD[hard_guards.js]
        ADAPT[adaptation_engine_v4]
        COMP[competency_engine]
    end

    subgraph UI[UI Layer]
        WIZ[session_wizard.js]
        STEP[step_renderer]
        TIMER[timer_controller]
        EVD[evidence_panel]
        PROG[progress_header]
    end

    subgraph Data[Data/Content]
        DAY[day_model_v4]
        PROMPT[prompt_bundle_resolver]
        NAV[resource_navigator]
        STORE[state_store_v4]
    end

    BOOT --> DAY
    BOOT --> ORCH
    ORCH --> GUARD
    ORCH --> ADAPT
    ORCH --> COMP
    ORCH --> STORE
    ORCH --> WIZ
    WIZ --> STEP
    WIZ --> TIMER
    WIZ --> EVD
    WIZ --> PROG
    DAY --> PROMPT
    DAY --> NAV
    NAV --> WIZ
```

---

## 4) Flujo de Ejecucion de una Sesion (2h / 5h)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Session Wizard
    participant O as Orchestrator
    participant G as Hard Guards
    participant S as Store
    participant C as Content V4

    U->>UI: COMENZAR SESION
    UI->>O: startSession(day_id)
    O->>C: load(session_script + prompts + resources)
    O->>S: persist(session_started_at, current_step)
    O->>UI: render(step_1 active)

    loop Por cada paso
        U->>UI: Ejecuta tarea + entrega evidencia/log
        UI->>O: submitStepInput(step_id, payload)
        O->>G: checkGate(step.gate, payload, context)
        alt Gate OK
            G-->>O: true
            O->>S: mark step done + unlock next
            O->>UI: render(next_step)
        else Gate FAIL
            G-->>O: false
            O->>O: apply retry_policy / fallback_step
            O->>S: mark failed/recovered
            O->>UI: render(recovery_step)
        end
    end

    O->>G: checkDayGate(all required artifacts + metrics)
    G-->>O: pass/fail
    O->>S: persist(session_completed_at, status)
    O->>UI: Mostrar cierre y foco de manana
```

---

## 5) Maquina de Estados del Paso

```mermaid
stateDiagram-v2
    [*] --> locked
    locked --> active: unlock_by_previous_step_done
    active --> done: gate_validated
    active --> failed: gate_failed
    failed --> recovered: retry_or_fallback
    recovered --> done: gate_validated
    recovered --> failed: gate_failed_again

    done --> [*]
```

---

## 6) Maquina de Estados de la Sesion

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> running: start_session
    running --> blocked: critical_gate_failed
    blocked --> running: recovery_completed
    running --> review: all_steps_done
    review --> completed: day_gate_pass
    review --> blocked: day_gate_fail
    completed --> [*]
```

---

## 7) Modelo de Datos V4 (Relaciones Clave)

```mermaid
classDiagram
    class DayV4 {
      +day_id
      +content_version
      +goal
      +session_script
      +retention_loop
      +assessment_event
    }

    class Step {
      +step_id
      +type
      +title
      +difficulty_level
      +duration_min
      +instructions
      +success_criteria
      +evidence_required
      +gate
      +retry_policy
      +fallback_step_id
      +resource_locator
      +prompt_ref
      +prompt_version
    }

    class Gate {
      +type
      +value
      +min_value
    }

    class ResourceLocator {
      +book
      +unit
      +chapter
      +page
      +exercise
      +url
      +fallback_url
      +offline_ref
    }

    class SessionState {
      +iso_date
      +day_id
      +current_step_id
      +step_status
      +gate_status
      +retries_by_step
      +artifacts_by_step
      +session_started_at
      +session_completed_at
    }

    DayV4 "1" *-- "*" Step
    Step "1" *-- "1" Gate
    Step "0..1" *-- "1" ResourceLocator
    DayV4 "1" --> "1" SessionState
```

---

## 8) Flujo de Hard Gates (Decision Tree)

```mermaid
flowchart TD
    A[submitStepInput] --> B{Gate type}
    B -->|timer_complete| C[Validar minutos cumplidos]
    B -->|artifact_uploaded| D[Validar artifact path y formato]
    B -->|min_turns| E[Validar numero de turnos]
    B -->|evidence_log_min_words| F[Validar longitud minima log]
    B -->|self_score| G[Validar score mayor o igual al minimo]
    B -->|metrics_threshold| H[Validar metrica numerica]

    C --> I{Pass?}
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I

    I -->|Si| J[mark step done]
    I -->|No| K[apply retry_policy]
    K --> L{retries excedidos?}
    L -->|No| M[reintentar mismo step]
    L -->|Si| N[activar fallback_step]
```

---

## 9) Pipeline de Validacion de Contenido V4

```mermaid
flowchart LR
    SRC[weekXX.v4.json] --> VAL1[Schema Validation]
    VAL1 --> VAL2[Rules Validation<br/>step_id, gates, fallback, minutes]
    VAL2 --> VAL3[Resource Validation<br/>resource_locator + prompts]
    VAL3 --> VAL4[Pedagogical Rules<br/>retention + assessment checkpoints]
    VAL4 --> OUT{Resultado}
    OUT -->|OK| PASS[Merge/Deploy]
    OUT -->|FAIL| FAIL[Fix Content]
```

---

## 10) Plan de Migracion V3 -> V4 (Arquitectura de Transicion)

```mermaid
flowchart TB
    A[V3 Runtime activo] --> B[Feature Flag content_version]
    B -->|v3| C[Flujo legacy dashboard]
    B -->|v4| D[Flujo wizard/orchestrator]
    D --> E[Migrar W01]
    E --> F[Migrar W02-W05]
    F --> G[Migrar W06-W20 por lotes]
    G --> H[Deprecar flujo v3]
```

---

## 11) Vista de Modulo Diario (Design Blueprint)

```mermaid
flowchart TD
    X[START SESSION] --> S1[Step 1 Input Comprensible]
    S1 --> S2[Step 2 Textbook Drill<br/>Book/Unit/Page exactos]
    S2 --> S3[Step 3 AI Roleplay<br/>Sesame o ChatGPT Voice]
    S3 --> S4[Step 4 Repair/Accuracy]
    S4 --> S5[Step 5 Writing Transfer]
    S5 --> S6[Step 6 Pronunciation Focus]
    S6 --> S7[Step 7 Evidence + Metrics + Plan]
    S7 --> DAYEND[DAY GATE]
```

---

## 12) Reglas de Diseno UX (Resumen)

1. Una accion dominante por pantalla.
2. Boton "Siguiente" siempre bloqueado hasta gate valido.
3. Instrucciones en modo imperativo, sin ambiguedad.
4. Siempre mostrar:
- Que hacer ahora
- Como hacerlo
- Cuanto tiempo
- Como se valida

---

## 13) Leyenda de Tipos de Step (V4)

```mermaid
flowchart LR
    A[input_video] --> B[comprension]
    C[textbook_drill] --> D[precision guiada]
    E[ai_roleplay] --> F[fluidez + interaccion]
    G[repair_drill] --> H[negociacion de significado]
    I[writing_transfer] --> J[consolidacion]
    K[pronunciation_lab] --> L[inteligibilidad]
```

---

## 14) Resultado Esperado de Arquitectura

1. El usuario nunca queda perdido.
2. El sistema fuerza evidencia real antes de avanzar.
3. La progresion curricular deja de ser una lista y pasa a ser una ejecucion guiada.
4. El control de calidad del contenido queda automatizado en validadores.

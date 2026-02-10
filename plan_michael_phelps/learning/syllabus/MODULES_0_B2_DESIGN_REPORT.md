# Modules 0 to B2 - Design Report

Objective: define a production-grade roadmap from absolute beginner profile to conversational B2 using a hybrid model: comprehensible input, TBLT, structured output, and conversational AI.

## Why this architecture
- Input-first lowers cognitive overload in early stages.
- Task-based cycles convert passive knowledge into communicative behavior.
- AI voice practice provides high-frequency rehearsal without social pressure.
- Human-style scaffolding remains necessary for transfer, pragmatics, and motivation.

## Stage model
1. M00 (W01-W02): A0->A1 startup with low-anxiety speaking loops.
2. M01 (W03-W05): A1->A2 operational communication and functional tasks.
3. M02 (W06-W10): B1 interaction engine with negotiation of meaning.
4. M03 (W11-W15): B1+ precision engine with controlled correction.
5. M04 (W16-W18): B2 complexity, argumentation, and discourse control.
6. M05 (W19-W20): B2 performance and final certification gate.

## Method controls embedded in every module
- i+1 input progression.
- Weekly task cycles (4 to 8 by level).
- Voice AI practice minutes scaled by level.
- Anxiety protocol to protect speaking output.
- Checkpoints and KPI thresholds for adaptation.

## KPI trajectory (expected)
- Speaking minutes/week: 180 -> 500.
- AI voice minutes/week: 90 -> 260.
- Task cycles/week: 4 -> 8.
- Quality controls: repair success, error density, output consistency.

## Integration in app
- Source of truth: `learning/syllabus/modules_0_b2.v1.json`.
- Rendered in `Módulos` view with state awareness (completed/active/upcoming).
- Week-level linkage is resolved using existing `weekSummaries` and active week.

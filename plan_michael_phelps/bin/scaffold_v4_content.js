/**
 * scaffold_v4_content.js
 * 
 * Automates the creation of V4 content files for Weeks 6-20.
 * Ensures strict schema compliance (Gates, Time Budget, IDs).
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../learning/content');

const CURRICULUM_MAP = {
    6: { title: "Week 06 - Past Habits & Used To", theory: "Used to / Would" },
    7: { title: "Week 07 - Comparatives & Superlatives", theory: "Adjective degrees" },
    8: { title: "Week 08 - Present Perfect Intro", theory: "Have + Participle" },
    9: { title: "Week 09 - Present Perfect vs Past", theory: "Time markers" },
    10: { title: "Week 10 - Checkpoint A2/B1", theory: "Assessment", is_checkpoint: true },
    11: { title: "Week 11 - Future Forms Review", theory: "Will / Going to / Present Cont" },
    12: { title: "Week 12 - Modals of Obligation", theory: "Must / Have to / Should" },
    13: { title: "Week 13 - First Conditional", theory: "If + Present + Will" },
    14: { title: "Week 14 - Second Conditional", theory: "If + Past + Would" },
    15: { title: "Week 15 - Checkpoint B1", theory: "Assessment", is_checkpoint: true },
    16: { title: "Week 16 - Passive Voice", theory: "Be + Participle" },
    17: { title: "Week 17 - Reported Speech", theory: "Backshifting" },
    18: { title: "Week 18 - Relative Clauses", theory: "Who / Which / That" },
    19: { title: "Week 19 - Third Conditional", theory: "Regrets" },
    20: { title: "Week 20 - Final Certification B2", theory: "Final Exam", is_checkpoint: true }
};

function generateDay(weekNum, dayIndex, theme) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayLabel = days[dayIndex];
    const dayId = `W${String(weekNum).padStart(2, '0')}_D${String(dayIndex + 1).padStart(2, '0')}`;
    const duration = dayLabel === 'Sun' ? 300 : 120;

    // Checkpoint Sunday
    if (theme.is_checkpoint && dayLabel === 'Sun') {
        return {
            day_id: dayId,
            goal: `Checkpoint Assessment: ${theme.title}`,
            assessment_event: true,
            retention_loop: [],
            session_script: [{
                step_id: `${dayId}_S01`,
                type: "quiz",
                title: `${theme.title} Exam`,
                difficulty_level: "B1",
                duration_min: 300,
                content: { instructions: "Complete full length assessment.", url: "https://example.com/exam" },
                gate: { type: "timer_complete", value: 300 },
                success_criteria: "Pass limit",
                evidence_required: "timer"
            }]
        };
    }

    // Standard Day Structure (MVP Placeholder but Schema Valid)
    return {
        day_id: dayId,
        goal: `Master ${theme.theory}`,
        assessment_event: false,
        retention_loop: [],
        session_script: [
            {
                step_id: `${dayId}_S01`,
                type: "input_video",
                title: "Concept Input",
                difficulty_level: "B1",
                duration_min: 20,
                content: { instructions: `Watch video about ${theme.theory}`, url: "https://youtube.com/..." },
                gate: { type: "timer_complete", value: 20 },
                success_criteria: "Notes taken",
                evidence_required: "timer"
            },
            {
                step_id: `${dayId}_S02`,
                type: "textbook_drill",
                title: "Core Practice",
                difficulty_level: "B1",
                duration_min: 60,
                content: { instructions: "Complete Exercises in Unit.", resource_locator: { book: "EF_Inter", unit: weekNum } },
                gate: { type: "compound", rules: [{ type: "timer_complete", value: 60 }, { type: "self_score", min_value: 80 }] },
                success_criteria: "Complete",
                evidence_required: "score"
            },
            {
                step_id: `${dayId}_S03`,
                type: "ai_roleplay",
                title: "Activation",
                difficulty_level: "B1",
                duration_min: 40,
                content: { instructions: `Discuss ${theme.theory} with Coach.`, prompt_ref: `W${weekNum}_ROLEPLAY` },
                gate: { type: "min_turns", value: 10 },
                success_criteria: "Fluency focus",
                evidence_required: "turn_count"
            }
        ]
    };
}

function generateWeek(weekNum) {
    const theme = CURRICULUM_MAP[weekNum];
    const daysObj = {};

    for (let i = 0; i < 7; i++) {
        const d = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
        daysObj[d] = generateDay(weekNum, i, theme);
    }

    return {
        version: "v4",
        week: parseInt(weekNum),
        title: theme.title,
        week_profile: {
            phase: weekNum > 10 ? "Consolidation" : "Foundation",
            cefr_target: weekNum > 15 ? "B2" : "B1",
            focus_theme: theme.theory
        },
        days: daysObj
    };
}

// Execute
for (let w = 6; w <= 20; w++) {
    const data = generateWeek(w);
    const filename = path.join(OUTPUT_DIR, `week${String(w).padStart(2, '0')}.v4.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Generated ${filename}`);
}

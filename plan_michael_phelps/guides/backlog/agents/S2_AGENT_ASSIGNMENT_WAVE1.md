# Sprint 2 Wave 1 - Agent Assignment

Date: 2026-02-10
Source: `guides/SPRINT_BACKLOG_0_B2_V1.md` phase `S2 pedagogical quality pass` and `S3 frontend integration debt burn-down`.

Objective: reduce high-impact P1/P2 findings in parallel without file overlap.

| Lane | Agent | Scope | File Ownership | Priority | Status |
|---|---|---|---|---|---|
| `S2-W1-01` | `Agent-S2-01` | Content quality pass W01-W05 (`placeholder-content`, CEFR W04/W05, retention metadata, day differentiation) | `learning/content/week01.v4.json`, `learning/content/week03.v4.json`, `learning/content/week04.v4.json`, `learning/content/week05.v4.json` | High | `DONE` |
| `S2-W1-02` | `Agent-S2-02` | Content quality pass W06-W12 | `learning/content/week06.v4.json`, `learning/content/week07.v4.json`, `learning/content/week08.v4.json`, `learning/content/week09.v4.json`, `learning/content/week10.v4.json`, `learning/content/week11.v4.json`, `learning/content/week12.v4.json` | High | `DONE` |
| `S2-W1-03` | `Agent-S2-03` | Content quality pass W13-W20 | `learning/content/week13.v4.json`, `learning/content/week14.v4.json`, `learning/content/week15.v4.json`, `learning/content/week16.v4.json`, `learning/content/week17.v4.json`, `learning/content/week18.v4.json`, `learning/content/week19.v4.json`, `learning/content/week20.v4.json` | High | `DONE` |
| `S2-W1-04` | `Agent-S2-04` | Shell data wiring cleanup (`mock-data`/utility tokens/mobile overlap) | `app/web/js/ui/learning_shell.js` | High | `DONE` |
| `S2-W1-05` | `Agent-S2-05` | Responsive contract cleanup (`stale-responsive-css`) | `app/web/css/responsive.css` | High | `DONE` |
| `S2-W1-06` | `Agent-S2-06` | Header scroll runtime parity (`header-scroll`) | `app/web/js/core/bootstrap_v4.js` | Medium | `DONE` |
| `S2-W1-07` | `Agent-S2-07` | Remove secondary CSS entrypoint (`css-entrypoint`) | `app/web/styles.css` | Medium | `DONE` |

Integration order:
1. Merge `S2-W1-04..S2-W1-07` frontend lanes.
2. Merge `S2-W1-01..S2-W1-03` content lanes.
3. Re-run canonical audit and test suite.

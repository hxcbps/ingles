# Jira and Linear Import Bundle - Sprint 0

Files:
- BACKLOG_MASTER_S0.csv: canonical source with epics, stories, subtasks, dependencies.
- jira_import_s0.csv: Jira CSV import file.
- linear_import_s0.csv: Linear CSV import file.
- dependencies_s0.csv: dependency edges for post-import linking.

## Jira import steps
1. Jira Settings -> System -> External System Import -> CSV.
2. Upload `jira_import_s0.csv`.
3. Map fields:
   - Issue Id -> External ID (or custom text field).
   - Issue Type -> Issue Type.
   - Summary -> Summary.
   - Description -> Description.
   - Priority -> Priority.
   - Labels -> Labels.
   - Epic Name -> Epic Name.
   - Epic Link -> Epic Link (or Parent for hierarchy if using parent model).
   - Parent Id -> Parent (for Sub-task).
   - Story Points -> Story Points.
   - Sprint -> Sprint.
   - Components -> Components.
4. Import dependencies after issue creation using `dependencies_s0.csv` via automation/API.

## Linear import steps
1. Linear -> Settings -> Import/Export -> CSV Import.
2. Upload `linear_import_s0.csv`.
3. Map fields:
   - id -> External ID
   - title -> Title
   - description -> Description
   - priority -> Priority
   - estimate -> Estimate
   - state -> State
   - labels -> Labels
   - project -> Project
   - cycle -> Cycle
   - assignee -> Assignee (or placeholder field)
   - parent_id -> Parent
4. Link dependencies after import using `dependencies_s0.csv`.

## Notes
- Assignee values are role placeholders; map to real users during import.
- Keep `external_id` immutable to preserve traceability across systems.
- Use `BACKLOG_MASTER_S0.csv` as source of truth for future re-exports.

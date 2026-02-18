# Personalized Checklist App

A lightweight single-page checklist app with profile-based planning, sub-profiles/projects, and nested tasks.

## Features included

- Nested tasks and subtasks (expand/collapse)
- Clear visual hierarchy for subtasks
- Header controls for profiles/settings windows, hide-completed toggle, search, and sorting
- Due dates for newly created tasks and existing tasks
- Multiple profiles and sub-profiles (e.g. Work → Project Alpha) managed in a dedicated Profiles window
- Recurring tasks (daily, weekly, monthly)
- Per-occurrence controls for recurring tasks: hide once or cancel once
- Task notes/questions with automatic bullet-list entry for decisions, context, and blockers
- Manual task archiving and archived-task restore/delete actions
- Archived tasks tab separated from active tasks
- Automatic archiving for completed parent tasks after a configurable number of days
- Separate controls to expand/collapse nested tasks and show/hide all details panels
- Visual settings customization (theme, compact mode, accent color, border radius)
- Search (includes title + notes) and sorting options
- Progress summary per profile

## Run locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.
## Deployment refresh

If you need to force a fresh GitHub Pages deployment, make a small commit (like this README update), push to your Pages branch, and wait 1–3 minutes for the site to rebuild.


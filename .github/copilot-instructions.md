# IELTS Listening & Speaking Studio Instructions

This workspace uses an offline, teacher-led Gemini workflow. Never add browser-side API key entry, network model requests, or automatic paid-model calls.

Whenever a user pastes or attaches teacher-prepared Gemini IELTS listening/speaking analysis, notes, transcript, Markdown outline, vocabulary table, or JSON, automatically treat it as a request to add/import/convert it unless they explicitly ask only for discussion or analysis. Follow the conversion and verification rules in the repository-root `SKILL.md`. Treat that file as the project data contract for chat-to-file conversions.

- Listening data belongs in `src/data/tests/<id>.json` and must follow the listening schema in `PRD.md`.
- Speaking lessons belong in `src/data/speaking/<id>.json` and must follow the speaking schema in `PRD.md`.
- Preserve evidence; do not invent transcript wording, timestamps, answers, or audio-backed claims. Mark missing required facts for teacher confirmation.
- Reuse the `import.meta.glob` registries in `src/data/index.js`; ensure global topic vocabulary aggregates both data types.
- Validate JSON and run `npm run build` after data conversion. Keep unrelated local changes and student `localStorage` data intact.
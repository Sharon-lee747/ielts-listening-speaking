---
name: ielts-listening-speaking-data-converter
description: Use whenever the user shares teacher-prepared Gemini IELTS listening or speaking analysis in chat as JSON, Markdown, notes, transcript, questions, vocabulary, or outline. By default convert and register it in this project unless the user explicitly asks only for discussion or analysis.
---

# IELTS 教研数据转换 Skill

Whenever a user pastes or attaches teacher-prepared Gemini listening/speaking research, automatically treat it as a request to convert and register the lesson unless they explicitly ask only for discussion or analysis. Treat it as source material for this repository's data files, not as a request to call a model. Read the current `PRD.md` and inspect nearby examples before writing. Never request, persist, or use a web API key, and never make a network model call.

## Identify the data type

- Listening: transcript, listening questions, audio references, key sentences, or a listening mind map. Write one complete JSON file to `src/data/tests/<unique-id>.json` following section 2 of `PRD.md`.
- Speaking: IELTS Part 1/2/3 prompts, cue-card points, a sample answer, an English outline, or speaking vocabulary. Write one complete JSON file to `src/data/speaking/<unique-id>.json` following section 3 of `PRD.md`.
- If the user gives both types, create both files independently in their respective directories.

## Convert faithfully

- Accept valid JSON, Markdown, tables, bullet outlines, and natural-language research notes. Preserve source facts, wording, timestamps, question intent, and teacher-provided explanations wherever possible.
- Do not invent transcript evidence, correct answers, timestamps, translations, speaker identity, or claims of audio verification. If a required fact is absent, infer only what is unambiguous from the supplied material; otherwise use a clearly marked `TODO: teacher confirmation required` value and report it.
- Assign a unique, stable, lowercase hyphenated `id`. Keep nested IDs unique within their parent collection. Set every vocabulary item's `sourceTestId` to the owning listening or speaking ID.
- Classify every vocabulary item under an existing topic category when supported. Reuse the project's established Chinese categories; add a concise category only when no existing one fits.

## Listening JSON checks

- Preserve the PRD shape: `id`, `title`, `topicCategory`, `audioUrl`, `transcript`, `questions`, `keySentences`, `vocabulary`, and `mindMap`.
- Use only `fill_blank`, `single_choice`, `multiple_choice`, or `matching`. Fill-blank `correctAnswer` is an array; single-choice is one option label; multiple-choice is an array of labels; matching answers belong on each item.
- Every question needs a supported answer, explanation, and `audioRef` with exact source sentence and valid start/end seconds. Every matching item needs its own answer, explanation, sentence, and timestamps.
- Include 5-6 key sentences with English, Chinese, timestamps, and exam points. Include English mind-map labels and vocabulary objects with term, POS, Chinese meaning, topic category, example sentence, and source ID.

## Speaking JSON checks

- Preserve the PRD shape: `id`, `title`, `part`, `topicCategory`, `questionPrompt` (for Part 2/3), `questions` (with `perspective` for Part 1), `cueCardPoints`, `audioUrl`, `sampleAnswer`, `vocabulary`, and `mindMap`.
- Keep the sample answer natural spoken English and aligned to its Part. Keep every mind-map label English. Provide vocabulary entries with `id`, `term`, `pos`, `chinese`, `topicCategory`, `exampleSentence`, and `sourceTestId`.

## Register and verify

- Check `src/data/index.js` before editing it. The current project uses `import.meta.glob` to auto-register `src/data/tests/*.json` and `src/data/speaking/*.json`; adding a valid JSON file in either directory should be sufficient. Do not add duplicate hand-written imports.
- Ensure the global vocabulary aggregation includes vocabulary from both listening and speaking libraries. Preserve local imports and existing student data.
- Validate JSON syntax and required fields, then run `npm run build`. If the material is ambiguous or validation fails, fix the source file before reporting completion.
- After conversion, briefly list created/updated paths, the inferred topic category and related listening ID, any teacher-confirmation TODOs, and validation results. Do not only print JSON in chat when the user asked for it to be added to the project.
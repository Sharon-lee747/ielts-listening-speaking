export const listeningParts = ['Part 1', 'Part 2', 'Part 3', 'Part 4']

export function getListeningPart(test) {
  const rawPart = String(test?.part ?? '').trim()
  const value = (/^[1-4]$/.test(rawPart) ? rawPart : null)
    ?? rawPart.match(/(?:part|section)\s*([1-4])/i)?.[1]
    ?? String(test?.title ?? '').match(/(?:part|section)\s*([1-4])/i)?.[1]
  return `Part ${value ?? 1}`
}

export function cleanListeningTitle(title = '') {
  return String(title)
    .replace(/^\s*IELTS\s+Listening\s+(?:Part\s*[1-4]\s*:\s*)?/i, '')
    .replace(/^\s*Cambridge\s+\d+\s+Test\s+\d+\s+Section\s+[1-4]\s*:\s*/i, '')
    .replace(/^\s*(?:Part|Section)\s*[1-4]\s*:\s*/i, '')
    .trim()
}

export function getSpeakingTitle(lesson) {
  if (lesson?.title?.trim()) return lesson.title.trim()
  const stableIdTitle = String(lesson?.id ?? '').replace(/^spk-(?:cam\d+-|part[1-3]-)/i, '').replace(/[-_]+/g, ' ').trim()
  if (stableIdTitle && stableIdTitle !== lesson?.id) return stableIdTitle.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
  return String(lesson?.questionPrompt ?? '')
    .split(/\r?\n/)[0]
    .replace(/^\s*Part\s*[1-3]\s*:\s*/i, '')
    .trim() || lesson?.topicCategory || 'Untitled speaking topic'
}

export function sortByEnglishTitle(items, getTitle) {
  return [...items].sort((left, right) => getTitle(left).localeCompare(getTitle(right), 'en', { sensitivity: 'base' }))
}

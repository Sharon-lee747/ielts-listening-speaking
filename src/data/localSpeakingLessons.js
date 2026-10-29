const speakingLessonsKey = 'ielts-local-speaking-lessons'

export function loadLocalSpeakingLessons() {
  try {
    const value = JSON.parse(localStorage.getItem(speakingLessonsKey) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter(
      (item) =>
        item &&
        Boolean(item.title?.trim() || item.questionPrompt?.trim()) &&
        Boolean((item.questions && item.questions.length > 0) || item.sampleAnswer?.trim() || (item.vocabulary && item.vocabulary.length > 0))
    )
  } catch {
    return []
  }
}

export function saveLocalSpeakingLessons(lessons) {
  try {
    const valid = Array.isArray(lessons)
      ? lessons.filter(
          (item) =>
            item &&
            Boolean(item.title?.trim() || item.questionPrompt?.trim()) &&
            Boolean((item.questions && item.questions.length > 0) || item.sampleAnswer?.trim() || (item.vocabulary && item.vocabulary.length > 0))
        )
      : []
    localStorage.setItem(speakingLessonsKey, JSON.stringify(valid))
  } catch {
    return false
  }
  return true
}

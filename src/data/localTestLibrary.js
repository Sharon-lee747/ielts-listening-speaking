const localTestsKey = 'ielts-local-test-library'

export function loadLocalTests() {
  try {
    const value = JSON.parse(localStorage.getItem(localTestsKey) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter(
      (item) =>
        item &&
        Boolean(item.title?.trim()) &&
        Boolean((item.questions && item.questions.length > 0) || (item.transcript && item.transcript.length > 0) || (item.vocabulary && item.vocabulary.length > 0))
    )
  } catch {
    return []
  }
}

export function saveLocalTests(tests) {
  try {
    const valid = Array.isArray(tests)
      ? tests.filter(
          (item) =>
            item &&
            Boolean(item.title?.trim()) &&
            Boolean((item.questions && item.questions.length > 0) || (item.transcript && item.transcript.length > 0) || (item.vocabulary && item.vocabulary.length > 0))
        )
      : []
    localStorage.setItem(localTestsKey, JSON.stringify(valid))
  } catch {
    return false
  }
  return true
}

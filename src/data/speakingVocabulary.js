const speakingVocabularyKey = 'ielts-speaking-vocabulary'

export function loadSpeakingVocabulary() {
  try {
    const value = JSON.parse(localStorage.getItem(speakingVocabularyKey) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveSpeakingVocabulary(items) {
  try {
    localStorage.setItem(speakingVocabularyKey, JSON.stringify(items))
  } catch {
    return false
  }
  return true
}
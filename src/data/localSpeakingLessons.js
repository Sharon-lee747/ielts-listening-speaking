const speakingLessonsKey = 'ielts-local-speaking-lessons'

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `speaking-${Date.now().toString(36)}`
}

export function autoUnmergeSets(lessons) {
  if (!Array.isArray(lessons)) return { list: [], changed: false }
  let changed = false
  const unmergedList = []

  lessons.forEach((lesson) => {
    if (!lesson) return
    if (Array.isArray(lesson.sets) && lesson.sets.length > 0) {
      changed = true
      lesson.sets.forEach((set, idx) => {
        const isSet0 = idx === 0
        let title = set.title || (isSet0 ? lesson.title : '')
        if (!title) {
          title = set.label ? set.label.replace(/^part\s*[123& ]+[:：-]?\s*/i, '').trim() : `Lesson Set ${idx + 1}`
        }
        const part = set.part || (isSet0 ? (lesson.part || 'Part 1') : 'Part 2 & 3')
        const baseId = isSet0 ? lesson.id : (set.id && !set.id.startsWith('set-') ? `spk-${set.id}` : `spk-${slug(title)}-${Date.now().toString(36)}`)

        const independent = {
          ...set,
          id: isSet0 ? lesson.id : baseId,
          title,
          part,
          topicCategory: set.topicCategory || lesson.topicCategory || '未分类',
          questionPrompt: set.questionPrompt || (part === 'Part 1' ? title : `${title} Prompt`),
          questions: set.questions || [],
          cueCardPoints: set.cueCardPoints || [],
          audioUrl: set.audioUrl || '',
          sampleAnswer: set.sampleAnswer || '',
          vocabulary: (set.vocabulary || []).map((v) => ({ ...v, sourceTestId: isSet0 ? lesson.id : baseId, topicCategory: set.topicCategory || lesson.topicCategory })),
          mindMap: set.mindMap || { label: title, children: [] },
          images: set.images || (isSet0 ? (lesson.images || []) : []),
        }
        delete independent.sets
        delete independent.label
        unmergedList.push(independent)
      })
      return
    }
    unmergedList.push(lesson)
  })

  return { list: unmergedList, changed }
}

export function loadLocalSpeakingLessons() {
  try {
    const raw = JSON.parse(localStorage.getItem(speakingLessonsKey) ?? '[]')
    if (!Array.isArray(raw)) return []
    const { list, changed } = autoUnmergeSets(raw)
    if (changed) {
      saveLocalSpeakingLessons(list)
    }
    try {
      const deletedIds = JSON.parse(localStorage.getItem('ielts-deleted-speaking-ids') ?? '[]')
      if (Array.isArray(deletedIds) && deletedIds.length > 0) {
        const unmergedIds = new Set(list.map((item) => item.id))
        const cleanedDeleted = deletedIds.filter((id) => !unmergedIds.has(id) && id !== 'spk-cam19-wetland-research')
        if (cleanedDeleted.length !== deletedIds.length) {
          localStorage.setItem('ielts-deleted-speaking-ids', JSON.stringify(cleanedDeleted))
          localStorage.setItem('deletedSpeakingIds', JSON.stringify(cleanedDeleted))
        }
      }
    } catch {}

    return list.filter(
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

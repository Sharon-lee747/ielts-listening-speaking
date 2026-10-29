const testModules = import.meta.glob('./tests/*.json', { eager: true, import: 'default' })
const speakingModules = import.meta.glob('./speaking/*.json', { eager: true, import: 'default' })

export const tests = Object.values(testModules).sort((left, right) => left.id.localeCompare(right.id))
export const speakingLessons = Object.values(speakingModules).sort((left, right) => left.id.localeCompare(right.id))

export function normalizeTopicCategory(value) {
  return String(value ?? '').trim().replace(/^[【\[]+/, '').replace(/[】\]]+$/, '').trim()
}

export function getTopicVocabulary(testList = tests, speakingList = speakingLessons) {
  return [...testList, ...speakingList].flatMap((test) => {
    if (!test.sets?.length) return test.vocabulary ?? []
    return test.sets.flatMap((set) => (set.vocabulary ?? []).map((item) => ({
      ...item,
      sourceTestId: test.id,
      topicCategory: item.topicCategory ?? set.topicCategory ?? test.topicCategory,
    })))
  }).reduce((topics, item) => {
    const topicCategory = normalizeTopicCategory(item.topicCategory) || '未分类'
    topics[topicCategory] ??= []
    topics[topicCategory].push({ ...item, topicCategory })
    return topics
  }, {})
}
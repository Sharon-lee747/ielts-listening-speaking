const labelTypes = new Set(['map_labeling', 'diagram_labeling'])

function nextLabel(index) {
  return String.fromCharCode(65 + (index % 26))
}

function normalizeLabeledItems(question) {
  const sourceItems = question.items ?? question.rows ?? question.labels
  if (!Array.isArray(sourceItems) || !sourceItems.length) return null

  const options = [...(question.options ?? [])]
  const answerToLabel = new Map()
  options.forEach((option) => {
    answerToLabel.set(String(option.label).toLowerCase(), option.label)
    answerToLabel.set(String(option.text).toLowerCase(), option.label)
  })

  const items = sourceItems.map((item, index) => {
    const rawAnswer = item.correctAnswer ?? item.answer ?? item.labelAnswer
    const answerText = Array.isArray(rawAnswer) ? rawAnswer[0] : rawAnswer
    const normalizedAnswer = String(answerText ?? '').trim()
    let answerLabel = answerToLabel.get(normalizedAnswer.toLowerCase())
    if (!answerLabel && normalizedAnswer) {
      answerLabel = nextLabel(options.length)
      options.push({ label: answerLabel, text: normalizedAnswer })
      answerToLabel.set(normalizedAnswer.toLowerCase(), answerLabel)
    }
    return {
      ...item,
      itemId: item.itemId || item.id || `m${index + 1}`,
      itemText: item.itemText || item.label || item.prompt || `Label ${index + 1}`,
      correctAnswer: answerLabel || normalizedAnswer,
      explanation: item.explanation || question.explanation || '请根据原文核对该标注。',
      startTime: item.startTime ?? question.audioRef?.startTime,
      endTime: item.endTime ?? question.audioRef?.endTime,
      sentence: item.sentence || question.audioRef?.sentence || '',
    }
  })

  return { ...question, type: 'matching', options, items }
}

export function normalizeQuestionType(question) {
  if (question.type === 'note_completion' || question.type === 'table_completion') {
    const answer = question.correctAnswer ?? question.answer ?? question.answers
    return {
      ...question,
      type: 'fill_blank',
      correctAnswer: Array.isArray(answer) ? answer.map(String) : answer == null ? [] : [String(answer)],
    }
  }
  if (!labelTypes.has(question.type)) {
    if (question.type === 'fill_blank' && !Array.isArray(question.correctAnswer)) {
      return { ...question, correctAnswer: question.correctAnswer == null ? [] : [String(question.correctAnswer)] }
    }
    if (question.type === 'multiple_choice' && !Array.isArray(question.correctAnswer)) {
      return { ...question, correctAnswer: question.correctAnswer == null ? [] : [question.correctAnswer] }
    }
    return question
  }

  const labeledQuestion = normalizeLabeledItems(question)
  if (labeledQuestion) return labeledQuestion

  const answer = question.correctAnswer ?? question.answer ?? question.answers
  return {
    ...question,
    type: 'fill_blank',
    correctAnswer: Array.isArray(answer) ? answer.map(String) : answer == null ? [] : [String(answer)],
  }
}
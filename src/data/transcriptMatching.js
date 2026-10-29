function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
}

function getTokens(value) {
  return new Set(normalizeText(value).split(' ').filter((token) => token.length > 1))
}

export function parseTranscript(source) {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const parsed = lines.map((line, index) => {
    const timestamp = line.match(/^\s*\[?(\d{1,2}):(\d{2})(?:[,.](\d+))?\]?\s*(?:[-–—]\s*\[?(\d{1,2}):(\d{2})(?:[,.](\d+))?\]?)?\s*(.*)$/)
    let startTime = null
    let endTime = null
    let text = line
    let hasExplicitEnd = false
    if (timestamp) {
      startTime = Number(timestamp[1]) * 60 + Number(timestamp[2]) + Number(`0.${timestamp[3] ?? 0}`)
      if (timestamp[4]) {
        endTime = Number(timestamp[4]) * 60 + Number(timestamp[5]) + Number(`0.${timestamp[6] ?? 0}`)
        hasExplicitEnd = true
      }
      text = timestamp[7].trim()
    }
    const speakerMatch = text.match(/^([A-Za-z][A-Za-z0-9 _-]{0,24}):\s*(.+)$/)
    const speaker = speakerMatch?.[1] ?? 'Speaker'
    text = speakerMatch?.[2] ?? text
    return { id: `seg-${index + 1}`, startTime, endTime, speaker, text, hasExplicitEnd }
  })

  return parsed.map((segment, index) => {
    if (!Number.isFinite(segment.startTime)) return { ...segment, endTime: null }
    if (segment.hasExplicitEnd) return { ...segment, endTime: Math.max(segment.startTime + 0.25, segment.endTime) }
    const nextSegment = parsed.slice(index + 1).find((candidate) => Number.isFinite(candidate.startTime))
    const endTime = nextSegment && nextSegment.startTime > segment.startTime ? nextSegment.startTime : segment.startTime + 8
    return { ...segment, endTime }
  }).map(({ hasExplicitEnd, ...segment }) => segment)
}

export function matchTranscriptRange(sentence, transcript = []) {
  const normalizedSentence = normalizeText(sentence)
  if (!normalizedSentence || !transcript.length) return null

  const candidates = transcript.filter((segment) => Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime)).map((segment, index) => ({
    startTime: segment.startTime,
    endTime: segment.endTime,
    text: segment.text,
    index,
  }))
  for (let index = 0; index < transcript.length - 1; index += 1) {
    if (!Number.isFinite(transcript[index].startTime) || !Number.isFinite(transcript[index + 1].endTime)) continue
    candidates.push({
      startTime: transcript[index].startTime,
      endTime: transcript[index + 1].endTime,
      text: `${transcript[index].text} ${transcript[index + 1].text}`,
      index,
    })
  }

  const exactMatch = candidates.find((candidate) => {
    const normalizedCandidate = normalizeText(candidate.text)
    return normalizedCandidate.includes(normalizedSentence)
  })
  if (exactMatch) return { startTime: exactMatch.startTime, endTime: exactMatch.endTime }

  const sentenceTokens = getTokens(sentence)
  if (!sentenceTokens.size) return null
  let bestMatch = null
  for (const candidate of candidates) {
    const candidateTokens = getTokens(candidate.text)
    let overlap = 0
    sentenceTokens.forEach((token) => {
      if (candidateTokens.has(token)) overlap += 1
    })
    const score = overlap / sentenceTokens.size
    if (score > (bestMatch?.score ?? 0)) bestMatch = { ...candidate, score }
  }
  return bestMatch && bestMatch.score >= 0.5
    ? { startTime: bestMatch.startTime, endTime: bestMatch.endTime }
    : null
}

export function attachTranscriptReferences(test) {
  const transcript = Array.isArray(test.transcript) ? test.transcript : []
  const questions = (test.questions ?? []).map((question) => {
    const sentence = question.audioRef?.sentence ?? question.sentence
    const existingRange = question.audioRef?.timestampOverride ? {
      startTime: question.audioRef.startTime,
      endTime: question.audioRef.endTime,
      timestampOverride: true,
    } : null
    const matchedRange = existingRange ?? matchTranscriptRange(sentence, transcript)
    const audioRef = sentence
      ? { ...(question.audioRef ?? {}), sentence, ...(matchedRange ?? {}) }
      : question.audioRef
    const items = question.items?.map((item) => {
      const itemSentence = item.sentence ?? item.audioRef?.sentence
      const itemRange = item.timestampOverride ? {
        startTime: item.startTime,
        endTime: item.endTime,
        timestampOverride: true,
      } : matchTranscriptRange(itemSentence, transcript)
      return itemSentence ? { ...item, sentence: itemSentence, ...(itemRange ?? {}) } : item
    })
    return { ...question, ...(audioRef ? { audioRef } : {}), ...(items ? { items } : {}) }
  })
  const keySentences = (test.keySentences ?? []).map((sentence) => {
    const matchedRange = sentence.timestampOverride ? {
      startTime: sentence.startTime,
      endTime: sentence.endTime,
      timestampOverride: true,
    } : matchTranscriptRange(sentence.english, transcript)
    return { ...sentence, ...(matchedRange ?? {}) }
  })
  return { ...test, questions, keySentences }
}

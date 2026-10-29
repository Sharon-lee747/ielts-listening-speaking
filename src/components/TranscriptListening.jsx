import { Headphones } from 'lucide-react'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '--:--'
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function renderHighlightedVocabulary(text, vocabulary = []) {
  if (!text || !vocabulary?.length) return text
  const validTerms = vocabulary
    .filter((v) => v && v.term && v.term.trim().length >= 2)
    .sort((a, b) => b.term.length - a.term.length)
  if (!validTerms.length) return text

  const termMap = new Map()
  validTerms.forEach((v) => {
    termMap.set(v.term.trim().toLowerCase(), v)
  })

  const escaped = validTerms.map((v) => escapeRegExp(v.term.trim()))
  let pattern
  try {
    pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
  } catch {
    return text
  }

  const parts = []
  let lastIndex = 0
  let match
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const matchedWord = match[0]
    const vocabItem = termMap.get(matchedWord.toLowerCase()) || { term: matchedWord, chinese: '' }
    parts.push(
      <span
        className="vocab-inline-highlight"
        key={`${match.index}-${matchedWord}`}
        onClick={(e) => e.stopPropagation()}
      >
        {matchedWord}
        <span className="vocab-inline-tooltip">
          <span className="vocab-tooltip-term">{vocabItem.term}</span>
          {vocabItem.pos && <span className="vocab-tooltip-pos"> {vocabItem.pos}</span>}
          <span className="vocab-tooltip-cn">{vocabItem.chinese}</span>
        </span>
      </span>
    )
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length ? parts : text
}

export default function TranscriptListening({ transcript, currentTime, onPlaySegment, vocabulary = [] }) {
  return <section className="study-panel transcript-listening-panel">
    <div className="study-panel-heading"><div><span className="eyebrow-small">LISTEN & FOLLOW</span><h2>原文泛听</h2></div><span className="panel-count">{String(transcript.length).padStart(2, '0')} TRANSCRIPT SEGMENTS</span></div>
    {transcript.length ? <div className="transcript-list">
      {transcript.map((segment, index) => {
        const hasTimestamp = Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime)
        const active = hasTimestamp && currentTime >= segment.startTime && currentTime < segment.endTime
        return <button type="button" key={segment.id ?? `segment-${index + 1}`} className={`transcript-segment ${active ? 'active' : ''}`} aria-current={active ? 'true' : undefined} disabled={!hasTimestamp} onClick={() => onPlaySegment(segment)}>
          <span className="transcript-segment-time">{formatTime(segment.startTime)}</span>
          <span className="transcript-segment-content">
            <span className="transcript-speaker">{segment.speaker}</span>
            <span className="transcript-text">{renderHighlightedVocabulary(segment.text, vocabulary)}</span>
          </span>
          <Headphones size={15} className="transcript-play-icon" aria-hidden="true" />
        </button>
      })}
    </div> : <p className="transcript-empty">当前套题还没有保存听力原文。请先在教研导入台保存带时间戳的原文。</p>}
  </section>
}

import { useEffect, useMemo, useState } from 'react'
import { Check, Headphones, Puzzle, RotateCcw, Sparkles } from 'lucide-react'

function chunkSentence(text) {
  if (!text) return []
  const rawParts = text.trim().split(/(?<=[,;:\-—])\s+/)
  const refined = []

  rawParts.forEach((part) => {
    const words = part.split(/\s+/)
    if (words.length <= 5) {
      refined.push(part)
    } else {
      const mid = Math.ceil(words.length / 2)
      refined.push(words.slice(0, mid).join(' '))
      refined.push(words.slice(mid).join(' '))
    }
  })

  let finalChunks = refined.filter(Boolean)
  if (finalChunks.length < 3) {
    const allWords = text.trim().split(/\s+/)
    const chunkSize = Math.max(2, Math.ceil(allWords.length / 4))
    finalChunks = []
    for (let i = 0; i < allWords.length; i += chunkSize) {
      finalChunks.push(allWords.slice(i, i + chunkSize).join(' '))
    }
  }

  return finalChunks.map((chunk, index) => ({
    id: `chunk-${index}`,
    originalIndex: index,
    text: chunk,
  }))
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function SentencePuzzle({ sentence, onPlay }) {
  const chunks = useMemo(() => chunkSentence(sentence.english), [sentence.english])
  const [slots, setSlots] = useState(() => Array(chunks.length).fill(null))
  const [pool, setPool] = useState(() => shuffle(chunks))
  const [isCorrect, setIsCorrect] = useState(null)
  const [draggedChunk, setDraggedChunk] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Reset when sentence changes
  useEffect(() => {
    setSlots(Array(chunks.length).fill(null))
    setPool(shuffle(chunks))
    setIsCorrect(null)
    setDraggedChunk(null)
    setDragOverIndex(null)
  }, [chunks])

  // Check validation whenever slots change
  useEffect(() => {
    const allFilled = slots.length > 0 && slots.every((s) => s !== null)
    if (!allFilled) {
      setIsCorrect(null)
      return
    }

    const correct = slots.every((s, idx) => s && s.originalIndex === idx)
    if (correct) {
      setIsCorrect(true)
      // Auto play native audio
      if (onPlay) {
        onPlay(sentence)
      }
    } else {
      setIsCorrect(false)
    }
  }, [slots, sentence, onPlay])

  // Click pool card -> moves to first empty slot
  function handlePoolClick(chunk) {
    const firstEmptyIndex = slots.findIndex((s) => s === null)
    if (firstEmptyIndex === -1) return

    const nextSlots = [...slots]
    nextSlots[firstEmptyIndex] = chunk
    setSlots(nextSlots)
    setPool((prev) => prev.filter((c) => c.id !== chunk.id))
  }

  // Click slot card -> moves back to pool
  function handleSlotClick(slotIndex) {
    const chunk = slots[slotIndex]
    if (!chunk) return

    const nextSlots = [...slots]
    nextSlots[slotIndex] = null
    setSlots(nextSlots)
    setPool((prev) => [...prev, chunk])
  }

  // Reset
  function handleReset() {
    setSlots(Array(chunks.length).fill(null))
    setPool(shuffle(chunks))
    setIsCorrect(null)
  }

  // Drag & drop handlers
  function handleDragStart(e, chunk, fromSlotIndex = null) {
    setDraggedChunk({ chunk, fromSlotIndex })
    e.dataTransfer.setData('text/plain', chunk.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, slotIndex) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(slotIndex)
  }

  function handleDragLeave() {
    setDragOverIndex(null)
  }

  function handleDrop(e, targetSlotIndex) {
    e.preventDefault()
    setDragOverIndex(null)
    if (!draggedChunk) return

    const { chunk, fromSlotIndex } = draggedChunk
    const existingTargetChunk = slots[targetSlotIndex]

    const nextSlots = [...slots]

    if (fromSlotIndex !== null) {
      // Swapping or moving between slots
      nextSlots[fromSlotIndex] = existingTargetChunk
      nextSlots[targetSlotIndex] = chunk
      setSlots(nextSlots)
    } else {
      // Moving from pool to slot
      nextSlots[targetSlotIndex] = chunk
      setSlots(nextSlots)
      setPool((prev) => {
        const withoutDragged = prev.filter((c) => c.id !== chunk.id)
        return existingTargetChunk ? [...withoutDragged, existingTargetChunk] : withoutDragged
      })
    }

    setDraggedChunk(null)
  }

  return (
    <div className={`sentence-puzzle-container ${isCorrect === true ? 'is-correct' : isCorrect === false ? 'has-error' : ''}`}>
      <div className="puzzle-header">
        <div className="puzzle-title-row">
          <Puzzle size={14} className="puzzle-icon" />
          <span className="puzzle-title">磁吸长难句词块拼图 · SENTENCE PUZZLE</span>
          <span className="puzzle-subhint">将下方打散的词块点击或拖入上方槽位，复原考点句逻辑意群</span>
        </div>
        <button type="button" className="puzzle-reset-btn" onClick={handleReset} title="重新打乱">
          <RotateCcw size={13} />
          <span>重置</span>
        </button>
      </div>

      {/* Target Slots Area */}
      <div className="puzzle-slots-grid">
        {slots.map((slotChunk, idx) => {
          const isSlotWrong = isCorrect === false && slotChunk && slotChunk.originalIndex !== idx
          const isSlotCorrect = isCorrect === true && slotChunk
          const isOver = dragOverIndex === idx

          return (
            <div
              key={`slot-${idx}`}
              className={`puzzle-slot ${slotChunk ? 'filled' : 'empty'} ${isOver ? 'drag-over' : ''} ${isSlotWrong ? 'wrong' : ''} ${isSlotCorrect ? 'correct' : ''}`}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => handleSlotClick(idx)}
              title={slotChunk ? '点击取回词块' : '拖入或点击下方词块填入'}
            >
              <span className="puzzle-slot-index">{String(idx + 1).padStart(2, '0')}</span>
              {slotChunk ? (
                <div
                  className="puzzle-chunk-card in-slot"
                  draggable
                  onDragStart={(e) => handleDragStart(e, slotChunk, idx)}
                >
                  <span className="puzzle-chunk-text">{slotChunk.text}</span>
                </div>
              ) : (
                <span className="puzzle-slot-placeholder">放置词块 {idx + 1}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Candidate Pool */}
      <div className="puzzle-pool-wrap">
        <div className="puzzle-pool-label">
          <span>待选词块池 ({pool.length})</span>
          {pool.length > 0 && <small>点击词块直接按顺序填入，或拖拽放置</small>}
        </div>
        <div className="puzzle-pool-grid">
          {pool.map((chunk) => (
            <div
              key={chunk.id}
              className="puzzle-chunk-card in-pool"
              draggable
              onDragStart={(e) => handleDragStart(e, chunk, null)}
              onClick={() => handlePoolClick(chunk)}
              title="点击填入上方槽位"
            >
              <span className="puzzle-chunk-text">{chunk.text}</span>
            </div>
          ))}
          {pool.length === 0 && (
            <div className="puzzle-pool-empty-hint">
              <span>所有词块已填入上方槽位</span>
            </div>
          )}
        </div>
      </div>

      {/* Validation Banner */}
      {isCorrect === true && (
        <div className="puzzle-status-banner correct">
          <Check size={16} />
          <span>✓ 语块拼接完全正确！正在自动回听原句...</span>
          <button type="button" className="puzzle-replay-btn" onClick={() => onPlay(sentence)}>
            <Headphones size={13} />
            <span>回听原句</span>
          </button>
        </div>
      )}

      {isCorrect === false && (
        <div className="puzzle-status-banner incorrect">
          <span>⚠️ 部分语块顺序有误（标红槽位），点击错误词块可取回重新排列</span>
        </div>
      )}
    </div>
  )
}


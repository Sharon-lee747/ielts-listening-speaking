import { useEffect, useMemo, useRef, useState } from 'react'
import { Flame, Gamepad2, RotateCcw, Sparkles, Trophy, X } from 'lucide-react'

// Gentle Web Audio API sound feedback
function playChime(isCorrect) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (isCorrect) {
      // Pleasant high twin chime
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12) // E5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start()
      osc.stop(ctx.currentTime + 0.36)
    } else {
      // Soft low bump
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {
    // Ignore audio context errors if blocked by browser policy
  }
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function VocabGalleryMatchModal({ vocabulary = [], onClose }) {
  const [cards, setCards] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const [matchedKeys, setMatchedKeys] = useState(() => new Set())
  const [shakingIds, setShakingIds] = useState([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isVictory, setIsVictory] = useState(false)
  const timerRef = useRef(null)

  // Initialize a batch of 6~8 pairs
  function startNewGame() {
    const valid = vocabulary.filter((v) => v && v.term && v.chinese)
    const count = Math.min(8, Math.max(4, Math.floor(valid.length / 2) * 2))
    const selectedVocab = shuffle(valid).slice(0, count)

    const newCards = []
    selectedVocab.forEach((item, index) => {
      const pairKey = `pair-${index}-${item.term}`
      newCards.push({
        id: `en-${index}`,
        pairKey,
        text: item.term,
        pos: item.pos || '',
        type: 'en',
      })
      newCards.push({
        id: `cn-${index}`,
        pairKey,
        text: item.chinese,
        type: 'cn',
      })
    })

    setCards(shuffle(newCards))
    setSelectedCard(null)
    setMatchedKeys(new Set())
    setShakingIds([])
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTimeLeft(60)
    setIsGameOver(false)
    setIsVictory(false)
  }

  useEffect(() => {
    startNewGame()
  }, [vocabulary])

  // Countdown timer
  useEffect(() => {
    if (isGameOver || isVictory) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setIsGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [isGameOver, isVictory])

  const totalPairs = cards.length / 2

  function handleCardClick(card) {
    if (isGameOver || isVictory) return
    if (matchedKeys.has(card.pairKey)) return
    if (selectedCard && selectedCard.id === card.id) return
    if (shakingIds.length > 0) return

    if (!selectedCard) {
      setSelectedCard(card)
      return
    }

    // Comparing two cards
    if (selectedCard.pairKey === card.pairKey && selectedCard.type !== card.type) {
      // Correct pair!
      playChime(true)
      const nextMatched = new Set(matchedKeys)
      nextMatched.add(card.pairKey)
      setMatchedKeys(nextMatched)

      const nextCombo = combo + 1
      setCombo(nextCombo)
      if (nextCombo > maxCombo) setMaxCombo(nextCombo)
      setScore((s) => s + 100 + nextCombo * 25)
      setSelectedCard(null)

      if (nextMatched.size >= totalPairs) {
        setIsVictory(true)
        setIsGameOver(true)
      }
    } else {
      // Mismatch
      playChime(false)
      setCombo(0)
      setShakingIds([selectedCard.id, card.id])
      setTimeout(() => {
        setShakingIds([])
        setSelectedCard(null)
      }, 260)
    }
  }

  return (
    <div className="vocab-game-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="vocab-game-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocab-game-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="vocab-game-modal-header">
          <div className="vocab-game-header-info">
            <span className="vocab-game-badge">
              <Gamepad2 size={13} />
              <span>GALLERY VOCAB MATCH</span>
            </span>
            <h3 id="vocab-game-title">1 分钟词汇消消乐</h3>
          </div>

          <div className="vocab-game-stats-bar">
            <div className={`vocab-game-stat-tag timer ${timeLeft <= 10 ? 'is-urgent' : ''}`}>
              <span className="stat-label">TIME</span>
              <strong className="stat-val">{timeLeft}s</strong>
            </div>

            <div className="vocab-game-stat-tag score">
              <span className="stat-label">SCORE</span>
              <strong className="stat-val">{score}</strong>
            </div>

            {combo > 1 && (
              <div className="vocab-game-stat-tag combo">
                <Flame size={13} />
                <span>{combo} COMBO</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="vocab-game-close-btn"
            onClick={onClose}
            aria-label="关闭游戏"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Grid */}
        <div className="vocab-game-card-grid">
          {cards.map((card) => {
            const isMatched = matchedKeys.has(card.pairKey)
            const isSelected = selectedCard?.id === card.id
            const isShaking = shakingIds.includes(card.id)

            return (
              <button
                type="button"
                key={card.id}
                className={`vocab-match-card ${card.type} ${isSelected ? 'is-selected' : ''} ${isMatched ? 'is-matched' : ''} ${isShaking ? 'is-shaking' : ''}`}
                onClick={() => handleCardClick(card)}
                disabled={isMatched}
              >
                <div className="vocab-match-card-inner">
                  <span className="vocab-match-card-type">{card.type === 'en' ? 'EN' : 'CN'}</span>
                  <p className="vocab-match-card-text">{card.text}</p>
                  {card.pos && <span className="vocab-match-card-pos">{card.pos}</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* End Game Overlay */}
        {isGameOver && (
          <div className="vocab-game-result-card">
            <div className="vocab-game-result-inner">
              <div className="vocab-game-result-trophy">
                {isVictory ? <Trophy size={36} color="#C86D51" /> : <Sparkles size={36} color="#3D5245" />}
              </div>
              <h4>{isVictory ? '🎉 太棒了！全部配对成功！' : '⏰ 时间到！挑战完成'}</h4>
              <p className="vocab-game-result-sub">
                本轮完成 {matchedKeys.size} / {totalPairs} 组雅思 7.5 分高频词块
              </p>

              <div className="vocab-game-result-scores">
                <div className="result-pill">
                  <span>最终得分</span>
                  <strong>{score}</strong>
                </div>
                <div className="result-pill">
                  <span>最高连击</span>
                  <strong>x{maxCombo}</strong>
                </div>
              </div>

              <div className="vocab-game-result-actions">
                <button type="button" className="vocab-game-btn secondary" onClick={startNewGame}>
                  <RotateCcw size={15} />
                  <span>再来一局</span>
                </button>
                <button type="button" className="vocab-game-btn primary" onClick={onClose}>
                  <span>返回词库学习</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


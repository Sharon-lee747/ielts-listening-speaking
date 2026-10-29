import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gamepad2,
  Headphones,
  Layers,
  Puzzle,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  Check,
  AlertCircle
} from 'lucide-react'
import SentencePuzzle from './SentencePuzzle.jsx'
import { getSpeakingTitle } from '../data/lessonIndex.js'

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
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12) // E5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start()
      osc.stop(ctx.currentTime + 0.36)
    } else {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {
    // AudioContext blocked
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

export default function ArcadeArena({
  allTests = [],
  allSpeakingLessons = [],
  vocabulary = [],
  onNavigateTab
}) {
  // Top selector: 'all' or 'listening-{testId}' or 'speaking-{lessonId}'
  const [selectedScope, setSelectedScope] = useState('all')
  // Active game mode: 'match' (画廊消消乐) or 'puzzle' (长难句拼图)
  const [arcadeMode, setArcadeMode] = useState('match')

  // Rigorous filtering to eliminate any empty or invalid tests/topics
  const validListeningTests = useMemo(() => {
    return allTests.filter(
      (item) =>
        item &&
        item.title &&
        item.title.trim() !== '' &&
        Boolean(
          (item.questions && item.questions.length > 0) ||
          (item.transcript && item.transcript.length > 0) ||
          (item.vocabulary && item.vocabulary.length > 0)
        )
    )
  }, [allTests])

  const validSpeakingLessons = useMemo(() => {
    return allSpeakingLessons.filter((item) => {
      if (!item) return false
      const title = getSpeakingTitle(item)
      const hasValidTitle = Boolean(title && title.trim() !== '')
      const hasContent = Boolean(
        (item.questions && item.questions.length > 0) ||
        (item.sampleAnswer && item.sampleAnswer.trim() !== '') ||
        (item.vocabulary && item.vocabulary.length > 0)
      )
      return hasValidTitle && hasContent
    })
  }, [allSpeakingLessons])

  // Selected test or speaking lesson
  const currentTest = useMemo(() => {
    if (selectedScope.startsWith('listening-')) {
      const id = selectedScope.replace('listening-', '')
      return validListeningTests.find((t) => t.id === id) || validListeningTests[0]
    }
    return null
  }, [selectedScope, validListeningTests])

  const currentLesson = useMemo(() => {
    if (selectedScope.startsWith('speaking-')) {
      const id = selectedScope.replace('speaking-', '')
      return validSpeakingLessons.find((l) => l.id === id) || validSpeakingLessons[0]
    }
    return null
  }, [selectedScope, validSpeakingLessons])

  // Scope vocabulary
  const scopedVocabulary = useMemo(() => {
    if (currentTest) {
      return currentTest.vocabulary || []
    }
    if (currentLesson) {
      return vocabulary.filter((v) => v.sourceTestId === 'speaking-studio' || v.sourceTestId === currentLesson.id)
    }
    return vocabulary
  }, [currentTest, currentLesson, vocabulary])

  // Available sentences for Mode B (Sentence Puzzle)
  const puzzleSentences = useMemo(() => {
    if (currentTest && currentTest.keySentences?.length) {
      return currentTest.keySentences
    }
    if (currentLesson) {
      const list = []
      if (currentLesson.part1Questions) {
        currentLesson.part1Questions.forEach((q, idx) => {
          if (q.sampleAnswer) {
            list.push({
              id: `spk-p1-${idx}`,
              english: q.sampleAnswer,
              chinese: q.question,
              examPoint: `Part 1 · ${q.perspective || '精选范例句'}`
            })
          }
        })
      }
      if (list.length) return list
    }
    // Fallback: take sentences from valid listening tests
    const allKeySentences = validListeningTests.flatMap((t) => t.keySentences || [])
    return allKeySentences.length ? allKeySentences : [
      {
        id: 'default-1',
        english: 'The university provides comprehensive career counselling to help undergraduates identify competitive employment paths.',
        chinese: '大学提供全方位的职业咨询，帮助本科生明确具有竞争力的就业发展路径。',
        examPoint: '教育学术考点句'
      }
    ]
  }, [currentTest, currentLesson, validListeningTests])

  const [puzzleSentenceIndex, setPuzzleSentenceIndex] = useState(0)
  const currentSentence = puzzleSentences[puzzleSentenceIndex] || puzzleSentences[0]

  // ==================== MODE A: MATCH GAME STATE ====================
  const [matchCards, setMatchCards] = useState([])
  const [selectedMatchCard, setSelectedMatchCard] = useState(null)
  const [matchedKeys, setMatchedKeys] = useState(() => new Set())
  const [shakingCardIds, setShakingCardIds] = useState([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isMatchActive, setIsMatchActive] = useState(true)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isVictory, setIsVictory] = useState(false)
  const timerRef = useRef(null)

  function startNewMatchGame() {
    const valid = scopedVocabulary.filter((v) => v && v.term && v.chinese)
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
        type: 'en'
      })
      newCards.push({
        id: `cn-${index}`,
        pairKey,
        text: item.chinese,
        type: 'cn'
      })
    })

    setMatchCards(shuffle(newCards))
    setSelectedMatchCard(null)
    setMatchedKeys(new Set())
    setShakingCardIds([])
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTimeLeft(60)
    setIsMatchActive(true)
    setIsGameOver(false)
    setIsVictory(false)
  }

  // Restart match game when scope or mode changes
  useEffect(() => {
    if (arcadeMode === 'match') {
      startNewMatchGame()
    }
  }, [scopedVocabulary, arcadeMode])

  // Countdown timer
  useEffect(() => {
    if (arcadeMode !== 'match' || !isMatchActive || isGameOver || isVictory) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setIsGameOver(true)
          setIsMatchActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [arcadeMode, isMatchActive, isGameOver, isVictory])

  // Card click handler
  function handleCardClick(card) {
    if (isGameOver || isVictory || matchedKeys.has(card.pairKey)) return
    if (selectedMatchCard && selectedMatchCard.id === card.id) {
      setSelectedMatchCard(null)
      return
    }

    if (!selectedMatchCard) {
      setSelectedMatchCard(card)
      return
    }

    // Two cards picked: check match
    if (selectedMatchCard.pairKey === card.pairKey && selectedMatchCard.id !== card.id) {
      // Match success!
      playChime(true)
      const nextMatched = new Set(matchedKeys)
      nextMatched.add(card.pairKey)
      setMatchedKeys(nextMatched)

      const nextCombo = combo + 1
      setCombo(nextCombo)
      if (nextCombo > maxCombo) setMaxCombo(nextCombo)
      const points = 100 + nextCombo * 25
      setScore((s) => s + points)
      setSelectedMatchCard(null)

      // Check all matched
      if (nextMatched.size * 2 >= matchCards.length) {
        setIsVictory(true)
        setIsMatchActive(false)
      }
    } else {
      // Mismatch
      playChime(false)
      setCombo(0)
      setShakingCardIds([selectedMatchCard.id, card.id])
      setTimeout(() => {
        setShakingCardIds([])
        setSelectedMatchCard(null)
      }, 350)
    }
  }

  // Audio Play helper for Sentence Puzzle
  function handlePlaySentenceAudio(sentence) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(sentence.english)
    utterance.lang = 'en-GB'
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  // 3D Pocket Companion Resolution
  const companionInfo = useMemo(() => {
    if (isVictory || score >= 800) {
      return {
        tier: 'I',
        rankTitle: '✦ POCKET COMPANION · RANK I',
        name: 'Vaelorn',
        title: '🛡️ 语流誓约骑士 · Oathbound Knight',
        avatar: '/arcade/companion_vaelorn.png',
        badge: 'HONOR VANGUARD',
        quote: '“剑盾与意志同在！神速识破全部意群连携，战绩卓绝！”',
        themeClass: 'tier-knight'
      }
    }
    if (score >= 400 || matchedKeys.size >= 4) {
      return {
        tier: 'II',
        rankTitle: '✦ POCKET COMPANION · RANK II',
        name: 'Orvynn',
        title: '🎵 灵韵吟游学者 · Requiem Bard',
        avatar: '/arcade/companion_orvynn.png',
        badge: 'HARMONY POET',
        quote: '“琴声奏响！你的连击节奏精准美妙，已录入雅思吟游史诗！”',
        themeClass: 'tier-bard'
      }
    }
    return {
      tier: 'III',
      rankTitle: '✦ POCKET QUEST · ROOKIE',
      name: 'Lyriath',
      title: '✨ 见习词语魔法师 · Moonveil Arcanist',
      avatar: '/arcade/companion_lyriath.png',
      badge: 'MIND NOVICE',
      quote: '“热身完毕！下一把必定连击拉满，翻开法典再冲一次！”',
      themeClass: 'tier-mage'
    }
  }, [isVictory, score, matchedKeys.size])

  return (
    <div className="arcade-arena-wrapper">
      {/* Top Scope / Topic Selector Bar */}
      <section className="arcade-header-panel">
        <div className="arcade-scope-row">
          <label className="arcade-scope-label" htmlFor="arcade-scope-select">
            <span className="arcade-select-kicker">CURRENT TOPIC / TEST</span>
            <div className="arcade-select-wrap">
              <select
                id="arcade-scope-select"
                value={selectedScope}
                onChange={(e) => {
                  setSelectedScope(e.target.value)
                  setPuzzleSentenceIndex(0)
                }}
              >
                <option value="all">🌟 全部综合词库与全套真题 (All Tests &amp; Topics)</option>
                <optgroup label="🎧 听力套题 (Listening Tests)">
                  {validListeningTests.map((t) => (
                    <option key={`listening-${t.id}`} value={`listening-${t.id}`}>
                      {t.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🎤 口语话题 (Speaking Lessons)">
                  {validSpeakingLessons.map((l) => (
                    <option key={`speaking-${l.id}`} value={`speaking-${l.id}`}>
                      {getSpeakingTitle(l)}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown size={15} className="arcade-select-icon" />
            </div>
          </label>

          <div className="arcade-meta-stats">
            <span className="arcade-meta-item">
              <Layers size={14} />
              <span>本关收录 <strong>{scopedVocabulary.length}</strong> 词</span>
            </span>
            <span className="arcade-meta-sep">/</span>
            <span className="arcade-meta-item">
              <Puzzle size={14} />
              <span>长难句 <strong>{puzzleSentences.length}</strong> 关</span>
            </span>
          </div>
        </div>

        {/* Gallery Scenic Background Mode Cards */}
        <div className="arcade-mode-cards" role="tablist">
          {/* Mode A: Zen Forest / Morning Mist */}
          <button
            type="button"
            className={`arcade-mode-card mode-card-scenic ${arcadeMode === 'match' ? 'active' : ''}`}
            onClick={() => setArcadeMode('match')}
            role="tab"
            aria-selected={arcadeMode === 'match'}
          >
            <div
              className="mode-card-bg"
              style={{ backgroundImage: `url('/arcade/zen_forest.png')` }}
            />
            <div className="mode-card-overlay" />
            <div className="mode-card-content">
              <div className="mode-card-header">
                <span className="arcade-mode-kicker">MODE A · 60s SPEED CHALLENGE</span>
                {arcadeMode === 'match' && <span className="arcade-mode-active-pill">正在挑战</span>}
              </div>
              <div className="mode-card-title-row">
                <div className="arcade-mode-card-icon">
                  <Flame size={20} />
                </div>
                <h3>雅思 7.5 分词汇【画廊消消乐】</h3>
              </div>
              <p>中英双列意群打散配对，消除连击 Combo 刷新最高分</p>
            </div>
          </button>

          {/* Mode B: Starry Night Library */}
          <button
            type="button"
            className={`arcade-mode-card mode-card-scenic ${arcadeMode === 'puzzle' ? 'active' : ''}`}
            onClick={() => setArcadeMode('puzzle')}
            role="tab"
            aria-selected={arcadeMode === 'puzzle'}
          >
            <div
              className="mode-card-bg"
              style={{ backgroundImage: `url('/arcade/starry_library.jpg')` }}
            />
            <div className="mode-card-overlay" />
            <div className="mode-card-content">
              <div className="mode-card-header">
                <span className="arcade-mode-kicker">MODE B · SYNTAX RECONSTRUCTION</span>
                {arcadeMode === 'puzzle' && <span className="arcade-mode-active-pill">正在挑战</span>}
              </div>
              <div className="mode-card-title-row">
                <div className="arcade-mode-card-icon">
                  <Puzzle size={20} />
                </div>
                <h3>雅思核心长难句【磁吸语块拼句】</h3>
              </div>
              <p>拖拽或点击磁吸虚线槽位，复原听力考点句与口语高分语序</p>
            </div>
          </button>
        </div>
      </section>

      {/* ===================== MODE A VIEW ===================== */}
      {arcadeMode === 'match' && (
        <section className="arcade-stage-card match-mode-stage">
          {/* Stage HUD Top Bar */}
          <div className="arcade-hud-bar">
            <div className="arcade-hud-stat">
              <span className="hud-label">得分 SCORE</span>
              <strong className="hud-val score-val">{score}</strong>
            </div>

            <div className="arcade-hud-stat">
              <span className="hud-label">连击 COMBO</span>
              <strong className={`hud-val combo-val ${combo > 1 ? 'has-combo' : ''}`}>
                <Flame size={15} />
                {combo}x
              </strong>
            </div>

            <div className="arcade-hud-timer-wrap">
              <div className="arcade-timer-track">
                <div
                  className="arcade-timer-bar"
                  style={{
                    width: `${(timeLeft / 60) * 100}%`,
                    backgroundColor: timeLeft <= 15 ? '#C86D51' : '#3D5245'
                  }}
                />
              </div>
              <span className={`arcade-timer-text ${timeLeft <= 15 ? 'urgent' : ''}`}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              className="arcade-action-btn"
              onClick={startNewMatchGame}
              title="重新打乱配对"
            >
              <RotateCcw size={14} />
              <span>重新洗牌</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="arcade-cards-grid">
            {matchCards.map((card) => {
              const isMatched = matchedKeys.has(card.pairKey)
              const isSelected = selectedMatchCard?.id === card.id
              const isShaking = shakingCardIds.includes(card.id)

              return (
                <div
                  key={card.id}
                  className={`arcade-vocab-card ${card.type} ${isSelected ? 'selected' : ''} ${
                    isMatched ? 'matched-dissolve' : ''
                  } ${isShaking ? 'shake-mismatch' : ''}`}
                  onClick={() => handleCardClick(card)}
                  role="button"
                  tabIndex={isMatched ? -1 : 0}
                  aria-label={card.text}
                >
                  <span className="card-type-dot" />
                  <span className="card-main-text">{card.text}</span>
                  {card.pos && <span className="card-pos-tag">{card.pos}</span>}
                </div>
              )
            })}
          </div>

          {/* 3D Pocket Companion Quest Settlement Overlay Modal */}
          {(isVictory || isGameOver) && (
            <div className="arcade-settlement-overlay">
              <div className={`pocket-quest-card-3d ${companionInfo.themeClass}`}>
                {/* Pocket Quest Header */}
                <div className="pocket-card-top">
                  <div className="pocket-card-badge">
                    <Sparkles size={13} className="pocket-sparkle-icon" />
                    <span>{companionInfo.rankTitle}</span>
                  </div>
                  <span className="pocket-card-num">{companionInfo.tier}</span>
                </div>

                {/* Arched Avatar Window with 3D Companion */}
                <div className="pocket-avatar-stage">
                  <div className="pocket-avatar-arch">
                    <img
                      src={companionInfo.avatar}
                      alt={companionInfo.name}
                      className="pocket-companion-img"
                    />
                  </div>
                  <span className="pocket-hero-badge">{companionInfo.badge}</span>
                </div>

                {/* Companion Identity & Honor Title */}
                <div className="pocket-hero-identity">
                  <h2 className="pocket-hero-name">{companionInfo.name}</h2>
                  <div className="pocket-hero-title">{companionInfo.title}</div>
                  <p className="pocket-hero-quote">{companionInfo.quote}</p>
                </div>

                {/* Four Metrics Strip */}
                <div className="pocket-stats-strip">
                  <div className="pocket-stat-box">
                    <span className="stat-label">TIME 耗时</span>
                    <strong className="stat-value">{60 - timeLeft}s</strong>
                  </div>
                  <div className="pocket-stat-box">
                    <span className="stat-label">PAIRS 配对</span>
                    <strong className="stat-value">{matchedKeys.size}/{matchCards.length / 2}</strong>
                  </div>
                  <div className="pocket-stat-box">
                    <span className="stat-label">MAX COMBO</span>
                    <strong className="stat-value">×{maxCombo}</strong>
                  </div>
                  <div className="pocket-stat-box highlight">
                    <span className="stat-label">SCORE 得分</span>
                    <strong className="stat-value">{score}</strong>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pocket-actions-row">
                  <button
                    type="button"
                    className="pocket-action-btn primary"
                    onClick={startNewMatchGame}
                  >
                    <RotateCcw size={16} />
                    <span>🔄 再来一局 (Rematch)</span>
                  </button>
                  <button
                    type="button"
                    className="pocket-action-btn secondary"
                    onClick={() => {
                      if (onNavigateTab) {
                        onNavigateTab('vocabulary')
                      } else {
                        startNewMatchGame()
                      }
                    }}
                  >
                    <BookOpen size={16} />
                    <span>📚 回去背词 (Review Words)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================== MODE B VIEW ===================== */}
      {arcadeMode === 'puzzle' && (
        <section className="arcade-stage-card puzzle-mode-stage">
          {/* Level Switcher Header */}
          <div className="puzzle-stage-header">
            <div className="puzzle-level-info">
              <span className="puzzle-stage-eyebrow">LEVEL {String(puzzleSentenceIndex + 1).padStart(2, '0')} / {String(puzzleSentences.length).padStart(2, '0')}</span>
              <h2>考点长难句意群磁吸复原</h2>
            </div>

            <div className="puzzle-level-nav">
              <button
                type="button"
                className="puzzle-nav-btn"
                disabled={puzzleSentenceIndex <= 0}
                onClick={() => setPuzzleSentenceIndex((i) => Math.max(0, i - 1))}
                title="上一句"
              >
                <ChevronLeft size={16} />
                <span>上一句</span>
              </button>
              <span className="puzzle-level-counter">
                {puzzleSentenceIndex + 1} / {puzzleSentences.length}
              </span>
              <button
                type="button"
                className="puzzle-nav-btn"
                disabled={puzzleSentenceIndex >= puzzleSentences.length - 1}
                onClick={() => setPuzzleSentenceIndex((i) => Math.min(puzzleSentences.length - 1, i + 1))}
                title="下一句"
              >
                <span>下一句</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Sentence Meaning Card */}
          <div className="puzzle-meaning-card">
            <div className="puzzle-meaning-badge">
              <Sparkles size={13} />
              <span>考点句中文句意解析</span>
            </div>
            <p className="puzzle-meaning-text">{currentSentence.chinese}</p>
            {currentSentence.examPoint && (
              <small className="puzzle-exam-point">核心考点：{currentSentence.examPoint}</small>
            )}
          </div>

          {/* The Sentence Puzzle Component */}
          <SentencePuzzle
            key={currentSentence.id || puzzleSentenceIndex}
            sentence={currentSentence}
            onPlay={handlePlaySentenceAudio}
          />

          {/* Audio helper tool row */}
          <div className="puzzle-audio-footer">
            <button
              type="button"
              className="puzzle-listen-full-btn"
              onClick={() => handlePlaySentenceAudio(currentSentence)}
            >
              <Volume2 size={16} />
              <span>播放整句地道发音 (UK Accent)</span>
            </button>
            <span className="puzzle-help-text">
              💡 提示：磁吸槽位支持鼠标拖放或直接点击词块快速填入，拼好后自动播放判分。
            </span>
          </div>
        </section>
      )}
    </div>
  )
}

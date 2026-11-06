import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  Flame,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  Zap
} from 'lucide-react'
import { COMPANION_AVATARS, COMPANION_DATA_URIS } from '../assets/arcade/companionAvatars.js'

// ─── Audio helpers ───────────────────────────────────────────────────────────
function playBlitzChime(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (type === 'hit') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(); osc.stop(ctx.currentTime + 0.36)
    } else if (type === 'timeout') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
      osc.start(); osc.stop(ctx.currentTime + 0.3)
    } else if (type === 'combo') {
      // Multi-note combo sparkle
      const freqs = [523.25, 659.25, 783.99, 1046.5]
      freqs.forEach((f, i) => {
        const o2 = ctx.createOscillator()
        const g2 = ctx.createGain()
        o2.connect(g2); g2.connect(ctx.destination)
        o2.type = 'sine'
        o2.frequency.setValueAtTime(f, ctx.currentTime + i * 0.07)
        g2.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.07)
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.25)
        o2.start(ctx.currentTime + i * 0.07)
        o2.stop(ctx.currentTime + i * 0.07 + 0.26)
      })
    }
  } catch { /* AudioContext blocked */ }
}

let isSpeakingAudioGlobal = false

function speakWord(text) {
  if (!('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'
    utt.rate = 0.88
    isSpeakingAudioGlobal = true
    utt.onend = () => { isSpeakingAudioGlobal = false }
    utt.onerror = () => { isSpeakingAudioGlobal = false }
    window.speechSynthesis.speak(utt)
  } catch {
    isSpeakingAudioGlobal = false
  }
}

// ─── Utility ────────────────────────────────────────────────────────────────
function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build letter-length outline: "repeat custom" → "_ _ _ _ _ _   _ _ _ _ _ _" */
function buildOutline(term) {
  return term.split(' ')
    .map(word => Array.from({ length: word.length }, () => '_').join(' '))
    .join('   ')
}

/** Build first-letter hint: "repeat custom" → "r _ _ _ _ _   c _ _ _ _ _" */
function buildHint(term) {
  return term.split(' ')
    .map(word => [word[0], ...Array.from({ length: word.length - 1 }, () => '_')].join(' '))
    .join('   ')
}

// Stop words & fillers to filter out when checking spoken English answers
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'uh', 'um', 'ah', 'er'
])

/** Extract clean words from text: lowercase, remove punctuation, filter stop words & <2 length */
function extractWords(str) {
  if (!str) return []
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
}

/** Extract all raw words (excluding fillers) without dropping prepositions */
function extractAllWords(str) {
  if (!str) return []
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 1 && !['uh', 'um', 'ah', 'er'].includes(w))
}

/** Check if a single spoken word matches a target word */
function isWordMatch(w, target) {
  if (!w || !target) return false
  if (w === target) return true

  const tLen = target.length
  const wLen = w.length

  // 1. Plural / inflection check for any word length >= 3 (e.g., bed/beds, tree/trees, cost/costs)
  if (w === target + 's' || target === w + 's') return true
  if (w === target + 'es' || target === w + 'es') return true
  if (w === target + 'ed' || target === w + 'ed') return true
  if (w === target + 'ing' || target === w + 'ing') return true

  // Drop trailing 'e' before -ing/-ed (e.g., dance/dancing, live/living)
  if (target.endsWith('e') && (w === target.slice(0, -1) + 'ing' || w === target.slice(0, -1) + 'ed')) return true
  if (w.endsWith('e') && (target === w.slice(0, -1) + 'ing' || target === w.slice(0, -1) + 'ed')) return true

  // Suffixes like -er / -or / -ment (e.g., customer/custom, refreshment/refreshments)
  if (tLen >= 4 && (w === target + 'er' || target === w + 'er')) return true

  // British vs American spelling differences (colourful vs colorful, recognise vs recognize)
  if (target.replace(/our/g, 'or') === w.replace(/our/g, 'or')) return true
  if (target.replace(/ise/g, 'ize') === w.replace(/ise/g, 'ize')) return true

  // 2. Levenshtein edit distance <= 1 when target length >= 4
  if (tLen >= 4 && Math.abs(tLen - wLen) <= 1 && editDistance(w, target) <= 1) {
    return true
  }

  return false
}

/**
 * Strict content-word speech matcher:
 * - Direct match & normalized alphanumeric match
 * - Compound word check (e.g. "out grow" vs "outgrow")
 * - Single word: exact match, plural/tense suffix, UK/US spelling, editDistance <= 1
 * - Phrase: matches content words (2 of 2 for 2-word, 2+ of 3 for 3-word, 75%+ for 4+ words)
 */
function isSpokenMatch(spokenTranscript, targetTerm) {
  if (!spokenTranscript || !targetTerm) return false

  // 1. Direct raw or normalized match
  const sRaw = spokenTranscript.toLowerCase().trim()
  const tRaw = targetTerm.toLowerCase().trim()
  if (sRaw === tRaw) return true

  const sNorm = sRaw.replace(/[^a-z0-9]/g, '')
  const tNorm = tRaw.replace(/[^a-z0-9]/g, '')
  if (sNorm && tNorm && sNorm === tNorm) return true

  // 2. Extract words
  const spokenWords = extractWords(spokenTranscript)
  if (spokenWords.length === 0) return false

  // Compound check: e.g. target is 'outgrow', user said 'out grow'
  if (spokenWords.length >= 2 && spokenWords.join('') === tNorm) return true

  const targetWords = extractWords(targetTerm)
  const effectiveTarget = targetWords.length > 0
    ? targetWords
    : extractAllWords(targetTerm)

  if (effectiveTarget.length === 0) return false

  // Case 1: Target is a single word
  if (effectiveTarget.length === 1) {
    const target = effectiveTarget[0]
    return spokenWords.some(w => isWordMatch(w, target))
  }

  // Case 2: Multi-word phrase
  let hitCount = 0
  for (const tw of effectiveTarget) {
    if (spokenWords.some(w => isWordMatch(w, tw))) {
      hitCount++
    }
  }

  const total = effectiveTarget.length
  if (total === 2) {
    return hitCount === 2 // Both content words must be present
  }
  if (total === 3) {
    return hitCount >= 2 // At least 2 of 3
  }
  if (total === 4) {
    return hitCount >= 3 // At least 3 of 4
  }
  return hitCount >= Math.ceil(total * 0.75)
}

// ─── Blitz result card companion config ─────────────────────────────────────
function blitzCompanionInfo(accuracy, avgReactionMs) {
  const avgSec = avgReactionMs / 1000
  if (accuracy >= 0.85 && avgSec <= 4.5) {
    return {
      rankLabel: '👑 ROYAL RECALL',
      rankSub: 'THE PALADIN',
      avatar: COMPANION_AVATARS.vaelorn,
      fallback: COMPANION_DATA_URIS.vaelorn,
      themeClass: 'tier-knight',
      cardTitle: 'ROYAL RECALL',
      quote: '"以银甲之誓，铸就极速的反应！语音识别神准，完美全通！"'
    }
  }
  if (accuracy >= 0.65) {
    return {
      rankLabel: '🔮 ARCANE RECALL',
      rankSub: 'THE MAGE',
      avatar: COMPANION_AVATARS.lyriath,
      fallback: COMPANION_DATA_URIS.lyriath,
      themeClass: 'tier-mage',
      cardTitle: 'ARCANE RECALL',
      quote: '"魔法书已翻开新篇！词感犀利，再来一局必定晋级！"'
    }
  }
  return {
    rankLabel: "🛡️ KNIGHT'S GAMBIT",
    rankSub: 'THE KNIGHT',
    avatar: COMPANION_AVATARS.vaelorn,
    fallback: COMPANION_DATA_URIS.vaelorn,
    themeClass: 'tier-knight',
    cardTitle: "KNIGHT'S GAMBIT",
    quote: '"每一次卡壳都是淬炼！抓住错词，再次冲锋！"'
  }
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const TOTAL_SECONDS = 10
const HINT_THRESHOLD = 5.0  // seconds remaining when hint appears

export default function VerbalBlitz({
  vocabulary = [],
  allTests = [],
  allSpeakingLessons = [],
  onNavigateTab
}) {
  // ── Config state (lobby) ──────────────────────────────────────────────────
  const [blitzScope, setBlitzScope] = useState('all')  // 'all' | 'listening' | 'speaking' | 'speaking-{id}'
  const [blitzCount, setBlitzCount] = useState(10)
  const [gamePhase, setGamePhase] = useState('lobby') // 'lobby' | 'playing' | 'reveal' | 'done'

  // ── Session state ─────────────────────────────────────────────────────────
  const [questionQueue, setQuestionQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [blitzCombo, setBlitzCombo] = useState(0)
  const [maxBlitzCombo, setMaxBlitzCombo] = useState(0)
  const [blitzScore, setBlitzScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [reactionTimes, setReactionTimes] = useState([])   // ms each correct answer
  const [missedWords, setMissedWords] = useState([])        // vocab items missed (timeout)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [hintVisible, setHintVisible] = useState(false)
  const [cardState, setCardState] = useState('active') // 'active' | 'hit' | 'timeout'
  const [heardText, setHeardText] = useState('')
  const [heardMatched, setHeardMatched] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [micSupported, setMicSupported] = useState(true)

  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const revealTimeoutRef = useRef(null)

  // ── Synchronization refs to eliminate stale closures and cascade race conditions ──
  const currentIndexRef = useRef(0)
  const passedIndexRef = useRef(-1) // Rule 2.1: Lock to current question once passed/timed out
  const cardStateRef = useRef('active')
  const questionStartTimeRef = useRef(null)
  const questionReadyTimeRef = useRef(0) // Rule 2.3: 800ms cooldown gate
  const hintVisibleRef = useRef(false)
  const blitzComboRef = useRef(0)
  const questionQueueRef = useRef([])
  const gamePhaseRef = useRef('lobby')
  const isMicDesiredRef = useRef(false)

  // Callback refs to break cyclic dependencies
  const handleCorrectRef = useRef(null)
  const advanceToNextQuestionRef = useRef(null)

  // ── Vocabulary pool ───────────────────────────────────────────────────────
  const vocabPool = (() => {
    let pool = []
    if (blitzScope === 'all') {
      pool = vocabulary
    } else if (blitzScope === 'listening') {
      pool = vocabulary.filter(v => v.sourceTestId && v.sourceTestId !== 'speaking-studio')
    } else if (blitzScope === 'speaking') {
      pool = vocabulary.filter(v => v.sourceTestId === 'speaking-studio')
    } else if (blitzScope.startsWith('speaking-cat-')) {
      const cat = blitzScope.replace('speaking-cat-', '')
      pool = vocabulary.filter(v => (v.topicCategory || '') === cat || (v.category || '') === cat)
    }
    return pool.filter(v => v && v.term && v.chinese)
  })()

  // All unique topic categories from speaking vocab
  const speakingCategories = (() => {
    const cats = new Set()
    vocabulary.forEach(v => {
      if (v.sourceTestId === 'speaking-studio') {
        const cat = v.topicCategory || v.category
        if (cat) cats.add(cat)
      }
    })
    return [...cats].sort()
  })()

  const currentItem = questionQueue[currentIndex] || null

  // ── Build the question queue for a session ───────────────────────────────
  function buildQueue(pool, count) {
    const valid = pool.filter(v => v && v.term && v.chinese)
    if (valid.length === 0) return []
    const shuffled = shuffle(valid)
    const base = shuffled.slice(0, Math.min(count, valid.length))
    // If pool has fewer items than count, pad with repeats (from same shuffled pool)
    const full = [...base]
    while (full.length < count) {
      full.push(shuffled[full.length % shuffled.length])
    }
    return full
  }

  // ── Speech recognition lifecycle ──────────────────────────────────────────
  const stopMic = useCallback(() => {
    isMicDesiredRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setMicActive(false)
  }, [])

  const startMic = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setMicSupported(false)
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event) => {
      const currentIdx = currentIndexRef.current

      // Rule 2.1: Lock check — if this question already triggered pass/timeout or is not active, IGNORE ALL
      if (passedIndexRef.current === currentIdx) return
      if (cardStateRef.current !== 'active') return

      // Cooldown gate: prevent tail sound bleed, and ignore during TTS audio readout
      if (Date.now() < questionReadyTimeRef.current) return
      if (isSpeakingAudioGlobal) return

      // Collect latest segment from resultIndex
      let latestSegment = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res && res[0]) {
          latestSegment += res[0].transcript + ' '
        }
      }
      latestSegment = latestSegment.trim()

      // Also collect full transcript across segments for this question
      let fullTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i]
        if (res && res[0]) {
          fullTranscript += res[0].transcript + ' '
        }
      }
      fullTranscript = fullTranscript.trim()

      const textToShow = fullTranscript || latestSegment
      if (!textToShow) return

      // Rule 3: Realtime display what mic heard
      setHeardText(textToShow)

      const item = questionQueueRef.current[currentIdx]
      if (!item) return

      // Rule 1: Strict word/content-word match on full transcript or latest segment
      const isMatch = isSpokenMatch(fullTranscript, item.term) || isSpokenMatch(latestSegment, item.term)
      if (isMatch) {
        setHeardMatched(true)
        handleCorrectRef.current?.(hintVisibleRef.current)
      } else {
        setHeardMatched(false)
      }
    }

    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setMicActive(false)
        isMicDesiredRef.current = false
      }
    }

    rec.onend = () => {
      // Auto-restart if user still wants mic in playing state
      if (gamePhaseRef.current === 'playing' && cardStateRef.current === 'active' && isMicDesiredRef.current) {
        setTimeout(() => {
          if (gamePhaseRef.current === 'playing' && cardStateRef.current === 'active' && isMicDesiredRef.current) {
            try {
              rec.start()
              setMicActive(true)
            } catch { /* already running or unavailable */ }
          }
        }, 150)
      } else {
        setMicActive(false)
      }
    }

    try {
      rec.start()
      recognitionRef.current = rec
      setMicActive(true)
      isMicDesiredRef.current = true
    } catch {
      setMicActive(false)
    }
  }, [])

  // ── Cleanup all timers and streams ────────────────────────────────────────
  function stopAll() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    stopMic()
  }

  // ── Advance to next question ───────────────────────────────────────────────
  const advanceToNextQuestion = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)

    const nextIdx = currentIndexRef.current + 1
    if (nextIdx >= questionQueueRef.current.length) {
      gamePhaseRef.current = 'done'
      setGamePhase('done')
      stopMic()
      return
    }

    // Set up next question state
    currentIndexRef.current = nextIdx
    setCurrentIndex(nextIdx)
    setTimeLeft(TOTAL_SECONDS)
    setHintVisible(false)
    hintVisibleRef.current = false
    setCardState('active')
    cardStateRef.current = 'active'

    // Rule 3: Clear speech feedback bubble immediately on question switch
    setHeardText('')
    setHeardMatched(false)

    // Cancel any active speech synthesis
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    }
    isSpeakingAudioGlobal = false

    const now = Date.now()
    setQuestionStartTime(now)
    questionStartTimeRef.current = now

    // 280ms tail-sound cooldown gate for the new question
    questionReadyTimeRef.current = now + 280

    // Restart fresh speech recognition instance to clear internal buffers
    if (isMicDesiredRef.current) {
      setTimeout(() => {
        if (gamePhaseRef.current === 'playing' && cardStateRef.current === 'active') {
          startMic()
        }
      }, 120)
    }
  }, [stopMic, startMic])

  advanceToNextQuestionRef.current = advanceToNextQuestion

  // ── Handle correct answer ─────────────────────────────────────────────────
  const handleCorrect = useCallback((isHintPhase) => {
    const currentIdx = currentIndexRef.current
    if (cardStateRef.current !== 'active') return
    // Rule 2.1: Lock check
    if (passedIndexRef.current === currentIdx) return

    // Immediately lock this question to prevent any double/cascading triggers
    passedIndexRef.current = currentIdx
    cardStateRef.current = 'hit'
    setCardState('hit')
    setHeardMatched(true)

    // Rule 2.2: Immediately abort mic to flush old audio and cut off tail sounds
    try {
      recognitionRef.current?.abort()
    } catch { /* ignore */ }

    const reactionMs = questionStartTimeRef.current ? Date.now() - questionStartTimeRef.current : 5000
    const points = isHintPhase ? 150 : 300
    playBlitzChime(blitzComboRef.current >= 3 ? 'combo' : 'hit')

    setCorrectCount(c => c + 1)
    setBlitzCombo(c => {
      const next = c + 1
      setMaxBlitzCombo(m => Math.max(m, next))
      blitzComboRef.current = next
      return next
    })
    setBlitzScore(s => s + points + blitzComboRef.current * 30)

    if (reactionMs !== null) {
      setReactionTimes(prev => [...prev, reactionMs])
    }

    setTimeout(() => {
      advanceToNextQuestionRef.current?.()
    }, 600)
  }, [])

  handleCorrectRef.current = handleCorrect

  // ── Handle timeout / skip ─────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    const currentIdx = currentIndexRef.current
    if (cardStateRef.current !== 'active') return
    // Rule 2.1: Lock check
    if (passedIndexRef.current === currentIdx) return

    // Immediately lock this question
    passedIndexRef.current = currentIdx
    cardStateRef.current = 'timeout'
    setCardState('timeout')
    setBlitzCombo(0)
    blitzComboRef.current = 0

    // Rule 2.2: Immediately abort mic
    try {
      recognitionRef.current?.abort()
    } catch { /* ignore */ }

    playBlitzChime('timeout')

    const item = questionQueueRef.current[currentIdx]
    if (item) {
      setMissedWords(prev => {
        const already = prev.some(w => w.term === item.term)
        return already ? prev : [...prev, item]
      })
      speakWord(item.term)
    }

    // Auto-advance after 2.1s reveal
    revealTimeoutRef.current = setTimeout(() => {
      advanceToNextQuestionRef.current?.()
    }, 2100)
  }, [])

  // ── Start game ────────────────────────────────────────────────────────────
  function startGame(retryWords = null) {
    const pool = retryWords || vocabPool
    const queue = buildQueue(pool, blitzCount)
    if (queue.length === 0) return

    stopAll()

    questionQueueRef.current = queue
    setQuestionQueue(queue)
    currentIndexRef.current = 0
    setCurrentIndex(0)
    passedIndexRef.current = -1
    setTimeLeft(TOTAL_SECONDS)
    setBlitzCombo(0)
    blitzComboRef.current = 0
    setMaxBlitzCombo(0)
    setBlitzScore(0)
    setCorrectCount(0)
    setReactionTimes([])
    setMissedWords([])
    setHintVisible(false)
    hintVisibleRef.current = false
    setCardState('active')
    cardStateRef.current = 'active'
    setHeardText('')
    setHeardMatched(false)

    const now = Date.now()
    setQuestionStartTime(now)
    questionStartTimeRef.current = now
    questionReadyTimeRef.current = now + 280

    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    }
    isSpeakingAudioGlobal = false

    gamePhaseRef.current = 'playing'
    setGamePhase('playing')
    isMicDesiredRef.current = true

    setTimeout(() => {
      startMic()
    }, 120)
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing' || cardState !== 'active') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 0.1)
        if (prev > HINT_THRESHOLD && next <= HINT_THRESHOLD) {
          setHintVisible(true)
          hintVisibleRef.current = true
        }
        if (next <= 0.05) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return next
      })
    }, 100)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gamePhase, cardState, handleTimeout])

  // ── Keyboard: Space = correct, Escape/ArrowRight/N = skip ──────────────────
  useEffect(() => {
    if (gamePhase !== 'playing') return
    function onKeyDown(e) {
      if (e.code === 'Space' && cardStateRef.current === 'active') {
        e.preventDefault()
        handleCorrect(hintVisibleRef.current)
      }
      if ((e.code === 'ArrowRight' || e.code === 'KeyN') && cardStateRef.current === 'active') {
        e.preventDefault()
        handleTimeout()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [gamePhase, handleCorrect, handleTimeout])

  // ── Mic auto-start/stop with gamePhase ─────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing') {
      stopMic()
    }
    return () => {
      stopAll()
    }
  }, [gamePhase, stopMic])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll()
    }
  }, []) // eslint-disable-line

  // ── Ring timer %  ─────────────────────────────────────────────────────────
  const timerPct = timeLeft / TOTAL_SECONDS
  const strokeDasharray = 2 * Math.PI * 40   // r=40
  const strokeDashoffset = strokeDasharray * (1 - timerPct)
  const timerColor = timeLeft <= 3 ? '#C86D51' : timeLeft <= 5 ? '#D97706' : '#3D5245'

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalQ = questionQueue.length
  const accuracy = totalQ > 0 ? correctCount / totalQ : 0
  const avgReaction = reactionTimes.length > 0
    ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    : 0
  const companion = blitzCompanionInfo(accuracy, avgReaction)

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (gamePhase === 'lobby') {
    return (
      <div className="blitz-lobby">
        {/* Header */}
        <div className="blitz-lobby-header">
          <div className="blitz-lobby-icon"><Zap size={22} /></div>
          <div>
            <h2 className="blitz-lobby-title">⚡ 10秒极速开口闪击</h2>
            <p className="blitz-lobby-sub">10s Verbal Blitz · 声控词汇极速反应挑战</p>
          </div>
        </div>

        {/* Config panel */}
        <div className="blitz-config-panel">
          {/* Scope */}
          <div className="blitz-config-row">
            <label className="blitz-config-label">
              <span className="blitz-config-kicker">01 / 词库范围</span>
              <div className="blitz-select-wrap">
                <select
                  value={blitzScope}
                  onChange={e => setBlitzScope(e.target.value)}
                  className="blitz-select"
                >
                  <option value="all">🌟 全部听说综合词库</option>
                  <option value="listening">🎧 仅听力核心词库</option>
                  <option value="speaking">🎤 仅口语高分词库</option>
                  {speakingCategories.map(cat => (
                    <option key={cat} value={`speaking-cat-${cat}`}>📂 {cat}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="blitz-select-icon" />
              </div>
            </label>
            <span className="blitz-pool-count">
              共 <strong>{vocabPool.length}</strong> 词可用
            </span>
          </div>

          {/* Count */}
          <div className="blitz-config-row">
            <span className="blitz-config-kicker">02 / 挑战题数</span>
            <div className="blitz-count-pills">
              {[
                { n: 10, label: '⚡ 10 词速刷', cls: 'pill-flash' },
                { n: 20, label: '🔥 20 词进阶', cls: 'pill-fire' },
                { n: 30, label: '👑 30 词大师', cls: 'pill-crown' }
              ].map(({ n, label, cls }) => (
                <button
                  key={n}
                  type="button"
                  className={`blitz-count-pill ${cls} ${blitzCount === n ? 'active' : ''}`}
                  onClick={() => setBlitzCount(n)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mic notice */}
          <div className="blitz-mic-notice">
            <Mic size={14} />
            <span>
              本游戏支持浏览器原生语音识别（需允许麦克风权限）；不支持麦克风时，
              按 <kbd>空格键</kbd> 或点击按钮也可秒过。
            </span>
          </div>
        </div>

        {/* Start button */}
        <button
          type="button"
          className="blitz-start-btn"
          disabled={vocabPool.length === 0}
          onClick={() => startGame()}
        >
          <Zap size={18} />
          <span>开始极速挑战 ({blitzCount} 题)</span>
        </button>
        {vocabPool.length === 0 && (
          <p className="blitz-empty-warn">⚠️ 所选范围暂无词汇，请先导入听力/口语题目或切换词库范围。</p>
        )}
      </div>
    )
  }

  // ── DONE / RESULTS ────────────────────────────────────────────────────────
  if (gamePhase === 'done') {
    const pct = Math.round(accuracy * 100)
    const avgSec = (avgReaction / 1000).toFixed(1)

    return (
      <div className="blitz-done-wrapper">
        {/* Crystal star marks */}
        <span className="settlement-crystal-star top-left" aria-hidden>✦</span>
        <span className="settlement-crystal-star top-right" aria-hidden>✦</span>
        <span className="settlement-crystal-star bottom-left" aria-hidden>✦</span>
        <span className="settlement-crystal-star bottom-right" aria-hidden>✦</span>

        <div className={`pocket-quest-card-3d ${companion.themeClass} blitz-result-card`}>
          {/* Card header */}
          <div className="pocket-card-top">
            <div className="pocket-card-badge">
              <Sparkles size={13} className="pocket-sparkle-icon" />
              <span>POCKET QUEST · VERBAL BLITZ</span>
            </div>
            <span className="pocket-card-num">{String(totalQ).padStart(2, '0')}</span>
          </div>

          {/* Card title */}
          <div className="blitz-result-title">{companion.cardTitle}</div>
          <div className="blitz-result-rank">{companion.rankLabel}</div>

          {/* Avatar */}
          <div className="pocket-avatar-stage">
            <div className="pocket-avatar-arch">
              <img
                src={companion.avatar}
                alt={companion.rankSub}
                className="pocket-companion-img"
                onError={e => {
                  if (companion.fallback && e.currentTarget.src !== companion.fallback) {
                    e.currentTarget.src = companion.fallback
                  }
                }}
              />
            </div>
            <span className="pocket-hero-badge">{companion.rankSub}</span>
          </div>

          {/* Quote */}
          <p className="pocket-hero-quote blitz-quote">{companion.quote}</p>

          {/* Stats strip */}
          <div className="pocket-stats-strip blitz-stats-strip">
            <div className="pocket-stat-box">
              <span className="stat-label">准确率</span>
              <strong className="stat-value">{pct}%</strong>
            </div>
            <div className="pocket-stat-box">
              <span className="stat-label">平均反应</span>
              <strong className="stat-value">{reactionTimes.length ? avgSec + 's' : 'N/A'}</strong>
            </div>
            <div className="pocket-stat-box">
              <span className="stat-label">MAX COMBO</span>
              <strong className="stat-value">×{maxBlitzCombo}</strong>
            </div>
            <div className="pocket-stat-box highlight">
              <span className="stat-label">得分</span>
              <strong className="stat-value">{blitzScore}</strong>
            </div>
          </div>

          {/* Missed words list */}
          {missedWords.length > 0 && (
            <div className="blitz-missed-section">
              <div className="blitz-missed-label">
                <AlertCircle size={13} />
                <span>本局卡壳词 ({missedWords.length} 个) — 点击朗读</span>
              </div>
              <div className="blitz-missed-pills">
                {missedWords.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    className="blitz-missed-pill"
                    onClick={() => speakWord(w.term)}
                    title={w.chinese}
                  >
                    <Volume2 size={11} />
                    <span>{w.term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pocket-actions-row">
            <button
              type="button"
              className="pocket-action-btn primary"
              onClick={() => startGame()}
            >
              <RotateCcw size={15} />
              <span>再战一局</span>
            </button>

            {missedWords.length > 0 && (
              <button
                type="button"
                className="pocket-action-btn blitz-revenge-btn"
                onClick={() => {
                  setBlitzCount(missedWords.length)
                  startGame(missedWords)
                }}
              >
                <Flame size={15} />
                <span>🔥 闪电复仇 ({missedWords.length} 词)</span>
              </button>
            )}

            <button
              type="button"
              className="pocket-action-btn secondary"
              onClick={() => setGamePhase('lobby')}
            >
              <BookOpen size={15} />
              <span>返回配置</span>
            </button>
          </div>

          <div className="blitz-result-footer">A LITTLE BLITZ. A LITTLE MAGIC.</div>
        </div>
      </div>
    )
  }

  // ── PLAYING ───────────────────────────────────────────────────────────────
  if (!currentItem) return null

  const isHit = cardState === 'hit'
  const isTimeout = cardState === 'timeout'
  const isActive = cardState === 'active'
  const progressPct = ((currentIndex + (isHit || isTimeout ? 1 : 0)) / totalQ) * 100

  return (
    <div className="blitz-stage">
      {/* Top HUD */}
      <div className="blitz-hud">
        <div className="blitz-hud-progress">
          <span className="blitz-hud-qnum">第 {currentIndex + 1} / {totalQ} 题</span>
          <div className="blitz-progress-track">
            <div className="blitz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className={`blitz-hud-combo ${blitzCombo >= 3 ? 'hot-combo' : ''}`}>
          <Flame size={14} />
          <span>COMBO ×{blitzCombo}</span>
          {blitzCombo >= 5 && <span className="blitz-combo-burst">🔥</span>}
        </div>

        <div className="blitz-hud-score">{blitzScore} pts</div>
      </div>

      {/* Ring Timer + Card */}
      <div className="blitz-arena">
        {/* Circular countdown dial */}
        <div className={`blitz-ring-wrap ${timeLeft <= 3 ? 'urgent-ring' : ''}`}>
          <svg width="96" height="96" viewBox="0 0 96 96" className="blitz-ring-svg">
            {/* Track */}
            <circle cx="48" cy="48" r="40" fill="none" stroke="#2C2C2C" strokeWidth="7" />
            {/* Progress arc */}
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke={timerColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div className="blitz-ring-num">{Math.ceil(timeLeft)}</div>
        </div>

        {/* Main question card */}
        <div className={`blitz-card ${isHit ? 'blitz-card-hit' : ''} ${isTimeout ? 'blitz-card-timeout' : ''}`}>

          {/* Phase pill */}
          <div className="blitz-phase-pill">
            {isTimeout ? (
              <><AlertCircle size={12} /><span>超时揭晓 — 请跟读记忆</span></>
            ) : hintVisible ? (
              <><Sparkles size={12} /><span>💡 破冰提示期 · +150 分</span></>
            ) : (
              <><Zap size={12} /><span>⚡ 极速裸考期 · +300 分</span></>
            )}
          </div>

          {/* Chinese meaning */}
          {!isTimeout && (
            <div className="blitz-card-chinese">
              <span className="blitz-chinese-main">{currentItem.chinese}</span>
              {currentItem.pos && (
                <span className="blitz-pos-badge">{currentItem.pos}</span>
              )}
            </div>
          )}

          {/* Revealed answer (timeout) */}
          {isTimeout && (
            <div className="blitz-reveal-area">
              <div className="blitz-chinese-main blitz-timeout-label">{currentItem.chinese}</div>
              <div className="blitz-answer-reveal">{currentItem.term}</div>
              {currentItem.pos && (
                <span className="blitz-pos-badge">{currentItem.pos}</span>
              )}
            </div>
          )}

          {/* Letter outline / hint */}
          {!isTimeout && (
            <div className="blitz-outline-wrap">
              <div className={`blitz-outline ${hintVisible ? 'hint-visible' : ''}`}>
                {hintVisible ? buildHint(currentItem.term) : buildOutline(currentItem.term)}
              </div>
            </div>
          )}

          {/* Example sentence (hint phase) */}
          {hintVisible && !isTimeout && currentItem.exampleSentence && (
            <div className="blitz-example-sentence">
              {currentItem.exampleSentence.replace(
                new RegExp(`\\b${currentItem.term}\\b`, 'gi'),
                '___'
              )}
            </div>
          )}

          {/* HIT feedback */}
          {isHit && (
            <div className="blitz-hit-badge">
              <Check size={18} /> 发音命中！
            </div>
          )}
        </div>
      </div>

      {/* Voice feedback bar */}
      {!isTimeout && (
        <div className="blitz-voice-bar">
          {micActive ? (
            <>
              <div className="blitz-mic-indicator active">
                <Mic size={13} />
                <div className="blitz-waveform">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="blitz-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
              {heardText ? (
                <div className={`blitz-heard-bubble ${heardMatched ? 'matched' : 'pending'}`}>
                  <span className="blitz-heard-label">
                    {heardMatched ? '🎙️ 识别命中:' : '🎙️ 正在听辨:'}
                  </span>
                  <span className={`blitz-heard-word ${heardMatched ? 'matched' : 'pending'}`}>
                    "{heardText.length > 35 ? '...' + heardText.slice(-35) : heardText}"
                  </span>
                </div>
              ) : (
                <div className="blitz-heard-bubble idle">
                  <span className="blitz-heard-hint">🎙️ 正在听辨 · 请大声朗读英文目标词</span>
                </div>
              )}
            </>
          ) : (
            <div className="blitz-mic-indicator inactive">
              <MicOff size={13} />
              <span>{micSupported ? '麦克风待命' : '浏览器不支持语音识别'}</span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {isActive && (
        <div className="blitz-action-row">
          <button
            type="button"
            className="blitz-pass-btn"
            onClick={() => handleCorrect(hintVisible)}
          >
            <Zap size={16} />
            <span>⚡ 已说出 · 按 Space 秒过</span>
          </button>
          <button
            type="button"
            className="blitz-skip-btn"
            onClick={handleTimeout}
          >
            <span>⏭ 想不出，看答案</span>
          </button>
        </div>
      )}

      {/* Exit button */}
      <button
        type="button"
        className="blitz-exit-btn"
        onClick={() => { stopAll(); setGamePhase('lobby') }}
      >
        ✕ 退出本局
      </button>
    </div>
  )
}


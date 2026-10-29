import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BookOpen, Check, ChevronLeft, ChevronRight, Layers, PenLine, RotateCw, Search, Volume2, X, Save } from 'lucide-react'
import { normalizeTopicCategory, tests } from '../data/index.js'

const masteryStorageKey = 'ielts-vocabulary-mastery'
const reviewStorageKey = 'ielts-vocabulary-review'

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function speak(term) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(term)
  utterance.lang = 'en-GB'
  window.speechSynthesis.speak(utterance)
}

function getVocabularyKey(item) {
  return `${item.sourceTestId}:${item.id}`
}

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ')
}

export default function VocabularyStudio({ vocabulary, global = false, onUpdateVocabulary, onRenameCategory }) {
  const [mode, setMode] = useState('list')
  const [displayMode, setDisplayMode] = useState(() => localStorage.getItem('ielts-vocabulary-display-mode') || 'all')
  const [revealedVocabulary, setRevealedVocabulary] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cardIndex, setCardIndex] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState(null)
  const [spellingIndex, setSpellingIndex] = useState(0)
  const [spellingMode, setSpellingMode] = useState('translation')
  const [spellingAnswer, setSpellingAnswer] = useState('')
  const [spellingChecked, setSpellingChecked] = useState(false)
  const [mastery, setMastery] = useState(() => readStorage(masteryStorageKey, {}))
  const [reviewWords, setReviewWords] = useState(() => readStorage(reviewStorageKey, []))
  const [editingCategory, setEditingCategory] = useState('')
  const [categoryDraft, setCategoryDraft] = useState('')
  const [editingWord, setEditingWord] = useState('')
  const [wordDraft, setWordDraft] = useState(null)
  const [customCategoryDraft, setCustomCategoryDraft] = useState('')
  const [editError, setEditError] = useState('')

  const vocabularyItems = useMemo(() => [...new Map(vocabulary.map((item) => [getVocabularyKey(item), item])).values()], [vocabulary])
  const categories = useMemo(() => [...new Set(vocabularyItems.map((item) => normalizeTopicCategory(item.topicCategory) || '未分类'))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [vocabularyItems])
  const filteredVocabulary = useMemo(() => vocabularyItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || normalizeTopicCategory(item.topicCategory) === selectedCategory
    const query = searchTerm.trim().toLowerCase()
    const matchesSearch = !query || [item.term, item.pos, item.chinese, item.topicCategory, item.exampleSentence].some((value) => value.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  }), [selectedCategory, searchTerm, vocabularyItems])
  const activeCard = filteredVocabulary[cardIndex]
  const spellingItem = filteredVocabulary[spellingIndex]
  const spellingCorrect = spellingItem && normalizeAnswer(spellingAnswer) === normalizeAnswer(spellingItem.term)
  const sourceTitle = (item) => item.sourceTestId === 'speaking-studio' ? 'Speaking Studio · 口语练习' : tests.find((test) => test.id === item.sourceTestId)?.title ?? item.sourceTestId

  useEffect(() => {
    localStorage.setItem(masteryStorageKey, JSON.stringify(mastery))
  }, [mastery])

  useEffect(() => {
    localStorage.setItem(reviewStorageKey, JSON.stringify(reviewWords))
  }, [reviewWords])

  useEffect(() => {
    localStorage.setItem('ielts-vocabulary-display-mode', displayMode)
  }, [displayMode])

  useEffect(() => {
    setCardIndex(0)
    setCardFlipped(false)
    setSpellingIndex(0)
    setSpellingAnswer('')
    setSpellingChecked(false)
  }, [mode, selectedCategory, searchTerm])

  function startCategoryMode(category, nextMode) {
    setSelectedCategory(category)
    setSearchTerm('')
    setMode(nextMode)
  }

  function moveCard(direction) {
    if (!filteredVocabulary.length) return
    setCardIndex((index) => (index + direction + filteredVocabulary.length) % filteredVocabulary.length)
    setCardFlipped(false)
  }

  function handleMasteryDecision(status) {
    if (!activeCard) return
    const key = getVocabularyKey(activeCard)
    setMastery((current) => ({ ...current, [key]: status }))
    const direction = status === 'mastered' ? 'fly-right' : 'fly-left'
    setSwipeDirection(direction)
    setTimeout(() => {
      setSwipeDirection(null)
      moveCard(1)
    }, 280)
  }

  function checkSpelling(event) {
    event.preventDefault()
    if (!spellingItem || !spellingAnswer.trim()) return
    setSpellingChecked(true)
  }

  function nextSpelling() {
    setSpellingIndex((index) => (index + 1) % filteredVocabulary.length)
    setSpellingAnswer('')
    setSpellingChecked(false)
  }

  function addReviewWord() {
    if (!spellingItem) return
    const key = getVocabularyKey(spellingItem)
    setReviewWords((current) => current.includes(key) ? current : [...current, key])
  }

  const groups = useMemo(() => categories.map((category) => ({
    category,
    words: filteredVocabulary.filter((item) => normalizeTopicCategory(item.topicCategory) === category),
  })).filter((group) => group.words.length), [categories, filteredVocabulary])

  async function saveCategory(category) {
    try {
      await onRenameCategory(category, categoryDraft)
      setEditingCategory('')
      setEditError('')
    } catch (error) {
      setEditError(`分类保存失败：${error.message}`)
    }
  }

  async function saveWord() {
    if (!wordDraft) return
    try {
      await onUpdateVocabulary({ ...wordDraft, topicCategory: normalizeTopicCategory(wordDraft.topicCategory === '__custom' ? customCategoryDraft : wordDraft.topicCategory) })
      setEditingWord('')
      setWordDraft(null)
      setEditError('')
    } catch (error) {
      setEditError(`词条保存失败：${error.message}`)
    }
  }

  return <section className={`vocabulary-studio ${global ? 'global-vocabulary' : 'single-vocabulary'}`}>
    <div className="vocabulary-heading">
      <div><span className="eyebrow-small">{global ? 'CROSS-TEST VOCABULARY' : 'THIS LISTENING · BAND 7.5'}</span><h2>{global ? '话题分类词库' : '本篇 7.5 分核心词与短语'}</h2></div>
      <div className="vocabulary-heading-actions"><div className="vocabulary-display-modes" role="group" aria-label="词卡语言显示"><button className={displayMode === 'all' ? 'active' : ''} onClick={() => setDisplayMode('all')}>双语显示 (All)</button><button className={displayMode === 'chinese' ? 'active' : ''} onClick={() => setDisplayMode('chinese')}>只显示中文</button><button className={displayMode === 'english' ? 'active' : ''} onClick={() => setDisplayMode('english')}>只显示英文</button></div><span className="vocabulary-total">{filteredVocabulary.length} TERMS</span></div>
    </div>

    <div className="vocabulary-toolbar">
      <div className="vocabulary-mode-tabs" role="tablist" aria-label="词汇学习模式">
        <button className={mode === 'list' ? 'active' : ''} role="tab" aria-selected={mode === 'list'} onClick={() => setMode('list')}><BookOpen size={15} />列表</button>
        <button className={mode === 'flashcards' ? 'active' : ''} role="tab" aria-selected={mode === 'flashcards'} onClick={() => setMode('flashcards')}><Layers size={15} />闪卡记忆</button>
        <button className={mode === 'spelling' ? 'active' : ''} role="tab" aria-selected={mode === 'spelling'} onClick={() => setMode('spelling')}><PenLine size={15} />拼写测试</button>
      </div>
      {global && <div className="vocabulary-filters">
        <label className="vocabulary-search"><Search size={15} /><input type="search" placeholder="搜索词汇、释义或例句" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
        <select aria-label="按话题分类筛选" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}><option value="all">全部话题分类</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
      </div>}
      {mode === 'spelling' && <div className="spelling-mode-tabs" role="tablist" aria-label="拼写测试题目类型">
        <button className={spellingMode === 'translation' ? 'active' : ''} role="tab" aria-selected={spellingMode === 'translation'} onClick={() => { setSpellingMode('translation'); setSpellingAnswer(''); setSpellingChecked(false) }}>看中文写英文</button>
        <button className={spellingMode === 'listening' ? 'active' : ''} role="tab" aria-selected={spellingMode === 'listening'} onClick={() => { setSpellingMode('listening'); setSpellingAnswer(''); setSpellingChecked(false) }}>听发音写英文</button>
      </div>}
    </div>

    {mode === 'list' && <div className="vocabulary-groups">{groups.length ? groups.map(({ category, words }) => <section className="vocabulary-group" key={category}>
      <div className="vocabulary-group-heading"><div><span className="topic-dot" />{editingCategory === category ? <><input aria-label="话题分类名称" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} /><button onClick={() => saveCategory(category)}><Save size={14} />保存</button><button onClick={() => setEditingCategory('')}>取消</button></> : <h3>{category}</h3>}<span>{String(words.length).padStart(2, '0')} TERMS</span></div>{global && <div className="category-actions"><button onClick={() => { setEditingCategory(category); setCategoryDraft(category) }}>✏️ 编辑分类名</button><button onClick={() => startCategoryMode(category, 'flashcards')}><Layers size={14} />跨篇闪卡</button><button onClick={() => startCategoryMode(category, 'spelling')}><PenLine size={14} />跨篇拼写</button></div>}</div>
      <div className={`vocabulary-list vocabulary-display-${displayMode}`}>{words.map((item) => { const key = getVocabularyKey(item); const revealed = Boolean(revealedVocabulary[key]); return <article className="vocabulary-row" key={key} onClick={() => displayMode !== 'all' && setRevealedVocabulary((current) => ({ ...current, [key]: !current[key] }))}>
        {(displayMode !== 'chinese' || revealed || editingWord === key) && <div className="vocabulary-row-term"><h4>{item.term}</h4><span>{item.pos}</span><button title={`朗读 ${item.term}`} aria-label={`朗读 ${item.term}`} onClick={(event) => { event.stopPropagation(); speak(item.term) }}><Volume2 size={15} /></button></div>}
        {editingWord === getVocabularyKey(item) ? <div className="vocabulary-word-editor">
          <label>所属分类<select value={wordDraft.topicCategory} onChange={(event) => setWordDraft({ ...wordDraft, topicCategory: event.target.value })}>{categories.map((value) => <option key={value}>{value}</option>)}<option value="__custom">自定义分类…</option></select></label>
          {wordDraft.topicCategory === '__custom' && <input aria-label="自定义分类名称" placeholder="输入新分类名称" value={customCategoryDraft} onChange={(event) => setCustomCategoryDraft(event.target.value)} />}
          <label>中文释义<input value={wordDraft.chinese} onChange={(event) => setWordDraft({ ...wordDraft, chinese: event.target.value })} /></label>
          <div><button onClick={saveWord}><Save size={14} />保存</button><button onClick={() => { setEditingWord(''); setWordDraft(null) }}>取消</button><button className="vocabulary-delete-word" onClick={async () => { try { await onUpdateVocabulary({ ...item, deleted: true }); setEditingWord(''); setWordDraft(null) } catch (error) { setEditError(`词条删除失败：${error.message}`) } }}><X size={14} />删除词条</button></div>
        </div> : <>{(displayMode !== 'english' || revealed) && <p className="vocabulary-meaning">{item.chinese}</p>}{displayMode !== 'chinese' && <blockquote>{item.exampleSentence}</blockquote>}
          <div className="vocabulary-row-meta"><button onClick={(event) => { event.stopPropagation(); setEditingWord(key); setWordDraft({ ...item, topicCategory: normalizeTopicCategory(item.topicCategory) }) }}>{item.topicCategory} · 编辑分类/释义</button>{global && <small>{sourceTitle(item)}</small>}</div></>}
      </article> })}</div>
    </section>) : <p className="vocabulary-empty">没有找到匹配的词汇。</p>}</div>}

    {editError && <p className="vocabulary-edit-error" role="alert">{editError}</p>}
    {mode === 'flashcards' && (
      <div className="flashcard-stage">
        {activeCard ? (
          <>
            {/* Dual-Color Ring Progress (Green = Mastered, Pink/Terracotta = Review) */}
            <div className="flashcard-ring-wrap">
              {(() => {
                const masteredCount = filteredVocabulary.filter((item) => mastery[getVocabularyKey(item)] === 'mastered').length
                const reviewCount = filteredVocabulary.filter((item) => mastery[getVocabularyKey(item)] === 'review').length
                const total = filteredVocabulary.length
                const R = 30
                const circumference = 2 * Math.PI * R
                const masteredLen = total > 0 ? (masteredCount / total) * circumference : 0
                const reviewLen = total > 0 ? (reviewCount / total) * circumference : 0
                return (
                  <>
                    <svg className="flashcard-ring-svg" width={76} height={76} viewBox="0 0 76 76">
                      <circle className="flashcard-ring-track" cx={38} cy={38} r={R} />
                      <circle
                        className="flashcard-ring-fill flashcard-ring-mastered"
                        cx={38}
                        cy={38}
                        r={R}
                        strokeDasharray={`${masteredLen} ${circumference}`}
                        strokeDashoffset={0}
                      />
                      <circle
                        className="flashcard-ring-fill flashcard-ring-review"
                        cx={38}
                        cy={38}
                        r={R}
                        strokeDasharray={`${reviewLen} ${circumference}`}
                        strokeDashoffset={-masteredLen}
                      />
                    </svg>
                    <div className="flashcard-ring-dual-label">
                      <span className="ring-stat-item ring-stat-mastered">
                        <span className="ring-stat-dot green" />
                        已掌握 <strong>{masteredCount}</strong>
                      </span>
                      <span className="ring-stat-sep">·</span>
                      <span className="ring-stat-item ring-stat-review">
                        <span className="ring-stat-dot pink" />
                        待复习 <strong>{reviewCount}</strong>
                      </span>
                      <span className="ring-stat-total">/ 共 {total} 词</span>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* 3D Flip Card */}
            <div className={`flashcard-3d-scene ${swipeDirection || ''}`.trim()}>
              <div
                className={`flashcard-3d-inner${cardFlipped ? ' is-flipped' : ''}`}
                onClick={() => setCardFlipped((v) => !v)}
                role="button"
                tabIndex={0}
                aria-label={cardFlipped ? '显示词汇正面' : '翻转查看词汇释义'}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCardFlipped((v) => !v) } }}
              >
                {/* Front */}
                <div className="flashcard-3d-face flashcard-3d-front">
                  <span className="flashcard-3d-kicker">TERM</span>
                  <span className="flashcard-3d-term">{activeCard.term}</span>
                  {activeCard.pos && <span className="flashcard-3d-pos">{activeCard.pos}</span>}
                  <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>点击或按空格键翻转 →</span>
                </div>
                {/* Back */}
                <div className="flashcard-3d-face flashcard-3d-back">
                  <span className="flashcard-3d-kicker">MEANING &amp; CONTEXT</span>
                  <span className="flashcard-3d-chinese">{activeCard.chinese}</span>
                  {activeCard.exampleSentence && <span className="flashcard-3d-example">"{activeCard.exampleSentence}"</span>}
                  {activeCard.topicCategory && <span className="flashcard-3d-category">{activeCard.topicCategory}</span>}
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flashcard-status">
              {mastery[getVocabularyKey(activeCard)] && (
                <span className={`mastery-badge ${mastery[getVocabularyKey(activeCard)]}`}>
                  {mastery[getVocabularyKey(activeCard)] === 'mastered' ? '✅ 已掌握' : '⚠️ 需复习'}
                </span>
              )}
            </div>

            {/* Mastery pill buttons - Forced single line whitespace-nowrap */}
            <div className="flashcard-mastery-actions flex-nowrap">
              <button
                type="button"
                className="flashcard-mastery-btn needs-review whitespace-nowrap flex-nowrap"
                disabled={Boolean(swipeDirection)}
                onClick={() => handleMasteryDecision('review')}
                title="标记为待复习（自动切到下一词）"
              >
                <AlertCircle size={15} strokeWidth={1.8} className="mastery-btn-icon shrink-0" />
                <span className="whitespace-nowrap">待复习</span>
                <span className="mastery-btn-sub whitespace-nowrap">Need Review</span>
              </button>
              <button
                type="button"
                className="flashcard-mastery-btn mastered whitespace-nowrap flex-nowrap"
                disabled={Boolean(swipeDirection)}
                onClick={() => handleMasteryDecision('mastered')}
                title="标记为已掌握（自动切到下一词）"
              >
                <Check size={15} strokeWidth={2.4} className="mastery-btn-icon shrink-0" />
                <span className="whitespace-nowrap">已掌握</span>
                <span className="mastery-btn-sub whitespace-nowrap">Mastered</span>
              </button>
            </div>

            {/* Navigation */}
            <div className="flashcard-navigation">
              <button title="上一张" aria-label="上一张" onClick={() => moveCard(-1)}><ChevronLeft size={18} /></button>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#52665C' }}>
                {String(cardIndex + 1).padStart(2, '0')} / {String(filteredVocabulary.length).padStart(2, '0')}
              </span>
              <button title="下一张" aria-label="下一张" onClick={() => moveCard(1)}><ChevronRight size={18} /></button>
            </div>
          </>
        ) : (
          <p className="vocabulary-empty">没有符合筛选条件的词汇。</p>
        )}
      </div>
    )}

    {mode === 'spelling' && <div className="spelling-stage">
      {spellingItem ? <>
        <div className="spelling-counter">WORD {String(spellingIndex + 1).padStart(2, '0')} / {String(filteredVocabulary.length).padStart(2, '0')}</div>
        <div className="spelling-prompt">{spellingMode === 'translation' ? <><span className="spelling-kicker">中文释义</span><strong>{spellingItem.chinese}</strong></> : <><span className="spelling-kicker">听音拼写</span><button className="spelling-audio" onClick={() => speak(spellingItem.term)}><Volume2 size={20} />播放单词读音</button></>}</div>
        <form className="spelling-form" onSubmit={checkSpelling}>
          <label htmlFor="spelling-answer">你的拼写</label><input id="spelling-answer" type="text" autoComplete="off" spellCheck="false" value={spellingAnswer} onChange={(event) => { setSpellingAnswer(event.target.value); setSpellingChecked(false) }} placeholder="输入英文单词或短语" />
          <button type="submit" disabled={!spellingAnswer.trim()}><Check size={15} />检查拼写</button>
        </form>
        {spellingChecked && (spellingCorrect ? <div className="spelling-result correct"><Check size={16} /><span>拼写正确</span><button onClick={nextSpelling}>下一题 <ChevronRight size={15} /></button></div> : <div className="spelling-result incorrect"><X size={16} /><span>再核对一下</span><div className="spelling-comparison"><span>{spellingAnswer}</span><b>{spellingItem.term}</b></div><button className="add-review-word" onClick={addReviewWord}><BookOpen size={14} />{reviewWords.includes(getVocabularyKey(spellingItem)) ? '已加入生词本' : '加入生词本'}</button><button className="spelling-next" onClick={nextSpelling}>下一题 <ChevronRight size={15} /></button></div>)}
        <div className="spelling-topic">{spellingItem.topicCategory}{global && <span>{sourceTitle(spellingItem)}</span>}</div>
      </> : <p className="vocabulary-empty">没有符合筛选条件的词汇。</p>}
    </div>}
  </section>
}

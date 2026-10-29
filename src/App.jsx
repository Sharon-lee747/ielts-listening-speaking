import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, ChevronDown, CircleHelp, Download, FileText, Gamepad2, Headphones, LockKeyhole, Mic2, RotateCcw, Sparkles, Trash2, Volume2, X } from 'lucide-react'
import { tests, speakingLessons, getTopicVocabulary, normalizeTopicCategory } from './data/index.js'
import { loadSpeakingVocabulary, saveSpeakingVocabulary } from './data/speakingVocabulary.js'
import { loadLocalTests, saveLocalTests } from './data/localTestLibrary.js'
import { loadLocalSpeakingLessons, saveLocalSpeakingLessons } from './data/localSpeakingLessons.js'
import { deleteAudioFromDisk, deleteLessonFromDisk, deleteMapImageFromDisk, deleteSpeakingSetFromDisk, listAudioFiles, replaceLessonOnDisk, uploadAudioToDisk, uploadMapImageToDisk, uploadSpeakingImageToDisk, writeLessonToDisk } from './data/localDevApi.js'
import { normalizeQuestionType } from './data/questionTypes.js'
import AudioPlayer from './components/AudioPlayer.jsx'
import ScrollReveal from './components/ScrollReveal.jsx'
import KeySentenceTrainer from './components/KeySentenceTrainer.jsx'
import MindMap from './components/MindMap.jsx'
import QuestionCard, { FillBlankSheet } from './components/QuestionCard.jsx'
import MapImage from './components/MapImage.jsx'
import SpeakingStudio from './components/SpeakingStudio.jsx'
import QuestionBankStudio from './components/QuestionBankStudio.jsx'
import VocabularyStudio from './components/VocabularyStudio.jsx'
import ArcadeArena from './components/ArcadeArena.jsx'
import QuickTestFinder from './components/QuickTestFinder.jsx'
import IeltsHighlighter from './components/IeltsHighlighter.jsx'
import TeachingWhiteboard from './components/TeachingWhiteboard.jsx'
import TranscriptListening from './components/TranscriptListening.jsx'
import { attachTranscriptReferences } from './data/transcriptMatching.js'
import { cleanListeningTitle, getListeningPart, getSpeakingTitle, listeningParts, sortByEnglishTitle } from './data/lessonIndex.js'
import './review.css'
import './vocabulary.css'
import './speaking.css'
import './question-bank.css'
import './audio.css'

const sections = [
  { id: 'fill_blank', title: '填空题', english: 'Fill in the blank', note: 'LISTEN FOR DETAIL' },
  { id: 'single_choice', title: '单选题', english: 'Single choice', note: 'FOLLOW THE LOGIC' },
  { id: 'multiple_choice', title: '多选题', english: 'Multiple choice', note: 'SELECT TWO ANSWERS' },
  { id: 'matching', title: '匹配题', english: 'Matching', note: 'TRACK EACH ITEM' },
]

function loadIdList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function audioFilename(url = '') {
  try { return decodeURIComponent(url.split('/').pop() ?? '') } catch { return url.split('/').pop() ?? '' }
}

function saveIdList(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids))
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [testId, setTestId] = useState(() => localStorage.getItem('ielts-listening-selected-test-id') || tests[0]?.id || '')
  const [selectedListeningPart, setSelectedListeningPart] = useState(() => {
    const storedPart = localStorage.getItem('ielts-listening-selected-part')
    return listeningParts.includes(storedPart) ? storedPart : getListeningPart(tests[0])
  })
  const [speakingTargetId, setSpeakingTargetId] = useState('')
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [activeTab, setActiveTab] = useState('practice')
  const [activeClip, setActiveClip] = useState(null)
  const [reviewUnlocked, setReviewUnlocked] = useState(false)
  const [reviewTab, setReviewTab] = useState('practice')
  const [loopSentenceId, setLoopSentenceId] = useState(null)
  const [speakingVocabulary, setSpeakingVocabulary] = useState(loadSpeakingVocabulary)
  const [localTests, setLocalTests] = useState(loadLocalTests)
  const [localSpeakingLessons, setLocalSpeakingLessons] = useState(loadLocalSpeakingLessons)
  const [audioFiles, setAudioFiles] = useState([])
  const [audioLibraryError, setAudioLibraryError] = useState('')
  const [deletedTestIds, setDeletedTestIds] = useState(() => loadIdList('ielts-deleted-test-ids'))
  const [deletedSpeakingIds, setDeletedSpeakingIds] = useState(() => [...new Set([...loadIdList('ielts-deleted-speaking-ids'), ...loadIdList('deletedSpeakingIds')])])
  const [mindMapDrafts, setMindMapDrafts] = useState({})
  const [deleteTestOpen, setDeleteTestOpen] = useState(false)
  const [deleteAudioWithTest, setDeleteAudioWithTest] = useState(false)
  const [deleteFeedback, setDeleteFeedback] = useState('')
  const [whiteboardText, setWhiteboardText] = useState('')
  const [whiteboardExpanded, setWhiteboardExpanded] = useState(false)
  const [testSaveError, setTestSaveError] = useState('')
  const testWriteQueue = useRef(Promise.resolve())
  useEffect(() => {
    try {
      localStorage.removeItem('ielts-speaking-ai-settings')
      localStorage.removeItem('ielts-question-bank-ai-settings')
    } catch {
      return
    }
  }, [])
  useEffect(() => {
    listAudioFiles().then(({ files }) => setAudioFiles(files)).catch((error) => setAudioLibraryError(error.message))
  }, [])
  useEffect(() => {
    document.title = 'SHARON IELTS STUDIO'
  }, [])
  const allTests = useMemo(() => [...new Map([...tests, ...localTests].filter((item) => !deletedTestIds.includes(item.id)).map((item) => {
    const normalized = attachTranscriptReferences({ ...item, part: getListeningPart(item), questions: item.questions.map(normalizeQuestionType) })
    return [item.id, normalized]
  })).values()], [localTests, deletedTestIds])
  const allSpeakingLessons = useMemo(() => [...new Map([...speakingLessons, ...localSpeakingLessons].filter((item) => !deletedSpeakingIds.includes(item.id)).map((item) => [item.id, item])).values()], [localSpeakingLessons, deletedSpeakingIds])
  const test = allTests.find((item) => item.id === testId) ?? allTests[0]
  const listeningTestsForPart = useMemo(() => sortByEnglishTitle(allTests.filter((item) => getListeningPart(item) === selectedListeningPart), (item) => cleanListeningTitle(item.title)), [allTests, selectedListeningPart])
  const sortedSpeakingLessons = useMemo(() => sortByEnglishTitle(allSpeakingLessons, getSpeakingTitle), [allSpeakingLessons])
  const grouped = useMemo(() => sections.map((section) => ({ ...section, questions: (test?.questions ?? []).filter((question) => question.type === section.id) })), [test])
  useEffect(() => {
    if (allTests.length && !allTests.some((item) => item.id === testId)) {
      setTestId(allTests[0].id)
      setSelectedListeningPart(getListeningPart(allTests[0]))
    }
  }, [allTests, testId])
  useEffect(() => {
    if (test && getListeningPart(test) !== selectedListeningPart) setSelectedListeningPart(getListeningPart(test))
  }, [test, selectedListeningPart])
  useEffect(() => {
    if (testId) localStorage.setItem('ielts-listening-selected-test-id', testId)
  }, [testId])
  useEffect(() => {
    localStorage.setItem('ielts-listening-selected-part', selectedListeningPart)
  }, [selectedListeningPart])
  if (!test) return <div className="app-shell"><main className="empty-library-state"><h2>当前没有可用的听力套题</h2><p>你可以继续管理口语课程，或从教研导入台添加新的听力套题。</p>{deleteFeedback && <p className="delete-status-message" role="status">{deleteFeedback}</p>}<div className="empty-library-actions"><button className="speaking-secondary-action" onClick={() => setActiveTab('question-bank')}>🎧 导入听力材料</button><button className="speaking-secondary-action" onClick={() => setActiveTab('speaking')}>🗣️ 口语材料</button></div>{activeTab === 'question-bank' && <QuestionBankStudio topics={allTests} audioFiles={audioFiles} audioLibraryError={audioLibraryError} onUploadAudio={uploadAudio} onUploadMapImage={uploadMapImage} onDeleteMapImage={deleteMapImage} onDeleteAudio={deleteAudio} onSaveTest={addTestToLibrary} onSaveTranscript={saveTranscriptToTest} onUpdateTestPart={updateTestPart} onNavigateSpeaking={() => setActiveTab('speaking')} />}{activeTab === 'speaking' && <SpeakingStudio lessons={allSpeakingLessons} audioFiles={audioFiles} onUploadAudio={uploadAudio} onUploadSpeakingImage={uploadSpeakingImage} onDeleteSpeakingLesson={deleteSpeakingLesson} onSaveSpeakingLesson={addSpeakingLesson} selectedLessonId={speakingTargetId} mindMapDrafts={mindMapDrafts} onMindMapDraftChange={changeMindMapDraft} onMindMapSave={saveMindMap} onMindMapReset={resetMindMapDraft} />}</main><TeachingWhiteboard text={whiteboardText} onTextChange={setWhiteboardText} expanded={whiteboardExpanded} onToggleExpanded={() => setWhiteboardExpanded((value) => !value)} /></div>
  const duration = Math.max(1, ...test.transcript.map((segment) => Number.isFinite(segment.endTime) ? segment.endTime : 0))
  const score = test.questions.reduce((total, question) => {
    const answer = answers[question.id]
    if (question.type === 'matching') return total + question.items.filter((item) => answer?.[item.itemId] === item.correctAnswer).length
    if (question.type === 'multiple_choice') return total + (Array.isArray(answer) && [...answer].sort().join() === [...question.correctAnswer].sort().join() ? 1 : 0)
    if (question.type === 'fill_blank') return total + (question.correctAnswer.some((value) => value.toLowerCase() === (answer ?? '').trim().toLowerCase()) ? 1 : 0)
    return total + (answer === question.correctAnswer ? 1 : 0)
  }, 0)
  const totalScore = test.questions.reduce((total, question) => total + (question.type === 'matching' ? question.items.length : 1), 0)
  const vocabulary = getTopicVocabulary(allTests, allSpeakingLessons)

  function persistTestUpdate(updatedTest) {
    const normalizedTest = attachTranscriptReferences(updatedTest)
    const next = [...localTests.filter((item) => item.id !== normalizedTest.id), normalizedTest]
    if (!saveLocalTests(next)) {
      setTestSaveError('套题保存失败：无法写入当前浏览器的套题数据。')
      return false
    }
    setLocalTests(next)
    setTestSaveError('')
    const write = testWriteQueue.current.catch(() => undefined).then(() => writeLessonToDisk('listening', normalizedTest))
    testWriteQueue.current = write.then(() => undefined, () => undefined)
    write.catch((error) => setTestSaveError(`浏览器套题数据已保存；本地 JSON 写入失败：${error.message}`))
    return true
  }

  async function saveTestData(updatedTest) {
    const normalizedTest = attachTranscriptReferences(updatedTest)
    const next = [...localTests.filter((item) => item.id !== normalizedTest.id), normalizedTest]
    if (!saveLocalTests(next)) return { browserSaved: false, error: '浏览器存储空间不足，无法保存套题。' }
    setLocalTests(next)
    const write = testWriteQueue.current.catch(() => undefined).then(() => writeLessonToDisk('listening', normalizedTest))
    testWriteQueue.current = write.then(() => undefined, () => undefined)
    try {
      const result = await write
      return { browserSaved: true, diskSaved: true, diskPath: result.path }
    } catch (error) {
      return { browserSaved: true, diskSaved: false, diskError: error.message }
    }
  }

  async function saveTranscriptToTest(targetId, transcriptData) {
    const selectedTest = targetId ? allTests.find((item) => item.id === targetId) : null
    const draftTest = transcriptData.draftTest
    const rawId = draftTest?.id || transcriptData.draftId || `transcript-${Date.now()}`
    const safeId = rawId.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || `transcript-${Date.now()}`
    const baseTest = selectedTest ?? draftTest ?? {
      id: safeId,
      title: transcriptData.title.trim() || '新建听力原文套题',
      topicCategory: transcriptData.topicCategory.trim() || '未分类',
      audioUrl: transcriptData.audioUrl,
      questions: [],
      keySentences: [],
      vocabulary: [],
      mindMap: { label: transcriptData.title.trim() || 'Listening Transcript', children: [] },
    }
    const result = await saveTestData({
      ...baseTest,
      rawTranscript: transcriptData.rawTranscript,
      transcript: transcriptData.transcript,
      audioUrl: transcriptData.audioUrl || baseTest.audioUrl || '',
    })
    if (result.browserSaved) {
      setTestId(baseTest.id)
      setActiveTab('practice')
      setReviewTab('transcript')
      setAnswers({})
      setSubmitted(false)
      setCurrentTime(0)
      setPlaying(false)
      setActiveClip(null)
    }
    return result
  }

  function updateTimestamp(ref, target, updateStart) {
    if (!target || !test) return
    if (!Number.isFinite(ref.startTime) || !Number.isFinite(ref.endTime)) return
    const startTime = ref.startTime
    const endTime = ref.endTime
    const nextStartTime = Math.max(0, updateStart(startTime))
    const shift = nextStartTime - startTime
    const nextRef = { startTime: nextStartTime, endTime: Math.max(nextStartTime + 0.25, endTime + shift), timestampOverride: true }
    let updatedTest = test
    if (target.sentenceId) {
      updatedTest = { ...test, keySentences: test.keySentences.map((sentence) => sentence.id === target.sentenceId ? { ...sentence, ...nextRef } : sentence) }
    } else {
      updatedTest = {
        ...test,
        questions: test.questions.map((question) => {
          if (question.id !== target.questionId) return question
          if (target.itemId) {
            const item = question.items?.find((entry) => entry.itemId === target.itemId)
            if (item && (item.startTime != null || item.endTime != null)) {
              return { ...question, items: question.items.map((entry) => entry.itemId === target.itemId ? { ...entry, ...nextRef } : entry) }
            }
          }
          return question.audioRef ? { ...question, audioRef: { ...question.audioRef, ...nextRef } } : question
        }),
      }
    }
    persistTestUpdate(updatedTest)
  }

  function adjustTimestamp(ref, seconds, target) {
    updateTimestamp(ref, target, (startTime) => startTime + seconds)
  }

  function setTimestampToCurrent(ref, target) {
    updateTimestamp(ref, target, () => currentTime)
  }

  function addSpeakingVocabulary(items) {
    setSpeakingVocabulary((current) => {
      const merged = new Map([...current, ...items].map((item) => [`${item.sourceTestId}:${item.id}`, item]))
      const next = [...merged.values()]
      saveSpeakingVocabulary(next)
      return next
    })
  }

  async function addTestToLibrary(newTest) {
    newTest = attachTranscriptReferences(newTest)
    const next = [...localTests.filter((item) => item.id !== newTest.id), newTest]
    if (!saveLocalTests(next)) return false
    setLocalTests(next)
    const visibleIds = deletedTestIds.filter((id) => id !== newTest.id)
    setDeletedTestIds(visibleIds)
    const hiddenListSaved = saveIdList('ielts-deleted-test-ids', visibleIds)
    setTestId(newTest.id)
    setAnswers({})
    setSubmitted(false)
    setCurrentTime(0)
    setPlaying(false)
    setActiveClip(null)
    setReviewUnlocked(false)
    setReviewTab('practice')
    setLoopSentenceId(null)
    try {
      const disk = await writeLessonToDisk('listening', newTest)
      return { browserSaved: true, diskSaved: true, diskPath: disk.path, warning: hiddenListSaved ? '' : '删除记录无法持久保存，刷新后可能恢复已删数据' }
    } catch (error) {
      return { browserSaved: true, diskSaved: false, diskError: error.message, warning: hiddenListSaved ? '' : '删除记录无法持久保存，刷新后可能恢复已删数据' }
    }
  }

  async function addSpeakingLesson(newLesson, oldId = '') {
    const previousId = oldId && oldId !== newLesson.id ? oldId : ''
    if (previousId) {
      newLesson = {
        ...newLesson,
        vocabulary: (newLesson.vocabulary ?? []).map((item) => ({ ...item, sourceTestId: newLesson.id })),
        ...(newLesson.sets ? { sets: newLesson.sets.map((set) => ({ ...set, vocabulary: (set.vocabulary ?? []).map((item) => ({ ...item, sourceTestId: newLesson.id })) })) } : {}),
      }
    }
    const remappedSpeakingVocabulary = previousId
      ? speakingVocabulary.map((item) => item.sourceTestId === previousId ? { ...item, sourceTestId: newLesson.id } : item)
      : speakingVocabulary
    const next = [...localSpeakingLessons.filter((item) => item.id !== newLesson.id && item.id !== previousId), newLesson]
    if (!saveLocalSpeakingLessons(next)) return false
    if (previousId && !saveSpeakingVocabulary(remappedSpeakingVocabulary)) {
      saveLocalSpeakingLessons(localSpeakingLessons)
      return false
    }
    setLocalSpeakingLessons(next)
    if (previousId) setSpeakingVocabulary(remappedSpeakingVocabulary)
    const visibleIds = [...new Set([...deletedSpeakingIds.filter((id) => id !== newLesson.id), ...(previousId ? [previousId] : [])])]
    setDeletedSpeakingIds(visibleIds)
    const hiddenListSaved = saveIdList('ielts-deleted-speaking-ids', visibleIds) && saveIdList('deletedSpeakingIds', visibleIds)
    try {
      const disk = previousId ? await replaceLessonOnDisk('speaking', previousId, newLesson) : await writeLessonToDisk('speaking', newLesson)
      return { browserSaved: true, diskSaved: true, diskPath: disk.path, warning: hiddenListSaved ? '' : '删除记录无法持久保存，刷新后可能恢复已删数据' }
    } catch (error) {
      return { browserSaved: true, diskSaved: false, diskError: error.message, warning: hiddenListSaved ? '' : '删除记录无法持久保存，刷新后可能恢复已删数据' }
    }
  }

  async function deleteSpeakingLesson(lesson, options = {}) {
    async function deleteAssociatedAudio(warnings) {
      if (!options.deleteAudio) return
      const audioUrls = options.audioUrls ?? [options.audioUrl || lesson.audioUrl]
      for (const url of [...new Set(audioUrls.filter((item) => item?.startsWith('/audio/')))]) {
        try { await deleteAudio(audioFilename(url)) } catch (error) { warnings.push(`音频删除失败：${error.message}`) }
      }
    }
    if (options.setId && lesson.sets?.length) {
      const diskResult = await deleteSpeakingSetFromDisk(lesson.id, options.setId)
      const removedSet = lesson.sets.find((set) => set.id === options.setId)
      const remainingSets = lesson.sets.filter((set) => set.id !== options.setId)
      if (!diskResult.lessonDeleted && remainingSets.length) {
        const updated = {
          ...lesson,
          sets: remainingSets,
          vocabulary: remainingSets.flatMap((set) => set.vocabulary ?? []),
          mindMap: {
            label: lesson.topicCategory || 'Speaking Topics',
            children: remainingSets.map((set) => ({
              label: set.label,
              children: [{ label: set.mindMap?.label || set.topicCategory || set.label, children: set.mindMap?.children ?? [] }],
            })),
          },
        }
        const next = [...localSpeakingLessons.filter((item) => item.id !== lesson.id), updated]
        if (!saveLocalSpeakingLessons(next)) {
          try { await writeLessonToDisk('speaking', lesson) } catch (error) { throw new Error(`浏览器缓存失败，且无法恢复硬盘原文件：${error.message}`) }
          throw new Error('浏览器口语课程缓存未能更新，已恢复硬盘原文件。')
        }
        setLocalSpeakingLessons(next)
        const removedVocabulary = removedSet?.vocabulary ?? []
        const remainingLegacyVocabulary = speakingVocabulary.filter((item) => item.sourceTestId !== lesson.id || !removedVocabulary.some((word) => word.id === item.id || word.term.toLowerCase() === item.term.toLowerCase()))
        if (!saveSpeakingVocabulary(remainingLegacyVocabulary)) {
          saveLocalSpeakingLessons(localSpeakingLessons)
          setLocalSpeakingLessons(localSpeakingLessons)
          try { await writeLessonToDisk('speaking', lesson) } catch (error) { throw new Error(`口语词库缓存失败，且无法恢复硬盘原文件：${error.message}`) }
          throw new Error('浏览器口语词库缓存未能更新，已恢复原课程数据。')
        }
        setSpeakingVocabulary(remainingLegacyVocabulary)
        const saved = await writeLessonToDisk('speaking', updated)
        const warnings = []
        await deleteAssociatedAudio(warnings)
        return warnings.join('；')
      }
    } else {
    await deleteLessonFromDisk('speaking', lesson.id)
    }
    const next = localSpeakingLessons.filter((item) => item.id !== lesson.id)
    const warnings = []
    if (!saveLocalSpeakingLessons(next)) warnings.push('浏览器口语课程缓存未能写入')
    setLocalSpeakingLessons(next)
    const remainingVocabulary = speakingVocabulary.filter((item) => item.sourceTestId !== lesson.id)
    if (!saveSpeakingVocabulary(remainingVocabulary)) warnings.push('浏览器口语词库缓存未能更新')
    setSpeakingVocabulary(remainingVocabulary)
    const hidden = [...new Set([...deletedSpeakingIds, lesson.id])]
    setDeletedSpeakingIds(hidden)
    try {
      localStorage.setItem('ielts-deleted-speaking-ids', JSON.stringify(hidden))
      localStorage.setItem('deletedSpeakingIds', JSON.stringify(hidden))
    } catch { warnings.push('无法持久化删除记录') }
    await deleteAssociatedAudio(warnings)
    return warnings.join('；')
  }

  async function updateVocabularyItem(item) {
    const test = allTests.find((entry) => entry.id === item.sourceTestId)
    if (test) {
      const updated = { ...test, vocabulary: item.deleted ? test.vocabulary.filter((word) => word.id !== item.id) : test.vocabulary.map((word) => word.id === item.id ? item : word) }
      const result = await saveTestData(updated)
      if (!result.browserSaved || !result.diskSaved) throw new Error(result.error || result.diskError || '听力词汇写盘失败。')
      return
    }
    const lesson = allSpeakingLessons.find((entry) => entry.id === item.sourceTestId)
    if (!lesson) {
      const legacy = speakingVocabulary.find((word) => word.sourceTestId === item.sourceTestId && word.id === item.id)
      if (!legacy) throw new Error('找不到该词条所属的课程，无法保存修改。')
      const next = item.deleted ? speakingVocabulary.filter((word) => word !== legacy) : speakingVocabulary.map((word) => word === legacy ? item : word)
      if (!saveSpeakingVocabulary(next)) throw new Error('本地词库写入失败。')
      setSpeakingVocabulary(next)
      return
    }
    const setIndex = lesson.sets?.findIndex((set) => set.vocabulary?.some((word) => word.id === item.id)) ?? -1
    const sets = setIndex >= 0 ? lesson.sets.map((set) => ({
      ...set,
      vocabulary: item.deleted
        ? set.vocabulary.filter((word) => word.id !== item.id)
        : set.vocabulary.map((word) => word.id === item.id ? item : word),
    })) : lesson.sets
    const originalVocabulary = lesson.vocabulary ?? []
    const updated = {
      ...lesson,
      ...(sets ? { sets, vocabulary: sets.flatMap((set) => set.vocabulary ?? []) } : {
        vocabulary: item.deleted ? originalVocabulary.filter((word) => word.id !== item.id) : originalVocabulary.map((word) => word.id === item.id ? item : word),
      }),
    }
    const result = await addSpeakingLesson(updated)
    if (!result?.browserSaved || !result.diskSaved) throw new Error(result?.diskError || '口语词汇写盘失败。')
  }

  async function renameVocabularyCategory(previousName, nextName) {
    const oldName = String(previousName ?? '').trim().replace(/^[【\[]+/, '').replace(/[】\]]+$/, '').trim()
    const category = String(nextName ?? '').trim().replace(/^[【\[]+/, '').replace(/[】\]]+$/, '').trim()
    if (!category) throw new Error('分类名称不能为空。')
    const updatedTests = allTests.filter((entry) => (entry.vocabulary ?? []).some((item) => normalizeTopicCategory(item.topicCategory) === oldName)).map((entry) => ({
      ...entry,
      topicCategory: normalizeTopicCategory(entry.topicCategory) === oldName ? category : entry.topicCategory,
      vocabulary: (entry.vocabulary ?? []).map((item) => normalizeTopicCategory(item.topicCategory) === oldName ? { ...item, topicCategory: category } : item),
    }))
    const updatedLessons = allSpeakingLessons.filter((entry) => (entry.vocabulary ?? []).some((item) => normalizeTopicCategory(item.topicCategory) === oldName)).map((entry) => ({
      ...entry,
      topicCategory: normalizeTopicCategory(entry.topicCategory) === oldName ? category : entry.topicCategory,
      vocabulary: (entry.vocabulary ?? []).map((item) => normalizeTopicCategory(item.topicCategory) === oldName ? { ...item, topicCategory: category } : item),
      ...(entry.sets ? { sets: entry.sets.map((set) => ({
        ...set,
        vocabulary: (set.vocabulary ?? []).map((item) => normalizeTopicCategory(item.topicCategory) === oldName ? { ...item, topicCategory: category } : item),
      })) } : {}),
    }))
    const nextTests = [...localTests.filter((entry) => !updatedTests.some((updated) => updated.id === entry.id)), ...updatedTests]
    const nextLessons = [...localSpeakingLessons.filter((entry) => !updatedLessons.some((updated) => updated.id === entry.id)), ...updatedLessons]
    if (!saveLocalTests(nextTests) || !saveLocalSpeakingLessons(nextLessons)) throw new Error('浏览器本地存储失败，分类未保存。')
    setLocalTests(nextTests)
    setLocalSpeakingLessons(nextLessons)
    const nextLegacyVocabulary = speakingVocabulary.map((item) => normalizeTopicCategory(item.topicCategory) === oldName ? { ...item, topicCategory: category } : item)
    if (!saveSpeakingVocabulary(nextLegacyVocabulary)) throw new Error('旧版口语词库缓存写入失败。')
    setSpeakingVocabulary(nextLegacyVocabulary)
    await Promise.all([...updatedTests.map((entry) => writeLessonToDisk('listening', entry)), ...updatedLessons.map((entry) => writeLessonToDisk('speaking', entry))])
  }

  function changeMindMapDraft(key, value) {
    setMindMapDrafts((current) => ({ ...current, [key]: value }))
  }

  function resetMindMapDraft(key) {
    setMindMapDrafts((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function saveMindMap(kind, lesson, setId, map) {
    let updated
    if (setId && lesson.sets) {
      updated = { ...lesson, sets: lesson.sets.map((set) => set.id === setId ? { ...set, mindMap: map } : set) }
    } else updated = { ...lesson, mindMap: map }
    const result = kind === 'speaking' ? await addSpeakingLesson(updated) : await saveTestData(updated)
    if (!result?.browserSaved || !result.diskSaved) throw new Error(result?.diskError || '导图保存失败。')
    resetMindMapDraft(`${kind}:${lesson.id}${setId ? `:${setId}` : ''}`)
  }

  async function deleteCurrentTest() {
    const audioName = test.audioUrl?.startsWith('/audio/') ? audioFilename(test.audioUrl) : ''
    try {
      await deleteLessonFromDisk('listening', test.id)
      const next = localTests.filter((item) => item.id !== test.id)
      const warnings = []
      if (!saveLocalTests(next)) warnings.push('浏览器本地题库缓存未能写入')
      setLocalTests(next)
      const remainingVocabulary = speakingVocabulary.filter((item) => item.sourceTestId !== test.id)
      if (!saveSpeakingVocabulary(remainingVocabulary)) warnings.push('浏览器词库缓存未能更新')
      setSpeakingVocabulary(remainingVocabulary)
      const hidden = [...new Set([...deletedTestIds, test.id])]
      setDeletedTestIds(hidden)
      try { localStorage.setItem('ielts-deleted-test-ids', JSON.stringify(hidden)) } catch { warnings.push('无法持久化删除记录') }
      if (deleteAudioWithTest && audioName) {
        try {
          await deleteAudioFromDisk(audioName)
          setAudioFiles((files) => files.filter((file) => file.name !== audioName))
        } catch (error) {
          warnings.push(`套题已删除，但音频删除失败：${error.message}`)
        }
      }
      const nextTest = allTests.find((item) => item.id !== test.id)
      if (nextTest) changeTest(nextTest.id)
      setDeleteTestOpen(false)
      setDeleteFeedback(warnings.length ? `删除完成，但有提示：${warnings.join('；')}` : '当前套题已删除。')
    } catch (error) {
      setDeleteFeedback(`删除失败：${error.message}`)
    }
  }

  async function deleteAudio(name) {
    await deleteAudioFromDisk(name)
    setAudioFiles((files) => files.filter((file) => file.name !== name))
  }

  async function bindAudioToTest(audioUrl) {
    if (!audioUrl) return false
    const updatedTest = { ...test, audioUrl }
    const next = [...localTests.filter((item) => item.id !== updatedTest.id), updatedTest]
    if (!saveLocalTests(next)) return false
    setLocalTests(next)
    setCurrentTime(0)
    setPlaying(false)
    setActiveClip(null)
    try {
      const disk = await writeLessonToDisk('listening', updatedTest)
      return { browserSaved: true, diskSaved: true, diskPath: disk.path }
    } catch (error) {
      return { browserSaved: true, diskSaved: false, diskError: error.message }
    }
  }

  async function uploadAudio(file) {
    const result = await uploadAudioToDisk(file)
    setAudioFiles((current) => [...current.filter((item) => item.name !== result.name), { name: result.name, url: result.url }].sort((left, right) => left.name.localeCompare(right.name)))
    return result
  }

  async function uploadMapImage(file) {
    const result = await uploadMapImageToDisk(file)
    return result
  }

  async function uploadSpeakingImage(file) {
    try {
      const result = await uploadSpeakingImageToDisk(file)
      return result
    } catch {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve({ url: reader.result, name: file.name })
        reader.readAsDataURL(file)
      })
    }
  }

  async function deleteMapImage(url) {
    await deleteMapImageFromDisk(url)
  }

  function changeTest(nextId) {
    setTestId(nextId)
    setAnswers({})
    setSubmitted(false)
    setCurrentTime(0)
    setPlaying(false)
    setActiveClip(null)
    setReviewUnlocked(false)
    setReviewTab('practice')
    setLoopSentenceId(null)
  }

  function changeListeningPart(nextPart) {
    setSelectedListeningPart(nextPart)
    const nextTest = sortByEnglishTitle(allTests.filter((item) => getListeningPart(item) === nextPart), (item) => cleanListeningTitle(item.title))[0]
    if (nextTest) changeTest(nextTest.id)
  }

  async function updateTestPart(target, part) {
    const result = await saveTestData({ ...target, part })
    if (result.browserSaved) {
      setSelectedListeningPart(part)
      setTestId(target.id)
    }
    return result
  }

  function locate(ref) {
    if (!Number.isFinite(ref.startTime) || !Number.isFinite(ref.endTime)) return
    const startTime = Math.max(0, ref.startTime)
    const endTime = Math.max(startTime + 0.25, ref.endTime)
    setCurrentTime(startTime)
    setActiveClip({ ...ref, startTime, endTime, loop: ref.loop ?? ref.id === loopSentenceId })
    setPlaying(true)
  }

  function playSentence(sentence) {
    if (activeClip?.id === sentence.id && playing) setPlaying(false)
    else locate(sentence)
  }

  function toggleSentenceLoop(sentence, enabled) {
    setLoopSentenceId(enabled ? sentence.id : null)
    setActiveClip((clip) => clip ? { ...clip, loop: enabled && clip.id === sentence.id } : clip)
  }

  function handleSeek(time) {
    setCurrentTime(time)
    if (activeClip && (time < activeClip.startTime || time >= activeClip.endTime)) setActiveClip(null)
  }

  function submit() {
    setSubmitted(true)
    setActiveClip(null)
  }

  const tabItems = [
    { id: 'practice', label: '听力练习', icon: Headphones },
    { id: 'speaking', label: '口语练习', icon: Mic2 },
    { id: 'vocabulary', label: '话题分类词库', icon: BookOpen },
    { id: 'arcade', label: '游戏闯关', icon: Gamepad2 },
    { id: 'question-bank', label: '导入/生成新真题', icon: Download }
  ]
  return <div className="app-shell">
    <header className="topbar"><a className="wordmark" href="#top"><span className="brand-icon"><Volume2 size={18} /></span><span className="wordmark-text"><strong>Sharon</strong><i>IELTS STUDIO</i></span></a><nav className="main-nav">{tabItems.map(({ id, label, icon: Icon }) => <button className={activeTab === id ? 'nav-item active' : 'nav-item'} key={id} onClick={() => setActiveTab(id)}><Icon size={16} />{label}</button>)}</nav><div className="top-meta"><span className="status-dot" />学习进度已保存在本地</div></header>
    <TeachingWhiteboard text={whiteboardText} onTextChange={setWhiteboardText} expanded={whiteboardExpanded} onToggleExpanded={() => setWhiteboardExpanded((value) => !value)} />
    <main id="top">
      <div className="page-heading"><div><div className="eyebrow"><span>{activeTab === 'speaking' ? 'SPEAKING STUDIO' : activeTab === 'vocabulary' ? 'VOCABULARY STUDIO' : activeTab === 'arcade' ? 'ARCADE ARENA' : activeTab === 'question-bank' ? 'QUESTION BANK WORKSHOP' : 'LISTENING PRACTICE'}</span><span className="eyebrow-line" />{activeTab === 'practice' ? '01 / 05' : activeTab === 'speaking' ? '02 / 05' : activeTab === 'vocabulary' ? '03 / 05' : activeTab === 'arcade' ? '04 / 05' : '05 / 05'}</div><h1>{activeTab === 'practice' ? '听懂每一个细节。' : activeTab === 'speaking' ? '让表达更清晰。' : activeTab === 'vocabulary' ? '把话题词汇，变成自己的。' : activeTab === 'arcade' ? '高频词块与考点句沉浸闯关。' : '把教研资料，转成可练真题。'}</h1>{activeTab !== 'question-bank' && <p>{activeTab === 'practice' ? '按真实考试节奏练习，定位每一次听力判断。' : activeTab === 'speaking' ? '围绕熟悉的话题搭建观点、例证与地道表达。' : activeTab === 'vocabulary' ? '跨套题整理高频表达，按场景建立词汇连接。' : '雅思 7.5 分词块消消乐与磁吸长难句拼图，用肌肉记忆攻克考点。'}</p>}</div></div>
      {activeTab === 'practice' ? <>
        <section className="test-select-row"><label htmlFor="listening-part-select"><span className="select-kicker">CURRENT TEST · PART</span><span className="select-control"><select id="listening-part-select" value={selectedListeningPart} onChange={(event) => changeListeningPart(event.target.value)}>{listeningParts.map((part) => <option key={part} disabled={!allTests.some((item) => getListeningPart(item) === part)}>{part}</option>)}</select><ChevronDown size={16} /></span></label><label htmlFor="test-select"><span className="select-kicker">SPECIFIC TEST</span><span className="select-control"><select id="test-select" value={testId} onChange={(event) => changeTest(event.target.value)}>{listeningTestsForPart.map((item) => <option value={item.id} key={item.id}>{cleanListeningTitle(item.title)}</option>)}</select><ChevronDown size={16} /></span></label><QuickTestFinder items={allTests} getItemTitle={(item) => cleanListeningTitle(item.title)} getItemPart={(item) => getListeningPart(item)} getItemTopic={(item) => item.topicCategory} onSelect={(targetTest) => { const part = getListeningPart(targetTest); setSelectedListeningPart(part); changeTest(targetTest.id) }} placeholder="快速检索听力题目..." /><button className="delete-test-button" onClick={() => { setDeleteFeedback(''); setDeleteTestOpen(true) }}><Trash2 size={15} />删除当前套题</button><div className="test-topic"><span className="topic-dot" />{test.topicCategory}</div><div className="test-count"><span>{test.questions.length}</span> QUESTIONS <span className="count-divider" /> <span>{new Set(test.questions.map((question) => question.type)).size}</span> TYPES</div></section>
        {deleteFeedback && !deleteTestOpen && <p className="delete-status-message" role="status">{deleteFeedback}</p>}
        <AudioPlayer key={`${test.id}-${test.audioUrl}`} audioUrl={test.audioUrl} audioFiles={audioFiles} audioLibraryError={audioLibraryError} duration={duration} currentTime={currentTime} playing={playing} rate={rate} activeClip={activeClip} keySentences={test?.keySentences ?? []} onBindAudio={bindAudioToTest} onUploadAudio={uploadAudio} onDeleteAudio={deleteAudio} onToggle={() => setPlaying(!playing)} onSetPlaying={setPlaying} onSeek={handleSeek} onRateChange={setRate} onPlaybackEnd={() => setPlaying(false)} />
        <div className="practice-tabs" role="tablist" aria-label="听力学习模式">
          <button className={`practice-tab ${reviewTab === 'practice' ? 'active' : ''}`} role="tab" aria-selected={reviewTab === 'practice'} onClick={() => setReviewTab('practice')}><Headphones size={15} />听力练习</button>
          <button className={`practice-tab ${reviewTab === 'sentences' ? 'active' : ''}`} role="tab" aria-selected={reviewTab === 'sentences'} disabled={!submitted && !reviewUnlocked} onClick={() => setReviewTab('sentences')}><Volume2 size={15} />精听考点句</button>
          <button className={`practice-tab ${reviewTab === 'mindmap' ? 'active' : ''}`} role="tab" aria-selected={reviewTab === 'mindmap'} disabled={!submitted && !reviewUnlocked} onClick={() => setReviewTab('mindmap')}><Sparkles size={15} />思维导图</button>
          <button className={`practice-tab ${reviewTab === 'vocabulary' ? 'active' : ''}`} role="tab" aria-selected={reviewTab === 'vocabulary'} disabled={!submitted && !reviewUnlocked} onClick={() => setReviewTab('vocabulary')}><BookOpen size={15} />本篇核心词汇</button>
          <button className={`practice-tab ${reviewTab === 'transcript' ? 'active' : ''}`} role="tab" aria-selected={reviewTab === 'transcript'} onClick={() => setReviewTab('transcript')}><FileText size={15} />原文泛听</button>
          {!submitted && !reviewUnlocked && <div className="review-lock-note"><LockKeyhole size={14} /><span>提交判分后解锁复习</span><button onClick={() => { setReviewUnlocked(true); setReviewTab('sentences') }}>直接解锁复习模式</button></div>}
        </div>
        {testSaveError && <p className="test-save-error" role="alert">{testSaveError}</p>}
        {reviewTab === 'practice' ? <>
        <div className="section-heading"><div><span className="section-index">01</span><div><h2>答题区域</h2><p>Answer the questions as you listen</p></div></div><div className="autosave"><CircleHelp size={14} />共 {totalScore} 个计分点</div></div>
        {submitted && <div className="score-banner"><span className="score-icon"><Check size={18} /></span><div><strong>本套练习已完成</strong><span>继续复盘答错的题目，点击定位按钮可回听原句。</span></div><b>{score}<small> / {totalScore}</small></b></div>}
        <IeltsHighlighter>
          <ScrollReveal className="question-sections">{grouped.map((group) => <section className="question-section" key={group.id}><div className="question-section-heading"><div><span>{group.note}</span><h2>{group.title}<small>{group.english}</small></h2></div><span className="section-count">{String(group.questions.length).padStart(2, '0')}</span></div>{group.id === 'fill_blank' ? <FillBlankSheet questions={group.questions} getNumber={(question) => test.questions.indexOf(question) + 1} answers={answers} submitted={submitted} onChange={(questionId, value) => setAnswers({ ...answers, [questionId]: value })} onLocate={locate} onAdjustTime={adjustTimestamp} onSetTimeToCurrent={setTimestampToCurrent} /> : <div className={group.id === 'matching' && test.mapImageUrl ? 'matching-map-layout' : 'question-list'}>{group.id === 'matching' && test.mapImageUrl && <MapImage src={test.mapImageUrl} title={`${test.title} 地图题`} />}{group.id === 'matching' && test.mapImageUrl ? <div className="question-list">{group.questions.map((question) => <QuestionCard key={question.id} question={question} vocabulary={test.vocabulary} number={test.questions.indexOf(question) + 1} answer={answers[question.id]} submitted={submitted} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} onLocate={locate} onAdjustTime={adjustTimestamp} onSetTimeToCurrent={setTimestampToCurrent} />)}</div> : group.questions.map((question) => <QuestionCard key={question.id} question={question} vocabulary={test.vocabulary} number={test.questions.indexOf(question) + 1} answer={answers[question.id]} submitted={submitted} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} onLocate={locate} onAdjustTime={adjustTimestamp} onSetTimeToCurrent={setTimestampToCurrent} />)}</div>}</section>)}</ScrollReveal>
        </IeltsHighlighter>
        <div className="submit-row"><div><span className="submit-mark"><Check size={13} /></span><span>答案仅保存在当前浏览器</span></div><button className="submit-button" onClick={submit}>{submitted ? <><RotateCcw size={16} />重新核对</> : <>提交判分 <span>→</span></>}</button></div>
        </> : reviewTab === 'sentences' ? <KeySentenceTrainer key={test.id} sentences={test.keySentences} loopSentenceId={loopSentenceId} playingSentenceId={playing && activeClip?.id ? activeClip.id : null} onPlay={playSentence} onToggleLoop={toggleSentenceLoop} onAdjustTime={(sentence, seconds) => adjustTimestamp(sentence, seconds, { sentenceId: sentence.id })} onSetTimeToCurrent={(sentence) => setTimestampToCurrent(sentence, { sentenceId: sentence.id })} /> : reviewTab === 'transcript' ? <TranscriptListening key={test.id} transcript={test.transcript} currentTime={currentTime} onPlaySegment={locate} vocabulary={test.vocabulary} /> : reviewTab === 'mindmap' ? <section className="study-panel map-panel review-map-panel"><div className="study-panel-heading"><div><span className="eyebrow-small">ENGLISH OVERVIEW</span><h2>听力逻辑思维导图</h2></div><span className="map-mark">MAP</span></div><MindMap key={test.id} data={mindMapDrafts[`listening:${test.id}`] ?? test.mindMap} editable dirty={Boolean(mindMapDrafts[`listening:${test.id}`])} transcript={test.transcript} onLocateSegment={locate} onChange={(map) => changeMindMapDraft(`listening:${test.id}`, map)} onSave={() => saveMindMap('listening', test, '', mindMapDrafts[`listening:${test.id}`])} onReset={() => resetMindMapDraft(`listening:${test.id}`)} /></section> : <VocabularyStudio key={test.id} vocabulary={test.vocabulary} />}
      </> : activeTab === 'speaking' ? <SpeakingStudio lessons={allSpeakingLessons} audioFiles={audioFiles} onUploadAudio={uploadAudio} onUploadSpeakingImage={uploadSpeakingImage} onDeleteSpeakingLesson={deleteSpeakingLesson} onSaveSpeakingLesson={addSpeakingLesson} selectedLessonId={speakingTargetId} onLessonIdChange={setSpeakingTargetId} mindMapDrafts={mindMapDrafts} onMindMapDraftChange={changeMindMapDraft} onMindMapSave={saveMindMap} onMindMapReset={resetMindMapDraft} /> : activeTab === 'vocabulary' ? <VocabularyStudio vocabulary={[...Object.values(vocabulary).flat(), ...speakingVocabulary]} global onUpdateVocabulary={updateVocabularyItem} onRenameCategory={renameVocabularyCategory} /> : activeTab === 'arcade' ? <ArcadeArena allTests={allTests} allSpeakingLessons={allSpeakingLessons} vocabulary={[...Object.values(vocabulary).flat(), ...speakingVocabulary]} onNavigateTab={(tab) => setActiveTab(tab)} /> : <QuestionBankStudio topics={allTests} audioFiles={audioFiles} audioLibraryError={audioLibraryError} onUploadAudio={uploadAudio} onUploadMapImage={uploadMapImage} onDeleteMapImage={deleteMapImage} onDeleteAudio={deleteAudio} onSaveTest={addTestToLibrary} onSaveTranscript={saveTranscriptToTest} onUpdateTestPart={updateTestPart} onNavigateSpeaking={() => setActiveTab('speaking')} />}
    </main>
    <footer><span>SHARON <i>IELTS STUDIO</i></span><span>LISTEN WITH INTENTION <b>·</b> LEARN WITH CONTEXT</span><span>BUILD 01.24</span></footer>
    {deleteTestOpen && <div className="bank-modal-backdrop" role="presentation"><section className="delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-test-title"><div className="bank-modal-heading"><div><span className="eyebrow-small">LOCAL DATA MANAGEMENT</span><h3 id="delete-test-title">删除当前听力套题？</h3></div><button aria-label="关闭" onClick={() => setDeleteTestOpen(false)}><X size={18} /></button></div><p>将删除“{test.title}”对应的本地 JSON 文件和浏览器题库记录。此操作不可撤销。</p><label><input type="radio" checked={!deleteAudioWithTest} onChange={() => setDeleteAudioWithTest(false)} />仅删除本套听力题目数据，保留音频</label><label><input type="radio" checked={deleteAudioWithTest} onChange={() => setDeleteAudioWithTest(true)} />同时删除对应本地音频{test.audioUrl?.startsWith('/audio/') ? `（${audioFilename(test.audioUrl)}）` : '（本套未绑定 public/audio 音频）'}</label>{deleteFeedback && <p className="speaking-import-error" role="alert">{deleteFeedback}</p>}<div className="delete-confirm-actions"><button className="speaking-secondary-action" onClick={() => setDeleteTestOpen(false)}>取消</button><button className="danger-action" onClick={deleteCurrentTest}><Trash2 size={15} />确认删除</button></div></section></div>}
  </div>
}
import { useMemo, useState } from 'react'
import { AlertCircle, Check, Clipboard, Download, FileAudio, FileJson, Headphones, Mic2, Save, Trash2, Upload } from 'lucide-react'
import MindMap from './MindMap.jsx'
import { normalizeQuestionType } from '../data/questionTypes.js'
import { attachTranscriptReferences, parseTranscript } from '../data/transcriptMatching.js'
import { cleanListeningTitle, getListeningPart, listeningParts, sortByEnglishTitle } from '../data/lessonIndex.js'

const schemaInstruction = `Return one strict JSON object with exactly these four top-level fields:
{
  "questions": [{"id":"q1","type":"fill_blank | single_choice | multiple_choice | matching","prompt":"Question prompt","options":[{"label":"A","text":"Option text"}],"items":[{"itemId":"m1","itemText":"Item","correctAnswer":"A","sentence":"Exact source sentence","explanation":"Why this match is correct"}],"correctAnswer":"A or an array of answers","explanation":"Chinese answer rationale","sentence":"Exact source sentence"}],
  "keySentences": [{"id":"ks-1","english":"Exact key sentence","chinese":"Chinese translation","examPoint":"Chinese IELTS listening point"}],
  "vocabulary": [{"id":"v-1","term":"English word or phrase","pos":"part of speech","chinese":"Chinese meaning","topicCategory":"Chinese topic category","exampleSentence":"Exact or natural English example","sourceTestId":"same as id"}],
  "mindMap": {"label":"English title","children":[{"label":"English heading","children":[{"label":"Concise English phrase"}]}]}
}

Rules: output JSON only, no markdown fences or commentary. Do not output transcript, audioRef, startTime, or endTime fields: the website matches exact source sentences to the teacher-saved timestamped transcript. Derive every answer and explanation only from the transcript; never invent audio evidence. Use supported question types. For fill_blank, correctAnswer must be an array of accepted strings; for single_choice use one option label string; for multiple_choice use an array of labels; for matching, put each answer and its exact source sentence on its item. Every other question must include an exact source sentence in sentence. Include 5-6 keySentences, 7.5-band vocabulary grouped by topic category, and an entirely English mindMap that follows the listening logic. Use valid JSON and unique IDs.`

function toSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `custom-${Date.now()}`
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '--:--'
  const safeSeconds = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function omitTimestampFields(value) {
  const { startTime, endTime, timestampOverride, ...rest } = value
  return rest
}

function unwrapJson(value) {
  const text = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('没有找到 JSON 对象，请检查模型输出。')
  return JSON.parse(text.slice(start, end + 1))
}

function normalizeTest(source, metadata) {
  if (!source || typeof source !== 'object') throw new Error('JSON 根节点必须是对象。')
  const test = {
    ...source,
    id: String(source.id || metadata.id || `custom-${toSlug(metadata.title)}`),
    title: String(source.title || metadata.title).trim(),
    topicCategory: String(source.topicCategory || metadata.topicCategory).trim(),
    part: metadata.part || source.part || getListeningPart({ title: source.title || metadata.title }),
    audioUrl: String(metadata.audioUrl || source.audioUrl || '').trim(),
    mapImageUrl: String(metadata.mapImageUrl || source.mapImageUrl || '').trim(),
    rawTranscript: metadata.transcriptText || source.rawTranscript || '',
    transcript: metadata.transcriptText ? parseTranscript(metadata.transcriptText) : (source.transcript ?? []),
  }
  if (!test.title || !test.topicCategory || !Array.isArray(test.transcript) || !test.transcript.length || !Array.isArray(test.questions) || !test.questions.length) {
    throw new Error('题库 JSON 至少需要 title、topicCategory、transcript 和 questions。')
  }
  if (!Array.isArray(test.keySentences)) throw new Error('JSON 缺少 keySentences 数组。')
  if (!Array.isArray(test.vocabulary)) throw new Error('JSON 缺少 vocabulary 数组。')
  if (!test.mindMap?.label || !Array.isArray(test.mindMap.children)) throw new Error('JSON 缺少有效的 mindMap 树。')
  test.vocabulary = test.vocabulary.map((item, index) => ({ ...item, id: item.id || `v-${index + 1}`, sourceTestId: test.id, topicCategory: item.topicCategory || test.topicCategory }))
  test.keySentences = test.keySentences.map(omitTimestampFields)
  test.questions = test.questions.map((sourceQuestion, index) => {
    const question = normalizeQuestionType(sourceQuestion)
    if (!['fill_blank', 'single_choice', 'multiple_choice', 'matching'].includes(question.type)) throw new Error(`第 ${index + 1} 题的 type 不受支持。`)
    if (question.type === 'fill_blank' && (typeof question.correctAnswer === 'string' || typeof question.correctAnswer === 'number')) question.correctAnswer = [String(question.correctAnswer)]
    if (question.type === 'fill_blank' && (!Array.isArray(question.correctAnswer) || !question.correctAnswer.length)) throw new Error(`第 ${index + 1} 道填空题缺少 correctAnswer 数组。`)
    if (question.type === 'single_choice' && (typeof question.correctAnswer !== 'string' || !Array.isArray(question.options) || !question.options.length)) throw new Error(`第 ${index + 1} 道单选题需要 options 和字符串 correctAnswer。`)
    if (question.type === 'multiple_choice' && (!Array.isArray(question.correctAnswer) || !Array.isArray(question.options) || !question.options.length)) throw new Error(`第 ${index + 1} 道多选题需要 options 和 correctAnswer 数组。`)
    if (question.type === 'matching' && (!Array.isArray(question.items) || !question.items.length || question.items.some((item) => !item.correctAnswer))) throw new Error(`第 ${index + 1} 道匹配题需要带答案的 items 数组。`)
    const itemRef = question.items?.[0]
    const sentence = question.audioRef?.sentence ?? question.sentence ?? itemRef?.sentence
    if (!sentence) throw new Error(`第 ${index + 1} 题缺少对应原文原句 sentence。`)
    return {
      ...omitTimestampFields(question),
      id: question.id || `q${index + 1}`,
      explanation: question.explanation || '请根据原文核对答案。',
      sentence,
      items: question.items?.map(omitTimestampFields),
      audioRef: { sentence },
    }
  })
  return attachTranscriptReferences(test)
}

function createPrompt({ title, topicCategory, part, audioUrl, transcript, existingQuestions }) {
  return `请先在 Gemini 中上传并分析教师提供的听力音频，再结合原文逐句核验，严禁编造音频证据。请严格按下面的 JSON 字段结构输出一个完整、合法的对象。\n\n${schemaInstruction}\n\nMetadata:\n- title: ${title || 'Untitled IELTS Listening Test'}\n- part: ${part || 'Part 1'}\n- topicCategory: ${topicCategory || 'Choose an appropriate Chinese topic category'}\n- audioUrl: ${audioUrl || '/audio/replace-with-audio-file.mp3'}\n\nTeacher transcript (preserve wording exactly; use it only as source evidence for sentence fields. The website owns all timestamp parsing and matching):\n${transcript || '[Paste the listening transcript here]'}\n\nExisting questions (optional; preserve their intent, derive answers only from source evidence, and add explanations plus exact matching source sentences. Do not create audioRef or timestamp fields):\n${existingQuestions || '[None. Generate a balanced set of supported IELTS listening question types.]'}\n\n请只返回完整 JSON，不要 Markdown 围栏。完成后将 JSON 粘贴到网页的“粘贴 Gemini 输出内容”并本地校验。`
}

function formatQuestionAnswer(question) {
  if (question.type === 'matching') return question.items.map((item) => `${item.itemText}: ${item.correctAnswer}`).join(' · ')
  const answers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]
  return answers.map((answer) => {
    const option = question.options?.find((item) => item.label === answer)
    return option ? `${answer}. ${option.text}` : answer
  }).join(' · ')
}

export default function QuestionBankStudio({ topics, audioFiles, audioLibraryError, onUploadAudio, onUploadMapImage, onDeleteMapImage, onDeleteAudio, onSaveTest, onSaveTranscript, onUpdateTestPart, onNavigateSpeaking }) {
  const [title, setTitle] = useState('')
  const [draftId] = useState(() => `custom-${Date.now()}`)
  const [topicCategory, setTopicCategory] = useState('')
  const [part, setPart] = useState('Part 1')
  const [partTargetId, setPartTargetId] = useState('')
  const [partSaving, setPartSaving] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [audioName, setAudioName] = useState('')
  const [mapImageUrl, setMapImageUrl] = useState('')
  const [mapImageName, setMapImageName] = useState('')
  const [transcriptText, setTranscriptText] = useState('')
  const [transcriptTarget, setTranscriptTarget] = useState('__draft__')
  const [transcriptSaving, setTranscriptSaving] = useState(false)
  const [existingQuestions, setExistingQuestions] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [previewTest, setPreviewTest] = useState(null)
  const [message, setMessage] = useState('填写套题信息和听力原文，复制提示词到 Gemini；粘贴输出 JSON 后可本地预览并入库。')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const transcriptPreview = useMemo(() => parseTranscript(transcriptText), [transcriptText])
  const prompt = useMemo(() => createPrompt({ title, topicCategory, part, audioUrl, transcript: transcriptText, existingQuestions }), [title, topicCategory, part, audioUrl, transcriptText, existingQuestions])
  const sortedTopics = useMemo(() => sortByEnglishTitle(topics, (item) => cleanListeningTitle(item.title)), [topics])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setMessage('Gemini 听力分析提示词已复制，可粘贴到教师 Gemini 会话。')
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setError('无法访问剪贴板。请检查浏览器权限，或手动复制下方生成提示词。')
    }
  }

  function previewJson() {
    setError('')
    setSaved(false)
    try {
      const parsed = unwrapJson(jsonText)
      const normalized = normalizeTest(parsed, { id: draftId, title, topicCategory, part, audioUrl, mapImageUrl, transcriptText })
      setPreviewTest(normalized)
      setJsonText(JSON.stringify(normalized, null, 2))
      setMessage(`JSON 校验通过：${normalized.questions.length} 道题、${normalized.keySentences.length} 句精听句、${normalized.vocabulary.length} 个词汇。`)
    } catch (previewError) {
      setPreviewTest(null)
      setError(`无法预览：${previewError.message}`)
    }
  }

  async function saveExistingPart() {
    const target = topics.find((item) => item.id === partTargetId)
    if (!target) return
    setPartSaving(true)
    try {
      const result = await onUpdateTestPart(target, part)
      if (!result?.browserSaved || !result.diskSaved) throw new Error(result?.diskError || result?.error || '题目 Part 保存失败。')
      setMessage(`${target.title} 已更新为 ${part}。`)
      setError('')
    } catch (saveError) {
      setError(`修改现有题目 Part 失败：${saveError.message}`)
    } finally {
      setPartSaving(false)
    }
  }

  async function handleAudioFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setMessage(`正在将 ${file.name} 写入 public/audio/...`)
    try {
      const result = await onUploadAudio(file)
      setAudioName(result.name)
      setAudioUrl(result.url)
      setMessage(`音频已写入 public/audio/ 并绑定到当前草稿：${result.name}`)
    } catch (uploadError) {
      setAudioName(file.name)
      setAudioUrl(`/audio/${encodeURIComponent(file.name)}`)
      setError(`音频硬盘上传失败：${uploadError.message}。当前仅绑定文件名，请稍后重新上传。`)
    }
  }

  async function deleteAudioSelection() {
    const file = audioFiles.find((item) => item.url === audioUrl)
    if (!file || !window.confirm(`确定从 public/audio/ 永久删除“${file.name}”？`)) return
    try {
      await onDeleteAudio(file.name)
      setAudioUrl('')
      setAudioName('')
      setMessage(`已删除音频文件：${file.name}`)
      setError('')
    } catch (deleteError) {
      setError(`删除音频失败：${deleteError.message}`)
    }
  }

  async function handleMapImageFile(event) {
      const file = event.target.files?.[0]
      if (!file) return
      setError('')
      try {
        const result = await onUploadMapImage(file)
        setMapImageUrl(result.url)
        setMapImageName(result.name)
        setSaved(false)
        if (previewTest) {
          const updated = { ...previewTest, mapImageUrl: result.url }
          setPreviewTest(updated)
          setJsonText(JSON.stringify(updated, null, 2))
        }
        setMessage(`地图题图片已保存到 public/images/：${result.name}`)
      } catch (uploadError) {
        setError(`地图题图片上传失败：${uploadError.message}`)
      } finally {
        event.target.value = ''
      }
  }

  async function removeMapImage() {
      if (!mapImageUrl) return
      try {
        await onDeleteMapImage(mapImageUrl)
        setMapImageUrl('')
        setMapImageName('')
        setSaved(false)
        if (previewTest) {
          const updated = { ...previewTest, mapImageUrl: '' }
          setPreviewTest(updated)
          setJsonText(JSON.stringify(updated, null, 2))
        }
        setMessage('地图题图片已删除。')
        setError('')
      } catch (deleteError) {
        setError(`地图题图片删除失败：${deleteError.message}`)
    }
  }

  async function saveToLibrary() {
    if (!previewTest) return
    const hasTitle = Boolean(previewTest.title?.trim())
    const hasQuestions = Array.isArray(previewTest.questions) && previewTest.questions.length > 0
    const hasTranscript = Array.isArray(previewTest.transcript) && previewTest.transcript.length > 0
    if (!hasTitle || (!hasQuestions && !hasTranscript)) {
      setError('无法保存无内容空白题：请确保听力套题已包含题目标题，并成功解析出有效题目或原文内容。')
      return
    }
    setSaving(true)
    const normalizedPreview = { ...previewTest, part }
    const result = await onSaveTest(normalizedPreview)
    setSaving(false)
    if (!result) {
      setError('本地存储空间不足，无法保存。可先下载 JSON 文件，再移入 src/data/tests/。')
      return
    }

    setSaved(true)
    setError('')
    setMessage(result.diskSaved
      ? `已写入浏览器缓存与硬盘：${result.diskPath}。${result.warning || '刷新后仍可使用。'}`
      : `已写入浏览器缓存，但硬盘写入失败：${result.diskError}。刷新当前浏览器仍可使用。${result.warning ? ` ${result.warning}` : ''}`)
  }

  async function saveTranscript() {
    setError('')
    setTranscriptSaving(true)
    try {
      const transcript = parseTranscript(transcriptText)
      if (!transcript.length) throw new Error('请先粘贴带时间戳的听力原文。')
      const result = await onSaveTranscript(transcriptTarget === '__draft__' ? '' : transcriptTarget, {
        title,
        draftId,
        topicCategory,
        audioUrl: transcriptTarget === '__draft__' ? audioUrl : '',
        transcript,
        rawTranscript: transcriptText,
        draftTest: previewTest ? { ...previewTest, part } : previewTest,
      })
      if (!result?.browserSaved) throw new Error(result?.error || '无法保存到浏览器题库。')
      setMessage(result.diskSaved
        ? `听力原文已保存到浏览器并写入 ${result.diskPath}。`
        : `听力原文已保存到浏览器，但硬盘写入失败：${result.diskError}`)
    } catch (saveError) {
      setError(`听力原文保存失败：${saveError.message}`)
    } finally {
      setTranscriptSaving(false)
    }
  }

  function downloadJson() {
    if (!previewTest) return
    const blob = new Blob([`${JSON.stringify(previewTest, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${previewTest.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <section className="question-bank-studio">
    <div className="question-bank-heading"><div><span className="eyebrow-small">TEACHER GEMINI RESEARCH DESK</span><h2>教研导入台</h2><div className="bank-import-tabs"><button className="active"><Headphones size={15} />听力材料导入</button><button onClick={onNavigateSpeaking}><Mic2 size={15} />口语材料导入</button></div></div><span className="bank-offline-badge"><span />OFFLINE IMPORT</span></div>

    <div className="question-bank-grid">
      <section className="bank-input-panel">
        <div className="bank-panel-heading"><span className="section-index">01</span><div><h3>题库输入</h3><p>Set details and paste the source material</p></div></div>
        <label className="bank-label">套题标题<input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Cambridge 19 Test 2 Section 3" /></label>
        <label className="bank-label">所属 Part<select value={part} onChange={(event) => { const value = event.target.value; setPart(value); setPreviewTest((current) => current ? { ...current, part: value } : current) }}>{listeningParts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="bank-existing-part"><label className="bank-label">修改现有套题 Part<select value={partTargetId} onChange={(event) => { const target = topics.find((item) => item.id === event.target.value); setPartTargetId(event.target.value); if (target) setPart(getListeningPart(target)) }}><option value="">选择现有套题</option>{sortedTopics.map((item) => <option value={item.id} key={item.id}>{cleanListeningTitle(item.title)}</option>)}</select></label><button type="button" className="bank-secondary-button" disabled={!partTargetId || partSaving} onClick={saveExistingPart}>{partSaving ? '保存中…' : '保存 Part 分类'}</button></div>
          <label className="bank-label">话题分类<input type="text" list="bank-topic-options" value={topicCategory} onChange={(event) => setTopicCategory(event.target.value)} placeholder="学术研究与环境类" /><datalist id="bank-topic-options">{[...new Set(['日常服务与市政交通', '学术研究与环境类', '经营理念与服务类', ...topics.flatMap((test) => [test.topicCategory, ...(test.vocabulary ?? []).map((item) => item.topicCategory)])])].map((category) => <option key={category} value={category} />)}</datalist></label>
        <div className="bank-label">音频来源
          <div className="bank-audio-picker"><label htmlFor="bank-audio-select">🎵 选择 public/audio 下的音频</label><div className="bank-audio-select-row"><select id="bank-audio-select" value={audioUrl} onChange={(event) => { setAudioUrl(event.target.value); setAudioName(audioFiles.find((file) => file.url === event.target.value)?.name ?? '') }}><option value="">选择真实音频文件</option>{audioFiles.map((file) => <option value={file.url} key={file.url}>{file.name}</option>)}</select><button type="button" className="bank-delete-audio-button" disabled={!audioFiles.some((file) => file.url === audioUrl)} onClick={deleteAudioSelection}><Trash2 size={14} />删除此音频</button></div>{audioLibraryError && <small className="bank-audio-note">无法扫描音频目录：{audioLibraryError}</small>}</div>
          <div className="bank-audio-input"><label className="bank-audio-path"><FileAudio size={15} /><input type="text" value={audioUrl} onChange={(event) => setAudioUrl(event.target.value)} placeholder="/audio/cam19-t2-s3.mp3" /></label><label className="bank-upload-button">📂 从电脑上传 MP3<input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac" onChange={handleAudioFile} /></label></div>
          {audioName && <small className="bank-audio-note">已绑定：{audioName} · {audioUrl}</small>}
        </div>
        <div className="bank-label">地图题图片 <span className="bank-optional">PNG / JPG / WebP，保存在 public/images/</span><div className="bank-map-image-actions"><label className="bank-upload-button">🗺️ {mapImageUrl ? '更换地图图片' : '上传/绑定地图题图片'}<input type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={handleMapImageFile} /></label>{mapImageUrl && <button className="bank-secondary-button" type="button" onClick={removeMapImage}>删除图片</button>}{mapImageName && <small>{mapImageName}</small>}</div></div>
        <label className="bank-label">听力原文<textarea className="bank-transcript-input" value={transcriptText} onChange={(event) => setTranscriptText(event.target.value)} placeholder={'建议每句提供时间戳以启用音频同步，例如：\n[00:08 - 00:15] Interviewer: Welcome to the programme.\n[00:15] Thank you for joining us.'} /></label>
        <div className="bank-transcript-meta"><span>{transcriptPreview.length} segments detected</span><span>{transcriptText.trim().split(/\s+/).filter(Boolean).length} words</span></div>
        <div className="bank-save-transcript-row">
          <label htmlFor="transcript-target">保存原文到</label>
          <select id="transcript-target" value={transcriptTarget} onChange={(event) => setTranscriptTarget(event.target.value)}>
            <option value="__draft__">当前新建套题草稿{title ? `：${title}` : ''}</option>
            {sortedTopics.map((item) => <option key={item.id} value={item.id}>{cleanListeningTitle(item.title)}</option>)}
          </select>
          <button type="button" className="bank-primary-button" disabled={transcriptSaving || !transcriptText.trim()} onClick={saveTranscript}><Save size={15} />{transcriptSaving ? '保存中…' : '保存听力原文'}</button>
        </div>
        <label className="bank-label">已有题目 <span className="bank-optional">可选</span><textarea className="bank-existing-input" value={existingQuestions} onChange={(event) => setExistingQuestions(event.target.value)} placeholder={'粘贴现有题目和选项；留空则让 AI 根据原文自动组题。'} /></label>
        <div className="bank-actions"><button className="bank-primary-button" onClick={copyPrompt}><Clipboard size={15} />{copied ? '提示词已复制' : '复制 Gemini 听力分析提示词'}</button><span className="bank-offline-note">无网页端联网请求</span></div>
        <p className={`bank-message ${error ? 'has-error' : ''}`} role="status">{error ? <AlertCircle size={14} /> : <Check size={14} />}{error || message}</p>

        <details className="bank-transcript-preview"><summary>检查原文时间戳解析 <span>{transcriptPreview.filter((segment) => Number.isFinite(segment.startTime)).length} timed / {transcriptPreview.length} segments</span></summary><div>{transcriptPreview.slice(0, 8).map((segment) => <p key={segment.id}><time>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</time><strong>{segment.speaker}</strong>{segment.text}</p>)}</div></details>
      </section>

      <section className="bank-output-panel">
        <div className="bank-panel-heading"><span className="section-index">02</span><div><h3>Gemini 输出与题库预览</h3><p>Paste Gemini JSON here; validation and preview stay on this device</p></div></div>
        <label className="bank-label bank-json-label">粘贴 Gemini 输出内容<textarea className="bank-json-input" value={jsonText} onChange={(event) => { setJsonText(event.target.value); setPreviewTest(null); setSaved(false) }} placeholder="将 Gemini 返回的完整 JSON 粘贴到这里..." spellCheck="false" /></label>
        <div className="bank-output-actions"><button className="bank-secondary-button" onClick={previewJson} disabled={!jsonText.trim()}><FileJson size={15} />校验并预览</button><button className="bank-secondary-button" onClick={downloadJson} disabled={!previewTest}><Download size={15} />下载 .json</button><button className="bank-primary-button" onClick={saveToLibrary} disabled={!previewTest || saved || saving}><Check size={15} />{saving ? '双保险保存中...' : saved ? '已保存' : '保存到题库'}</button></div>
        <div className="bank-preview-content">
          {!previewTest ? <div className="bank-empty-preview"><FileJson size={23} /><p>校验 JSON 后在此预览题目、精听句、核心词汇与思维导图。</p></div> : <>
            <div className="bank-preview-title"><span className="eyebrow-small">{previewTest.id}</span><h3>{previewTest.title}</h3><span>{previewTest.topicCategory}</span><small>{previewTest.audioUrl || '未设置音频路径'} · {previewTest.transcript.length} transcript segments</small>{previewTest.mapImageUrl && <img className="bank-preview-map-image" src={previewTest.mapImageUrl} alt="地图题图片预览" />}</div>
            {previewTest.keySentences.length < 5 || previewTest.keySentences.length > 6 ? <p className="bank-preview-warning"><AlertCircle size={14} />当前有 {previewTest.keySentences.length} 句精听句；建议调整为 5-6 句。</p> : null}
            <section className="bank-preview-section"><h4>题目 <span>{previewTest.questions.length}</span></h4><div>{previewTest.questions.map((question) => <article key={question.id}><span>{question.type.replace('_', ' ')}</span><strong>{question.prompt}</strong>{question.options?.map((option) => <small key={option.label}>{option.label}. {option.text}</small>)}<small className="bank-preview-answer">答案：{formatQuestionAnswer(question)}</small><small>{question.explanation}</small><small>原文：{question.audioRef?.sentence ?? question.sentence}</small></article>)}</div></section>
            <section className="bank-preview-section"><h4>精听考点句 <span>{previewTest.keySentences.length}</span></h4><div>{previewTest.keySentences.slice(0, 6).map((sentence) => <article key={sentence.id}><strong>{sentence.english}</strong><small>{sentence.chinese} · {sentence.examPoint}</small></article>)}</div></section>
            <section className="bank-preview-section"><h4>7.5 分核心词 <span>{previewTest.vocabulary.length}</span></h4><div className="bank-preview-vocabulary">{previewTest.vocabulary.map((item) => <article key={item.id}><strong>{item.term}</strong><span>{item.pos} · {item.topicCategory}</span><small>{item.chinese}</small></article>)}</div></section>
            <section className="bank-preview-section bank-preview-map"><h4>全英文思维导图</h4><MindMap key={previewTest.id} data={previewTest.mindMap} /></section>
          </>}
        </div>
      </section>
    </div>

  </section>
}
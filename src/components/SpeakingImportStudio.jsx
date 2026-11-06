import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Check,
  Clipboard,
  FileAudio,
  FileJson,
  Image as ImageIcon,
  Mic2,
  Plus,
  Save,
  Trash2,
  Upload,
  Volume2,
  X
} from 'lucide-react'
import MindMap from './MindMap.jsx'
import {
  PART1_FULL_TEMPLATE,
  PART2_FULL_TEMPLATE,
  PART3_FULL_TEMPLATE,
  PART23_FULL_TEMPLATE,
  flattenMindMap,
  parseMindMapOutline
} from './SpeakingStudio.jsx'

const PERSPECTIVES = ['思路一 · 个人偏好', '思路二 · 社会文化', '思路三 · 科技演进', '思路四 · 哲学反思']

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `speaking-${Date.now()}`
}

function buildGeminiPrompt(part, title, topicCategory) {
  const t = title || 'IELTS Speaking Topic'
  const c = topicCategory || '日常生活与社会'
  return `请作为前雅思考官与资深教研员，为《${t}》（${part} · ${c}）设计完整的雅思口语高分教研内容。

请严格输出合法的 JSON 对象（纯 JSON，严禁 Markdown 围栏或额外解释），必须包含以下字段：
{
  "title": "${t}",
  "part": "${part}",
  "topicCategory": "${c}",
  ${part === 'Part 2' || part === 'Part 2 & 3' ? `"questionPrompt": "Part 2 Cue Card prompt...",
  "cueCardPoints": [
    "Point 1",
    "Point 2",
    "Point 3",
    "Point 4"
  ],
  "sampleAnswer": "A band 8.0+ natural, idiomatic Part 2 sample answer...",` : ''}
  ${part === 'Part 1' || part === 'Part 3' || part === 'Part 2 & 3' ? `"questions": [
    {
      "question": "Question 1?",
      "perspective": "思路一",
      "sampleAnswer": "Band 8.0+ idiomatic answer..."
    },
    {
      "question": "Question 2?",
      "perspective": "思路二",
      "sampleAnswer": "Band 8.0+ idiomatic answer..."
    },
    {
      "question": "Question 3?",
      "perspective": "思路三",
      "sampleAnswer": "Band 8.0+ idiomatic answer..."
    }
  ],` : ''}
  "vocabulary": [
    {
      "term": "natural collocation",
      "pos": "n. phr. / v. phr. / adj. phr.",
      "chinese": "中文准确释义",
      "exampleSentence": "High-scoring example sentence."
    }
  ],
  "mindMap": {
    "label": "${t}",
    "children": [
      {
        "label": "Theme Dimension 1",
        "children": [
          { "label": "Key subpoint A" },
          { "label": "Key subpoint B" }
        ]
      },
      {
        "label": "Theme Dimension 2",
        "children": [
          { "label": "Key subpoint C" },
          { "label": "Key subpoint D" }
        ]
      }
    ]
  }
}
`
}

export default function SpeakingImportStudio({
  initialLesson,
  lessons = [],
  audioFiles = [],
  audioLibraryError,
  onUploadAudio,
  onDeleteAudio,
  onUploadSpeakingImage,
  onSaveSpeakingLesson,
  onSaveSuccess,
  onCancelEdit,
}) {
  const [originalId, setOriginalId] = useState(initialLesson?.id || '')
  const [title, setTitle] = useState(initialLesson?.title || '')
  const [part, setPart] = useState(initialLesson?.part || 'Part 1')
  const [topicCategory, setTopicCategory] = useState(initialLesson?.topicCategory || '')
  const [audioUrl, setAudioUrl] = useState(initialLesson?.audioUrl || '')
  const [questionPrompt, setQuestionPrompt] = useState(initialLesson?.questionPrompt || '')
  const [cueCardText, setCueCardText] = useState((initialLesson?.cueCardPoints || []).join('\n'))
  const [sampleAnswer, setSampleAnswer] = useState(initialLesson?.sampleAnswer || '')
  const [questions, setQuestions] = useState(
    initialLesson?.questions?.length
      ? initialLesson.questions.map((q, idx) => ({
          question: q.question || '',
          perspective: q.perspective || PERSPECTIVES[idx % PERSPECTIVES.length],
          sampleAnswer: q.sampleAnswer || '',
        }))
      : [{ question: '', perspective: PERSPECTIVES[0], sampleAnswer: '' }]
  )
  const [vocabulary, setVocabulary] = useState(
    initialLesson?.vocabulary?.length
      ? initialLesson.vocabulary.map((v) => ({ ...v }))
      : [
          { id: 'v1', term: '', pos: 'n. phr.', chinese: '', exampleSentence: '', topicCategory: '' },
          { id: 'v2', term: '', pos: 'v. phr.', chinese: '', exampleSentence: '', topicCategory: '' },
        ]
  )
  const [images, setImages] = useState(
    Array.isArray(initialLesson?.images)
      ? initialLesson.images.map((img) => (typeof img === 'string' ? { url: img, caption: '' } : { url: img.url || '', caption: img.caption || '' }))
      : []
  )
  const [mindMapText, setMindMapText] = useState(
    initialLesson?.mindMap ? flattenMindMap(initialLesson.mindMap) : '- Speaking Outline\n  - Core Ideas\n    - Main highlight\n  - Perspective\n    - Personal insight'
  )

  // Right Side Gemini Import Workbench
  const [templateTab, setTemplateTab] = useState('Part 1')
  const [jsonText, setJsonText] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [mergeSummary, setMergeSummary] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Re-sync if initialLesson changes
  useEffect(() => {
    if (initialLesson) {
      setOriginalId(initialLesson.id || '')
      setTitle(initialLesson.title || '')
      setPart(initialLesson.part || 'Part 1')
      setTopicCategory(initialLesson.topicCategory || '')
      setAudioUrl(initialLesson.audioUrl || '')
      setQuestionPrompt(initialLesson.questionPrompt || '')
      setCueCardText((initialLesson.cueCardPoints || []).join('\n'))
      setSampleAnswer(initialLesson.sampleAnswer || '')
      setQuestions(
        initialLesson.questions?.length
          ? initialLesson.questions.map((q, idx) => ({
              question: q.question || '',
              perspective: q.perspective || PERSPECTIVES[idx % PERSPECTIVES.length],
              sampleAnswer: q.sampleAnswer || '',
            }))
          : [{ question: '', perspective: PERSPECTIVES[0], sampleAnswer: '' }]
      )
      setVocabulary(initialLesson.vocabulary?.map((v) => ({ ...v })) || [])
      setImages(
        Array.isArray(initialLesson.images)
          ? initialLesson.images.map((img) => (typeof img === 'string' ? { url: img, caption: '' } : { url: img.url || '', caption: img.caption || '' }))
          : []
      )
      setMindMapText(initialLesson.mindMap ? flattenMindMap(initialLesson.mindMap) : '')
      setStatusMsg(`已载入题目《${initialLesson.title || initialLesson.id}》进行修改`)
    }
  }, [initialLesson])

  const mindMapPreview = useMemo(() => {
    return parseMindMapOutline(mindMapText, title || 'Speaking Outline')
  }, [mindMapText, title])

  // Template Data Selection
  const activeTemplateData = useMemo(() => {
    if (templateTab === 'Part 1') return PART1_FULL_TEMPLATE
    if (templateTab === 'Part 2') return PART2_FULL_TEMPLATE
    if (templateTab === 'Part 3') return PART3_FULL_TEMPLATE
    return PART23_FULL_TEMPLATE
  }, [templateTab])

  // Copy template JSON
  async function copyTemplateJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(activeTemplateData, null, 2))
      setCopyFeedback(`已复制 ${templateTab} 标准 JSON 结构`)
      window.setTimeout(() => setCopyFeedback(''), 2200)
    } catch {
      setErrorMsg('无法访问剪贴板，请手动复制。')
    }
  }

  // Copy Gemini Prompt
  async function copyGeminiPrompt() {
    try {
      const prompt = buildGeminiPrompt(templateTab, title, topicCategory)
      await navigator.clipboard.writeText(prompt)
      setCopyFeedback(`已复制 ${templateTab} Gemini 教研提示词`)
      window.setTimeout(() => setCopyFeedback(''), 2200)
    } catch {
      setErrorMsg('无法访问剪贴板，请手动复制。')
    }
  }

  // Incremental merge
  function handleMergeJson() {
    setErrorMsg('')
    setMergeSummary('')
    if (!jsonText.trim()) {
      setErrorMsg('请先粘贴 Gemini 输出的 JSON 内容。')
      return
    }

    try {
      const raw = jsonText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start < 0 || end < start) throw new Error('未识别到合法的 JSON 根对象 `{ ... }`。')
      const parsed = JSON.parse(raw.slice(start, end + 1))

      const mergedFields = []

      if (parsed.title && typeof parsed.title === 'string') {
        setTitle(parsed.title.trim())
        mergedFields.push('题目标题')
      }
      if (parsed.part && typeof parsed.part === 'string') {
        setPart(parsed.part)
        mergedFields.push('所属 Part')
      }
      if (parsed.topicCategory && typeof parsed.topicCategory === 'string') {
        setTopicCategory(parsed.topicCategory.trim())
        mergedFields.push('话题分类')
      }
      if (parsed.audioUrl && typeof parsed.audioUrl === 'string') {
        setAudioUrl(parsed.audioUrl.trim())
        mergedFields.push('音频路径')
      }
      if (parsed.questionPrompt && typeof parsed.questionPrompt === 'string') {
        setQuestionPrompt(parsed.questionPrompt)
        mergedFields.push('题干要求')
      }
      if (Array.isArray(parsed.cueCardPoints) && parsed.cueCardPoints.length > 0) {
        setCueCardText(parsed.cueCardPoints.join('\n'))
        mergedFields.push('Cue Card 提纲')
      }
      if (parsed.sampleAnswer && typeof parsed.sampleAnswer === 'string') {
        setSampleAnswer(parsed.sampleAnswer)
        mergedFields.push('高分示范回答')
      }
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        setQuestions(
          parsed.questions.map((q, idx) => ({
            question: q.question || '',
            perspective: q.perspective || PERSPECTIVES[idx % PERSPECTIVES.length],
            sampleAnswer: q.sampleAnswer || '',
          }))
        )
        mergedFields.push(`追问列表 (${parsed.questions.length}题)`)
      }
      if (Array.isArray(parsed.vocabulary) && parsed.vocabulary.length > 0) {
        setVocabulary(
          parsed.vocabulary.map((v, idx) => ({
            id: v.id || `v-${Date.now()}-${idx}`,
            term: v.term || '',
            pos: v.pos || 'n. phr.',
            chinese: v.chinese || '',
            exampleSentence: v.exampleSentence || '',
            topicCategory: v.topicCategory || parsed.topicCategory || topicCategory,
          }))
        )
        mergedFields.push(`核心词汇 (${parsed.vocabulary.length}个)`)
      }
      if (parsed.mindMap && typeof parsed.mindMap === 'object') {
        setMindMapText(flattenMindMap(parsed.mindMap))
        mergedFields.push('全英文思维导图')
      }
      if (Array.isArray(parsed.images) && parsed.images.length > 0) {
        setImages(parsed.images.map((img) => (typeof img === 'string' ? { url: img, caption: '' } : { url: img.url || '', caption: img.caption || '' })))
        mergedFields.push(`话题图鉴 (${parsed.images.length}张)`)
      }

      if (mergedFields.length === 0) {
        setErrorMsg('JSON 中未找到可匹配的口语题库字段，请检查键名。')
      } else {
        setMergeSummary(`✅ 成功增量合并 ${mergedFields.length} 项：${mergedFields.join('、')}。未出现的已有字段已完整保留！`)
      }
    } catch (err) {
      setErrorMsg(`JSON 解析失败：${err.message}`)
    }
  }

  // Audio actions
  async function handleAudioUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setErrorMsg('')
    try {
      const res = await onUploadAudio(file)
      setAudioUrl(res.url)
      setStatusMsg(`音频已上传并绑定：${res.name}`)
    } catch (err) {
      setAudioUrl(`/audio/${encodeURIComponent(file.name)}`)
      setErrorMsg(`音频硬盘写入失败：${err.message}，已暂存绑定路径。`)
    }
  }

  async function handleDeleteAudio() {
    const currentName = audioUrl.split('/').pop()
    if (!currentName || !window.confirm(`确定从 public/audio/ 删除音频“${currentName}”？`)) return
    try {
      await onDeleteAudio(currentName)
      setAudioUrl('')
      setStatusMsg(`已删除音频：${currentName}`)
    } catch (err) {
      setErrorMsg(`删除失败：${err.message}`)
    }
  }

  // Image actions
  async function handleImageUpload(event) {
    const files = event.target.files
    if (!files || !files.length) return
    setErrorMsg('')
    try {
      const uploaded = []
      for (const file of Array.from(files)) {
        if (onUploadSpeakingImage) {
          const res = await onUploadSpeakingImage(file)
          uploaded.push({ url: res.url, caption: file.name.replace(/\.[^/.]+$/, '') })
        } else {
          uploaded.push({ url: `/images/${encodeURIComponent(file.name)}`, caption: file.name.replace(/\.[^/.]+$/, '') })
        }
      }
      setImages((curr) => [...curr, ...uploaded])
      setStatusMsg(`已添加 ${uploaded.length} 张话题图片`)
    } catch (err) {
      setErrorMsg(`图片上传失败：${err.message}`)
    }
  }

  // Question row actions
  function addQuestion() {
    setQuestions((curr) => [
      ...curr,
      { question: '', perspective: PERSPECTIVES[curr.length % PERSPECTIVES.length], sampleAnswer: '' },
    ])
  }

  function removeQuestion(idx) {
    setQuestions((curr) => curr.filter((_, i) => i !== idx))
  }

  function updateQuestion(idx, key, val) {
    setQuestions((curr) => curr.map((q, i) => (i === idx ? { ...q, [key]: val } : q)))
  }

  // Vocabulary row actions
  function addVocabulary() {
    setVocabulary((curr) => [
      ...curr,
      { id: `v-${Date.now()}`, term: '', pos: 'n. phr.', chinese: '', exampleSentence: '', topicCategory },
    ])
  }

  function removeVocabulary(idx) {
    setVocabulary((curr) => curr.filter((_, i) => i !== idx))
  }

  function updateVocabulary(idx, key, val) {
    setVocabulary((curr) => curr.map((v, i) => (i === idx ? { ...v, [key]: val } : v)))
  }

  // Submit to Bank
  async function handleSaveLesson() {
    setErrorMsg('')
    const cleanTitle = title.trim()
    const cleanTopic = topicCategory.trim()

    if (!cleanTitle || !cleanTopic) {
      setErrorMsg('请至少填写“套题标题”与“话题分类”。')
      return
    }

    const isPartTwo = part === 'Part 2' || part === 'Part 2 & 3'
    const isQuestionList = part === 'Part 1' || part === 'Part 3' || part === 'Part 2 & 3'

    if (isPartTwo && !sampleAnswer.trim() && !questions[0]?.sampleAnswer?.trim()) {
      setErrorMsg('Part 2 题目需要填写示范回答（Sample Answer）。')
      return
    }

    if (isQuestionList && questions.every((q) => !q.question.trim())) {
      setErrorMsg('请至少录入一个口语提问。')
      return
    }

    setSaving(true)
    const targetId = originalId || `spk-${slug(cleanTitle)}-${Date.now().toString(36)}`

    const cleanQuestions = questions
      .filter((q) => q.question.trim())
      .map((q) => ({
        question: q.question.trim(),
        perspective: q.perspective || PERSPECTIVES[0],
        sampleAnswer: q.sampleAnswer.trim(),
      }))

    const cleanVocab = vocabulary
      .filter((v) => v.term.trim())
      .map((v, idx) => ({
        id: v.id || `v-${idx + 1}`,
        term: v.term.trim(),
        pos: v.pos || 'n. phr.',
        chinese: v.chinese.trim(),
        exampleSentence: v.exampleSentence.trim(),
        topicCategory: v.topicCategory || cleanTopic,
        sourceTestId: targetId,
      }))

    const cuePoints = cueCardText
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    const parsedTree = parseMindMapOutline(mindMapText, cleanTitle || 'Speaking Outline')

    const lessonData = {
      id: targetId,
      title: cleanTitle,
      part,
      topicCategory: cleanTopic,
      audioUrl: audioUrl.trim(),
      questionPrompt: isPartTwo ? (questionPrompt.trim() || cleanTitle) : cleanTitle,
      cueCardPoints: isPartTwo ? cuePoints : [],
      sampleAnswer: sampleAnswer.trim() || (cleanQuestions[0]?.sampleAnswer ?? ''),
      questions: cleanQuestions,
      vocabulary: cleanVocab,
      mindMap: parsedTree,
      images: images.filter((img) => img && img.url),
    }

    try {
      const result = await onSaveSpeakingLesson(lessonData, originalId)
      setSaving(false)
      if (!result) throw new Error('保存失败，请检查存储权限。')

      setStatusMsg(
        result.diskSaved
          ? `✅ 口语题已成功写入硬盘 ${result.diskPath} 与本地浏览器题库！`
          : `✅ 口语题已写入浏览器题库（硬盘写入提示：${result.diskError || '未开启本地服务'}）`
      )

      if (onSaveSuccess) {
        onSaveSuccess(lessonData.id)
      }
    } catch (err) {
      setSaving(false)
      setErrorMsg(`保存失败：${err.message}`)
    }
  }

  return (
    <div className="question-bank-grid speaking-import-studio">
      {/* Left Column: Standard Manual Form */}
      <section className="bank-input-panel">
        <div className="bank-panel-heading">
          <span className="section-index">01</span>
          <div>
            <h3>口语题库标准表单</h3>
            <p>Standard Speaking Lesson &amp; Cue Card Details</p>
          </div>
        </div>

        {originalId && (
          <div className="speaking-editing-banner" style={{ background: '#F4EFEA', border: '1px solid #D8D2C7', borderRadius: 8, padding: '8px 12px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✏️ 正在编辑口语题：<strong>{title || originalId}</strong></span>
            {onCancelEdit && (
              <button type="button" onClick={onCancelEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9E5A47', fontSize: 12 }}>
                放弃修改并新建
              </button>
            )}
          </div>
        )}

        {/* Title */}
        <label className="bank-label">
          套题标题 (Title)
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={part === 'Part 1' ? '例如 Names 或 Art & Galleries' : '例如 A Memorable Journey'}
          />
        </label>

        {/* Part Selection */}
        <label className="bank-label">
          所属 Part
          <select value={part} onChange={(e) => setPart(e.target.value)}>
            <option value="Part 1">Part 1（日常话题快问快答）</option>
            <option value="Part 2">Part 2（独立 Cue Card 个人长白）</option>
            <option value="Part 3">Part 3（深度社会思辨讨论）</option>
            <option value="Part 2 & 3">Part 2 &amp; 3（长白 + 深度拓展综合套题）</option>
          </select>
        </label>

        {/* Topic Category */}
        <label className="bank-label">
          话题分类 (Topic Category)
          <input
            type="text"
            list="speaking-topic-categories"
            value={topicCategory}
            onChange={(e) => setTopicCategory(e.target.value)}
            placeholder="例如 旅行与探索、日常生活与爱好、社会科技与环境"
          />
          <datalist id="speaking-topic-categories">
            {[...new Set(['日常生活与爱好', '地点与自然', '旅行与探索', '科技与社交', '教育与职场', '社会文化与艺术', ...lessons.map((l) => l.topicCategory)])].map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </label>

        {/* Audio Binding */}
        <div className="bank-label">
          示范/考官音频 (Audio Reference)
          <div className="bank-audio-picker">
            <label htmlFor="spk-audio-select">🎵 选择 public/audio 下的示范音频</label>
            <div className="bank-audio-select-row">
              <select
                id="spk-audio-select"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              >
                <option value="">选择音频文件</option>
                {audioFiles.map((file) => (
                  <option value={file.url} key={file.url}>{file.name}</option>
                ))}
              </select>
              {audioUrl && (
                <button type="button" className="bank-delete-audio-button" onClick={handleDeleteAudio}>
                  <Trash2 size={14} />删除此音频
                </button>
              )}
            </div>
            {audioLibraryError && <small className="bank-audio-note">扫描目录提示：{audioLibraryError}</small>}
          </div>
          <div className="bank-audio-input">
            <label className="bank-audio-path">
              <FileAudio size={15} />
              <input
                type="text"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="/audio/spk-sample.mp3"
              />
            </label>
            <label className="bank-upload-button">
              📂 上传本地音频
              <input type="file" accept="audio/*,.mp3,.wav,.m4a" onChange={handleAudioUpload} />
            </label>
          </div>
        </div>

        {/* Part 2 Cue Card Section */}
        {(part === 'Part 2' || part === 'Part 2 & 3') && (
          <div className="speaking-form-section" style={{ border: '1px solid #E2DED5', padding: '14px', borderRadius: 8, background: '#FAF8F4', display: 'grid', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#9E5A47' }}>PART 2 CUE CARD 核心配置</span>
            <label className="bank-label">
              Cue Card 题干要求 (Prompt)
              <input
                type="text"
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                placeholder="例如 Describe a memorable journey you took by public transport."
              />
            </label>
            <label className="bank-label">
              提纲要点 (Cue Card Points，每行一点)
              <textarea
                rows={4}
                value={cueCardText}
                onChange={(e) => setCueCardText(e.target.value)}
                placeholder={"Where you went and when\nWhat transport you took\nWho accompanied you\nWhy it was memorable"}
              />
            </label>
            <label className="bank-label">
              Part 2 满分范文 (Sample Answer)
              <textarea
                rows={6}
                value={sampleAnswer}
                onChange={(e) => setSampleAnswer(e.target.value)}
                placeholder="在此输入 8.0+ 分自然地道的个人长白范文..."
              />
            </label>
          </div>
        )}

        {/* Questions list (for Part 1, Part 3, or Part 2 & 3) */}
        {(part === 'Part 1' || part === 'Part 3' || part === 'Part 2 & 3') && (
          <div className="speaking-form-section" style={{ border: '1px solid #E2DED5', padding: '14px', borderRadius: 8, background: '#FAF8F4', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#5A7865' }}>
                {part === 'Part 1' ? 'PART 1 快速问答列表' : part === 'Part 3' ? 'PART 3 深度思辨问题列表' : 'PART 3 关联追问列表'}
              </span>
              <button type="button" className="bank-secondary-button" onClick={addQuestion} style={{ fontSize: 12, padding: '4px 10px' }}>
                <Plus size={14} />添加问题
              </button>
            </div>
            {questions.map((q, idx) => (
              <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #D8D2C7', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6E675F' }}>第 {idx + 1} 问</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      value={q.perspective}
                      onChange={(e) => updateQuestion(idx, 'perspective', e.target.value)}
                      style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
                    >
                      {PERSPECTIVES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(idx)} style={{ color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                  placeholder="输入问题，例如 Do you like your name?"
                />
                <textarea
                  rows={3}
                  value={q.sampleAnswer}
                  onChange={(e) => updateQuestion(idx, 'sampleAnswer', e.target.value)}
                  placeholder="输入此问题的范例回答..."
                />
              </div>
            ))}
          </div>
        )}

        {/* Vocabulary Builder */}
        <div className="speaking-form-section" style={{ border: '1px solid #E2DED5', padding: '14px', borderRadius: 8, background: '#FAF8F4', display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E1B18' }}>7.5+ 话题高分词汇 ({vocabulary.length}个)</span>
            <button type="button" className="bank-secondary-button" onClick={addVocabulary} style={{ fontSize: 12, padding: '4px 10px' }}>
              <Plus size={14} />添加词汇
            </button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {vocabulary.map((v, idx) => (
              <div key={v.id || idx} style={{ background: '#FFFFFF', border: '1px solid #D8D2C7', borderRadius: 6, padding: '8px 10px', display: 'grid', gridTemplateColumns: '1.2fr 80px 1.2fr 24px', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={v.term}
                  onChange={(e) => updateVocabulary(idx, 'term', e.target.value)}
                  placeholder="英文短语/词汇"
                />
                <select
                  value={v.pos}
                  onChange={(e) => updateVocabulary(idx, 'pos', e.target.value)}
                  style={{ fontSize: 12 }}
                >
                  <option value="n. phr.">n. phr.</option>
                  <option value="v. phr.">v. phr.</option>
                  <option value="adj. phr.">adj. phr.</option>
                  <option value="adv. phr.">adv. phr.</option>
                  <option value="idiom">idiom</option>
                </select>
                <input
                  type="text"
                  value={v.chinese}
                  onChange={(e) => updateVocabulary(idx, 'chinese', e.target.value)}
                  placeholder="中文释义"
                />
                <button type="button" onClick={() => removeVocabulary(idx)} style={{ color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Visual Gallery Images */}
        <div className="speaking-form-section" style={{ border: '1px solid #E2DED5', padding: '14px', borderRadius: 8, background: '#FAF8F4', display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E1B18' }}>话题图鉴 (Visual Inspiration Gallery)</span>
            <label className="bank-upload-button" style={{ fontSize: 12, padding: '4px 10px' }}>
              <ImageIcon size={14} />上传图片
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
            </label>
          </div>
          {images.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', border: '1px solid #D8D2C7', borderRadius: 6, overflow: 'hidden', background: '#FFF' }}>
                  <img src={img.url} alt={img.caption || 'Topic Image'} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                  <input
                    type="text"
                    value={img.caption}
                    onChange={(e) => {
                      const val = e.target.value
                      setImages((curr) => curr.map((im, i) => (i === idx ? { ...im, caption: val } : im)))
                    }}
                    placeholder="图注说明"
                    style={{ width: '100%', border: 'none', borderTop: '1px solid #E2DED5', fontSize: 11, padding: '3px 6px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setImages((curr) => curr.filter((_, i) => i !== idx))}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#FFF', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <small style={{ color: '#8C827A' }}>暂无话题配图，可点击右上角上传或在 JSON 中注入。</small>
          )}
        </div>

        {/* Mind Map Outline */}
        <label className="bank-label">
          全英文思维导图大纲 (Hierarchical Outline)
          <textarea
            rows={5}
            value={mindMapText}
            onChange={(e) => setMindMapText(e.target.value)}
            placeholder={"- Topic Name\n  - Subtopic 1\n    - Key point A\n  - Subtopic 2\n    - Key point B"}
          />
        </label>
      </section>

      {/* Right Column: Gemini Smart Import & JSON Incremental Paste Workbench */}
      <section className="bank-output-panel">
        <div className="bank-panel-heading">
          <span className="section-index">02</span>
          <div>
            <h3>Gemini 智能教研与 JSON 增量解析</h3>
            <p>Paste Gemini JSON to merge into form with zero data loss</p>
          </div>
        </div>

        {/* Template Selector Pills */}
        <div className="speaking-template-switch-bar" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Part 1', 'Part 2', 'Part 3', 'Part 2 & 3'].map((item) => (
            <button
              key={item}
              type="button"
              className={`bank-secondary-button ${templateTab === item ? 'active' : ''}`}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                background: templateTab === item ? '#1E1B18' : '#FAF8F4',
                color: templateTab === item ? '#FFF' : '#4A423B',
                borderColor: templateTab === item ? '#1E1B18' : '#D8D2C7',
              }}
              onClick={() => setTemplateTab(item)}
            >
              {item === 'Part 1' ? '🌟 Part 1 模板' : item === 'Part 2' ? '🎙️ Part 2 模板' : item === 'Part 3' ? '💬 Part 3 模板' : '👑 Part 2 & 3 综合模板'}
            </button>
          ))}
        </div>

        {/* Copy Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button type="button" className="bank-secondary-button" onClick={copyGeminiPrompt}>
            <Clipboard size={14} />复制 {templateTab} Gemini 提示词
          </button>
          <button type="button" className="bank-secondary-button" onClick={copyTemplateJson}>
            <FileJson size={14} />复制 {templateTab} 标准 JSON 结构
          </button>
          {copyFeedback && <span style={{ color: '#5A7865', fontSize: 12, alignSelf: 'center' }}>✓ {copyFeedback}</span>}
        </div>

        {/* Incremental JSON Paste Textarea */}
        <label className="bank-label bank-json-label" style={{ marginTop: 12 }}>
          粘贴 Gemini 输出的 JSON 内容
          <textarea
            className="bank-json-input"
            rows={12}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="支持粘贴完整 JSON，或单独粘贴思维导图、高分词汇、范文等局部片段。未包含字段将完整保留已有手动输入..."
            spellCheck="false"
          />
        </label>

        {/* Parse Actions */}
        <div className="bank-output-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="bank-primary-button" onClick={handleMergeJson} disabled={!jsonText.trim()}>
            <FileJson size={15} />校验并合并到表单
          </button>
          <button
            type="button"
            className="bank-secondary-button"
            onClick={() => {
              setJsonText('')
              setMergeSummary('')
              setErrorMsg('')
            }}
          >
            清空文本
          </button>
        </div>

        {/* Status / Error Notifications */}
        {mergeSummary && (
          <div style={{ background: '#EBF4EE', border: '1px solid #B8DAC3', color: '#276749', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
            {mergeSummary}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}
        {statusMsg && !errorMsg && (
          <div style={{ background: '#F7F5F0', border: '1px solid #D8D2C7', color: '#4A423B', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Check size={15} color="#5A7865" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Live Interactive MindMap Preview */}
        <section className="bank-preview-section bank-preview-map" style={{ marginTop: 16 }}>
          <h4>全英文思维导图实时渲染</h4>
          <div style={{ border: '1px solid #E2DED5', borderRadius: 8, overflow: 'hidden', background: '#FFF' }}>
            <MindMap key={`${title}-${mindMapText.slice(0, 30)}`} data={mindMapPreview} />
          </div>
        </section>

        {/* Bottom Giant Save Button */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2DED5', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            className="bank-primary-button"
            style={{ minHeight: 46, padding: '0 24px', fontSize: 15, fontWeight: 700, borderRadius: 9999, background: '#1E1B18', color: '#EDEAE2', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            disabled={saving}
            onClick={handleSaveLesson}
          >
            <Check size={18} />
            {saving ? '保存中...' : '✅ 保存到口语题库'}
          </button>
        </div>
      </section>
    </div>
  )
}


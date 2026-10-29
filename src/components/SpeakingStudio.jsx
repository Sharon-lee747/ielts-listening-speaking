import SpeakingExamSimulator from './SpeakingExamSimulator.jsx'
import QuickTestFinder from './QuickTestFinder.jsx'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, ChevronDown, Clipboard, Download, FilePlus2, Headphones, Mic2, Plus, Sparkles, Trash2, Upload, Volume2, X } from 'lucide-react'
import MindMap from './MindMap.jsx'
import { getSpeakingTitle, sortByEnglishTitle } from '../data/lessonIndex.js'

export const PERSPECTIVE_OPTIONS = ['思路一', '思路二', '思路三', '思路四']

export const PART1_FULL_TEMPLATE = {
  title: 'Names',
  part: 'Part 1',
  topicCategory: '个人与日常生活',
  images: [
    {
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80',
      caption: 'Classical Gallery & Oil Paintings'
    }
  ],
  questions: [
    {
      question: 'Does your name have any special meaning?',
      sampleAnswer: 'Yes, it does. In Chinese culture, names often carry good wishes from parents. My name means brightness and wisdom, and my parents chose it hoping I would have an optimistic and thoughtful life.',
      perspective: '思路一',
    },
    {
      question: 'Do you like your name?',
      sampleAnswer: "I really do. It sounds gentle yet confident, and it connects me with my family's heritage. Over the years, it has become a central part of my identity.",
      perspective: '思路二',
    },
    {
      question: 'Are there any naming traditions in your country?',
      sampleAnswer: 'Traditionally, grandparents or fortune tellers would help pick characters based on birth elements. Nowadays, young parents focus more on positive meanings, melodious pronunciation, and uniqueness.',
      perspective: '思路三',
    },
  ],
  vocabulary: [
    {
      term: 'carry good wishes',
      pos: 'v. phr.',
      chinese: '寄托美好祝愿',
      exampleSentence: 'In Chinese culture, names often carry good wishes from parents.',
    },
    {
      term: 'central part of my identity',
      pos: 'n. phr.',
      chinese: '个人认同的核心部分',
      exampleSentence: 'Over the years, my name has become a central part of my identity.',
    },
    {
      term: 'melodious pronunciation',
      pos: 'n. phr.',
      chinese: '优美悦耳的发音',
      exampleSentence: 'Parents focus more on melodious pronunciation and positive meanings.',
    },
  ],
  mindMap: {
    label: 'Names and Identity',
    children: [
      {
        label: 'Name Meaning',
        children: [
          { label: 'Brightness and wisdom' },
          { label: 'Family expectations' },
        ],
      },
      {
        label: 'Personal Feelings',
        children: [
          { label: 'Gentle and confident sound' },
          { label: 'Sense of heritage' },
        ],
      },
      {
        label: 'Cultural Traditions',
        children: [
          { label: 'Birth elements in the past' },
          { label: 'Modern uniqueness and melody' },
        ],
      },
    ],
  },
}

export const PART23_FULL_TEMPLATE = {
  title: 'A Memorable Journey',
  part: 'Part 2 & 3',
  topicCategory: '旅行与探索',
  questionPrompt: 'Part 2: Describe a memorable journey you took by public transport.\nYou should say:\n- where you went\n- what kind of transport you used\n- who you were with\nand explain why this journey was so memorable.\n\nPart 3: Why is public transport important in modern cities? How can governments improve long-distance travel?',
  cueCardPoints: [
    'Where you went and when',
    'What transport you took',
    'Who accompanied you',
    'Why the experience was memorable',
  ],
  sampleAnswer: 'I would like to describe a scenic train journey I took across the Scottish Highlands two summers ago with an old college friend. We boarded the train early in the morning from Edinburgh heading towards Fort William. The route wound through rolling green hills, shimmering lochs, and historic viaducts. What struck me most was the contrast between the tranquil carriages and the dramatic, ever-changing weather outside. It offered a rare opportunity to disconnect from digital noise, gaze at untamed landscapes, and have deep conversations that we rarely have time for in our busy daily lives. That sense of peaceful immersion made it truly unforgettable.',
  vocabulary: [
    {
      term: 'scenic train journey',
      pos: 'n. phr.',
      chinese: '风景如画的火车之旅',
      exampleSentence: 'We embarked on a scenic train journey across the highlands.',
    },
    {
      term: 'disconnect from digital noise',
      pos: 'v. phr.',
      chinese: '远离数字噪音/电子设备干扰',
      exampleSentence: 'The trip offered a rare opportunity to disconnect from digital noise.',
    },
    {
      term: 'untamed landscapes',
      pos: 'n. phr.',
      chinese: '未受破坏的原生态自然风貌',
      exampleSentence: 'We spent hours gazing at the untamed landscapes through the window.',
    },
  ],
  mindMap: {
    label: 'Highland Train Journey',
    children: [
      {
        label: 'Context and Route',
        children: [
          { label: 'Scottish Highlands with college friend' },
          { label: 'Rolling hills and historic viaducts' },
        ],
      },
      {
        label: 'Atmosphere and Highlights',
        children: [
          { label: 'Tranquil carriage environment' },
          { label: 'Dramatic changing weather' },
        ],
      },
      {
        label: 'Personal Reflection',
        children: [
          { label: 'Disconnect from digital distractions' },
          { label: 'Unforgettable peaceful immersion' },
        ],
      },
    ],
  },
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `speaking-${Date.now()}`
}

function sectionText(text, names) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((line) => names.some((name) => new RegExp(`^\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?${name}(?:\\*\\*)?\\s*[:：]?\\s*$`, 'i').test(line.trim())))
  if (start < 0) return ''
  const body = []
  for (const line of lines.slice(start + 1)) {
    if (/^\s*#{1,6}\s/.test(line) || /^\s*\*\*[^*]+\*\*\s*[:：]?\s*$/.test(line)) break
    body.push(line)
  }
  return body.join('\n').trim()
}

function makeMindMap(text, topic, question) {
  const labels = ['Background and context', 'Key details and actions', 'Reflection and impact']
  const treeLines = text.split(/\r?\n/)
  const headingIndex = treeLines.findIndex((line) => /mind map|mindmap|思维导图|speaking outline/i.test(line))
  const entries = []
  if (headingIndex >= 0) {
    for (const line of treeLines.slice(headingIndex + 1)) {
      if (/^\s*#{1,6}\s/.test(line) || /^\s*\*\*[^*]+\*\*\s*[:：]?\s*$/.test(line) || /vocabulary|词汇|sample answer|范文/i.test(line)) break
      const match = line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.+)$/)
      if (match) entries.push({ depth: Math.floor(match[1].replace(/\t/g, '  ').length / 2), label: match[2].replace(/\*\*/g, '').trim() })
    }
  }
  if (entries.length) {
    const root = { label: topic || 'Speaking Outline', children: [] }
    const stack = [{ depth: -1, node: root }]
    entries.forEach(({ depth, label }) => {
      const node = { label, children: [] }
      while (stack.length > 1 && stack.at(-1).depth >= depth) stack.pop()
      stack.at(-1).node.children.push(node)
      stack.push({ depth, node })
    })
    return root
  }
  const sentences = (text.match(/[^.!?]+[.!?]+/g) ?? []).map((sentence) => sentence.trim()).filter((sentence) => /[a-z]/i.test(sentence))
  return {
    label: topic || question || 'Speaking Topic',
    children: labels.map((label, index) => ({
      label,
      children: sentences.slice(index * 2, index * 2 + 2).map((sentence) => ({ label: sentence.length > 95 ? `${sentence.slice(0, 92).trim()}...` : sentence })),
    })).filter((branch) => branch.children.length),
  }
}

function parseVocabulary(text, sampleAnswer, topicCategory, lessonId, fallbackLessons = []) {
  const vocabSection = sectionText(text, ['Vocabulary(?:\\s+(?:Cards|List))?', 'Key Words?', '话题词汇', '高分词汇', '词汇表'])
  const vocabulary = []
  const lines = vocabSection.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  for (const line of lines) {
    if (/^\|?\s*(?:[-:|]+)\s*\|?$/.test(line) || (/\b(?:term|phrase|expression|pos|part of speech|meaning|example)\b/i.test(line) && line.includes('|'))) continue
    if (line.startsWith('|')) {
      const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean)
      if (cells.length >= 3) vocabulary.push({ term: cells[0].replace(/\*\*/g, ''), pos: cells[1], chinese: cells[2], exampleSentence: cells[3] ?? '' })
      continue
    }
    const bullet = line.replace(/^[-*+\d.)\s]+/, '').replace(/\*\*/g, '')
    const parts = bullet.split(/\s*[|｜;；—–]\s*/)
    const match = parts[0].match(/^(.+?)\s*\(([^)]+)\)\s*[:：-]?\s*(.*)$/)
    if (match) vocabulary.push({ term: match[1].trim(), pos: match[2].trim(), chinese: match[3].trim() || parts[1] || '', exampleSentence: parts.slice(2).join(' ') })
    else if (parts.length >= 3) vocabulary.push({ term: parts[0], pos: parts[1], chinese: parts[2], exampleSentence: parts.slice(3).join(' ') })
  }
  const unique = new Map()
  vocabulary.forEach((item, index) => {
    const term = item.term?.trim()
    if (!term) return
    unique.set(term.toLowerCase(), { id: `sv-${index + 1}`, term, pos: item.pos || 'phr.', chinese: item.chinese || '请教师确认释义', topicCategory, exampleSentence: item.exampleSentence || sampleAnswer, sourceTestId: lessonId })
  })
  if (!unique.size && fallbackLessons.length) {
    fallbackLessons.flatMap((lesson) => lesson.vocabulary ?? []).filter((item) => sampleAnswer.toLowerCase().includes(item.term.toLowerCase())).forEach((item, index) => {
      unique.set(item.term.toLowerCase(), { ...item, id: `sv-${index + 1}`, sourceTestId: lessonId, topicCategory })
    })
  }
  return [...unique.values()]
}

export function parsePastedSnippet(rawInput) {
  if (!rawInput || !rawInput.trim()) return { recognized: [], data: {} }
  const trimmed = rawInput.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let jsonParsed = null
  try {
    jsonParsed = JSON.parse(trimmed)
  } catch {
    const objStart = trimmed.indexOf('{')
    const objEnd = trimmed.lastIndexOf('}')
    const arrStart = trimmed.indexOf('[')
    const arrEnd = trimmed.lastIndexOf(']')

    if (arrStart >= 0 && arrEnd > arrStart && (objStart < 0 || arrStart < objStart)) {
      try {
        jsonParsed = JSON.parse(trimmed.slice(arrStart, arrEnd + 1))
      } catch {}
    }
    if (!jsonParsed && objStart >= 0 && objEnd > objStart) {
      try {
        jsonParsed = JSON.parse(trimmed.slice(objStart, objEnd + 1))
      } catch {}
    }
  }

  const result = {}
  const recognized = []

  if (Array.isArray(jsonParsed)) {
    if (jsonParsed.length > 0) {
      const first = jsonParsed[0]
      if (typeof first === 'object' && first !== null) {
        if ('term' in first || 'chinese' in first || 'pos' in first || 'translation' in first) {
          result.vocabulary = jsonParsed.map((item, idx) => ({
            id: item.id || `sv-${idx + 1}`,
            term: String(item.term || item.english || '').trim(),
            pos: String(item.pos || item.type || 'phr.').trim(),
            chinese: String(item.chinese || item.translation || item.meaning || '').trim(),
            exampleSentence: String(item.exampleSentence || item.example || '').trim(),
            topicCategory: item.topicCategory || '',
          })).filter((item) => item.term || item.chinese)
          recognized.push(`高分词汇 (${result.vocabulary.length}条)`)
        } else if ('question' in first || 'sampleAnswer' in first || 'answer' in first) {
          result.questions = jsonParsed.map((item, idx) => ({
            question: String(item.question || '').trim(),
            sampleAnswer: String(item.sampleAnswer || item.answer || '').trim(),
            perspective: PERSPECTIVE_OPTIONS.includes(item.perspective) ? item.perspective : (item.perspective || PERSPECTIVE_OPTIONS[idx % 4]),
          })).filter((item) => item.question || item.sampleAnswer)
          result.part = 'Part 1'
          recognized.push(`Part 1 分问题与范文 (${result.questions.length}题)`)
        }
      } else if ('url' in first || ('src' in first)) {
          result.images = jsonParsed.map((img, idx) => ({
            url: typeof img === 'string' ? img : (img.url || img.src || ''),
            caption: typeof img === 'object' ? (img.caption || img.alt || `Visual Reference ${idx + 1}`) : `Visual Reference ${idx + 1}`
          })).filter((img) => img.url)
          recognized.push(`话题视觉图片 (${result.images.length}张)`)
        } else if (typeof first === 'string') {
        result.cueCardPoints = jsonParsed.map((s) => String(s).trim()).filter(Boolean)
        recognized.push(`提纲要点 (${result.cueCardPoints.length}条)`)
      }
    }
  } else if (jsonParsed && typeof jsonParsed === 'object') {
    if (jsonParsed.mindMap && typeof jsonParsed.mindMap === 'object' && jsonParsed.mindMap.label) {
      result.mindMap = jsonParsed.mindMap
      recognized.push('全英文思维导图')
    } else if (jsonParsed.label && Array.isArray(jsonParsed.children) && !jsonParsed.sampleAnswer && !jsonParsed.questions) {
      result.mindMap = jsonParsed
      recognized.push('全英文思维导图')
    }

    if (Array.isArray(jsonParsed.images) && jsonParsed.images.length > 0) {
      result.images = jsonParsed.images.map((img, idx) => {
        if (typeof img === 'string') return { url: img, caption: `Visual Reference ${idx + 1}` }
        return { url: img.url || '', caption: img.caption || img.alt || `Visual Reference ${idx + 1}` }
      }).filter((img) => img.url)
      recognized.push(`话题视觉图片 (${result.images.length}张)`)
    }

    if (Array.isArray(jsonParsed.vocabulary) && jsonParsed.vocabulary.length > 0) {
      result.vocabulary = jsonParsed.vocabulary.map((item, idx) => ({
        id: item.id || `sv-${idx + 1}`,
        term: String(item.term || item.english || '').trim(),
        pos: String(item.pos || item.type || 'phr.').trim(),
        chinese: String(item.chinese || item.translation || item.meaning || '').trim(),
        exampleSentence: String(item.exampleSentence || item.example || '').trim(),
        topicCategory: item.topicCategory || '',
      })).filter((item) => item.term || item.chinese)
      recognized.push(`高分词汇 (${result.vocabulary.length}条)`)
    }

    if (Array.isArray(jsonParsed.questions) && jsonParsed.questions.length > 0) {
      result.questions = jsonParsed.questions.map((item, idx) => ({
        question: String(item.question || '').trim(),
        sampleAnswer: String(item.sampleAnswer || item.answer || '').trim(),
        perspective: PERSPECTIVE_OPTIONS.includes(item.perspective) ? item.perspective : (item.perspective || PERSPECTIVE_OPTIONS[idx % 4]),
      })).filter((item) => item.question || item.sampleAnswer)
      recognized.push(`Part 1 分问题与范文 (${result.questions.length}题)`)
      if (!result.part) result.part = 'Part 1'
    }

    if (jsonParsed.cueCardPoints) {
      result.cueCardPoints = Array.isArray(jsonParsed.cueCardPoints)
        ? jsonParsed.cueCardPoints.map((s) => String(s).trim()).filter(Boolean)
        : String(jsonParsed.cueCardPoints).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      recognized.push(`提纲要点 (${result.cueCardPoints.length}条)`)
    }

    if (jsonParsed.sampleAnswer || jsonParsed.sampleSpeech) {
      result.sampleAnswer = String(jsonParsed.sampleAnswer || jsonParsed.sampleSpeech).trim()
      recognized.push('范例答案')
    }

    if (jsonParsed.questionPrompt || jsonParsed.prompt) {
      result.questionPrompt = String(jsonParsed.questionPrompt || jsonParsed.prompt).trim()
      recognized.push('口语题目/Cue Card')
    }

    if (jsonParsed.title) {
      result.title = String(jsonParsed.title).trim()
      recognized.push('题目名称')
    }

    if (jsonParsed.topicCategory || jsonParsed.category) {
      result.topicCategory = String(jsonParsed.topicCategory || jsonParsed.category).trim()
      recognized.push('话题大类')
    }

    if (jsonParsed.part) {
      result.part = String(jsonParsed.part).trim()
      recognized.push('Part 分类')
    }
  }

  // Fallback for markdown/text if JSON didn't catch mindMap or vocabulary
  if (!result.mindMap && /mind map|mindmap|思维导图/i.test(trimmed)) {
    const mm = makeMindMap(trimmed, result.title || 'Speaking Outline', result.questionPrompt || '')
    if (mm && mm.children && mm.children.length > 0) {
      result.mindMap = mm
      recognized.push('思维导图 (文本提取)')
    }
  }

  if (!result.vocabulary || !result.vocabulary.length) {
    const voc = parseVocabulary(trimmed, result.sampleAnswer || '', result.topicCategory || '', 'pasted', [])
    if (voc && voc.length > 0) {
      result.vocabulary = voc
      recognized.push(`词汇表 (文本提取 ${voc.length}条)`)
    }
  }

  return { recognized, data: result }
}

function promptForPart(part = 'Part 1', lesson) {
  if (part === 'Part 1') {
    return `请以 IELTS Speaking 教研老师身份，生成 IELTS Speaking Part 1 教学内容 JSON。
严格遵循数据规范：
{
  "title": "${getSpeakingTitle(lesson) || 'Names'}",
  "part": "Part 1",
  "topicCategory": "${lesson?.topicCategory || '个人与日常生活'}",
  "questions": [
    {
      "question": "英文具体分问题 1",
      "sampleAnswer": "自然口语化、地道的 IELTS 7.5 水平高分回答",
      "perspective": "思路一"
    },
    {
      "question": "英文具体分问题 2",
      "sampleAnswer": "自然口语化的高分回答",
      "perspective": "思路二"
    },
    {
      "question": "英文具体分问题 3",
      "sampleAnswer": "自然口语化的高分回答",
      "perspective": "思路三"
    }
  ],
  "vocabulary": [
    {
      "term": "高分核心词汇/短语",
      "pos": "词性（如 n. phr. / idiom）",
      "chinese": "地道中文释义",
      "exampleSentence": "包含该词汇的范例文句"
    }
  ],
  "mindMap": {
    "label": "导图主题英文",
    "children": [
      {
        "label": "分支英文",
        "children": [
          { "label": "细节要点英文" }
        ]
      }
    ]
  }
}
要求：仅输出合法 JSON，不要 Markdown 代码围栏。perspective 必须为 ["思路一", "思路二", "思路三", "思路四"] 之一。MindMap 全英文。`
  }

  return `请以 IELTS Speaking 教研老师身份，生成 IELTS Speaking Part 2 & 3 教学内容 JSON。
严格遵循数据规范：
{
  "title": "${getSpeakingTitle(lesson) || 'A Memorable Journey'}",
  "part": "Part 2 & 3",
  "topicCategory": "${lesson?.topicCategory || '旅行与探索'}",
  "questionPrompt": "完整的 Part 2 Cue Card 与 Part 3 讨论题目提示",
  "cueCardPoints": [
    "Where you went and when",
    "What transport you took",
    "Who accompanied you",
    "Why the experience was memorable"
  ],
  "sampleAnswer": "自然口语化、连贯且地道的 IELTS 7.5 水平高分范文",
  "vocabulary": [
    {
      "term": "高分核心词汇/短语",
      "pos": "词性",
      "chinese": "中文释义",
      "exampleSentence": "包含该词汇的范例文句"
    }
  ],
  "mindMap": {
    "label": "Mind Map Root Label",
    "children": [
      {
        "label": "Branch Label",
        "children": [
          { "label": "Sub-point Label" }
        ]
      }
    ]
  }
}
要求：仅输出合法 JSON，不要 Markdown 代码围栏。MindMap 全英文。`
}

function speakingPartType(lesson) {
  return /^part\s*1\b/i.test(lesson?.part ?? '') ? 'Part 1' : 'Part 2 & 3'
}

function speak(term) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(term)
  utterance.lang = 'en-GB'
  window.speechSynthesis.speak(utterance)
}

function flattenMindMap(node, depth = 0) {
  if (!node || !node.label) return ''
  return [`${'  '.repeat(depth)}- ${node.label}`, ...(node.children ?? []).flatMap((child) => flattenMindMap(child, depth + 1))].join('\n')
}

function parseMindMapOutline(text, rootLabel) {
  const lines = text.split(/\r?\n/).map((line) => {
    const match = line.match(/^(\s*)(?:[-*+]|\d+[.)])?\s*(.+?)\s*$/)
    return match?.[2] ? { depth: Math.floor(match[1].replace(/\t/g, '  ').length / 2), label: match[2] } : null
  }).filter(Boolean)
  const root = { label: lines[0]?.label ?? rootLabel ?? 'Speaking Outline', children: [] }
  const rootDepth = lines[0]?.depth ?? 0
  const stack = [{ depth: -1, node: root }]
  lines.slice(1).forEach(({ depth, label }) => {
    const relativeDepth = Math.max(0, depth - rootDepth)
    const node = { label, children: [] }
    while (stack.length > 1 && stack.at(-1).depth >= relativeDepth) stack.pop()
    stack.at(-1).node.children.push(node)
    stack.push({ depth: relativeDepth, node })
  })
  return root
}

const emptyLesson = {
  id: '',
  title: 'New speaking practice',
  part: 'Part 1',
  topicCategory: '',
  questionPrompt: '',
  questions: [],
  cueCardPoints: [],
  audioUrl: '',
  sampleAnswer: '',
  vocabulary: [],
  mindMap: { label: 'Speaking Outline', children: [] },
  images: [],
}

function asSet(lesson, label = 'Set 1', id = 'set-1') {
  return {
    id,
    label,
    part: lesson.part,
    topicCategory: lesson.topicCategory,
    questionPrompt: lesson.questionPrompt,
    questions: lesson.questions ?? [],
    cueCardPoints: lesson.cueCardPoints ?? [],
    sampleAnswer: lesson.sampleAnswer ?? '',
    vocabulary: lesson.vocabulary ?? [],
    mindMap: lesson.mindMap,
    audioUrl: lesson.audioUrl ?? '',
    images: lesson.images ?? [],
  }
}

function prepareSets(sets, ownerId) {
  return sets.map((set) => ({
    ...set,
    vocabulary: (set.vocabulary ?? []).map((item, index) => ({
      ...item,
      id: `${slug(set.id || set.label)}-${index + 1}`,
      sourceTestId: ownerId,
      topicCategory: item.topicCategory || set.topicCategory,
    })),
  }))
}

function getLessonSets(lesson) {
  return lesson?.sets?.length ? lesson.sets : []
}

function PartOneContent({ lesson, revealedAnswers, onToggleAnswer }) {
  return (
    <div className="speaking-part1-content">
      <div className="speaking-part1-topic-banner">
        <span className="speaking-part1-topic-kicker">TOPIC · PART 1</span>
        <h4>{getSpeakingTitle(lesson)}</h4>
      </div>
      {(lesson.questions ?? []).map((item, index) => {
        const key = `${lesson.id}:${index}`
        const revealed = Boolean(revealedAnswers[key])
        const perspective = item.perspective || PERSPECTIVE_OPTIONS[index % 4] || '思路一'
        const perspectiveIndex = PERSPECTIVE_OPTIONS.indexOf(perspective) >= 0 ? PERSPECTIVE_OPTIONS.indexOf(perspective) : (index % 4)

        return (
          <article className="speaking-part1-card" key={`${index}-${item.question}`}>
            <div className="speaking-part1-header-bar">
              <div className="speaking-part1-q-title">
                <span className="speaking-q-pill">Q{index + 1}</span>
                <h5 className="speaking-part1-question-line">{item.question}</h5>
              </div>
            </div>
            <div
              className={`speaking-sample-answer ${revealed ? 'revealed' : 'concealed'}`}
              data-perspective={perspective}
              data-perspective-index={perspectiveIndex}
              role="group"
              tabIndex={0}
              aria-label={revealed ? '范例答案（按 Enter 隐藏）' : `${perspective} 范例答案（点击或按 Enter 显示）`}
              onClick={() => onToggleAnswer(key)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onToggleAnswer(key)
                }
              }}
            >
              <div className="speaking-sample-answer-meta">
                <span>Sample answer</span>
                {revealed && (
                  <span className="speaking-perspective-badge-inline">
                    {perspective}
                  </span>
                )}
              </div>
              {revealed ? (
                <p>{item.sampleAnswer}</p>
              ) : (
                <div className="speaking-concealed-placeholder">
                  <span className="speaking-concealed-hint">{perspective} · 点击查看示范答案</span>
                  <span className="speaking-concealed-icon">◌</span>
                </div>
              )}
              <button
                type="button"
                aria-label={revealed ? '隐藏答案' : '显示答案'}
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleAnswer(key)
                }}
              >
                {revealed ? '◉' : '◌'}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function TopicVisualGallery({ images = [] }) {
  const normalizedImages = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) return []
    return images
      .map((item, idx) => {
        if (typeof item === 'string') {
          return { url: item, caption: `Visual Reference ${idx + 1}` }
        }
        if (item && typeof item === 'object' && item.url) {
          return {
            url: item.url,
            caption: item.caption || item.alt || `Visual Reference ${idx + 1}`,
          }
        }
        return null
      })
      .filter(Boolean)
  }, [images])

  const [currentIndex, setCurrentIndex] = useState(0)
  const total = normalizedImages.length

  useEffect(() => {
    if (currentIndex >= total) {
      setCurrentIndex(Math.max(0, total - 1))
    }
  }, [total, currentIndex])

  const goToPrev = () => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }

  const goToNext = () => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev + 1) % total)
  }

  const [dragStartX, setDragStartX] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = (e) => {
    if (total <= 1) return
    setDragStartX(e.clientX ?? e.touches?.[0]?.clientX)
    setIsDragging(true)
  }

  const handlePointerUp = (e) => {
    if (!isDragging || dragStartX === null) return
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX
    if (endX !== undefined) {
      const diff = endX - dragStartX
      if (diff > 45) {
        goToPrev()
      } else if (diff < -45) {
        goToNext()
      }
    }
    setIsDragging(false)
    setDragStartX(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goToPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goToNext()
    }
  }

  const getCardClass = (index) => {
    if (total <= 1) return 'is-active'
    const diff = (index - currentIndex + total) % total
    if (diff === 0) return 'is-active'
    if (diff === 1 || (total === 2 && diff === 1)) return 'is-next'
    if (diff === total - 1) return 'is-prev'
    return 'is-hidden'
  }

  if (total === 0) {
    return (
      <section className="speaking-result-panel speaking-gallery-panel">
        <div className="speaking-result-heading">
          <div>
            <span className="eyebrow-small">TOPIC VISUAL PORTFOLIO</span>
            <h3>口语话题视觉画廊</h3>
          </div>
          <span className="speaking-map-tag">0 EXHIBITS</span>
        </div>
        <div className="speaking-gallery-empty-frame">
          <div className="speaking-gallery-empty-inner">
            <div className="speaking-gallery-empty-icon-wrap">
              <span className="speaking-gallery-empty-icon">🏛️</span>
            </div>
            <p className="speaking-gallery-empty-title">暂未配置话题视觉图片</p>
            <span className="speaking-gallery-empty-sub">
              可在口语题编辑表单中上传或关联相关高清话题图谱与艺术陈列
            </span>
          </div>
        </div>
      </section>
    )
  }

  const currentImg = normalizedImages[currentIndex] || normalizedImages[0]

  return (
    <section className="speaking-result-panel speaking-gallery-panel">
      <div className="speaking-result-heading">
        <div>
          <span className="eyebrow-small">TOPIC VISUAL PORTFOLIO</span>
          <h3>口语话题视觉画廊</h3>
        </div>
        <span className="speaking-map-tag">{total} EXHIBITS</span>
      </div>

      <div
        className="speaking-3d-stage"
        role="region"
        aria-label="3D 话题视觉画廊"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      >
        <div className="speaking-3d-track">
          {normalizedImages.map((img, idx) => {
            const cardClass = getCardClass(idx)
            return (
              <div
                key={`${img.url}-${idx}`}
                className={`speaking-3d-card ${cardClass}`}
                onClick={() => {
                  if (cardClass === 'is-prev') goToPrev()
                  if (cardClass === 'is-next') goToNext()
                }}
              >
                <img
                  src={img.url}
                  alt={img.caption || `Topic Visual ${idx + 1}`}
                  loading="lazy"
                  draggable={false}
                />
                <div className="speaking-3d-card-glare" />
                {cardClass === 'is-active' && img.caption && (
                  <div className="speaking-3d-card-caption-overlay">
                    <span>{img.caption}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="speaking-gallery-controls">
        <button
          type="button"
          className="speaking-gallery-arrow-btn"
          aria-label="上一张图片"
          onClick={goToPrev}
          disabled={total <= 1}
        >
          ⟨
        </button>
        <div className="speaking-gallery-counter-tag">
          <span className="speaking-gallery-idx">
            {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          {currentImg?.caption && (
            <>
              <span className="speaking-gallery-sep">·</span>
              <span className="speaking-gallery-caption">{currentImg.caption}</span>
            </>
          )}
        </div>
        <button
          type="button"
          className="speaking-gallery-arrow-btn"
          aria-label="下一张图片"
          onClick={goToNext}
          disabled={total <= 1}
        >
          ⟩
        </button>
      </div>
    </section>
  )
}

function PartTwoContent({ lesson, answerDraft, onAnswerChange, revealed, onToggleAnswer }) {
  const answerKey = `${lesson.id}:sample-answer`
  return (
    <div className="speaking-part2-content">
      <div className="speaking-prompt-card">
        <span className="speaking-label-kicker">SPEAKING QUESTION</span>
        <p>{lesson.questionPrompt}</p>
      </div>
      {lesson.cueCardPoints?.length > 0 && (
        <div className="speaking-cue-points">
          <h4>Part 2 Cue Card</h4>
          <ul>
            {lesson.cueCardPoints.map((point, index) => (
              <li key={`${index}-${point}`}>{point}</li>
            ))}
          </ul>
        </div>
      )}
      <SpeakingExamSimulator lesson={lesson} />
      <div className="speaking-section-divider">
        <span className="section-index">02</span>
        <div>
          <h3>Sample answer</h3>
        </div>
      </div>
      {revealed ? (
        <div className="speaking-answer-revealed-wrap">
          <button
            type="button"
            className="speaking-answer-toggle"
            aria-label="隐藏范例答案"
            onClick={() => onToggleAnswer(answerKey)}
          >
            ◉
          </button>
          <textarea
            className="speaking-answer-input speaking-sample-answer-large"
            aria-label="Sample answer"
            value={answerDraft || lesson.sampleAnswer}
            onChange={(event) => onAnswerChange?.(event.target.value)}
          />
        </div>
      ) : (
        <button
          type="button"
          className="speaking-answer-concealed speaking-answer-concealed-large"
          data-answer-index="0"
          aria-label="点击显示 Sample answer"
          onClick={() => onToggleAnswer(answerKey)}
        />
      )}
    </div>
  )
}

function combineSetMaps(sets, topic) {
  return {
    label: topic || 'Speaking Topics',
    children: sets.map((set) => ({
      label: set.label,
      children: [{ label: set.mindMap?.label || set.topicCategory || set.label, children: set.mindMap?.children ?? [] }],
    })),
  }
}

export default function SpeakingStudio({
  lessons,
  audioFiles,
  onUploadAudio,
  onUploadSpeakingImage,
  onDeleteSpeakingLesson,
  onSaveSpeakingLesson,
  selectedLessonId = '',
  onLessonIdChange,
  mindMapDrafts = {},
  onMindMapDraftChange,
  onMindMapSave,
  onMindMapReset,
  topics,
  onNavigateListening,
}) {
  const [selectedId, setSelectedId] = useState(() => selectedLessonId || localStorage.getItem('ielts-speaking-selected-id') || lessons[0]?.id || '')
  const [answerDraft, setAnswerDraft] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [feedback, setFeedback] = useState('已载入口语示例题库，可直接切换课程练习。')
  const [importError, setImportError] = useState('')
  const [parseSuccessMsg, setParseSuccessMsg] = useState('')
  const [templateTab, setTemplateTab] = useState('Part 1')
  const [copyNotice, setCopyNotice] = useState('')
  const [showTemplateCode, setShowTemplateCode] = useState(false)
  const [currentImported, setCurrentImported] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [editing, setEditing] = useState(false)
  const [manualForm, setManualForm] = useState(null)
  const [manualError, setManualError] = useState('')
  const [manualSaving, setManualSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteScope, setDeleteScope] = useState('set')
  const [deleteAudio, setDeleteAudio] = useState(false)
  const [selectedSetId, setSelectedSetId] = useState('all')
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergeLabel, setMergeLabel] = useState('')
  const [mergeMode, setMergeMode] = useState('independent')
  const [manualQuestionDraft, setManualQuestionDraft] = useState([])
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [vocabularyMode, setVocabularyMode] = useState(() => localStorage.getItem('ielts-speaking-vocabulary-mode') || 'all')
  const [revealedVocabulary, setRevealedVocabulary] = useState({})
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageCaption, setNewImageCaption] = useState('')

  const lesson = lessons.find((item) => item.id === selectedId) ?? currentImported ?? lessons[0] ?? emptyLesson
  const topicCategories = useMemo(() => [...new Set(lessons.map((item) => item.topicCategory || '未分类'))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [lessons])
  const [selectedTopic, setSelectedTopic] = useState(lesson.topicCategory || '')
  const [selectedPart, setSelectedPart] = useState(speakingPartType(lesson))
  const topicsForCategory = useMemo(() => lessons.filter((item) => item.topicCategory === selectedTopic), [lessons, selectedTopic])
  const lessonsForCategoryPart = useMemo(() => sortByEnglishTitle(topicsForCategory.filter((item) => speakingPartType(item) === selectedPart), getSpeakingTitle), [topicsForCategory, selectedPart])
  const lessonSets = getLessonSets(lesson)
  const activeSet = lessonSets.length === 1 ? lessonSets[0] : lessonSets.find((item) => item.id === selectedSetId)
  const displayLesson = activeSet ? { ...lesson, ...activeSet } : lesson
  const displayImages = activeSet?.images?.length ? activeSet.images : (displayLesson.images?.length ? displayLesson.images : (lesson.images ?? []))
  const activeVocabulary = activeSet ? activeSet.vocabulary ?? [] : lessonSets.length ? lessonSets.flatMap((item) => item.vocabulary ?? []) : lesson.vocabulary ?? []
  const deleteTargetAudioUrls = (deleteScope === 'set' && activeSet ? [activeSet.audioUrl] : lessonSets.length ? lessonSets.map((set) => set.audioUrl) : [lesson.audioUrl]).filter((url) => url?.startsWith('/audio/'))
  const mapKey = `speaking:${lesson.id}${activeSet ? `:${activeSet.id}` : ''}`
  const activeMap = mindMapDrafts[mapKey] ?? (activeSet?.mindMap ?? (lessonSets.length ? lesson.mindMap ?? combineSetMaps(lessonSets, lesson.topicCategory) : lesson.mindMap))
  const mindMapPreview = useMemo(() => manualForm ? parseMindMapOutline(manualForm.mindMapText, manualForm.title || 'Speaking Outline') : activeMap, [manualForm, activeMap])

  useEffect(() => {
    if (selectedLessonId && lessons.some((item) => item.id === selectedLessonId)) setSelectedId(selectedLessonId)
  }, [selectedLessonId, lessons])

  useEffect(() => {
    if (lesson.topicCategory) setSelectedTopic(lesson.topicCategory)
    setSelectedPart(speakingPartType(lesson))
    localStorage.setItem('ielts-speaking-selected-id', lesson.id)
    onLessonIdChange?.(lesson.id)
  }, [lesson.id, lesson.topicCategory, lesson.part])

  useEffect(() => {
    localStorage.setItem('ielts-speaking-vocabulary-mode', vocabularyMode)
  }, [vocabularyMode])

  function selectLesson(nextId) {
    setSelectedId(nextId)
    const nextLesson = lessons.find((item) => item.id === nextId)
    if (nextLesson) {
      setSelectedTopic(nextLesson.topicCategory || '未分类')
      setSelectedPart(speakingPartType(nextLesson))
    }
    setCurrentImported(null)
    setAnswerDraft('')
    setSelectedSetId('all')
    setFeedback('已切换口语练习。')
  }

  function toggleAnswer(key) {
    setRevealedAnswers((current) => ({ ...current, [key]: !current[key] }))
  }

  async function saveMergedLesson(incoming, targetId, label) {
    const target = lessons.find((item) => item.id === targetId)
    if (!target) throw new Error('请选择要合并到的口语题。')
    const existingSets = getLessonSets(target)
    const sets = existingSets.length ? existingSets : [asSet(target)]
    const setLabel = label.trim() || `Set ${sets.length + 1}`
    const setId = slug(setLabel)
    if (sets.some((set) => set.id === setId)) throw new Error('该子集标签已存在，请换一个名称。')
    const mergedSets = prepareSets([...sets, asSet(incoming, setLabel, setId)], target.id)
    const merged = { ...target, sets: mergedSets, vocabulary: mergedSets.flatMap((set) => set.vocabulary) }
    merged.mindMap = combineSetMaps(merged.sets, target.topicCategory)
    const saved = await onSaveSpeakingLesson(merged)
    if (!saved) throw new Error('合并内容未能保存到浏览器。')
    setCurrentImported(merged)
    setSelectedId(target.id)
    setSelectedSetId(setId)
    return saved
  }

  async function mergeCurrentLesson() {
    if (!mergeTargetId || mergeTargetId === lesson.id) {
      setManualError('请选择另一道口语题作为合并目标。')
      return
    }
    try {
      const target = lessons.find((item) => item.id === mergeTargetId)
      if (!target) throw new Error('请选择要合并到的口语题。')
      const existingSets = getLessonSets(target)
      const sets = existingSets.length ? existingSets : [asSet(target)]
      const setLabel = mergeLabel.trim() || `Set ${sets.length + 1}`
      const setId = slug(setLabel)
      if (sets.some((set) => set.id === setId)) throw new Error('该子集标签已存在，请换一个名称。')
      const mergedSets = prepareSets([...sets, asSet(lesson, setLabel, setId)], target.id)
      const merged = { ...target, sets: mergedSets, vocabulary: mergedSets.flatMap((set) => set.vocabulary) }
      merged.mindMap = combineSetMaps(merged.sets, target.topicCategory)
      const saved = await onSaveSpeakingLesson(merged)
      if (!saved) throw new Error('目标口语题保存失败。')
      await onDeleteSpeakingLesson(lesson)
      setSelectedId(merged.id)
      setSelectedSetId(slug(setLabel))
      setCurrentImported(merged)
      setMergeOpen(false)
      setFeedback('已将当前口语题合并为目标题目下的子集。')
    } catch (error) {
      setManualError(`合并失败：${error.message}`)
    }
  }

  async function copySnippet(type) {
    const isP1 = templateTab === 'Part 1'
    let textToCopy = ''
    let label = ''

    if (type === 'full') {
      textToCopy = JSON.stringify(isP1 ? PART1_FULL_TEMPLATE : PART23_FULL_TEMPLATE, null, 2)
      label = `${templateTab} 完整 JSON 模板`
    } else if (type === 'questions') {
      if (isP1) {
        textToCopy = JSON.stringify(PART1_FULL_TEMPLATE.questions, null, 2)
        label = 'Part 1 分问题与范例答案 (questions)'
      } else {
        textToCopy = JSON.stringify({
          questionPrompt: PART23_FULL_TEMPLATE.questionPrompt,
          cueCardPoints: PART23_FULL_TEMPLATE.cueCardPoints,
          sampleAnswer: PART23_FULL_TEMPLATE.sampleAnswer,
        }, null, 2)
        label = 'Part 2 & 3 题目与范例答案 (sampleAnswer)'
      }
    } else if (type === 'vocabulary') {
      textToCopy = JSON.stringify(isP1 ? PART1_FULL_TEMPLATE.vocabulary : PART23_FULL_TEMPLATE.vocabulary, null, 2)
      label = '高分核心词汇 (vocabulary)'
    } else if (type === 'mindMap') {
      textToCopy = JSON.stringify(isP1 ? PART1_FULL_TEMPLATE.mindMap : PART23_FULL_TEMPLATE.mindMap, null, 2)
      label = '全英文思维导图 (mindMap)'
    } else if (type === 'prompt') {
      textToCopy = promptForPart(templateTab, displayLesson)
      label = `${templateTab} Gemini 提示词`
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopyNotice(`✓ 已复制：${label}`)
      setTimeout(() => setCopyNotice(''), 3000)
    } catch {
      setCopyNotice('剪贴板不可用，请手动选择复制')
      setTimeout(() => setCopyNotice(''), 3000)
    }
  }

  function handleParseAndMerge() {
    setImportError('')
    setParseSuccessMsg('')
    const input = importText.trim()
    if (!input) {
      setImportError('请先粘贴 JSON 代码或文本片段。')
      return
    }

    const { recognized, data } = parsePastedSnippet(input)
    if (!recognized.length) {
      setImportError('未能识别到有效的 JSON 对象或局部数据模块，请参考上方模板格式。')
      return
    }

    // Incremental merge into manual edit form
    if (editing && manualForm) {
      setManualForm((current) => {
        if (!current) return current
        const next = { ...current }
        if (data.title) next.title = data.title
        if (data.topicCategory) next.topicCategory = data.topicCategory
        if (data.part) next.part = data.part
        if (data.questionPrompt) next.questionPrompt = data.questionPrompt
        if (data.sampleAnswer) next.sampleAnswer = data.sampleAnswer
        if (data.cueCardPoints !== undefined) {
          next.cueCardText = Array.isArray(data.cueCardPoints) ? data.cueCardPoints.join('\n') : String(data.cueCardPoints)
        }
        if (data.mindMap) {
          next.mindMapText = flattenMindMap(data.mindMap)
        }
        if (data.vocabulary && data.vocabulary.length > 0) {
          next.vocabulary = data.vocabulary.map((item, idx) => ({
            ...item,
            id: item.id || `sv-${idx + 1}`,
            topicCategory: next.topicCategory || item.topicCategory || '',
          }))
        }
        return next
      })

      if (data.images && data.images.length > 0) {
        setManualForm((current) => current ? ({ ...current, images: data.images }) : current)
      }

      if (data.questions && data.questions.length > 0) {
        setManualQuestionDraft(data.questions.map((q, idx) => ({
          question: q.question,
          sampleAnswer: q.sampleAnswer,
          perspective: q.perspective || PERSPECTIVE_OPTIONS[idx % 4],
        })))
        setManualForm((current) => current ? ({ ...current, part: 'Part 1' }) : current)
      }

      const success = `✓ 成功解析并增量填充：${recognized.join('、')}！左侧表单中已有的手动输入已全部保留。`
      setParseSuccessMsg(success)
      setFeedback(success)
      return
    }

    // If viewing mode: build preview merging with displayLesson
    const currentBase = displayLesson || lesson || emptyLesson
    const previewLesson = {
      ...currentBase,
      id: data.id || currentBase.id || `spk-${Date.now().toString(36)}`,
      title: data.title !== undefined ? data.title : currentBase.title,
      part: data.part || (data.questions?.length ? 'Part 1' : currentBase.part),
      topicCategory: data.topicCategory || currentBase.topicCategory || '未分类',
      questionPrompt: data.questionPrompt !== undefined ? data.questionPrompt : currentBase.questionPrompt,
      sampleAnswer: data.sampleAnswer !== undefined ? data.sampleAnswer : currentBase.sampleAnswer,
      cueCardPoints: data.cueCardPoints !== undefined ? data.cueCardPoints : (currentBase.cueCardPoints ?? []),
      questions: data.questions !== undefined ? data.questions : (currentBase.questions ?? []),
      vocabulary: (data.vocabulary && data.vocabulary.length > 0)
        ? data.vocabulary.map((item, idx) => ({ ...item, id: item.id || `sv-${idx + 1}`, sourceTestId: currentBase.id }))
        : (currentBase.vocabulary ?? []),
      mindMap: data.mindMap || currentBase.mindMap,
      images: data.images !== undefined ? data.images : (currentBase.images ?? []),
    }
    setImportPreview(previewLesson)
    setParseSuccessMsg(`✓ 成功识别局部模块：${recognized.join('、')}。其余字段已自动复用当前课程内容。`)
  }

  async function handleSavePreview() {
    if (!importPreview) return
    const hasQuestions = Array.isArray(importPreview.questions) && importPreview.questions.some((q) => q.question?.trim() || q.sampleAnswer?.trim())
    const hasSampleAnswer = Boolean(importPreview.sampleAnswer?.trim())
    const hasTitle = Boolean(importPreview.title?.trim() || importPreview.questionPrompt?.trim())
    if (!hasTitle || (!hasQuestions && !hasSampleAnswer)) {
      setImportError('无法保存无内容空白题：请确保口语题目包含具体题目名称，以及至少一个小问题或主范文。')
      return
    }
    try {
      const targetId = mergeTargetId
      const saved = mergeMode === 'merge' ? await saveMergedLesson(importPreview, targetId, mergeLabel) : await onSaveSpeakingLesson(importPreview)
      if (!saved) throw new Error('浏览器本地空间不足，无法保存该口语课。')
      if (mergeMode !== 'merge') {
        setCurrentImported(importPreview)
        setSelectedId(importPreview.id)
        setSelectedSetId('all')
      }
      setAnswerDraft('')
      setImportOpen(false)
      setImportText('')
      setImportPreview(null)
      setImportError('')
      setParseSuccessMsg('')
      setFeedback(saved.diskSaved
        ? `口语练习已保存至 ${saved.diskPath}：${importPreview.vocabulary?.length || 0} 个词卡。${saved.warning || ''}`
        : `已保存到浏览器缓存，硬盘写入失败：${saved.diskError}。${saved.warning ? ` ${saved.warning}` : ''}`)
    } catch (error) {
      setImportError(`保存失败：${error.message}`)
    }
  }

  function openManualForm(isNew = false) {
    if (isNew) {
      setMergeMode('independent')
      setMergeTargetId('')
      setMergeLabel('')
    }
    const source = isNew ? {
      id: '',
      title: '',
      part: 'Part 1',
      topicCategory: '',
      questionPrompt: '',
      questions: [{ question: '', sampleAnswer: '', perspective: '思路一' }],
      cueCardPoints: [],
      audioUrl: '',
      sampleAnswer: '',
      vocabulary: [],
      mindMap: { label: 'Speaking Outline', children: [] },
      images: [],
    } : { ...displayLesson, id: lesson.id, originalId: lesson.id, editingSetId: activeSet?.id, sampleAnswer: answerDraft || displayLesson.sampleAnswer }

    setManualForm({
      ...source,
      images: Array.isArray(source.images) ? source.images.map((img) => typeof img === 'string' ? { url: img, caption: '' } : { url: img.url || '', caption: img.caption || '' }) : [],
      cueCardText: (source.cueCardPoints ?? []).join('\n'),
      mindMapText: flattenMindMap(source.mindMap),
      vocabulary: (source.vocabulary ?? []).map((item) => ({ ...item })),
    })
    setManualQuestionDraft((source.questions ?? []).map((item, idx) => ({
      question: item.question || '',
      sampleAnswer: item.sampleAnswer || '',
      perspective: item.perspective || PERSPECTIVE_OPTIONS[idx % 4],
    })))
    setManualError('')
    setEditing(true)
  }

  function updateManualField(field, value) {
    setManualForm((current) => ({ ...current, [field]: value }))
  }

  async function handleUploadImages(files) {
    if (!files || !files.length) return
    try {
      const uploaded = []
      for (const file of Array.from(files)) {
        if (onUploadSpeakingImage) {
          const res = await onUploadSpeakingImage(file)
          uploaded.push({ url: res.url, caption: file.name.replace(/\.[^/.]+$/, '') })
        } else {
          const url = URL.createObjectURL(file)
          uploaded.push({ url, caption: file.name.replace(/\.[^/.]+$/, '') })
        }
      }
      updateManualField('images', [...(manualForm.images || []), ...uploaded])
    } catch (err) {
      setManualError(`图片上传失败: ${err.message}`)
    }
  }

  function handleAddImageUrl() {
    const url = (newImageUrl || '').trim()
    if (!url) return
    updateManualField('images', [
      ...(manualForm.images || []),
      { url, caption: (newImageCaption || '').trim() }
    ])
    setNewImageUrl('')
    setNewImageCaption('')
  }

  function handleDeleteImage(index) {
    updateManualField('images', (manualForm.images || []).filter((_, idx) => idx !== index))
  }

  function handleUpdateImageCaption(index, caption) {
    updateManualField('images', (manualForm.images || []).map((img, idx) => idx === index ? { ...img, caption } : img))
  }

  async function uploadSpeakingAudio(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const result = await onUploadAudio(file)
      updateManualField('audioUrl', result.url)
    } catch (error) {
      setManualError(`音频上传失败：${error.message}`)
    } finally {
      event.target.value = ''
    }
  }

  async function saveManualLesson() {
    const partOne = manualForm.part === 'Part 1'
    const title = (manualForm.title || '').trim()
    const topicCategory = (manualForm.topicCategory || '').trim()
    const questionPrompt = (manualForm.questionPrompt || '').trim()

    if (partOne) {
      if (!title || !topicCategory || !manualQuestionDraft.some((item) => item.question.trim() && item.sampleAnswer.trim())) {
        setManualError('请填写具体题目名称、话题大类及至少一个分问题与范例答案。')
        return
      }
    } else {
      if (!topicCategory || !questionPrompt || !manualForm.sampleAnswer.trim()) {
        setManualError('请填写话题大类、口语题目及范例答案。')
        return
      }
    }

    const id = manualForm.originalId || manualForm.id || `spk-${slug(title || topicCategory)}-${Date.now().toString(36)}`
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      setManualError('无法生成有效的本地课程标识，请修改题目名称后重试。')
      return
    }
    if (id !== manualForm.originalId && lessons.some((item) => item.id === id)) {
      setManualError('生成的本地课程标识已存在，请稍后重试。')
      return
    }

    const vocabulary = manualForm.vocabulary.filter((item) => item.term?.trim()).map((item, index) => ({
      ...item,
      id: item.id || `sv-${index + 1}`,
      topicCategory,
      sourceTestId: id,
    }))

    const mindMap = parseMindMapOutline(manualForm.mindMapText, title || 'Speaking Outline')
    const labels = []
    const collectLabels = (node) => { labels.push(node.label); (node.children ?? []).forEach(collectLabels) }
    collectLabels(mindMap)
    if (labels.some((label) => !/[a-z]/i.test(label))) {
      setManualError('思维导图节点需使用英文。')
      return
    }

    const savedQuestions = partOne
      ? manualQuestionDraft
          .filter((item) => item.question.trim() && item.sampleAnswer.trim())
          .map((item, idx) => ({
            question: item.question.trim(),
            sampleAnswer: item.sampleAnswer.trim(),
            perspective: item.perspective || PERSPECTIVE_OPTIONS[idx % 4],
          }))
      : []

    const savedLesson = {
      id,
      title: title || (partOne ? '' : questionPrompt.split(/\r?\n/)[0]),
      part: manualForm.part,
      topicCategory,
      questionPrompt: partOne ? (title || 'Part 1 Topic') : questionPrompt,
      questions: savedQuestions,
      cueCardPoints: partOne ? [] : manualForm.cueCardText.split(/\r?\n/).map((point) => point.trim()).filter(Boolean),
      audioUrl: manualForm.audioUrl || '',
      sampleAnswer: partOne ? (savedQuestions[0]?.sampleAnswer || '') : manualForm.sampleAnswer.trim(),
      vocabulary,
      mindMap,
      images: (manualForm.images || []).filter((img) => img && img.url),
    }

    setManualSaving(true)
    try {
      let result
      let persistedLesson = savedLesson
      if (manualForm.editingSetId) {
        const sets = prepareSets(lessonSets.map((set) => set.id === manualForm.editingSetId ? asSet(savedLesson, set.label, set.id) : set), id)
        persistedLesson = { ...lesson, id, title: savedLesson.title, sets, vocabulary: sets.flatMap((set) => set.vocabulary), mindMap: combineSetMaps(sets, lesson.topicCategory) }
        result = await onSaveSpeakingLesson(persistedLesson, id !== lesson.id ? lesson.id : '')
      } else {
        result = !manualForm.originalId && !manualForm.editingSetId && !manualForm.id && mergeMode === 'merge'
          ? await saveMergedLesson(savedLesson, mergeTargetId, mergeLabel)
          : await onSaveSpeakingLesson(savedLesson, manualForm.originalId && id !== manualForm.originalId ? manualForm.originalId : '')
      }
      if (!result) throw new Error('浏览器本地空间不足，无法保存。')
      if (manualForm.editingSetId) {
        setSelectedId(id)
        setCurrentImported(persistedLesson)
      } else if (manualForm.id || mergeMode !== 'merge') {
        setSelectedId(id)
        setCurrentImported(savedLesson)
      }
      setAnswerDraft('')
      setEditing(false)
      setManualForm(null)
      setFeedback(result.diskSaved ? `口语练习已保存至 ${result.diskPath}。${result.warning || ''}` : `已保存到浏览器缓存，硬盘写入失败：${result.diskError}。${result.warning ? ` ${result.warning}` : ''}`)
    } catch (error) {
      setManualError(`保存失败：${error.message}`)
    } finally {
      setManualSaving(false)
    }
  }

  function deleteLesson() {
    if (!lesson.id) return
    setDeleteScope(lessonSets.length > 1 && activeSet ? 'set' : 'all')
    setDeleteAudio(false)
    setDeleteOpen(true)
  }

  async function confirmDeleteLesson() {
    try {
      const warning = await onDeleteSpeakingLesson(lesson, {
        setId: deleteScope === 'set' ? activeSet?.id : undefined,
        deleteAudio,
        audioUrls: deleteTargetAudioUrls,
      })
      const remaining = lessons.filter((item) => item.id !== lesson.id)
      if (deleteScope === 'set' && lessonSets.length > 1) {
        const updated = { ...lesson, sets: lessonSets.filter((set) => set.id !== activeSet?.id) }
        setCurrentImported(updated)
        setSelectedSetId('all')
      } else {
        setSelectedId(remaining[0]?.id ?? '')
        setCurrentImported(null)
      }
      setDeleteOpen(false)
      setFeedback(warning ? `口语内容已删除，但有提示：${warning}` : '口语内容已删除。')
    } catch (error) {
      setFeedback(`删除失败：${error.message}`)
    }
  }

  function downloadLesson() {
    const blob = new Blob([`${JSON.stringify(lesson, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${lesson.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="speaking-studio">
      <div className="speaking-studio-header">
        <div>
          <span className="eyebrow-small">OFFLINE SPEAKING STUDIO</span>
          <h2>雅思口语教研与答题训练</h2>
        </div>
        <div className="speaking-header-actions">
          <span className="speaking-status">
            <span className="status-dot" />本地独立题库
          </span>
          <button className="gemini-import-button" onClick={() => openManualForm(true)}>
            <Plus size={15} />新增/录入口语练习
          </button>
          <button
            className="speaking-secondary-action"
            onClick={() => {
              setImportOpen(true)
              setImportError('')
              setParseSuccessMsg('')
              setImportPreview(null)
              setMergeMode('independent')
              setMergeTargetId('')
              setMergeLabel('')
            }}
          >
            <FilePlus2 size={15} />粘贴 Gemini JSON
          </button>
        </div>
      </div>

      <div className="speaking-workspace">
        <section className="speaking-editor">
          <div className="speaking-panel-heading">
            <div className="speaking-panel-heading-left">
              <span className="section-index">01</span>
              <div>
                <h3>口语题目与文本</h3>
              </div>
            </div>
            <QuickTestFinder
              items={lessons}
              getItemTitle={(item) => getSpeakingTitle(item)}
              getItemPart={(item) => speakingPartType(item)}
              getItemTopic={(item) => item.topicCategory}
              onSelect={(targetLesson) => {
                setSelectedTopic(targetLesson.topicCategory)
                setSelectedPart(speakingPartType(targetLesson))
                selectLesson(targetLesson.id)
              }}
              placeholder="快速检索口语题目..."
            />
          </div>
          <div className="speaking-browse-controls">
            <div className="speaking-field-row">
              <label htmlFor="speaking-topic-select">话题大类</label>
              <span className="speaking-select-wrap">
                <select
                  id="speaking-topic-select"
                  value={selectedTopic}
                  onChange={(event) => {
                    const topic = event.target.value
                    const candidates = lessons.filter((item) => item.topicCategory === topic)
                    const part = candidates.some((item) => speakingPartType(item) === selectedPart) ? selectedPart : 'Part 1'
                    const next = sortByEnglishTitle(candidates.filter((item) => speakingPartType(item) === part), getSpeakingTitle)[0] ?? sortByEnglishTitle(candidates, getSpeakingTitle)[0]
                    setSelectedTopic(topic)
                    if (next) selectLesson(next.id)
                  }}
                >
                  {topicCategories.map((topic) => (
                    <option key={topic}>{topic}</option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </span>
              <label htmlFor="speaking-part-select">Part</label>
              <span className="speaking-select-wrap">
                <select
                  id="speaking-part-select"
                  value={selectedPart}
                  onChange={(event) => {
                    const part = event.target.value
                    setSelectedPart(part)
                    const next = sortByEnglishTitle(topicsForCategory.filter((item) => speakingPartType(item) === part), getSpeakingTitle)[0]
                    if (next) selectLesson(next.id)
                  }}
                >
                  <option>Part 1</option>
                  <option>Part 2 &amp; 3</option>
                </select>
                <ChevronDown size={15} />
              </span>
              <label htmlFor="speaking-lesson">具体题目</label>
              <span className="speaking-select-wrap">
                <select
                  id="speaking-lesson"
                  value={lesson.id}
                  onChange={(event) => selectLesson(event.target.value)}
                >
                  {lessonsForCategoryPart.map((item) => (
                    <option key={item.id} value={item.id}>
                      {getSpeakingTitle(item)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </span>
            </div>
            <div className="speaking-current-title">
              <strong>{getSpeakingTitle(displayLesson)}</strong>
            </div>
            <div className="speaking-actions-row">
              <button className="speaking-secondary-action" onClick={() => openManualForm()}>
                <FilePlus2 size={14} />编辑
              </button>
              <button
                className="speaking-secondary-action"
                disabled={lessons.length < 2}
                onClick={() => {
                  setMergeTargetId(lessons.find((item) => item.id !== lesson.id)?.id ?? '')
                  setMergeLabel(`Set ${lessonSets.length + 1}`)
                  setMergeOpen(true)
                }}
              >
                🔗 合并到其他题
              </button>
              <button
                className="speaking-danger-button"
                disabled={!lesson.id}
                onClick={deleteLesson}
              >
                <Trash2 size={14} />删除当前口语题
              </button>
            </div>
          </div>

          {lessonSets.length > 1 && (
            <div className="speaking-set-selector">
              <button
                className={selectedSetId === 'all' ? 'active' : ''}
                onClick={() => {
                  setSelectedSetId('all')
                  setAnswerDraft('')
                }}
              >
                全部显示 (All Sets)
              </button>
              {lessonSets.map((set) => (
                <button
                  className={selectedSetId === set.id ? 'active' : ''}
                  key={set.id}
                  onClick={() => {
                    setSelectedSetId(set.id)
                    setAnswerDraft('')
                  }}
                >
                  {set.label}
                </button>
              ))}
            </div>
          )}

          {editing && manualForm ? (
            <div className="speaking-manual-form">
              <div className="speaking-manual-import-helper">
                <span>💡 支持全量导入或单独粘贴导图/词汇等局部片段：</span>
                <button
                  type="button"
                  className="speaking-secondary-action"
                  onClick={() => {
                    setImportOpen(true)
                    setImportError('')
                    setParseSuccessMsg('')
                  }}
                >
                  <Clipboard size={14} /> 展开 JSON 模板与局部粘贴导入
                </button>
              </div>

              <label className="speaking-text-label">
                具体题目名称
                <input
                  className="speaking-question-input"
                  value={manualForm.title ?? ''}
                  onChange={(event) => updateManualField('title', event.target.value)}
                  placeholder={manualForm.part === 'Part 1' ? '例如 Names 或 Art & Galleries' : '例如 A Memorable Journey'}
                />
              </label>

              <div className="speaking-manual-two-col">
                <label className="speaking-text-label">
                  Part 分类
                  <select
                    className="speaking-question-input"
                    value={manualForm.part}
                    onChange={(event) => updateManualField('part', event.target.value)}
                  >
                    <option>Part 1</option>
                    <option>Part 2</option>
                    <option>Part 3</option>
                    <option>Part 2 &amp; 3</option>
                  </select>
                </label>
                <label className="speaking-text-label">
                  话题大类
                  <input
                    className="speaking-question-input"
                    value={manualForm.topicCategory}
                    onChange={(event) => updateManualField('topicCategory', event.target.value)}
                    placeholder="例如 个人与日常生活 或 艺术与文化"
                  />
                </label>
              </div>

              {manualForm.part !== 'Part 1' && (
                <label className="speaking-text-label">
                  口语题目
                  <textarea
                    className="speaking-question-input"
                    value={manualForm.questionPrompt}
                    onChange={(event) => updateManualField('questionPrompt', event.target.value)}
                    rows="3"
                    placeholder="完整的 Cue Card 提示语及 Part 3 讨论题目..."
                  />
                </label>
              )}

              {manualForm.part === 'Part 1' ? (
                <div className="speaking-part1-editor">
                  <div className="speaking-manual-section-heading">
                    <strong>Part 1 问题与范例答案</strong>
                    <button
                      type="button"
                      className="speaking-secondary-action"
                      onClick={() =>
                        setManualQuestionDraft((current) => [
                          ...current,
                          { question: '', sampleAnswer: '', perspective: '思路一' },
                        ])
                      }
                    >
                      <Plus size={14} /> 添加问题
                    </button>
                  </div>
                  {manualQuestionDraft.map((item, index) => (
                    <div className="speaking-part1-edit-card" key={index}>
                      <div className="speaking-part1-card-top">
                        <div className="speaking-part1-card-top-left">
                          <span className="speaking-part1-badge">问题 {index + 1}</span>
                          <div className="speaking-perspective-picker">
                            <span className="speaking-perspective-label">答题思路：</span>
                            <select
                              className="speaking-perspective-select"
                              value={item.perspective || '思路一'}
                              onChange={(event) => {
                                const val = event.target.value
                                setManualQuestionDraft((current) =>
                                  current.map((entry, row) =>
                                    row === index ? { ...entry, perspective: val } : entry
                                  )
                                )
                              }}
                            >
                              {PERSPECTIVE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="speaking-card-delete-button"
                          onClick={() =>
                            setManualQuestionDraft((current) =>
                              current.filter((_, row) => row !== index)
                            )
                          }
                          title="删除此小题"
                        >
                          <X size={14} /> 删除
                        </button>
                      </div>
                      <label className="speaking-text-label">
                        问题题干
                        <textarea
                          className="speaking-question-input"
                          value={item.question}
                          onChange={(event) =>
                            setManualQuestionDraft((current) =>
                              current.map((entry, row) =>
                                row === index ? { ...entry, question: event.target.value } : entry
                              )
                            )
                          }
                          rows="2"
                          placeholder="例如 Do you enjoy visiting art galleries?"
                        />
                      </label>
                      <label className="speaking-text-label">
                        Sample answer
                        <textarea
                          className="speaking-answer-input"
                          value={item.sampleAnswer}
                          onChange={(event) =>
                            setManualQuestionDraft((current) =>
                              current.map((entry, row) =>
                                row === index ? { ...entry, sampleAnswer: event.target.value } : entry
                              )
                            )
                          }
                          rows="4"
                          placeholder="自然口语化的 IELTS 7.5 高分示范回答..."
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <label className="speaking-text-label">
                    提纲要点（每行一项）
                    <textarea
                      className="speaking-question-input"
                      value={manualForm.cueCardText}
                      onChange={(event) => updateManualField('cueCardText', event.target.value)}
                      rows="4"
                      placeholder={'Where you went and when\nWhat transport you took\nWhy it was memorable'}
                    />
                  </label>
                  <div className="speaking-text-label">
                    示范音频（可选）
                    <div className="speaking-manual-audio">
                      <select
                        value={manualForm.audioUrl}
                        onChange={(event) => updateManualField('audioUrl', event.target.value)}
                      >
                        <option value="">不绑定音频</option>
                        {audioFiles.map((file) => (
                          <option key={file.url} value={file.url}>
                            {file.name}
                          </option>
                        ))}
                      </select>
                      <label className="speaking-upload-button">
                        上传音频
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.ogg"
                          onChange={uploadSpeakingAudio}
                        />
                      </label>
                    </div>
                  </div>
                  <label className="speaking-text-label">
                    口语范例答案
                    <textarea
                      className="speaking-answer-input"
                      value={manualForm.sampleAnswer}
                      onChange={(event) => updateManualField('sampleAnswer', event.target.value)}
                      placeholder="自然口语化、连贯且地道的 IELTS 7.5 水平高分范文..."
                    />
                  </label>
                </>
              )}

              {!manualForm.id && !manualForm.editingSetId && (
                <div className="speaking-merge-options">
                  <label>
                    🔗 合并方式
                    <select
                      value={mergeMode}
                      onChange={(event) => {
                        setMergeMode(event.target.value)
                        if (event.target.value === 'merge' && mergeTargetId) {
                          setMergeLabel(`Set ${(getLessonSets(lessons.find((item) => item.id === mergeTargetId)).length || 1) + 1}`)
                        }
                      }}
                    >
                      <option value="independent">作为独立新口语题创建</option>
                      <option value="merge">合并到已有相似口语题中</option>
                    </select>
                  </label>
                  {mergeMode === 'merge' && (
                    <>
                      <label>
                        目标口语题
                        <select
                          value={mergeTargetId}
                          onChange={(event) => {
                            const target = lessons.find((item) => item.id === event.target.value)
                            setMergeTargetId(event.target.value)
                            setMergeLabel(`Set ${(getLessonSets(target).length || 1) + 1}`)
                          }}
                        >
                          <option value="">请选择</option>
                          {lessons.map((item) => (
                            <option key={item.id} value={item.id}>
                              {getSpeakingTitle(item)} · {item.topicCategory} · {item.part}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        子集标签
                        <input
                          value={mergeLabel}
                          onChange={(event) => setMergeLabel(event.target.value)}
                          placeholder="Set 2"
                        />
                      </label>
                    </>
                  )}
                </div>
              )}

              <div className="speaking-vocab-editor">
                <div className="speaking-manual-section-heading">
                  <strong>重点单词和短语</strong>
                  <button
                    type="button"
                    className="speaking-secondary-action"
                    onClick={() =>
                      updateManualField('vocabulary', [
                        ...manualForm.vocabulary,
                        { id: '', term: '', pos: '', chinese: '', exampleSentence: '' },
                      ])
                    }
                  >
                    <Plus size={14} /> 添加词条
                  </button>
                </div>
                {manualForm.vocabulary.map((item, index) => (
                  <div className="speaking-vocab-edit-row" key={item.id || index}>
                    <input
                      aria-label="英文词汇"
                      placeholder="英文词汇"
                      value={item.term}
                      onChange={(event) =>
                        updateManualField(
                          'vocabulary',
                          manualForm.vocabulary.map((entry, row) =>
                            row === index ? { ...entry, term: event.target.value } : entry
                          )
                        )
                      }
                    />
                    <input
                      aria-label="词性"
                      placeholder="词性"
                      value={item.pos}
                      onChange={(event) =>
                        updateManualField(
                          'vocabulary',
                          manualForm.vocabulary.map((entry, row) =>
                            row === index ? { ...entry, pos: event.target.value } : entry
                          )
                        )
                      }
                    />
                    <input
                      aria-label="中文释义"
                      placeholder="中文释义"
                      value={item.chinese}
                      onChange={(event) =>
                        updateManualField(
                          'vocabulary',
                          manualForm.vocabulary.map((entry, row) =>
                            row === index ? { ...entry, chinese: event.target.value } : entry
                          )
                        )
                      }
                    />
                    <input
                      className="speaking-vocab-example"
                      aria-label="例句"
                      placeholder="英文例句"
                      value={item.exampleSentence}
                      onChange={(event) =>
                        updateManualField(
                          'vocabulary',
                          manualForm.vocabulary.map((entry, row) =>
                            row === index ? { ...entry, exampleSentence: event.target.value } : entry
                          )
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label="删除词条"
                      onClick={() =>
                        updateManualField(
                          'vocabulary',
                          manualForm.vocabulary.filter((_, row) => row !== index)
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="speaking-images-editor">
                <div className="speaking-manual-section-heading">
                  <div>
                    <strong>关联话题视觉图片 ({(manualForm.images || []).length}张)</strong>
                    <span className="speaking-editor-subhint">支持本地多图上传与网络网址录入，将在主页面以 3D 艺术画廊展陈</span>
                  </div>
                  <label className="speaking-upload-button speaking-upload-image-btn">
                    <Upload size={14} /> 本地上传图片
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files
                        if (files && files.length) {
                          await handleUploadImages(files)
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                <div className="speaking-image-url-add-bar">
                  <input
                    type="url"
                    className="speaking-image-url-input"
                    placeholder="输入或粘贴网络图片网址 (https://...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddImageUrl()
                      }
                    }}
                  />
                  <input
                    type="text"
                    className="speaking-image-caption-input"
                    placeholder="图片标题/描述 (可选)"
                    value={newImageCaption}
                    onChange={(e) => setNewImageCaption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddImageUrl()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="speaking-secondary-action"
                    onClick={handleAddImageUrl}
                    disabled={!newImageUrl.trim()}
                  >
                    <Plus size={14} /> 添加
                  </button>
                </div>

                {(manualForm.images || []).length > 0 && (
                  <div className="speaking-images-preview-list">
                    {manualForm.images.map((img, idx) => (
                      <div className="speaking-image-preview-card" key={`${img.url}-${idx}`}>
                        <div className="speaking-image-thumb-wrap">
                          <img src={img.url} alt={img.caption || `Image ${idx + 1}`} />
                          <span className="speaking-image-idx-badge">{idx + 1}</span>
                        </div>
                        <div className="speaking-image-info-wrap">
                          <input
                            type="text"
                            className="speaking-image-caption-edit"
                            placeholder="添加图片配文..."
                            value={img.caption || ''}
                            onChange={(e) => handleUpdateImageCaption(idx, e.target.value)}
                          />
                          <span className="speaking-image-url-text" title={img.url}>
                            {img.url.startsWith('data:') ? '本地上传图片 (DataURL)' : img.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="speaking-card-delete-button"
                          title="移除此图片"
                          onClick={() => handleDeleteImage(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="speaking-text-label">
                全英文思维导图（使用缩进表示层级）
                <textarea
                  className="speaking-question-input speaking-mindmap-input"
                  value={manualForm.mindMapText}
                  onChange={(event) => updateManualField('mindMapText', event.target.value)}
                  rows="8"
                  placeholder={'Overview of Key Ideas\n  Main point 1\n    Detail point\n  Main point 2'}
                />
              </label>

              {manualError && (
                <p className="speaking-import-error" role="alert">
                  {manualError}
                </p>
              )}

              <div className="speaking-manual-actions">
                <button
                  type="button"
                  className="speaking-secondary-action"
                  onClick={() => {
                    setEditing(false)
                    setManualForm(null)
                    setManualError('')
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="speaking-parse-button"
                  disabled={manualSaving}
                  onClick={saveManualLesson}
                >
                  {manualSaving ? '保存中...' : '保存口语练习'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="speaking-lesson-meta">
                <span>{displayLesson.topicCategory}</span>
                <span>{displayLesson.part}</span>
              </div>
              {lessonSets.length > 1 && selectedSetId === 'all'
                ? lessonSets.map((set) => (
                    <section className="speaking-set-content" key={set.id}>
                      <h4>{set.label}</h4>
                      {set.part === 'Part 1' ? (
                        <PartOneContent
                          lesson={set}
                          revealedAnswers={revealedAnswers}
                          onToggleAnswer={toggleAnswer}
                        />
                      ) : (
                        <PartTwoContent
                          lesson={set}
                          revealed={Boolean(revealedAnswers[`${set.id}:sample-answer`])}
                          onToggleAnswer={toggleAnswer}
                        />
                      )}
                    </section>
                  ))
                : displayLesson.part === 'Part 1' ? (
                    <PartOneContent
                      lesson={displayLesson}
                      revealedAnswers={revealedAnswers}
                      onToggleAnswer={toggleAnswer}
                    />
                  ) : (
                    <PartTwoContent
                      lesson={displayLesson}
                      answerDraft={answerDraft}
                      onAnswerChange={setAnswerDraft}
                      revealed={Boolean(revealedAnswers[`${displayLesson.id}:sample-answer`])}
                      onToggleAnswer={toggleAnswer}
                    />
                  )}
              <div className="speaking-offline-actions">
                <button
                  className="speaking-parse-button"
                  onClick={() => setFeedback('范文已在右侧按英文逻辑拆分；词卡来自本课本地 JSON。')}
                >
                  <Headphones size={15} />查看脱稿提纲
                </button>
                <button className="speaking-secondary-action" onClick={downloadLesson}>
                  <Download size={15} />下载课程 JSON
                </button>
              </div>
              <p className="speaking-feedback" role="status">
                {feedback}
              </p>
            </>
          )}
        </section>

        <aside className="speaking-results">
          {importOpen ? (
            <section className="speaking-result-panel speaking-import-panel">
              <div className="speaking-result-heading">
                <div>
                  <span className="eyebrow-small">GEMINI RESEARCH &amp; SMART IMPORT</span>
                  <h3>粘贴口语分析结果与数据模板</h3>
                </div>
                <button
                  className="speaking-close-import"
                  aria-label="关闭导入"
                  onClick={() => {
                    setImportOpen(false)
                    setImportError('')
                    setParseSuccessMsg('')
                    setImportPreview(null)
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="speaking-import-intro">
                <p>
                  采用<strong>宽容增量合并模式</strong>：支持粘贴完整 JSON，或单独粘贴<strong>思维导图</strong>、<strong>高分词汇</strong>、<strong>分问题范文</strong>等局部片段。未包含的字段将<strong>完整保留已有手动输入</strong>，绝不报错清空。
                </p>
              </div>

              <div className="speaking-template-switch-bar">
                <div className="speaking-template-pills" role="tablist" aria-label="选择模板类型">
                  <button
                    type="button"
                    className={`speaking-template-pill ${templateTab === 'Part 1' ? 'active' : ''}`}
                    onClick={() => setTemplateTab('Part 1')}
                  >
                    🌟 Part 1 模板
                  </button>
                  <button
                    type="button"
                    className={`speaking-template-pill ${templateTab === 'Part 2 & 3' ? 'active' : ''}`}
                    onClick={() => setTemplateTab('Part 2 & 3')}
                  >
                    🎯 Part 2 &amp; 3 模板
                  </button>
                </div>
                <button
                  type="button"
                  className="speaking-template-toggle-code"
                  onClick={() => setShowTemplateCode((v) => !v)}
                >
                  {showTemplateCode ? '收起模板代码' : '查看模板代码规范'}
                </button>
              </div>

              <div className="speaking-copy-modules-bar">
                <div className="speaking-copy-btn-group">
                  <button
                    type="button"
                    className="speaking-copy-chip full-chip"
                    onClick={() => copySnippet('full')}
                    title="复制所选 Part 的完整合法 JSON 模板"
                  >
                    <Clipboard size={13} /> 一键复制全部完整模板
                  </button>
                  <button
                    type="button"
                    className="speaking-copy-chip"
                    onClick={() => copySnippet('questions')}
                    title="仅复制分问题与范例答案模块代码"
                  >
                    💬 仅复制：分问题与范例答案 ({templateTab === 'Part 1' ? 'questions' : 'sampleAnswer'})
                  </button>
                  <button
                    type="button"
                    className="speaking-copy-chip"
                    onClick={() => copySnippet('vocabulary')}
                    title="仅复制高分核心词汇数组模块代码"
                  >
                    📚 仅复制：高分核心词汇 (vocabulary)
                  </button>
                  <button
                    type="button"
                    className="speaking-copy-chip"
                    onClick={() => copySnippet('mindMap')}
                    title="仅复制全英文思维导图模块代码"
                  >
                    🗺️ 仅复制：全英文思维导图 (mindMap)
                  </button>
                  <button
                    type="button"
                    className="speaking-copy-chip prompt-chip"
                    onClick={() => copySnippet('prompt')}
                    title="复制发给 Gemini 的定制提示词"
                  >
                    🤖 复制对应 Gemini 提示词
                  </button>
                </div>
                {copyNotice && (
                  <div className="speaking-copy-feedback-toast" role="status">
                    <Check size={14} /> {copyNotice}
                  </div>
                )}
              </div>

              {showTemplateCode && (
                <div className="speaking-template-preview-box">
                  <div className="speaking-template-preview-header">
                    <span>{templateTab} 标准 JSON 结构示例</span>
                    <button
                      type="button"
                      className="speaking-copy-code-inline"
                      onClick={() => copySnippet('full')}
                    >
                      复制代码
                    </button>
                  </div>
                  <pre className="speaking-template-pre">
                    {JSON.stringify(templateTab === 'Part 1' ? PART1_FULL_TEMPLATE : PART23_FULL_TEMPLATE, null, 2)}
                  </pre>
                </div>
              )}

              <div className="speaking-paste-area-wrap">
                <label htmlFor="gemini-paste-input" className="speaking-paste-label">
                  <span>粘贴 JSON 代码或局部片段</span>
                  <span className="speaking-paste-hint">支持全量或局部片段（例如单独粘贴导图或词汇）</span>
                </label>
                <textarea
                  id="gemini-paste-input"
                  className="speaking-import-textarea"
                  value={importText}
                  onChange={(event) => {
                    setImportText(event.target.value)
                    setImportError('')
                    setParseSuccessMsg('')
                    setImportPreview(null)
                  }}
                  placeholder={
                    templateTab === 'Part 1'
                      ? '在此粘贴 Gemini 输出的 Part 1 完整 JSON，或局部模块片段（如仅 mindMap 对象、仅 vocabulary 数组、仅 questions 数组）...\n\n缺少的字段将自动保留表单中已有的输入内容，绝不报错清空。'
                      : '在此粘贴 Gemini 输出的 Part 2 & 3 完整 JSON，或局部模块片段（如仅 mindMap 对象、仅 vocabulary 数组、仅 cueCardPoints / sampleAnswer）...\n\n缺少的字段将自动保留表单中已有的输入内容，绝不报错清空。'
                  }
                />
              </div>

              {parseSuccessMsg && (
                <div className="speaking-import-success-box" role="status">
                  <Check size={15} /> <span>{parseSuccessMsg}</span>
                </div>
              )}
              {importError && (
                <p className="speaking-import-error" role="alert">
                  {importError}
                </p>
              )}

              {importPreview && !editing && (
                <div className="speaking-import-preview">
                  <strong>
                    {importPreview.part} · {importPreview.topicCategory} · {getSpeakingTitle(importPreview)}
                  </strong>
                  {importPreview.part === 'Part 1' ? (
                    <p>{(importPreview.questions ?? []).length} 个分问题与范例答案</p>
                  ) : (
                    <details>
                      <summary>
                        范例答案预览（{(importPreview.sampleAnswer || '').trim().split(/\s+/).length} 词）
                      </summary>
                      <p>{importPreview.sampleAnswer}</p>
                    </details>
                  )}
                  <p>
                    {(importPreview.vocabulary ?? []).length} 个核心词条 · 思维导图：{importPreview.mindMap?.label || '未提供'}
                  </p>
                </div>
              )}

              {!editing && !manualForm && (
                <div className="speaking-merge-options">
                  <label>
                    🔗 合并方式
                    <select value={mergeMode} onChange={(event) => setMergeMode(event.target.value)}>
                      <option value="independent">作为独立新口语题创建</option>
                      <option value="merge">合并到已有相似口语题中</option>
                    </select>
                  </label>
                  {mergeMode === 'merge' && (
                    <>
                      <label>
                        目标口语题
                        <select
                          value={mergeTargetId}
                          onChange={(event) => {
                            const target = lessons.find((item) => item.id === event.target.value)
                            setMergeTargetId(event.target.value)
                            setMergeLabel(`Set ${(getLessonSets(target).length || 1) + 1}`)
                          }}
                        >
                          <option value="">请选择</option>
                          {lessons.map((item) => (
                            <option key={item.id} value={item.id}>
                              {getSpeakingTitle(item)} · {item.topicCategory} · {item.part}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        子集标签
                        <input
                          value={mergeLabel}
                          onChange={(event) => setMergeLabel(event.target.value)}
                          placeholder="Set 2"
                        />
                      </label>
                    </>
                  )}
                </div>
              )}

              <div className="speaking-import-footer">
                <span>
                  {editing ? '模式：表单编辑联动（增量填充）' : `当前课程：${getSpeakingTitle(displayLesson)}`}
                </span>
                <div className="speaking-import-footer-btns">
                  <button
                    type="button"
                    className="speaking-secondary-action"
                    onClick={() => {
                      setImportOpen(false)
                      setImportError('')
                      setParseSuccessMsg('')
                      setImportPreview(null)
                    }}
                  >
                    关闭
                  </button>

                  {editing ? (
                    <button
                      type="button"
                      className="speaking-parse-button"
                      onClick={handleParseAndMerge}
                    >
                      <FilePlus2 size={15} /> 解析并增量填充至左侧表单
                    </button>
                  ) : importPreview ? (
                    <>
                      <button
                        type="button"
                        className="speaking-secondary-action"
                        onClick={() => {
                          setManualForm({
                            ...importPreview,
                            cueCardText: (importPreview.cueCardPoints ?? []).join('\n'),
                            mindMapText: flattenMindMap(importPreview.mindMap),
                            vocabulary: (importPreview.vocabulary ?? []).map((item) => ({ ...item })),
                          })
                          setManualQuestionDraft((importPreview.questions ?? []).map((item) => ({ ...item })))
                          setEditing(true)
                          setImportOpen(false)
                        }}
                      >
                        📝 载入至编辑表单调整
                      </button>
                      <button
                        type="button"
                        className="speaking-parse-button"
                        onClick={handleSavePreview}
                      >
                        💾 确认保存并应用
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="speaking-parse-button"
                      onClick={handleParseAndMerge}
                    >
                      <FilePlus2 size={15} /> 校验并解析片段
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="speaking-result-panel speaking-map-panel">
              <div className="speaking-result-heading">
                <div>
                  <span className="eyebrow-small">ENGLISH SPEAKING OUTLINE</span>
                  <h3>口语思维导图</h3>
                </div>
                <span className="speaking-map-tag">{editing ? 'LIVE PREVIEW' : 'CLICK TO EXPAND'}</span>
              </div>
              <MindMap
                key={`${lesson.id}-${activeSet?.id ?? 'all'}`}
                data={mindMapPreview}
                editable
                dirty={Boolean(mindMapDrafts[mapKey])}
                referenceText={displayLesson.sampleAnswer || (displayLesson.questions ?? []).map((q) => q.sampleAnswer).join('\n')}
                onChange={(map) => onMindMapDraftChange(mapKey, map)}
                onSave={() => onMindMapSave('speaking', lesson, activeSet?.id ?? '', mindMapDrafts[mapKey])}
                onReset={() => onMindMapReset(mapKey)}
              />
            </section>
          )}
        </aside>
      </div>

      {!importOpen && (
        <div className="speaking-bottom-grid">
          <section className="speaking-result-panel speaking-phrases-panel">
          <div className="speaking-result-heading">
            <div>
              <span className="eyebrow-small">USEFUL LANGUAGE</span>
              <h3>高分话题词卡</h3>
            </div>
            <div className="speaking-vocabulary-modes" role="group" aria-label="词卡语言显示">
              <button
                className={vocabularyMode === 'all' ? 'active' : ''}
                onClick={() => setVocabularyMode('all')}
              >
                双语显示
              </button>
              <button
                className={vocabularyMode === 'chinese' ? 'active' : ''}
                onClick={() => setVocabularyMode('chinese')}
              >
                只显示中文
              </button>
              <button
                className={vocabularyMode === 'english' ? 'active' : ''}
                onClick={() => setVocabularyMode('english')}
              >
                只显示英文
              </button>
            </div>
            <span className="speaking-map-tag">{activeVocabulary.length} PHRASES</span>
          </div>
          <div className={`speaking-phrase-list vocabulary-display-${vocabularyMode}`}>
            {activeVocabulary.map((item) => {
              const reveal = Boolean(revealedVocabulary[item.id])
              return (
                <article
                  className="speaking-phrase-card"
                  key={item.id}
                  onClick={() =>
                    vocabularyMode !== 'all' &&
                    setRevealedVocabulary((current) => ({ ...current, [item.id]: !current[item.id] }))
                  }
                >
                  <div className="speaking-phrase-top">
                    <div>
                      {(vocabularyMode !== 'chinese' || reveal) && (
                        <>
                          <h4>{item.term}</h4>
                          <span>{item.pos}</span>
                        </>
                      )}
                      {vocabularyMode === 'chinese' && <h4>{item.chinese}</h4>}
                    </div>
                    {(vocabularyMode !== 'chinese' || reveal) && (
                      <button
                        title={`朗读 ${item.term}`}
                        aria-label={`朗读 ${item.term}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          speak(item.term)
                        }}
                      >
                        <Volume2 size={15} />
                      </button>
                    )}
                  </div>
                  {(vocabularyMode === 'all' || (vocabularyMode === 'english' && reveal)) && (
                    <p>{item.chinese}</p>
                  )}
                  {(vocabularyMode === 'all' || vocabularyMode === 'english') && (
                    <blockquote>{item.exampleSentence}</blockquote>
                  )}
                  <small>{item.topicCategory}</small>
                </article>
              )
            })}
          </div>
          <div className="speaking-sync-row">
            <span>
              <Check size={14} />课程词汇已自动汇入全站话题分类词库
            </span>
            <button disabled>
              <BookOpen size={15} />已同步
            </button>
          </div>
        </section>

        <TopicVisualGallery images={displayImages} />
      </div>
      )}

      {deleteOpen && (
        <div className="speaking-modal-backdrop" role="presentation">
          <section
            className="speaking-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-speaking-title"
          >
            <div className="speaking-result-heading">
              <div>
                <span className="eyebrow-small">LOCAL DATA MANAGEMENT</span>
                <h3 id="delete-speaking-title">删除口语内容？</h3>
              </div>
              <button
                className="speaking-close-import"
                aria-label="关闭"
                onClick={() => setDeleteOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            {lessonSets.length > 1 && (
              <>
                <label>
                  <input
                    type="radio"
                    checked={deleteScope === 'set'}
                    onChange={() => setDeleteScope('set')}
                    disabled={!activeSet}
                  />
                  仅删除当前选中的子题集（{activeSet?.label ?? '请先选择子集'}）
                </label>
                <label>
                  <input
                    type="radio"
                    checked={deleteScope === 'all'}
                    onChange={() => setDeleteScope('all')}
                  />
                  删除整道口语题全部内容
                </label>
              </>
            )}
            {lessonSets.length <= 1 && (
              <p>将删除当前口语题的本地 JSON 文件及浏览器题库记录。</p>
            )}
            <label>
              <input
                type="checkbox"
                checked={deleteAudio}
                onChange={(event) => setDeleteAudio(event.target.checked)}
                disabled={!deleteTargetAudioUrls.length}
              />
              同时删除对应本地音频文件
              {deleteTargetAudioUrls.length
                ? `（${deleteTargetAudioUrls.map((url) => url.split('/').pop()).join('、')}）`
                : '（当前内容没有关联本地音频）'}
            </label>
            <div className="speaking-modal-actions">
              <button
                className="speaking-secondary-action"
                onClick={() => setDeleteOpen(false)}
              >
                取消
              </button>
              <button
                className="speaking-danger-button"
                onClick={confirmDeleteLesson}
              >
                <Trash2 size={14} />确认删除
              </button>
            </div>
          </section>
        </div>
      )}

      {mergeOpen && (
        <div className="speaking-modal-backdrop" role="presentation">
          <section
            className="speaking-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merge-speaking-title"
          >
            <div className="speaking-result-heading">
              <div>
                <span className="eyebrow-small">MERGE SPEAKING SETS</span>
                <h3 id="merge-speaking-title">合并到其他题</h3>
              </div>
              <button
                className="speaking-close-import"
                aria-label="关闭"
                onClick={() => setMergeOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              目标口语题
              <select
                value={mergeTargetId}
                onChange={(event) => setMergeTargetId(event.target.value)}
              >
                {lessons
                  .filter((item) => item.id !== lesson.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.topicCategory} · {item.part}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              子集标签
              <input
                value={mergeLabel}
                onChange={(event) => setMergeLabel(event.target.value)}
              />
            </label>
            <div className="speaking-modal-actions">
              <button
                className="speaking-secondary-action"
                onClick={() => setMergeOpen(false)}
              >
                取消
              </button>
              <button
                className="speaking-parse-button"
                onClick={mergeCurrentLesson}
              >
                确认合并
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

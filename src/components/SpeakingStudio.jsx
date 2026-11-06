import SpeakingExamSimulator from './SpeakingExamSimulator.jsx'
import QuickTestFinder from './QuickTestFinder.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
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

export const PART2_FULL_TEMPLATE = {
  title: 'A Memorable Journey',
  part: 'Part 2',
  topicCategory: '旅行与探索',
  questionPrompt: 'Describe a memorable journey you took by public transport.',
  cueCardPoints: [
    'Where you went and when',
    'What transport you took',
    'Who accompanied you',
    'Why the experience was memorable',
  ],
  sampleAnswer: PART23_FULL_TEMPLATE.sampleAnswer,
  vocabulary: PART23_FULL_TEMPLATE.vocabulary,
  mindMap: PART23_FULL_TEMPLATE.mindMap,
}

export const PART3_FULL_TEMPLATE = {
  title: 'Urban Mobility & Public Transit',
  part: 'Part 3',
  topicCategory: '旅行与探索',
  questions: [
    {
      question: 'Why is public transport vital for modern metropolitan areas?',
      sampleAnswer: 'Public transport serves as the circulatory system of any modern metropolis. Reliable subway and bus networks drastically reduce vehicular emissions, alleviate rush-hour congestion, and provide equitable mobility for low-income commuters who cannot afford private car ownership.',
      perspective: '思路一',
    },
    {
      question: 'How might technological advancements transform future commuting experiences?',
      sampleAnswer: 'Autonomous electric transit pods and real-time AI-optimized route scheduling will likely eliminate bottleneck delays. Commuters will transition from passive waiting to enjoying seamless, on-demand micro-mobility connected to central rapid transit hubs.',
      perspective: '思路二',
    },
    {
      question: 'Should governments prioritize subsidizing rural transit over high-speed urban rail?',
      sampleAnswer: 'A balanced approach is indispensable. While high-speed rail accelerates inter-city economic synergy, rural transit subsidies prevent geographic isolation and ensure rural residents maintain access to specialized medical healthcare and tertiary education.',
      perspective: '思路三',
    },
  ],
  vocabulary: [
    {
      term: 'circulatory system of the metropolis',
      pos: 'n. phr.',
      chinese: '大都市的血液循环系统/生命线',
      exampleSentence: 'Public transport acts as the circulatory system of any modern metropolis.',
    },
    {
      term: 'equitable mobility',
      pos: 'n. phr.',
      chinese: '公平包容的出行权利',
      exampleSentence: 'Subway networks provide equitable mobility for all social demographics.',
    },
    {
      term: 'alleviate rush-hour congestion',
      pos: 'v. phr.',
      chinese: '缓解高峰期交通拥堵',
      exampleSentence: 'Effective rail networks significantly alleviate rush-hour congestion.',
    },
  ],
  mindMap: {
    label: 'Urban Mobility and Future Transit',
    children: [
      {
        label: 'Metropolitan Benefits',
        children: [
          { label: 'Emissions and congestion relief' },
          { label: 'Equitable civic accessibility' },
        ],
      },
      {
        label: 'Technological Evolution',
        children: [
          { label: 'Autonomous and AI dispatching' },
          { label: 'On-demand micro-mobility' },
        ],
      },
      {
        label: 'Public Investment Balance',
        children: [
          { label: 'Inter-city high-speed synergy' },
          { label: 'Rural connectivity and health access' },
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
          recognized.push(`分问题与范文 (${result.questions.length}题)`)
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
      recognized.push(`分问题与范文 (${result.questions.length}题)`)
      if (!result.part) result.part = jsonParsed.part || 'Part 1'
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

export function flattenMindMap(node, depth = 0) {
  if (!node || !node.label) return ''
  return [`${'  '.repeat(depth)}- ${node.label}`, ...(node.children ?? []).flatMap((child) => flattenMindMap(child, depth + 1))].join('\n')
}

export function parseMindMapOutline(text, rootLabel) {
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

function parsePromptParts(promptText, cuePoints = []) {
  if (!promptText) return { prompt: '', points: cuePoints || [] }
  let text = String(promptText).trim()

  const part3Idx = text.search(/\n\s*Part\s*3\s*[:：]/i)
  if (part3Idx >= 0) {
    text = text.substring(0, part3Idx).trim()
  }

  const sayMatch = text.match(/(?:you\s+should\s+say|提纲要点)\s*[:：]?/i)
  let prompt = text
  let points = Array.isArray(cuePoints) && cuePoints.length > 0 ? [...cuePoints] : []

  if (sayMatch) {
    const sayIdx = sayMatch.index
    prompt = text.substring(0, sayIdx).trim()
    const afterSay = text.substring(sayIdx + sayMatch[0].length).trim()
    if (!points.length) {
      points = afterSay
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(Boolean)
    }
  }

  prompt = prompt.replace(/^Part\s*2\s*[:：]?\s*/i, '').trim()
  points = points.filter((p) => !/^Part\s*3\b/i.test(p))

  return { prompt: prompt || text, points }
}

function PartTwoContent({ lesson, answerDraft, onAnswerChange, revealed, onToggleAnswer }) {
  const answerKey = `${lesson.id}:sample-answer`
  const { prompt: cleanPrompt, points: cleanPoints } = useMemo(() => {
    return parsePromptParts(lesson.questionPrompt, lesson.cueCardPoints)
  }, [lesson.questionPrompt, lesson.cueCardPoints])

  return (
    <div className="speaking-part2-content">
      <div className="speaking-part2-section-block">
        <div className="speaking-kicker-header">
          <span className="speaking-part2-kicker">PART 2 PROMPT</span>
        </div>
        <div className="speaking-part2-prompt-card">
          <p>{cleanPrompt || lesson.questionPrompt}</p>
        </div>
      </div>

      {cleanPoints?.length > 0 && (
        <div className="speaking-part2-section-block">
          <div className="speaking-kicker-header">
            <span className="speaking-cue-kicker">CUE CARD · POINTS TO COVER</span>
          </div>
          <div className="speaking-part2-cue-card">
            <div className="speaking-cue-prefix">You should say:</div>
            <ul className="speaking-cue-list">
              {cleanPoints.map((point, index) => (
                <li key={`${index}-${point}`} className="speaking-cue-item">
                  <span className="speaking-cue-bullet">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
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

function QuestionAudioPlayer({ audioUrl, duration, onReRecord }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handlePause = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }

  const handleSeek = (e) => {
    const time = Number(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const formatSecs = (sec) => {
    if (!sec || isNaN(sec)) return '00:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="speaking-replay-bar">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="speaking-replay-label">
        <span className="speaking-replay-dot">🎙️</span>
        <span>本题答题回放</span>
      </div>
      <button
        type="button"
        className="speaking-replay-play-btn"
        onClick={togglePlay}
        aria-label={isPlaying ? '暂停回放' : '播放回放'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="speaking-replay-track-wrap">
        <input
          type="range"
          min="0"
          max={audioDuration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="speaking-replay-slider"
          aria-label="回放进度"
        />
      </div>
      <span className="speaking-replay-time">
        {formatSecs(currentTime)} / {formatSecs(audioDuration)}
      </span>
      {onReRecord && (
        <button
          type="button"
          className="speaking-replay-rerecord-btn"
          onClick={onReRecord}
          title="重新录制本题作答"
        >
          🔄 重新录音
        </button>
      )}
    </div>
  )
}

function PartThreeContent({ lesson, revealedAnswers, onToggleAnswer }) {
  const [recordings, setRecordings] = useState({})
  const [activeRecordIdx, setActiveRecordIdx] = useState(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    return () => {
      Object.values(recordings).forEach((rec) => {
        if (rec?.url) URL.revokeObjectURL(rec.url)
      })
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [lesson.id])

  const stopActiveRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    setActiveRecordIdx(null)
  }

  const startRecording = async (questionIndex) => {
    if (activeRecordIdx !== null) {
      stopActiveRecording()
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : ''

      const options = mimeType ? { mimeType } : undefined
      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      const startTime = Date.now()
      recorder.onstop = () => {
        const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000))
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)

        setRecordings((prev) => {
          if (prev[questionIndex]?.url) {
            URL.revokeObjectURL(prev[questionIndex].url)
          }
          return {
            ...prev,
            [questionIndex]: { url, duration },
          }
        })
      }

      recorder.start(100)
      setActiveRecordIdx(questionIndex)
      setRecordSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 45) {
            stopActiveRecording()
            return 45
          }
          return sec + 1
        })
      }, 1000)
    } catch (err) {
      alert('无法开启麦克风，请检查浏览器麦克风权限设置。')
      setActiveRecordIdx(null)
    }
  }

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const questions = lesson.questions ?? []

  if (questions.length === 0) {
    return (
      <div className="speaking-part3-empty-card">
        <div className="speaking-part3-empty-icon">💬</div>
        <h4>暂无 Part 3 深度讨论题目</h4>
        <p>当前口语课程暂未配置 Part 3 深度拓展讨论。可点击上方【编辑】或【粘贴 Gemini JSON】录入讨论问题与范例答案。</p>
      </div>
    )
  }

  return (
    <div className="speaking-part3-content">
      <div className="speaking-part3-topic-banner">
        <span className="speaking-part3-topic-kicker">TWO-WAY DISCUSSION · PART 3</span>
        <h4>{getSpeakingTitle(lesson)} · 深度拓展讨论</h4>
      </div>

      {questions.map((item, index) => {
        const key = `${lesson.id}:p3:${index}`
        const revealed = Boolean(revealedAnswers[key])
        const perspective = item.perspective || PERSPECTIVE_OPTIONS[index % 4] || '思路一'
        const perspectiveIndex = PERSPECTIVE_OPTIONS.indexOf(perspective) >= 0 ? PERSPECTIVE_OPTIONS.indexOf(perspective) : (index % 4)
        const isRecording = activeRecordIdx === index
        const recording = recordings[index]

        return (
          <article className="speaking-part3-card" key={`${index}-${item.question}`}>
            <div className="speaking-part3-header-bar">
              <div className="speaking-part3-q-title">
                <span className="speaking-q-pill speaking-q-pill-p3">Q{index + 1}</span>
                <h5 className="speaking-part3-question-line">{item.question}</h5>
              </div>
              <div className="speaking-part3-record-action">
                {isRecording ? (
                  <button
                    type="button"
                    className="speaking-record-btn is-recording"
                    onClick={stopActiveRecording}
                  >
                    <span className="speaking-record-pulse-dot" />
                    <span>{formatTimer(recordSeconds)} / 00:45 结束作答</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="speaking-record-btn"
                    onClick={() => startRecording(index)}
                  >
                    <span>🎙️ 录音作答</span>
                  </button>
                )}
              </div>
            </div>

            {recording && (
              <QuestionAudioPlayer
                audioUrl={recording.url}
                duration={recording.duration}
                onReRecord={() => startRecording(index)}
              />
            )}

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
                <span>Sample answer · 深度讨论范例</span>
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

export default function SpeakingStudio({
  lessons,
  audioFiles,
  onUploadAudio,
  onUploadSpeakingImage,
  onDeleteSpeakingLesson,
  onSaveSpeakingLesson,
  onEditSpeakingLesson,
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
  const [subPartTab, setSubPartTab] = useState('part2')
  const [mindMapViewMode, setMindMapViewMode] = useState('lesson')
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
  const [deleteAudio, setDeleteAudio] = useState(false)
  // Removed legacy merge state
  const [manualQuestionDraft, setManualQuestionDraft] = useState([])
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [vocabularyMode, setVocabularyMode] = useState(() => localStorage.getItem('ielts-speaking-vocabulary-mode') || 'all')
  const [revealedVocabulary, setRevealedVocabulary] = useState({})
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageCaption, setNewImageCaption] = useState('')

  const lesson = lessons.find((item) => item.id === selectedId) ?? currentImported ?? lessons[0] ?? emptyLesson
  const topicCategories = useMemo(() => [...new Set(lessons.map((item) => item.topicCategory || '未分类'))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')), [lessons])
  const [selectedTopic, setSelectedTopic] = useState(() => lesson.topicCategory || topicCategories[0] || '未分类')
  const [selectedPart, setSelectedPart] = useState(() => speakingPartType(lesson))

  const categoryLessons = useMemo(() => lessons.filter((item) => item.topicCategory === selectedTopic), [lessons, selectedTopic])
  const p1Lessons = useMemo(() => sortByEnglishTitle(categoryLessons.filter((item) => speakingPartType(item) === 'Part 1'), getSpeakingTitle), [categoryLessons])
  const p23Lessons = useMemo(() => sortByEnglishTitle(categoryLessons.filter((item) => speakingPartType(item) === 'Part 2 & 3'), getSpeakingTitle), [categoryLessons])
  const p1Count = p1Lessons.length
  const p23Count = p23Lessons.length
  const lessonsForCategoryPart = selectedPart === 'Part 1' ? p1Lessons : p23Lessons

  const displayLesson = lesson
  const displayImages = displayLesson.images?.length ? displayLesson.images : (lesson.images ?? [])
  const activeVocabulary = lesson.vocabulary ?? []
  const deleteTargetAudioUrls = [lesson.audioUrl].filter((url) => url?.startsWith('/audio/'))
  const mapKey = `speaking:${lesson.id}`
  const activeMap = mindMapDrafts[mapKey] ?? lesson.mindMap
  const mindMapPreview = useMemo(() => manualForm ? parseMindMapOutline(manualForm.mindMapText, manualForm.title || 'Speaking Outline') : activeMap, [manualForm, activeMap])

  // Category Overview Mind Map
  const categoryOverviewMap = useMemo(() => {
    const branches = []
    if (p1Lessons.length > 0) {
      branches.push({
        label: `Part 1 话题库 (${p1Lessons.length} 题)`,
        children: p1Lessons.map((l) => ({
          label: getSpeakingTitle(l),
          children: l.mindMap?.children?.length ? l.mindMap.children : [{ label: l.mindMap?.label || getSpeakingTitle(l) }],
        })),
      })
    }
    if (p23Lessons.length > 0) {
      branches.push({
        label: `Part 2 & 3 话题库 (${p23Lessons.length} 题)`,
        children: p23Lessons.map((l) => ({
          label: getSpeakingTitle(l),
          children: l.mindMap?.children?.length ? l.mindMap.children : [{ label: l.mindMap?.label || getSpeakingTitle(l) }],
        })),
      })
    }
    return {
      label: `${selectedTopic || '口语话题'} · 话题导图总览`,
      children: branches,
    }
  }, [selectedTopic, p1Lessons, p23Lessons])

  // Auto-switch Part if current Part has 0 lessons in this topic category
  useEffect(() => {
    if (selectedPart === 'Part 1' && p1Count === 0 && p23Count > 0) {
      setSelectedPart('Part 2 & 3')
    } else if (selectedPart === 'Part 2 & 3' && p23Count === 0 && p1Count > 0) {
      setSelectedPart('Part 1')
    }
  }, [selectedTopic, selectedPart, p1Count, p23Count])

  // Auto-select valid lesson when category or part changes
  useEffect(() => {
    if (lessonsForCategoryPart.length > 0) {
      if (!lessonsForCategoryPart.some((item) => item.id === lesson.id)) {
        selectLesson(lessonsForCategoryPart[0].id)
      }
    }
  }, [lessonsForCategoryPart, lesson.id])

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
    setFeedback('已切换口语练习。')
  }

  function toggleAnswer(key) {
    setRevealedAnswers((current) => ({ ...current, [key]: !current[key] }))
  }

// Legacy merge functions removed

  async function copySnippet(type) {
    let currentTemplate = PART23_FULL_TEMPLATE
    if (templateTab === 'Part 1') currentTemplate = PART1_FULL_TEMPLATE
    else if (templateTab === 'Part 2') currentTemplate = PART2_FULL_TEMPLATE
    else if (templateTab === 'Part 3') currentTemplate = PART3_FULL_TEMPLATE

    let textToCopy = ''
    let label = ''

    if (type === 'full') {
      textToCopy = JSON.stringify(currentTemplate, null, 2)
      label = `${templateTab} 完整 JSON 模板`
    } else if (type === 'questions') {
      if (templateTab === 'Part 1' || templateTab === 'Part 3') {
        textToCopy = JSON.stringify(currentTemplate.questions, null, 2)
        label = `${templateTab} 分问题与范例答案 (questions)`
      } else if (templateTab === 'Part 2') {
        textToCopy = JSON.stringify({
          questionPrompt: PART2_FULL_TEMPLATE.questionPrompt,
          cueCardPoints: PART2_FULL_TEMPLATE.cueCardPoints,
          sampleAnswer: PART2_FULL_TEMPLATE.sampleAnswer,
        }, null, 2)
        label = 'Part 2 题目与范例答案'
      } else {
        textToCopy = JSON.stringify({
          questionPrompt: PART23_FULL_TEMPLATE.questionPrompt,
          cueCardPoints: PART23_FULL_TEMPLATE.cueCardPoints,
          sampleAnswer: PART23_FULL_TEMPLATE.sampleAnswer,
          questions: PART23_FULL_TEMPLATE.questions || [],
        }, null, 2)
        label = 'Part 2 & 3 题目与范例答案'
      }
    } else if (type === 'vocabulary') {
      textToCopy = JSON.stringify(currentTemplate.vocabulary, null, 2)
      label = '高分核心词汇 (vocabulary)'
    } else if (type === 'mindMap') {
      textToCopy = JSON.stringify(currentTemplate.mindMap, null, 2)
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
      const saved = await onSaveSpeakingLesson(importPreview)
      if (!saved) throw new Error('浏览器本地空间不足，无法保存该口语课。')
      setCurrentImported(importPreview)
      setSelectedId(importPreview.id)
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
    // Initializing manual form
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
    } : { ...displayLesson, id: lesson.id, originalId: lesson.id,  sampleAnswer: answerDraft || displayLesson.sampleAnswer }

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

    const hasQuestionList = manualForm.part === 'Part 1' || manualForm.part === 'Part 3' || manualForm.part === 'Part 2 & 3'
    const savedQuestions = hasQuestionList
      ? manualQuestionDraft
          .filter((item) => item.question.trim())
          .map((item, idx) => ({
            question: item.question.trim(),
            sampleAnswer: item.sampleAnswer.trim(),
            perspective: item.perspective || PERSPECTIVE_OPTIONS[idx % 4],
          }))
      : []

    let finalLesson = {
      id,
      title: title || (partOne ? '' : questionPrompt.split(/\r?\n/)[0]),
      part: manualForm.part,
      topicCategory,
      questionPrompt: partOne || manualForm.part === 'Part 3' ? (title || 'Speaking Topic') : questionPrompt,
      questions: savedQuestions,
      cueCardPoints: partOne || manualForm.part === 'Part 3' ? [] : manualForm.cueCardText.split(/\r?\n/).map((point) => point.trim()).filter(Boolean),
      audioUrl: manualForm.audioUrl || '',
      sampleAnswer: (partOne || manualForm.part === 'Part 3') ? (savedQuestions[0]?.sampleAnswer || '') : manualForm.sampleAnswer.trim(),
      vocabulary,
      mindMap,
      images: (manualForm.images || []).filter((img) => img && img.url),
    }

    // Auto-merge / grouping: When saving a Part 3 item, check if matching Part 2 exists under same category
    let autoPairMsg = ''
    if (manualForm.part === 'Part 3' && !manualForm.id && !manualForm.editingSetId) {
      const matchPart2 = lessons.find(
        (l) =>
          l.id !== id &&
          (l.part === 'Part 2' || l.part === 'Part 2 & 3') &&
          l.topicCategory === topicCategory &&
          (l.title.toLowerCase().trim() === title.toLowerCase().trim() || slug(l.title) === slug(title))
      )
      if (matchPart2) {
        const existingQs = matchPart2.questions || []
        const mergedQs = [
          ...existingQs,
          ...savedQuestions.filter((sq) => !existingQs.some((eq) => eq.question.toLowerCase().trim() === sq.question.toLowerCase().trim()))
        ]
        const vocabMap = new Map()
        ;(matchPart2.vocabulary || []).forEach((v) => vocabMap.set(v.term.toLowerCase(), v))
        vocabulary.forEach((v) => { if (!vocabMap.has(v.term.toLowerCase())) vocabMap.set(v.term.toLowerCase(), v) })

        finalLesson = {
          ...matchPart2,
          part: 'Part 2 & 3',
          questions: mergedQs,
          vocabulary: Array.from(vocabMap.values()),
        }
        autoPairMsg = ` 已自动与同话题 Part 2《${matchPart2.title}》聚合为完整的【Part 2 & 3】单元！`
      }
    }

    const savedLesson = finalLesson

    setManualSaving(true)
    try {
      let result
      let persistedLesson = savedLesson
      result = await onSaveSpeakingLesson(savedLesson, manualForm.originalId && id !== manualForm.originalId ? manualForm.originalId : '')
      if (!result) throw new Error('浏览器本地空间不足，无法保存。')
      setSelectedId(id)
      setCurrentImported(savedLesson)
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
    setDeleteAudio(false)
    setDeleteOpen(true)
  }

  async function confirmDeleteLesson() {
    try {
      const warning = await onDeleteSpeakingLesson(lesson, {
        deleteAudio,
        audioUrls: deleteTargetAudioUrls,
      })
      const remaining = lessons.filter((item) => item.id !== lesson.id)
      setSelectedId(remaining[0]?.id ?? '')
      setCurrentImported(null)
      setDeleteOpen(false)
      setFeedback(warning ? `口语题目已删除，但有提示：${warning}` : '口语题目已删除。')
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
              <div className="speaking-field-group">
                <div className="speaking-field-label-wrap">
                  <label htmlFor="speaking-topic-select">话题大类</label>
                  <span className="speaking-topic-count-badge">
                    Part 1 ({p1Count}题) · Part 2&amp;3 ({p23Count}题)
                  </span>
                </div>
                <span className="speaking-select-wrap">
                  <select
                    id="speaking-topic-select"
                    value={selectedTopic}
                    onChange={(event) => {
                      const topic = event.target.value
                      const candidates = lessons.filter((item) => item.topicCategory === topic)
                      const hasP1 = candidates.some((item) => speakingPartType(item) === 'Part 1')
                      const hasP23 = candidates.some((item) => speakingPartType(item) === 'Part 2 & 3')
                      let nextPart = selectedPart
                      if (selectedPart === 'Part 1' && !hasP1 && hasP23) nextPart = 'Part 2 & 3'
                      if (selectedPart === 'Part 2 & 3' && !hasP23 && hasP1) nextPart = 'Part 1'
                      setSelectedTopic(topic)
                      setSelectedPart(nextPart)
                      const targetLessons = sortByEnglishTitle(candidates.filter((item) => speakingPartType(item) === nextPart), getSpeakingTitle)
                      if (targetLessons[0]) selectLesson(targetLessons[0].id)
                    }}
                  >
                    {topicCategories.map((topic) => {
                      const topicTotal = lessons.filter((item) => item.topicCategory === topic).length
                      return (
                        <option key={topic} value={topic}>
                          {topic} ({topicTotal} 题)
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDown size={15} />
                </span>
              </div>

              <div className="speaking-field-group">
                <label>Part 分类</label>
                <div className="speaking-part-capsule-switcher" role="tablist" aria-label="Part 分类选择">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedPart === 'Part 1'}
                    className={`speaking-part-capsule-btn ${selectedPart === 'Part 1' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPart('Part 1')
                      if (p1Lessons.length > 0) selectLesson(p1Lessons[0].id)
                    }}
                    disabled={p1Count === 0}
                  >
                    Part 1 ({p1Count})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedPart === 'Part 2 & 3'}
                    className={`speaking-part-capsule-btn ${selectedPart === 'Part 2 & 3' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPart('Part 2 & 3')
                      if (p23Lessons.length > 0) selectLesson(p23Lessons[0].id)
                    }}
                    disabled={p23Count === 0}
                  >
                    Part 2 &amp; 3 ({p23Count})
                  </button>
                </div>
              </div>

              <div className="speaking-field-group">
                <label htmlFor="speaking-lesson">具体题目</label>
                <span className="speaking-select-wrap">
                  <select
                    id="speaking-lesson"
                    value={lesson.id}
                    onChange={(event) => selectLesson(event.target.value)}
                  >
                    {lessonsForCategoryPart.length === 0 ? (
                      <option value="">当前分类下暂无题目</option>
                    ) : (
                      lessonsForCategoryPart.map((item) => (
                        <option key={item.id} value={item.id}>
                          {getSpeakingTitle(item)}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown size={15} />
                </span>
              </div>
            </div>

            <div className="speaking-current-bar">
              <div className="speaking-current-title-block">
                <span className="speaking-current-part-tag">{lesson.part}</span>
                <strong className="speaking-current-title-text">{getSpeakingTitle(lesson)}</strong>
              </div>
              <div className="speaking-actions-row">
                <button
                  type="button"
                  className="speaking-secondary-action"
                  onClick={() => {
                    if (onEditSpeakingLesson) onEditSpeakingLesson(displayLesson)
                    else openManualForm()
                  }}
                >
                  <FilePlus2 size={14} />编辑
                </button>
                <button
                  type="button"
                  className="speaking-danger-button"
                  disabled={!lesson.id}
                  onClick={deleteLesson}
                >
                  <Trash2 size={14} />删除当前口语题
                </button>
              </div>
            </div>
          </div>

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

              {(manualForm.part === 'Part 2' || manualForm.part === 'Part 2 & 3') && (
                <label className="speaking-text-label">
                  Part 2 核心题干 Prompt
                  <textarea
                    className="speaking-question-input"
                    value={manualForm.questionPrompt}
                    onChange={(event) => updateManualField('questionPrompt', event.target.value)}
                    rows="3"
                    placeholder="例如 Describe a memorable journey you took by public transport..."
                  />
                </label>
              )}

              {(manualForm.part === 'Part 2' || manualForm.part === 'Part 2 & 3') && (
                <>
                  <label className="speaking-text-label">
                    Part 2 Cue Card 提纲要点（每行一项）
                    <textarea
                      className="speaking-question-input"
                      value={manualForm.cueCardText}
                      onChange={(event) => updateManualField('cueCardText', event.target.value)}
                      rows="4"
                      placeholder={'Where you went and when\nWhat transport you took\nWho accompanied you\nWhy it was memorable'}
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
                    Part 2 个人长陈述高分范例答案
                    <textarea
                      className="speaking-answer-input"
                      value={manualForm.sampleAnswer}
                      onChange={(event) => updateManualField('sampleAnswer', event.target.value)}
                      placeholder="自然口语化、连贯且地道的 IELTS 7.5 水平高分长陈述范文..."
                    />
                  </label>
                </>
              )}

              {(manualForm.part === 'Part 1' || manualForm.part === 'Part 3' || manualForm.part === 'Part 2 & 3') && (
                <div className="speaking-part1-editor">
                  <div className="speaking-manual-section-heading">
                    <strong>
                      {manualForm.part === 'Part 1'
                        ? 'Part 1 问题与范例答案'
                        : manualForm.part === 'Part 3'
                        ? 'Part 3 深度拓展讨论问题与范例答案'
                        : 'Part 3 深度拓展讨论分问题（可选录入）'}
                    </strong>
                    <button
                      type="button"
                      className="speaking-secondary-action"
                      onClick={() =>
                        setManualQuestionDraft((current) => [
                          ...current,
                          { question: '', sampleAnswer: '', perspective: PERSPECTIVE_OPTIONS[current.length % 4] || '思路一' },
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
                          placeholder={manualForm.part === 'Part 3' ? '例如 Why is public transport vital for modern cities?' : '例如 Do you enjoy visiting art galleries?'}
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
              <div className="speaking-content-header-bar">
                <div className="speaking-lesson-meta">
                  <span className="speaking-topic-capsule-badge">
                    {displayLesson.topicCategory} · {displayLesson.part}
                  </span>
                </div>
                {speakingPartType(displayLesson) === 'Part 2 & 3' && (
                  <div className="speaking-subpart-switcher" role="tablist" aria-label="选择练习阶段">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={subPartTab === 'part2'}
                      className={`speaking-subpart-pill ${subPartTab === 'part2' ? 'active' : ''}`}
                      onClick={() => setSubPartTab('part2')}
                    >
                      📖 Part 2 个人陈述
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={subPartTab === 'part3'}
                      className={`speaking-subpart-pill ${subPartTab === 'part3' ? 'active' : ''}`}
                      onClick={() => setSubPartTab('part3')}
                    >
                      💬 Part 3 深度讨论
                      {displayLesson.questions?.length > 0 && (
                        <span className="speaking-subpart-count">({displayLesson.questions.length})</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {displayLesson.part === 'Part 1' ? (
                <PartOneContent
                  lesson={displayLesson}
                  revealedAnswers={revealedAnswers}
                  onToggleAnswer={toggleAnswer}
                />
              ) : subPartTab === 'part3' ? (
                <PartThreeContent
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
                    className={`speaking-template-pill ${templateTab === 'Part 2' ? 'active' : ''}`}
                    onClick={() => setTemplateTab('Part 2')}
                  >
                    🎙️ Part 2 模板
                  </button>
                  <button
                    type="button"
                    className={`speaking-template-pill ${templateTab === 'Part 3' ? 'active' : ''}`}
                    onClick={() => setTemplateTab('Part 3')}
                  >
                    💬 Part 3 模板
                  </button>
                  <button
                    type="button"
                    className={`speaking-template-pill ${templateTab === 'Part 2 & 3' ? 'active' : ''}`}
                    onClick={() => setTemplateTab('Part 2 & 3')}
                  >
                    🎯 Part 2 &amp; 3 联合模板
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
                    {JSON.stringify(
                      templateTab === 'Part 1'
                        ? PART1_FULL_TEMPLATE
                        : templateTab === 'Part 2'
                        ? PART2_FULL_TEMPLATE
                        : templateTab === 'Part 3'
                        ? PART3_FULL_TEMPLATE
                        : PART23_FULL_TEMPLATE,
                      null,
                      2
                    )}
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
                <div className="speaking-mindmap-view-switcher" role="tablist" aria-label="导图展示范围">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mindMapViewMode === 'lesson'}
                    className={`speaking-mindmap-pill ${mindMapViewMode === 'lesson' ? 'active' : ''}`}
                    onClick={() => setMindMapViewMode('lesson')}
                  >
                    🎯 当前题目导图
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mindMapViewMode === 'category'}
                    className={`speaking-mindmap-pill ${mindMapViewMode === 'category' ? 'active' : ''}`}
                    onClick={() => setMindMapViewMode('category')}
                  >
                    🌐 本大类总览导图
                  </button>
                </div>
              </div>
              <MindMap
                key={`${lesson.id}-${mindMapViewMode}-${selectedTopic}`}
                data={mindMapViewMode === 'category' ? categoryOverviewMap : mindMapPreview}
                editable={mindMapViewMode === 'lesson' && !editing}
                dirty={mindMapViewMode === 'lesson' && Boolean(mindMapDrafts[mapKey])}
                referenceText={mindMapViewMode === 'category' ? '' : (displayLesson.sampleAnswer || (displayLesson.questions ?? []).map((q) => q.sampleAnswer).join('\n'))}
                onChange={(map) => {
                  if (mindMapViewMode === 'lesson') {
                    onMindMapDraftChange(mapKey, map)
                  }
                }}
                onSave={() => {
                  if (mindMapViewMode === 'lesson') {
                    onMindMapSave('speaking', lesson, '', mindMapDrafts[mapKey])
                  }
                }}
                onReset={() => {
                  if (mindMapViewMode === 'lesson') {
                    onMindMapReset(mapKey)
                  }
                }}
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
            <p>将删除当前口语题《{getSpeakingTitle(lesson)}》的本地 JSON 文件及题库记录。</p>
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


    </section>
  )
}

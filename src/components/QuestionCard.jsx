import { renderHighlightedVocabulary } from './TranscriptListening.jsx'
import { useMemo, useState } from 'react'
import { Check, GripVertical, Headphones, MapPin, Minus, Plus, X } from 'lucide-react'

const completionTypes = new Set(['fill_blank', 'note_completion', 'table_completion'])

function isCorrect(question, answer) {
  if (question.type === 'matching') return (question.items ?? []).every((item) => answer?.[item.itemId] === item.correctAnswer)
  if (question.type === 'multiple_choice') return Array.isArray(answer) && [...answer].sort().join(',') === [...(question.correctAnswer ?? [])].sort().join(',')
  if (completionTypes.has(question.type)) return (Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]).filter(Boolean).some((value) => String(value).toLowerCase() === (answer ?? '').trim().toLowerCase())
  return Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(answer) : answer === question.correctAnswer
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function QuestionReview({ question, onLocate, onAdjustTime, onSetTimeToCurrent, timestampTarget, vocabulary = [] }) {
  const audioRef = question.audioRef
  const target = timestampTarget ?? { questionId: question.id }
  return <div className="review-panel inline-review-panel">
    <span><strong>正确答案</strong> {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(' / ') : question.correctAnswer}</span>
    <span><strong>解析</strong> {question.explanation}</span>
    {audioRef?.sentence && <blockquote>{renderHighlightedVocabulary(audioRef.sentence, vocabulary)}</blockquote>}
    {audioRef?.sentence && Number.isFinite(audioRef.startTime) && Number.isFinite(audioRef.endTime) && <div className="review-audio-tools">
      <button type="button" className="locate-button" onClick={() => onLocate(audioRef)}><Headphones size={15} />定位原句播放</button>
      <span className="review-time-range">{formatTime(audioRef.startTime)} - {formatTime(audioRef.endTime)}</span>
      <button type="button" className="timestamp-adjust-button" title="起止时间提前 1 秒" aria-label="起止时间提前 1 秒" onClick={() => onAdjustTime(audioRef, -1, target)}><Minus size={13} />1s</button>
      <button type="button" className="timestamp-adjust-button" title="起止时间延后 1 秒" aria-label="起止时间延后 1 秒" onClick={() => onAdjustTime(audioRef, 1, target)}><Plus size={13} />1s</button>
      <button type="button" className="timestamp-adjust-button" onClick={() => onSetTimeToCurrent(audioRef, target)}><MapPin size={13} />设为当前播放秒数</button>
    </div>}
    {audioRef?.sentence && (!Number.isFinite(audioRef.startTime) || !Number.isFinite(audioRef.endTime)) && <small className="review-audio-unmatched">原文时间戳未能自动匹配，可检查原文文本。</small>}
  </div>
}

function MatchingResponse({ question, value, onChange, submitted, onLocate, onAdjustTime, onSetTimeToCurrent }) {
  const options = question.options ?? []
  const [selected, setSelected] = useState('')

  function place(itemId, optionLabel) {
    onChange({ ...value, [itemId]: optionLabel })
    setSelected('')
  }

  function handleDrop(event, itemId) {
    event.preventDefault()
    const optionLabel = event.dataTransfer.getData('text/plain')
    if (options.some((option) => option.label === optionLabel)) place(itemId, optionLabel)
  }

  return <div className="matching-board">
    <div className="matching-options" aria-label="可拖拽候选项池">
      <strong>候选项</strong>
      <div className="matching-pool">
        {options.map((option) => <button key={option.label} type="button" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', option.label)} className={`matching-option ${selected === option.label ? 'selected' : ''} ${Object.values(value ?? {}).includes(option.label) ? 'assigned' : ''}`} onClick={() => setSelected(selected === option.label ? '' : option.label)}>
          <GripVertical size={15} /><b>{option.label}</b><span>{option.text}</span>
        </button>)}
      </div>
      {selected && <span className="matching-hint">已选择 {selected}，再点击一个放置槽即可填入</span>}
    </div>
    <div className="matching-list">{(question.items ?? []).map((item) => {
      const answerLabel = value?.[item.itemId] ?? ''
      const option = options.find((entry) => entry.label === answerLabel)
      const right = answerLabel === item.correctAnswer
      return <div className={`match-row ${submitted && answerLabel ? right ? 'correct' : 'incorrect' : ''}`} key={item.itemId}>
        <span>{item.itemText}</span>
        <div className="match-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, item.itemId)} onClick={() => selected && place(item.itemId, selected)} aria-label={`${item.itemText} 的放置槽`}>
          {option ? <span className="match-placed-option"><b>{option.label}</b> {option.text}<button type="button" aria-label={`移除 ${option.label}`} onClick={(event) => { event.stopPropagation(); const next = { ...value }; delete next[item.itemId]; onChange(next) }}><X size={14} /></button></span> : <span>{selected ? '点击放入此处' : '拖动选项到此处'}</span>}
        </div>
        {submitted && answerLabel && !right && <QuestionReview question={{ ...item, correctAnswer: item.correctAnswer, explanation: item.explanation || question.explanation, audioRef: { startTime: item.startTime ?? question.audioRef?.startTime, endTime: item.endTime ?? question.audioRef?.endTime, sentence: item.sentence || question.audioRef?.sentence } }} onLocate={onLocate} onAdjustTime={onAdjustTime} onSetTimeToCurrent={onSetTimeToCurrent} timestampTarget={{ questionId: question.id, itemId: item.itemId }} />}
      </div>
    })}</div>
  </div>
}

function Response({ question, value, onChange, submitted, onLocate, onAdjustTime, onSetTimeToCurrent }) {
  if (question.type === 'matching') return <MatchingResponse question={question} value={value} onChange={onChange} submitted={submitted} onLocate={onLocate} onAdjustTime={onAdjustTime} onSetTimeToCurrent={onSetTimeToCurrent} />
  if (question.type === 'fill_blank') return <input className="answer-input" type="text" placeholder="输入你的答案" value={value ?? ''} onChange={(event) => onChange(event.target.value)} aria-label={question.prompt} />
  return <div className="options-list">{(question.options ?? []).map((option) => {
    const multi = question.type === 'multiple_choice'
    const selected = multi ? (value ?? []).includes(option.label) : value === option.label
    const toggle = () => multi ? onChange(selected ? value.filter((item) => item !== option.label) : [...(value ?? []), option.label]) : onChange(option.label)
    return <button className={`option ${selected ? 'selected' : ''}`} key={option.label} onClick={toggle} type="button"><span className="option-marker">{selected ? <Check size={14} /> : multi ? option.label : option.label}</span><span>{option.text}</span></button>
  })}</div>
}

export function FillBlankSheet({ questions, getNumber, answers, submitted, onChange, onLocate, onAdjustTime, onSetTimeToCurrent }) {
  const { title, instructions } = useMemo(() => {
    const prompts = questions.map((question) => question.prompt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
    const instructionLines = [...new Set(prompts.flat().filter((line) => /^(?:complete|write)\b/i.test(line)))]
    const titleLine = prompts.flat().find((line) => /\b(?:form|notes|table|application)\s*$/i.test(line) && !/^(?:complete|write)\b/i.test(line)) ?? ''
    return { title: titleLine, instructions: instructionLines }
  }, [questions])

  return <div className="fill-blank-sheet">
    <div className="fill-sheet-heading">{instructions.map((instruction) => <p key={instruction}>{instruction}</p>)}{title && <h3>{title}</h3>}</div>
    <div className="fill-sheet-lines">
      {questions.flatMap((question) => {
        const lines = question.prompt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
        const contentLines = lines.filter((line) => !/^(?:complete|write)\b/i.test(line) && line !== title)
        const blankIndex = contentLines.findIndex((line) => /_{2,}/.test(line))
        const targetIndex = blankIndex >= 0
          ? blankIndex
          : Math.max(0, contentLines.findLastIndex((line) => !/^[^•\n].*:\s*$/.test(line)))
        const answer = answers[question.id]
        const right = isCorrect(question, answer)
        const showResult = submitted && (right || answer !== undefined && answer !== '' && !(Array.isArray(answer) && !answer.length))
        const output = contentLines.map((line, index) => {
          if (/^[^•\n].*:\s*$/.test(line) && !/_{2,}/.test(line)) return <div className="fill-sheet-section-title" key={`${question.id}-${index}`}>{line}</div>
          if (index !== targetIndex) return <div className="fill-sheet-line" key={`${question.id}-${index}`}>{line}</div>
          const parts = line.split(/_{2,}/)
          return <div className={`fill-sheet-line ${showResult ? right ? 'correct' : 'incorrect' : ''}`} key={`${question.id}-${index}`}>
            {parts.map((part, partIndex) => <span key={partIndex}>{part}{partIndex < parts.length - 1 && <span className="inline-answer-wrap"><span>{getNumber(question)}</span><input className="inline-answer-input" type="text" value={answer ?? ''} onChange={(event) => onChange(question.id, event.target.value)} aria-label={`第 ${getNumber(question)} 题答案`} /></span>}</span>)}
            {parts.length === 1 && <span className="inline-answer-wrap"><span>{getNumber(question)}</span><input className="inline-answer-input" type="text" value={answer ?? ''} onChange={(event) => onChange(question.id, event.target.value)} aria-label={`第 ${getNumber(question)} 题答案`} /></span>}
            {showResult && !right && <QuestionReview question={question} vocabulary={vocabulary} onLocate={onLocate} onAdjustTime={onAdjustTime} onSetTimeToCurrent={onSetTimeToCurrent} />}
          </div>
        })
        if (!contentLines.length) output.push(<div className="fill-sheet-line" key={`${question.id}-answer`}><span>{question.prompt}</span><span className="inline-answer-wrap"><span>{getNumber(question)}</span><input className="inline-answer-input" type="text" value={answer ?? ''} onChange={(event) => onChange(question.id, event.target.value)} aria-label={`第 ${getNumber(question)} 题答案`} /></span>{showResult && !right && <QuestionReview question={question} vocabulary={vocabulary} onLocate={onLocate} onAdjustTime={onAdjustTime} onSetTimeToCurrent={onSetTimeToCurrent} />}</div>)
        return output
      })}
    </div>
  </div>
}

export default function QuestionCard({ question, number, answer, onChange, submitted, onLocate, onAdjustTime, onSetTimeToCurrent }) {
  const right = isCorrect(question, answer)
  const showResult = submitted && (right || answer !== undefined && answer !== '' && !(Array.isArray(answer) && answer.length === 0))
  const incorrect = submitted && showResult && !right
  return <article className={`question-card ${incorrect ? 'incorrect' : ''} ${submitted && right ? 'correct' : ''}`}>
    <div className="question-top"><span className="question-number">{String(number).padStart(2, '0')}</span><span className="question-type">{question.type.replace('_', ' ').toUpperCase()}</span>{showResult && <span className={`result-label ${right ? 'right' : 'wrong'}`}>{right ? <Check size={13} /> : <X size={13} />}{right ? '正确' : '需订正'}</span>}</div>
    <h3>{question.prompt}</h3>
    <Response question={question} value={answer} onChange={onChange} submitted={submitted} onLocate={onLocate} onAdjustTime={onAdjustTime} onSetTimeToCurrent={onSetTimeToCurrent} />
    {incorrect && question.type !== 'matching' && <QuestionReview question={question} vocabulary={vocabulary} onLocate={onLocate} onAdjustTime={onAdjustTime} onSetTimeToCurrent={onSetTimeToCurrent} />}
  </article>
}

import { useState } from 'react'
import { Eye, EyeOff, Headphones, MapPin, Minus, Pause, Plus, Repeat2 } from 'lucide-react'

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

export default function KeySentenceTrainer({ sentences, loopSentenceId, playingSentenceId, onPlay, onToggleLoop, onAdjustTime, onSetTimeToCurrent }) {
  const [maskedSentences, setMaskedSentences] = useState({})
  const [transcriptions, setTranscriptions] = useState({})
  const [checkedSentences, setCheckedSentences] = useState({})

  return <section className="study-panel sentences-panel review-sentences-panel">
    <div className="study-panel-heading"><div><span className="eyebrow-small">LISTEN CLOSELY</span><h2>精听考点句</h2></div><span className="panel-count">{String(sentences.length).padStart(2, '0')} KEY SENTENCES</span></div>
    <div className="sentence-list">
      {sentences.map((sentence, index) => {
        const masked = Boolean(maskedSentences[sentence.id])
        const looping = loopSentenceId === sentence.id
        const isPlaying = playingSentenceId === sentence.id
        const transcription = transcriptions[sentence.id] ?? ''
        const checked = Boolean(checkedSentences[sentence.id])
        const dictationCorrect = transcription.trim().toLowerCase() === sentence.english.trim().toLowerCase()
        return <article className="key-sentence-card review-sentence" key={sentence.id}>
          <div className="sentence-control-column">
            <div className="sentence-controls">
              <button type="button" className="sentence-play whitespace-nowrap shrink-0" title={isPlaying ? '暂停本句' : '播放本句'} aria-label={isPlaying ? `暂停第 ${index + 1} 句` : `播放第 ${index + 1} 句`} onClick={() => onPlay({ ...sentence, loop: looping })}>{isPlaying ? <Pause size={15} fill="currentColor" /> : <Headphones size={15} />}<span>{isPlaying ? '暂停本句' : '播放本句'}</span></button>
              <button type="button" className={`loop-control whitespace-nowrap shrink-0 ${looping ? 'active' : ''}`} aria-pressed={looping} onClick={() => onToggleLoop(sentence, !looping)}><span className="loop-check">{looping ? '✓' : ''}</span><Repeat2 size={15} /><span>单句循环</span></button>
            </div>
            <button type="button" className="mask-button whitespace-nowrap shrink-0" aria-pressed={masked} onClick={() => setMaskedSentences((current) => ({ ...current, [sentence.id]: !masked }))}>{masked ? <Eye size={14} /> : <EyeOff size={14} />}{masked ? '显示参考答案' : '隐藏原文默写'}</button>
          </div>
          <div className="sentence-content">
            <div className="sentence-content-heading">
              <span className="sentence-meta">{String(index + 1).padStart(2, '0')}</span>
              <span className="sentence-time-range">{formatTime(sentence.startTime)} - {formatTime(sentence.endTime)}</span>
              <div className="sentence-time-tools">
                <button type="button" aria-label="句子起止时间提前 1 秒" title="起止时间提前 1 秒" onClick={() => onAdjustTime(sentence, -1)}><Minus size={13} />1s</button>
                <button type="button" aria-label="句子起止时间延后 1 秒" title="起止时间延后 1 秒" onClick={() => onAdjustTime(sentence, 1)}><Plus size={13} />1s</button>
                <button type="button" title="将句子起点设为当前播放秒数" onClick={() => onSetTimeToCurrent(sentence)}><MapPin size={13} />设为当前播放秒数</button>
              </div>
            </div>
            <div className={`sentence-answer ${masked ? 'masked' : ''}`}>
              <p className="sentence-english">{masked ? '原文已隐藏，请听音默写。' : sentence.english}</p>
              {!masked && <><p className="sentence-translation">{sentence.chinese}</p><small>{sentence.examPoint}</small></>}
            </div>
            {masked && <div className="dictation-area">
              <label htmlFor={`dictation-${sentence.id}`}>听音默写</label>
              <textarea id={`dictation-${sentence.id}`} placeholder="听音后在此输入…" value={transcription} onChange={(event) => { setTranscriptions((current) => ({ ...current, [sentence.id]: event.target.value })); setCheckedSentences((current) => ({ ...current, [sentence.id]: false })) }} />
              <div className="dictation-actions"><button type="button" onClick={() => setCheckedSentences((current) => ({ ...current, [sentence.id]: true }))}>核对默写</button>{checked && <span className={dictationCorrect ? 'correct' : 'incorrect'}>{dictationCorrect ? '默写正确' : '与原文不一致，请再听一次'}</span>}</div>
            </div>}
          </div>
        </article>
      })}
    </div>
  </section>
}

import { Download, Sparkles, Trash2 } from 'lucide-react'

export default function TeachingWhiteboard({ text, onTextChange, expanded, onToggleExpanded }) {
  function exportText() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '课堂实时讲解.txt'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <aside className={`teaching-whiteboard ${expanded ? 'expanded' : ''}`}>
    {expanded ? <>
      <div className="whiteboard-heading">
        <div><Sparkles size={17} /><span><b>FOCUSED SESSION</b><small>课堂实时讲解白板</small></span></div>
        <button type="button" aria-label="收起白板" title="收起" onClick={onToggleExpanded}>—</button>
      </div>
      <textarea aria-label="课堂实时讲解内容" placeholder="在这里输入课堂讲解内容…" value={text} onChange={(event) => onTextChange(event.target.value)} />
      <div className="whiteboard-actions">
        <button type="button" onClick={exportText}><Download size={14} />导出为 TXT 文档</button>
        <button type="button" onClick={() => onTextChange('')}><Trash2 size={14} />清空</button>
      </div>
    </> : <button type="button" className="whiteboard-collapsed" onClick={onToggleExpanded} aria-label="展开课堂实时讲解白板">
      <span className="badge-icon"><Sparkles size={17} /></span><span><b>FOCUSED SESSION</b><small>今日练习 · 01</small></span>
    </button>}
  </aside>
}

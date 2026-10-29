import { useEffect, useMemo, useRef, useState } from 'react'
import { Headphones, LocateFixed, Minus, Plus, Save, Trash2, Undo2, X } from 'lucide-react'

const levelGap = 320
const nodeGap = 28
const branchColors = [
  { fill: '#E3EBE6', border: '#C2D1C8', child: '#EEF3F0', line: '#8CA99A' },
  { fill: '#EFECE4', border: '#D8D0C1', child: '#F6F4EE', line: '#B9AA8E' },
  { fill: '#F2E6E2', border: '#DEC5BD', child: '#F8F0ED', line: '#C59688' },
  { fill: '#E4EBF0', border: '#C4D2DC', child: '#EFF4F7', line: '#93AAB9' },
  { fill: '#F0EBE1', border: '#D9CEBA', child: '#F7F4ED', line: '#B7A47F' },
]

function collectNodeIds(node, path = 'root') {
  return [path, ...(node.children ?? []).flatMap((child, index) => collectNodeIds(child, `${path}-${index}`))]
}

function updateNodeAt(root, path, update) {
  const indexes = path.split('-').slice(1).map(Number)
  function visit(node, depth) {
    if (depth === indexes.length) return update(node)
    const children = [...(node.children ?? [])]
    const index = indexes[depth]
    children[index] = visit(children[index], depth + 1)
    return { ...node, children }
  }
  return visit(root, 0)
}

function updateParentChildren(root, path, update) {
  const parentPath = path.slice(0, path.lastIndexOf('-')) || 'root'
  return updateNodeAt(root, parentPath, (parent) => ({ ...parent, children: update([...(parent.children ?? [])]) }))
}

function getNodeSize(label, depth) {
  const width = depth === 0 ? 260 : 244
  const textWidth = [...label].reduce((total, character) => {
    return total + (character.codePointAt(0) > 0x2e80 ? 14.5 : 9)
  }, 0)
  const lines = Math.max(1, Math.ceil(textWidth / (width - 32)))
  return { width, height: Math.max(54, lines * 22 + 20) }
}

function layoutMindMap(root, openNodes) {
  const entries = []

  function subtreeHeight(node, path, depth) {
    const size = getNodeSize(String(node.label ?? ''), depth)
    const children = openNodes.has(path) ? node.children ?? [] : []
    if (!children.length) return size.height
    const childHeight = children.reduce((total, child, index) => {
      return total + subtreeHeight(child, `${path}-${index}`, depth + 1) + (index ? nodeGap : 0)
    }, 0)
    return Math.max(size.height, childHeight)
  }

  function place(node, path, depth, top, branchIndex) {
    const label = String(node.label ?? '')
    const size = getNodeSize(label, depth)
    const children = openNodes.has(path) ? node.children ?? [] : []
    const childHeights = children.map((child, index) => subtreeHeight(child, `${path}-${index}`, depth + 1))
    const childStackHeight = childHeights.reduce((total, height, index) => total + height + (index ? nodeGap : 0), 0)
    const height = Math.max(size.height, childStackHeight)
    let childTop = top + (height - childStackHeight) / 2
    const childEntries = children.map((child, index) => {
      const childPath = `${path}-${index}`
      const childBranch = depth === 0 ? index : branchIndex
      const childEntry = place(child, childPath, depth + 1, childTop, childBranch)
      childTop += childHeights[index] + nodeGap
      return childEntry
    })
    const y = childEntries.length
      ? (childEntries[0].y + childEntries[childEntries.length - 1].y) / 2
      : top + height / 2
    const entry = {
      key: path,
      label,
      depth,
      x: depth * levelGap,
      y,
      ...size,
      branchIndex,
      childrenCount: (node.children ?? []).length,
      expanded: openNodes.has(path),
    }
    entries.push(entry)
    return entry
  }

  const height = subtreeHeight(root, 'root', 0)
  place(root, 'root', 0, 0, 0)
  const width = Math.max(...entries.map((entry) => entry.x + entry.width))
  const entriesByKey = new Map(entries.map((entry) => [entry.key, entry]))
  const links = entries.filter((entry) => entry.depth > 0).map((entry) => {
    const parentKey = entry.key.slice(0, entry.key.lastIndexOf('-'))
    const parent = entriesByKey.get(parentKey)
    return {
      key: entry.key,
      startX: parent.x + parent.width,
      startY: parent.y,
      endX: entry.x,
      endY: entry.y,
      color: branchColors[entry.branchIndex % branchColors.length].line,
    }
  })
  return { entries, links, width, height }
}


const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'that', 'which',
  'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you',
  'part', 'section', 'topic', 'about', 'some', 'any', 'all', 'more', 'most'
])

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '--:--'
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function findBestSentenceMatch(label, transcript = [], referenceText = '') {
  if (!label || (!transcript?.length && !referenceText)) return null

  const keywords = String(label)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))

  if (!keywords.length) return null

  let candidates = []
  if (transcript && transcript.length) {
    candidates = transcript.map((s) => ({
      text: s.text,
      speaker: s.speaker,
      startTime: s.startTime,
      endTime: s.endTime,
    }))
  } else if (referenceText) {
    const rawSentences = String(referenceText).split(/(?<=[.?!])\s+|\n+/).filter(Boolean)
    candidates = rawSentences.map((s) => ({ text: s.trim() }))
  }

  let best = null
  let highestScore = 0

  for (const cand of candidates) {
    const lower = cand.text.toLowerCase()
    let score = 0
    const matched = []

    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i')
      if (regex.test(lower)) {
        score += 4
        matched.push(kw)
      } else if (lower.includes(kw)) {
        score += 2
        matched.push(kw)
      }
    }

    if (score > highestScore) {
      highestScore = score
      best = { ...cand, score, matchedKeywords: matched }
    }
  }

  return highestScore > 0 ? best : null
}

export default function MindMap({ data, editable = false, dirty = false, onChange, onSave, onReset, transcript = [], referenceText = '', onLocateSegment }) {
  const nodeIds = useMemo(() => collectNodeIds(data), [data])
  const [openNodes, setOpenNodes] = useState(() => new Set(nodeIds))
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 28, y: 30 })
  const [dragging, setDragging] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedNode, setSelectedNode] = useState('')
  const [saveError, setSaveError] = useState('')
  const [activeLinkedNode, setActiveLinkedNode] = useState(null)
  const [matchedReference, setMatchedReference] = useState(null)
  const viewportRef = useRef(null)
  const dragOrigin = useRef(null)
  const layout = useMemo(() => layoutMindMap(data, openNodes), [data, openNodes])

  function setZoomAround(nextZoom, anchorX, anchorY) {
    const boundedZoom = Math.max(0.2, Math.min(2.2, nextZoom))
    setPan((current) => ({
      x: anchorX - ((anchorX - current.x) / zoom) * boundedZoom,
      y: anchorY - ((anchorY - current.y) / zoom) * boundedZoom,
    }))
    setZoom(boundedZoom)
  }

  function handleWheel(event) {
    event.preventDefault()
    const viewport = viewportRef.current
    if (!viewport) return
    const nextZoom = zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08)
    setZoomAround(nextZoom, viewport.clientWidth / 2, viewport.clientHeight / 2)
  }


  function handleNodeClick(entry) {
    if (editMode) {
      setSelectedNode(entry.key)
      return
    }
    if (selectedNode === entry.key && activeLinkedNode) {
      setSelectedNode('')
      setActiveLinkedNode(null)
      setMatchedReference(null)
      return
    }
    setSelectedNode(entry.key)
    setActiveLinkedNode(entry)
    const match = findBestSentenceMatch(entry.label, transcript, referenceText)
    setMatchedReference(match)
  }

  function toggleNode(path) {
    setOpenNodes((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function fitCanvas() {
    const viewport = viewportRef.current
    if (!viewport) return
    const nextZoom = Math.max(0.2, Math.min(1, (viewport.clientWidth - 48) / layout.width, (viewport.clientHeight - 48) / layout.height))
    setZoom(nextZoom)
    setPan({
      x: Math.max(24, (viewport.clientWidth - layout.width * nextZoom) / 2),
      y: Math.max(24, (viewport.clientHeight - layout.height * nextZoom) / 2),
    })
  }

  function handlePointerDown(event) {
    if (event.target.closest('button') || event.button !== 0 || (editMode && event.target.closest('.mind-node'))) return
    dragOrigin.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    if (dragOrigin.current) setPan({ x: event.clientX - dragOrigin.current.x, y: event.clientY - dragOrigin.current.y })
  }

  function endPan() {
    dragOrigin.current = null
    setDragging(false)
  }

  function editLabel(path, label) {
    onChange?.(updateNodeAt(data, path, (node) => ({ ...node, label })))
  }

  function addChild(path) {
    onChange?.(updateNodeAt(data, path, (node) => ({
      ...node,
      children: [...(node.children ?? []), { label: 'New idea', children: [] }],
    })))
    setOpenNodes((current) => new Set([...current, path]))
  }

  function addSibling(path) {
    if (path === 'root') return
    onChange?.(updateParentChildren(data, path, (children) => {
      const index = Number(path.split('-').at(-1))
      children.splice(index + 1, 0, { label: 'New idea', children: [] })
      return children
    }))
  }

  function removeNode(path) {
    if (path === 'root') return
    onChange?.(updateParentChildren(data, path, (children) => children.filter((_, index) => index !== Number(path.split('-').at(-1)))))
    setSelectedNode('')
  }

  async function saveChanges() {
    try {
      await onSave?.()
      setSaveError('')
    } catch (error) {
      setSaveError(`导图保存失败：${error.message}`)
    }
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [zoom])

  useEffect(() => {
    fitCanvas()
  }, [])

  return <div className="mindmap-shell">
    <div className="mindmap-toolbar" aria-label="思维导图控制栏">
      <button title="放大" aria-label="放大" onClick={() => {
        const viewport = viewportRef.current
        if (viewport) setZoomAround(zoom * 1.1, viewport.clientWidth / 2, viewport.clientHeight / 2)
      }}><Plus size={15} /></button>
      <button title="缩小" aria-label="缩小" onClick={() => {
        const viewport = viewportRef.current
        if (viewport) setZoomAround(zoom / 1.1, viewport.clientWidth / 2, viewport.clientHeight / 2)
      }}><Minus size={15} /></button>
      <button title="居中适配画布" aria-label="居中适配画布" onClick={fitCanvas}><LocateFixed size={15} /></button>
      <button className="mindmap-text-action" onClick={() => setOpenNodes(new Set(nodeIds))}>全部展开</button>
      <button className="mindmap-text-action" onClick={() => setOpenNodes(new Set())}>全部折叠</button>
      {editable && <>
        <button className={`mindmap-text-action ${editMode ? 'active' : ''}`} onClick={() => setEditMode((value) => !value)}>{editMode ? '完成编辑' : '✏️ 编辑导图'}</button>
        <button className="mindmap-text-action" disabled={!dirty} onClick={saveChanges}><Save size={13} />保存导图修改</button>
        <button className="mindmap-text-action" disabled={!dirty} onClick={onReset}><Undo2 size={13} />还原初始导图</button>
      </>}
    </div>
    {saveError && <p className="mindmap-save-error" role="alert">{saveError}</p>}
    <div className={`mindmap ${dragging ? 'is-panning' : ''}`} ref={viewportRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endPan} onPointerCancel={endPan}>
      <div className="mindmap-world" style={{
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
      }}>
        <svg className="mindmap-links" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
          {layout.links.map((link) => {
            const curve = Math.max(28, (link.endX - link.startX) * 0.48)
            return <path key={link.key} d={`M ${link.startX} ${link.startY} C ${link.startX + curve} ${link.startY}, ${link.endX - curve} ${link.endY}, ${link.endX} ${link.endY}`} style={{ stroke: link.color }} />
          })}
        </svg>
        {layout.entries.map((entry) => {
          const color = entry.depth === 0
            ? { fill: '#2C3E35', border: '#2C3E35', text: '#FAF8F4' }
            : branchColors[entry.branchIndex % branchColors.length]
          return <div
            key={entry.key}
            className={`mind-node depth-${entry.depth} ${entry.depth === 0 ? 'mind-root-node' : ''} ${editMode ? 'is-editable' : ''} ${selectedNode === entry.key ? 'is-selected' : ''} ${!editMode && selectedNode === entry.key ? 'is-linked-active' : ''}`}
            onClick={() => handleNodeClick(entry)}
            style={{
              left: `${entry.x}px`,
              top: `${entry.y}px`,
              width: `${entry.width}px`,
              height: `${entry.height}px`,
              '--mind-node-fill': entry.depth > 1 ? color.child : color.fill,
              '--mind-node-border': color.border,
              '--mind-node-text': color.text ?? '#24201C',
            }}
          >
            {editMode && selectedNode === entry.key
              ? <input autoFocus className="mind-node-editor" aria-label="编辑导图节点" value={entry.label} onChange={(event) => editLabel(entry.key, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} />
              : <span className="mind-node-label">{entry.label}</span>}
            {editMode && <span className="mind-node-actions">
              <button title="添加子节点" aria-label="添加子节点" onClick={() => addChild(entry.key)}>+ 子节点</button>
              {entry.depth > 0 && <button title="添加同级节点" aria-label="添加同级节点" onClick={() => addSibling(entry.key)}>+ 同级节点</button>}
              {entry.depth > 0 && <button title="删除节点" aria-label="删除节点" onClick={() => removeNode(entry.key)}><Trash2 size={12} />删除</button>}
            </span>}
            {entry.childrenCount > 0 && <button
              className={`mind-toggle ${entry.expanded ? 'expanded' : ''}`}
              aria-label={`${entry.expanded ? '折叠' : '展开'} ${entry.label}`}
              aria-expanded={entry.expanded}
              onClick={() => toggleNode(entry.key)}
            >{entry.expanded ? '−' : '+'}{!entry.expanded && <small>{entry.childrenCount}</small>}</button>}
          </div>
        })}
      </div>
    </div>
  </div>
}

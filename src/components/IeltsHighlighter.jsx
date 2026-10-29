import { useEffect, useRef, useState } from 'react'
import { Highlighter, Eraser, Sparkles, X } from 'lucide-react'

export default function IeltsHighlighter({ children, className = '' }) {
  const containerRef = useRef(null)
  const barRef = useRef(null)
  const [bar, setBar] = useState({
    visible: false,
    x: 0,
    y: 0,
    savedRange: null,
    targetMark: null
  })

  // Handle text selection
  function updateSelection() {
    const selection = window.getSelection()
    if (!selection || !containerRef.current) return

    // If selection is inside an input, textarea, or button, ignore
    const anchor = selection.anchorNode
    const focus = selection.focusNode
    const anchorEl = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement
    const focusEl = focus?.nodeType === Node.ELEMENT_NODE ? focus : focus?.parentElement

    if (
      anchorEl?.closest('input, textarea, button, select, [contenteditable="true"]') ||
      focusEl?.closest('input, textarea, button, select, [contenteditable="true"]')
    ) {
      setBar((b) => ({ ...b, visible: false }))
      return
    }

    // Check if clicked directly on a highlighted mark
    if (selection.isCollapsed) {
      if (anchorEl?.closest('mark[data-ielts-highlight="true"]')) {
        const mark = anchorEl.closest('mark[data-ielts-highlight="true"]')
        const rect = mark.getBoundingClientRect()
        setBar({
          visible: true,
          x: rect.left + rect.width / 2,
          y: Math.max(10, rect.top - 8),
          savedRange: null,
          targetMark: mark
        })
        return
      }
      setBar((b) => ({ ...b, visible: false }))
      return
    }

    // Verify selection is inside our questions container
    if (
      !containerRef.current.contains(anchor) ||
      !containerRef.current.contains(focus)
    ) {
      setBar((b) => ({ ...b, visible: false }))
      return
    }

    const text = selection.toString().trim()
    if (!text || text.length === 0) {
      setBar((b) => ({ ...b, visible: false }))
      return
    }

    try {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        setBar((b) => ({ ...b, visible: false }))
        return
      }

      // Check if selection intersects an existing mark
      const containerMark = anchorEl?.closest('mark[data-ielts-highlight="true"]') || focusEl?.closest('mark[data-ielts-highlight="true"]')

      setBar({
        visible: true,
        x: rect.left + rect.width / 2,
        y: Math.max(10, rect.top - 8),
        savedRange: range.cloneRange(),
        targetMark: containerMark || null
      })
    } catch {
      setBar((b) => ({ ...b, visible: false }))
    }
  }

  useEffect(() => {
    function handleMouseUp(e) {
      // Don't close if clicking inside the bar itself
      if (barRef.current && barRef.current.contains(e.target)) return
      setTimeout(updateSelection, 10)
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setBar((b) => ({ ...b, visible: false }))
      }
    }

    function handleScroll() {
      if (bar.visible) {
        setBar((b) => ({ ...b, visible: false }))
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mouseup', handleMouseUp)
      container.addEventListener('touchend', handleMouseUp)
    }
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (container) {
        container.removeEventListener('mouseup', handleMouseUp)
        container.removeEventListener('touchend', handleMouseUp)
      }
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [bar.visible])

  // Apply highlight
  function applyHighlight(color = 'yellow') {
    const range = bar.savedRange
    if (!range) {
      setBar((b) => ({ ...b, visible: false }))
      return
    }

    try {
      const mark = document.createElement('mark')
      mark.className = `ielts-text-highlight ${color}`
      mark.setAttribute('data-ielts-highlight', 'true')
      mark.title = '雅思机考高亮定位词（点击可清除）'

      // Check if range is single text node
      if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
        range.surroundContents(mark)
      } else {
        const fragment = range.extractContents()
        mark.appendChild(fragment)
        range.insertNode(mark)
      }
    } catch (err) {
      console.warn('Highlight failed:', err)
    }

    window.getSelection()?.removeAllRanges()
    setBar((b) => ({ ...b, visible: false, savedRange: null, targetMark: null }))
  }

  // Remove highlight from target or selection
  function removeHighlight() {
    if (bar.targetMark) {
      unwrapMark(bar.targetMark)
    } else if (bar.savedRange && containerRef.current) {
      // Find marks within or touching the range
      const marks = containerRef.current.querySelectorAll('mark[data-ielts-highlight="true"]')
      marks.forEach((m) => {
        if (bar.savedRange.intersectsNode(m)) {
          unwrapMark(m)
        }
      })
    }
    window.getSelection()?.removeAllRanges()
    setBar((b) => ({ ...b, visible: false, savedRange: null, targetMark: null }))
  }

  function unwrapMark(markNode) {
    if (!markNode || !markNode.parentNode) return
    const parent = markNode.parentNode
    while (markNode.firstChild) {
      parent.insertBefore(markNode.firstChild, markNode)
    }
    parent.removeChild(markNode)
    parent.normalize()
  }

  return (
    <div className={`ielts-highlighter-stage ${className}`} ref={containerRef}>
      {children}

      {/* Floating Capsule Bar (雅思机考悬浮划词工具条) */}
      {bar.visible && (
        <div
          ref={barRef}
          className="ielts-floating-selection-bar"
          style={{
            position: 'fixed',
            left: `${bar.x}px`,
            top: `${bar.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
        >
          <div className="ielts-floating-inner">
            <button
              type="button"
              className="ielts-hl-action-btn hl-yellow"
              onClick={() => applyHighlight('yellow')}
              title="机考经典高亮 (Yellow Highlight)"
            >
              <span className="hl-color-dot yellow" />
              <Highlighter size={13} />
              <span>高亮</span>
            </button>

            <button
              type="button"
              className="ielts-hl-action-btn hl-green"
              onClick={() => applyHighlight('green')}
              title="画廊浅绿高亮 (Sage Highlight)"
            >
              <span className="hl-color-dot green" />
              <span>浅绿</span>
            </button>

            <div className="ielts-hl-divider" />

            <button
              type="button"
              className="ielts-hl-action-btn hl-clear"
              onClick={removeHighlight}
              title="清除高亮 (Clear Highlight)"
            >
              <Eraser size={13} />
              <span>清除</span>
            </button>

            <button
              type="button"
              className="ielts-hl-close-btn"
              onClick={() => setBar((b) => ({ ...b, visible: false }))}
              title="关闭"
            >
              <X size={12} />
            </button>
          </div>
          <div className="ielts-floating-arrow" />
        </div>
      )}
    </div>
  )
}


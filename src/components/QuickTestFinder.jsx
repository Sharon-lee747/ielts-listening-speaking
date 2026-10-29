import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Helper to render text with matching keyword highlighted
function HighlightText({ text, query }) {
  if (!query || !query.trim() || !text) return <>{text}</>
  const trimmed = query.trim()
  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi')
  const parts = String(text).split(regex)

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={i} className="finder-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export default function QuickTestFinder({
  items = [],
  getItemTitle,
  getItemPart,
  getItemTopic,
  onSelect,
  placeholder = '快速检索题目...'
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    return items.filter((item) => {
      if (!item) return false
      const title = String(getItemTitle ? getItemTitle(item) : item.title || '').toLowerCase()
      const part = String(getItemPart ? getItemPart(item) : item.part || '').toLowerCase()
      const topic = String(getItemTopic ? getItemTopic(item) : item.topicCategory || '').toLowerCase()

      return title.includes(q) || topic.includes(q) || part.includes(q)
    })
  }, [items, query, getItemTitle, getItemPart, getItemTopic])

  // Reset highlighted item when query changes
  useEffect(() => {
    setHighlightedIndex(filteredItems.length > 0 ? 0 : -1)
  }, [filteredItems])

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  function handleSelect(item) {
    if (!item) return
    onSelect?.(item)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(e) {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredItems.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredItems.length)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredItems.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      }
      return
    }

    if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
        e.preventDefault()
        handleSelect(filteredItems[highlightedIndex])
      }
    }
  }

  function handleClear() {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`quick-finder-wrap ${isOpen ? 'is-open' : ''}`} ref={containerRef}>
      <div className="quick-finder-input-box">
        <Search size={14} className="quick-finder-icon" />
        <input
          ref={inputRef}
          type="text"
          className="quick-finder-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button
            type="button"
            className="quick-finder-clear-btn"
            onClick={handleClear}
            title="清空搜索"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="quick-finder-dropdown" role="listbox">
          <div className="quick-finder-heading">
            <span>
              {filteredItems.length > 0
                ? `找到 ${filteredItems.length} 个匹配题目`
                : '未找到匹配题目'}
            </span>
            <span className="quick-finder-hint">↑↓ 键盘选择 · Enter 跳转</span>
          </div>

          <div className="quick-finder-list">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const title = getItemTitle ? getItemTitle(item) : item.title
                const part = getItemPart ? getItemPart(item) : item.part
                const topic = getItemTopic ? getItemTopic(item) : item.topicCategory
                const isSelected = index === highlightedIndex

                return (
                  <div
                    key={item.id || index}
                    className={`quick-finder-item ${isSelected ? 'highlighted' : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="finder-item-meta">
                      {part && (
                        <span
                          className={`finder-part-badge ${
                            part.includes('1') ? 'part-1' : 'part-other'
                          }`}
                        >
                          {part}
                        </span>
                      )}
                      {topic && <span className="finder-topic-badge">{topic}</span>}
                    </div>

                    <div className="finder-item-title-row">
                      <span className="finder-item-title">
                        <HighlightText text={title} query={query} />
                      </span>
                      <ChevronRight size={14} className="finder-arrow-icon" />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="quick-finder-empty">
                <span>未找到与 “{query}” 相关的题目</span>
                <small>请尝试输入其它中英文关键词或题号</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


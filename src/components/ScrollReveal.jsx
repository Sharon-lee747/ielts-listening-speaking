import { useEffect, useRef } from 'react'

export default function ScrollReveal({ children, className = '', staggerBase = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return
    const items = Array.from(container.children)
    items.forEach((el, i) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(12px)'
      el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${(staggerBase + i * 0.06).toFixed(2)}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${(staggerBase + i * 0.06).toFixed(2)}s`
    })
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [children, staggerBase])
  return <div ref={ref} className={className}>{children}</div>
}

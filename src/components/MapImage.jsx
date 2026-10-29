import { useState } from 'react'
import { X } from 'lucide-react'

export default function MapImage({ src, title = 'Map / diagram' }) {
  const [open, setOpen] = useState(false)
  if (!src) return null
  return <>
    <button className="map-image-trigger" type="button" onClick={() => setOpen(true)} aria-label="放大地图题图片">
      <img src={src} alt={title} />
      <span>点击放大地图</span>
    </button>
    {open && <div className="map-image-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={() => setOpen(false)}>
      <button type="button" aria-label="关闭地图图片" onClick={() => setOpen(false)}><X size={22} /></button>
      <img src={src} alt={title} onClick={(event) => event.stopPropagation()} />
    </div>}
  </>
}

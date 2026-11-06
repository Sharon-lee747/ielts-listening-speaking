import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioLines, Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import { encodeAudioUrl } from '../data/localDevApi.js'

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`
}

// Deterministic pseudo-random waveform seeded by string
function seedRandom(seed) {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0
  return () => {
    s = (s * 1664525 + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}

function buildBars(numBars, seed) {
  const rand = seedRandom(seed || 'default')
  const bars = []
  let prev = 0.5
  for (let i = 0; i < numBars; i++) {
    const center = 0.5 + 0.3 * Math.sin((i / numBars) * Math.PI)
    const next = center * 0.4 + prev * 0.35 + rand() * 0.25
    const clamped = Math.max(0.08, Math.min(0.97, next))
    bars.push(clamped)
    prev = clamped
  }
  return bars
}

function WaveformBar({ currentTime, duration, keySentences = [], onSeek, audioSeed, playing }) {
  const canvasRef = useRef(null)
  const bars = useRef([])
  const NUM_BARS = 120
  const [hoveredKS, setHoveredKS] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ left: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    bars.current = buildBars(NUM_BARS, audioSeed)
  }, [audioSeed])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0
    const barW = W / NUM_BARS
    const gap = Math.max(1, barW * 0.18)
    const effectiveW = barW - gap

    bars.current.forEach((h, i) => {
      const x = i * barW + gap / 2
      const barHeight = Math.max(3, h * H * 0.88)
      const y = (H - barHeight) / 2
      const frac = i / NUM_BARS
      const played = frac < progress

      if (played) {
        // Gradient green-to-amber for played section
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight)
        grad.addColorStop(0, '#4A7060')
        grad.addColorStop(1, '#3D5245')
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = '#D5CFC4'
      }
      const radius = Math.min(effectiveW / 2, 3)
      ctx.beginPath()
      ctx.roundRect ? ctx.roundRect(x, y, effectiveW, barHeight, radius) : ctx.rect(x, y, effectiveW, barHeight)
      ctx.fill()
    })

    // Playhead needle
    if (duration > 0) {
      const needleX = progress * W
      ctx.strokeStyle = '#C86D51'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(needleX, 4)
      ctx.lineTo(needleX, H - 4)
      ctx.stroke()
    }
  }, [currentTime, duration, audioSeed])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  function handleClick(e) {
    const canvas = canvasRef.current
    if (!canvas || duration <= 0) return
    const rect = canvas.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    onSeek(frac * duration)
  }

  const milestones = keySentences.filter((ks) => typeof ks.startTime === 'number')

  return (
    <div className="waveform-bar-wrap" onClick={handleClick}>
      <canvas ref={canvasRef} className="waveform-canvas" />
      <div className="waveform-milestone-layer">
        {milestones.map((ks) => {
          const pct = duration > 0 ? (ks.startTime / duration) * 100 : 0
          return (
            <div
              key={ks.id}
              className="waveform-milestone-dot"
              style={{ left: `${pct}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onSeek(ks.startTime)
              }}
              onMouseEnter={(e) => {
                setHoveredKS(ks)
                setTooltipPos({ left: `${pct}%` })
              }}
              onMouseLeave={() => setHoveredKS(null)}
            >
              {hoveredKS?.id === ks.id && (
                <div className="waveform-milestone-tooltip">
                  {ks.english?.slice(0, 80)}{ks.english?.length > 80 ? '…' : ''}
                  <span className="waveform-milestone-time">{formatTime(ks.startTime)} – {formatTime(ks.endTime ?? ks.startTime + 4)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AudioPlayer({ audioUrl, duration, currentTime, playing, rate, activeClip, keySentences = [], onToggle, onSetPlaying, onSeek, onRateChange, onPlaybackEnd }) {
  const audioRef = useRef(null)
  const [audioState, setAudioState] = useState(audioUrl ? 'loading' : 'missing')
  const [audioDuration, setAudioDuration] = useState(0)
  const source = encodeAudioUrl(audioUrl)
  const timelineDuration = audioDuration || duration
  let currentFilename = audioUrl?.split('/').pop() ?? ''
  try { currentFilename = decodeURIComponent(currentFilename) } catch { currentFilename = audioUrl?.split('/').pop() ?? '' }

  useEffect(() => {
    setAudioState(audioUrl ? 'loading' : 'missing')
    setAudioDuration(0)
  }, [audioUrl])

  useEffect(() => {
    if (!playing || audioState === 'connected') return undefined
    const timer = window.setInterval(() => {
      const limit = activeClip?.endTime ?? timelineDuration
      const nextTime = Math.min(currentTime + rate, limit)
      if (nextTime >= limit) {
        if (activeClip?.loop) onSeek(activeClip.startTime)
        else { onSeek(nextTime); onPlaybackEnd() }
      } else onSeek(nextTime)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeClip, audioState, currentTime, onPlaybackEnd, onSeek, playing, rate, timelineDuration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || audioState !== 'connected') return
    audio.playbackRate = rate
    if (playing && audio.paused) audio.play().catch(() => setAudioState('error'))
    else if (!playing && !audio.paused) audio.pause()
  }, [audioState, playing, rate])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || audioState !== 'connected' || Math.abs(audio.currentTime - currentTime) < 0.8) return
    audio.currentTime = currentTime
  }, [audioState, currentTime])

  function handleToggle() {
    if (audioState === 'connected' && audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play().then(() => onSetPlaying(true)).catch(() => setAudioState('error'))
      else { audioRef.current.pause(); onSetPlaying(false) }
    } else onToggle()
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    if (!audio) return
    const time = audio.currentTime
    if (activeClip && time >= activeClip.endTime) {
      if (activeClip.loop) audio.currentTime = activeClip.startTime
      else { audio.pause(); onSeek(activeClip.endTime); onPlaybackEnd() }
      return
    }
    onSeek(time)
  }

  const realAudioConnected = audioState === 'connected'
  const fallback = !audioUrl || audioState === 'error'
  const audioSeed = audioUrl || 'no-audio'

  return (
    <section className={`player audio-player${playing ? ' is-playing' : ''}`} aria-label="音频播放器">
      <audio
        ref={audioRef}
        src={source || undefined}
        preload="metadata"
        onLoadedMetadata={(e) => setAudioDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : duration)}
        onCanPlay={(e) => { setAudioDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : duration); setAudioState('connected') }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { onSetPlaying(false); onPlaybackEnd() }}
        onError={() => setAudioState('error')}
      />
      <div className="player-brand">
        <span className="sound-mark"><AudioLines size={18} /></span>
        <span><strong>LISTENING ROOM</strong><small>{realAudioConnected ? 'REAL AUDIO · READY' : 'SIMULATED TIMELINE'}</small></span>
      </div>
      <div className="player-controls">
        <button className="icon-button subtle" title="后退 5 秒" onClick={() => onSeek(Math.max(0, currentTime - 5))}><RotateCcw size={17} /><span>5</span></button>
        <button className="play-button" title={playing ? '暂停' : '播放'} onClick={handleToggle}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button>
        <button className="icon-button subtle" title="前进 5 秒" onClick={() => onSeek(Math.min(timelineDuration, currentTime + 5))}><RotateCw size={17} /><span>5</span></button>
      </div>
      <div className="timeline-wrap">
        <div className="timeline-labels">
          <span>{formatTime(currentTime)}</span>
          <span>{realAudioConnected ? 'REAL AUDIO' : 'SIMULATED TIMELINE'}</span>
          <span>{formatTime(timelineDuration)}</span>
        </div>
        <WaveformBar
          currentTime={currentTime}
          duration={timelineDuration}
          keySentences={keySentences}
          onSeek={onSeek}
          audioSeed={audioSeed}
          playing={playing}
        />
      </div>
      <label className="speed-control">
        <span>速度</span>
        <select aria-label="播放速度" value={rate} onChange={(e) => { onRateChange(Number(e.target.value)); if (audioRef.current) audioRef.current.playbackRate = Number(e.target.value) }}>
          {[0.75, 1, 1.25, 1.5].map((speed) => <option key={speed} value={speed}>{speed.toFixed(speed === 1 ? 1 : 2).replace(/0$/, '')}x</option>)}
        </select>
      </label>
      {audioState === 'error' && audioUrl && <div className="audio-load-warning">无法加载：{currentFilename}</div>}
    </section>
  )
}

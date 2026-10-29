import { useEffect, useRef, useState } from 'react'
import { Clock, Mic, MicOff, Pause, Play, RotateCcw, Volume2, Sparkles, Trash2, Disc } from 'lucide-react'

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safeSeconds / 60)
  const s = safeSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SpeakingExamSimulator({ lesson }) {
  const [phase, setPhase] = useState('prep') // 'prep' (60s) or 'speak' (120s)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isActive, setIsActive] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [micError, setMicError] = useState('')

  // Ephemeral In-Memory Recording
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioPlayTime, setAudioPlayTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const playbackAudioRef = useRef(null)

  const totalTime = phase === 'prep' ? 60 : 120
  const isUrgent = timeLeft <= 15 && isActive

  // Cleanup object URL when component unmounts or new recording created
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
      }
    }
  }, [recordedAudioUrl])

  // Mode switch
  function switchPhase(newPhase) {
    stopRecording()
    setIsActive(false)
    setPhase(newPhase)
    setTimeLeft(newPhase === 'prep' ? 60 : 120)
  }

  function handleReset() {
    stopRecording()
    setIsActive(false)
    setTimeLeft(phase === 'prep' ? 60 : 120)
  }

  // Timer interval
  useEffect(() => {
    if (!isActive) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          stopRecording()
          // If prep ended, auto prompt to switch to speak
          if (phase === 'prep') {
            setPhase('speak')
            return 120
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isActive, phase])

  // Start in-memory recording
  function startRecording(stream) {
    if (!stream || isRecording) return
    try {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
        setRecordedAudioUrl(null)
      }
      audioChunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : ''
      const options = mimeType ? { mimeType } : undefined
      const recorder = new MediaRecorder(stream, options)

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          const url = URL.createObjectURL(blob)
          setRecordedAudioUrl(url)
          setAudioPlayTime(0)
        }
        setIsRecording(false)
      }

      recorder.start(250) // slice every 250ms
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.warn('MediaRecorder error:', err)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop()
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err)
      }
    }
    setIsRecording(false)
  }

  // Handle Play/Pause timer toggle
  async function handleTimerToggle() {
    const nextActive = !isActive
    setIsActive(nextActive)

    if (phase === 'speak') {
      if (nextActive) {
        // If mic is not active, try turning it on
        if (!micActive || !streamRef.current) {
          try {
            const stream = await initMicStream()
            if (stream) {
              startRecording(stream)
            }
          } catch (err) {
            setMicError(`无法自动启动麦克风录音：${err.message}`)
          }
        } else {
          startRecording(streamRef.current)
        }
      } else {
        stopRecording()
      }
    }
  }

  async function initMicStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前浏览器环境不支持麦克风输入')
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const audioCtx = new AudioCtx()
    audioContextRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 128
    analyserRef.current = analyser

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    setMicActive(true)
    startWaveLoop(analyser)
    return stream
  }

  // Real-time microphone wave visualizer
  async function toggleMic() {
    if (micActive) {
      stopRecording()
      cleanupMic()
      setMicActive(false)
    } else {
      setMicError('')
      try {
        await initMicStream()
      } catch (err) {
        setMicError(`无法启动麦克风：${err.message}`)
        setMicActive(false)
      }
    }
  }

  function cleanupMic() {
    stopRecording()
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close() } catch {}
      audioContextRef.current = null
    }
    analyserRef.current = null
  }

  useEffect(() => {
    return () => cleanupMic()
  }, [])

  function startWaveLoop(analyser) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    let phaseOffset = 0

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw)
      const dpr = window.devicePixelRatio || 1
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      analyser.getByteTimeDomainData(dataArray)

      // Calculate volume amplitude
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128
        sum += val * val
      }
      const rms = Math.sqrt(sum / bufferLength)
      const amp = Math.max(0.12, Math.min(2.4, rms * 4.5))

      phaseOffset += 0.04

      // Draw primary smooth wave
      ctx.beginPath()
      ctx.lineWidth = 2.5
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, '#3D5245')
      grad.addColorStop(0.5, '#C86D51')
      grad.addColorStop(1, '#7A9485')
      ctx.strokeStyle = grad

      for (let x = 0; x <= W; x += 3) {
        const normX = x / W
        const envelope = Math.sin(normX * Math.PI) // tapered at edges
        const wave1 = Math.sin(normX * 12 + phaseOffset) * (H * 0.35 * amp * envelope)
        const wave2 = Math.sin(normX * 24 - phaseOffset * 1.5) * (H * 0.12 * amp * envelope)
        const y = H / 2 + wave1 + wave2
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Secondary translucent ambient reflection
      ctx.beginPath()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = 'rgba(61, 82, 69, 0.28)'
      for (let x = 0; x <= W; x += 4) {
        const normX = x / W
        const envelope = Math.sin(normX * Math.PI)
        const y = H / 2 - Math.sin(normX * 16 + phaseOffset * 0.8) * (H * 0.22 * amp * envelope)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    draw()
  }

  // Audio Playback Controls
  function togglePlayback() {
    if (!playbackAudioRef.current) return
    if (isPlayingAudio) {
      playbackAudioRef.current.pause()
      setIsPlayingAudio(false)
    } else {
      playbackAudioRef.current.play()
      setIsPlayingAudio(true)
    }
  }

  function handleSeekPlayback(e) {
    const time = Number(e.target.value)
    setAudioPlayTime(time)
    if (playbackAudioRef.current) {
      playbackAudioRef.current.currentTime = time
    }
  }

  function discardRecording() {
    if (isPlayingAudio && playbackAudioRef.current) {
      playbackAudioRef.current.pause()
    }
    setIsPlayingAudio(false)
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl)
      setRecordedAudioUrl(null)
    }
    setAudioPlayTime(0)
    setAudioDuration(0)
  }

  // Ring progress calculation
  const R = 54
  const circumference = 2 * Math.PI * R
  const progressRatio = totalTime > 0 ? timeLeft / totalTime : 0
  const strokeDashoffset = circumference * (1 - progressRatio)

  return (
    <section className={`speaking-simulator-card ${isUrgent ? 'is-urgent-breathing' : ''}`}>
      <div className="speaking-simulator-header">
        <div className="speaking-simulator-badge">
          <Clock size={13} />
          <span>IELTS EXAM SIMULATOR</span>
        </div>
        <div className="speaking-simulator-phase-tabs" role="tablist">
          <button
            type="button"
            className={`phase-tab ${phase === 'prep' ? 'active' : ''}`}
            onClick={() => switchPhase('prep')}
          >
            1 分钟备考 (Prep)
          </button>
          <button
            type="button"
            className={`phase-tab ${phase === 'speak' ? 'active' : ''}`}
            onClick={() => switchPhase('speak')}
          >
            2 分钟陈述 (Speak)
          </button>
        </div>
      </div>

      <div className="speaking-simulator-body">
        {/* Ring Timer */}
        <div className="speaking-simulator-timer-wrap">
          <svg className="speaking-sim-ring-svg" width={136} height={136} viewBox="0 0 136 136">
            <circle className="speaking-sim-ring-track" cx={68} cy={68} r={R} />
            <circle
              className={`speaking-sim-ring-fill ${isUrgent ? 'urgent' : ''}`}
              cx={68}
              cy={68}
              r={R}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="speaking-sim-timer-center">
            <span className="sim-timer-num">{formatTime(timeLeft)}</span>
            <span className="sim-timer-sub">{phase === 'prep' ? '备考倒计时' : '答题陈述'}</span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="speaking-simulator-controls">
          <button
            type="button"
            className={`sim-play-btn ${isActive ? 'is-running' : ''}`}
            onClick={handleTimerToggle}
          >
            {isActive ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            <span>{isActive ? '暂停倒计' : '开始计时'}</span>
          </button>
          <button
            type="button"
            className="sim-reset-btn"
            onClick={handleReset}
            title="重置当前时间"
          >
            <RotateCcw size={15} />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* Real-time Mic Waveform Stream */}
      <div className="speaking-mic-wave-box">
        <div className="speaking-mic-wave-top">
          <div className="speaking-mic-label">
            <span className={`speaking-mic-dot ${micActive ? 'live' : ''}`} />
            <span>实时麦克风语流流光 (Live Mic Waveform)</span>
            {isRecording && <span className="speaking-mic-recording-tag">● 正在内存录音...</span>}
          </div>
          <button
            type="button"
            className={`speaking-mic-toggle-btn ${micActive ? 'active' : ''}`}
            onClick={toggleMic}
          >
            {micActive ? <MicOff size={14} /> : <Mic size={14} />}
            <span>{micActive ? '关闭麦克风' : '开启麦克风'}</span>
          </button>
        </div>

        <div className="speaking-mic-canvas-wrap">
          <canvas ref={canvasRef} className="speaking-mic-canvas" />
          {!micActive && (
            <div className="speaking-mic-idle-hint">
              <span>点击“开启麦克风”实时感知开口答题声波起伏</span>
            </div>
          )}
        </div>
        {micError && <small className="speaking-mic-error">{micError}</small>}
      </div>

      {/* In-Memory Audio Replay Bar */}
      {recordedAudioUrl && (
        <div className="speaking-replay-bar">
          <audio
            ref={playbackAudioRef}
            src={recordedAudioUrl}
            onTimeUpdate={() => {
              if (playbackAudioRef.current) {
                setAudioPlayTime(playbackAudioRef.current.currentTime)
              }
            }}
            onLoadedMetadata={() => {
              if (playbackAudioRef.current) {
                setAudioDuration(playbackAudioRef.current.duration || 0)
              }
            }}
            onEnded={() => {
              setIsPlayingAudio(false)
              setAudioPlayTime(0)
            }}
          />
          <div className="speaking-replay-header">
            <div className="speaking-replay-title">
              <Disc size={15} className="spin-record-icon" />
              <strong>🎙️ 本次答题录音回放</strong>
              <small className="speaking-replay-meta">（纯内存存储 · 刷新即销毁）</small>
            </div>
            <button
              type="button"
              className="speaking-replay-discard-btn"
              onClick={discardRecording}
              title="丢弃本次录音"
            >
              <Trash2 size={13} />
              <span>清除录音</span>
            </button>
          </div>

          <div className="speaking-replay-controls">
            <button
              type="button"
              className="speaking-replay-play-btn"
              onClick={togglePlayback}
              title={isPlayingAudio ? '暂停播放' : '播放本次答题录音'}
            >
              {isPlayingAudio ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            </button>
            <span className="speaking-replay-time-text">
              {formatTime(audioPlayTime)}
            </span>
            <input
              type="range"
              min={0}
              max={audioDuration || 1}
              step={0.1}
              value={audioPlayTime}
              onChange={handleSeekPlayback}
              className="speaking-replay-scrub"
              aria-label="回放进度"
            />
            <span className="speaking-replay-time-text">
              {formatTime(audioDuration)}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

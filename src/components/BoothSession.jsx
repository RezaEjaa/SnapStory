/**
 * BoothSession.jsx
 *
 * Full-viewport photobooth:
 *  - Frame PNG fills the screen (object-contain inside 100vw × 100dvh)
 *  - Slots are overlaid using percentage positions from the frame's canvas coords
 *  - LiveSlot mirrors the front camera into the active slot via RAF canvas
 *  - SlotCountdown overlays the active slot
 *  - START → fully automatic: 3-2-1 capture, repeat per slot, then compose
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { composePhoto } from '../utils/composePhoto'

/* ── Inline countdown rendered over the active slot ── */
function SlotCountdown({ onDone }) {
  const [n, setN] = useState(3)

  useEffect(() => {
    if (n === 0) { onDone(); return }
    const t = setTimeout(() => setN((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [n, onDone])

  return (
    <div
      className="absolute inset-0 grid place-items-center pointer-events-none"
      style={{ background: 'rgba(36,35,33,0.28)' }}
      aria-live="assertive">
      <AnimatePresence mode="wait">
        {n > 0 && (
          <motion.span
            key={n}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            className="font-display leading-none text-surface drop-shadow-lg select-none"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 7rem)' }}>
            {n}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Mirror video into a canvas that fills its container ── */
function LiveSlot({ videoRef }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas?.getContext('2d')
    const video  = videoRef.current
    if (!canvas || !ctx || !video) return

    const draw = () => {
      if (video.readyState >= 2 && canvas.width > 0 && canvas.height > 0) {
        const vw = video.videoWidth, vh = video.videoHeight
        const cw = canvas.width,    ch = canvas.height
        const scale = Math.max(cw / vw, ch / vh)
        const sw = cw / scale, sh = ch / scale
        const sx = (vw - sw) / 2,  sy = (vh - sh) / 2
        ctx.save()
        ctx.translate(cw, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch)
        ctx.restore()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(([entry]) => {
      canvas.width  = Math.round(entry.contentRect.width)
      canvas.height = Math.round(entry.contentRect.height)
    })
    ro.observe(canvas)
    draw()

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [videoRef])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
}

/* ── Main component ── */
export default function BoothSession({ frame, onCapture }) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const photosRef  = useRef([]) // keep in sync with state for compose step

  const [camStatus,  setCamStatus]  = useState('loading') // loading|ready|denied|error
  const [phase,      setPhase]      = useState('idle')    // idle|running|composing
  const [photos,     setPhotos]     = useState(() => Array(frame.slots.length).fill(null))
  const [activeSlot, setActiveSlot] = useState(null)

  const { slots, canvasWidth: W, canvasHeight: H, tint, image } = frame

  /* ── camera ── */
  const stopCam = () => streamRef.current?.getTracks().forEach((t) => t.stop())

  const startCam = useCallback(async () => {
    stopCam()
    setCamStatus('loading')
    if (!navigator.mediaDevices?.getUserMedia) { setCamStatus('error'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1920 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCamStatus('ready')
    } catch (e) {
      setCamStatus(e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'denied' : 'error')
    }
  }, [])

  useEffect(() => { startCam(); return stopCam }, [startCam])

  /* ── capture snapshot ── */
  const captureSnapshot = useCallback(async () => {
    const video = videoRef.current
    if (!video) return null
    const VW = video.videoWidth  || 640
    const VH = video.videoHeight || 480
    const snap = document.createElement('canvas')
    snap.width = VW; snap.height = VH
    const sctx = snap.getContext('2d')
    sctx.translate(VW, 0); sctx.scale(-1, 1)
    sctx.drawImage(video, 0, 0, VW, VH)
    const blob = await new Promise((res) => snap.toBlob(res, 'image/jpeg', 0.92))
    const url  = URL.createObjectURL(blob)
    const img  = new Image(); img.src = url
    await new Promise((r) => { img.onload = r; img.onerror = r })
    return { blob, url, img }
  }, [])

  /* ── called when countdown hits 0 ── */
  const onCountdownDone = useCallback(async () => {
    const photo = await captureSnapshot()
    if (!photo) return

    const slot = activeSlot
    setPhotos((prev) => {
      const next = [...prev]
      if (next[slot]?.url) URL.revokeObjectURL(next[slot].url)
      next[slot] = photo
      photosRef.current = next
      return next
    })

    const nextSlot = slot + 1
    if (nextSlot < slots.length) {
      setTimeout(() => setActiveSlot(nextSlot), 350)
    } else {
      setActiveSlot(null)
      setPhase('composing')
    }
  }, [activeSlot, captureSnapshot, slots.length])

  /* ── compose ── */
  useEffect(() => {
    if (phase !== 'composing') return
    ;(async () => {
      try {
        const blob = await composePhoto(photosRef.current.map((p) => p?.img), frame, false)
        onCapture(blob)
      } catch (err) {
        console.error('Compose error', err)
        photosRef.current = Array(slots.length).fill(null)
        setPhotos(Array(slots.length).fill(null))
        setActiveSlot(null)
        setPhase('idle')
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleStart = () => {
    if (camStatus !== 'ready') return
    setPhase('running')
    setActiveSlot(0)
  }

  const isRunning   = phase === 'running'
  const isComposing = phase === 'composing'

  /* ────────────────────────────────────────
     Layout:
     - Outer = 100dvh, flex center
     - Inner = fills as much screen as possible
       while preserving the frame's aspect ratio
       using a CSS aspect-ratio trick inside flex
  ──────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-paper">

      {/* hidden video */}
      <video ref={videoRef} playsInline muted className="sr-only" />

      {/* Camera error */}
      {(camStatus === 'denied' || camStatus === 'error') && (
        <div className="z-10 max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-xl">
          <p className="text-sm text-ink leading-relaxed">
            {camStatus === 'denied'
              ? 'Camera access is needed to capture your moment. Please allow camera access in your browser settings.'
              : "We couldn't start your camera. Check that no other app is using it, then try again."}
          </p>
          <button
            onClick={startCam}
            className="mt-5 min-h-[44px] rounded-full bg-accent px-8 py-2.5 text-sm font-medium text-surface active:scale-95">
            Try again
          </button>
        </div>
      )}

      {/* Frame + slots */}
      {(camStatus === 'loading' || camStatus === 'ready') && (
        <>
          {/*
            The frame image has a fixed native aspect ratio (W:H).
            We want it to fill as much of the viewport as possible.
            Strategy: use a div with aspect-ratio + max constraints so it
            never overflows either axis.
          */}
          <div
            className="relative"
            style={{
              aspectRatio: `${W} / ${H}`,
              /* fill width on landscape frames, fill height on portrait */
              width:  H >= W ? 'auto' : '100%',
              height: H >= W ? '100%' : 'auto',
              /* never overflow the other axis */
              maxWidth:  '100vw',
              maxHeight: '100dvh',
            }}
          >
            {/* Slot layers */}
            {slots.map((s, i) => {
              const style = {
                position: 'absolute',
                left:     `${(s.x / W) * 100}%`,
                top:      `${(s.y / H) * 100}%`,
                width:    `${(s.w / W) * 100}%`,
                height:   `${(s.h / H) * 100}%`,
                overflow: 'hidden',
              }
              const isFilled  = !!photos[i]
              const isActive  = isRunning && i === activeSlot

              return (
                <div key={i} style={style}>
                  {isFilled && (
                    <img src={photos[i].url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {isActive && !isFilled && (
                    <>
                      <LiveSlot videoRef={videoRef} />
                      <SlotCountdown onDone={onCountdownDone} />
                    </>
                  )}
                  {!isFilled && !isActive && (
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${tint}cc, ${tint}44)` }}
                    />
                  )}
                </div>
              )
            })}

            {/* Frame PNG — always on top */}
            <img
              src={image}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full"
            />

            {/* Camera loading */}
            {camStatus === 'loading' && (
              <div className="absolute inset-0 grid place-items-center bg-ink/40">
                <Loader2 className="animate-spin text-surface" size={40} />
              </div>
            )}

            {/* Composing */}
            {isComposing && (
              <div className="absolute inset-0 grid place-items-center bg-ink/60">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-surface" size={44} />
                  <p className="font-display text-xl text-surface drop-shadow">Creating your story…</p>
                </div>
              </div>
            )}
          </div>

          {/* START button + progress dots — outside the frame div so they don't cover it */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3">
            {/* progress dots */}
            {isRunning && (
              <div className="flex gap-2">
                {slots.map((_, i) => (
                  <span key={i} className={`h-2.5 w-2.5 rounded-full transition-all duration-300
                    ${photos[i] ? 'bg-accent' : i === activeSlot ? 'scale-125 bg-accent/60 ring-2 ring-accent' : 'bg-line'}`} />
                ))}
              </div>
            )}

            {phase === 'idle' && camStatus === 'ready' && (
              <motion.button
                onClick={handleStart}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="min-h-[52px] rounded-full bg-accent px-16 py-4 font-display text-xl
                           text-surface shadow-lg transition active:scale-95 hover:brightness-110">
                START
              </motion.button>
            )}

            {phase === 'idle' && camStatus === 'loading' && (
              <p className="text-sm text-muted">Starting camera…</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

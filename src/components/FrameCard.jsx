import { Link } from 'react-router-dom'
import { frames } from '../data/frames'

/**
 * FramePreview
 * Shows the frame PNG at its native aspect ratio.
 * Slot holes are filled with the frame tint so they're visible.
 */
export function FramePreview({ frame, className = '' }) {
  const { canvasWidth: W, canvasHeight: H, slots, tint } = frame
  return (
    <div
      className={`relative overflow-hidden rounded-sm bg-surface shadow-md ${className}`}
      style={{ aspectRatio: `${W}/${H}` }}
    >
      {/* Tint fill for each slot so transparent holes show */}
      {slots.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${(s.x / W) * 100}%`,
            top: `${(s.y / H) * 100}%`,
            width: `${(s.w / W) * 100}%`,
            height: `${(s.h / H) * 100}%`,
            background: `radial-gradient(circle at 50% 38%, #fff5 0 12%, transparent 13%), linear-gradient(160deg, ${tint}, #77736C)`,
          }}
        />
      ))}
      <img
        src={frame.image}
        alt=""
        className="absolute inset-0 h-full w-full"
        loading="lazy"
      />
    </div>
  )
}

export default function FrameCard({ frame }) {
  const slotCount = frame.slots.length
  return (
    <article className="group flex flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-1 hover:shadow-lg">
      <FramePreview frame={frame} />
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h3 className="text-2xl">{frame.name}</h3>
        <span className="flex-shrink-0 rounded-full bg-paper px-2.5 py-0.5 text-xs text-muted border border-line">
          {slotCount} {slotCount === 1 ? 'photo' : 'photos'}
        </span>
      </div>
      <p className="mt-1 flex-1 text-sm text-muted">{frame.description}</p>
      <Link
        to={`/booth?frame=${frame.id}`}
        className="mt-4 rounded-full bg-accent px-5 py-3 text-center text-sm font-medium text-surface transition active:scale-95 hover:brightness-110">
        Use this frame
      </Link>
    </article>
  )
}

export function FrameGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {frames.map((f) => <FrameCard key={f.id} frame={f} />)}
    </div>
  )
}

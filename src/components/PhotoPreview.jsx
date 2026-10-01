import { Download, RotateCcw } from 'lucide-react'

export default function PhotoPreview({ url, frame, onRetake }) {
  return (
    <div className="mx-auto w-full max-w-md text-center">
      <h1 className="mb-6 text-4xl">Your story is ready.</h1>
      <img
        src={url}
        alt={`Your photo with the ${frame.name} frame`}
        className="w-full rounded-sm shadow-xl"
        style={{ aspectRatio: `${frame.canvasWidth}/${frame.canvasHeight}` }}
      />
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onRetake}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 transition active:scale-95">
          <RotateCcw size={18} /> Retake all
        </button>
        <a
          href={url}
          download={`snapstory-${frame.id}.png`}
          className="flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-8 py-3 font-medium text-surface transition active:scale-95">
          <Download size={18} /> Download
        </a>
      </div>
    </div>
  )
}

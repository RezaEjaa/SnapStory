import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BoothSession from '../components/BoothSession'
import PhotoPreview from '../components/PhotoPreview'
import { getFrame } from '../data/frames'

export default function Booth() {
  const [params] = useSearchParams()
  const frame = getFrame(params.get('frame'))
  const [url, setUrl] = useState(null)

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  if (!frame) return <Navigate to="/frames" replace />

  /* ── Result screen ── */
  if (url) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        {/* minimal top bar */}
        <div className="border-b border-line px-5 py-4">
          <Link to="/frames" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
            <ArrowLeft size={16} /> Back to frames
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8">
          <div className="w-full max-w-md">
            <PhotoPreview url={url} frame={frame} onRetake={() => setUrl(null)} />
          </div>
        </div>
      </div>
    )
  }

  /* ── Full-screen booth session ── */
  return (
    <div className="relative min-h-screen bg-paper">
      {/* Back button — floating, only before session starts */}
      <Link
        to="/frames"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-1 rounded-full
                   border border-line bg-paper/80 px-3 py-1.5 text-sm text-muted
                   backdrop-blur transition hover:text-accent">
        <ArrowLeft size={14} /> Back
      </Link>

      <BoothSession
        frame={frame}
        onCapture={(blob) => setUrl(URL.createObjectURL(blob))}
      />
    </div>
  )
}

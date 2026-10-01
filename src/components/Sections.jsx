import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, PenTool, Camera, BookOpen, ChevronRight } from 'lucide-react'
import { FrameGrid } from './FrameCard'

/* ── Hero: centered text only, no frame grid ── */
export function Hero() {
  return (
    <section className="mx-auto max-w-2xl px-5 pb-16 pt-20 text-center md:pt-28">
      <motion.h1
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
        Your moment,<br />your story.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }}
        className="mx-auto mt-5 max-w-md text-lg text-muted">
        A simple browser-based photobooth for little moments and memories worth keeping.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.7 }}
        className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/frames"
          className="rounded-full bg-accent px-7 py-4 font-medium text-surface transition active:scale-95 hover:brightness-110">
          Start Creating →
        </Link>
        <a href="#frames"
          className="rounded-full border border-line bg-surface px-7 py-4 transition active:scale-95 hover:border-accent">
          Explore Frames
        </a>
      </motion.div>
    </section>
  )
}

export function AboutSection() {
  const flow = [[Sparkles, 'AI'], [PenTool, 'Frame Design'], [Camera, 'Camera'], [BookOpen, 'Your Story']]
  return (
    <section className="border-y border-line bg-surface px-5 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl sm:text-5xl">Made with a little help from AI.</h2>
        <p className="mx-auto mt-5 max-w-xl text-muted">
          SnapStory is a simple photobooth project created as a small experiment in combining web development and generative AI.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          The photo frames are designed with the help of AI, while your photos are processed directly in your browser. Nothing is sent to a server.
        </p>
        <ol className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {flow.map(([Icon, label], i) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm">
                <Icon size={16} className="text-accent" />{label}
              </span>
              {i < flow.length - 1 && <ChevronRight size={16} className="hidden text-soft sm:block" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const steps = [
  ['01', 'Choose a Frame', 'Pick a frame that matches your mood — each one has 3–5 photo slots.'],
  ['02', 'Press Start', 'Hit START once and the whole session runs automatically with a 3-second countdown per photo.'],
  ['03', 'Create Your Story', 'Your photos are composed with the frame directly in the browser — nothing is uploaded.'],
  ['04', 'Download', 'Save your finished photo strip to your device.'],
]

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-4xl sm:text-5xl">How it works</h2>
      <ol className="mt-10 grid gap-8 md:grid-cols-4">
        {steps.map(([n, t, d]) => (
          <li key={n} className="border-t-2 border-accent pt-4">
            <span className="font-display text-3xl text-soft">{n}</span>
            <h3 className="mt-2 text-xl">{t}</h3>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function FrameCollection() {
  return (
    <section id="frames" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
      <h2 className="mb-10 text-4xl sm:text-5xl">Choose your frame.</h2>
      <FrameGrid />
    </section>
  )
}

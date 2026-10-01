import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const links = [['/', 'Home'], ['/frames', 'Frames'], ['/about', 'About']]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const cls = ({ isActive }) => `transition hover:text-accent ${isActive ? 'text-accent' : 'text-muted'}`
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-display text-2xl" onClick={() => setOpen(false)}>SnapStory</Link>
        <div className="hidden items-center gap-8 text-sm md:flex">
          {links.map(([to, label]) => <NavLink key={to} to={to} end className={cls}>{label}</NavLink>)}
          <Link to="/frames" className="rounded-full bg-accent px-5 py-2.5 font-medium text-surface transition active:scale-95 hover:brightness-110">Start Creating</Link>
        </div>
        <button className="grid h-11 w-11 place-items-center md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="flex flex-col gap-1 border-t border-line bg-paper px-5 pb-5 pt-3 md:hidden">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end onClick={() => setOpen(false)} className={(s) => `py-3 text-lg ${cls(s)}`}>{label}</NavLink>
          ))}
          <Link to="/frames" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-accent py-3 text-center font-medium text-surface">Start Creating</Link>
        </div>
      )}
    </header>
  )
}
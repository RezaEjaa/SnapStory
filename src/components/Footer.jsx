import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-line px-5 py-10 text-center text-sm text-muted">
      <p>Designed with AI · Built with React · Made for memories.</p>
      <p className="mt-2">© 2026 SnapStory</p>
      <div className="mt-4 flex justify-center gap-6 text-xs">
        <Link to="/about" className="hover:text-accent">About</Link>
        <Link to="/frames" className="hover:text-accent">Frames</Link>
        <Link to="/privacy" className="hover:text-accent">Privacy</Link>
      </div>
    </footer>
  )
}
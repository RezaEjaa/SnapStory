export default function Privacy() {
  const items = [
    'Photos are processed locally in your browser.',
    'SnapStory does not need to upload your photos.',
    'Camera access is only used when taking photos.',
    'Closing the page removes the current session data.',
  ]
  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-4xl sm:text-5xl">Your photos stay on your device.</h1>
      <ul className="mt-8 space-y-4 text-muted">
        {items.map((t) => <li key={t} className="border-l-2 border-soft pl-4">{t}</li>)}
      </ul>
      <p className="mt-8 text-sm text-muted">Photos you download are saved to your own device. What you do with them afterwards is up to you.</p>
    </section>
  )
}
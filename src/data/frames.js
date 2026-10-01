/**
 * frames.js
 * Merges manual metadata (id, name, description, tint) with auto-detected
 * slot data from frames.generated.json (canvasWidth, canvasHeight, slots[]).
 */
import generated from './frames.generated.json'

const manual = [
  { id: 'love-letter',    name: 'Love Letter',    tint: '#f2b8c0',
    description: 'A little love, a lot of memories.' },
  { id: 'blue-memory',    name: 'Blue Memory',    tint: '#a8c4d8',
    description: 'Cool tones for calm and timeless moments.' },
  { id: 'cherry-film',    name: 'Cherry Film',    tint: '#e8a0a8',
    description: 'A playful vintage frame filled with little details.' },
  { id: 'sweetheart',     name: 'Sweetheart',     tint: '#f4c4c8',
    description: 'Soft colors, sweet hearts, and moments worth keeping.' },
  { id: 'rosy-diary',     name: 'Rosy Diary',     tint: '#f0b8b0',
    description: 'Like a favorite diary page filled with memories.' },
  { id: 'classic-strip',  name: 'Classic Strip',  tint: '#d4cfc8',
    description: 'A clean photo strip for simple memories.' },
  { id: 'blush-booth',    name: 'Blush Booth',    tint: '#f8c8cc',
    description: 'A cute pink photobooth made for happy moments.' },
  { id: 'film-roll',      name: 'Film Roll',      tint: '#c8b89c',
    description: 'Capture your memories frame by frame.' },
  { id: 'after-the-show', name: 'After the Show', tint: '#c0b8d4',
    description: 'A little snapshot from your favorite night.' },
  { id: 'paper-memories', name: 'Paper Memories', tint: '#d8c8a8',
    description: 'A scrapbook-inspired frame for everyday moments.' },
]

export const frames = manual.map((m) => {
  const gen = generated.find((g) => g.id === m.id) ?? { canvasWidth: 1024, canvasHeight: 1024, slots: [] }
  return {
    ...m,
    image: `/frames/${m.id}.png`,
    canvasWidth: gen.canvasWidth,
    canvasHeight: gen.canvasHeight,
    slots: gen.slots,
  }
})

export const getFrame = (id) => frames.find((f) => f.id === id)

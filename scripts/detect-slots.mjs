/**
 * detect-slots.mjs
 * Reads each frame PNG, finds transparent "slot" areas enclosed by the frame
 * (i.e., NOT connected to the image border), and outputs:
 *   - public/frames/masks/<id>-<n>.png  (white = slot area)
 *   - src/data/frames.generated.json
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const FRAMES_DIR = join(ROOT, 'public', 'frames')
const MASKS_DIR = join(ROOT, 'public', 'frames', 'masks')
const OUT_JSON = join(ROOT, 'src', 'data', 'frames.generated.json')

if (!existsSync(MASKS_DIR)) mkdirSync(MASKS_DIR, { recursive: true })

const FRAME_META = [
  { id: 'love-letter',    file: 'love-letter.png' },
  { id: 'blue-memory',    file: 'blue-memory.png' },
  { id: 'cherry-film',    file: 'cherry-film.png' },
  { id: 'sweetheart',     file: 'sweetheart.png' },
  { id: 'rosy-diary',     file: 'rosy-diary.png' },
  { id: 'classic-strip',  file: 'classic-strip.png' },
  { id: 'blush-booth',    file: 'blush-booth.png' },
  { id: 'film-roll',      file: 'film-roll.png' },
  { id: 'after-the-show', file: 'after-the-show.png' },
  { id: 'paper-memories', file: 'paper-memories.png' },
]

// ---------------------------------------------------------------------------
// Flood-fill from all 4 edges to mark "exterior" transparent pixels
// ---------------------------------------------------------------------------
function floodFillExterior(alpha, width, height) {
  const exterior = new Uint8Array(width * height) // 0 = unknown, 1 = exterior
  const queue = []

  const enqueue = (x, y) => {
    const idx = y * width + x
    if (x < 0 || x >= width || y < 0 || y >= height) return
    if (exterior[idx]) return
    if (alpha[idx] >= 10) return // opaque pixel — not transparent
    exterior[idx] = 1
    queue.push(x, y)
  }

  // Seed from all border pixels that are transparent
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1) }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y) }

  let head = 0
  while (head < queue.length) {
    const x = queue[head++]
    const y = queue[head++]
    enqueue(x + 1, y); enqueue(x - 1, y)
    enqueue(x, y + 1); enqueue(x, y - 1)
  }

  return exterior
}

// ---------------------------------------------------------------------------
// Connected-components on interior transparent pixels (BFS)
// Returns array of { pixels: Set<idx>, minX, minY, maxX, maxY }
// ---------------------------------------------------------------------------
function findComponents(alpha, exterior, width, height) {
  const visited = new Uint8Array(width * height)
  const components = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx] || exterior[idx] || alpha[idx] >= 10) continue
      // BFS
      const comp = { pixels: [], minX: x, minY: y, maxX: x, maxY: y }
      const q = [x, y]
      visited[idx] = 1
      let head = 0
      while (head < q.length) {
        const cx = q[head++]; const cy = q[head++]
        const ci = cy * width + cx
        comp.pixels.push(ci)
        if (cx < comp.minX) comp.minX = cx
        if (cx > comp.maxX) comp.maxX = cx
        if (cy < comp.minY) comp.minY = cy
        if (cy > comp.maxY) comp.maxY = cy
        const neighbors = [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const ni = ny * width + nx
          if (visited[ni] || exterior[ni] || alpha[ni] >= 10) continue
          visited[ni] = 1
          q.push(nx, ny)
        }
      }
      components.push(comp)
    }
  }
  return components
}

// ---------------------------------------------------------------------------
// Build a white-on-transparent mask PNG for a component
// ---------------------------------------------------------------------------
async function buildMask(comp, width, height) {
  const buf = Buffer.alloc(width * height * 4, 0) // RGBA all transparent
  for (const idx of comp.pixels) {
    const off = idx * 4
    buf[off] = 255; buf[off+1] = 255; buf[off+2] = 255; buf[off+3] = 255
  }
  return sharp(buf, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const results = []

for (const { id, file } of FRAME_META) {
  const imgPath = join(FRAMES_DIR, file)
  if (!existsSync(imgPath)) {
    console.warn(`⚠  SKIP ${id} — file not found: ${imgPath}`)
    continue
  }

  const { data, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const totalPixels = width * height

  // Extract alpha channel
  const alpha = new Uint8Array(totalPixels)
  for (let i = 0; i < totalPixels; i++) alpha[i] = data[i * channels + 3]

  const exterior = floodFillExterior(alpha, width, height)
  const components = findComponents(alpha, exterior, width, height)

  const minArea = totalPixels * 0.02
  const slots = components
    .filter(c => c.pixels.length >= minArea)
    .sort((a, b) => {
      // top-to-bottom then left-to-right by bounding box center
      const ay = (a.minY + a.maxY) / 2, by = (b.minY + b.maxY) / 2
      const ax = (a.minX + a.maxX) / 2, bx = (b.minX + b.maxX) / 2
      const rowThreshold = height * 0.08
      if (Math.abs(ay - by) > rowThreshold) return ay - by
      return ax - bx
    })

  const slotData = []
  for (let n = 0; n < slots.length; n++) {
    const c = slots[n]
    const x = c.minX, y = c.minY
    const w = c.maxX - c.minX + 1
    const h = c.maxY - c.minY + 1
    const maskName = `${id}-${n}.png`
    const maskBuf = await buildMask(c, width, height)
    writeFileSync(join(MASKS_DIR, maskName), maskBuf)
    slotData.push({ x, y, w, h, mask: `/frames/masks/${maskName}` })
  }

  results.push({ id, canvasWidth: width, canvasHeight: height, slots: slotData })

  console.log(`✓ ${id.padEnd(18)} ${width}×${height}  →  ${slotData.length} slot(s)`)
  slotData.forEach((s, i) =>
    console.log(`    slot ${i}: x=${s.x} y=${s.y} w=${s.w} h=${s.h}`)
  )
}

writeFileSync(OUT_JSON, JSON.stringify(results, null, 2))
console.log(`\n✅ Written: src/data/frames.generated.json  (${results.length} frames)`)

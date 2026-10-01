/**
 * composePhoto.js
 * Composes multiple photos (one per slot) into a single PNG with the frame overlay.
 * Each photo is cropped cover-fit into its slot bounding box, then masked with
 * the slot mask PNG so irregular shapes (hearts, tilted) don't bleed outside.
 */

const cache = new Map()

function loadImage(src) {
  if (cache.has(src)) return cache.get(src)
  const p = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load image: ${src}`))
    img.crossOrigin = 'anonymous'
    img.src = src
  })
  cache.set(src, p)
  return p
}

/**
 * Draw one video/image source cover-cropped into (dx, dy, dw, dh) on ctx.
 * If mirror=true, flip horizontally around the destination rect center.
 */
function drawCoverCrop(ctx, source, dx, dy, dw, dh, mirror = false) {
  const sw = source.videoWidth ?? source.naturalWidth ?? source.width
  const sh = source.videoHeight ?? source.naturalHeight ?? source.height
  const scale = Math.max(dw / sw, dh / sh)
  const cw = dw / scale
  const ch = dh / scale
  const cx = (sw - cw) / 2
  const cy = (sh - ch) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(dx, dy, dw, dh)
  ctx.clip()
  if (mirror) {
    ctx.translate(dx + dw, dy)
    ctx.scale(-1, 1)
    ctx.drawImage(source, cx, cy, cw, ch, 0, 0, dw, dh)
  } else {
    ctx.drawImage(source, cx, cy, cw, ch, dx, dy, dw, dh)
  }
  ctx.restore()
}

/**
 * Apply mask to a slot: keeps only white pixels from mask inside slot bounds.
 * Uses an offscreen canvas per slot with destination-in compositing.
 */
async function applyMask(mainCtx, slot, mirror) {
  const { x, y, w, h, mask } = slot
  const maskImg = await loadImage(mask)

  // Offscreen canvas for just this slot
  const off = document.createElement('canvas')
  off.width = mainCtx.canvas.width
  off.height = mainCtx.canvas.height
  const octx = off.getContext('2d')

  // Copy the already-drawn photo pixels from main canvas
  octx.drawImage(mainCtx.canvas, 0, 0)

  // Cut with mask (destination-in keeps only where mask is opaque)
  octx.globalCompositeOperation = 'destination-in'
  octx.drawImage(maskImg, 0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

  // Erase that slot region from main canvas and paste masked version back
  mainCtx.clearRect(x, y, w, h)
  mainCtx.drawImage(off, 0, 0)
}

/**
 * @param {(HTMLVideoElement|HTMLImageElement)[]} sources - one per slot, in order
 * @param {object} frame - { canvasWidth, canvasHeight, slots, image }
 * @param {boolean} mirror - true for front-facing camera
 * @returns {Promise<Blob>}
 */
export async function composePhoto(sources, frame, mirror = true) {
  const { canvasWidth: W, canvasHeight: H, slots, image } = frame

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Draw each photo into its slot
  for (let i = 0; i < slots.length; i++) {
    const src = sources[i]
    if (!src) continue
    const { x, y, w, h } = slots[i]
    try {
      drawCoverCrop(ctx, src, x, y, w, h, mirror)
      // Apply per-slot mask for irregular shapes
      if (slots[i].mask) {
        await applyMask(ctx, slots[i], mirror)
      }
    } catch (err) {
      console.warn(`Slot ${i} draw error:`, err)
    }
  }

  // Frame PNG overlay on top
  try {
    const frameImg = await loadImage(image)
    ctx.drawImage(frameImg, 0, 0, W, H)
  } catch (err) {
    console.warn('Frame overlay error:', err)
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Export failed'))),
      'image/png'
    )
  )
}

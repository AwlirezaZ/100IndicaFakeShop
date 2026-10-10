// Downloads the ~200 DummyJSON products (electronics, fashion, home…) into src/data/dummyjson.json,
// with each thumbnail embedded as a data URI. They used to be fetched live, but dummyjson.com is blocked
// on some networks, which silently left the shop with only books, groceries and beauty.
// Run with: npm run refresh-products (or on its own: node scripts/fetch-dummyjson.mjs)
import { mkdirSync, writeFileSync } from 'node:fs'

const UA = '100IndicaShopDemo/1.0 (personal demo project)'
const KEEP = [
  'id', 'title', 'description', 'category', 'price', 'discountPercentage', 'rating', 'stock', 'tags', 'brand',
  'warrantyInformation', 'shippingInformation', 'returnPolicy', 'reviews', 'images', 'thumbnail',
]

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      if (r.ok) return r
      if (attempt >= 4) throw new Error(`HTTP ${r.status}`)
    } catch (e) {
      if (attempt >= 4) throw e
    }
    await new Promise((r) => setTimeout(r, 3000 * attempt))
  }
}

console.log('📱 DummyJSON (electronics, fashion, home…)')
const { products } = await (await get('https://dummyjson.com/products?limit=0')).json()

const out = []
let bytes = 0
for (const p of products) {
  const r = await get(p.thumbnail)
  const buf = Buffer.from(await r.arrayBuffer())
  bytes += buf.length
  const type = r.headers.get('content-type')?.split(';')[0] || 'image/webp'
  out.push({
    ...Object.fromEntries(KEEP.filter((k) => p[k] !== undefined).map((k) => [k, p[k]])),
    meta: p.meta?.createdAt ? { createdAt: p.meta.createdAt } : undefined,
    thumbnail: `data:${type};base64,${buf.toString('base64')}`,
  })
  process.stdout.write(`\r  ${out.length}/${products.length} thumbnails`)
}

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/dummyjson.json', JSON.stringify({ fetchedAt: new Date().toISOString(), products: out }))
console.log(`\n✅ Saved ${out.length} products (${Math.round(bytes / 1024)} KB of thumbnails) to src/data/dummyjson.json`)

// Downloads ~10,000 real products from free open-data APIs into src/data/catalog.json,
// which gets bundled into the site. Run with: npm run refresh-products
//
// Titles, brands/authors, photos and book ratings are real. These APIs have no prices,
// so price, discount, stock (and ratings for food/beauty) are generated deterministically.
import { mkdirSync, writeFileSync } from 'node:fs'

const TARGET = 10000
const UA = '100IndicaShopDemo/1.0 (personal demo project)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// [our category slug, Open Food Facts category tag]
const FOOD = [
  ['snacks', 'en:salty-snacks'],
  ['breakfast-cereals', 'en:breakfast-cereals'],
  ['chocolate-candy', 'en:chocolates'],
  ['coffee', 'en:coffees'],
  ['tea', 'en:teas'],
  ['pasta-rice', 'en:pastas'],
  ['sauces-condiments', 'en:sauces'],
  ['cookies-biscuits', 'en:biscuits'],
  ['cheese', 'en:cheeses'],
  ['juices', 'en:fruit-juices'],
  ['soft-drinks', 'en:sodas'],
  ['frozen-foods', 'en:frozen-foods'],
]
const FOOD_PER_CATEGORY = 300

const BEAUTY = [
  ['shampoo-conditioner', 'en:shampoos'],
  ['shower-bath', 'en:shower-gels'],
  ['face-care', 'en:face-creams'],
  ['deodorants', 'en:deodorants'],
  ['oral-care', 'en:toothpastes'],
  ['body-care', 'en:body-milks'],
  ['sun-care', 'en:sunscreens'],
  ['soaps', 'en:soaps'],
]
const BEAUTY_PER_CATEGORY = 190

// Books are fetched last and fill the catalog up to TARGET.
const BOOKS = [
  ['books-fiction', 'subject:fiction'],
  ['books-mystery-thriller', 'subject:mystery'],
  ['books-fantasy', 'subject:fantasy'],
  ['books-science-fiction', 'subject:"science fiction"'],
  ['books-romance', 'subject:romance'],
  ['books-kids', 'subject:"juvenile fiction"'],
  ['books-biography', 'subject:biography'],
  ['books-history', 'subject:history'],
  ['books-business', 'subject:business'],
  ['books-cooking', 'subject:cooking'],
  ['books-self-help', 'subject:"self-help"'],
  ['books-science', 'subject:science'],
  ['books-poetry', 'subject:poetry'],
  ['books-travel', 'subject:travel'],
]

async function getJSON(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      if (r.ok) return await r.json()
      if (attempt >= 5) throw new Error(`HTTP ${r.status}`)
      console.log(`    HTTP ${r.status}, retrying…`)
    } catch (e) {
      if (attempt >= 5) throw e
      console.log(`    ${e.message}, retrying…`)
    }
    await sleep(10000 * attempt)
  }
}

// Small seeded PRNG so generated prices stay the same between runs.
function rng(seed) {
  let h = 2166136261
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function commerce(seed, minPrice, maxPrice) {
  const r = rng(seed)
  const price = Math.floor(minPrice + r() * (maxPrice - minPrice)) + 0.99
  const discount = r() < 0.35 ? Math.round(5 + r() * 25) : 0
  const stock = r() < 0.02 ? 0 : Math.floor(1 + r() * 200)
  const rating = Math.round((3.2 + Math.pow(r(), 0.6) * 1.8) * 10) / 10
  const ratingCount = Math.floor(3 + Math.pow(r(), 2) * 2500)
  return { p: price, d: discount, s: stock, r: rating, n: ratingCount }
}

const latin = (s) => /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}\p{S}]+$/u.test(s)
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const titleCase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s)

const seen = new Set()
const out = []

/** Adds an Open Food/Beauty Facts product if it has an English-looking name and a photo. */
function addFactsProduct(p, slug, kind, minPrice, maxPrice) {
  const name = clean(p.product_name_en || p.product_name)
  const brand = clean([p.brands].flat()[0]?.split(',')[0])
  const img = /\/images\/products\/(.+)\.400\.jpg$/.exec(p.image_front_url ?? '')?.[1]
  if (!name || name.length < 3 || !img || !latin(name) || !latin(brand || 'x') || seen.has(p.code)) return false
  seen.add(p.code)
  out.push({
    i: (kind === 'obf' ? 300000 : 200000) + out.length,
    t: titleCase(name).slice(0, 120),
    b: titleCase(brand) || undefined,
    c: slug,
    ...commerce(p.code, minPrice, maxPrice),
    img: `${kind}:${img}`,
    q: clean(p.quantity) || undefined,
    ns: /^[a-e]$/.test(p.nutriscore_grade ?? '') ? p.nutriscore_grade : undefined,
    g: (p.labels_tags ?? [])
      .filter((l) => l.startsWith('en:'))
      .map((l) => l.slice(3).replace(/-/g, ' '))
      .slice(0, 4),
  })
  return true
}

const FACT_FIELDS = 'code,product_name,product_name_en,brands,image_front_url,quantity,nutriscore_grade,labels_tags'

console.log('🛒 Groceries (Open Food Facts)')
for (const [slug, tag] of FOOD) {
  let n = 0
  try {
    for (let page = 1; page <= 6 && n < FOOD_PER_CATEGORY; page++) {
      const q = encodeURIComponent(`categories_tags:"${tag}" AND countries_tags:"en:united-states"`)
      const data = await getJSON(
        `https://search.openfoodfacts.org/search?q=${q}&page_size=100&page=${page}&fields=${FACT_FIELDS}&sort_by=-unique_scans_n`,
      )
      for (const p of data.hits ?? []) if (n < FOOD_PER_CATEGORY && addFactsProduct(p, slug, 'off', 1, 15)) n++
      if ((data.hits ?? []).length < 100) break
      await sleep(1500)
    }
  } catch (e) {
    console.log(`    skipped rest of ${slug}: ${e.message}`)
  }
  console.log(`  ${slug}: ${n}`)
}

console.log('🧴 Beauty (Open Beauty Facts)')
for (const [slug, tag] of BEAUTY) {
  let n = 0
  try {
    for (let page = 1; page <= 4 && n < BEAUTY_PER_CATEGORY; page++) {
      const data = await getJSON(
        `https://world.openbeautyfacts.org/api/v2/search?categories_tags=${tag}&page_size=100&page=${page}&fields=${FACT_FIELDS}&sort_by=unique_scans_n`,
      )
      for (const p of data.products) if (n < BEAUTY_PER_CATEGORY && addFactsProduct(p, slug, 'obf', 3, 40)) n++
      if (data.products.length < 100) break
      await sleep(7000) // the classic search API allows ~10 searches per minute
    }
  } catch (e) {
    console.log(`    skipped rest of ${slug}: ${e.message}`)
  }
  console.log(`  ${slug}: ${n}`)
  await sleep(7000)
}

console.log('📚 Books (Open Library)')
const perSubject = Math.ceil((TARGET - out.length) / BOOKS.length)
for (const [slug, q] of BOOKS) {
  const fields = 'key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,subject,number_of_pages_median'
  let n = 0
  try {
    const data = await getJSON(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1000&fields=${fields}&lang=en`,
    )
    for (const b of data.docs) {
      if (n >= perSubject || out.length >= TARGET) break
      if (!b.cover_i || !b.author_name?.length || !b.title || seen.has(b.key) || !latin(b.title)) continue
      seen.add(b.key)
      const c = commerce(b.key, 6, 30)
      const hasRating = b.ratings_count > 0
      out.push({
        i: 100000 + out.length,
        t: clean(b.title).slice(0, 120),
        b: clean(b.author_name[0]),
        c: slug,
        ...c,
        r: hasRating ? Math.round(b.ratings_average * 10) / 10 : c.r,
        // Unrated books get a small made-up count so real Open Library favourites rank above them.
        n: hasRating ? b.ratings_count : Math.max(1, Math.round(c.n / 100)),
        img: `ol:${b.cover_i}`,
        y: b.first_publish_year,
        pg: b.number_of_pages_median,
        a: b.author_name.slice(0, 3).map(clean),
        g: (b.subject ?? []).filter((s) => s.length < 30 && latin(s)).slice(0, 5),
      })
      n++
    }
  } catch (e) {
    console.log(`    skipped ${slug}: ${e.message}`)
  }
  console.log(`  ${slug}: ${n}`)
  await sleep(1000)
}

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/catalog.json', JSON.stringify({ fetchedAt: new Date().toISOString(), products: out }))
console.log(`\n✅ Saved ${out.length} products to src/data/catalog.json`)

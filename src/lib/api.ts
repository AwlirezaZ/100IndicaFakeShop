import { useCallback, useEffect, useState } from 'react'
// Real products downloaded from open-data APIs by `npm run refresh-products` (see scripts/fetch-catalog.mjs).
import catalogRaw from '../data/catalog.json?raw'
// DummyJSON products with embedded thumbnails, downloaded by scripts/fetch-dummyjson.mjs (bundled, not fetched live).
import dummyRaw from '../data/dummyjson.json?raw'
import { formatMoney } from './currency'

export interface Review {
  rating: number
  comment: string
  date: string
  reviewerName: string
}

export interface Product {
  id: number
  title: string
  description: string
  category: string
  department: string
  price: number
  discountPercentage: number
  rating: number
  ratingCount: number
  stock: number
  tags: string[]
  brand?: string
  warrantyInformation?: string
  shippingInformation?: string
  returnPolicy?: string
  reviews: Review[]
  images: string[]
  thumbnail: string
  meta?: { createdAt: string }
  /** Extra spec rows shown on the product page, e.g. Author or Nutri-Score. */
  details?: [string, string][]
  source: string
  /** Lowercased text used for search. */
  search: string
  /** Stable pseudo-random order for the "Featured" sort, so departments are mixed. */
  rank: number
}

/** Compact product shape stored in catalog.json. */
interface CatalogItem {
  i: number
  t: string
  b?: string
  c: string
  p: number
  d: number
  s: number
  r: number
  n: number
  img: string
  y?: number
  pg?: number
  a?: string[]
  q?: string
  ns?: string
  g?: string[]
}

export const DEPARTMENTS = [
  { slug: 'electronics', name: 'Electronics', categories: ['smartphones', 'laptops', 'tablets', 'mobile-accessories'] },
  {
    slug: 'fashion',
    name: 'Fashion',
    categories: ['mens-shirts', 'mens-shoes', 'mens-watches', 'womens-dresses', 'tops', 'womens-shoes', 'womens-bags', 'womens-jewellery', 'womens-watches', 'sunglasses'],
  },
  { slug: 'home', name: 'Home & Kitchen', categories: ['furniture', 'home-decoration', 'kitchen-accessories'] },
  {
    slug: 'beauty',
    name: 'Beauty',
    categories: ['beauty', 'fragrances', 'skin-care', 'face-care', 'shampoo-conditioner', 'shower-bath', 'body-care', 'soaps', 'deodorants', 'oral-care', 'sun-care'],
  },
  {
    slug: 'grocery',
    name: 'Grocery',
    categories: ['groceries', 'snacks', 'breakfast-cereals', 'chocolate-candy', 'cookies-biscuits', 'coffee', 'tea', 'juices', 'soft-drinks', 'pasta-rice', 'sauces-condiments', 'cheese', 'frozen-foods'],
  },
  {
    slug: 'books',
    name: 'Books',
    categories: ['books-fiction', 'books-mystery-thriller', 'books-fantasy', 'books-science-fiction', 'books-romance', 'books-kids', 'books-biography', 'books-history', 'books-business', 'books-cooking', 'books-self-help', 'books-science', 'books-poetry', 'books-travel'],
  },
  { slug: 'sports', name: 'Sports & Outdoors', categories: ['sports-accessories', 'motorcycle', 'vehicle'] },
]

const deptOf = new Map(DEPARTMENTS.flatMap((d) => d.categories.map((c) => [c, d.slug] as const)))
export const departmentOf = (category: string) => deptOf.get(category) ?? 'other'
export const departmentName = (slug: string) => DEPARTMENTS.find((d) => d.slug === slug)?.name ?? 'More'

const NAME_OVERRIDES: Record<string, string> = {
  beauty: 'Makeup',
  groceries: 'Fresh Food',
  tops: "Women's Tops",
  'books-kids': "Children's Books",
  'books-self-help': 'Self-Help',
  'books-mystery-thriller': 'Mystery & Thriller',
  'chocolate-candy': 'Chocolate & Candy',
  'cookies-biscuits': 'Cookies & Biscuits',
  'sauces-condiments': 'Sauces & Condiments',
  'pasta-rice': 'Pasta',
  'shampoo-conditioner': 'Shampoo & Conditioner',
  'shower-bath': 'Shower & Bath',
  'motorcycle': 'Motorcycles',
  'vehicle': 'Cars',
}

export function categoryName(slug: string) {
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug]
  return slug
    .replace(/^books-/, '')
    .split('-')
    .map((w) => (w === 'mens' ? "Men's" : w === 'womens' ? "Women's" : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

function hash(n: number) {
  let h = Math.imul(n ^ 0x9e3779b9, 2654435761)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

function finish(p: Omit<Product, 'department' | 'search' | 'rank'>): Product {
  const department = departmentOf(p.category)
  const search = [p.title, p.brand, categoryName(p.category), departmentName(department), ...p.tags, ...(p.details ?? []).map((d) => d[1])]
    .join(' ')
    .toLowerCase()
  return { ...p, department, search, rank: hash(p.id) }
}

const IMAGE_HOSTS: Record<string, string> = {
  off: 'https://images.openfoodfacts.org/images/products/',
  obf: 'https://images.openbeautyfacts.org/images/products/',
}

const USEFUL_LABEL =
  /organic|vegan|vegetarian|gluten|fair ?trade|no added|non gmo|kosher|halal|palm oil free|no preservative|whole ?grain|cruelty|sugar free|high protein|low fat/

function fromCatalog(x: CatalogItem): Product {
  const [kind, key] = x.img.split(/:(.*)/s)
  const isBook = kind === 'ol'
  const image = isBook ? `https://covers.openlibrary.org/b/id/${key}-L.jpg` : `${IMAGE_HOSTS[kind]}${key}.400.jpg`
  const thumb = isBook ? `https://covers.openlibrary.org/b/id/${key}-M.jpg` : image
  // Open Food/Beauty Facts labels include admin noise ("nutriscore", "green dot"); keep the shopper-friendly ones.
  const tags = isBook ? (x.g ?? []) : (x.g ?? []).filter((t) => USEFUL_LABEL.test(t))

  const details: [string, string][] = isBook
    ? [
        ['Author', (x.a ?? [x.b]).join(', ')],
        ...(x.y ? [['First published', String(x.y)] as [string, string]] : []),
        ...(x.pg ? [['Pages', String(x.pg)] as [string, string]] : []),
      ]
    : [
        ...(x.b ? [['Brand', x.b] as [string, string]] : []),
        ...(x.q ? [['Size', x.q] as [string, string]] : []),
        ...(x.ns ? [['Nutri-Score', x.ns.toUpperCase()] as [string, string]] : []),
      ]

  const description = isBook
    ? `“${x.t}” by ${(x.a ?? [x.b]).join(', ')}${x.y ? `, first published in ${x.y}` : ''}.` +
      (tags.length ? ` A great pick if you enjoy ${tags.slice(0, 3).join(', ').toLowerCase()}.` : '')
    : `${x.t}${x.b ? ` by ${x.b}` : ''}${x.q ? ` (${x.q})` : ''}.` + (tags.length ? ` ${tags.map((t) => t[0].toUpperCase() + t.slice(1)).join(' · ')}.` : '')

  return finish({
    id: x.i,
    title: x.t,
    description,
    category: x.c,
    price: x.p,
    discountPercentage: x.d,
    rating: x.r,
    ratingCount: x.n,
    stock: x.s,
    tags,
    brand: x.b,
    shippingInformation: isBook ? 'Ships in 1-2 business days' : undefined,
    returnPolicy: kind === 'off' ? 'Non-returnable food item' : undefined,
    reviews: [],
    images: [image],
    thumbnail: thumb,
    details,
    source: isBook ? 'Open Library' : kind === 'off' ? 'Open Food Facts' : 'Open Beauty Facts',
  })
}

type DummyProduct = Omit<Product, 'department' | 'search' | 'rank' | 'ratingCount' | 'source'>

function fromDummyJSON(p: DummyProduct): Product {
  return finish({ ...p, ratingCount: p.reviews.length, source: 'DummyJSON' })
}

// IndiBox™: a mystery box that reveals a random product after you "buy" it (see MysteryUnbox).
export const MYSTERY_ID = 999999
const MYSTERY_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect x="30" y="80" width="140" height="100" rx="10" fill="#7f2a9b"/>
      <rect x="22" y="60" width="156" height="34" rx="8" fill="#bf55dd"/>
      <rect x="88" y="60" width="24" height="120" fill="#57ff53"/>
      <path d="M100 60 C70 20 40 40 70 60 Z M100 60 C130 20 160 40 130 60 Z" fill="#3fd43c"/>
      <text x="100" y="152" font-family="Arial Black,Arial" font-weight="900" font-size="54" text-anchor="middle" fill="#fff">?</text>
    </svg>`,
  )

const MYSTERY = finish({
  id: MYSTERY_ID,
  title: 'IndiBox™ Mystery Box',
  description:
    'What’s inside? Nobody knows. Not even us. Could be a phone. Could be a single jar of pimentos. Open it after checkout to find out!',
  category: 'mystery-box',
  price: 9.99,
  discountPercentage: 0,
  rating: 5,
  ratingCount: 42,
  stock: 999,
  tags: ['mystery', 'surprise', 'gift', 'indibox'],
  brand: '100Indica Shop',
  reviews: [],
  images: [MYSTERY_IMAGE],
  thumbnail: MYSTERY_IMAGE,
  details: [
    ['Contents', 'Yes'],
    ['Weight', 'Somewhere between 1 g and 1 tonne'],
    ['Returns', 'You can’t return a mystery'],
  ],
  source: '100Indica Shop',
})

let cache: Promise<Product[]> | null = null

export function loadProducts(): Promise<Product[]> {
  if (!cache) {
    cache = new Promise<Product[]>((resolve) => {
      const live = (JSON.parse(dummyRaw) as { products: DummyProduct[] }).products.map(fromDummyJSON)
      const catalog = (JSON.parse(catalogRaw) as { products: CatalogItem[] }).products.map(fromCatalog)
      resolve([MYSTERY, ...live, ...catalog])
    }).catch((e) => {
      cache = null
      throw e
    })
  }
  return cache
}

export function useProducts() {
  const [data, setData] = useState<Product[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    setError(false)
    loadProducts()
      .then((p) => alive && setData(p))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { data, error, loading: !data && !error, retry }
}

export function getCategories(products: Product[]) {
  const map = new Map<string, Product[]>()
  for (const p of products) {
    if (!map.has(p.category)) map.set(p.category, [])
    map.get(p.category)!.push(p)
  }
  return [...map.entries()].map(([slug, items]) => ({
    slug,
    name: categoryName(slug),
    department: departmentOf(slug),
    count: items.length,
  }))
}

export function getDepartments(products: Product[]) {
  const counts = new Map<string, number>()
  for (const p of products) counts.set(p.department, (counts.get(p.department) ?? 0) + 1)
  return DEPARTMENTS.filter((d) => counts.has(d.slug)).map((d) => ({ ...d, count: counts.get(d.slug)! }))
}

export function queryWords(q: string) {
  return q.toLowerCase().split(/\s+/).filter(Boolean)
}

export function matchesQuery(p: Product, words: string[]) {
  return words.every((w) => p.search.includes(w))
}

/** Popularity-weighted rating, so a single 5★ vote doesn't beat 4.6★ from 2,000 people. */
export function ratingScore(p: Product) {
  return (p.rating * p.ratingCount + 3.8 * 50) / (p.ratingCount + 50)
}

/** API `price` is the sale price; derive the pre-discount price for the strikethrough. */
export function originalPrice(p: Product) {
  return p.price / (1 - p.discountPercentage / 100)
}

/** Formats a USD price in the selected currency (dollars, bananas, pizzas…). */
export const money = formatMoney

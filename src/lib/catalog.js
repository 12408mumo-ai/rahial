export const ALL_CATEGORY = 'all'

export const CATEGORY_FILTERS = [
  { name: 'All', slug: ALL_CATEGORY },
  { name: 'Sneakers', slug: 'sneakers' },
  { name: 'Streetwear', slug: 'streetwear' },
  { name: 'Old Money', slug: 'old-money' },
  { name: 'Y2K', slug: 'y2k' },
]

const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="Image pending">
  <rect width="800" height="1000" fill="#050505"/>
  <rect x="70" y="70" width="660" height="860" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <text x="400" y="480" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-6" text-anchor="middle">CREE WRLD</text>
  <text x="400" y="540" fill="#8a8a8a" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="8" text-anchor="middle">IMAGE PENDING</text>
</svg>`

export const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  PLACEHOLDER_SVG,
)}`

function parsePostgresTextArray(value) {
  const inner = value.slice(1, -1).trim()
  if (!inner) return []

  return inner
    .split(',')
    .map((entry) =>
      entry
        .trim()
        .replace(/^"(.*)"$/, '$1')
        .replace(/^'(.*)'$/, '$1')
        .trim(),
    )
    .filter(Boolean)
}

export function normalizeSizes(sizes) {
  if (Array.isArray(sizes)) {
    return sizes
      .map((size) => (typeof size === 'string' ? size.trim() : String(size ?? '')))
      .filter(Boolean)
  }

  if (typeof sizes !== 'string') return []

  const trimmed = sizes.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return normalizeSizes(parsed)
    } catch {
      // Fall through to PostgreSQL or single-value parsing.
    }
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parsePostgresTextArray(trimmed)
  }

  return [trimmed]
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getCategoryInfo(product) {
  const relation = Array.isArray(product?.categories)
    ? product.categories[0]
    : product?.categories

  if (!relation) {
    return { name: 'Uncategorized', slug: 'uncategorized' }
  }

  if (typeof relation === 'string') {
    const name = relation.trim() || 'Uncategorized'
    return { name, slug: slugify(name) || 'uncategorized' }
  }

  const name = String(relation.name || 'Uncategorized').trim() || 'Uncategorized'
  const slug = String(relation.slug || '').trim() || slugify(name)

  return { name, slug }
}

export function resolveProductImage(imageUrl) {
  if (typeof imageUrl !== 'string') return PLACEHOLDER_IMAGE

  const value = imageUrl.trim()
  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) {
    return value
  }

  return PLACEHOLDER_IMAGE
}

export function normalizeProduct(product) {
  const price = Number(product?.price)

  return {
    ...product,
    title: String(product?.title || 'Untitled piece'),
    price: Number.isFinite(price) ? price : 0,
    condition: String(product?.condition || 'Excellent').trim(),
    sizes: normalizeSizes(product?.sizes),
    image_url: resolveProductImage(product?.image_url),
    category: getCategoryInfo(product),
  }
}

export function formatPrice(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'KSh 0'

  const formatted = new Intl.NumberFormat('en-KE', {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount)

  return `KSh ${formatted}`
}

export function filterProducts(products, activeCategory = ALL_CATEGORY) {
  const items = Array.isArray(products) ? products : []

  if (!activeCategory || activeCategory === ALL_CATEGORY) return items

  const needle = String(activeCategory).trim().toLowerCase()

  return items.filter((product) => {
    const category = product?.category || getCategoryInfo(product)
    return (
      category.slug.toLowerCase() === needle ||
      category.name.toLowerCase() === needle
    )
  })
}

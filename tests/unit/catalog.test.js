import { describe, expect, it } from 'vitest'
import {
  ALL_CATEGORY,
  CATEGORY_FILTERS,
  PLACEHOLDER_IMAGE,
  filterProducts,
  formatPrice,
  getCategoryInfo,
  normalizeProduct,
  normalizeSizes,
  resolveProductImage,
  slugify,
} from '../../src/lib/catalog.js'

describe('catalog helpers', () => {
  it('normalizes text arrays from Supabase and PostgreSQL literals', () => {
    expect(normalizeSizes([' M ', 'L', ''])).toEqual(['M', 'L'])
    expect(normalizeSizes('{M,L,"XL"}')).toEqual(['M', 'L', 'XL'])
    expect(normalizeSizes('["S","M"]')).toEqual(['S', 'M'])
    expect(normalizeSizes(null)).toEqual([])
  })

  it('reads nested category relations and falls back safely', () => {
    expect(
      getCategoryInfo({ categories: { name: 'Old Money', slug: 'old-money' } }),
    ).toEqual({ name: 'Old Money', slug: 'old-money' })
    expect(getCategoryInfo({ categories: [{ name: 'Y2K' }] })).toEqual({
      name: 'Y2K',
      slug: 'y2k',
    })
    expect(getCategoryInfo({})).toEqual({
      name: 'Uncategorized',
      slug: 'uncategorized',
    })
    expect(slugify(' Old  Money ')).toBe('old-money')
  })

  it('keeps safe product image URLs and replaces unsafe or empty values', () => {
    const imageUrl =
      'https://vagnxflwjldokhqvyrqg.supabase.co/storage/v1/object/public/product-images/photo.jpg'

    expect(resolveProductImage(imageUrl)).toBe(imageUrl)
    expect(resolveProductImage('javascript:alert(1)')).toBe(PLACEHOLDER_IMAGE)
    expect(resolveProductImage('')).toBe(PLACEHOLDER_IMAGE)
  })

  it('normalizes products and formats Kenyan prices', () => {
    const product = normalizeProduct({
      id: 'p1',
      title: 'Arc Jacket',
      price: '4500.50',
      condition: 'Like New',
      sizes: '{M,L}',
      image_url: 'https://example.com/photo.jpg',
      categories: { name: 'Streetwear', slug: 'streetwear' },
    })

    expect(product.price).toBe(4500.5)
    expect(product.sizes).toEqual(['M', 'L'])
    expect(product.category).toEqual({ name: 'Streetwear', slug: 'streetwear' })
    expect(formatPrice(4500)).toContain('4,500')
  })

  it('filters by the four required category slugs', () => {
    const products = [
      normalizeProduct({
        id: '1',
        title: 'Runner',
        price: 1,
        sizes: ['40'],
        categories: { name: 'Sneakers', slug: 'sneakers' },
      }),
      normalizeProduct({
        id: '2',
        title: 'Jacket',
        price: 1,
        sizes: ['M'],
        categories: { name: 'Streetwear', slug: 'streetwear' },
      }),
      normalizeProduct({
        id: '3',
        title: 'Loafer',
        price: 1,
        sizes: ['42'],
        categories: { name: 'Old Money', slug: 'old-money' },
      }),
      normalizeProduct({
        id: '4',
        title: 'Cargo',
        price: 1,
        sizes: ['L'],
        categories: { name: 'Y2K', slug: 'y2k' },
      }),
    ]

    expect(CATEGORY_FILTERS.map((category) => category.name)).toEqual([
      'All',
      'Sneakers',
      'Streetwear',
      'Old Money',
      'Y2K',
    ])
    expect(filterProducts(products, ALL_CATEGORY)).toHaveLength(4)
    expect(filterProducts(products, 'y2k').map((item) => item.title)).toEqual([
      'Cargo',
    ])
    expect(
      filterProducts(products, 'streetwear').map((item) => item.title),
    ).toEqual(['Jacket'])
  })
})

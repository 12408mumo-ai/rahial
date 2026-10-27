import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { normalizeProduct } from '../../src/lib/catalog.js'
import {
  addCartLine,
  buildOrderPayload,
  cartItemCount,
  cartSubtotal,
  createCartLine,
  removeCartLine,
  submitOrder,
  updateCartQuantity,
} from '../../src/lib/orders.js'
import { PRODUCT_SELECT, fetchAvailableProducts } from '../../src/lib/products.js'

function createProductQuery(result) {
  const query = {}
  query.select = vi.fn(() => query)
  query.eq = vi.fn(() => query)
  query.order = vi.fn().mockResolvedValue(result)
  return query
}

const sampleProduct = normalizeProduct({
  id: 'product-1',
  title: 'Arc Track Jacket',
  description: 'Technical shell',
  price: '4200',
  image_url: 'https://example.supabase.co/photo.jpg',
  condition: 'Excellent',
  sizes: ['M', 'L'],
  categories: { name: 'Streetwear', slug: 'streetwear' },
})

describe('product query alignment', () => {
  it('uses the required in-stock ordered query and normalizes rows', async () => {
    const query = createProductQuery({
      data: [{ ...sampleProduct, sizes: ['M', 'L'] }],
      error: null,
    })
    const client = { from: vi.fn(() => query) }

    const products = await fetchAvailableProducts(client)

    expect(PRODUCT_SELECT).toBe('*, categories(name, slug)')
    expect(client.from).toHaveBeenCalledWith('products')
    expect(query.select).toHaveBeenCalledWith('*, categories(name, slug)')
    expect(query.eq).toHaveBeenCalledWith('in_stock', true)
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(products[0].sizes).toEqual(['M', 'L'])
    expect(products[0].category.slug).toBe('streetwear')
  })

  it('surfaces Supabase errors', async () => {
    const query = createProductQuery({
      data: null,
      error: { message: 'permission denied' },
    })
    const client = { from: vi.fn(() => query) }

    await expect(fetchAvailableProducts(client)).rejects.toThrow(
      'permission denied',
    )
  })
})

describe('cart and order payload', () => {
  it('coalesces matching product/size lines', () => {
    const first = addCartLine([], createCartLine(sampleProduct, 'L'))
    const second = addCartLine(first, createCartLine(sampleProduct, 'L'))
    const withMedium = addCartLine(second, createCartLine(sampleProduct, 'M'))

    expect(withMedium).toHaveLength(2)
    expect(withMedium[0].quantity).toBe(2)
    expect(cartItemCount(withMedium)).toBe(3)
    expect(cartSubtotal(withMedium)).toBe(12600)
    expect(updateCartQuantity(withMedium, withMedium[1].id, -1)).toHaveLength(1)
    expect(removeCartLine(withMedium, withMedium[0].id)).toHaveLength(1)
  })

  it('builds a payload that matches the orders table', () => {
    const cart = addCartLine([], createCartLine(sampleProduct, 'L'))

    const payload = buildOrderPayload({
      cart,
      customer: {
        customer_name: ' Amina Njeri ',
        customer_phone: ' +254712345678 ',
        delivery_area: ' Westlands ',
      },
    })

    expect(payload).toMatchObject({
      customer_name: 'Amina Njeri',
      customer_phone: '+254712345678',
      delivery_area: 'Westlands',
      total_price: 4200,
      subtotal: 4200,
      item_count: 1,
      zone_fee: 0,
      status: 'pending',
      source: 'product',
    })
    expect(payload.items[0]).toMatchObject({
      product_id: 'product-1',
      selected_size: 'L',
      quantity: 1,
      price: 4200,
    })
  })

  it('rejects incomplete delivery details', () => {
    const cart = addCartLine([], createCartLine(sampleProduct, 'L'))

    expect(() => buildOrderPayload({ cart, customer: {} })).toThrow(
      /complete your name, phone number, and delivery area/,
    )
  })

  it('inserts into orders without selecting the inserted row', async () => {
    const insert = vi.fn().mockResolvedValue({ data: null, error: null })
    const client = { from: vi.fn(() => ({ insert })) }
    const orderPayload = { customer_phone: '+254712345678' }

    await expect(submitOrder(orderPayload, client)).resolves.toEqual({ ok: true })

    expect(client.from).toHaveBeenCalledWith('orders')
    expect(insert).toHaveBeenCalledWith(orderPayload)
    expect(client.from.mock.results[0].value).not.toHaveProperty('select')

    const source = readFileSync(
      join(process.cwd(), 'src/lib/orders.js'),
      'utf8',
    )
    expect(source).toMatch(/\.from\('orders'\)\.insert\(orderPayload\)/)
    expect(source).not.toMatch(/\.from\('orders'\)[\s\S]*\.select\(/)
  })

  it('surfaces order insert errors', async () => {
    const insert = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'insert blocked' },
    })
    const client = { from: vi.fn(() => ({ insert })) }

    await expect(submitOrder({ items: [] }, client)).rejects.toThrow(
      'insert blocked',
    )
  })
})

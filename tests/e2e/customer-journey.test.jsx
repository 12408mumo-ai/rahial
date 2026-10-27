import { createServer } from 'node:http'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const ANON_KEY = 'e2e-anon-key'

const PRODUCTS = [
  {
    id: 'jacket-1',
    title: 'Arc Track Jacket',
    price: '4200',
    image_url:
      'https://vagnxflwjldokhqvyrqg.supabase.co/storage/v1/object/public/product-images/jacket.jpg',
    category_id: null,
    in_stock: true,
    condition: 'Excellent',
    sizes: ['M', 'L'],
    created_at: '2026-10-27T08:00:00.000Z',
    categories: { name: 'Streetwear', slug: 'streetwear' },
  },
  {
    id: 'runner-1',
    title: 'Velocity Runner',
    price: '6800',
    image_url:
      'https://vagnxflwjldokhqvyrqg.supabase.co/storage/v1/object/public/product-images/runner.jpg',
    category_id: null,
    in_stock: true,
    condition: 'Like New',
    sizes: ['40', '41', '42'],
    created_at: '2026-10-26T08:00:00.000Z',
    categories: { name: 'Sneakers', slug: 'sneakers' },
  },
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

function readRequestBody(request) {
  return new Promise((resolve) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      if (!body) {
        resolve(null)
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch {
        resolve(body)
      }
    })
  })
}

let server
let baseUrl
let supabaseModule
let App
const requests = []

beforeAll(async () => {
  server = createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders)
      response.end()
      return
    }

    const url = new URL(request.url, baseUrl)
    const body =
      request.method === 'POST' ? await readRequestBody(request) : null
    requests.push({
      method: request.method,
      url,
      headers: { ...request.headers },
      body,
    })

    if (request.method === 'GET' && url.pathname === '/rest/v1/products') {
      sendJson(response, 200, PRODUCTS)
      return
    }

    if (request.method === 'POST' && url.pathname === '/rest/v1/orders') {
      sendJson(response, 201, [])
      return
    }

    sendJson(response, 404, { message: 'Not found' })
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`

  vi.stubEnv('VITE_SUPABASE_URL', baseUrl)
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', ANON_KEY)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

  // Importing App after the env stub makes the real Supabase client target
  // this file's local API server on its first request.
  const appModule = await import('../../src/App.jsx')
  App = appModule.default
  render(<App />)
})

afterAll(async () => {
  supabaseModule = await import('../../src/lib/supabase.js')
  supabaseModule.resetSupabaseClient()
  server?.closeAllConnections?.()
  await new Promise((resolve) => {
    if (!server) {
      resolve()
      return
    }
    server.close(resolve)
  })
})

describe('CREE WRLD customer journey', () => {
  it('loads, filters, carts, and submits an insert-only anonymous order', async () => {
    const user = userEvent.setup()

    expect(await screen.findByText('Arc Track Jacket')).toBeInTheDocument()
    expect(screen.getByText('Velocity Runner')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sneakers' }))
    expect(screen.queryByText('Arc Track Jacket')).not.toBeInTheDocument()
    expect(screen.getByText('Velocity Runner')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All' }))
    const jacketCard = await screen.findByTestId('product-jacket-1')

    expect(within(jacketCard).getByText('Excellent')).toBeInTheDocument()
    expect(within(jacketCard).getByText('M / L')).toBeInTheDocument()
    await user.click(
      within(jacketCard).getByRole('button', {
        name: 'Select size L for Arc Track Jacket',
      }),
    )
    await user.click(
      within(jacketCard).getByRole('button', { name: 'Add to cart' }),
    )

    const cartButton = screen.getByRole('button', { name: 'Open cart, 1 item' })
    await user.click(cartButton)

    expect(screen.getByRole('dialog', { name: 'Your cart' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Full name'), 'Amina Njeri')
    await user.type(screen.getByLabelText('Phone'), '+254 712 345 678')
    await user.type(screen.getByLabelText('Delivery area'), 'Westlands')
    await user.click(screen.getByRole('button', { name: 'Place order' }))

    expect(await screen.findByText('Order received.')).toBeInTheDocument()

    await waitFor(() => {
      expect(
        requests.some(
          (entry) =>
            entry.method === 'POST' && entry.url.pathname === '/rest/v1/orders',
        ),
      ).toBe(true)
    })

    const productRequest = requests.find(
      (entry) =>
        entry.method === 'GET' && entry.url.pathname === '/rest/v1/products',
    )
    const orderRequest = requests.find(
      (entry) =>
        entry.method === 'POST' && entry.url.pathname === '/rest/v1/orders',
    )

    expect(productRequest).toBeDefined()
    expect(
      productRequest.url.searchParams.get('select').replace(/\s/g, ''),
    ).toBe('*,categories(name,slug)')
    expect(productRequest.url.searchParams.get('in_stock')).toBe('eq.true')
    expect(productRequest.url.searchParams.get('order')).toBe('created_at.desc')
    expect(productRequest.headers.apikey).toBe(ANON_KEY)
    expect(productRequest.headers.authorization).toBe(`Bearer ${ANON_KEY}`)

    expect(orderRequest.url.searchParams.has('select')).toBe(false)
    expect(orderRequest.headers.apikey).toBe(ANON_KEY)
    expect(orderRequest.headers.authorization).toBe(`Bearer ${ANON_KEY}`)
    expect(String(orderRequest.headers.prefer || '')).not.toContain(
      'return=representation',
    )
    expect(orderRequest.body).toMatchObject({
      customer_name: 'Amina Njeri',
      customer_phone: '+254 712 345 678',
      delivery_area: 'Westlands',
      total_price: 4200,
      item_count: 1,
      status: 'pending',
    })
    expect(orderRequest.body.items).toHaveLength(1)
    expect(orderRequest.body.items[0]).toMatchObject({
      product_id: 'jacket-1',
      selected_size: 'L',
      quantity: 1,
      price: 4200,
    })
  })
})

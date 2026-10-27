import { normalizeSizes } from './catalog.js'
import supabase from './supabase.js'

export function createCartLine(product, selectedSize) {
  const sizes = normalizeSizes(product.sizes)
  const size = String(selectedSize || sizes[0] || 'One size').trim()
  const price = Number(product.price) || 0

  return {
    id: `${product.id}::${size}`,
    product_id: product.id,
    title: product.title,
    image_url: product.image_url,
    selected_size: size || 'One size',
    price,
    quantity: 1,
  }
}

export function addCartLine(cart, line) {
  const existing = cart.find((item) => item.id === line.id)

  if (!existing) return [...cart, line]

  return cart.map((item) =>
    item.id === line.id ? { ...item, quantity: item.quantity + 1 } : item,
  )
}

export function updateCartQuantity(cart, lineId, delta) {
  return cart
    .map((item) =>
      item.id === lineId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item,
    )
    .filter((item) => item.quantity > 0)
}

export function removeCartLine(cart, lineId) {
  return cart.filter((item) => item.id !== lineId)
}

export function cartItemCount(cart) {
  return cart.reduce((count, item) => count + item.quantity, 0)
}

export function cartSubtotal(cart) {
  return cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * item.quantity,
    0,
  )
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function buildOrderPayload({ cart, customer }) {
  const items = cart.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    title: item.title,
    image_url: item.image_url,
    selected_size: item.selected_size,
    quantity: item.quantity,
    price: item.price,
    price_kes: item.price,
  }))

  if (items.length === 0) {
    throw new Error('Your cart is empty.')
  }

  const customerName = cleanText(customer?.customer_name)
  const customerPhone = cleanText(customer?.customer_phone)
  const deliveryArea = cleanText(customer?.delivery_area)

  if (!customerName || !customerPhone || !deliveryArea) {
    throw new Error('Please complete your name, phone number, and delivery area.')
  }

  const subtotal = cartSubtotal(cart)
  const zoneFee = Math.max(0, Number(customer?.zone_fee) || 0)
  const totalPrice = subtotal + zoneFee

  return {
    customer_name: customerName,
    customer_phone: customerPhone,
    delivery_area: deliveryArea,
    items,
    total_price: totalPrice,
    subtotal,
    item_count: cartItemCount(cart),
    zone: cleanText(customer?.zone),
    zone_label: cleanText(customer?.zone_label),
    zone_fee: zoneFee,
    status: 'pending',
    source: 'product',
  }
}

export async function submitOrder(orderPayload, client = supabase) {
  const { error } = await client.from('orders').insert(orderPayload)

  if (error) {
    throw new Error(error.message || 'Unable to place your order right now.')
  }

  return { ok: true }
}

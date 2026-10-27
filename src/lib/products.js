import { normalizeProduct } from './catalog.js'
import supabase from './supabase.js'

export const PRODUCT_SELECT = '*, categories(name, slug)'

export async function fetchAvailableProducts(client = supabase) {
  const { data, error } = await client
    .from('products')
    .select('*, categories(name, slug)')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Unable to load the collection.')
  }

  return Array.isArray(data) ? data.map(normalizeProduct) : []
}

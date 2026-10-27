import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CategoryFilter from '../../src/components/CategoryFilter.jsx'
import ProductCard from '../../src/components/ProductCard.jsx'
import { normalizeProduct } from '../../src/lib/catalog.js'

const product = normalizeProduct({
  id: 'product-1',
  title: 'Arc Track Jacket',
  price: 4200,
  condition: 'Excellent',
  sizes: ['M', 'L'],
  image_url: 'https://example.supabase.co/photo.jpg',
  categories: { name: 'Streetwear', slug: 'streetwear' },
})

describe('CategoryFilter', () => {
  it('exposes all required categories and reports the active one', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <CategoryFilter
        activeCategory="sneakers"
        onChange={onChange}
        resultCount={3}
      />,
    )

    expect(screen.getByRole('button', { name: 'Sneakers' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('03 pieces')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Y2K' }))
    expect(onChange).toHaveBeenCalledWith('y2k')
  })
})

describe('ProductCard', () => {
  it('shows title, price, condition, sizes, and passes the selected size', async () => {
    const user = userEvent.setup()
    const onAddToCart = vi.fn()

    render(<ProductCard product={product} onAddToCart={onAddToCart} />)

    const card = screen.getByTestId('product-product-1')
    expect(within(card).getByText('Arc Track Jacket')).toBeInTheDocument()
    expect(within(card).getByText('KSh 4,200')).toBeInTheDocument()
    expect(within(card).getByText('Excellent')).toBeInTheDocument()
    expect(within(card).getByText('M / L')).toBeInTheDocument()
    expect(within(card).getByRole('img', { name: 'Arc Track Jacket' })).toHaveAttribute(
      'src',
      'https://example.supabase.co/photo.jpg',
    )

    await user.click(
      within(card).getByRole('button', {
        name: 'Select size L for Arc Track Jacket',
      }),
    )
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }))

    expect(onAddToCart).toHaveBeenCalledWith(product, 'L')
  })
})

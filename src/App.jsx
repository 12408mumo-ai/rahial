import { useCallback, useEffect, useMemo, useState } from 'react'
import CartModal from './components/CartModal.jsx'
import CategoryFilter from './components/CategoryFilter.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import ProductGrid from './components/ProductGrid.jsx'
import { ALL_CATEGORY, filterProducts } from './lib/catalog.js'
import {
  addCartLine,
  cartItemCount,
  createCartLine,
  removeCartLine,
  submitOrder,
  updateCartQuantity,
} from './lib/orders.js'
import { fetchAvailableProducts } from './lib/products.js'

export default function App() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY)
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const loadProducts = useCallback(async () => {
    setStatus('loading')
    setError('')

    try {
      const availableProducts = await fetchAvailableProducts()
      setProducts(availableProducts)
      setStatus('ready')
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the collection.',
      )
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const visibleProducts = useMemo(
    () => filterProducts(products, activeCategory),
    [activeCategory, products],
  )

  const cartCount = cartItemCount(cart)

  const handleOpenCart = useCallback(() => setIsCartOpen(true), [])
  const handleCloseCart = useCallback(() => setIsCartOpen(false), [])

  const handleAddToCart = useCallback((product, selectedSize) => {
    const line = createCartLine(product, selectedSize)
    setCart((currentCart) => addCartLine(currentCart, line))
  }, [])

  const handleUpdateQuantity = useCallback((lineId, delta) => {
    setCart((currentCart) => updateCartQuantity(currentCart, lineId, delta))
  }, [])

  const handleRemove = useCallback((lineId) => {
    setCart((currentCart) => removeCartLine(currentCart, lineId))
  }, [])

  const handleCheckout = useCallback(
    async (orderPayload) => submitOrder(orderPayload),
    [],
  )

  const handleOrderPlaced = useCallback(() => setCart([]), [])

  return (
    <>
      <Header cartCount={cartCount} onCartOpen={handleOpenCart} />

      <main>
        <Hero />

        <div className="marquee-strip" aria-hidden="true">
          <span>Sneakers</span>
          <span>Streetwear</span>
          <span>Old Money</span>
          <span>Y2K</span>
          <span>Limited pieces</span>
        </div>

        <section className="catalog" id="shop" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Current collection</p>
              <h2 id="catalog-title">Shop the edit.</h2>
            </div>
            <p className="section-copy">
              Available pieces only. Select a size, build your cart, and confirm
              delivery details at checkout.
            </p>
          </div>

          <CategoryFilter
            activeCategory={activeCategory}
            onChange={setActiveCategory}
            resultCount={visibleProducts.length}
          />

          <ProductGrid
            products={visibleProducts}
            status={status}
            error={error}
            onRetry={loadProducts}
            onAddToCart={handleAddToCart}
          />
        </section>
      </main>

      <Footer />

      <CartModal
        isOpen={isCartOpen}
        cart={cart}
        onClose={handleCloseCart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
        onCheckout={handleCheckout}
        onOrderPlaced={handleOrderPlaced}
      />
    </>
  )
}

import ProductCard from './ProductCard.jsx'

export default function ProductGrid({
  products,
  status,
  error,
  onRetry,
  onAddToCart,
}) {
  if (status === 'loading') {
    return (
      <div className="collection-state" role="status">
        <p className="eyebrow">Loading</p>
        <h3>Pulling the current collection.</h3>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="collection-state" role="alert">
        <p className="eyebrow">Connection issue</p>
        <h3>{error || 'We could not load the collection.'}</h3>
        <button className="outline-button" type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="collection-state">
        <p className="eyebrow">Nothing here yet</p>
        <h3>No products found in this category.</h3>
        <p>Check another edit — new pieces are added in the Supabase Dashboard.</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}

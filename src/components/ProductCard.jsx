import { useState } from 'react'
import {
  PLACEHOLDER_IMAGE,
  formatPrice,
  normalizeSizes,
} from '../lib/catalog.js'

export default function ProductCard({ product, onAddToCart }) {
  const sizes = normalizeSizes(product.sizes)
  const displaySizes = sizes.length > 0 ? sizes : ['One size']
  const [selectedSize, setSelectedSize] = useState(displaySizes[0])
  const categoryName = product.category?.name || 'Uncategorized'

  function handleImageError(event) {
    if (event.currentTarget.dataset.fallbackApplied) return
    event.currentTarget.dataset.fallbackApplied = 'true'
    event.currentTarget.src = PLACEHOLDER_IMAGE
  }

  return (
    <article
      className="product-card"
      data-testid={`product-${product.id}`}
      aria-labelledby={`product-title-${product.id}`}
    >
      <div className="product-image-frame">
        <img
          className="product-image"
          src={product.image_url || PLACEHOLDER_IMAGE}
          alt={product.title}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
        <span className="product-category">{categoryName}</span>
      </div>

      <div className="product-details">
        <div className="product-heading">
          <h3 id={`product-title-${product.id}`}>{product.title}</h3>
          <p className="product-price">{formatPrice(product.price)}</p>
        </div>

        <dl className="product-attributes">
          <div>
            <dt>Condition</dt>
            <dd>{product.condition}</dd>
          </div>
          <div>
            <dt>Sizes</dt>
            <dd>{displaySizes.join(' / ')}</dd>
          </div>
        </dl>

        <div
          className="size-list"
          role="group"
          aria-label={`Choose a size for ${product.title}`}
        >
          {displaySizes.map((size) => (
            <button
              className={`size-button${selectedSize === size ? ' is-active' : ''}`}
              key={size}
              type="button"
              aria-pressed={selectedSize === size}
              aria-label={`Select size ${size} for ${product.title}`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          className="add-button"
          type="button"
          onClick={() => onAddToCart(product, selectedSize)}
        >
          Add to cart
        </button>
      </div>
    </article>
  )
}

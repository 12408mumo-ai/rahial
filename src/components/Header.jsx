export default function Header({ cartCount, onCartOpen }) {
  const itemLabel = cartCount === 1 ? 'item' : 'items'

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="CREE WRLD home">
          CREE <span>WRLD</span>
        </a>

        <nav className="header-nav" aria-label="Primary navigation">
          <a href="#shop">Shop</a>
          <a href="#delivery">Delivery</a>
          <a href="#contact">Contact</a>
        </nav>

        <button
          className="cart-trigger"
          type="button"
          onClick={onCartOpen}
          aria-label={`Open cart, ${cartCount} ${itemLabel}`}
        >
          <span>Cart</span>
          <span className="cart-count" aria-hidden="true">
            {String(cartCount).padStart(2, '0')}
          </span>
        </button>
      </div>
    </header>
  )
}

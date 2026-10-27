import { useEffect, useRef, useState } from 'react'
import { PLACEHOLDER_IMAGE, formatPrice } from '../lib/catalog.js'
import {
  buildOrderPayload,
  cartItemCount,
  cartSubtotal,
} from '../lib/orders.js'

const EMPTY_CUSTOMER = {
  customer_name: '',
  customer_phone: '',
  delivery_area: '',
}

export default function CartModal({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onOrderPlaced,
}) {
  const [customer, setCustomer] = useState({ ...EMPTY_CUSTOMER })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const closeButtonRef = useRef(null)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) return
    setCustomer({ ...EMPTY_CUSTOMER })
    setStatus('idle')
    setError('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape' && status !== 'submitting') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    const focusTarget =
      status === 'success' || cart.length === 0
        ? closeButtonRef.current
        : nameInputRef.current
    focusTarget?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [cart.length, isOpen, onClose, status])

  if (!isOpen) return null

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget && status !== 'submitting') {
      onClose()
    }
  }

  function handleCustomerChange(event) {
    const { name, value } = event.target
    setCustomer((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const orderPayload = buildOrderPayload({ cart, customer })
      setStatus('submitting')
      await onCheckout(orderPayload)
      setStatus('success')
      onOrderPlaced()
    } catch (submitError) {
      setStatus('idle')
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to place your order right now.',
      )
    }
  }

  const itemCount = cartItemCount(cart)
  const subtotal = cartSubtotal(cart)

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropMouseDown}>
      <section
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="cart-header">
          <div>
            <p className="eyebrow">Checkout</p>
            <h2 id="cart-title">Your cart</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            ref={closeButtonRef}
            disabled={status === 'submitting'}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {status === 'success' ? (
          <div className="cart-success" role="status">
            <p className="success-mark" aria-hidden="true">
              ✓
            </p>
            <h3>Order received.</h3>
            <p>
              We will contact you on {customer.customer_phone} to confirm
              delivery to {customer.delivery_area}.
            </p>
            <button className="solid-button" type="button" onClick={onClose}>
              Continue shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="cart-empty">
            <p className="eyebrow">Nothing selected</p>
            <h3>Your cart is empty.</h3>
            <p>Add a piece from the collection to start an order.</p>
            <button className="outline-button" type="button" onClick={onClose}>
              Browse collection
            </button>
          </div>
        ) : (
          <>
            <div className="cart-lines" aria-live="polite">
              {cart.map((item) => (
                <article className="cart-line" key={item.id}>
                  <img
                    className="cart-line-image"
                    src={item.image_url || PLACEHOLDER_IMAGE}
                    alt=""
                  />
                  <div className="cart-line-body">
                    <div className="cart-line-heading">
                      <h3>{item.title}</h3>
                      <button
                        className="remove-button"
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="cart-line-meta">
                      Size {item.selected_size} · {formatPrice(item.price)}
                    </p>
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        aria-label={`Decrease quantity of ${item.title}`}
                      >
                        −
                      </button>
                      <span aria-label={`Quantity ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-total">
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <form className="checkout-form" onSubmit={handleSubmit}>
              <p className="form-title">Delivery details</p>

              <div className="form-field">
                <label htmlFor="customer-name">Full name</label>
                <input
                  id="customer-name"
                  name="customer_name"
                  type="text"
                  autoComplete="name"
                  required
                  value={customer.customer_name}
                  onChange={handleCustomerChange}
                  ref={nameInputRef}
                />
              </div>

              <div className="form-field">
                <label htmlFor="customer-phone">Phone</label>
                <input
                  id="customer-phone"
                  name="customer_phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+254 7XX XXX XXX"
                  required
                  value={customer.customer_phone}
                  onChange={handleCustomerChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="delivery-area">Delivery area</label>
                <input
                  id="delivery-area"
                  name="delivery_area"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Westlands, Nairobi"
                  required
                  value={customer.delivery_area}
                  onChange={handleCustomerChange}
                />
              </div>

              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                className="solid-button checkout-submit"
                type="submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Placing order…' : 'Place order'}
              </button>
              <p className="form-note">
                No online payment is taken here. We confirm availability and
                delivery by phone.
              </p>
            </form>
          </>
        )}
      </section>
    </div>
  )
}

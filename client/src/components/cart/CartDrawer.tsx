import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext.tsx'
import { useCart } from '@/contexts/CartContext.tsx'
import { formatKrw } from '@/lib/productVariantUtils.ts'

const FREE_SHIPPING_THRESHOLD = 60_000

function CartSmiley() {
  return (
    <svg className="cart-drawer-smiley" viewBox="0 0 120 120" fill="none" aria-hidden>
      <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="2" />
      <circle cx="44" cy="52" r="4" fill="currentColor" />
      <circle cx="76" cy="52" r="4" fill="currentColor" />
      <path
        d="M42 72c8 10 28 10 36 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const hasFreeShipping = remaining === 0

  return (
    <div className="cart-drawer-shipping">
      <p className="cart-drawer-shipping-text">
        {hasFreeShipping
          ? 'Congrats! You get free standard shipping.'
          : `${formatKrw(remaining)} away from free standard shipping`}
      </p>
      <div className="cart-drawer-progress" aria-hidden>
        <span className="cart-drawer-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const {
    cart,
    isOpen,
    isLoading,
    bagCount,
    actionError,
    closeDrawer,
    openDrawer,
    setLineQuantity,
    removeLine,
  } = useCart()

  const isEmpty = cart.items.length === 0
  const availableItems = cart.items.filter((item) => item.available)
  const subtotal = cart.totals.subtotal

  // 체크아웃 페이지로 이동 (비로그인 시 로그인 후 복귀)
  function handleCheckout() {
    closeDrawer()
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    navigate('/checkout')
  }

  // 열림 시 배경 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeDrawer])

  return (
  <>
      <div
        className={`cart-drawer-backdrop${isOpen ? ' is-open' : ''}`}
        aria-hidden={!isOpen}
        onClick={closeDrawer}
      />

      <aside
        className={`cart-drawer${isOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        aria-hidden={!isOpen}
      >
        <header className="cart-drawer-header">
          <Link to="/" className="cart-drawer-brand" onClick={closeDrawer}>
            Lumière.
          </Link>
          <div className="cart-drawer-header-right">
            <button type="button" className="cart-drawer-bag-label" onClick={openDrawer}>
              BAG ({bagCount})
            </button>
            <button
              type="button"
              className="cart-drawer-close"
              aria-label="장바구니 닫기"
              onClick={closeDrawer}
            >
              ×
            </button>
          </div>
        </header>

        {actionError ? (
          <p className="cart-drawer-error" role="alert">
            {actionError}
          </p>
        ) : null}

        {isEmpty ? (
          <div className="cart-drawer-empty">
            <ShippingProgress subtotal={0} />
            <div className="cart-drawer-empty-body">
              <p className="cart-drawer-empty-title">
                Your bag is empty,
                <br />
                but you still look good.
              </p>
              <CartSmiley />
            </div>
            <div className="cart-drawer-footer">
              <Link to="/#fragrance" className="cart-drawer-shop-all" onClick={closeDrawer}>
                Shop all
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-drawer-filled">
            <div className="cart-drawer-scroll">
              <p className="cart-drawer-section-label">SHOPPING BAG</p>
              <ShippingProgress subtotal={subtotal} />

              <ul className="cart-drawer-items">
                {cart.items.map((item) => (
                  <li key={item.id} className="cart-drawer-item">
                    <div className="cart-drawer-item-thumb-wrap">
                      {item.bottleImage ? (
                        <img
                          src={item.bottleImage}
                          alt=""
                          className="cart-drawer-item-thumb"
                        />
                      ) : (
                        <span className="cart-drawer-item-thumb cart-drawer-item-thumb-empty" />
                      )}
                    </div>
                    <div className="cart-drawer-item-body">
                      <div className="cart-drawer-item-top">
                        <div>
                          <p className="cart-drawer-item-name">{item.name ?? item.productSlug}</p>
                          <p className="cart-drawer-item-meta">{item.label ?? item.sku}</p>
                        </div>
                        <p className="cart-drawer-item-price">
                          {formatKrw(item.lineSubtotal || item.price * item.quantity)}
                        </p>
                      </div>

                      {!item.available && item.unavailableReason ? (
                        <p className="cart-drawer-item-warn">{item.unavailableReason}</p>
                      ) : null}

                      <div className="cart-drawer-item-actions">
                        <div className="cart-drawer-qty" role="group" aria-label="수량">
                          <button
                            type="button"
                            className="cart-drawer-qty-btn"
                            disabled={isLoading || item.quantity <= 1}
                            onClick={() => void setLineQuantity(item.id, item.quantity - 1)}
                            aria-label="수량 줄이기"
                          >
                            −
                          </button>
                          <span className="cart-drawer-qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-drawer-qty-btn"
                            disabled={
                              isLoading ||
                              !item.available ||
                              item.quantity >= item.stock
                            }
                            onClick={() => void setLineQuantity(item.id, item.quantity + 1)}
                            aria-label="수량 늘리기"
                          >
                            +
                          </button>
                        </div>
                        <div className="cart-drawer-item-links">
                          <Link
                            to={`/products/${item.productSlug}`}
                            className="cart-drawer-item-link"
                            onClick={closeDrawer}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="cart-drawer-item-link"
                            disabled={isLoading}
                            onClick={() => void removeLine(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-drawer-summary">
                <div className="cart-drawer-summary-row">
                  <span>Subtotal</span>
                  <span>{formatKrw(subtotal)}</span>
                </div>
                <div className="cart-drawer-summary-row cart-drawer-summary-muted">
                  <span>Tax calculated in checkout</span>
                  <span aria-hidden>−</span>
                </div>
                <div className="cart-drawer-summary-row cart-drawer-summary-muted">
                  <span>
                    Shipping
                    {subtotal >= FREE_SHIPPING_THRESHOLD
                      ? ' (Free standard shipping)'
                      : ''}
                  </span>
                  <span aria-hidden>−</span>
                </div>
              </div>
            </div>

            <footer className="cart-drawer-footer cart-drawer-footer-checkout">
              <div className="cart-drawer-total-row">
                <span>Estimated total</span>
                <strong>{formatKrw(subtotal)}</strong>
              </div>
              <button
                type="button"
                className="cart-drawer-checkout"
                disabled={isLoading || availableItems.length === 0}
                onClick={handleCheckout}
              >
                Checkout
              </button>
              <p className="cart-drawer-legal">
                By clicking Checkout, you agree to our Terms of Use and Privacy Policy.
              </p>
            </footer>
          </div>
        )}
      </aside>
    </>
  )
}

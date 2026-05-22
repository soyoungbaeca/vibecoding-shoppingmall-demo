import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext.tsx'
import type { FragranceProduct } from '@/data/fragrances.ts'
import { formatKrw, getDefaultVariant } from '@/lib/productVariantUtils.ts'

type Props = {
  product: FragranceProduct
}

export default function FragranceCard({ product }: Props) {
  const { addToBag, isLoading: cartLoading } = useCart()
  const defaultVariant = useMemo(() => getDefaultVariant(product.variants), [product.variants])
  const [selectedId, setSelectedId] = useState(defaultVariant.id)

  const active = product.variants.find((v) => v.id === selectedId) ?? defaultVariant
  const showSizePicker = product.variants.length > 1

  return (
    <article className="fragrance-card">
      <Link to={`/products/${product.id}`} className="fragrance-card-link">
        <div className="fragrance-card-media">
          {product.badge?.kind === 'tag' ? (
            <span className="fragrance-badge fragrance-badge-tag">{product.badge.label}</span>
          ) : null}
          {product.badge?.kind === 'ribbon' ? (
            <span className="fragrance-badge fragrance-badge-ribbon" aria-hidden>
              <span className="fragrance-ribbon-year">CLASS OF {product.badge.year}</span>
              <span className="fragrance-ribbon-label">{product.badge.label}</span>
            </span>
          ) : null}
          <img
            className="fragrance-img fragrance-img-bottle"
            src={active.bottleImage}
            alt={product.bottleAlt}
          />
          <img
            className="fragrance-img fragrance-img-mood"
            src={product.moodImage}
            alt={product.moodAlt}
          />
        </div>

        <div className="fragrance-card-body fragrance-card-body-link">
          <h3 className="fragrance-name">{product.name}</h3>
          <p className="fragrance-subtitle">{product.subtitle}</p>
        </div>
      </Link>

      <div className="fragrance-card-actions">
        <p className="fragrance-price">{formatKrw(active.price)}</p>

        {showSizePicker ? (
          <div className="fragrance-sizes" role="group" aria-label={`${product.name} 용량`}>
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={`fragrance-size${selectedId === variant.id ? ' is-active' : ''}`}
                aria-pressed={selectedId === variant.id}
                onClick={() => setSelectedId(variant.id)}
              >
                {variant.label}
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className="fragrance-add-btn"
          disabled={cartLoading}
          onClick={() =>
            void addToBag({
              productSlug: product.id,
              variantId: active.id,
              quantity: 1,
            })
          }
        >
          Add to bag
        </button>
      </div>
    </article>
  )
}

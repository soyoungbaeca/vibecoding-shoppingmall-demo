import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductById } from '@/api/products.ts'
import { useCart } from '@/contexts/CartContext.tsx'
import type { FragranceProduct } from '@/data/fragrances.ts'
import { formatKrw, getDefaultVariant } from '@/lib/productVariantUtils.ts'

const SCENT_NOTES = [
  { id: 'top', label: 'TOP NOTES', items: ['Pink Pepper', 'Ambrette'] },
  { id: 'heart', label: 'HEART NOTES', items: ['Iris', 'Ambrox'] },
  { id: 'base', label: 'BASE NOTES', items: ['Musk', 'Amber', 'Cedar'] },
] as const

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <span className="product-detail-stars" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="product-detail-star">
          ★
        </span>
      ))}
    </span>
  )
}

export default function ProductDetailPage() {
  const { addToBag, isLoading: cartLoading } = useCart()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<FragranceProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openNote, setOpenNote] = useState<string>('top')
  const [descExpanded, setDescExpanded] = useState(false)

  // slug로 상품 단건 조회
  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('상품을 찾을 수 없습니다.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchProductById(id)
      .then((item) => {
        if (cancelled) return
        if (!item) {
          setProduct(null)
          setError('상품을 찾을 수 없습니다.')
          return
        }
        setProduct(item)
        setSelectedId(getDefaultVariant(item.variants).id)
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null)
          setError('상품을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const activeVariant = useMemo(() => {
    if (!product) return null
    const fallback = getDefaultVariant(product.variants)
    if (!selectedId) return fallback
    return product.variants.find((v) => v.id === selectedId) ?? fallback
  }, [product, selectedId])

  const showSizePicker = (product?.variants.length ?? 0) > 1

  if (loading) {
    return (
      <main className="product-detail">
        <p className="product-detail-status">상품을 불러오는 중…</p>
      </main>
    )
  }

  if (error || !product || !activeVariant) {
    return (
      <main className="product-detail">
        <div className="product-detail-inner product-detail-inner-error">
          <p className="product-detail-status">{error ?? '상품을 찾을 수 없습니다.'}</p>
          <Link to="/#fragrance" className="product-detail-back">
            쇼핑으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="product-detail">
      <div className="product-detail-inner">
        {/* 1섹션 — 정보 · 대표(병) · 무드 */}
        <section className="product-detail-hero" aria-labelledby="product-detail-title">
          <div className="product-detail-info">
            <h1 id="product-detail-title" className="product-detail-title">
              {product.name}
            </h1>
            <p className="product-detail-subtitle">{product.subtitle}</p>

            <div className="product-detail-rating">
              <StarRating />
              <span className="product-detail-rating-text">4.8 (120)</span>
            </div>

            {product.badge?.kind === 'tag' ? (
              <span className="product-detail-badge">{product.badge.label}</span>
            ) : null}

            {showSizePicker ? (
              <div className="product-detail-sizes" role="group" aria-label="용량 선택">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={`product-detail-size${selectedId === variant.id ? ' is-active' : ''}`}
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
              className="product-detail-add-btn"
              disabled={cartLoading}
              onClick={() =>
                void addToBag({
                  productSlug: product.id,
                  variantId: activeVariant.id,
                  quantity: 1,
                })
              }
            >
              Add to bag — {formatKrw(activeVariant.price)}
            </button>

            <div className="product-detail-desc">
              <p className={descExpanded ? undefined : 'is-clamped'}>
                {product.name}은 피부에 스며드는 퍼스널 향으로, 사람마다 조금씩 다르게
                느껴집니다. 부드러운 머스크와 앰버의 베이스 위에 은은한 플로럴과 스파이스가
                어우러져 일상 속에서도 편안하게 착용할 수 있는 시그니처 노트를 완성합니다.
              </p>
              <button
                type="button"
                className="product-detail-desc-toggle"
                onClick={() => setDescExpanded((v) => !v)}
              >
                {descExpanded ? 'Show less' : 'Show more'}
              </button>
            </div>

            <p className="product-detail-meta">
              {showSizePicker
                ? product.variants.map((v) => v.label).join(', ')
                : activeVariant.label}{' '}
              · Cruelty-free, vegan
            </p>
          </div>

          <div className="product-detail-bottle">
            <img
              src={activeVariant.bottleImage}
              alt={product.bottleAlt}
              className="product-detail-bottle-img"
            />
          </div>

          <div className="product-detail-mood product-detail-mood-hero">
            <img src={product.moodImage} alt={product.moodAlt} className="product-detail-mood-img" />
          </div>
        </section>

        {/* 2섹션 — 무드 목업 · 향 노트 */}
        <section className="product-detail-scent" aria-labelledby="product-detail-scent-title">
          <div className="product-detail-mockup product-detail-mockup-square">
            <img
              src={product.moodImage}
              alt={`${product.name} 무드 목업`}
              className="product-detail-mood-img"
            />
          </div>

          <div className="product-detail-scent-copy">
            <h2 id="product-detail-scent-title" className="product-detail-scent-title">
              Mainly made up of base notes, {product.name} lets more of you shine through.
            </h2>

            <div className="product-detail-notes">
              {SCENT_NOTES.map((note) => {
                const isOpen = openNote === note.id
                return (
                  <div key={note.id} className="product-detail-note">
                    <button
                      type="button"
                      className="product-detail-note-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenNote(isOpen ? '' : note.id)}
                    >
                      <span>{note.label}</span>
                      <span className="product-detail-note-icon" aria-hidden>
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen ? (
                      <ul className="product-detail-note-list">
                        {note.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <a href="#ingredients" className="product-detail-ingredients-link">
              Full ingredients list
            </a>
          </div>
        </section>

        {/* 3섹션 — 라이프스타일 목업 · 리뷰 */}
        <section className="product-detail-lifestyle" aria-labelledby="product-detail-review-title">
          <div className="product-detail-mockup product-detail-mockup-wide">
            <img
              src={product.moodImage}
              alt={`${product.name} 라이프스타일 목업`}
              className="product-detail-mood-img"
            />
          </div>

          <blockquote className="product-detail-review">
            <h2 id="product-detail-review-title" className="visually-hidden">
              고객 리뷰
            </h2>
            <StarRating />
            <p>
              &ldquo;처음 뿌린 날, 동료가 어떤 향을 쓰는지 물어봤어요. 은은한데 오래
              남아서 {product.name}이 제 시그니처가 됐습니다.&rdquo;
            </p>
            <footer>— Lumière 고객</footer>
          </blockquote>
        </section>
      </div>
    </main>
  )
}

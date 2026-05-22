import { useEffect, useState } from 'react'
import FragranceCard from '@/components/FragranceCard.tsx'
import { fetchHomeProducts } from '@/api/products.ts'
import type { FragranceProduct } from '@/data/fragrances.ts'

export default function FragranceShopSection() {
  const [products, setProducts] = useState<FragranceProduct[]>([])
  const [loading, setLoading] = useState(true)

  // 홈 그리드 — 어드민에서 선택한 게시 상품 (최대 4)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchHomeProducts()
      .then((items) => {
        if (!cancelled) setProducts(items)
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="home-shop" id="fragrance">
      <div className="home-shop-header">
        <h2 className="home-shop-title">SIGNATURES</h2>
        <a className="home-shop-link" href="#fragrance">
          Shop all
        </a>
      </div>

      {loading ? (
        <p className="home-shop-loading">상품을 불러오는 중…</p>
      ) : products.length === 0 ? (
        <p className="home-shop-empty">표시할 상품이 없습니다.</p>
      ) : (
        <div className="home-product-grid">
          {products.map((product) => (
            <FragranceCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

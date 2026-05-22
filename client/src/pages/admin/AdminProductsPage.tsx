import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  HOME_FEATURED_MAX,
  ProductApiError,
  setProductShowOnHome,
  updateProduct,
  type AdminProductListStats,
} from '@/api/adminProducts.ts'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog.tsx'
import AdminImageField from '@/components/admin/AdminImageField.tsx'
import AdminToast from '@/components/admin/AdminToast.tsx'
import AdminVariantEditor from '@/components/admin/AdminVariantEditor.tsx'
import { useAuth } from '@/contexts/AuthContext.tsx'
import { useToast } from '@/hooks/useToast.ts'
import {
  createEmptyVariant,
  createVariantId,
  formatProductPriceLabel,
  getDefaultVariant,
  isSingleSkuProduct,
  normalizeVariants,
  productTotalStock,
} from '@/lib/productVariantUtils.ts'
import type { AdminProduct, AdminProductDraft, ProductStatus } from '@/types/adminProduct.ts'
import type { ProductVariant } from '@/types/productVariant.ts'

const EMPTY_SINGLE_VARIANT = createEmptyVariant({
  label: '단품',
  isDefault: true,
})

const EMPTY_DRAFT: AdminProductDraft = {
  name: '',
  subtitle: 'Eau de parfum',
  currency: 'KRW',
  variants: [{ ...EMPTY_SINGLE_VARIANT }],
  status: 'draft',
  moodImage: '',
  showOnHome: false,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function cloneVariants(variants: ProductVariant[]): ProductVariant[] {
  return variants.map((v) => ({ ...v }))
}

export default function AdminProductsPage() {
  const { isAdmin, isLoading } = useAuth()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [listTotal, setListTotal] = useState(0)
  const [stats, setStats] = useState<AdminProductListStats>({
    total: 0,
    published: 0,
    draft: 0,
    lowStock: 0,
    homeFeatured: 0,
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<'edit' | 'create' | null>(null)
  const [draft, setDraft] = useState<AdminProductDraft>(EMPTY_DRAFT)
  const [singleSku, setSingleSku] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null
  )
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { toast, showToast } = useToast()
  const [togglingHomeId, setTogglingHomeId] = useState<string | null>(null)

  // 어드민 상품 목록 로드 (페이지·필터 반영)
  const loadProducts = useCallback(
    async (pageOverride?: number) => {
      const targetPage = pageOverride ?? page
      setListLoading(true)
      setListError(null)
      try {
        const result = await fetchAdminProducts({
          page: targetPage,
          limit: ADMIN_PRODUCTS_PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
          q: search.trim() || undefined,
        })

        // 필터·삭제 후 현재 페이지가 범위 밖이면 마지막 페이지로 재조회
        if (result.total > 0 && targetPage > result.totalPages) {
          await loadProducts(result.totalPages)
          return
        }

        setProducts(result.items)
        setPage(result.page)
        setTotalPages(result.totalPages)
        setListTotal(result.total)
        setStats(result.stats)
      } catch (err) {
        const message =
          err instanceof ProductApiError ? err.message : '상품 목록을 불러오지 못했습니다.'
        setListError(message)
      } finally {
        setListLoading(false)
      }
    },
    [page, search, statusFilter]
  )

  useEffect(() => {
    if (isAdmin && !isLoading) {
      void loadProducts()
    }
  }, [isAdmin, isLoading, loadProducts])

  const homeFeaturedCount = stats.homeFeatured

  const listRangeStart =
    listTotal === 0 ? 0 : (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE + 1
  const listRangeEnd = Math.min(page * ADMIN_PRODUCTS_PAGE_SIZE, listTotal)

  const hasActiveFilter = search.trim() !== '' || statusFilter !== 'all'

  // 수정 패널 열기
  function openEdit(product: AdminProduct) {
    setSelectedId(product.id)
    setPanelMode('edit')
    setSingleSku(isSingleSkuProduct(product.variants))
    setDraft({
      name: product.name,
      subtitle: product.subtitle,
      currency: product.currency,
      variants: cloneVariants(product.variants),
      status: product.status,
      moodImage: product.moodImage,
      badgeLabel: product.badgeLabel,
      showOnHome: product.showOnHome,
    })
  }

  // 새 상품 패널 열기
  function openCreate() {
    setSelectedId(null)
    setPanelMode('create')
    setSingleSku(true)
    setDraft({
      ...EMPTY_DRAFT,
      variants: [{ ...EMPTY_SINGLE_VARIANT, id: createVariantId() }],
    })
  }

  function closePanel() {
    setPanelMode(null)
    setSelectedId(null)
  }

  // 단일 SKU ↔ 용량 옵션 전환
  function toggleSkuMode(nextSingle: boolean) {
    setSingleSku(nextSingle)
    if (nextSingle) {
      const base = draft.variants[0] ?? createEmptyVariant()
      setDraft((d) => ({
        ...d,
        variants: [
          {
            ...base,
            id: base.id || createVariantId(),
            label: '단품',
            isDefault: true,
          },
        ],
      }))
    } else {
      const base = draft.variants[0] ?? createEmptyVariant()
      setDraft((d) => ({
        ...d,
        variants: [
          { ...base, id: base.id || createVariantId(), label: '50 ml', isDefault: true },
          createEmptyVariant({ label: '100 ml' }),
          createEmptyVariant({ label: '8 ml' }),
        ],
      }))
    }
  }

  // 옵션 행 갱신
  function updateVariant(id: string, patch: Partial<ProductVariant>) {
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }))
  }

  // 기본 옵션 지정
  function setDefaultVariant(id: string) {
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v) => ({ ...v, isDefault: v.id === id })),
    }))
  }

  // 옵션 행 추가
  function addVariant() {
    setDraft((d) => ({
      ...d,
      variants: [...d.variants, createEmptyVariant()],
    }))
  }

  // 옵션 행 삭제
  function removeVariant(id: string) {
    setDraft((d) => {
      if (d.variants.length <= 1) return d
      const next = d.variants.filter((v) => v.id !== id)
      if (!next.some((v) => v.isDefault)) {
        next[0] = { ...next[0], isDefault: true }
      }
      return { ...d, variants: next }
    })
  }

  // 폼 제출 — 생성 또는 수정 (API)
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    const variants = normalizeVariants(
      singleSku
        ? draft.variants.map((v) => ({ ...v, label: '단품', isDefault: true }))
        : draft.variants
    )
    if (!draft.name.trim() || variants.length === 0) return

    const payload: AdminProductDraft = {
      ...draft,
      name: draft.name.trim(),
      subtitle: draft.subtitle.trim(),
      variants,
    }

    setSaving(true)
    try {
      if (panelMode === 'create') {
        await createProduct(payload)
        closePanel()
        showToast('등록되었습니다')
        setPage(1)
        await loadProducts(1)
      } else if (selectedId) {
        await updateProduct(selectedId, payload)
        closePanel()
        showToast('저장되었습니다')
        await loadProducts()
      }
    } catch (err) {
      const message =
        err instanceof ProductApiError ? err.message : '저장에 실패했습니다.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  // 홈 그리드 노출 토글 (게시 중만, 최대 4개)
  async function toggleShowOnHome(product: AdminProduct) {
    if (product.status !== 'published') {
      showToast('게시된 상품만 홈에 노출할 수 있습니다.')
      return
    }

    const next = !product.showOnHome
    if (next && homeFeaturedCount >= HOME_FEATURED_MAX) {
      showToast(`홈 노출은 최대 ${HOME_FEATURED_MAX}개까지 선택할 수 있습니다.`)
      return
    }

    setTogglingHomeId(product.id)
    try {
      await setProductShowOnHome(product.id, next)
      await loadProducts()
    } catch (err) {
      const message =
        err instanceof ProductApiError ? err.message : '홈 노출 설정에 실패했습니다.'
      showToast(message)
    } finally {
      setTogglingHomeId(null)
    }
  }

  // 삭제 확인 팝업 열기
  function openDeleteConfirm(product: AdminProduct) {
    setDeleteError(null)
    setDeleteTarget({ id: product.id, name: product.name })
  }

  // 삭제 확인 후 API 호출
  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProduct(deleteTarget.id)
      if (selectedId === deleteTarget.id) closePanel()
      setDeleteTarget(null)
      const nextPage =
        products.length <= 1 && page > 1 ? page - 1 : page
      if (nextPage !== page) setPage(nextPage)
      await loadProducts(nextPage)
    } catch (err) {
      const message =
        err instanceof ProductApiError ? err.message : '삭제에 실패했습니다.'
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }

  function cancelDelete() {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const singleVariant = draft.variants[0]

  if (isLoading) {
    return <p className="admin-empty">권한 확인 중…</p>
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <h1>접근 권한이 없습니다</h1>
        <p>어드민 계정으로 로그인한 뒤 다시 시도해 주세요.</p>
        <Link to="/" className="admin-btn admin-btn-ghost">
          홈으로
        </Link>
      </div>
    )
  }

  return (
    <div>
      {listError ? (
        <p className="admin-demo-note admin-demo-note-error" role="alert">
          {listError}
          <button
            type="button"
            className="admin-btn admin-btn-ghost admin-btn-sm"
            onClick={() => void loadProducts()}
          >
            다시 시도
          </button>
        </p>
      ) : null}

      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">상품 관리</h1>
          <p className="admin-page-lead">향수 상품을 등록·수정·노출 상태를 관리합니다.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          + 상품 추가
        </button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <p className="admin-stat-label">전체</p>
          <p className="admin-stat-value">{stats.total}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">게시됨</p>
          <p className="admin-stat-value">{stats.published}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">임시저장</p>
          <p className="admin-stat-value">{stats.draft}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">재고 부족</p>
          <p className="admin-stat-value">{stats.lowStock}</p>
        </div>
      </div>

      <div className={`admin-layout-split${panelMode ? ' has-panel has-panel-edit' : ''}`}>
        <div>
          <div className="admin-toolbar">
            <input
              type="search"
              className="admin-search"
              placeholder="상품명, SKU 검색…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              aria-label="상품 검색"
            />
            <select
              className="admin-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setPage(1)
              }}
              aria-label="상태 필터"
            >
              <option value="all">전체 상태</option>
              <option value="published">게시됨</option>
              <option value="draft">임시저장</option>
            </select>
            <span className="admin-home-featured-count" aria-live="polite">
              홈 노출 {homeFeaturedCount}/{HOME_FEATURED_MAX}
            </span>
          </div>

          {listLoading ? (
            <p className="admin-empty">상품 목록 불러오는 중…</p>
          ) : products.length === 0 ? (
            <p className="admin-empty">
              {hasActiveFilter ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">상품</th>
                    <th scope="col" className="admin-col-home">
                      대표
                    </th>
                    <th scope="col">가격</th>
                    <th scope="col">재고</th>
                    <th scope="col" className="admin-col-optional">
                      상태
                    </th>
                    <th scope="col" className="admin-col-optional">
                      수정일
                    </th>
                    <th scope="col">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const defaultVariant = getDefaultVariant(product.variants)
                    const thumb = defaultVariant.bottleImage
                    const totalStock = productTotalStock(product.variants)
                    return (
                      <tr
                        key={product.id}
                        className={selectedId === product.id ? 'is-selected' : undefined}
                      >
                        <td>
                          <div className="admin-product-cell">
                            {thumb ? (
                              <img src={thumb} alt="" className="admin-product-thumb" />
                            ) : (
                              <span className="admin-product-thumb admin-product-thumb-empty" />
                            )}
                            <div>
                              <div className="admin-product-name">{product.name}</div>
                              <div className="admin-product-sub admin-product-sku">
                                {defaultVariant.sku || '—'}
                              </div>
                              <div className="admin-product-sub">
                                {product.id}
                                {product.variants.length > 1
                                  ? ` · ${product.variants.length}옵션`
                                  : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="admin-col-home">
                          <label className="admin-home-check">
                            <input
                              type="checkbox"
                              checked={product.showOnHome}
                              disabled={
                                product.status !== 'published' ||
                                togglingHomeId === product.id ||
                                (!product.showOnHome &&
                                  homeFeaturedCount >= HOME_FEATURED_MAX)
                              }
                              onChange={() => void toggleShowOnHome(product)}
                              aria-label={`${product.name} 홈 노출`}
                            />
                            <span className="admin-home-check-label" aria-hidden>
                              {product.showOnHome ? 'ON' : '—'}
                            </span>
                          </label>
                        </td>
                        <td>{formatProductPriceLabel(product.variants, product.currency)}</td>
                        <td>
                          {totalStock}
                          {totalStock < 30 ? (
                            <span className="admin-badge admin-badge-low"> LOW</span>
                          ) : null}
                        </td>
                        <td className="admin-col-optional">
                          <span
                            className={`admin-badge admin-badge-${product.status}`}
                          >
                            {product.status === 'published' ? '게시됨' : '임시저장'}
                          </span>
                        </td>
                        <td className="admin-col-optional">{formatDate(product.updatedAt)}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                              onClick={() => openEdit(product)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => openDeleteConfirm(product)}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!listLoading && listTotal > 0 ? (
            <nav className="admin-pagination" aria-label="상품 목록 페이지">
              <p className="admin-pagination-summary">
                {listRangeStart}–{listRangeEnd} / {listTotal}개
              </p>
              <div className="admin-pagination-controls">
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  이전
                </button>
                <span className="admin-pagination-current" aria-current="page">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  다음
                </button>
              </div>
            </nav>
          ) : null}
        </div>

        {panelMode ? (
          <aside className="admin-panel">
            <h2 className="admin-panel-title">
              {panelMode === 'create' ? '새 상품' : '상품 수정'}
            </h2>
            <form className="admin-form" onSubmit={handleSubmit}>
              {formError ? (
                <p className="admin-form-error" role="alert">
                  {formError}
                </p>
              ) : null}
              <label className="admin-field">
                <span className="admin-field-label">상품명</span>
                <input
                  className="admin-field-input"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  required
                />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">부제</span>
                <input
                  className="admin-field-input"
                  value={draft.subtitle}
                  onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                />
              </label>

              <div className="admin-field">
                <span className="admin-field-label">판매 형태</span>
                <div className="admin-sku-toggle" role="group" aria-label="판매 형태">
                  <button
                    type="button"
                    className={`admin-sku-toggle-btn${singleSku ? ' is-active' : ''}`}
                    onClick={() => toggleSkuMode(true)}
                  >
                    단일 용량
                  </button>
                  <button
                    type="button"
                    className={`admin-sku-toggle-btn${!singleSku ? ' is-active' : ''}`}
                    onClick={() => toggleSkuMode(false)}
                  >
                    용량 옵션
                  </button>
                </div>
              </div>

              {singleSku && singleVariant ? (
                <fieldset className="admin-variant-block">
                  <legend className="admin-field-label">판매 정보</legend>
                  <label className="admin-field">
                    <span className="admin-field-label">SKU</span>
                    <input
                      className="admin-field-input"
                      value={singleVariant.sku}
                      onChange={(e) =>
                        updateVariant(singleVariant.id, { sku: e.target.value })
                      }
                      placeholder="LM-YOU-EDP-50"
                      required
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">가격 (원)</span>
                    <input
                      type="number"
                      min={0}
                      className="admin-field-input"
                      value={singleVariant.price || ''}
                      onChange={(e) =>
                        updateVariant(singleVariant.id, {
                          price: Number(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">재고</span>
                    <input
                      type="number"
                      min={0}
                      className="admin-field-input"
                      value={singleVariant.stock}
                      onChange={(e) =>
                        updateVariant(singleVariant.id, {
                          stock: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                  <AdminImageField
                    label="병 이미지"
                    value={singleVariant.bottleImage}
                    onChange={(url) =>
                      updateVariant(singleVariant.id, { bottleImage: url })
                    }
                    previewAlt="병 미리보기"
                    folder="shopping-mall/bottles"
                    placeholder="병 이미지 URL"
                  />
                </fieldset>
              ) : (
                <AdminVariantEditor
                  variants={draft.variants}
                  onUpdate={updateVariant}
                  onSetDefault={setDefaultVariant}
                  onAdd={addVariant}
                  onRemove={removeVariant}
                />
              )}

              <label className="admin-field">
                <span className="admin-field-label">상태</span>
                <select
                  className="admin-field-select"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      status: e.target.value as ProductStatus,
                    }))
                  }
                >
                  <option value="published">게시됨</option>
                  <option value="draft">임시저장</option>
                </select>
              </label>
              <label className="admin-field">
                <span className="admin-field-label">배지 (선택)</span>
                <input
                  className="admin-field-input"
                  value={draft.badgeLabel ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, badgeLabel: e.target.value || undefined }))
                  }
                  placeholder="BEST SELLER"
                />
              </label>
              <AdminImageField
                label="무드 이미지"
                value={draft.moodImage}
                onChange={(url) => setDraft((d) => ({ ...d, moodImage: url }))}
                previewAlt="무드 미리보기"
                folder="shopping-mall/mood"
                placeholder="무드 이미지 URL"
              />
              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? '저장 중…' : panelMode === 'create' ? '등록' : '저장'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={closePanel}
                >
                  취소
                </button>
              </div>
            </form>
          </aside>
        ) : null}
      </div>

      {toast ? <AdminToast message={toast} /> : null}

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="상품 삭제"
        message={deleteError ?? '삭제하시겠습니까?'}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
      />
    </div>
  )
}

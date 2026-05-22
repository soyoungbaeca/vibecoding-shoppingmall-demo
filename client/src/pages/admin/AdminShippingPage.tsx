import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  fetchAdminOrders,
  updateAdminOrder,
  AdminOrderApiError,
} from '@/api/adminOrders.ts'
import AdminAccessGate from '@/components/admin/AdminAccessGate.tsx'
import AdminToast from '@/components/admin/AdminToast.tsx'
import { orderToAdminShipment } from '@/lib/adminShipmentUtils.ts'
import { useToast } from '@/hooks/useToast.ts'
import { ORDER_STATUSES } from '@/constants/orderStatus.ts'
import type { AdminShipment, ShipmentStatus } from '@/types/adminShipment.ts'

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: '결제 완료',
  processing: '준비 중',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소됨',
}

const CARRIERS = ['CJ대한통운', '한진택배', '롯데택배', '우체국택배'] as const

function formatDate(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminShippingPage() {
  const { toast, showToast } = useToast()
  const [allShipments, setAllShipments] = useState<AdminShipment[]>([])
  const [tableShipments, setTableShipments] = useState<AdminShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ShipmentStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [editStatus, setEditStatus] = useState<ShipmentStatus>('pending')
  const [editCarrier, setEditCarrier] = useState('')
  const [editTracking, setEditTracking] = useState('')

  // 통계용 전체 목록 + 테이블용 필터 목록 조회
  const loadShipments = useCallback(async () => {
    setLoading(true)
    try {
      const [allResult, filteredResult] = await Promise.all([
        fetchAdminOrders({ page: 1, limit: 100 }),
        fetchAdminOrders({
          page: 1,
          limit: 100,
          status: statusFilter,
          q: search.trim() || undefined,
        }),
      ])
      setAllShipments(allResult.items.map(orderToAdminShipment))
      setTableShipments(filteredResult.items.map(orderToAdminShipment))
    } catch (err) {
      const message =
        err instanceof AdminOrderApiError ? err.message : '배송 목록을 불러오지 못했습니다.'
      showToast(message)
      setAllShipments([])
      setTableShipments([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, showToast])

  useEffect(() => {
    void loadShipments()
  }, [loadShipments])

  // 서버 ORDER_STATUSES 기준 건수 (취소는 마지막)
  const stats = useMemo(() => {
    const byStatus = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, 0]),
    ) as Record<ShipmentStatus, number>
    for (const shipment of allShipments) {
      byStatus[shipment.status] += 1
    }
    return { total: allShipments.length, byStatus }
  }, [allShipments])

  const selected =
    tableShipments.find((s) => s.id === selectedId) ??
    allShipments.find((s) => s.id === selectedId) ??
    null

  // 배송 행 선택 시 패널 폼 채우기
  function selectShipment(shipment: AdminShipment) {
    setSelectedId(shipment.id)
    setEditStatus(shipment.status)
    setEditCarrier(shipment.carrier)
    setEditTracking(shipment.trackingNumber)
  }

  function closePanel() {
    setSelectedId(null)
  }

  // PATCH /admin/orders — 배송·상태 저장
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return

    setSaving(true)
    try {
      const updated = await updateAdminOrder(selectedId, {
        status: editStatus,
        shippingInfo: {
          carrier: editCarrier.trim(),
          trackingNumber: editTracking.trim(),
        },
      })
      const mapped = orderToAdminShipment(updated)
      setAllShipments((prev) => prev.map((s) => (s.id === mapped.id ? mapped : s)))
      setTableShipments((prev) => {
        const next = prev.map((s) => (s.id === mapped.id ? mapped : s))
        if (statusFilter !== 'all' && mapped.status !== statusFilter) {
          return next.filter((s) => s.id !== mapped.id)
        }
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const matches =
            mapped.orderNumber.toLowerCase().includes(q) ||
            mapped.customerName.toLowerCase().includes(q) ||
            mapped.email.toLowerCase().includes(q) ||
            mapped.trackingNumber.includes(q)
          if (!matches) return next.filter((s) => s.id !== mapped.id)
        }
        return next
      })
      showToast('배송 정보가 저장되었습니다.')
    } catch (err) {
      const message =
        err instanceof AdminOrderApiError ? err.message : '저장에 실패했습니다.'
      showToast(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminAccessGate>
      <div>
        {toast ? <AdminToast message={toast} /> : null}

        <div className="admin-page-head">
          <div>
            <h1 className="admin-page-title">배송 관리</h1>
            <p className="admin-page-lead">주문 배송 상태와 운송장 정보를 관리합니다.</p>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <p className="admin-stat-label">전체 주문</p>
            <p className="admin-stat-value">{stats.total}</p>
          </div>
          {ORDER_STATUSES.map((status) => (
            <div key={status} className="admin-stat-card">
              <p className="admin-stat-label">{STATUS_LABELS[status]}</p>
              <p className="admin-stat-value">{stats.byStatus[status]}</p>
            </div>
          ))}
        </div>

        <div className={`admin-layout-split${selected ? ' has-panel' : ''}`}>
          <div>
            <div className="admin-toolbar">
              <input
                type="search"
                className="admin-search"
                placeholder="주문번호, 고객명, 운송장 검색…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="배송 검색"
              />
              <select
                className="admin-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
                aria-label="배송 상태 필터"
              >
                <option value="all">전체 상태</option>
                {(Object.keys(STATUS_LABELS) as ShipmentStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="admin-empty" role="status">
                불러오는 중…
              </p>
            ) : tableShipments.length === 0 ? (
              <p className="admin-empty">검색 결과가 없습니다.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">주문</th>
                      <th scope="col">고객</th>
                      <th scope="col">상품</th>
                      <th scope="col">상태</th>
                      <th scope="col">운송장</th>
                      <th scope="col">주문일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableShipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        className={selectedId === shipment.id ? 'is-selected' : undefined}
                      >
                        <td>
                          <button
                            type="button"
                            className="admin-link-btn"
                            onClick={() => selectShipment(shipment)}
                          >
                            {shipment.orderNumber}
                          </button>
                        </td>
                        <td>
                          <div className="admin-product-name">{shipment.customerName}</div>
                          <div className="admin-product-sub">{shipment.email}</div>
                        </td>
                        <td className="admin-cell-muted">{shipment.itemsSummary}</td>
                        <td>
                          <span
                            className={`admin-badge admin-badge-shipment-${shipment.status}`}
                          >
                            {STATUS_LABELS[shipment.status]}
                          </span>
                        </td>
                        <td className="admin-cell-muted">
                          {shipment.trackingNumber || '—'}
                        </td>
                        <td className="admin-cell-muted">
                          {formatDate(shipment.orderedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected ? (
            <aside className="admin-panel">
              <h2 className="admin-panel-title">배송 상세</h2>
              <p className="admin-panel-meta">
                <strong>{selected.orderNumber}</strong>
                <br />
                {selected.customerName}
                <br />
                <span className="admin-cell-muted">{selected.address}</span>
              </p>
              <form className="admin-form" onSubmit={handleSave}>
                <label className="admin-field">
                  <span className="admin-field-label">배송 상태</span>
                  <select
                    className="admin-field-select"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as ShipmentStatus)
                    }
                  >
                    {(Object.keys(STATUS_LABELS) as ShipmentStatus[]).map((key) => (
                      <option key={key} value={key}>
                        {STATUS_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span className="admin-field-label">택배사</span>
                  <select
                    className="admin-field-select"
                    value={editCarrier}
                    onChange={(e) => setEditCarrier(e.target.value)}
                  >
                    <option value="">선택</option>
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span className="admin-field-label">운송장 번호</span>
                  <input
                    className="admin-field-input"
                    value={editTracking}
                    onChange={(e) => setEditTracking(e.target.value)}
                    placeholder="123456789012"
                  />
                </label>
                <div className="admin-form-actions">
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={saving}
                  >
                    {saving ? '저장 중…' : '저장'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={closePanel}
                    disabled={saving}
                  >
                    닫기
                  </button>
                </div>
              </form>
            </aside>
          ) : null}
        </div>
      </div>
    </AdminAccessGate>
  )
}

import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload.ts'
import type { ProductVariant } from '@/types/productVariant.ts'

type Props = {
  variants: ProductVariant[]
  onUpdate: (id: string, patch: Partial<ProductVariant>) => void
  onSetDefault: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

function VariantBottleImageRow({
  variant,
  onUpdate,
}: {
  variant: ProductVariant
  onUpdate: (id: string, patch: Partial<ProductVariant>) => void
}) {
  const { uploadImage, uploading } = useCloudinaryUpload({ folder: 'shopping-mall/bottles' })

  return (
    <>
      <div className="admin-variant-row-url">
        <span className="admin-variant-url-label">병 이미지</span>
        <input
          className="admin-field-input admin-variant-input-url"
          value={variant.bottleImage}
          onChange={(e) => onUpdate(variant.id, { bottleImage: e.target.value })}
          placeholder="URL 또는 Cloudinary 업로드"
          aria-label="병 이미지 URL"
        />
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm admin-variant-upload-btn"
          disabled={uploading}
          onClick={() =>
            uploadImage((url) => onUpdate(variant.id, { bottleImage: url }))
          }
        >
          {uploading ? '…' : 'Cloudinary'}
        </button>
      </div>
      {variant.bottleImage ? (
        <div className="admin-variant-row-preview">
          <img src={variant.bottleImage} alt="" />
        </div>
      ) : null}
    </>
  )
}

export default function AdminVariantEditor({
  variants,
  onUpdate,
  onSetDefault,
  onAdd,
  onRemove,
}: Props) {
  return (
    <div className="admin-variant-block">
      <div className="admin-variant-head">
        <span className="admin-field-label">용량별 옵션</span>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onAdd}>
          + 옵션 추가
        </button>
      </div>
      <div className="admin-variant-table">
        <div className="admin-variant-table-head" aria-hidden>
          <span className="admin-variant-col-default">기본</span>
          <span className="admin-variant-col-sku">SKU</span>
          <span className="admin-variant-col-label">용량</span>
          <span className="admin-variant-col-price">가격</span>
          <span className="admin-variant-col-stock">재고</span>
          <span className="admin-variant-col-thumb">이미지</span>
          <span className="admin-variant-col-action" />
        </div>
        <div className="admin-variant-list">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className={`admin-variant-row${variant.isDefault ? ' is-default' : ''}`}
            >
              <div className="admin-variant-row-main">
                <label className="admin-variant-default">
                  <input
                    type="radio"
                    name="defaultVariant"
                    checked={Boolean(variant.isDefault)}
                    onChange={() => onSetDefault(variant.id)}
                    aria-label={`${variant.label || '옵션'} 기본으로 설정`}
                  />
                </label>
                <input
                  className="admin-field-input admin-variant-input-sku"
                  value={variant.sku}
                  onChange={(e) => onUpdate(variant.id, { sku: e.target.value })}
                  placeholder="LM-YOU-EDP-50"
                  aria-label="SKU"
                  required
                />
                <input
                  className="admin-field-input admin-variant-input-label"
                  value={variant.label}
                  onChange={(e) => onUpdate(variant.id, { label: e.target.value })}
                  placeholder="50 ml"
                  aria-label="용량"
                  required
                />
                <input
                  type="number"
                  min={0}
                  className="admin-field-input admin-variant-input-num"
                  value={variant.price || ''}
                  onChange={(e) =>
                    onUpdate(variant.id, { price: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  aria-label="가격 (원)"
                  required
                />
                <input
                  type="number"
                  min={0}
                  className="admin-field-input admin-variant-input-num"
                  value={variant.stock}
                  onChange={(e) =>
                    onUpdate(variant.id, { stock: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  aria-label="재고"
                />
                {variant.bottleImage ? (
                  <img src={variant.bottleImage} alt="" className="admin-variant-thumb" />
                ) : (
                  <span className="admin-variant-thumb-empty" aria-hidden />
                )}
                {variants.length > 1 ? (
                  <button
                    type="button"
                    className="admin-variant-remove"
                    onClick={() => onRemove(variant.id)}
                    aria-label={`${variant.label || variant.sku || '옵션'} 삭제`}
                  >
                    ×
                  </button>
                ) : (
                  <span className="admin-variant-col-action" aria-hidden />
                )}
              </div>
              <VariantBottleImageRow variant={variant} onUpdate={onUpdate} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

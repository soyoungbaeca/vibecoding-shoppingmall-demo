import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload.ts'

type Props = {
  label: string
  value: string
  onChange: (url: string) => void
  previewAlt?: string
  folder?: string
  placeholder?: string
}

export default function AdminImageField({
  label,
  value,
  onChange,
  previewAlt = '이미지 미리보기',
  folder,
  placeholder = '이미지 URL 또는 Cloudinary 업로드',
}: Props) {
  const { uploadImage, uploading, configured } = useCloudinaryUpload({ folder })

  return (
    <div className="admin-image-field">
      <span className="admin-field-label">{label}</span>
      <div className="admin-image-field-row">
        <input
          className="admin-field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm admin-image-upload-btn"
          disabled={uploading}
          onClick={() => uploadImage(onChange)}
        >
          {uploading ? '업로드 중…' : 'Cloudinary'}
        </button>
      </div>
      {!configured ? (
        <p className="admin-image-field-hint">
          Cloudinary: <code>VITE_CLOUDINARY_CLOUD_NAME</code>,{' '}
          <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> (unsigned preset)
        </p>
      ) : null}
      {value ? (
        <div className="admin-preview admin-preview-lg">
          <img src={value} alt={previewAlt} />
        </div>
      ) : (
        <div className="admin-preview admin-preview-empty" aria-hidden>
          미리보기
        </div>
      )}
    </div>
  )
}

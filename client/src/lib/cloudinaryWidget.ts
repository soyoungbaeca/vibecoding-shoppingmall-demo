import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  isCloudinaryConfigured,
} from '@/config/cloudinary.ts'
import type { CloudinaryUploadWidget } from '@/types/cloudinary-widget.d.ts'

const SCRIPT_URL = 'https://upload-widget.cloudinary.com/latest/global/all.js'

let scriptPromise: Promise<void> | null = null

// Cloudinary 위젯 스크립트 1회 로드
export function loadCloudinaryWidgetScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 사용할 수 있습니다.'))
  }
  if (window.cloudinary?.createUploadWidget) {
    return Promise.resolve()
  }
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Cloudinary 스크립트 로드 실패')))
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Cloudinary 스크립트 로드 실패'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

type OpenUploadOptions = {
  folder?: string
  onSuccess: (secureUrl: string) => void
}

// 업로드 위젯 열기
export async function openCloudinaryUpload({
  folder,
  onSuccess,
}: OpenUploadOptions): Promise<void> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary가 설정되지 않았습니다. client/.env에 VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET을 추가하세요.'
    )
  }

  await loadCloudinaryWidgetScript()

  const createWidget = window.cloudinary?.createUploadWidget
  if (!createWidget) {
    throw new Error('Cloudinary 위젯을 초기화할 수 없습니다.')
  }

  let widget: CloudinaryUploadWidget | null = null

  widget = createWidget(
    {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      sources: ['local', 'url', 'camera'],
      multiple: false,
      folder: folder ?? 'shopping-mall/products',
      clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
      maxFileSize: 5_000_000,
    },
    (error, result) => {
      if (error) return
      if (result.event === 'success' && result.info?.secure_url) {
        onSuccess(result.info.secure_url)
        widget?.close()
      }
    }
  )

  widget.open()
}

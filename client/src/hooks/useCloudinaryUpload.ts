import { useCallback, useEffect, useState } from 'react'
import { isCloudinaryConfigured } from '@/config/cloudinary.ts'
import { loadCloudinaryWidgetScript, openCloudinaryUpload } from '@/lib/cloudinaryWidget.ts'

type Options = {
  folder?: string
}

export function useCloudinaryUpload(options: Options = {}) {
  const [scriptReady, setScriptReady] = useState(false)
  const [uploading, setUploading] = useState(false)
  const configured = isCloudinaryConfigured()

  useEffect(() => {
    if (!configured) return
    loadCloudinaryWidgetScript()
      .then(() => setScriptReady(true))
      .catch(() => setScriptReady(false))
  }, [configured])

  const uploadImage = useCallback(
    async (onSuccess: (url: string) => void) => {
      if (!configured) {
        window.alert(
          'Cloudinary 설정이 필요합니다.\nclient/.env에 VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET을 추가하세요.'
        )
        return
      }
      setUploading(true)
      try {
        await openCloudinaryUpload({
          folder: options.folder,
          onSuccess: (url) => {
            onSuccess(url)
          },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.'
        window.alert(message)
      } finally {
        setUploading(false)
      }
    },
    [configured, options.folder]
  )

  return { uploadImage, uploading, scriptReady, configured }
}

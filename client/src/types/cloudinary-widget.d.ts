export type CloudinaryUploadResult = {
  event: string
  info?: {
    secure_url?: string
  }
}

export type CloudinaryUploadWidget = {
  open: (source?: string, options?: { files?: File[] }) => void
  close: () => void
}

export type CloudinaryUploadWidgetOptions = {
  cloudName: string
  uploadPreset: string
  sources?: string[]
  multiple?: boolean
  folder?: string
  clientAllowedFormats?: string[]
  maxFileSize?: number
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: CloudinaryUploadWidgetOptions,
        callback: (error: unknown, result: CloudinaryUploadResult) => void
      ) => CloudinaryUploadWidget
    }
  }
}

export {}

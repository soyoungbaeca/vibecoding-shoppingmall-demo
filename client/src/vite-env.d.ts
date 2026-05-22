/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base path or full URL. Default `/api` (Vite → same path on backend). */
  readonly VITE_API_BASE?: string
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string
  /** PortOne v1 가맹점 식별코드 (IMP.init), 미설정 시 imp33406634 */
  readonly VITE_IMP_CODE?: string
  /** PortOne PG (IMP.request_pay pg), 미설정 시 html5_inicis.INIpayTest */
  readonly VITE_IMP_PG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

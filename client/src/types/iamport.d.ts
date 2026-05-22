/** PortOne(아임포트) v1 — IMP.request_pay 요청 (공식 문서 필드) */
export type IamportPayMethod = 'card' | 'trans' | 'vbank' | 'phone' | 'samsung' | 'kpay' | 'kakaopay' | 'payco' | 'lpay' | 'ssgpay' | 'tosspay' | 'cultureland' | 'smartculture' | 'happymoney' | 'booknlife'

export interface IamportRequestPayParams {
  pg: string
  pay_method: IamportPayMethod
  merchant_uid: string
  name: string
  amount: number
  buyer_email?: string
  buyer_name?: string
  buyer_tel?: string
  buyer_addr?: string
  buyer_postcode?: string
  m_redirect_url?: string
}

export interface IamportPaymentResponse {
  success?: boolean
  error_code?: string
  error_msg?: string
  imp_uid?: string
  merchant_uid?: string
  paid_amount?: number
  pay_method?: string
}

export interface IamportInstance {
  init: (impCode: string) => void
  request_pay: (
    params: IamportRequestPayParams,
    callback: (response: IamportPaymentResponse) => void
  ) => void
}

declare global {
  interface Window {
    IMP?: IamportInstance
  }
}

export {}

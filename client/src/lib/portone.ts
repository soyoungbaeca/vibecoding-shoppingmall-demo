import { PORTONE_MERCHANT_CODE } from '@/config/portone.ts'
import type {
  IamportPaymentResponse,
  IamportRequestPayParams,
} from '@/types/iamport.d.ts'

const SDK_POLL_MS = 50
const SDK_MAX_WAIT_MS = 10_000

let initialized = false

function getImp() {
  return typeof window !== 'undefined' ? window.IMP : undefined
}

// CDN 스크립트 로드 대기
function waitForImpSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (getImp()) {
      resolve()
      return
    }

    const started = Date.now()
    const timer = window.setInterval(() => {
      if (getImp()) {
        window.clearInterval(timer)
        resolve()
        return
      }
      if (Date.now() - started >= SDK_MAX_WAIT_MS) {
        window.clearInterval(timer)
        reject(
          new Error(
            'PortOne SDK를 불러오지 못했습니다. index.html에 iamport.js 스크립트가 있는지 확인해 주세요.'
          )
        )
      }
    }, SDK_POLL_MS)
  })
}

// IMP.init으로 PortOne 결제 모듈 초기화 (앱·체크아웃에서 1회)
export async function initPortOne(): Promise<void> {
  if (initialized) return

  await waitForImpSdk()
  const imp = getImp()
  if (!imp) {
    throw new Error('PortOne SDK(IMP)를 사용할 수 없습니다.')
  }

  imp.init(PORTONE_MERCHANT_CODE)
  initialized = true
}

export function isPortOneInitialized(): boolean {
  return initialized
}

// 주문별 고유 merchant_uid 생성 (상점 주문 번호)
export function createPaymentMerchantUid(): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : String(Math.random()).slice(2, 14)
  return `order_no_${Date.now()}_${suffix}`
}

/** IMP.request_pay 인자 — 공식 문서 필드 그대로 */
export type RequestPortOnePaymentParams = IamportRequestPayParams

// IMP.request_pay 호출 (공식 문서 콜백 → Promise)
export function requestPortOnePayment(
  params: RequestPortOnePaymentParams
): Promise<IamportPaymentResponse> {
  if (!initialized) {
    return Promise.reject(new Error('결제 모듈이 초기화되지 않았습니다.'))
  }

  const imp = getImp()
  if (!imp) {
    return Promise.reject(new Error('PortOne SDK(IMP)를 사용할 수 없습니다.'))
  }

  const requestParams: IamportRequestPayParams = {
    pg: params.pg,
    pay_method: params.pay_method,
    merchant_uid: params.merchant_uid,
    name: params.name,
    amount: params.amount,
    buyer_email: params.buyer_email,
    buyer_name: params.buyer_name,
    buyer_tel: params.buyer_tel,
    buyer_addr: params.buyer_addr,
    buyer_postcode: params.buyer_postcode,
    ...(params.m_redirect_url ? { m_redirect_url: params.m_redirect_url } : {}),
  }

  return new Promise((resolve, reject) => {
    imp.request_pay(requestParams, (response) => {
      if (response.success) {
        resolve(response)
        return
      }
      const message = response.error_msg?.trim() || '결제가 완료되지 않았습니다.'
      reject(new Error(message))
    })
  })
}

// 모바일 웹 결제 완료 리디렉션 URL (m_redirect_url)
export function getCheckoutMobileRedirectUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (!isMobile) return undefined
  return `${window.location.origin}/checkout`
}

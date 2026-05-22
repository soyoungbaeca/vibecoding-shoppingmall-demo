import type { IamportPayMethod } from '@/types/iamport.d.ts'

/** PortOne v1 가맹점(고객사) 식별코드 — IMP.init 인자 */
export const PORTONE_MERCHANT_CODE =
  import.meta.env.VITE_IMP_CODE?.trim() || 'imp33406634'

/** PortOne PG — IMP.request_pay pg (공식 문서 기본: html5_inicis) */
export const PORTONE_PG = import.meta.env.VITE_IMP_PG?.trim() || 'html5_inicis'

/** PortOne 결제 수단 — IMP.request_pay pay_method */
export const PORTONE_PAY_METHOD: IamportPayMethod = 'card'

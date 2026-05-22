export const FREE_SHIPPING_THRESHOLD = 60_000;
const DEFAULT_SHIPPING_FEE = 3_000;

// 소계 기준 배송비 (무료배송 임계값)
export function calcShippingFee(subtotal) {
  const amount = Number(subtotal) || 0;
  if (amount >= FREE_SHIPPING_THRESHOLD) return 0;
  return DEFAULT_SHIPPING_FEE;
}

// 주문 합계
export function calcOrderAmounts(subtotal, { discount = 0, tax = 0 } = {}) {
  const sub = Math.max(0, Number(subtotal) || 0);
  const shippingFee = calcShippingFee(sub);
  const disc = Math.max(0, Number(discount) || 0);
  const taxAmount = Math.max(0, Number(tax) || 0);
  const total = Math.max(0, sub + shippingFee + taxAmount - disc);

  return {
    currency: "KRW",
    subtotal: sub,
    shippingFee,
    discount: disc,
    tax: taxAmount,
    total,
  };
}

// 목록 page·limit
export function parsePaginationQuery(query, defaultLimit = 20) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit };
}

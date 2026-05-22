// 라인 소계 (가격 × 수량)
export function calcLineSubtotal(price, quantity) {
  const unit = Number(price) || 0;
  const qty = Math.max(0, Number(quantity) || 0);
  return unit * qty;
}

// 장바구니 합계 — 판매 가능 라인만 합산
export function calcCartTotals(lines) {
  let subtotal = 0;
  let itemCount = 0;

  for (const line of lines) {
    if (!line.available) continue;
    const qty = Math.max(0, Number(line.quantity) || 0);
    subtotal += calcLineSubtotal(line.price, qty);
    itemCount += qty;
  }

  return {
    subtotal,
    itemCount,
    lineCount: lines.filter((l) => l.available).length,
  };
}

// 담기 시 수량 합산
export function mergeQuantity(existingQty, addQty) {
  return Math.max(1, (Number(existingQty) || 0) + (Number(addQty) || 0));
}

// 수량 정수·범위 검증
export function parseQuantity(value, { min = 1, max = 99 } = {}) {
  const qty = Number.parseInt(value, 10);
  if (!Number.isFinite(qty) || qty < min || qty > max) {
    return null;
  }
  return qty;
}

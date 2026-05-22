import {
  cancelOrderAdmin,
  cancelOrderForUser,
  createOrderFromCart,
  getOrderAdmin,
  getOrderForUser,
  listOrdersAdmin,
  listOrdersForUser,
  OrderServiceError,
  updateOrderAdmin,
} from "../services/orderService.js";

function getUserId(req) {
  return req.auth?.sub;
}

function handleOrderError(err, res, fallbackMessage) {
  if (err instanceof OrderServiceError) {
    return res.status(err.status).json({ ok: false, message: err.message });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ ok: false, message: err.message });
  }
  console.error(`[orders] ${fallbackMessage}`, err);
  return res.status(500).json({ ok: false, message: fallbackMessage });
}

// POST /orders — 장바구니 체크아웃
export async function createOrder(req, res) {
  try {
    const userId = getUserId(req);
    const order = await createOrderFromCart(userId, req.body);
    res.status(201).json({ ok: true, order });
  } catch (err) {
    return handleOrderError(err, res, "주문 생성에 실패했습니다.");
  }
}

// GET /orders — 내 주문 목록
export async function listMyOrders(req, res) {
  try {
    const userId = getUserId(req);
    const result = await listOrdersForUser(userId, req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    return handleOrderError(err, res, "주문 목록 조회에 실패했습니다.");
  }
}

// GET /orders/:id — 내 주문 단건
export async function getMyOrder(req, res) {
  try {
    const userId = getUserId(req);
    const order = await getOrderForUser(userId, req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    return handleOrderError(err, res, "주문 조회에 실패했습니다.");
  }
}

// PATCH /orders/:id/cancel — 내 주문 취소
export async function cancelMyOrder(req, res) {
  try {
    const userId = getUserId(req);
    const order = await cancelOrderForUser(userId, req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    return handleOrderError(err, res, "주문 취소에 실패했습니다.");
  }
}

// GET /admin/orders — 어드민 목록
export async function adminListOrders(req, res) {
  try {
    const result = await listOrdersAdmin(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    return handleOrderError(err, res, "주문 목록 조회에 실패했습니다.");
  }
}

// GET /admin/orders/:id — 어드민 단건
export async function adminGetOrder(req, res) {
  try {
    const order = await getOrderAdmin(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    return handleOrderError(err, res, "주문 조회에 실패했습니다.");
  }
}

// PATCH /admin/orders/:id — 어드민 수정
export async function adminUpdateOrder(req, res) {
  try {
    const order = await updateOrderAdmin(req.params.id, req.body);
    res.json({ ok: true, order });
  } catch (err) {
    return handleOrderError(err, res, "주문 수정에 실패했습니다.");
  }
}

// DELETE /admin/orders/:id — 어드민 취소
export async function adminDeleteOrder(req, res) {
  try {
    const order = await cancelOrderAdmin(req.params.id);
    res.json({ ok: true, order, message: "주문이 취소되었습니다." });
  } catch (err) {
    return handleOrderError(err, res, "주문 취소에 실패했습니다.");
  }
}

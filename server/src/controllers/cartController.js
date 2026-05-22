import {
  addItemToCart,
  CartServiceError,
  clearCart,
  getCartForUser,
  removeCartItem,
  updateCartItemQuantity,
} from "../services/cartService.js";

function getUserId(req) {
  return req.auth?.sub;
}

function handleCartError(err, res, fallbackMessage) {
  if (err instanceof CartServiceError) {
    return res.status(err.status).json({ ok: false, message: err.message });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ ok: false, message: err.message });
  }
  return res.status(500).json({ ok: false, message: fallbackMessage });
}

// GET /cart
export async function getCart(req, res) {
  try {
    const userId = getUserId(req);
    const cart = await getCartForUser(userId);
    res.json({ ok: true, cart });
  } catch (err) {
    return handleCartError(err, res, "장바구니 조회에 실패했습니다.");
  }
}

// POST /cart/items
export async function addCartItem(req, res) {
  try {
    const userId = getUserId(req);
    const cart = await addItemToCart(userId, req.body);
    res.status(201).json({ ok: true, cart });
  } catch (err) {
    return handleCartError(err, res, "장바구니에 담기에 실패했습니다.");
  }
}

// PATCH /cart/items/:itemId
export async function patchCartItem(req, res) {
  try {
    const userId = getUserId(req);
    const cart = await updateCartItemQuantity(userId, req.params.itemId, req.body);
    res.json({ ok: true, cart });
  } catch (err) {
    return handleCartError(err, res, "장바구니 수량 변경에 실패했습니다.");
  }
}

// DELETE /cart/items/:itemId
export async function deleteCartItem(req, res) {
  try {
    const userId = getUserId(req);
    const cart = await removeCartItem(userId, req.params.itemId);
    res.json({ ok: true, cart });
  } catch (err) {
    return handleCartError(err, res, "장바구니 항목 삭제에 실패했습니다.");
  }
}

// DELETE /cart
export async function deleteCart(req, res) {
  try {
    const userId = getUserId(req);
    const cart = await clearCart(userId);
    res.json({ ok: true, cart });
  } catch (err) {
    return handleCartError(err, res, "장바구니 비우기에 실패했습니다.");
  }
}

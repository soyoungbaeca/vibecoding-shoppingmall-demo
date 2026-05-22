import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { calcCartTotals, calcLineSubtotal, mergeQuantity, parseQuantity } from "../utils/cart.js";

export class CartServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "CartServiceError";
    this.status = status;
  }
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// 게시된 상품·옵션 조회
async function findPublishedProductVariant(productSlug, variantId) {
  const slug = normalizeSlug(productSlug);
  if (!slug) {
    throw new CartServiceError("상품 id가 올바르지 않습니다.");
  }
  if (!isValidObjectId(variantId)) {
    throw new CartServiceError("옵션 id가 올바르지 않습니다.");
  }

  const product = await Product.findOne({ slug, status: "published" });
  if (!product) {
    throw new CartServiceError("상품을 찾을 수 없거나 판매 중이 아닙니다.", 404);
  }

  const variant = product.variants.id(variantId);
  if (!variant) {
    throw new CartServiceError("옵션을 찾을 수 없습니다.", 404);
  }

  return { product, variant };
}

// 재고 검증
function assertSufficientStock(variant, quantity) {
  if (quantity > variant.stock) {
    throw new CartServiceError(
      `재고가 부족합니다. (남은 수량: ${variant.stock})`
    );
  }
}

// 사용자 장바구니 조회 또는 생성
async function getOrCreateCart(userId) {
  if (!isValidObjectId(userId)) {
    throw new CartServiceError("유효하지 않은 사용자입니다.", 401);
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

// Cart 서브도큐먼트 id로 라인 찾기
function findCartItem(cart, itemId) {
  if (!isValidObjectId(itemId)) {
    throw new CartServiceError("장바구니 항목 id가 올바르지 않습니다.");
  }
  const item = cart.items.id(itemId);
  if (!item) {
    throw new CartServiceError("장바구니 항목을 찾을 수 없습니다.", 404);
  }
  return item;
}

// DB 라인 → API 응답 라인 (상품 정보·가용성 포함)
async function enrichCartItem(item) {
  const base = {
    id: String(item._id),
    productSlug: item.productSlug,
    variantId: String(item.variantId),
    sku: item.sku,
    quantity: item.quantity,
    available: false,
    unavailableReason: null,
    name: null,
    subtitle: null,
    label: null,
    price: 0,
    currency: "KRW",
    bottleImage: "",
    stock: 0,
    lineSubtotal: 0,
  };

  const product = await Product.findOne({
    slug: item.productSlug,
    status: "published",
  });

  if (!product) {
    return {
      ...base,
      unavailableReason: "판매 중이 아닌 상품입니다.",
    };
  }

  const variant = product.variants.id(item.variantId);
  if (!variant) {
    return {
      ...base,
      unavailableReason: "옵션을 더 이상 사용할 수 없습니다.",
      name: product.name,
      subtitle: product.subtitle,
      currency: product.currency,
    };
  }

  const available = item.quantity <= variant.stock;
  const price = variant.price;

  return {
    ...base,
    available,
    unavailableReason: available ? null : "재고가 부족합니다.",
    name: product.name,
    subtitle: product.subtitle,
    label: variant.label,
    price,
    currency: product.currency,
    bottleImage: variant.bottleImage,
    stock: variant.stock,
    lineSubtotal: available ? calcLineSubtotal(price, item.quantity) : 0,
  };
}

// 장바구니 전체를 API 형태로 변환
async function buildCartResponse(cart) {
  const items = await Promise.all(cart.items.map((item) => enrichCartItem(item)));
  const totals = calcCartTotals(items);

  return {
    ...cart.toJSON(),
    items,
    totals,
  };
}

// GET — 내 장바구니
export async function getCartForUser(userId) {
  const cart = await getOrCreateCart(userId);
  return buildCartResponse(cart);
}

// POST — 항목 담기 (동일 옵션이면 수량 합산)
export async function addItemToCart(userId, body) {
  const { productSlug, variantId } = body;
  const quantity = parseQuantity(body.quantity ?? 1);
  if (quantity == null) {
    throw new CartServiceError("수량은 1~99 사이 정수여야 합니다.");
  }

  const { product, variant } = await findPublishedProductVariant(productSlug, variantId);
  const slug = product.slug;

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find(
    (i) => i.productSlug === slug && String(i.variantId) === String(variant._id)
  );

  const nextQty = existing ? mergeQuantity(existing.quantity, quantity) : quantity;
  assertSufficientStock(variant, nextQty);

  if (existing) {
    existing.quantity = nextQty;
  } else {
    cart.items.push({
      productSlug: slug,
      variantId: variant._id,
      sku: variant.sku,
      quantity,
    });
  }

  await cart.save();
  return buildCartResponse(cart);
}

// PATCH — 항목 수량 변경
export async function updateCartItemQuantity(userId, itemId, body) {
  const quantity = parseQuantity(body.quantity);
  if (quantity == null) {
    throw new CartServiceError("수량은 1~99 사이 정수여야 합니다.");
  }

  const cart = await getOrCreateCart(userId);
  const line = findCartItem(cart, itemId);

  const { variant } = await findPublishedProductVariant(line.productSlug, line.variantId);
  assertSufficientStock(variant, quantity);

  line.quantity = quantity;
  await cart.save();
  return buildCartResponse(cart);
}

// DELETE — 항목 1개 삭제
export async function removeCartItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const line = findCartItem(cart, itemId);
  line.deleteOne();
  await cart.save();
  return buildCartResponse(cart);
}

// DELETE — 장바구니 비우기
export async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return buildCartResponse(cart);
}

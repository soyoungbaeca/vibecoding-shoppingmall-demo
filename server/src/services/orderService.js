import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import {
  ORDER_STATUSES,
  Order,
  PAYMENT_STATUSES,
} from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { calcLineSubtotal } from "../utils/cart.js";
import { calcOrderAmounts, parsePaginationQuery } from "../utils/order.js";

export class OrderServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "OrderServiceError";
    this.status = status;
  }
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 로컬 standalone MongoDB는 트랜잭션 미지원
function isReplicaSetTransactionError(err) {
  const message = err?.message ?? "";
  return message.includes("replica set member or mongos");
}

// 트랜잭션 가능 시 사용, 아니면 session 없이 동일 작업 실행
async function runWithOptionalTransaction(run) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await run(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    if (isReplicaSetTransactionError(err)) {
      return run(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

// 주문번호 LM-YYYYMMDD-###
async function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `LM-${y}${m}${d}`;
  const count = await Order.countDocuments({
    orderNumber: new RegExp(`^${escapeRegex(prefix)}`),
  });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

// 장바구니 라인 → 주문 가능 여부 검증
async function resolveCartLineForOrder(cartItem) {
  const product = await Product.findOne({
    slug: cartItem.productSlug,
    status: "published",
  });
  if (!product) {
    throw new OrderServiceError("판매 중이 아닌 상품이 장바구니에 있습니다.");
  }

  const variant = product.variants.id(cartItem.variantId);
  if (!variant) {
    throw new OrderServiceError("주문할 수 없는 옵션이 장바구니에 있습니다.");
  }

  if (cartItem.quantity > variant.stock) {
    throw new OrderServiceError(
      `${product.name} (${variant.label}) 재고가 부족합니다. (남은 수량: ${variant.stock})`
    );
  }

  return {
    product,
    variant,
    snapshot: {
      productSlug: product.slug,
      variantId: variant._id,
      sku: variant.sku,
      name: product.name,
      subtitle: product.subtitle ?? "",
      label: variant.label,
      unitPrice: variant.price,
      quantity: cartItem.quantity,
      lineSubtotal: calcLineSubtotal(variant.price, cartItem.quantity),
      bottleImage: variant.bottleImage ?? "",
    },
  };
}

// 재고 차감
async function decrementVariantStock(productSlug, variantId, quantity, session) {
  const variantObjectId =
    variantId instanceof mongoose.Types.ObjectId
      ? variantId
      : new mongoose.Types.ObjectId(variantId);

  const updateOptions = {
    arrayFilters: [{ "v._id": variantObjectId, "v.stock": { $gte: quantity } }],
  };
  if (session) updateOptions.session = session;

  const result = await Product.updateOne(
    { slug: productSlug, status: "published" },
    { $inc: { "variants.$[v].stock": -quantity } },
    updateOptions
  );

  if (result.modifiedCount !== 1) {
    throw new OrderServiceError("재고 차감에 실패했습니다. 수량을 확인해 주세요.");
  }
}

// 재고 복구 (취소 시)
async function restoreVariantStock(productSlug, variantId, quantity, session) {
  const variantObjectId =
    variantId instanceof mongoose.Types.ObjectId
      ? variantId
      : new mongoose.Types.ObjectId(variantId);

  const updateOptions = {
    arrayFilters: [{ "v._id": variantObjectId }],
  };
  if (session) updateOptions.session = session;

  await Product.updateOne(
    { slug: productSlug },
    { $inc: { "variants.$[v].stock": quantity } },
    updateOptions
  );
}

function validateShippingInput(shipping) {
  if (!shipping || typeof shipping !== "object") {
    throw new OrderServiceError("배송 정보를 입력해 주세요.");
  }
  const recipientName =
    typeof shipping.recipientName === "string" ? shipping.recipientName.trim() : "";
  const address = typeof shipping.address === "string" ? shipping.address.trim() : "";
  if (!recipientName) {
    throw new OrderServiceError("수령인 이름을 입력해 주세요.");
  }
  if (!address) {
    throw new OrderServiceError("배송 주소를 입력해 주세요.");
  }
  return {
    recipientName,
    phone: typeof shipping.phone === "string" ? shipping.phone.trim() : "",
    address,
  };
}

function sendOrderJson(order) {
  return order.toJSON();
}

// id 또는 orderNumber로 주문 조회
async function findOrderByParam(idParam) {
  const raw = String(idParam || "").trim();
  if (!raw) {
    throw new OrderServiceError("주문 id가 올바르지 않습니다.");
  }

  if (raw.toUpperCase().startsWith("LM-")) {
    const order = await Order.findOne({ orderNumber: raw.toUpperCase() });
    if (!order) {
      throw new OrderServiceError("주문을 찾을 수 없습니다.", 404);
    }
    return order;
  }

  if (!isValidObjectId(raw)) {
    throw new OrderServiceError("주문 id가 올바르지 않습니다.");
  }

  const order = await Order.findById(raw);
  if (!order) {
    throw new OrderServiceError("주문을 찾을 수 없습니다.", 404);
  }
  return order;
}

// POST — 장바구니로 주문 생성 (체크아웃)
export async function createOrderFromCart(userId, body) {
  if (!isValidObjectId(userId)) {
    throw new OrderServiceError("유효하지 않은 사용자입니다.", 401);
  }

  const shipping = validateShippingInput(body.shipping);
  const note = typeof body.note === "string" ? body.note.trim() : undefined;

  const user = await User.findById(userId);
  if (!user) {
    throw new OrderServiceError("사용자를 찾을 수 없습니다.", 404);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new OrderServiceError("장바구니가 비어 있습니다.");
  }

  const resolved = await Promise.all(cart.items.map((item) => resolveCartLineForOrder(item)));
  const items = resolved.map((r) => r.snapshot);
  const subtotal = items.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const amounts = calcOrderAmounts(subtotal, {
    discount: body.discount,
    tax: body.tax,
  });

  const paymentStatus =
    body.paymentStatus && PAYMENT_STATUSES.includes(body.paymentStatus)
      ? body.paymentStatus
      : "paid";

  try {
    return await runWithOptionalTransaction(async (session) => {
      for (const { snapshot } of resolved) {
        await decrementVariantStock(
          snapshot.productSlug,
          snapshot.variantId,
          snapshot.quantity,
          session
        );
      }

      const orderNumber = await generateOrderNumber();
      const createOptions = session ? { session } : {};
      const [order] = await Order.create(
        [
          {
            orderNumber,
            user: userId,
            status: "pending",
            paymentStatus,
            items,
            shipping,
            customer: {
              name: user.name,
              email: user.email,
            },
            amounts,
            note: note || undefined,
          },
        ],
        createOptions
      );

      cart.items = [];
      await cart.save(session ? { session } : undefined);

      return sendOrderJson(order);
    });
  } catch (err) {
    if (err instanceof OrderServiceError) throw err;
    if (err.code === 11000) {
      throw new OrderServiceError("주문번호 생성에 실패했습니다. 다시 시도해 주세요.", 409);
    }
    throw err;
  }
}

// GET — 내 주문 목록
export async function listOrdersForUser(userId, query) {
  if (!isValidObjectId(userId)) {
    throw new OrderServiceError("유효하지 않은 사용자입니다.", 401);
  }

  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = { user: userId };

  const status =
    typeof query.status === "string" ? query.status.trim().toLowerCase() : "";
  if (status) {
    if (!ORDER_STATUSES.includes(status)) {
      throw new OrderServiceError("주문 상태가 올바르지 않습니다.");
    }
    filter.status = status;
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  return {
    items: orders.map((o) => sendOrderJson(o)),
    page,
    limit,
    total,
    totalPages,
  };
}

// GET — 내 주문 단건
export async function getOrderForUser(userId, idParam) {
  const order = await findOrderByParam(idParam);
  if (String(order.user) !== String(userId)) {
    throw new OrderServiceError("주문을 찾을 수 없습니다.", 404);
  }
  return sendOrderJson(order);
}

// GET — 어드민 목록
export async function listOrdersAdmin(query) {
  const filter = {};
  const { status, q } = query;

  if (status && ORDER_STATUSES.includes(status)) {
    filter.status = status;
  }

  const search = typeof q === "string" ? q.trim() : "";
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { orderNumber: regex },
      { "customer.name": regex },
      { "customer.email": regex },
      { "shippingInfo.trackingNumber": regex },
    ];
  }

  const { page, limit, skip } = parsePaginationQuery(query);
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  return {
    items: orders.map((o) => sendOrderJson(o)),
    page,
    limit,
    total,
    totalPages,
  };
}

// GET — 어드민 단건
export async function getOrderAdmin(idParam) {
  const order = await findOrderByParam(idParam);
  return sendOrderJson(order);
}

// PATCH — 어드민 주문 수정
export async function updateOrderAdmin(idParam, body) {
  const order = await findOrderByParam(idParam);
  const prevStatus = order.status;

  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status)) {
      throw new OrderServiceError("주문 상태가 올바르지 않습니다.");
    }
    order.status = body.status;
  }

  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
      throw new OrderServiceError("결제 상태가 올바르지 않습니다.");
    }
    order.paymentStatus = body.paymentStatus;
  }

  if (body.shippingInfo && typeof body.shippingInfo === "object") {
    if (body.shippingInfo.carrier !== undefined) {
      order.shippingInfo.carrier = String(body.shippingInfo.carrier).trim();
    }
    if (body.shippingInfo.trackingNumber !== undefined) {
      order.shippingInfo.trackingNumber = String(body.shippingInfo.trackingNumber).trim();
    }
  }

  if (body.note !== undefined) {
    order.note = typeof body.note === "string" ? body.note.trim() : "";
  }

  return runWithOptionalTransaction(async (session) => {
    if (prevStatus !== "cancelled" && order.status === "cancelled") {
      for (const item of order.items) {
        await restoreVariantStock(
          item.productSlug,
          item.variantId,
          item.quantity,
          session
        );
      }
    }

    await order.save(session ? { session } : undefined);
    return sendOrderJson(order);
  });
}

// DELETE — 어드민 주문 취소 (상태 cancelled + 재고 복구)
export async function cancelOrderAdmin(idParam) {
  const order = await findOrderByParam(idParam);
  if (order.status === "cancelled") {
    throw new OrderServiceError("이미 취소된 주문입니다.");
  }
  if (order.status === "delivered") {
    throw new OrderServiceError("배송 완료된 주문은 취소할 수 없습니다.");
  }

  return updateOrderAdmin(idParam, { status: "cancelled" });
}

// PATCH — 내 주문 취소 (pending만)
export async function cancelOrderForUser(userId, idParam) {
  const order = await findOrderByParam(idParam);
  if (String(order.user) !== String(userId)) {
    throw new OrderServiceError("주문을 찾을 수 없습니다.", 404);
  }
  if (order.status !== "pending") {
    throw new OrderServiceError("접수 대기 중인 주문만 취소할 수 있습니다.");
  }

  return updateOrderAdmin(String(order._id), { status: "cancelled" });
}

import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

export const ORDER_CURRENCIES = ["KRW"];

// 주문 라인 — 결제 시점 스냅샷
const orderItemSchema = new mongoose.Schema(
  {
    productSlug: {
      type: String,
      required: [true, "상품 id는 필수입니다."],
      trim: true,
      lowercase: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "옵션 id는 필수입니다."],
    },
    sku: {
      type: String,
      required: [true, "SKU는 필수입니다."],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "상품명은 필수입니다."],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    label: {
      type: String,
      required: [true, "용량 라벨은 필수입니다."],
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "단가는 0 이상이어야 합니다."],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "수량은 1 이상이어야 합니다."],
    },
    lineSubtotal: {
      type: Number,
      required: true,
      min: [0, "라인 소계는 0 이상이어야 합니다."],
    },
    bottleImage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "주문번호는 필수입니다."],
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "사용자는 필수입니다."],
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1;
        },
        message: "주문 상품은 최소 1개 필요합니다.",
      },
    },
    shipping: {
      recipientName: {
        type: String,
        required: [true, "수령인 이름은 필수입니다."],
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
      address: {
        type: String,
        required: [true, "배송 주소는 필수입니다."],
        trim: true,
      },
    },
    customer: {
      name: {
        type: String,
        required: [true, "주문자 이름은 필수입니다."],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "주문자 이메일은 필수입니다."],
        trim: true,
        lowercase: true,
      },
    },
    amounts: {
      currency: {
        type: String,
        enum: ORDER_CURRENCIES,
        default: "KRW",
      },
      subtotal: {
        type: Number,
        required: true,
        min: [0, "소계는 0 이상이어야 합니다."],
      },
      shippingFee: {
        type: Number,
        required: true,
        min: [0, "배송비는 0 이상이어야 합니다."],
        default: 0,
      },
      discount: {
        type: Number,
        min: [0, "할인은 0 이상이어야 합니다."],
        default: 0,
      },
      tax: {
        type: Number,
        min: [0, "세금은 0 이상이어야 합니다."],
        default: 0,
      },
      total: {
        type: Number,
        required: true,
        min: [0, "합계는 0 이상이어야 합니다."],
      },
    },
    shippingInfo: {
      carrier: {
        type: String,
        trim: true,
        default: "",
      },
      trackingNumber: {
        type: String,
        trim: true,
        default: "",
      },
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "customer.email": 1 });

// 라인·주문번호 정규화, 소계 검증
orderSchema.pre("validate", function normalizeOrder() {
  if (typeof this.orderNumber === "string") {
    this.orderNumber = this.orderNumber.trim().toUpperCase();
  }

  if (typeof this.customer?.email === "string") {
    this.customer.email = this.customer.email.trim().toLowerCase();
  }

  if (!Array.isArray(this.items) || this.items.length === 0) {
    return;
  }

  for (const item of this.items) {
    if (typeof item.sku === "string") {
      item.sku = item.sku.trim().toUpperCase();
    }
    if (typeof item.productSlug === "string") {
      item.productSlug = item.productSlug.trim().toLowerCase();
    }
    if (typeof item.name === "string") {
      item.name = item.name.trim();
    }
    if (typeof item.label === "string") {
      item.label = item.label.trim();
    }

    const expected = item.unitPrice * item.quantity;
    if (item.lineSubtotal !== expected) {
      item.lineSubtotal = expected;
    }
  }

  if (this.amounts && typeof this.amounts === "object") {
    const { subtotal, shippingFee = 0, discount = 0, tax = 0 } = this.amounts;
    const expectedTotal = subtotal + shippingFee + tax - discount;
    if (this.amounts.total !== expectedTotal) {
      this.amounts.total = Math.max(0, expectedTotal);
    }
  }
});

orderSchema.set("toJSON", {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id != null ? String(ret._id) : undefined;
    delete ret._id;

    if (ret.user != null) {
      ret.userId = String(ret.user);
      delete ret.user;
    }

    if (Array.isArray(ret.items)) {
      ret.items = ret.items.map((item) => {
        const { _id, ...rest } = item;
        return {
          ...rest,
          id: _id != null ? String(_id) : undefined,
        };
      });

      ret.itemsSummary = ret.items
        .map((item) => `${item.name} ${item.label} × ${item.quantity}`)
        .join(", ");
    }

    if (ret.createdAt) {
      ret.orderedAt =
        ret.createdAt instanceof Date ? ret.createdAt.toISOString() : ret.createdAt;
    }

    if (ret.updatedAt) {
      ret.updatedAt =
        ret.updatedAt instanceof Date ? ret.updatedAt.toISOString() : ret.updatedAt;
    }

    return ret;
  },
});

export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);

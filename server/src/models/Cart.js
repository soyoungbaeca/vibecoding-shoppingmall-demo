import mongoose from "mongoose";

// 장바구니 라인 — 상품 slug · 옵션 · 수량
const cartItemSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: [1, "수량은 1 이상이어야 합니다."],
      default: 1,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "사용자는 필수입니다."],
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// 동일 상품·옵션 중복 방지
cartSchema.pre("validate", function normalizeCartItems() {
  if (!Array.isArray(this.items) || this.items.length === 0) {
    return;
  }

  const seen = new Set();
  for (const item of this.items) {
    if (typeof item.sku === "string") {
      item.sku = item.sku.trim().toUpperCase();
    }
    if (typeof item.productSlug === "string") {
      item.productSlug = item.productSlug.trim().toLowerCase();
    }

    const key = `${item.productSlug}:${String(item.variantId)}`;
    if (seen.has(key)) {
      this.invalidate("items", "장바구니에 같은 옵션이 중복되어 있습니다.");
      return;
    }
    seen.add(key);
  }
});

cartSchema.set("toJSON", {
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
    }

    if (ret.updatedAt) {
      ret.updatedAt =
        ret.updatedAt instanceof Date ? ret.updatedAt.toISOString() : ret.updatedAt;
    }
    if (ret.createdAt) {
      delete ret.createdAt;
    }

    return ret;
  },
});

export const Cart = mongoose.models.Cart ?? mongoose.model("Cart", cartSchema);

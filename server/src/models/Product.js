import mongoose from "mongoose";

export const PRODUCT_STATUSES = ["published", "draft"];
export const PRODUCT_CURRENCIES = ["KRW"];

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU는 필수입니다."],
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      required: [true, "용량 라벨은 필수입니다."],
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "가격은 0 이상이어야 합니다."],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "재고는 0 이상이어야 합니다."],
      default: 0,
    },
    bottleImage: {
      type: String,
      trim: true,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
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
    currency: {
      type: String,
      enum: PRODUCT_CURRENCIES,
      default: "KRW",
    },
    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: "draft",
    },
    moodImage: {
      type: String,
      trim: true,
      default: "",
    },
    badgeLabel: {
      type: String,
      trim: true,
    },
    showOnHome: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1;
        },
        message: "옵션은 최소 1개 필요합니다.",
      },
    },
  },
  { timestamps: true }
);

// variants.sku — 컬렉션 전역 유일
productSchema.index({ "variants.sku": 1 }, { unique: true });
productSchema.index({ showOnHome: 1, status: 1 });

// 옵션 정규화·상품 내 label 중복·기본 옵션 1개
productSchema.pre("validate", function normalizeProductVariants() {
  if (typeof this.badgeLabel === "string" && this.badgeLabel.trim() === "") {
    this.badgeLabel = undefined;
  }

  if (!Array.isArray(this.variants) || this.variants.length === 0) {
    return;
  }

  const labels = [];
  const skus = [];
  for (const variant of this.variants) {
    if (typeof variant.sku === "string") {
      variant.sku = variant.sku.trim().toUpperCase();
    }
    if (variant.sku) {
      if (skus.includes(variant.sku)) {
        this.invalidate("variants", "요청 내 SKU가 중복됩니다.");
        return;
      }
      skus.push(variant.sku);
    }
    if (typeof variant.label === "string") {
      variant.label = variant.label.trim();
    }
    if (typeof variant.bottleImage === "string") {
      variant.bottleImage = variant.bottleImage.trim();
    }

    const labelKey = variant.label?.toLowerCase();
    if (labelKey) {
      if (labels.includes(labelKey)) {
        this.invalidate("variants", "같은 상품 안에서 용량 라벨이 중복됩니다.");
        return;
      }
      labels.push(labelKey);
    }
  }

  const defaultCount = this.variants.filter((v) => v.isDefault).length;
  if (defaultCount === 0) {
    this.variants[0].isDefault = true;
  } else if (defaultCount > 1) {
    this.invalidate("variants", "기본 옵션은 하나만 지정할 수 있습니다.");
  }
});

productSchema.set("toJSON", {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret.slug;
    delete ret.slug;
    delete ret._id;

    if (Array.isArray(ret.variants)) {
      ret.variants = ret.variants.map((variant) => {
        const { _id, ...rest } = variant;
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

export const Product =
  mongoose.models.Product ?? mongoose.model("Product", productSchema);

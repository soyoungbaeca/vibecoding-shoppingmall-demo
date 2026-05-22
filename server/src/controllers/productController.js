import { Product, PRODUCT_STATUSES } from "../models/Product.js";
import { slugFromName } from "../utils/slug.js";

export const HOME_FEATURED_MAX = 4;

const PRODUCT_FIELDS = [
  "name",
  "subtitle",
  "currency",
  "status",
  "moodImage",
  "badgeLabel",
  "showOnHome",
  "variants",
];

function normalizeSlugParam(id) {
  return String(id || "")
    .trim()
    .toLowerCase();
}

// 클라이언트 variant.id 제외, 스키마 필드만 추출
function mapVariantInput(raw) {
  if (!raw || typeof raw !== "object") return null;
  const { sku, label, price, stock, bottleImage, isDefault } = raw;
  return { sku, label, price, stock, bottleImage, isDefault };
}

function pickProductBody(body) {
  const data = {};
  for (const key of PRODUCT_FIELDS) {
    if (body[key] === undefined) continue;
    if (key === "variants") {
      if (!Array.isArray(body.variants)) continue;
      data.variants = body.variants.map(mapVariantInput).filter(Boolean);
      continue;
    }
    data[key] = body[key];
  }
  return data;
}

// slug 중복 시 -2, -3 … 접미사
async function resolveUniqueSlug(name) {
  const base = slugFromName(name) || `product-${Date.now()}`;
  let slug = base;
  let suffix = 0;
  while (await Product.exists({ slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 목록 쿼리 — page·limit (기본 5개)
function parsePaginationQuery(query, defaultLimit = 5) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit };
}

// 어드민 목록 필터 (상태·검색어)
function buildAdminListFilter(query) {
  const filter = {};
  const { status, q } = query;

  if (status && PRODUCT_STATUSES.includes(status)) {
    filter.status = status;
  }

  const search = typeof q === "string" ? q.trim() : "";
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { name: regex },
      { subtitle: regex },
      { slug: regex },
      { "variants.sku": regex },
    ];
  }

  return filter;
}

// 대시보드용 전체 통계
async function fetchAdminProductStats() {
  const [total, published, draft, homeFeatured, lowStockAgg] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: "published" }),
    Product.countDocuments({ status: "draft" }),
    Product.countDocuments({ showOnHome: true }),
    Product.aggregate([
      { $addFields: { totalStock: { $sum: "$variants.stock" } } },
      { $match: { totalStock: { $lt: 30 } } },
      { $count: "count" },
    ]),
  ]);

  return {
    total,
    published,
    draft,
    lowStock: lowStockAgg[0]?.count ?? 0,
    homeFeatured,
  };
}

function sendProductJson(res, product, status = 200) {
  return res.status(status).json(product.toJSON());
}

// 홈 노출은 게시 중 상품만, 최대 HOME_FEATURED_MAX개
async function validateShowOnHome(showOnHome, product) {
  if (!showOnHome) return null;

  const status = product.status;
  if (status !== "published") {
    return "게시된 상품만 홈에 노출할 수 있습니다.";
  }

  const count = await Product.countDocuments({
    showOnHome: true,
    slug: { $ne: product.slug },
  });
  if (count >= HOME_FEATURED_MAX) {
    return `홈 노출은 최대 ${HOME_FEATURED_MAX}개까지 선택할 수 있습니다.`;
  }

  return null;
}

function handleProductError(err, res, fallbackMessage) {
  if (err.code === 11000) {
    if (err.keyPattern?.slug) {
      return res.status(409).json({ message: "이미 사용 중인 상품 id(slug)입니다." });
    }
    if (err.keyPattern?.["variants.sku"]) {
      return res.status(409).json({ message: "이미 사용 중인 SKU입니다." });
    }
    return res.status(409).json({ message: "중복된 값이 있습니다." });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: fallbackMessage });
}

// POST — 상품 등록
export async function createProduct(req, res) {
  try {
    const body = pickProductBody(req.body);
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return res.status(400).json({ message: "상품명은 필수입니다." });
    }
    if (!Array.isArray(body.variants) || body.variants.length === 0) {
      return res.status(400).json({ message: "옵션은 최소 1개 필요합니다." });
    }

    const status = body.status ?? "draft";
    if (body.showOnHome === true) {
      if (status !== "published") {
        return res.status(400).json({ message: "게시된 상품만 홈에 노출할 수 있습니다." });
      }
      const count = await Product.countDocuments({ showOnHome: true });
      if (count >= HOME_FEATURED_MAX) {
        return res.status(400).json({
          message: `홈 노출은 최대 ${HOME_FEATURED_MAX}개까지 선택할 수 있습니다.`,
        });
      }
    }

    const slug = await resolveUniqueSlug(body.name);
    const product = await Product.create({
      ...body,
      name: body.name.trim(),
      slug,
      showOnHome: body.showOnHome === true,
    });
    return sendProductJson(res, product, 201);
  } catch (err) {
    return handleProductError(err, res, "상품 등록에 실패했습니다.");
  }
}

// GET — 어드민 목록 (검색·상태 필터·페이지네이션)
export async function listProducts(req, res) {
  try {
    const filter = buildAdminListFilter(req.query);
    const { page, limit, skip } = parsePaginationQuery(req.query);

    const [total, products, stats] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      fetchAdminProductStats(),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    res.json({
      items: products.map((p) => p.toJSON()),
      page,
      limit,
      total,
      totalPages,
      stats,
    });
  } catch {
    res.status(500).json({ message: "상품 목록 조회에 실패했습니다." });
  }
}

// GET — 스토어 공개 목록 (게시됨만, ?home=1 이면 홈 그리드 노출 상품만)
export async function listPublishedProducts(req, res) {
  try {
    const filter = { status: "published" };
    if (req.query.home === "1" || req.query.home === "true") {
      filter.showOnHome = true;
    }

    const products = await Product.find(filter).sort({ updatedAt: -1 });
    res.json(products.map((p) => p.toJSON()));
  } catch {
    res.status(500).json({ message: "상품 목록 조회에 실패했습니다." });
  }
}

// GET — slug(id) 단건 (어드민: 모든 상태)
export async function getProductBySlug(req, res) {
  try {
    const slug = normalizeSlugParam(req.params.id);
    if (!slug) {
      return res.status(400).json({ message: "상품 id가 올바르지 않습니다." });
    }

    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    return sendProductJson(res, product);
  } catch {
    res.status(500).json({ message: "상품 조회에 실패했습니다." });
  }
}

// GET — slug 단건 (스토어: 게시됨만)
export async function getPublishedProductBySlug(req, res) {
  try {
    const slug = normalizeSlugParam(req.params.id);
    if (!slug) {
      return res.status(400).json({ message: "상품 id가 올바르지 않습니다." });
    }

    const product = await Product.findOne({ slug, status: "published" });
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    return sendProductJson(res, product);
  } catch {
    res.status(500).json({ message: "상품 조회에 실패했습니다." });
  }
}

// PATCH — slug(id) 수정
export async function updateProduct(req, res) {
  try {
    const slug = normalizeSlugParam(req.params.id);
    if (!slug) {
      return res.status(400).json({ message: "상품 id가 올바르지 않습니다." });
    }

    const updates = pickProductBody(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "수정할 필드가 없습니다." });
    }

    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
      if (!updates.name) {
        return res.status(400).json({ message: "상품명은 비울 수 없습니다." });
      }
    }

    const existing = await Product.findOne({ slug });
    if (!existing) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    const nextStatus = updates.status ?? existing.status;
    if (nextStatus !== "published" && updates.showOnHome === true) {
      return res.status(400).json({ message: "게시된 상품만 홈에 노출할 수 있습니다." });
    }
    if (nextStatus !== "published") {
      updates.showOnHome = false;
    }

    const nextShowOnHome =
      updates.showOnHome !== undefined ? updates.showOnHome : existing.showOnHome;

    if (nextShowOnHome) {
      const merged = existing.toObject();
      merged.status = nextStatus;
      const errMsg = await validateShowOnHome(true, merged);
      if (errMsg) {
        return res.status(400).json({ message: errMsg });
      }
    }

    const product = await Product.findOneAndUpdate({ slug }, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    return sendProductJson(res, product);
  } catch (err) {
    return handleProductError(err, res, "상품 수정에 실패했습니다.");
  }
}

// DELETE — slug(id) 삭제
export async function deleteProduct(req, res) {
  try {
    const slug = normalizeSlugParam(req.params.id);
    if (!slug) {
      return res.status(400).json({ message: "상품 id가 올바르지 않습니다." });
    }

    const product = await Product.findOneAndDelete({ slug });
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json({ message: "상품이 삭제되었습니다.", product: product.toJSON() });
  } catch {
    res.status(500).json({ message: "상품 삭제에 실패했습니다." });
  }
}

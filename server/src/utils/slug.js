/** 상품명 → URL slug (프론트 slugFromName과 동일 규칙) */
export function slugFromName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

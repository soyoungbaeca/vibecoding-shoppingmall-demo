const DEFAULT_LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/shopping-mall";

/** Atlas URL 우선, 없으면 로컬 기본 URI */
export function resolveMongoUri() {
  const atlas = process.env.MONGO_ATLAS_URL?.trim();
  if (atlas) {
    if (atlas.includes("TE_API_BASE=") || atlas.includes("VITE_API_BASE=")) {
      console.error(
        "MONGO_ATLAS_URL looks malformed (API env var pasted into the URI). " +
          "Use only: mongodb+srv://user:pass@host/DATABASE_NAME"
      );
      process.exit(1);
    }
    return atlas;
  }
  return DEFAULT_LOCAL_MONGO_URI;
}

/** 연결에 Atlas URL을 쓰는지 여부 */
export function isUsingAtlasMongo() {
  return Boolean(process.env.MONGO_ATLAS_URL?.trim());
}

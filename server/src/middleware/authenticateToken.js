import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Authorization: Bearer <JWT> 검증 후 `req.auth`에 페이로드(sub, email, userType 등) 저장
 */
export function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token =
    typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: "인증 토큰이 필요합니다.",
    });
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload || typeof payload.sub !== "string" || !payload.sub) {
      return res.status(401).json({
        ok: false,
        message: "유효하지 않은 토큰입니다.",
      });
    }
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({
      ok: false,
      message: "유효하지 않거나 만료된 토큰입니다.",
    });
  }
}

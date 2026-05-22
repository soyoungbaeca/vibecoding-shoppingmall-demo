import jwt from "jsonwebtoken";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || !String(s).trim()) {
    throw new Error("JWT_SECRET is not set");
  }
  return String(s).trim();
}

/**
 * @param {{ _id: unknown; email: string; userType: string }} userDoc
 * @returns {string}
 */
export function signAccessToken(userDoc) {
  // 로그인 시 클라이언트에 넣을 클레임 (sub = 유저 Mongo id)
  const payload = {
    sub: String(userDoc._id),
    email: userDoc.email,
    userType: userDoc.userType,
  };
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// JWT 문자열 검증 후 페이로드 반환 (만료·위조 시 throw)
export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret());
}

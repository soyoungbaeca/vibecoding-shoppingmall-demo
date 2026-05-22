/** JWT 인증 후 관리자(userType)만 통과 */
export function requireAdmin(req, res, next) {
  if (req.auth?.userType !== "admin") {
    return res.status(403).json({
      ok: false,
      message: "관리자 권한이 필요합니다.",
    });
  }
  next();
}

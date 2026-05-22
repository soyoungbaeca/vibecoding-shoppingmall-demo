import mongoose from "mongoose";
import { User } from "../models/User.js";
import { isValidEmail } from "../utils/email.js";
import { comparePassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";

/**
 * 이메일 + 비밀번호 로그인.
 * 성공: 200 + { ok: true, message, token, user } (user는 비밀번호 제외)
 * 실패: 400 입력·형식 / 401 자격 증명 불일치 / 500
 */
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        ok: false,
        message: "이메일과 비밀번호를 입력해 주세요.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        ok: false,
        message: "이메일과 비밀번호를 입력해 주세요.",
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        ok: false,
        message: "올바른 이메일 형식이 아닙니다.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const passwordOk = await comparePassword(password, user.password);
    if (!passwordOk) {
      return res.status(401).json({
        ok: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    // Access JWT 발급
    const token = signAccessToken(user);

    return res.status(200).json({
      ok: true,
      message: "로그인에 성공했습니다.",
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    if (err?.message === "JWT_SECRET is not set") {
      console.error(err.message);
      return res.status(500).json({
        ok: false,
        message: "서버 설정 오류입니다. 관리자에게 문의해 주세요.",
      });
    }
    return res.status(500).json({
      ok: false,
      message: "로그인 처리 중 오류가 발생했습니다.",
    });
  }
}

// Bearer 토큰의 sub(유저 id)로 DB에서 최신 프로필 조회
export async function getCurrentUser(req, res) {
  try {
    const userId = req.auth.sub;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        ok: false,
        message: "유효하지 않은 토큰입니다.",
      });
    }

    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    return res.status(200).json({
      ok: true,
      user,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "사용자 정보를 불러오지 못했습니다.",
    });
  }
}

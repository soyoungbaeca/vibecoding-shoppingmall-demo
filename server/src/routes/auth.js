import { Router } from "express";
import { getCurrentUser, loginUser } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = Router();

router.post("/login", loginUser);
router.get("/me", authenticateToken, getCurrentUser);

export default router;

import { Router } from "express";
import {
  adminDeleteOrder,
  adminGetOrder,
  adminListOrders,
  adminUpdateOrder,
} from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get("/", adminListOrders);
router.get("/:id", adminGetOrder);
router.patch("/:id", adminUpdateOrder);
router.delete("/:id", adminDeleteOrder);

export default router;

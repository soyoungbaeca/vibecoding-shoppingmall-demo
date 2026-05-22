import { Router } from "express";
import {
  cancelMyOrder,
  createOrder,
  getMyOrder,
  listMyOrders,
} from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = Router();

router.use(authenticateToken);

router.post("/", createOrder);
router.get("/", listMyOrders);
router.patch("/:id/cancel", cancelMyOrder);
router.get("/:id", getMyOrder);

export default router;

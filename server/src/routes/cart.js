import { Router } from "express";
import {
  addCartItem,
  deleteCart,
  deleteCartItem,
  getCart,
  patchCartItem,
} from "../controllers/cartController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:itemId", patchCartItem);
router.delete("/items/:itemId", deleteCartItem);
router.delete("/", deleteCart);

export default router;

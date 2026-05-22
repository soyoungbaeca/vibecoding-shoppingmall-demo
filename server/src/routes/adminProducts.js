import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(authenticateToken, requireAdmin);

router.post("/", createProduct);
router.get("/", listProducts);
router.get("/:id", getProductBySlug);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

import { Router } from "express";
import {
  getPublishedProductBySlug,
  listPublishedProducts,
} from "../controllers/productController.js";

const router = Router();

// 스토어 — 게시된 상품만 조회
router.get("/", listPublishedProducts);
router.get("/:id", getPublishedProductBySlug);

export default router;

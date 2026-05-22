import express from "express";
import adminOrdersRouter from "./routes/adminOrders.js";
import adminProductsRouter from "./routes/adminProducts.js";
import authRouter from "./routes/auth.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";
import productsRouter from "./routes/products.js";
import usersRouter from "./routes/users.js";

export function createApp() {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());

  const health = (_req, res) => {
    res.json({ ok: true });
  };

  /** 로드밸런서·직접 헬스체크용 (프리픽스 없음) */
  app.get("/health", health);

  const api = express.Router();
  api.get("/health", health);
  api.use("/auth", authRouter);
  api.use("/users", usersRouter);
  api.use("/products", productsRouter);
  api.use("/cart", cartRouter);
  api.use("/orders", ordersRouter);
  api.use("/admin/products", adminProductsRouter);
  api.use("/admin/orders", adminOrdersRouter);
  app.use("/api", api);

  /** 예전 클라이언트·문서용: `/api` 없이 호출 시 */
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/products", productsRouter);
  app.use("/cart", cartRouter);
  app.use("/orders", ordersRouter);
  app.use("/admin/products", adminProductsRouter);
  app.use("/admin/orders", adminOrdersRouter);

  return app;
}

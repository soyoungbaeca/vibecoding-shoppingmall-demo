import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { isUsingAtlasMongo, resolveMongoUri } from "./config/mongoUri.js";

const port = Number(process.env.PORT) || 5001;
const mongoUri = resolveMongoUri();

if (!process.env.JWT_SECRET?.trim()) {
  console.error(
    "Missing JWT_SECRET. Copy .env.example to .env and set JWT_SECRET (e.g. openssl rand -hex 32)."
  );
  process.exit(1);
}

const app = createApp();

try {
  await connectDb(mongoUri);
  console.log(
    isUsingAtlasMongo()
      ? "MongoDB connected (MONGO_ATLAS_URL)"
      : "MongoDB connected (local)"
  );
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
}

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

let shuttingDown = false;

async function shutdown() {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await mongoose.connection.close();
}

async function onShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`\n${signal}: shutting down…`);
  try {
    await shutdown();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void onShutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void onShutdown("SIGTERM");
});

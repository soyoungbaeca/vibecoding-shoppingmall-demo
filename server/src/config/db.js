import mongoose from "mongoose";

/**
 * @param {string} uri
 */
export async function connectDb(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

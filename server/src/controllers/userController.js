import mongoose from "mongoose";
import { User, USER_TYPES } from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import { isValidEmail } from "../utils/email.js";

const ALLOWED_UPDATE_FIELDS = ["email", "name", "password", "address", "userType"];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function pickAllowedUpdates(body) {
  const updates = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  return updates;
}

export async function createUser(req, res) {
  try {
    const { email, name, password, address, userType } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "올바른 이메일 형식이 아닙니다." });
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      name,
      password: passwordHash,
      address,
      userType,
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
}

export async function listUsers(_req, res) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to list users" });
  }
}

export async function getUserById(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

export async function updateUser(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  const updates = pickAllowedUpdates(req.body);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No updatable fields provided" });
  }
  if (updates.userType !== undefined && !USER_TYPES.includes(updates.userType)) {
    return res.status(400).json({
      message: `userType must be one of: ${USER_TYPES.join(", ")}`,
    });
  }
  if (updates.email !== undefined && !isValidEmail(updates.email)) {
    return res.status(400).json({ message: "올바른 이메일 형식이 아닙니다." });
  }
  if (updates.password !== undefined) {
    updates.password = await hashPassword(updates.password);
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
}

export async function deleteUser(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const user = await User.findByIdAndDelete(req.params.id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted", user });
  } catch {
    res.status(500).json({ message: "Failed to delete user" });
  }
}

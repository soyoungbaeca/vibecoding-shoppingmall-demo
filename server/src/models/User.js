import mongoose from "mongoose";
import { isValidEmail } from "../utils/email.js";

export const USER_TYPES = ["customer", "admin"];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: isValidEmail,
        message: "올바른 이메일 형식이 아닙니다.",
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    address: {
      type: String,
      trim: true,
    },
    userType: {
      type: String,
      enum: USER_TYPES,
      default: "customer",
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  versionKey: false,
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    name: { type: String, trim: true },
    auth: {
      accessTokenHash: { type: String, default: null },
      refreshTokenHash: { type: String, default: null },
      refreshTokenExpiresAt: { type: Date, default: null },
      lastLoginAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    if (ret.auth) {
      delete ret.auth.accessTokenHash;
      delete ret.auth.refreshTokenHash;
    }
    return ret;
  }
});

UserSchema.pre("save", async function preSave(next) {
  if (!this.isModified("passwordHash")) {
    return next();
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  return next();
});

UserSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model("User", UserSchema);

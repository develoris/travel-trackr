import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import type { IUser, IUserMethods, UserDocument, UserModel } from "./user.types.js";

const { Document } = mongoose;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    name: { type: String, trim: true },
    mustChangePassword: { type: Boolean, default: false },
    temporaryPasswordIssuedAt: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false },
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
  transform: (_doc: unknown, ret: unknown) => {
    const obj = ret as Record<string, unknown>;
    delete obj.passwordHash;
    if (obj.auth && typeof obj.auth === "object") {
      const auth = obj.auth as Record<string, unknown>;
      delete auth.accessTokenHash;
      delete auth.refreshTokenHash;
    }
    return obj;
  }
});

UserSchema.pre("save", async function preSave(this: UserDocument) {
  if (!this.isModified("passwordHash")) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

UserSchema.methods.verifyPassword = function verifyPassword(
  this: UserDocument,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser, UserModel>("User", UserSchema);

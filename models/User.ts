import { Schema, model, models, type Model, type Types } from "mongoose";
import { ROLES, type Role } from "@/lib/constants";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES, default: "recruiter" },
    title: { type: String, default: "", maxlength: 100 },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, createdAt: -1 });

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", userSchema);

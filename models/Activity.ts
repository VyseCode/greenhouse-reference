import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IActivity {
  _id: Types.ObjectId;
  application: Types.ObjectId;
  actor: string;
  type: string;
  message: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    actor: { type: String, required: true },
    type: { type: String, required: true, index: true },
    message: { type: String, required: true, maxlength: 1000 },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ application: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

export const Activity: Model<IActivity> =
  (models.Activity as Model<IActivity>) ||
  model<IActivity>("Activity", activitySchema);

import { Schema, model, models, type Model, type Types } from "mongoose";
import { OFFER_STATUSES, type OfferStatus } from "@/lib/constants";

export interface IOffer {
  _id: Types.ObjectId;
  application: Types.ObjectId;
  job: Types.ObjectId;
  salary: number;
  startDate: string;
  status: OfferStatus;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    salary: { type: Number, required: true, min: 1 },
    startDate: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"] },
    status: {
      type: String,
      required: true,
      enum: OFFER_STATUSES,
      default: "draft",
    },
    note: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true },
);

offerSchema.index({ application: 1 }, { unique: true });
offerSchema.index({ status: 1, createdAt: -1 });
offerSchema.index({ job: 1, status: 1 });

export const Offer: Model<IOffer> =
  (models.Offer as Model<IOffer>) || model<IOffer>("Offer", offerSchema);

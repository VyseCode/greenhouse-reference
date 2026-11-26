import { Schema, model, models, type Model, type Types } from "mongoose";
import { INTERVIEW_STATUSES, type InterviewStatus } from "@/lib/constants";

export interface IInterview {
  _id: Types.ObjectId;
  application: Types.ObjectId;
  job: Types.ObjectId;
  interviewer: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  note: string;
  status: InterviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSchema = new Schema<IInterview>(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    interviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 240, default: 45 },
    note: { type: String, default: "", maxlength: 2000 },
    status: {
      type: String,
      required: true,
      enum: INTERVIEW_STATUSES,
      default: "scheduled",
    },
  },
  { timestamps: true },
);

interviewSchema.index({ application: 1, scheduledAt: -1 });
interviewSchema.index({ interviewer: 1, scheduledAt: 1 });
interviewSchema.index({ status: 1, scheduledAt: 1 });
interviewSchema.index({ job: 1, scheduledAt: -1 });

export const Interview: Model<IInterview> =
  (models.Interview as Model<IInterview>) ||
  model<IInterview>("Interview", interviewSchema);

import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  MAX_QUESTIONS,
  QUESTION_TYPES,
  type EmploymentType,
  type JobStatus,
  type QuestionType,
} from "@/lib/constants";

export interface IQuestion {
  _id: Types.ObjectId;
  prompt: string;
  required: boolean;
  type: QuestionType;
}

export interface IJob {
  _id: Types.ObjectId;
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  status: JobStatus;
  questions: IQuestion[];
  createdBy: Types.ObjectId;
  applicantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    prompt: { type: String, required: true, trim: true, maxlength: 240 },
    required: { type: Boolean, default: false },
    type: { type: String, enum: QUESTION_TYPES, default: "text" },
  },
  { _id: true },
);

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 12000 },
    department: { type: String, required: true, trim: true, maxlength: 80 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    employmentType: {
      type: String,
      required: true,
      enum: EMPLOYMENT_TYPES,
      default: "full-time",
    },
    status: {
      type: String,
      required: true,
      enum: JOB_STATUSES,
      default: "draft",
    },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator: (value: IQuestion[]) => value.length <= MAX_QUESTIONS,
        message: `A job can have at most ${MAX_QUESTIONS} questions`,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicantsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ department: 1, status: 1 });
jobSchema.index({ employmentType: 1, status: 1 });
jobSchema.index({ title: "text", description: "text", department: "text", location: "text" });

export const Job: Model<IJob> =
  (models.Job as Model<IJob>) || model<IJob>("Job", jobSchema);

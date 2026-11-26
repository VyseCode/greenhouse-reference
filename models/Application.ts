import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  MAX_QUESTIONS,
  MAX_STAGE_HISTORY,
  MAX_TAGS,
  SOURCES,
  STAGES,
  type Source,
  type Stage,
} from "@/lib/constants";

export interface IAnswer {
  question: string;
  answer: string;
}

export interface IStageEvent {
  from: Stage | null;
  to: Stage;
  reason: string;
  actor: string;
  at: Date;
}

export interface IApplication {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  name: string;
  email: string;
  resumeUrl: string;
  answers: IAnswer[];
  source: Source;
  stage: Stage;
  rejectionReason: string;
  tags: string[];
  stageHistory: IStageEvent[];
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true, maxlength: 2000 },
  },
  { _id: false },
);

const stageEventSchema = new Schema<IStageEvent>(
  {
    from: { type: String, enum: [...STAGES, null], default: null },
    to: { type: String, required: true, enum: STAGES },
    reason: { type: String, default: "" },
    actor: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"],
    },
    resumeUrl: { type: String, required: true, maxlength: 500 },
    answers: {
      type: [answerSchema],
      default: [],
      validate: {
        validator: (value: IAnswer[]) => value.length <= MAX_QUESTIONS,
        message: `At most ${MAX_QUESTIONS} answers are allowed`,
      },
    },
    source: { type: String, required: true, enum: SOURCES, default: "careers-page" },
    stage: { type: String, required: true, enum: STAGES, default: "applied" },
    rejectionReason: { type: String, default: "" },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= MAX_TAGS,
        message: `At most ${MAX_TAGS} tags are allowed`,
      },
    },
    stageHistory: {
      type: [stageEventSchema],
      default: [],
      validate: {
        validator: (value: IStageEvent[]) => value.length <= MAX_STAGE_HISTORY,
        message: `At most ${MAX_STAGE_HISTORY} stage events are allowed`,
      },
    },
    appliedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

applicationSchema.index({ job: 1, email: 1 }, { unique: true });
applicationSchema.index({ job: 1, stage: 1 });
applicationSchema.index({ stage: 1, appliedAt: -1 });
applicationSchema.index({ job: 1, appliedAt: -1 });
applicationSchema.index({ source: 1, appliedAt: -1 });
applicationSchema.index({ email: 1 });
applicationSchema.index({ tags: 1 });
applicationSchema.index({ "stageHistory.to": 1 });
applicationSchema.index({
  name: "text",
  email: "text",
  tags: "text",
});

export const Application: Model<IApplication> =
  (models.Application as Model<IApplication>) ||
  model<IApplication>("Application", applicationSchema);

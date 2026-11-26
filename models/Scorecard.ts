import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICriterion {
  name: string;
  weight: number;
  rating: number;
}

export interface IScorecard {
  _id: Types.ObjectId;
  interview: Types.ObjectId;
  application: Types.ObjectId;
  interviewer: Types.ObjectId;
  criteria: ICriterion[];
  weightedScore: number;
  note: string;
  submittedAt: Date;
  createdAt: Date;
}

const criterionSchema = new Schema<ICriterion>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    weight: { type: Number, required: true, min: 1, max: 5 },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const scorecardSchema = new Schema<IScorecard>(
  {
    interview: {
      type: Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    interviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    criteria: {
      type: [criterionSchema],
      required: true,
      validate: {
        validator: (value: ICriterion[]) =>
          value.length > 0 && value.length <= 8,
        message: "Provide between 1 and 8 criteria",
      },
    },
    weightedScore: { type: Number, required: true, min: 1, max: 5 },
    note: { type: String, default: "", maxlength: 4000 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

scorecardSchema.index({ interview: 1 }, { unique: true });
scorecardSchema.index({ application: 1, submittedAt: -1 });
scorecardSchema.index({ interviewer: 1, submittedAt: -1 });

export const Scorecard: Model<IScorecard> =
  (models.Scorecard as Model<IScorecard>) ||
  model<IScorecard>("Scorecard", scorecardSchema);

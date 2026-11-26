import { z } from "zod";
import {
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  OFFER_STATUSES,
  QUESTION_TYPES,
  REJECTION_REASONS,
  ROLES,
  SOURCES,
  STAGES,
} from "@/lib/constants";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email")
  .max(160);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters").max(100),
  role: z.enum(["recruiter", "interviewer"]).default("recruiter"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const questionSchema = z.object({
  prompt: z.string().trim().min(3).max(240),
  required: z.boolean().default(false),
  type: z.enum(QUESTION_TYPES).default("text"),
});

export const createJobSchema = z.object({
  title: z.string().trim().min(3, "Enter a job title").max(140),
  description: z.string().trim().min(40, "Add a fuller description").max(12000),
  department: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(120),
  employmentType: z.enum(EMPLOYMENT_TYPES).default("full-time"),
  status: z.enum(JOB_STATUSES).default("draft"),
  questions: z.array(questionSchema).max(10).default([]),
});

export const updateJobSchema = createJobSchema.partial();

export const applySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: emailSchema,
  resumeUrl: z.string().trim().url("Enter a valid resume URL").max(500),
  source: z.enum(SOURCES).default("careers-page"),
  answers: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(240),
        answer: z.string().trim().min(1, "Answer every required question").max(2000),
      }),
    )
    .max(10)
    .default([]),
});

export const stageSchema = z.object({
  stage: z.enum(STAGES),
  reason: z.string().trim().max(300).default(""),
});

export const tagSchema = z.object({
  tag: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  action: z.enum(["add", "remove"]).default("add"),
});

export const interviewSchema = z.object({
  interviewerId: z.string().min(1, "Choose an interviewer"),
  scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  durationMinutes: z.number().int().min(15).max(240).default(45),
  note: z.string().trim().max(2000).default(""),
});

export const criterionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  weight: z.number().int().min(1).max(5),
  rating: z.number().int().min(1).max(5),
});

export const scorecardSchema = z.object({
  criteria: z.array(criterionSchema).min(1).max(8),
  note: z.string().trim().max(4000).default(""),
});

export const offerSchema = z.object({
  salary: z.number().int().min(1, "Enter an annual salary"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  note: z.string().trim().max(2000).default(""),
});

export const offerStatusSchema = z.object({
  status: z.enum(OFFER_STATUSES),
  note: z.string().trim().max(2000).default(""),
});

export const rejectionSchema = z.object({
  reason: z.enum(REJECTION_REASONS),
});

export const roleSchema = z.object({ role: z.enum(ROLES) });

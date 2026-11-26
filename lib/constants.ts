export const ROLES = ["recruiter", "interviewer", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["recruiter", "admin"];

export const JOB_STATUSES = ["draft", "open", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const STAGES = [
  "applied",
  "screen",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_ORDER: Record<Stage, number> = {
  applied: 0,
  screen: 1,
  interview: 2,
  offer: 3,
  hired: 4,
  rejected: 99,
};

export const ACTIVE_STAGES: Stage[] = [
  "applied",
  "screen",
  "interview",
  "offer",
  "hired",
];

export const SOURCES = [
  "careers-page",
  "referral",
  "linkedin",
  "job-board",
  "outbound",
] as const;
export type Source = (typeof SOURCES)[number];

export const REJECTION_REASONS = [
  "Not enough experience",
  "Culture fit",
  "Compensation mismatch",
  "Position filled",
  "Interview no-show",
  "Other",
] as const;

export const QUESTION_TYPES = ["text", "textarea", "url"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const OFFER_STATUSES = ["draft", "sent", "accepted", "declined"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const MAX_PAGE_SIZE = 100;
export const MAX_QUESTIONS = 10;
export const MAX_TAGS = 20;
export const MAX_STAGE_HISTORY = 30;

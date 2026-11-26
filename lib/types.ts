export type { Role, Stage } from "@/lib/constants";

import type {
  EmploymentType,
  InterviewStatus,
  JobStatus,
  OfferStatus,
  QuestionType,
  Role,
  Source,
  Stage,
} from "@/lib/constants";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type QuestionDTO = {
  id: string;
  prompt: string;
  required: boolean;
  type: QuestionType;
};

export type JobDTO = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  status: JobStatus;
  description?: string;
  questions: QuestionDTO[];
  applicantsCount: number;
  createdAt: string;
};

export type ApplicationListItem = {
  id: string;
  name: string;
  email: string;
  source: Source;
  stage: Stage;
  appliedAt: string;
  jobId: string;
  jobTitle: string;
  tags: string[];
  rejectionReason: string;
};

export type ApplicationDetail = ApplicationListItem & {
  resumeUrl: string;
  answers: Array<{ question: string; answer: string }>;
  stageHistory: Array<{
    from: string | null;
    to: string;
    reason: string;
    actor: string;
    at: string;
  }>;
  interviews: InterviewDTO[];
  scorecards: ScorecardDTO[];
  offer: OfferDTO | null;
  activity: ActivityDTO[];
};

export type ActivityDTO = {
  id: string;
  actor: string;
  type: string;
  message: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type InterviewDTO = {
  id: string;
  applicationId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  interviewerId: string;
  interviewerName: string;
  scheduledAt: string;
  durationMinutes: number;
  note: string;
  status: InterviewStatus;
  hasScorecard: boolean;
};

export type ScorecardDTO = {
  id: string;
  interviewId: string;
  criteria: Array<{ name: string; weight: number; rating: number }>;
  weightedScore: number;
  note: string;
  submittedAt: string;
  interviewerName: string;
};

export type OfferDTO = {
  id: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  salary: number;
  startDate: string;
  status: OfferStatus;
  note: string;
  createdAt: string;
};

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
};

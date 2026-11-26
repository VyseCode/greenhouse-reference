import { Types } from "mongoose";
import { pagination } from "@/lib/api";
import {
  ACTIVE_STAGES,
  JOB_STATUSES,
  SOURCES,
  STAGES,
  type Source,
  type Stage,
} from "@/lib/constants";
import type {
  ActivityDTO,
  ApplicationDetail,
  ApplicationListItem,
  InterviewDTO,
  JobDTO,
  OfferDTO,
  Paginated,
  ScorecardDTO,
  UserDTO,
} from "@/lib/types";
import { Activity } from "@/models/Activity";
import { Application } from "@/models/Application";
import { Interview } from "@/models/Interview";
import { Job } from "@/models/Job";
import { Offer } from "@/models/Offer";
import { Scorecard } from "@/models/Scorecard";
import { User } from "@/models/User";

type LeanJob = {
  _id: Types.ObjectId;
  title: string;
  department: string;
  location: string;
  employmentType: JobDTO["employmentType"];
  status: JobDTO["status"];
  description?: string;
  applicantsCount: number;
  createdAt: Date;
  questions?: Array<{
    _id: Types.ObjectId;
    prompt: string;
    required: boolean;
    type: JobDTO["questions"][number]["type"];
  }>;
};

type LeanApplication = {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  name: string;
  email: string;
  source: ApplicationListItem["source"];
  stage: ApplicationListItem["stage"];
  appliedAt: Date;
  tags: string[];
  rejectionReason: string;
  resumeUrl?: string;
  answers?: Array<{ question: string; answer: string }>;
  stageHistory?: Array<{
    from: string | null;
    to: string;
    reason: string;
    actor: string;
    at: Date;
  }>;
};

type LeanInterview = {
  _id: Types.ObjectId;
  application: Types.ObjectId;
  job: Types.ObjectId;
  interviewer: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  note: string;
  status: InterviewDTO["status"];
};

type LeanOffer = {
  _id: Types.ObjectId;
  application: Types.ObjectId;
  job: Types.ObjectId;
  salary: number;
  startDate: string;
  status: OfferDTO["status"];
  note: string;
  createdAt: Date;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ids(values: Types.ObjectId[]) {
  return [...new Set(values.map((v) => v.toString()))].map(
    (v) => new Types.ObjectId(v),
  );
}

async function jobTitles(values: Types.ObjectId[]) {
  const docs = (await Job.find({ _id: { $in: ids(values) } })
    .select("title department")
    .lean()) as unknown as Array<{ _id: Types.ObjectId; title: string; department: string }>;
  return new Map(docs.map((d) => [d._id.toString(), d]));
}

async function userNames(values: Types.ObjectId[]) {
  if (!values.length) return new Map<string, string>();
  const docs = (await User.find({ _id: { $in: ids(values) } })
    .select("name")
    .lean()) as unknown as Array<{ _id: Types.ObjectId; name: string }>;
  return new Map(docs.map((d) => [d._id.toString(), d.name]));
}

function toJob(doc: LeanJob, full = false): JobDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    department: doc.department,
    location: doc.location,
    employmentType: doc.employmentType,
    status: doc.status,
    applicantsCount: doc.applicantsCount ?? 0,
    createdAt: doc.createdAt.toISOString(),
    questions: (doc.questions ?? []).map((q) => ({
      id: q._id.toString(),
      prompt: q.prompt,
      required: q.required,
      type: q.type,
    })),
    ...(full ? { description: doc.description ?? "" } : {}),
  };
}

export async function listJobs(
  params: URLSearchParams,
  staff: boolean,
): Promise<Paginated<JobDTO>> {
  const { page, limit, skip } = pagination(params, 12);
  const filter: Record<string, unknown> = {};
  const q = (params.get("q") ?? "").trim();
  const department = (params.get("department") ?? "").trim();
  const status = params.get("status") ?? "";

  if (staff) {
    if (JOB_STATUSES.includes(status as JobDTO["status"])) filter.status = status;
  } else {
    filter.status = "open";
  }
  if (department) filter.department = department;
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: regex }, { department: regex }, { location: regex }];
  }

  const sort: Record<string, 1 | -1> =
    params.get("sort") === "title" ? { title: 1 } : { createdAt: -1 };
  const [docs, total] = await Promise.all([
    Job.find(filter)
      .select("title department location employmentType status applicantsCount createdAt")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    items: (docs as unknown as LeanJob[]).map((doc) => toJob(doc)),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getJob(id: string, staff: boolean): Promise<JobDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = (await Job.findById(id).lean()) as unknown as LeanJob | null;
  if (!doc) return null;
  if (!staff && doc.status !== "open") return null;
  return toJob(doc, true);
}

export async function listApplications(
  params: URLSearchParams,
): Promise<Paginated<ApplicationListItem>> {
  const { page, limit, skip } = pagination(params, 20);
  const filter: Record<string, unknown> = {};
  const q = (params.get("q") ?? "").trim();
  const stage = params.get("stage") ?? "";
  const job = params.get("job") ?? "";
  const source = params.get("source") ?? "";
  const tag = params.get("tag") ?? "";

  if (STAGES.includes(stage as ApplicationListItem["stage"])) filter.stage = stage;
  if (Types.ObjectId.isValid(job)) filter.job = new Types.ObjectId(job);
  if (SOURCES.includes(source as ApplicationListItem["source"])) filter.source = source;
  if (tag) filter.tags = tag;
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const sortOption = params.get("sort") ?? "newest";
  const sort: Record<string, 1 | -1> =
    sortOption === "oldest"
      ? { appliedAt: 1 }
      : sortOption === "name"
        ? { name: 1 }
        : { appliedAt: -1 };

  const [docs, total] = await Promise.all([
    Application.find(filter)
      .select("job name email source stage appliedAt tags rejectionReason")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  const jobs = await jobTitles((docs as unknown as LeanApplication[]).map((d) => d.job));
  return {
    items: (docs as unknown as LeanApplication[]).map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      source: doc.source,
      stage: doc.stage,
      appliedAt: doc.appliedAt.toISOString(),
      jobId: doc.job.toString(),
      jobTitle: jobs.get(doc.job.toString())?.title ?? "Unknown role",
      tags: doc.tags ?? [],
      rejectionReason: doc.rejectionReason ?? "",
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function listActivity(
  applicationId: string,
  page = 1,
  limit = 20,
): Promise<Paginated<ActivityDTO>> {
  const safePage = Number.isFinite(page) && page >= 1 ? page : 1;
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const filter = { application: new Types.ObjectId(applicationId) };
  const [docs, total] = await Promise.all([
    Activity.find(filter)
      .select("actor type message meta createdAt")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Activity.countDocuments(filter),
  ]);
  return {
    items: (docs as unknown as Array<{
      _id: Types.ObjectId;
      actor: string;
      type: string;
      message: string;
      meta: Record<string, unknown>;
      createdAt: Date;
    }>).map((doc) => ({
      id: doc._id.toString(),
      actor: doc.actor,
      type: doc.type,
      message: doc.message,
      meta: doc.meta ?? {},
      createdAt: doc.createdAt.toISOString(),
    })),
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.ceil(total / safeLimit),
  };
}

export async function getApplicationDetail(
  id: string,
  staff: boolean,
): Promise<ApplicationDetail | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = (await Application.findById(id).lean()) as unknown as LeanApplication | null;
  if (!doc) return null;

  const job = (await Job.findById(doc.job)
    .select("title")
    .lean()) as unknown as { title: string } | null;

  const interviewDocs = (await Interview.find({ application: doc._id })
    .select("application job interviewer scheduledAt durationMinutes note status")
    .sort({ scheduledAt: -1 })
    .limit(50)
    .lean()) as unknown as LeanInterview[];

  const scorecardDocs = (await Scorecard.find({ application: doc._id })
    .select("interview criteria weightedScore note submittedAt interviewer")
    .sort({ submittedAt: -1 })
    .limit(50)
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    interview: Types.ObjectId;
    criteria: ScorecardDTO["criteria"];
    weightedScore: number;
    note: string;
    submittedAt: Date;
    interviewer: Types.ObjectId;
  }>;

  const offerDoc = (await Offer.findOne({ application: doc._id })
    .select("application job salary startDate status note createdAt")
    .lean()) as unknown as LeanOffer | null;

  const interviewers = await userNames(interviewDocs.map((iv) => iv.interviewer));
  const activity = await listActivity(id, 1, 12);

  const interviews: InterviewDTO[] = interviewDocs.map((iv) => ({
    id: iv._id.toString(),
    applicationId: iv.application.toString(),
    candidateName: doc.name,
    jobId: iv.job.toString(),
    jobTitle: job?.title ?? "Unknown role",
    interviewerId: iv.interviewer.toString(),
    interviewerName: interviewers.get(iv.interviewer.toString()) ?? "Unknown",
    scheduledAt: iv.scheduledAt.toISOString(),
    durationMinutes: iv.durationMinutes,
    note: iv.note,
    status: iv.status,
    hasScorecard: scorecardDocs.some((sc) => sc.interview.toString() === iv._id.toString()),
  }));

  const scorecards: ScorecardDTO[] = scorecardDocs.map((sc) => ({
    id: sc._id.toString(),
    interviewId: sc.interview.toString(),
    criteria: sc.criteria,
    weightedScore: sc.weightedScore,
    note: sc.note,
    submittedAt: sc.submittedAt.toISOString(),
    interviewerName: interviewers.get(sc.interviewer.toString()) ?? "Unknown",
  }));

  const offer: OfferDTO | null = offerDoc
    ? {
        id: offerDoc._id.toString(),
        applicationId: offerDoc.application.toString(),
        candidateName: doc.name,
        jobTitle: job?.title ?? "Unknown role",
        salary: offerDoc.salary,
        startDate: offerDoc.startDate,
        status: offerDoc.status,
        note: offerDoc.note,
        createdAt: offerDoc.createdAt.toISOString(),
      }
    : null;

  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    source: doc.source,
    stage: doc.stage,
    appliedAt: doc.appliedAt.toISOString(),
    jobId: doc.job.toString(),
    jobTitle: job?.title ?? "Unknown role",
    tags: doc.tags ?? [],
    rejectionReason: doc.rejectionReason ?? "",
    resumeUrl: staff ? doc.resumeUrl ?? "" : "",
    answers: staff ? doc.answers ?? [] : [],
    stageHistory: (doc.stageHistory ?? []).map((event) => ({
      from: event.from,
      to: event.to,
      reason: event.reason,
      actor: event.actor,
      at: new Date(event.at).toISOString(),
    })),
    interviews: staff ? interviews : [],
    scorecards: staff ? scorecards : [],
    offer: staff ? offer : null,
    activity: staff ? activity.items : [],
  };
}

export async function listInterviews(
  params: URLSearchParams,
  viewerId: string,
  isStaff: boolean,
): Promise<Paginated<InterviewDTO>> {
  const { page, limit, skip } = pagination(params, 20);
  const filter: Record<string, unknown> = {};
  if (!isStaff) filter.interviewer = new Types.ObjectId(viewerId);
  const status = params.get("status") ?? "";
  if (["scheduled", "completed", "cancelled"].includes(status)) filter.status = status;

  const [docs, total] = await Promise.all([
    Interview.find(filter)
      .select("application job interviewer scheduledAt durationMinutes note status")
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Interview.countDocuments(filter),
  ]);
  const interviews = docs as unknown as LeanInterview[];
  const [applications, jobs, users, scorecards] = await Promise.all([
    Application.find({ _id: { $in: ids(interviews.map((iv) => iv.application)) } })
      .select("name")
      .lean(),
    Job.find({ _id: { $in: ids(interviews.map((iv) => iv.job)) } })
      .select("title")
      .lean(),
    User.find({ _id: { $in: ids(interviews.map((iv) => iv.interviewer)) } })
      .select("name")
      .lean(),
    Scorecard.find({ interview: { $in: ids(interviews.map((iv) => iv._id)) } })
      .select("interview")
      .lean(),
  ]);
  const appNames = new Map(
    (applications as unknown as Array<{ _id: Types.ObjectId; name: string }>).map((a) => [
      a._id.toString(),
      a.name,
    ]),
  );
  const jobNames = new Map(
    (jobs as unknown as Array<{ _id: Types.ObjectId; title: string }>).map((j) => [
      j._id.toString(),
      j.title,
    ]),
  );
  const userNamesMap = new Map(
    (users as unknown as Array<{ _id: Types.ObjectId; name: string }>).map((u) => [
      u._id.toString(),
      u.name,
    ]),
  );
  const scored = new Set(
    (scorecards as unknown as Array<{ interview: Types.ObjectId }>).map((s) =>
      s.interview.toString(),
    ),
  );

  return {
    items: interviews.map((iv) => ({
      id: iv._id.toString(),
      applicationId: iv.application.toString(),
      candidateName: appNames.get(iv.application.toString()) ?? "Unknown candidate",
      jobId: iv.job.toString(),
      jobTitle: jobNames.get(iv.job.toString()) ?? "Unknown role",
      interviewerId: iv.interviewer.toString(),
      interviewerName: userNamesMap.get(iv.interviewer.toString()) ?? "Unknown",
      scheduledAt: iv.scheduledAt.toISOString(),
      durationMinutes: iv.durationMinutes,
      note: iv.note,
      status: iv.status,
      hasScorecard: scored.has(iv._id.toString()),
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getInterview(
  id: string,
  viewerId: string,
  isStaff: boolean,
): Promise<{
  interview: InterviewDTO | null;
  assigned: boolean;
  candidateEmail: string;
}> {
  if (!Types.ObjectId.isValid(id)) return { interview: null, assigned: false, candidateEmail: "" };
  const doc = (await Interview.findById(id).lean()) as unknown as LeanInterview | null;
  if (!doc) return { interview: null, assigned: false, candidateEmail: "" };
  const assigned = doc.interviewer.toString() === viewerId;
  if (!isStaff && !assigned) return { interview: null, assigned: false, candidateEmail: "" };

  const [application, job, user, scorecard] = await Promise.all([
    Application.findById(doc.application).select("name email").lean(),
    Job.findById(doc.job).select("title").lean(),
    User.findById(doc.interviewer).select("name").lean(),
    Scorecard.findOne({ interview: doc._id }).select("_id").lean(),
  ]);
  const app = application as unknown as { name: string; email: string } | null;
  const jobDoc = job as unknown as { title: string } | null;
  const userDoc = user as unknown as { name: string } | null;

  return {
    interview: {
      id: doc._id.toString(),
      applicationId: doc.application.toString(),
      candidateName: app?.name ?? "Unknown candidate",
      jobId: doc.job.toString(),
      jobTitle: jobDoc?.title ?? "Unknown role",
      interviewerId: doc.interviewer.toString(),
      interviewerName: userDoc?.name ?? "Unknown",
      scheduledAt: doc.scheduledAt.toISOString(),
      durationMinutes: doc.durationMinutes,
      note: doc.note,
      status: doc.status,
      hasScorecard: Boolean(scorecard),
    },
    assigned,
    candidateEmail: app?.email ?? "",
  };
}

export async function listOffers(params: URLSearchParams): Promise<Paginated<OfferDTO>> {
  const { page, limit, skip } = pagination(params, 20);
  const filter: Record<string, unknown> = {};
  const status = params.get("status") ?? "";
  if (["draft", "sent", "accepted", "declined"].includes(status)) filter.status = status;
  const job = params.get("job") ?? "";
  if (Types.ObjectId.isValid(job)) filter.job = new Types.ObjectId(job);

  const [docs, total] = await Promise.all([
    Offer.find(filter)
      .select("application job salary startDate status note createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Offer.countDocuments(filter),
  ]);
  const offers = docs as unknown as LeanOffer[];
  const [applications, jobs] = await Promise.all([
    Application.find({ _id: { $in: ids(offers.map((o) => o.application)) } })
      .select("name")
      .lean(),
    Job.find({ _id: { $in: ids(offers.map((o) => o.job)) } })
      .select("title")
      .lean(),
  ]);
  const appNames = new Map(
    (applications as unknown as Array<{ _id: Types.ObjectId; name: string }>).map((a) => [
      a._id.toString(),
      a.name,
    ]),
  );
  const jobNames = new Map(
    (jobs as unknown as Array<{ _id: Types.ObjectId; title: string }>).map((j) => [
      j._id.toString(),
      j.title,
    ]),
  );
  return {
    items: offers.map((o) => ({
      id: o._id.toString(),
      applicationId: o.application.toString(),
      candidateName: appNames.get(o.application.toString()) ?? "Unknown candidate",
      jobTitle: jobNames.get(o.job.toString()) ?? "Unknown role",
      salary: o.salary,
      startDate: o.startDate,
      status: o.status,
      note: o.note,
      createdAt: o.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function listInterviewers(): Promise<UserDTO[]> {
  const docs = (await User.find({ role: "interviewer" })
    .select("name email role title")
    .sort({ name: 1 })
    .limit(100)
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: UserDTO["role"];
    title: string;
  }>;
  return docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    email: d.email,
    role: d.role,
    title: d.title,
  }));
}

export async function getDashboardStats() {
  const [openJobs, activeCandidates, upcomingInterviews, pendingOffers, recent] =
    await Promise.all([
      Job.countDocuments({ status: "open" }),
      Application.countDocuments({ stage: { $in: ACTIVE_STAGES } }),
      Interview.countDocuments({ status: "scheduled", scheduledAt: { $gte: new Date() } }),
      Offer.countDocuments({ status: { $in: ["draft", "sent"] } }),
      Application.find()
        .select("name stage appliedAt job")
        .sort({ appliedAt: -1 })
        .limit(6)
        .lean(),
    ]);
  const jobs = await jobTitles(
    (recent as unknown as LeanApplication[]).map((a) => a.job),
  );
  return {
    openJobs,
    activeCandidates,
    upcomingInterviews,
    pendingOffers,
    recent: (recent as unknown as LeanApplication[]).map((a) => ({
      id: a._id.toString(),
      name: a.name,
      stage: a.stage,
      appliedAt: a.appliedAt.toISOString(),
      jobTitle: jobs.get(a.job.toString())?.title ?? "Unknown role",
    })),
  };
}

export async function getFunnel(jobId?: string) {
  const match: Record<string, unknown> = {};
  if (jobId && Types.ObjectId.isValid(jobId)) match.job = new Types.ObjectId(jobId);
  const docs = (await Application.aggregate([
    { $match: match },
    { $group: { _id: "$stage", count: { $sum: 1 } } },
  ])) as Array<{ _id: Stage; count: number }>;
  const counts = new Map(docs.map((d) => [d._id, d.count]));
  return STAGES.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
}

export async function getTimeToHire(jobId?: string) {
  const match: Record<string, unknown> = { stage: "hired" };
  if (jobId && Types.ObjectId.isValid(jobId)) match.job = new Types.ObjectId(jobId);
  const docs = (await Application.aggregate([
    { $match: match },
    { $unwind: "$stageHistory" },
    { $match: { "stageHistory.to": "hired" } },
    {
      $lookup: {
        from: "jobs",
        localField: "job",
        foreignField: "_id",
        as: "jobDoc",
      },
    },
    {
      $project: {
        appliedAt: 1,
        hiredAt: "$stageHistory.at",
        department: { $arrayElemAt: ["$jobDoc.department", 0] },
        jobTitle: { $arrayElemAt: ["$jobDoc.title", 0] },
      },
    },
    {
      $group: {
        _id: { department: "$department", jobTitle: "$jobTitle" },
        avgDays: {
          $avg: {
            $dateDiff: { startDate: "$appliedAt", endDate: "$hiredAt", unit: "day" },
          },
        },
        hires: { $sum: 1 },
      },
    },
    { $sort: { "_id.jobTitle": 1 } },
    {
      $project: {
        _id: 0,
        department: "$_id.department",
        jobTitle: "$_id.jobTitle",
        hires: 1,
        avgDays: { $round: ["$avgDays", 1] },
      },
    },
  ])) as Array<{ department: string; jobTitle: string; hires: number; avgDays: number }>;
  const totalHires = docs.reduce((sum, d) => sum + d.hires, 0);
  const weighted = docs.reduce((sum, d) => sum + d.avgDays * d.hires, 0);
  return {
    overallAvgDays: totalHires ? Math.round((weighted / totalHires) * 10) / 10 : 0,
    totalHires,
    byJob: docs,
  };
}

export async function getSources(jobId?: string) {
  const match: Record<string, unknown> = {};
  if (jobId && Types.ObjectId.isValid(jobId)) match.job = new Types.ObjectId(jobId);
  const docs = (await Application.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$source",
        total: { $sum: 1 },
        hires: { $sum: { $cond: [{ $eq: ["$stage", "hired"] }, 1, 0] } },
        interviews: {
          $sum: {
            $cond: [{ $in: ["$stage", ["interview", "offer", "hired"]] }, 1, 0],
          },
        },
      },
    },
    { $sort: { total: -1 } },
  ])) as Array<{ _id: Source; total: number; hires: number; interviews: number }>;
  return SOURCES.map((source) => {
    const found = docs.find((d) => d._id === source);
    const total = found?.total ?? 0;
    return {
      source,
      total,
      interviews: found?.interviews ?? 0,
      hires: found?.hires ?? 0,
      hireRate: total ? Math.round(((found?.hires ?? 0) / total) * 1000) / 10 : 0,
    };
  }).filter((row) => row.total > 0);
}

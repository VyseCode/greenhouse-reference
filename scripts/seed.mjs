import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/greenhouse_ref";

const DEFAULTS = {
  roles: ["recruiter", "interviewer", "admin"],
  jobStatuses: ["draft", "open", "closed"],
  stages: ["applied", "screen", "interview", "offer", "hired", "rejected"],
  sources: ["careers-page", "referral", "linkedin", "job-board", "outbound"],
  employmentTypes: ["full-time", "part-time", "contract", "internship"],
  interviewStatuses: ["scheduled", "completed", "cancelled"],
  offerStatuses: ["draft", "sent", "accepted", "declined"],
};

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: DEFAULTS.roles, default: "recruiter" },
    title: { type: String, default: "" },
  },
  { timestamps: true },
);
userSchema.index({ role: 1, createdAt: -1 });

const jobSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    department: String,
    location: String,
    employmentType: { type: String, enum: DEFAULTS.employmentTypes },
    status: { type: String, enum: DEFAULTS.jobStatuses, default: "draft" },
    questions: [
      { prompt: String, required: Boolean, type: { type: String, default: "text" } },
    ],
    createdBy: mongoose.Schema.Types.ObjectId,
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ department: 1, status: 1 });
jobSchema.index({ employmentType: 1, status: 1 });
jobSchema.index({ title: "text", description: "text", department: "text", location: "text" });

const applicationSchema = new mongoose.Schema(
  {
    job: mongoose.Schema.Types.ObjectId,
    name: String,
    email: { type: String, lowercase: true },
    resumeUrl: String,
    answers: [{ question: String, answer: String, _id: false }],
    source: { type: String, enum: DEFAULTS.sources },
    stage: { type: String, enum: DEFAULTS.stages, default: "applied" },
    rejectionReason: { type: String, default: "" },
    tags: [String],
    stageHistory: [
      {
        from: { type: String, default: null },
        to: String,
        reason: String,
        actor: String,
        at: Date,
        _id: false,
      },
    ],
    appliedAt: Date,
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
applicationSchema.index({ name: "text", email: "text", tags: "text" });

const interviewSchema = new mongoose.Schema(
  {
    application: mongoose.Schema.Types.ObjectId,
    job: mongoose.Schema.Types.ObjectId,
    interviewer: mongoose.Schema.Types.ObjectId,
    scheduledAt: Date,
    durationMinutes: Number,
    note: String,
    status: { type: String, enum: DEFAULTS.interviewStatuses },
  },
  { timestamps: true },
);
interviewSchema.index({ application: 1, scheduledAt: -1 });
interviewSchema.index({ interviewer: 1, scheduledAt: 1 });
interviewSchema.index({ status: 1, scheduledAt: 1 });
interviewSchema.index({ job: 1, scheduledAt: -1 });

const scorecardSchema = new mongoose.Schema(
  {
    interview: mongoose.Schema.Types.ObjectId,
    application: mongoose.Schema.Types.ObjectId,
    interviewer: mongoose.Schema.Types.ObjectId,
    criteria: [{ name: String, weight: Number, rating: Number, _id: false }],
    weightedScore: Number,
    note: String,
    submittedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
scorecardSchema.index({ interview: 1 }, { unique: true });
scorecardSchema.index({ application: 1, submittedAt: -1 });
scorecardSchema.index({ interviewer: 1, submittedAt: -1 });

const offerSchema = new mongoose.Schema(
  {
    application: mongoose.Schema.Types.ObjectId,
    job: mongoose.Schema.Types.ObjectId,
    salary: Number,
    startDate: String,
    status: { type: String, enum: DEFAULTS.offerStatuses },
    note: String,
  },
  { timestamps: true },
);
offerSchema.index({ application: 1 }, { unique: true });
offerSchema.index({ status: 1, createdAt: -1 });
offerSchema.index({ job: 1, status: 1 });

const activitySchema = new mongoose.Schema(
  {
    application: mongoose.Schema.Types.ObjectId,
    actor: String,
    type: String,
    message: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
activitySchema.index({ application: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

const User = mongoose.model("User", userSchema);
const Job = mongoose.model("Job", jobSchema);
const Application = mongoose.model("Application", applicationSchema);
const Interview = mongoose.model("Interview", interviewSchema);
const Scorecard = mongoose.model("Scorecard", scorecardSchema);
const Offer = mongoose.model("Offer", offerSchema);
const Activity = mongoose.model("Activity", activitySchema);

let seed = 20261127;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick(arr) {
  return arr[Math.floor(rnd() * arr.length)];
}
function int(min, max) {
  return min + Math.floor(rnd() * (max - min + 1));
}
function daysAgo(days) {
  return new Date(Date.now() - days * 86400000);
}
function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000);
}

const people = [
  { name: "Dana Whitfield", email: "dana@rowan.dev", role: "admin", title: "Head of People" },
  { name: "Maya Chen", email: "maya@rowan.dev", role: "recruiter", title: "Senior Recruiter" },
  { name: "Thet Oo", email: "thet@rowan.dev", role: "recruiter", title: "Technical Recruiter" },
  { name: "Iris Novak", email: "iris@rowan.dev", role: "interviewer", title: "Staff Engineer" },
  { name: "Owen Brooks", email: "owen@rowan.dev", role: "interviewer", title: "Engineering Manager" },
  { name: "Lena Ortiz", email: "lena@rowan.dev", role: "interviewer", title: "Product Designer" },
  { name: "Ravi Menon", email: "ravi@rowan.dev", role: "interviewer", title: "Data Lead" },
  { name: "Grace Kim", email: "grace@rowan.dev", role: "interviewer", title: "Product Manager" },
  { name: "Samuel Adeyemi", email: "sam@rowan.dev", role: "interviewer", title: "Operations Lead" },
];

const jobSpecs = [
  ["Senior Backend Engineer", "Engineering", "Berlin, Germany", "full-time", "open"],
  ["Frontend Engineer, Design Systems", "Engineering", "Remote (EU)", "full-time", "open"],
  ["Staff Platform Engineer", "Engineering", "London, UK", "full-time", "open"],
  ["Product Designer", "Design", "Remote (Global)", "full-time", "open"],
  ["UX Researcher", "Design", "Amsterdam, Netherlands", "contract", "open"],
  ["Data Engineer", "Data", "Dublin, Ireland", "full-time", "open"],
  ["Analytics Engineer", "Data", "Remote (EU)", "full-time", "open"],
  ["Senior Product Manager", "Product", "Berlin, Germany", "full-time", "open"],
  ["Technical Program Manager", "Product", "London, UK", "full-time", "open"],
  ["People Operations Partner", "Operations", "Remote (EU)", "part-time", "open"],
  ["Customer Success Lead", "Operations", "Dublin, Ireland", "full-time", "draft"],
  ["Growth Marketing Manager", "Marketing", "Remote (Global)", "full-time", "draft"],
  ["Engineering Intern, Summer", "Engineering", "Berlin, Germany", "internship", "closed"],
  ["Support Specialist", "Operations", "Lisbon, Portugal", "contract", "closed"],
];

const questionSets = [
  [
    { prompt: "Why are you interested in this role?", required: true, type: "textarea" },
    { prompt: "Link to a project or portfolio you are proud of", required: false, type: "url" },
  ],
  [
    { prompt: "How many years of relevant experience do you have?", required: true, type: "text" },
    { prompt: "What draws you to our team?", required: true, type: "textarea" },
    { prompt: "Where did you hear about this opening?", required: false, type: "text" },
  ],
  [
    { prompt: "Describe a problem you solved recently", required: true, type: "textarea" },
  ],
];

function descriptionFor(title, department, location, employmentType) {
  const focus = {
    Engineering:
      "You will design and ship services that our customers rely on every day, review code carefully, and help teammates grow through thoughtful feedback.",
    Design:
      "You will turn ambiguous problems into clear, grounded interfaces, partner closely with engineering, and contribute to a calm, coherent design system.",
    Data:
      "You will build trustworthy data pipelines and models, make trade-offs explicit, and turn messy inputs into decisions the whole company can use.",
    Product:
      "You will own outcomes rather than output, talk to customers regularly, and work with design and engineering to ship small, useful increments.",
    Operations:
      "You will make the everyday work of the company smoother, document what you learn, and keep commitments to customers and teammates.",
    Marketing:
      "You will tell honest product stories, run experiments with clear hypotheses, and measure what actually changes behaviour.",
  }[department];
  return `${title}\n\nWe are hiring a ${title.toLowerCase()} to join our ${department.toLowerCase()} team in ${location}. This is a ${employmentType} position with a small, senior group that values written communication, steady delivery, and kind disagreement.\n\n${focus}\n\nWhat you will bring\n- Several years of hands-on experience in a comparable role\n- The habit of writing things down so others can build on your work\n- Comfort with ambiguity and a bias toward small, reversible decisions\n\nHow we work\nWe keep meetings light, default to asynchronous updates, and review each other's work generously. You can expect a practical interview process built around the work itself, with clear feedback at every stage.\n\nRowan is an equal opportunity employer. We welcome applicants from all backgrounds and are happy to discuss accommodations at any point in the process.`;
}

const firstNames = [
  "Amara", "Ben", "Chloe", "Diego", "Elena", "Farid", "Gita", "Hugo", "Imani", "Jonas",
  "Kaia", "Liam", "Mina", "Noah", "Priya", "Quinn", "Rosa", "Sven", "Tara", "Umar",
  "Vera", "Wes", "Xiomara", "Yusuf", "Zoe", "Aditya", "Bea", "Caleb", "Dara", "Emil",
  "Fiona", "Gabriel", "Hana", "Isaac", "Jing", "Kiran", "Lucia", "Mateo", "Nadia", "Oscar",
];
const lastNames = [
  "Ahmed", "Bauer", "Costa", "Duarte", "Evans", "Fischer", "Garcia", "Hassan", "Ito", "Jensen",
  "Khan", "Lopez", "Moreau", "Nakamura", "Okafor", "Petrov", "Rossi", "Silva", "Tan", "Ueda",
  "Vasquez", "Wagner", "Xu", "Yilmaz", "Zhang", "Andersson", "Bennett", "Chaudhry", "Dubois", "Eriksen",
];
const tagPool = [
  "strong-referral", "senior", "portfolio-reviewed", "needs-visa", "follow-up",
  "second-choice", "fast-track", "re-engage", "internal-candidate",
];
const rejectionReasons = [
  "Not enough experience",
  "Culture fit",
  "Compensation mismatch",
  "Position filled",
  "Interview no-show",
  "Other",
];

const answerTexts = [
  "I have spent the last five years building customer-facing systems and enjoy the feedback loop that comes with shipping regularly.",
  "I led a migration that cut our deploy time in half; the key was writing the rollout plan before touching code.",
  "I am looking for a team where writing and review are treated as part of the work rather than overhead.",
  "I prefer small teams with clear ownership and honest documentation.",
  "Yes — I am happy to share a portfolio and walk through a recent project in detail.",
];

function buildHistory(stage, appliedAt, recruiter, rejectionReason) {
  const events = [
    { from: null, to: "applied", reason: "", actor: "candidate", at: new Date(appliedAt) },
  ];
  const order = ["screen", "interview", "offer", "hired"];
  if (stage === "rejected") {
    const stop = int(0, 2);
    for (let i = 0; i < stop; i++) {
      events.push({
        from: order[i - 1] ?? "applied",
        to: order[i],
        reason: "",
        actor: recruiter,
        at: new Date(appliedAt.getTime() + (2 + i * 4) * 86400000),
      });
    }
    events.push({
      from: events[events.length - 1].to,
      to: "rejected",
      reason: rejectionReason,
      actor: recruiter,
      at: new Date(appliedAt.getTime() + (6 + stop * 4) * 86400000),
    });
    return events;
  }
  const target = order.indexOf(stage);
  for (let i = 0; i <= target; i++) {
    events.push({
      from: order[i - 1] ?? "applied",
      to: order[i],
      reason: "",
      actor: recruiter,
      at: new Date(appliedAt.getTime() + (2 + i * 5) * 86400000),
    });
  }
  return events;
}

async function main() {
  await mongoose.connect(URI);
  if (mongoose.connection.name !== "greenhouse_ref") {
    throw new Error(`Refusing to seed unexpected database: ${mongoose.connection.name}`);
  }

  await Promise.all([
    User.createIndexes(),
    Job.createIndexes(),
    Application.createIndexes(),
    Interview.createIndexes(),
    Scorecard.createIndexes(),
    Offer.createIndexes(),
    Activity.createIndexes(),
  ]);

  await mongoose.connection.db.dropDatabase();
  await Promise.all([
    User.createIndexes(),
    Job.createIndexes(),
    Application.createIndexes(),
    Interview.createIndexes(),
    Scorecard.createIndexes(),
    Offer.createIndexes(),
    Activity.createIndexes(),
  ]);

  const password = await bcrypt.hash("password123", 10);
  const users = await User.create(
    people.map((person) => ({ ...person, password })),
  );
  const recruiters = users.filter((u) => u.role === "recruiter" || u.role === "admin");
  const interviewers = users.filter((u) => u.role === "interviewer");

  const jobs = await Job.create(
    jobSpecs.map(([title, department, location, employmentType, status], i) => ({
      title,
      department,
      location,
      employmentType,
      status,
      description: descriptionFor(title, department, location, employmentType),
      questions: questionSets[i % questionSets.length],
      createdBy: recruiters[i % recruiters.length]._id,
    })),
  );

  const stagePlan = [
    ...Array(58).fill("applied"),
    ...Array(34).fill("screen"),
    ...Array(30).fill("interview"),
    ...Array(12).fill("offer"),
    ...Array(16).fill("hired"),
    ...Array(30).fill("rejected"),
  ];
  const usedEmails = new Set();
  const applications = [];
  const activities = [];
  const activityOwners = [];

  for (let i = 0; i < stagePlan.length; i++) {
    const stage = stagePlan[i];
    const job = jobs[i % jobs.length];
    const first = firstNames[(i * 7) % firstNames.length];
    const last = lastNames[(i * 11) % lastNames.length];
    let email = `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@example.com`;
      suffix += 1;
    }
    usedEmails.add(email);
    const appliedAt = daysAgo(int(1, 130));
    const recruiter = pick(recruiters).name;
    const rejectionReason = stage === "rejected" ? pick(rejectionReasons) : "";
    const history = buildHistory(stage, appliedAt, recruiter, rejectionReason);
    const tags = rnd() < 0.32 ? [pick(tagPool), ...(rnd() < 0.3 ? [pick(tagPool)] : [])] : [];
    const answers = job.questions.map((q) => ({
      question: q.prompt,
      answer: q.type === "url" ? `https://portfolio.example.org/${first.toLowerCase()}-${last.toLowerCase()}` : pick(answerTexts),
    }));

    applications.push({
      job: job._id,
      name: `${first} ${last}`,
      email,
      resumeUrl: `https://resumes.example.org/cv/${first.toLowerCase()}-${last.toLowerCase()}-${i}.pdf`,
      answers,
      source: pick(["careers-page", "careers-page", "referral", "linkedin", "job-board", "outbound"]),
      stage,
      rejectionReason,
      tags: [...new Set(tags)],
      stageHistory: history,
      appliedAt,
      createdAt: appliedAt,
    });

    const ownerIndex = applications.length - 1;
    activities.push({
      application: null,
      actor: "candidate",
      type: "application",
      message: `${first} ${last} applied for ${job.title}`,
      meta: { stage: "applied" },
      at: appliedAt,
    });
    activityOwners.push(ownerIndex);
    for (const event of history.slice(1)) {
      activities.push({
        application: null,
        actor: event.actor,
        type: "stage",
        message: `Moved to ${event.to}${event.reason ? `: ${event.reason}` : ""}`,
        meta: { from: event.from, to: event.to, reason: event.reason },
        at: event.at,
      });
      activityOwners.push(ownerIndex);
    }
  }

  const insertedApplications = await Application.insertMany(applications, { ordered: false });
  for (let i = 0; i < activities.length; i++) {
    activities[i].application = insertedApplications[activityOwners[i]]._id;
  }
  const appByStage = {};
  for (const app of insertedApplications) {
    appByStage[app.stage] = (appByStage[app.stage] ?? 0) + 1;
  }

  const promoted = insertedApplications.filter((a) =>
    ["interview", "offer", "hired"].includes(a.stage),
  );
  const interviews = [];
  for (let i = 0; i < 64; i++) {
    const app = promoted[i % promoted.length];
    const interviewer = interviewers[i % interviewers.length];
    const status = rnd() < 0.78 ? "completed" : rnd() < 0.6 ? "scheduled" : "cancelled";
    const scheduledAt =
      status === "scheduled" ? daysFromNow(int(1, 21)) : daysAgo(int(2, 70));
    interviews.push({
      application: app._id,
      job: app.job,
      interviewer: interviewer._id,
      scheduledAt,
      durationMinutes: pick([30, 45, 45, 60]),
      note: pick([
        "Focus on system design and trade-off reasoning.",
        "Portfolio walkthrough followed by team questions.",
        "Pairing session on a small realistic task.",
      ]),
      status,
    });
  }
  const insertedInterviews = await Interview.insertMany(interviews, { ordered: false });

  const criteriaTemplates = [
    [
      { name: "Problem solving", weight: 3 },
      { name: "Communication", weight: 2 },
      { name: "Domain expertise", weight: 3 },
      { name: "Collaboration", weight: 2 },
    ],
    [
      { name: "Craft", weight: 3 },
      { name: "Product thinking", weight: 2 },
      { name: "Collaboration", weight: 2 },
    ],
  ];
  const scorecards = [];
  const scoredInterviews = insertedInterviews.filter((iv) => iv.status === "completed");
  for (let i = 0; i < Math.min(42, scoredInterviews.length); i++) {
    const iv = scoredInterviews[i];
    const criteria = criteriaTemplates[i % criteriaTemplates.length].map((c) => ({
      ...c,
      rating: int(2, 5),
    }));
    const weightSum = criteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore =
      criteria.reduce((sum, c) => sum + c.weight * c.rating, 0) / weightSum;
    scorecards.push({
      interview: iv._id,
      application: iv.application,
      interviewer: iv.interviewer,
      criteria,
      weightedScore: Math.round(weightedScore * 100) / 100,
      note: pick([
        "Clear thinker, grounded examples, would work well with the team.",
        "Strong technical depth; would like to probe more on collaboration.",
        "Excellent communication and a careful approach to trade-offs.",
        "Solid fundamentals but limited exposure to the scale we operate at.",
      ]),
      submittedAt: new Date(iv.scheduledAt.getTime() + 86400000),
    });
  }
  await Scorecard.insertMany(scorecards, { ordered: false });

  const offerApps = insertedApplications.filter((a) => ["offer", "hired"].includes(a.stage));
  const offers = offerApps.map((app) => ({
    application: app._id,
    job: app.job,
    salary: int(7, 16) * 10000 + 5000,
    startDate: daysFromNow(int(14, 60)).toISOString().slice(0, 10),
    status: app.stage === "hired" ? "accepted" : pick(["draft", "sent", "sent"]),
    note: pick([
      "Approved by finance, sent to candidate.",
      "Pending start date confirmation.",
      "Verbal agreement reached; formal letter on its way.",
    ]),
    createdAt: daysAgo(int(1, 30)),
  }));
  await Offer.insertMany(offers, { ordered: false });

  const jobCounts = new Map();
  for (const app of insertedApplications) {
    jobCounts.set(app.job.toString(), (jobCounts.get(app.job.toString()) ?? 0) + 1);
  }
  await Promise.all(
    jobs.map((job) =>
      Job.updateOne(
        { _id: job._id },
        { $set: { applicantsCount: jobCounts.get(job._id.toString()) ?? 0 } },
      ),
    ),
  );

  const activityWithApps = activities.filter((a) => a.application);
  await Activity.insertMany(
    activityWithApps.map(({ at, ...rest }) => ({ ...rest, createdAt: at })),
    { ordered: false },
  );

  console.log(
    `Seeded ${users.length} users, ${jobs.length} jobs, ${insertedApplications.length} applications, ` +
      `${insertedInterviews.length} interviews, ${scorecards.length} scorecards, ${offers.length} offers, ` +
      `${activityWithApps.length} activity entries.`,
  );
  console.log(`Stage counts: ${JSON.stringify(appByStage)}`);
  console.log("Demo logins (password123): dana@rowan.dev (admin), maya@rowan.dev (recruiter), iris@rowan.dev (interviewer)");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

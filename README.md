# Rowan — Applicant Tracking System

A **reference implementation inspired by Greenhouse**. Rowan is a complete, self-contained applicant tracking workspace built with Next.js 16.4.6 (App Router), React 19, Tailwind 4, TypeScript, MongoDB/Mongoose, bcryptjs, `jose` JWT cookies, and zod.

The domain logic is real: jobs have custom application questions and a publish state machine; candidates move through a guarded pipeline with reasons; interviews are assigned to interviewers; scorecards are weighted and deduplicated; offers change candidate state; reports are computed in MongoDB aggregations. **No real external service is contacted** — see [Simulation boundary](#simulation-boundary).

## Features

- **Roles** — admin, recruiter, interviewer. Recruiters/admins manage jobs, candidates, interviews and offers. Interviewers see only their assigned interviews and can submit scorecards.
- **Jobs** — draft/open/closed lifecycle, department/location/employment type, capped custom application questions, atomic applicant counters, public board with search, filters, sorting and bounded pagination.
- **Applications** — public form with required-question validation, resume URL validation, duplicate and closed-job guards, source tracking, tags, search/filter/pagination.
- **Pipeline** — applied → screen → interview → offer → hired (plus rejected), board view, guarded stage moves, mandatory reasons for rejection and regression, capped stage history and a queryable activity timeline.
- **Interviews** — scheduling with an interviewer, time and duration; cancellation/completion; interviewer isolation.
- **Scorecards** — weighted criteria ratings (1–5), calculated weighted score, notes, one scorecard per interview, strict assignment checks.
- **Offers** — salary, start date, draft/sent/accepted/declined lifecycle; acceptance moves the candidate to hired, declination moves them to rejected.
- **Reports & dashboard** — funnel by stage, time-to-hire from recorded stage history, source volume and hire rate, role filter, overview metrics.
- **UI** — original "field notes" visual identity, inline SVG icon set, responsive workspace, loading/empty/error states, accessible labels and visible focus.

## Setup

Requirements: Node.js 20.9+, MongoDB 7 running locally.

```bash
npm install
cp .env.example .env.local   # adjust if needed
npm run seed                 # wipes ONLY the greenhouse_ref database
npm run dev                  # http://localhost:3000
```

Environment (`.env.local`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/greenhouse_ref` | Database connection |
| `JWT_SECRET` | dev placeholder | HS256 secret for the session cookie — set a long random value in production |

### Seed

```bash
npm run seed
```

Creates indexes, drops only `greenhouse_ref`, then re-creates 9 users, 14 jobs, 180 applications, 64 interviews, 42 scorecards, 28 offers and 434 activity entries. It is re-runnable and deterministic. Every demo password is `password123`.

| Account | Role | Use |
| --- | --- | --- |
| `dana@rowan.dev` | admin | Full access including job deletion |
| `maya@rowan.dev` | recruiter | Daily hiring workflow |
| `iris@rowan.dev` | interviewer | Assigned interviews and scorecards only |

### Local deploy

```bash
npm run build && npm start -- -p 3237
```

## API

All list endpoints accept `page` (≥1) and `limit` (1–100, clamped). Cookies are HTTP-only; mutations require a session.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Create recruiter/interviewer account (rate limited) |
| POST | `/api/auth/login` | public | Sign in (rate limited) |
| POST | `/api/auth/logout` | session | Clear cookie |
| GET | `/api/auth/me` | session | Current user |
| GET | `/api/health` | public | Health probe |
| GET | `/api/jobs` | public | Open jobs; staff may filter by status |
| POST | `/api/jobs` | staff | Create job with questions |
| GET/PATCH/DELETE | `/api/jobs/[id]` | public GET / staff PATCH / admin DELETE | Job detail, edit, delete |
| POST | `/api/jobs/[id]/apply` | public | Apply (rate limited, idempotent by unique index) |
| GET | `/api/jobs/[id]/applications` | staff | Applications for one job |
| GET | `/api/interviewers` | staff | Interviewer picker data |
| GET | `/api/applications` | staff | Search/filter/paginate candidates |
| GET | `/api/applications/[id]` | staff | Full candidate record (no PII for non-staff) |
| POST | `/api/applications/[id]/stage` | staff | Guarded stage move with reason rules |
| POST | `/api/applications/[id]/tags` | staff | Add/remove tag |
| GET | `/api/applications/[id]/activity` | staff | Paginated timeline |
| POST | `/api/applications/[id]/interviews` | staff | Schedule an interview |
| POST | `/api/applications/[id]/offer` | staff | Create a draft offer |
| GET | `/api/interviews` | session | Own interviews for interviewers, all for staff |
| GET/PATCH | `/api/interviews/[id]` | assigned/staff | Detail, completion, cancellation |
| GET/POST | `/api/interviews/[id]/scorecard` | assigned interviewer | Read/submit weighted scorecard |
| GET | `/api/offers` | staff | Paginated offers |
| PATCH | `/api/offers/[id]` | staff | Update offer status and candidate state |
| GET | `/api/reports/funnel` | staff | Funnel counts |
| GET | `/api/reports/time-to-hire` | staff | Aggregated hire speed |
| GET | `/api/reports/sources` | staff | Source volume and hire rate |

Page routes: `/jobs`, `/jobs/[id]`, `/login`, `/register`, `/dashboard`, `/jobs/manage`, `/jobs/[id]/edit`, `/applications`, `/applications/[id]`, `/board`, `/interviews`, `/interviews/[id]`, `/offers`, `/reports`. Authenticated pages are guarded in `proxy.ts` and again in server components.

## Simulation boundary

Two external boundaries are simulated behind explicit, swappable adapters. **No payment, email, storage, map or crypto-provider API is called.**

| Boundary | Adapter | Current implementation | Swap path |
| --- | --- | --- | --- |
| Email notifications (application receipt, interview notice, offer update) | `lib/adapters/notifications.ts` (`NotificationAdapter`) | `consoleAdapter` writes a clearly marked `[notify]` line to the server log; nothing is sent | Implement `NotificationAdapter` with your provider (Resend, SES, Postmark) and export it as `notifications` |
| Resume file storage | `lib/adapters/storage.ts` (`ResumeStorageAdapter`) | Applicant supplies an http(s) URL; it is validated at the boundary and stored as a string. No file is uploaded or fetched | Implement `normalize()` to upload to S3/GCS and return a canonical signed/stored URL; export it as `resumeStorage` |

Everything else — authentication, authorization, pipeline state, scoring, calculations, reports and persistence — is genuine application code against MongoDB.

## Scalability notes

- `lib/db.ts` caches one Mongoose connection with `bufferCommands: false`, `maxPoolSize: 10`, `minPoolSize: 2`.
- Every sort/filter path has an index; unique compound indexes enforce one application per job/email, one scorecard per interview, one offer per application and unique user emails.
- `explain()` on the heaviest list query uses `job_1_appliedAt_-1` (25 keys examined for 16 returned rows); job lists use `status_1_createdAt_-1`; paginated stage queries use `stage_1_appliedAt_-1`.
- All list endpoints clamp `limit` to 1–100; embedded arrays (questions, answers, tags, stage history, criteria) are capped by validators and `$slice`.
- Counters use atomic `$inc`; stage moves use a guarded conditional update (`stage: current`) with `$push … $slice`, so concurrent moves produce one winner and one 409.
- Query helpers use `.lean()` with explicit `.select()` projections and batch related records with bounded `$in` sets; no per-row queries or unbounded `$in` arrays.
- Reports run as MongoDB aggregation pipelines (`$group`, `$lookup`, `$dateDiff`, `$cond`) rather than in application loops.
- Public endpoints (register, login, apply) have per-IP fixed-window rate limits.

## Known limitations

- Rate-limit buckets are in-memory and per process; a multi-instance deployment needs a shared store (Redis).
- Resume URLs are validated but not fetched, scanned or stored locally.
- Email is logged rather than delivered; there are no background jobs or retries.
- Job deletion is admin-only and blocked when applications exist; there is no archival workflow.
- The demo `JWT_SECRET` is a placeholder and must be replaced before deployment.
- Staff page authorization is enforced in the proxy and server pages; API authorization is additionally re-checked from the database on every request.

## Top three improvements

1. Replace the notification adapter with a real provider and add a durable outbox with retries.
2. Move rate limiting to Redis and add audit-log retention policies.
3. Add cursor pagination and archive/retention for applications and activity at higher data volumes.

## Verification

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run seed`, and a 191-assertion HTTP/page/concurrency/rate-limit matrix all pass on a clean run.

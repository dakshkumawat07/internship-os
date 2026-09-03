# docs/ARCHITECTURE.md

**Status:** Locked. Protected file — see the protected-files list in `DECISIONS.md`. Baseline: the approved architecture review and `docs/DESIGN_SYSTEM.md` (also locked, not altered here).

---

## 1. System Overview

InternshipOS is a modular-monolith web application: a React SPA talking to a single Node/TypeScript Express backend over REST, backed by one PostgreSQL database. The backend's core trust mechanism — the readiness engine — is built as an isolated, dependency-free package so its formulas stay auditable independent of the web framework around them.

```
React SPA  ──REST/JSON──▶  Express API (modular monolith)  ──Prisma──▶  PostgreSQL
```

## 2. Frontend / Backend / Database Boundaries

- The frontend talks to the backend **only** via the versioned REST API defined in `API_SPEC.md`. No direct database access from the client, ever.
- The backend talks to PostgreSQL **only** through Prisma. No raw SQL string-concatenation anywhere in the codebase.
- The database has no knowledge of HTTP or React — it is pure relational schema plus data, defined once in `prisma/schema.prisma` and described in `DOMAIN_MODEL.md`.

## 3. Modular Monolith Structure

```
apps/api/src/
├── auth/
├── profile/
├── roles-skills/      # reference data: Role, Skill, RoleSkill, SkillDecayProfile
├── evidence/          # Evidence CRUD + validation — no scoring logic
├── readiness-engine/  # thin persistence wrapper around the isolated package below
├── action-plan/
└── progress/
```

Each module owns its own routes, request validation (Zod schemas), and Prisma queries for the entities it's responsible for (see `DOMAIN_MODEL.md` § Ownership per entity). Modules communicate through explicit function calls within the same process — never through HTTP calls to each other, and never by directly querying another module's tables outside its designated read/write pattern.

## 4. Package Boundaries

Monorepo packages (see repository layout below):
- `packages/readiness-engine` — pure scoring logic. Zero dependency on Prisma, Express, or any HTTP/DB library. Depends only on `packages/shared-types`.
- `packages/shared-types` — TypeScript interfaces shared across `apps/web`, `apps/api`, and `readiness-engine`.
- `packages/config` — `ScoringConfig` defaults and shared enums (importance levels, evidence types, statuses).

## 5. Readiness-Engine Isolation

The engine is the product's trust mechanism, so its isolation is enforced structurally, not by convention:
- `packages/readiness-engine/package.json` has no `prisma` or `express` dependency — it is physically impossible to import a DB client or HTTP object into scoring logic.
- The engine exposes pure functions (`scoreEvidence`, `aggregateSkillScore`, `computeRoleReadiness`, `computePriorityScores`, `applyCoreOverride` — see `SCORING_MODEL.md` for the exact formulas) that take structured input and return structured output. No I/O, no side effects, no randomness.
- The `apps/api/src/readiness-engine` module is a thin persistence wrapper: it loads inputs via Prisma, calls the pure package, and writes the result to `ReadinessAssessment`/`SkillAssessment`/`SkillAssessmentEvidence`. The wrapper is where DB/HTTP concerns live; the package itself never sees them.

## 6. Future AI Integration Boundary

Any future AI/LLM feature (auto-suggesting skill tags, generating friendlier plan copy, etc.) sits behind a narrow `AIAssistant` interface called only from the application/API layer — **never** from inside `packages/readiness-engine`. An AI service must never write directly into `practicalDepth`, `quality`, or any score field; AI-assisted suggestions populate a separate "suggested" field a human must explicitly confirm before it becomes real, scorable data. This preserves the engine's determinism guarantee regardless of what gets added later, and keeps "no AI dependency in the readiness engine" true by construction, not by discipline alone.

## 7. Deployment Architecture

- **Frontend:** static build deployed to Vercel (or equivalent static host with preview deployments per PR).
- **Backend:** single Node process deployed as one unit to Railway or Render — the modular monolith deploys as one unit; there is no per-module deployment.
- **Database:** managed PostgreSQL on the same or an adjacent provider, referenced via `DATABASE_URL`. Provider choice is not architecturally load-bearing — it's an environment variable, not a design decision.
- **Containers:** a `Dockerfile` may exist for local parity/portability, but is not required — the chosen platforms support direct Node deployment. No Kubernetes.
- **CI:** GitHub Actions runs lint, typecheck, and the full test suite on every PR; deploy is triggered from a merge to `main` (or a manual promote step). One production environment for MVP, plus whatever preview-deployment capability the hosting platform provides for free (e.g. Vercel PR previews for the frontend).

## 8. Local Development Philosophy

Local development exists so contributors can iterate and run tests quickly — it is explicitly **not** the primary way the product is experienced or evaluated (see § 9). Setup is: clone the monorepo, install dependencies via the workspace-aware package manager, run a local Postgres instance (via `docker compose up db` for the database only, not the whole app, or a locally installed Postgres), apply Prisma migrations, seed reference data (`Role`, `Skill`, `RoleSkill`, initial `ScoringConfig`), then run the `dev` scripts for `apps/web` and `apps/api` concurrently. All of this is documented with copy-pasteable commands in the top-level `README.md` — no tribal knowledge required to get a working local environment.

## 9. Production / Public Demo Architecture

InternshipOS is recruiter-facing and portfolio-grade — the primary way anyone (a recruiter, a hiring manager, or someone evaluating the project itself) experiences the product is the **publicly deployed, always-on demo**, not a local checkout they'd need to run themselves. This has concrete consequences:
- The public deployment must have realistic seeded/demo data available (a demo account, or a public read-only walkthrough) so a visitor never lands on an empty dashboard.
- The marketing/public pages (hero, 3D, scroll story) are the first thing most evaluators see — the performance rules in `DESIGN_SYSTEM.md` § 29 apply most critically here, since this is the product's front door.
- Uptime and load-time on the public deployment matter more, for this product's purpose, than local-dev convenience — if a trade-off must be made between the two, the public demo experience wins.

## 10. Security Boundary

- **Ownership scoping:** every Evidence/ReadinessAssessment/ActionPlan/ActionItem query is scoped by the authenticated user's `studentProfileId` via one shared, tested helper — never by trusting a client-supplied ID (IDOR prevention).
- **Secrets:** `DATABASE_URL`, JWT signing secrets, and any third-party keys live in environment variables only, never committed; `.env.example` documents required keys with placeholder values.
- **Password storage:** Argon2id hashing, never logged.
- **Transport/session:** JWT access token (short-lived) + a DB-tracked refresh token (revocable), sent via the `Authorization` header — not cookies, which sidesteps CSRF entirely for MVP (see `API_SPEC.md` for token endpoint details).
- **Rate limiting:** applied to `/auth/login`, `/auth/signup`, and `/readiness/calculate`.
- **CORS:** explicit allow-list of the known frontend origin(s), never a wildcard.
- **SQL injection:** structurally avoided via Prisma-only data access.
- Full detail in `SCORING_MODEL.md` (anti-gaming) and the design review that preceded this document set.

## 11. Testing Boundary

| Boundary | Scope |
|---|---|
| Unit | `packages/readiness-engine` pure functions only — no mocking required, since there's no I/O to mock. |
| Integration | API routes + real Prisma client against a test database. |
| API | Supertest against running Express routes — auth, validation, ownership scoping, response shapes. |
| Engine regression | Named fixture scenarios from `SCORING_MODEL.md` (the worked example, the CORE-override case) — permanent, must never silently change behavior. |
| Database | Migration application and constraint enforcement (uniqueness, CHECK constraints). |
| Frontend | React Testing Library on critical components (evidence form, readiness breakdown). |
| End-to-end | Playwright, 2-3 critical-path flows only (signup to evidence to readiness to action plan to completion). |

## 12. Configuration / Environment Strategy

Two distinct kinds of configuration, deliberately not conflated:
1. **Deployment/environment configuration** — secrets and infra values (`DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CORS_ALLOWED_ORIGIN`, `NODE_ENV`) — lives in environment variables, documented in `.env.example`, never committed with real values.
2. **Domain/business configuration** — `ScoringConfig` rows, `RoleSkill` framework versions, `SkillDecayProfile` values — lives in the **database**, not environment variables, because it must be queryable, versioned, and auditable at the row level (see `SCORING_MODEL.md` § Historical Reproducibility). It is never read from an env var or a hardcoded constant inside application code.

## 13. Multi-Agent Development Boundaries

Team: **ChatGPT** (product/architecture coordination, final review) · **Claude** (architecture/design/review) · **Antigravity** (primary implementation) · **Codex** (implementation/testing/debugging/refactoring/review) · **Gemini** (independent critique/research when useful).

- `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SCORING_MODEL.md`, `docs/API_SPEC.md`, `docs/DESIGN_SYSTEM.md`, and `prisma/schema.prisma` are **protected files** — see the full list and process in `DECISIONS.md`.
- Claude and ChatGPT own and review changes to these documents. Antigravity and Codex implement against their current versions; if implementation surfaces a gap, ambiguity, or apparent error in a protected document, the correct action is to flag it back as a question or a proposed doc edit — never to silently decide and code around it.
- Gemini may be used for independent critique or research on a proposed change to any protected document before it's finalized, as an additional check — it does not implement application code in this workflow.
- Any change to `packages/readiness-engine` logic ships in the same PR as a corresponding update to `SCORING_MODEL.md`. Any change to the DB schema ships with a corresponding update to `DOMAIN_MODEL.md`. Any change to an API contract ships with a corresponding update to `API_SPEC.md`. Documentation drift is treated as a bug.

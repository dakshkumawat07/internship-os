# InternshipOS — API Specification

Status: Documentation baseline for MVP scoring integration (rev. 2 — Artifact/ArtifactKey/versioning update)
Architecture: REST API, Node.js + TypeScript + Express, Zod validation

## 1. API Principles

The API separates student-submitted facts from server-derived scoring values.

Clients may submit evidence facts and relationships, but clients do not control:

- PracticalDepth
- Quality
- EvidenceScore
- SkillScore
- readiness tier
- confidence

Scoring is performed by the server-side pure readiness engine using explicit scoring configuration and `evaluationDate`.

All request bodies are validated with strict Zod schemas: unknown/extra fields are rejected, not silently dropped, so a client attempt to smuggle a derived field produces a visible validation error rather than being quietly ignored.

## 2. Authentication and Ownership

All student resources are owner-scoped to the authenticated user. A student must never be able to read or mutate another student's evidence, profile, action plan, artifact, or assessment by changing an ID.

Authentication architecture remains JWT access tokens plus DB-tracked refresh tokens and Argon2id password hashing.

## 3. Evidence Resource

### POST /api/v1/evidence

Creates a student evidence record. Evidence is the representation — there is no separate "attach a representation" step (see §4).

Client-submitted facts may include:

- evidence type
- title/name
- description
- source URL(s)
- `activityDate` — the single date the server uses as the recency anchor for this evidence (replaces any per-field date submission).
- structured factual answers required by the selected rubric (the server stamps these with the currently-active `questionSetVersion`; the client cannot choose a version — see §6.1).
- `declaredArtifactId` — optional. The student's claim that this evidence continues/belongs to an artifact they already have on file. This is a *hint*, not authority: the server still resolves final artifact identity via `ArtifactKey` canonicalization (repository/demo URL normalization), and may confirm, override, or reject the declared link based on that resolution.
- `corroboratesArtifactId` — optional. Set when this evidence (typically a certificate/capstone) corroborates a separately-submitted practical artifact rather than representing it directly.
- skill relationships

The server validates the payload with Zod, resolves/creates the underlying `Artifact` via `ArtifactKey` matching, and assigns the final `artifactId` server-side.

The client must not submit final scoring fields, `questionSetVersion`, or `frameworkVersion` — these are server-assigned/server-resolved.

### PATCH /api/v1/evidence/:evidenceId

Updates mutable student-submitted evidence facts subject to ownership checks.

Updating an evidence item's rubric answers causes it to be re-stamped with the currently-active `questionSetVersion` (see §6.1) — it is no longer pinned to its prior version once re-answered.

A change that affects scoring creates a new assessment input state; historical assessment snapshots are not rewritten.

### GET /api/v1/evidence

Returns the authenticated student's evidence records and their current relationship to skills/artifacts.

### GET /api/v1/evidence/:evidenceId

Returns one owner-scoped evidence record.

## 4. Artifact Resource

The API represents the underlying artifact separately from Evidence where needed for identity/deduplication, but Evidence itself is the representation — there is no separate representation-attachment endpoint in MVP.

### GET /api/v1/artifacts/:artifactId

Returns one owner-scoped `Artifact`, including its `ArtifactKey` entries and the `Evidence` rows that reference it (directly via `artifactId`, and — separately — those that reference it via `corroboratesArtifactId`).

### GET /api/v1/artifacts/:artifactId/keys

Returns the `ArtifactKey` rows (canonical identities) associated with an artifact.

Artifact creation is implicit: it happens as a side effect of `POST /api/v1/evidence` when the server's `ArtifactKey` resolution does not match an existing artifact. There is no standalone `POST /api/v1/artifacts` in MVP, since evidence submission is the only path that produces artifacts.

## 5. Skill Evidence Relationship

### POST /api/v1/evidence/:evidenceId/skills

Associates evidence with one or more skills.

The relationship must identify the factual evidence relevant to each skill. A single project may therefore receive different derived scores for different skills. The server stamps the resulting `EvidenceSkill` row with the currently-active `questionSetVersion`.

### DELETE /api/v1/evidence/:evidenceId/skills/:skillId

Removes the current relationship when permitted.

## 6. Derived Scoring

When an assessment is generated, the backend calculates:

1. PracticalDepth from structured factual evidence answers.
2. Quality from structured factual evidence answers.
3. RecencyMultiplier from versioned recency configuration, `Evidence.activityDate`, and explicit evaluationDate.
4. EvidenceScore from the locked formula.
5. Artifact consolidation via `Artifact`/`ArtifactKey` identity resolution.
6. SkillScore from the Evidence Aggregation v1 model.
7. Role-level weighted readiness, using the `RoleSkill` rows for the role's `currentFrameworkVersion`.
8. CORE gate.
9. Skill gaps and action-plan prioritization.

These values are server-derived.

### 6.1 Question-Set Versioning (Version-Pinned with Explicit Schema Compatibility)

- Each `EvidenceSkill.answers` is permanently associated with the `questionSetVersion` active at the time it was submitted (or last re-answered).
- Historical assessments never reinterpret old answers under a newer schema.
- A new scoring run uses the currently-active `questionSetVersion`.
- If an older answer version is *deterministically* compatible with the active version (per an explicit configuration mapping), it is transformed in memory for that run — never silently reinterpreted with no mapping.
- If incompatible, the evidence item is excluded from that assessment run and flagged `REQUIRES_REANSWERING` until the student updates it.
- Updating an evidence item's answers moves it onto the current active `questionSetVersion`.

## 7. Assessment

### POST /api/v1/assessments

Runs a readiness assessment for the authenticated student and selected role.

Request includes the target role and, where supported by the API version, an explicit evaluation date or assessment context. The server resolves the current `scoringConfigVersion` and the role's current `frameworkVersion`.

The response contains:

- assessment identifier
- role
- `scoringConfigVersion`
- `frameworkVersion`
- evaluationDate
- overall weighted readiness
- readiness tier
- triggering CORE skills when applicable
- per-skill SkillScore
- per-skill confidence
- evidence contribution summaries, including any evidence excluded with `REQUIRES_REANSWERING`

### GET /api/v1/assessments/:assessmentId

Returns the immutable owner-scoped assessment snapshot.

Historical assessments must remain reproducible even when current scoring configuration, framework version, or question-set version changes.

## 8. Fields the Client Must Not Set

Normal student endpoints must reject client attempts to directly set:

- practicalDepth
- quality
- evidenceScore
- skillScore
- weightedAverage
- readinessTier
- confidence
- priorityScore
- `questionSetVersion`
- `frameworkVersion`
- `artifactId` (final assignment) — the client may submit `declaredArtifactId` as a hint (§3), but final `artifactId` resolution is server authority.

These values are derived or resolved by the backend. Strict Zod schemas reject unrecognized/extra fields on all normal student endpoints, so any attempt to set a derived field produces a validation error rather than being silently dropped.

## 9. Error Handling

Use consistent JSON errors with machine-readable error codes and human-readable messages.

Validation failures must identify invalid fields without leaking internal implementation details.

Authorization failures must not reveal whether another user's resource exists.

Scoring/versioning-specific error codes:

- `INVALID_ANSWER` — the submitted structured answers fail Zod validation against the currently-active question set's schema. This is a request-validation failure, returned at submission time.
- `REQUIRES_REANSWERING` — returned (as part of an assessment's evidence-contribution summary, not a hard request failure) when an `EvidenceSkill`'s `questionSetVersion` is not deterministically compatible with the currently-active version at assessment time. The evidence item is excluded from that assessment until the student re-answers it. This is a version-compatibility state, distinct from `INVALID_ANSWER`.

## 10. Scoring Configuration

Scoring configuration is versioned server-side. Public student endpoints may expose the active `scoringConfigVersion` and the active `frameworkVersion` per role for transparency, but clients cannot edit scoring coefficients or role-skill weights.

The readiness engine must be invokable as a pure function with explicit inputs (including `scoringConfigVersion` and `frameworkVersion` as explicit context) and must not depend on Express, Prisma, HTTP state, environment-specific clocks, or UI state.

## 11. Security Requirements

- Owner-scope all student resources, including `Artifact` and `ArtifactKey`.
- Rate-limit authentication-sensitive endpoints.
- Restrict CORS to approved origins.
- Store secrets in environment variables.
- Do not commit real `.env` files or credentials.
- Validate and normalize URLs/external identifiers before persisting them as `ArtifactKey.normalizedValue`.
- Do not expose internal database identifiers unnecessarily.

## 12. Out of Scope for MVP

- File uploads
- Employer-facing verified credentials
- AI-generated score fields
- AI/ML-based artifact similarity or plagiarism detection
- Direct recruiter APIs
- Microservice decomposition

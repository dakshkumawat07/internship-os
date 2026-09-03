# InternshipOS — API Specification

Status: Documentation baseline for MVP scoring integration  
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

## 2. Authentication and Ownership

All student resources are owner-scoped to the authenticated user. A student must never be able to read or mutate another student's evidence, profile, action plan, or assessment by changing an ID.

Authentication architecture remains JWT access tokens plus DB-tracked refresh tokens and Argon2id password hashing.

## 3. Evidence Resource

### POST /api/v1/evidence

Creates a student evidence record.

Client-submitted facts may include:

- evidence type
- title/name
- description
- source URL(s)
- dates relevant to the evidence
- structured factual answers required by the selected rubric
- artifact reference when the evidence belongs to an existing artifact lineage
- skill relationships

The server validates the payload with Zod.

The client must not submit final scoring fields.

### PATCH /api/v1/evidence/:evidenceId

Updates mutable student-submitted evidence facts subject to ownership checks.

A change that affects scoring creates a new assessment input state; historical assessment snapshots are not rewritten.

### GET /api/v1/evidence

Returns the authenticated student's evidence records and their current relationship to skills/artifacts.

### GET /api/v1/evidence/:evidenceId

Returns one owner-scoped evidence record.

## 4. Artifact Resource

The API must represent the underlying artifact separately from its representations where needed for lineage and deduplication.

### POST /api/v1/artifacts

Creates or links an artifact when the submitted work is not already associated with an existing artifact lineage.

The server canonicalizes repository and project/demo URLs where applicable.

### POST /api/v1/artifacts/:artifactId/representations

Attaches a representation such as:

- Project entry
- GitHub repository
- Hackathon submission
- Demo URL

Representations belonging to the same underlying work must reference the same artifact lineage.

## 5. Skill Evidence Relationship

### POST /api/v1/evidence/:evidenceId/skills

Associates evidence with one or more skills.

The relationship must identify the factual evidence relevant to each skill. A single project may therefore receive different derived scores for different skills.

### DELETE /api/v1/evidence/:evidenceId/skills/:skillId

Removes the current relationship when permitted.

## 6. Derived Scoring

When an assessment is generated, the backend calculates:

1. PracticalDepth from structured factual evidence answers.
2. Quality from structured factual evidence answers.
3. RecencyMultiplier from versioned recency configuration and explicit evaluationDate.
4. EvidenceScore from the locked formula.
5. Artifact consolidation and lineage handling.
6. SkillScore from the Evidence Aggregation v1 model.
7. Role-level weighted readiness.
8. CORE gate.
9. Skill gaps and action-plan prioritization.

These values are server-derived.

## 7. Assessment

### POST /api/v1/assessments

Runs a readiness assessment for the authenticated student and selected role.

Request includes the target role and, where supported by the API version, an explicit evaluation date or assessment context. The server resolves the current scoring configuration version.

The response contains:

- assessment identifier
- role
- scoring configuration version
- evaluationDate
- overall weighted readiness
- readiness tier
- triggering CORE skills when applicable
- per-skill SkillScore
- per-skill confidence
- evidence contribution summaries

### GET /api/v1/assessments/:assessmentId

Returns the immutable owner-scoped assessment snapshot.

Historical assessments must remain reproducible even when current scoring configuration changes.

## 8. Fields the Client Must Not Set

Normal student endpoints must reject or ignore client attempts to directly set:

- practicalDepth
- quality
- evidenceScore
- skillScore
- weightedAverage
- readinessTier
- confidence
- priorityScore

These values are derived by the backend.

## 9. Error Handling

Use consistent JSON errors with machine-readable error codes and human-readable messages.

Validation failures must identify invalid fields without leaking internal implementation details.

Authorization failures must not reveal whether another user's resource exists.

## 10. Scoring Configuration

Scoring configuration is versioned server-side. Public student endpoints may expose the active configuration version for transparency, but clients cannot edit scoring coefficients.

The readiness engine must be invokable as a pure function with explicit inputs and must not depend on Express, Prisma, HTTP state, environment-specific clocks, or UI state.

## 11. Security Requirements

- Owner-scope all student resources.
- Rate-limit authentication-sensitive endpoints.
- Restrict CORS to approved origins.
- Store secrets in environment variables.
- Do not commit real `.env` files or credentials.
- Validate URLs and external identifiers before persistence.
- Do not expose internal database identifiers unnecessarily.

## 12. Out of Scope for MVP

- File uploads
- Employer-facing verified credentials
- AI-generated score fields
- Direct recruiter APIs
- Microservice decomposition

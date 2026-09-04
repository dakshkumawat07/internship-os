# InternshipOS — Domain Model

Status: MVP domain baseline (rev. 2 — Artifact/ArtifactKey/versioning update, reconciled from Gemini's independent review)

## 1. Domain Principles

InternshipOS models readiness as a relationship between a student, a target role, required skills, and evidence demonstrating those skills.

The domain separates:

- facts supplied by a student
- relationships between evidence and skills
- the underlying artifact being represented
- server-derived scoring
- immutable historical assessments

## 2. Core Entities

### User

Authentication identity and account ownership.

Key concepts:

- id
- email
- password hash
- refresh-token state
- created/updated timestamps

### StudentProfile

Student-specific profile information used by InternshipOS.

### Role

A target internship role definition.

MVP roles:

- Software Engineer Intern
- Backend Developer Intern
- Frontend Developer Intern
- Data Analyst Intern

Fields include:

- id
- name
- `currentFrameworkVersion` — the `frameworkVersion` whose `RoleSkill` rows are currently active for this role. Initial value: `mvp-1`.

### Skill

A normalized technical skill assessed by InternshipOS.

### RoleSkill

Associates a skill with a role and stores versioned importance classification/weight.

Fields include:

- roleId
- skillId
- importance (CORE / IMPORTANT / USEFUL / OPTIONAL)
- weight (4 / 3 / 2 / 1, matching importance)
- `frameworkVersion` — the role-skill framework version this weight row belongs to. A given (role, skill) pair may have multiple `RoleSkill` rows across different `frameworkVersion`s over time; only the row matching `Role.currentFrameworkVersion` is active for new assessments.

Importance values:

- CORE = 4
- IMPORTANT = 3
- USEFUL = 2
- OPTIONAL = 1

The `mvp-1` framework's exact per-role skill/weight table is the canonical reference and is recorded once, in `DECISIONS.md` (ADR-027), to avoid duplicated/divergent copies across documents.

## 3. Evidence Domain

### Evidence

A student-submitted evidence record describing work, learning, or achievement. **Evidence is the representation** — there is no separate `ArtifactRepresentation` table in MVP (see `DECISIONS.md` ADR-021).

Evidence facts may include:

- type
- title
- description
- URLs
- structured rubric answers (see `EvidenceSkill`)
- `artifactId` — required FK to the `Artifact` this Evidence row represents.
- `activityDate` — the single recency anchor for this evidence (see below). Replaces any per-representation date fields for recency purposes.
- `corroboratesArtifactId` — optional FK to a *different* `Artifact`. Used when this Evidence (typically a certificate/capstone) corroborates a separately-submitted practical artifact rather than being that artifact's primary representation. See "Capstone Relationship" below.

Evidence does not directly store student-authored PracticalDepth, Quality, EvidenceScore, or SkillScore as authoritative inputs.

**Ownership constraint:** `Evidence.artifactId` and, when present, `Evidence.corroboratesArtifactId` must each resolve to an `Artifact` owned by the same `studentProfileId` as the `Evidence` row itself. This is a composite ownership check enforced at write time, not just a bare FK — Evidence must never be linkable to another student's artifact.

### EvidenceSkill

Associates an Evidence record with a specific Skill.

Fields include:

- evidenceId
- skillId
- `questionSetVersion` — the structured-rubric schema version these `answers` were collected under. Permanently associated with this row; see ADR-025 (Version-Pinned with Explicit Schema Compatibility) for how compatibility across versions is handled.
- `answers` — structured factual answers used to derive PracticalDepth/Quality at assessment time.

This relationship is essential because the same underlying artifact can demonstrate different skills at different strengths.

Example:

A project may provide strong Python evidence and moderate PostgreSQL evidence.

### Artifact

**The lineage root.** Represents the underlying body of work or learning activity, and *is* the unit used to prevent duplicate technical credit — there is no separate `ArtifactLineage` table for MVP (ADR-019).

Examples:

- a project/codebase
- a hackathon build
- a standalone repository
- a course/capstone when treated as one learning artifact

Fields:

- id
- studentProfileId (owner scope)
- createdAt / updatedAt

Multiple `Evidence` rows may reference the same `Artifact` — this is exactly how consolidation/deduplication works (`ArtifactScore = max(EvidenceScore)` across those Evidence rows, per `SCORING_MODEL.md` §5.4).

**`Artifact` does not store `lineageId` or `parentArtifactId` in MVP.** Canonical identity, and matching of continued/evolved work (v1 → v2), is handled entirely through `ArtifactKey`, never through a parent pointer (ADR-020).

### ArtifactKey

The canonical-identity mechanism (ADR-020). One `Artifact` may have multiple `ArtifactKey` rows — e.g. a normalized GitHub-repository key and a normalized demo-URL key can both point at the same `Artifact`.

Fields:

- id
- `artifactId` — FK to `Artifact`
- `studentProfileId` — owner scope, denormalized onto this row specifically to support the uniqueness constraint below
- `keyType` — e.g. `REPOSITORY`, `PROJECT_DEMO`, `MANUAL_LINK`
- `normalizedValue` — the canonicalized identity string (e.g. a normalized repository URL)
- createdAt

**Uniqueness (enforced at the database level):** `(studentProfileId, keyType, normalizedValue)` must be unique. The same canonical repository or demo identity cannot map to two different `Artifact`s for one student. This is the mechanism that answers the "is this the same artifact as before" question deterministically, without AI similarity detection (ADR-020, reaffirming the no-AI-similarity constraint from ADR-004/ADR-029).

## 4. Learning Evidence

Certificate/coursework evidence is represented as `Evidence` with certificate-specific details where required — and, like all Evidence, it has its own `artifactId` (typically a new `Artifact` representing the learning activity itself).

### CertificateDetail

Stores certificate/course facts such as:

- issuing organization
- course name
- completion date
- credential URL

A certificate does not become practical evidence merely because it has a credential URL.

### Capstone Relationship

When a course certificate corresponds to a capstone that is *also* submitted separately as a practical project, the certificate's `Evidence` row sets `corroboratesArtifactId` to the practical project's `Artifact` — rather than sharing that `Artifact`'s `artifactId` as its own. This keeps the certificate's identity as learning evidence distinct while explicitly recording that it corroborates the practical work, consistent with `SCORING_MODEL.md`'s separate practical/certificate aggregation (§7–§8) and with confidence being a separate axis from `SkillScore` (ADR-011).

Technical work is still counted once at the `Artifact` level; certificate evidence contributes only within the bounded certificate aggregation rules.

## 5. GitHub and Hackathon Details

### GitHubRepositoryLink

Stores supplementary repository detail (e.g. owner/repo name, description) associated with an `Evidence`/`Artifact`. **Canonical repository identity for deduplication purposes lives on `ArtifactKey` (`keyType = REPOSITORY`)**, not on `GitHubRepositoryLink` itself (ADR-020, cross-document consistency item #3/#18).

Repository URL normalization is required before the value is written into `ArtifactKey.normalizedValue`, so obvious formatting variants resolve to the same key.

### HackathonDetail

Stores competition/event facts and the student's specific contribution context.

Event prestige itself is not a scoring multiplier.

## 6. Scoring Configuration

### ScoringConfig

Versioned configuration describing scoring behavior, including:

- EvidenceScore inputs
- recency configuration
- aggregation coefficients
- certificate caps
- support threshold
- readiness thresholds where applicable
- algorithm/`scoringConfigVersion` identifier

Configuration is data, not scattered hard-coded constants.

**Versioning axes are distinct (cross-document consistency item #7):**

| Axis | Governs | Stored on |
|---|---|---|
| `scoringConfigVersion` | EvidenceScore/SkillScore formula coefficients, recency policy, certificate caps, support threshold | `ScoringConfig`, snapshotted onto `ReadinessAssessment` |
| `frameworkVersion` | Which role-skill importance/weight table is active | `RoleSkill`, `Role.currentFrameworkVersion`, snapshotted onto `ReadinessAssessment` |
| `questionSetVersion` | The structured-rubric question schema an `EvidenceSkill.answers` was collected under | `EvidenceSkill`, snapshotted onto `SkillAssessmentEvidence` |

These three never conflate: changing one does not imply changing another.

## 7. Derived Assessment Domain

### ReadinessAssessment

Immutable assessment snapshot for a target role at a specific evaluationDate.

Stores enough derived data to reproduce what the student saw at that point, including:

- role
- evaluationDate
- `scoringConfigVersion`
- `frameworkVersion` — the role-skill framework version used to weight this assessment
- overall weighted readiness
- readiness tier
- CORE gate result

### SkillAssessment

Immutable per-skill assessment belonging to a ReadinessAssessment.

Stores:

- Skill identity
- SkillScore
- confidence
- role importance weight at assessment time
- relevant derived summary values

### SkillAssessmentEvidence

Immutable snapshot of the relationship between an assessment and the evidence that contributed to the skill result.

**Stores denormalized snapshot values** (per-evidence `EvidenceScore`, the `activityDate` used, the `questionSetVersion` the underlying answers were collected under, and the resolved `artifactId`) directly on this row, rather than depending solely on live FKs to `Evidence`/`Artifact`. This is what allows later edits to `Evidence` — or even deletion — to never rewrite or invalidate a historical snapshot.

## 8. Action Plan Domain

### ActionPlan

A role-specific action plan generated from identified skill gaps.

### ActionItem

A concrete next action associated with a skill gap.

### TaskCompletion

Tracks whether an action item was completed and supports progress/reassessment.

## 9. Historical Reproducibility

Historical assessment records are immutable snapshots.

At minimum, historical data must preserve:

- evaluationDate
- `scoringConfigVersion`
- `frameworkVersion` (role-skill weights used)
- `questionSetVersion`(s) of the contributing evidence answers
- skill importance weight used
- evidence-derived scores used in the assessment (denormalized on `SkillAssessmentEvidence`)

Current scoring configuration, framework, or question-set changes must not silently alter past assessments.

## 10. Constraints

**Uniqueness:**

- `ArtifactKey (studentProfileId, keyType, normalizedValue)` — unique.
- `RoleSkill (roleId, skillId, frameworkVersion)` — unique.
- `EvidenceSkill (evidenceId, skillId)` — unique.

**Check constraints (representative, not exhaustive):**

- `EvidenceScore` (where persisted/snapshotted) must be finite and within `0–100`.
- `RoleSkill.weight` must match the value implied by `RoleSkill.importance` (CORE→4, IMPORTANT→3, USEFUL→2, OPTIONAL→1).
- `ArtifactKey.normalizedValue` must be non-empty.

**Delete behavior protecting snapshots:**

Deleting an `Evidence` or `Artifact` row must never cascade-delete or null out data inside an existing `SkillAssessmentEvidence` / `SkillAssessment` / `ReadinessAssessment` snapshot, because those snapshots hold denormalized values rather than depending on the live FK remaining resolvable. Foreign keys from snapshot tables toward live `Evidence`/`Artifact` rows use `ON DELETE SET NULL` (never `CASCADE`) with the snapshot's denormalized fields remaining intact and authoritative regardless of what happens to the live FK target.

## 11. Domain Invariants

1. All student-owned evidence is owner-scoped.
2. EvidenceSkill relationships are skill-specific.
3. One underlying `Artifact` must not receive duplicate technical depth through multiple `Evidence` rows (`ArtifactScore = max(EvidenceScore)`).
4. PracticalDepth and Quality are derived, not student-authored final scores.
5. EvidenceScore and SkillScore are server-derived.
6. Confidence is separate from SkillScore.
7. Invalid evidence scores cannot enter aggregation.
8. Assessment history is immutable.
9. Scoring configuration is versioned (`scoringConfigVersion`, `frameworkVersion`, `questionSetVersion` are independent axes — see §6).
10. `Evidence.artifactId` and `Evidence.corroboratesArtifactId` must belong to the same `studentProfileId` as the `Evidence` row (composite ownership).
11. `ArtifactKey` canonical identities are unique per student at the database level — the sole basis for "is this the same artifact" in MVP; no AI similarity detection is used.
12. `EvidenceSkill.answers` is permanently pinned to its `questionSetVersion`; reinterpretation under a different version requires an explicit configuration mapping, never silent reinterpretation (ADR-025).
13. `RoleSkill` weights are versioned by `frameworkVersion`; every `ReadinessAssessment` records which `frameworkVersion` produced its weights.
14. Deleting live `Evidence`/`Artifact` data must never alter an existing assessment snapshot (see §10, delete behavior).

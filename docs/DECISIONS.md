# InternshipOS — Architecture & Scoring Decisions

Status: Reconciled MVP decisions (rev. 2 — Artifact/ArtifactKey/versioning review, independently reviewed by Gemini)

## Protected Files & Change Process

The following are protected files: `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SCORING_MODEL.md`, `docs/API_SPEC.md`, `docs/DESIGN_SYSTEM.md`, and `prisma/schema.prisma`.

- Claude and ChatGPT own and review changes to these documents.
- Antigravity and Codex implement against their current versions; if implementation surfaces a gap, ambiguity, or apparent error in a protected document, the correct action is to flag it back as a question or a proposed doc edit — never to silently decide and code around it.
- Gemini may be used for independent critique or research on a proposed change to any protected document before it's finalized, as an additional check — it does not unilaterally finalize protected-document changes or implement application code in this workflow. (This review followed that process: Gemini's recommendation was treated as a proposal, reconciled and written up here by Claude for the record.)
- Any change to `packages/readiness-engine` logic ships in the same PR as a corresponding `SCORING_MODEL.md` update. Any DB schema change ships with a `DOMAIN_MODEL.md` update. Any API contract change ships with an `API_SPEC.md` update. Documentation drift is treated as a bug.

*(This section closes a gap: `ARCHITECTURE.md` §13 has referenced "the full list and process in `DECISIONS.md`" without that content previously existing here.)*

## ADR-001 — Structured Evidence Facts Instead of Self-Entered Scoring

**Decision:** PracticalDepth and Quality are derived from structured factual evidence questions. Students do not directly enter either score.

**Reason:** Self-entered numeric scoring is easy to game and makes comparisons less meaningful. Structured facts create deterministic, auditable scoring inputs.

**Consequence:** The frontend collects facts; the readiness engine derives scores.

## ADR-002 — Explicit Evaluation Date

**Decision:** The readiness engine always receives an explicit `evaluationDate`.

**Reason:** Historical assessments must be reproducible. The engine must not depend on the runtime system clock.

## ADR-003 — Evidence Aggregation Uses Artifact Consolidation

**Decision:** Multiple `Evidence` rows representing the same underlying `Artifact` are consolidated before technical aggregation.

**Rule:** `ArtifactScore = max(EvidenceScore across Evidence rows for that Artifact)`.

**Reason:** A project, GitHub repository, hackathon submission, and demo URL can describe the same technical work. Counting each separately would inflate readiness.

## ADR-004 — Artifact Identity Is Deterministic in MVP

**Decision:** Artifact identity uses canonical repository identity where available, then canonical project/demo identity, then explicit existing-artifact links, then creation of a new artifact.

**Reason:** Arbitrary user-entered IDs are insufficient to prevent split-artifact gaming.

**Constraint:** MVP does not use AI similarity detection.

**Superseded (table design only) by ADR-019/ADR-020:** the identity-priority *rule* stated here is unchanged; how it's stored (`ArtifactKey` rather than a separate lineage table) was revised in the Artifact/ArtifactKey review below.

## ADR-005 — Strongest Practical Evidence Dominates

**Decision:** The strongest practical artifact contributes at full value. Supporting practical artifacts receive diminishing returns.

**Reason:** One substantial demonstration should carry most of demonstrated skill; additional work provides corroboration rather than linear accumulation.

## ADR-006 — 50% Practical Support Threshold

**Decision:** A supporting practical artifact contributes only when its `EvidenceScore` is at least 50% of the strongest practical artifact score.

**Reason:** Very weak artifacts should not increase an already-strong skill score merely because more artifacts were submitted.

## ADR-007 — Practical Diminishing Weights

**Decision:** v1 weights are:

- primary = 1.00
- second qualifying = 0.10
- third qualifying = 0.05
- fourth and later qualifying = 0.02 each

**Reason:** This limits portfolio-spam incentives while preserving a measurable reward for repeated demonstrated performance.

## ADR-008 — Original 0.25 Secondary Multiplier Rejected

**Decision:** The earlier `0.25 × P2` proposal was rejected.

**Reason:** Two strong projects such as 90 and 90 would produce 112.5 before clamping and therefore 100 after clamping. A weak second project such as 20 would still add 5 points to a 90. This was too aggressive for corroborating evidence.

## ADR-009 — Certificate Influence Is Bounded

**Decision:** When practical evidence exists, total certificate contribution is capped at 5 points, using 0.05 for the strongest certificate and 0.02 for every additional certificate.

When no practical evidence exists, certificate-only aggregation is capped at 40.

**Reason:** Certificates demonstrate learning/exposure but should not transform already-strong practical evidence into near-perfect demonstrated competence.

## ADR-010 — Certificate Capstone Does Not Duplicate Technical Work

**Decision:** A certificate/capstone representing the same work as a separately submitted project links to that project via `Evidence.corroboratesArtifactId` (see ADR-024) rather than sharing its `artifactId`.

**Reason:** The technical implementation must be credited once. The certificate can still provide bounded learning/corroboration value.

## ADR-011 — Confidence Is Separate From SkillScore

**Decision:** Corroboration affects confidence, not the numerical readiness score.

**Reason:** A score should answer "how strong is the demonstrated evidence?" while confidence answers "how well is that claim supported/verified?" Mixing them makes the model harder to explain and can create circular scoring.

## ADR-012 — Conflicting Representations Do Not Automatically Penalize SkillScore

**Decision:** For the same artifact, contradictory representations do not trigger an arbitrary numerical penalty. The MAX representation remains the artifact technical score, while conflict is surfaced in verification/confidence.

**Reason:** A lower-quality representation should not automatically erase stronger demonstrated evidence, and arbitrary penalties would introduce hidden judgment.

## ADR-013 — Deterministic Validation and Rounding

**Decision:** EvidenceScore values must be finite and within 0–100. Invalid values are rejected. Sorting uses score descending and canonical artifact identity ascending as a tie-breaker. Final rounding occurs once.

**Reason:** Prevents NaN/Infinity bugs, nondeterministic output, and cumulative rounding inflation.

## ADR-014 — No LLM/ML Inside the Scoring Engine

**Decision:** The MVP readiness engine is deterministic and pure TypeScript.

**Reason:** Scores must be testable, reproducible, explainable, and resistant to black-box drift.

Future AI features may exist outside the scoring engine behind narrow interfaces, but AI must not directly write score fields.

## ADR-015 — No GitHub Popularity or Commit-Count Scoring

**Decision:** Repository stars, forks, popularity, repository count, and raw commit count do not directly contribute to technical competence scores.

**Reason:** These measures can be gamed and are weak proxies for individual demonstrated ability.

## ADR-016 — Historical Assessment Immutability

**Decision:** ReadinessAssessment, SkillAssessment, and SkillAssessmentEvidence are immutable snapshots.

**Reason:** Past assessments must remain reproducible even after scoring configuration changes.

Historical records store the configuration/algorithm version, evaluationDate, role framework version where applicable, and evidence-derived values needed to explain the historical result.

## ADR-017 — Readiness Engine Is Isolated

**Decision:** The scoring engine remains a standalone pure TypeScript package with no Express, Prisma, HTTP, UI, or database dependencies.

**Reason:** Pure functions are easier to unit-test, reason about, version, and reuse.

## ADR-018 — v1 Calibration Is Explicitly Versioned

**Decision:** Aggregation coefficients and thresholds are versioned configuration.

**Reason:** v1 coefficients are defensible heuristics, not claims of scientific perfection. Future calibration must not rewrite historical assessments.

---

## ADR-019 — Artifact Is the Lineage Root

**Decision:** `Artifact` itself is the lineage-root entity for MVP. There is no separate `ArtifactLineage` table — the `Artifact` row *is* the lineage.

**Reason:** A separate lineage table added a layer of indirection with no MVP-stage benefit; identity resolution already happens through `ArtifactKey` (ADR-020), so `Artifact` can serve as both the lineage unit and the consolidation unit directly.

**Consequence:** ADR-004's identity-priority rule is unchanged; "artifact" now refers directly to the lineage-level entity.

## ADR-020 — ArtifactKey Replaces Lineage/Parent Pointers

**Decision:** Canonical identity (normalized repository URL, canonical project/demo identity, etc.) is stored on a dedicated `ArtifactKey` table with a FK to `Artifact`. `Artifact.lineageId` is not used. `Artifact.parentArtifactId` is not used for v1/v2 lineage continuation in MVP.

**Reason:** A single `Artifact` legitimately needs multiple canonical identities (e.g. a repo URL *and* a demo URL for the same project); a single `lineageId`/`parentArtifactId` pointer can't represent that cleanly, while a one-to-many `ArtifactKey` table can.

**Constraint (reaffirms ADR-004):** No AI similarity detection is used to establish these links — matching is deterministic, via normalized `ArtifactKey` values only.

## ADR-021 — Evidence Is the Representation

**Decision:** `Evidence` itself functions as what would otherwise be a separate `ArtifactRepresentation`. `ArtifactRepresentation` is not a separate table for MVP.

**Reason:** Every representation (project entry, repo, hackathon submission, demo URL) is already a student-submitted fact set with its own dates and rubric answers — which is exactly what `Evidence` already models. A parallel table would duplicate that structure without adding information.

## ADR-022 — Composite Owner-Scoped Evidence → Artifact Relationship

**Decision:** `Evidence.artifactId` and, when present, `Evidence.corroboratesArtifactId` must each resolve to an `Artifact` owned by the same `studentProfileId` as the `Evidence` row. This is enforced as a composite ownership check, not a bare FK.

**Reason:** Without this check, ordinary FK integrity alone would not prevent one student's evidence from being linked to another student's artifact — an IDOR-adjacent risk given `ArtifactKey` resolution runs server-side across the student's own data.

## ADR-023 — Unified activityDate as the Recency Anchor

**Decision:** `Evidence.activityDate` is the single recency anchor used by `RecencyMultiplier`. No other date field on Evidence is used for recency purposes.

**Reason:** Multiple competing date fields (submission date, event date, completion date) made recency policy ambiguous. A single named anchor per evidence item keeps the formula's input unambiguous and auditable.

## ADR-024 — Certificate Capstone/Corroboration via Evidence.corroboratesArtifactId

**Decision:** Learning evidence (certificate/capstone) may set `Evidence.corroboratesArtifactId` to point at a separately-submitted practical `Artifact` it corroborates, distinct from its own `artifactId`.

**Reason:** This keeps certificate evidence's own identity intact (still counted under certificate aggregation rules, §8 of `SCORING_MODEL.md`) while explicitly recording the corroboration relationship that feeds confidence (ADR-011), without merging the certificate's `Artifact` into the practical project's `Artifact`.

## ADR-025 — Question-Set Versioning: Version-Pinned with Explicit Schema Compatibility

**Decision (canonical policy):** Version-Pinned with Explicit Schema Compatibility.

**Rules:**

- `EvidenceSkill.answers` is permanently associated with its `questionSetVersion`.
- Historical assessments never reinterpret old answers.
- A new scoring configuration uses its active `questionSetVersion`.
- If an old answer version is deterministically compatible with the active version, it may be transformed in memory according to an explicit configuration mapping.
- If incompatible, the evidence requires re-answering and is excluded from that new score until updated (`REQUIRES_REANSWERING`).
- Updating an evidence item causes it to use the current active `questionSetVersion`.
- No silent interpretation of answers under a different schema.

**Reason:** Question sets will evolve; silently reinterpreting old structured answers under a new schema would produce scores that look derived but aren't actually grounded in what the student answered.

## ADR-026 — Role-Skill Framework Versioning

**Decision:** `RoleSkill` rows store `frameworkVersion`. `Role.currentFrameworkVersion` points at the active version for new assessments. `ReadinessAssessment` stores the `frameworkVersion` used. Initial framework version: **`mvp-1`**.

**Reason:** Role-skill weight tables will be recalibrated over time; assessments must record which table produced their weighting so historical results remain explainable and reproducible, same rationale as ADR-018 for scoring coefficients. `frameworkVersion` is a distinct versioning axis from `scoringConfigVersion` (see `DOMAIN_MODEL.md` §6, `SCORING_MODEL.md` §15).

## ADR-027 — mvp-1 Role-Skill Framework Locked

**Decision:** The following role-skill framework is locked as `frameworkVersion = "mvp-1"`. No additional skills are introduced at this stage.

**Software Engineer Intern:**

| Skill | Importance | Weight |
|---|---|---:|
| Data Structures & Algorithms | CORE | 4 |
| Programming Fundamentals | CORE | 4 |
| Git & Version Control | CORE | 4 |
| Database Systems & SQL | IMPORTANT | 3 |
| Web Fundamentals & REST APIs | IMPORTANT | 3 |
| Testing & Quality Assurance | USEFUL | 2 |
| System Design & Architecture | OPTIONAL | 1 |

**Backend Developer Intern:**

| Skill | Importance | Weight |
|---|---|---:|
| Database Systems & SQL | CORE | 4 |
| Web Fundamentals & REST APIs | CORE | 4 |
| Programming Fundamentals | CORE | 4 |
| Git & Version Control | IMPORTANT | 3 |
| Testing & Quality Assurance | IMPORTANT | 3 |
| Data Structures & Algorithms | IMPORTANT | 3 |
| System Design & Architecture | USEFUL | 2 |

**Frontend Developer Intern:**

| Skill | Importance | Weight |
|---|---|---:|
| Frontend Core (HTML/CSS/JS) | CORE | 4 |
| Frontend Frameworks & UI Engineering | CORE | 4 |
| Web Fundamentals & REST APIs | CORE | 4 |
| Git & Version Control | IMPORTANT | 3 |
| Programming Fundamentals | USEFUL | 2 |
| Testing & Quality Assurance | USEFUL | 2 |
| Data Structures & Algorithms | OPTIONAL | 1 |

**Data Analyst Intern:**

| Skill | Importance | Weight |
|---|---|---:|
| Database Systems & SQL | CORE | 4 |
| Data Analysis & Visualization | CORE | 4 |
| Applied Statistics & Mathematics | CORE | 4 |
| Programming Fundamentals | IMPORTANT | 3 |
| Git & Version Control | IMPORTANT | 3 |
| Web Fundamentals & REST APIs | OPTIONAL | 1 |

**Reason:** Locked as reviewed, matching the existing importance-weight scale (CORE=4/IMPORTANT=3/USEFUL=2/OPTIONAL=1) with no change to weight meanings.

## ADR-028 — Database Uniqueness Enforced at Schema Level

**Decision:** Canonical uniqueness — `ArtifactKey (studentProfileId, keyType, normalizedValue)`, `RoleSkill (roleId, skillId, frameworkVersion)`, `EvidenceSkill (evidenceId, skillId)` — is enforced via database unique constraints, not application logic alone.

**Reason:** Application-only uniqueness checks are subject to race conditions; the database constraint is the actual source of truth that prevents duplicate artifact identities or duplicate role-skill rows under concurrent writes.

## ADR-029 — No AI Similarity Detection or Plagiarism System (Reaffirmed)

**Decision:** MVP does not add AI-based artifact similarity detection or a plagiarism-detection system. Artifact identity remains fully deterministic via `ArtifactKey`.

**Reason:** Reaffirms ADR-004/ADR-020's constraint explicitly as its own decision, since this review touched artifact-identity mechanics directly.

## ADR-030 — No New Scoring Formula, Tiers, or Weight-Meaning Changes (Reaffirmed)

**Decision:** This review makes no change to the `EvidenceScore` formula, the `SkillScore` aggregation formula (§7–§9 of `SCORING_MODEL.md`), the readiness tiers, or the CORE/IMPORTANT/USEFUL/OPTIONAL weight meanings (4/3/2/1). All changes in this review are structural (Artifact/ArtifactKey/Evidence-as-representation) and versioning-related (`questionSetVersion`, `frameworkVersion`), not formulaic.

**Reason:** Explicit reaffirmation, since this review touched adjacent scoring-model language (terminology alignment in `SCORING_MODEL.md` §5) and it should be unambiguous that no coefficient or threshold changed.

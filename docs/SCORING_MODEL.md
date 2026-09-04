# InternshipOS — Scoring Model

Status: Implementation-ready specification (rev. 2 — terminology/versioning alignment; no formula change)
Version: Evidence Aggregation v1
Scope: Skill-level evidence scoring and aggregation

## 1. Purpose

InternshipOS estimates a student's readiness for a target internship role using skill-specific evidence. The score is an evidence-based readiness estimate, not an objective measurement of true ability.

Core principle:

> A claimed skill is not the same as a demonstrated skill.

The same underlying artifact may demonstrate different skills at different strengths. Therefore evidence is assessed per skill.

## 2. Locked Readiness Inputs (unchanged)

### 2.1 Per-evidence score

For each evidence item and skill:

`EvidenceScore = (0.6 × PracticalDepth + 0.4 × Quality) × RecencyMultiplier`

Where:

- `PracticalDepth` is 0–100.
- `Quality` is 0–100.
- `RecencyMultiplier` is 0.5–1.0, computed from `Evidence.activityDate` — the single recency anchor for the evidence item — against the explicit `evaluationDate`.
- `PracticalDepth` and `Quality` are derived from structured factual questions (`EvidenceSkill.answers`, collected under a specific `questionSetVersion` — see §15.1); the student does not directly enter either score.
- The scoring engine receives an explicit `evaluationDate` and does not read the system clock.

The exact recency policy is configuration-driven and versioned. Aggregation consumes the resulting `EvidenceScore` and does not re-score recency.

### 2.2 Role weights

- CORE = 4
- IMPORTANT = 3
- USEFUL = 2
- OPTIONAL = 1

Weights are versioned configuration (`RoleSkill.frameworkVersion`), not hidden constants. **This formula and these weight meanings are unchanged by this review.**

### 2.3 Overall readiness

`WeightedAverage = Σ(SkillScore × Weight) / Σ(Weight)`

### 2.4 CORE gate

If any CORE skill has `SkillScore < 40`, overall readiness cannot exceed `Needs Work`. Triggering CORE skills are named explicitly.

### 2.5 Readiness tiers (unchanged)

| Score | Tier |
|---:|---|
| 0–39 | Early Stage |
| 40–69 | Needs Work |
| 70–84 | Close |
| 85–100 | Ready |

## 3. Confidence

Confidence is separate from `SkillScore`.

- No evidence → `NONE`.
- Thin evidence → `LOW`.
- Multiple independent corroborating sources may raise confidence — including certificate/capstone evidence that sets `Evidence.corroboratesArtifactId` toward a practical artifact (`DOMAIN_MODEL.md` §4).

Confidence never modifies `SkillScore` numerically.

## 4. Evidence Aggregation Pipeline

1. Validate individual evidence scores.
2. Consolidate `Evidence` rows sharing the same `Artifact` (the lineage root — see §5; no separate lineage table).
3. Split consolidated artifacts into practical evidence and learning/certificate evidence.
4. Aggregate practical artifacts using a strongest-first model with diminishing returns and a support threshold.
5. Add bounded certificate contribution.
6. Round once and clamp the final score to 0–100.

## 5. Artifact Identity and Consolidation

### 5.1 Underlying artifact

An `Artifact` is the underlying body of work or learning activity, and is itself the lineage root — MVP has no separate lineage table (`DOMAIN_MODEL.md` §3). Multiple `Evidence` rows referencing one `Artifact` must not create duplicate technical depth.

Examples of `Evidence` that may reference one `Artifact`:

- Project entry
- GitHub repository
- Hackathon submission
- Live/demo URL
- Later versions of the same project
- Continued development of the same work

### 5.2 Identity priority

For MVP, use deterministic identity in this order, resolved via `ArtifactKey`:

1. Canonical repository identity (`ArtifactKey.keyType = REPOSITORY`), when a repository exists.
2. Canonical project/demo identity (`ArtifactKey.keyType = PROJECT_DEMO`), when applicable.
3. Explicit reference to an existing artifact (`Evidence.declaredArtifactId`, confirmed by the server).
4. Otherwise create a new `Artifact`.

Repository URLs must be normalized before being written as `ArtifactKey.normalizedValue`, so obvious formatting differences resolve to the same key.

An arbitrary student-entered string is not sufficient by itself to establish a new artifact identity.

### 5.3 Lineage

Project v1 → v2 is one `Artifact` when v2 is a continuation or substantial evolution of the same work, resolved via matching `ArtifactKey`s rather than a parent pointer (`DOMAIN_MODEL.md` §3). A fork is not automatically a new independent artifact. A hackathon prototype that is later substantially rebuilt remains the same `Artifact` unless the student establishes a genuinely independent implementation (a new, non-matching `ArtifactKey`).

MVP does not use AI similarity detection.

### 5.4 Consolidation rule (unchanged)

For all `Evidence` rows referencing one `Artifact`:

`ArtifactScore = max(EvidenceScore for those Evidence rows)`

The strongest representation supplies technical depth once. Other representations can strengthen verification/confidence but do not add duplicate technical points.

### 5.5 Cross-skill reuse

One artifact may be attached to multiple skills via multiple `EvidenceSkill` rows. Each skill gets its own structured skill-specific assessment. A project may therefore receive a different evidence score for Python than for PostgreSQL. Cross-skill reuse is valid because each calculation is isolated by skill.

## 6. Evidence Categories (unchanged)

### Practical artifacts

- Projects
- Standalone repositories
- Hackathon builds

### Learning artifacts

- Certificates
- Coursework
- Guided labs

Certificates are learning/exposure evidence, not equivalent to practical technical depth. A certificate/capstone evidence row may set `corroboratesArtifactId` toward a practical artifact (`DOMAIN_MODEL.md` §4) without becoming practical evidence itself.

## 7. Practical Aggregation v1 (formula unchanged)

After artifact consolidation, sort distinct practical artifact scores in descending order:

`P1 ≥ P2 ≥ ... ≥ Pn`

`P1` is the peak demonstrated practical score.

A supporting artifact `Pi` qualifies only when:

`Pi ≥ 0.50 × P1`

If it does not qualify, its contribution is zero.

The versioned practical weights are:

- P1 → `1.00`
- P2 → `0.10`
- P3 → `0.05`
- P4 and every subsequent qualifying artifact → `0.02`

Only qualifying artifacts are included in the corresponding positions. Non-qualifying artifacts are skipped rather than consuming a weight slot.

### Exact formula

If there is no practical evidence:

`S_practical = 0`

Otherwise, let `Q` be the ordered list of qualifying practical artifacts after P1, preserving descending score order. Then:

`S_practical = P1 + 0.10×Q1 + 0.05×Q2 + 0.02×Σ(Q3...Qm)`

For the tail:

`Σ(Q3...Qm) = 0` when `m < 3`; otherwise it is the sum of all qualifying artifacts from the third supporting artifact onward.

This makes the tail deterministic without an undefined ellipsis.

### Rationale

The strongest practical artifact establishes the student's demonstrated depth. Additional independent artifacts corroborate repeatability, but evidence quantity must not substitute for depth.

## 8. Certificate Aggregation v1 (formula unchanged)

### 8.1 Certificate-only

When there is no practical evidence, sort certificate scores:

`C1 ≥ C2 ≥ ... ≥ Cq`

Then:

`S_cert = min(40, C1 + 0.15×C2 + 0.05×Σ(C3...Cq))`

When `q < 3`, the tail sum is zero.

The standalone certificate cap is 40.

### 8.2 Certificate with practical evidence

When at least one practical artifact exists:

`S_cert = min(5, 0.05×C1 + 0.02×Σ(C2...Cq))`

When `q < 2`, the tail sum is zero.

The total certificate contribution is capped at 5.

## 9. Final SkillScore (unchanged)

`SkillScore = min(100, max(0, round(S_practical + S_cert)))`

Internal calculations retain sufficient precision. Rounding occurs once, at final output.

The final clamp is a safety boundary, not a justification for aggressive coefficients.

## 10. Conflicting Evidence (unchanged)

### Same artifact

When `Evidence` rows for the same `Artifact` disagree:

- `ArtifactScore` remains the maximum valid representation score.
- Contradictions do not automatically subtract points.
- The verification/confidence layer records that corroboration is incomplete or conflicting.
- SkillScore and confidence remain separate.

Example: a project claim scores 90 while its repository evidence scores 20. The artifact score remains 90, but the system should surface the weak corroboration rather than present the artifact as fully verified.

### Independent artifacts

A weak independent artifact does not erase strong demonstrated capability. If it falls below the 50% support threshold relative to P1, it contributes zero.

## 11. Validation and Determinism (unchanged)

Every evidence score entering aggregation must satisfy:

`0 ≤ EvidenceScore ≤ 100`

Reject invalid values including NaN, Infinity, negative values, and values above 100. Malformed evidence must not be silently processed.

For deterministic ordering:

1. EvidenceScore descending.
2. Canonical artifact identity ascending as a tie-breaker (`ArtifactKey`-resolved identity, not artifact creation order).

Same inputs + same `scoringConfigVersion` + same `frameworkVersion` + same `evaluationDate` must always produce the same SkillScore.

## 12. Regression Suite (unchanged)

| Scenario | Expected SkillScore |
|---|---:|
| One project: 90 | 90 |
| Two strong projects: 90, 90 | 99 |
| Strong + weak: 90, 20 | 90 |
| Strong + meaningful secondary: 90, 60 | 96 |
| 90 + 40 + 30 + 20 + 10 | 90 |
| Three equal medium projects: 60, 60, 60 | 69 |
| Project 80 + certificate 100 | 85 maximum |
| Project 82 + duplicate GitHub 75 | 82 |
| Project v1 75 + v2 90 in same artifact | 90 |
| Certificate-only portfolio | ≤ 40 |

## 13. Explanation Model (unchanged)

The UI should explain the score using the largest contributors rather than dumping every tail contribution.

Example:

> SkillScore 96 = 90 primary practical evidence + 6 meaningful supporting evidence. Duplicate GitHub representation added verification confidence but no duplicate technical score.

## 14. Known Trade-offs (unchanged)

The 50% support threshold and diminishing coefficients are explicit v1 heuristics. They should be calibrated later using real, anonymized test cases and historical fairness analysis.

Artifact identity depends on deterministic `ArtifactKey` matching and canonical URL normalization. MVP intentionally avoids probabilistic duplicate detection.

The certificate-only cap of 40 is deliberately conservative and must remain regression-tested against the readiness tiers.

## 15. Versioning and Historical Reproducibility

Three independent versioning axes feed into every assessment (see `DOMAIN_MODEL.md` §6 for the full table):

- `scoringConfigVersion` — formula coefficients, recency policy, certificate caps, support threshold.
- `frameworkVersion` — role-skill importance/weight table (`mvp-1` is the initial version — see `DECISIONS.md` ADR-026/027).
- `questionSetVersion` — the structured-rubric schema an `EvidenceSkill.answers` was collected under.

### 15.1 Question-Set Versioning — Version-Pinned with Explicit Schema Compatibility

- `EvidenceSkill.answers` is permanently associated with its `questionSetVersion`.
- Historical assessments never reinterpret old answers under a different schema.
- A new scoring run uses the currently-active `questionSetVersion`.
- If an old answer version is deterministically compatible with the active version, it may be transformed in memory according to an explicit configuration mapping — never silently.
- If incompatible, the evidence is excluded from that run (`REQUIRES_REANSWERING`) until re-answered.
- Updating an evidence item moves it onto the current active `questionSetVersion`.

Historical assessments store all three version identifiers plus the evidence-derived snapshot values required to reproduce the result (`SkillAssessmentEvidence`, `DOMAIN_MODEL.md` §7). Past assessments must not silently change when current scoring configuration, framework version, or question-set version changes.

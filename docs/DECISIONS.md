# InternshipOS — Architecture & Scoring Decisions

Status: Reconciled MVP decisions

## ADR-001 — Structured Evidence Facts Instead of Self-Entered Scoring

**Decision:** PracticalDepth and Quality are derived from structured factual evidence questions. Students do not directly enter either score.

**Reason:** Self-entered numeric scoring is easy to game and makes comparisons less meaningful. Structured facts create deterministic, auditable scoring inputs.

**Consequence:** The frontend collects facts; the readiness engine derives scores.

## ADR-002 — Explicit Evaluation Date

**Decision:** The readiness engine always receives an explicit `evaluationDate`.

**Reason:** Historical assessments must be reproducible. The engine must not depend on the runtime system clock.

## ADR-003 — Evidence Aggregation Uses Artifact Consolidation

**Decision:** Multiple representations of the same underlying artifact are consolidated before technical aggregation.

**Rule:** `ArtifactScore = max(EvidenceScore across representations)`.

**Reason:** A project, GitHub repository, hackathon submission, and demo URL can describe the same technical work. Counting each separately would inflate readiness.

## ADR-004 — Artifact Lineage Is Deterministic in MVP

**Decision:** Artifact identity uses canonical repository identity where available, then canonical project/demo identity, then explicit existing-artifact links, then creation of a new artifact.

**Reason:** Arbitrary user-entered IDs are insufficient to prevent split-artifact gaming.

**Constraint:** MVP does not use AI similarity detection.

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

**Decision:** A certificate/capstone representing the same work as a separately submitted project shares the same artifact lineage.

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

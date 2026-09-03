# InternshipOS — Domain Model

Status: MVP domain baseline

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

### Skill

A normalized technical skill assessed by InternshipOS.

### RoleSkill

Associates a skill with a role and stores versioned importance classification/weight.

Importance values:

- CORE = 4
- IMPORTANT = 3
- USEFUL = 2
- OPTIONAL = 1

## 3. Evidence Domain

### Evidence

A student-submitted evidence record describing work, learning, or achievement.

Evidence facts may include:

- type
- title
- description
- URLs
- dates
- structured rubric answers
- artifact reference

Evidence does not directly store student-authored PracticalDepth, Quality, EvidenceScore, or SkillScore as authoritative inputs.

### EvidenceSkill

Associates an Evidence record with a specific Skill.

This relationship is essential because the same underlying artifact can demonstrate different skills at different strengths.

Example:

A project may provide strong Python evidence and moderate PostgreSQL evidence.

### Artifact

Represents the underlying body of work or learning activity.

Examples:

- a project/codebase
- a hackathon build
- a standalone repository
- a course/capstone when treated as one learning artifact

The Artifact is the unit used to prevent duplicate technical credit.

### ArtifactRepresentation

Represents a view or source associated with an Artifact, such as:

- project entry
- GitHub repository
- hackathon submission
- live/demo URL

Multiple representations of one Artifact must not create multiple technical-depth contributions.

### ArtifactLineage

Represents the continuity of an Artifact across versions or continued development.

Examples:

- project v1 → v2
- hackathon prototype → later maintained version
- repository continuation

A continued artifact lineage is treated as one underlying artifact unless the system has a deterministic basis to establish a genuinely independent implementation.

## 4. Learning Evidence

Certificate/coursework evidence can be represented as Evidence with certificate-specific details where required.

### CertificateDetail

Stores certificate/course facts such as:

- issuing organization
- course name
- completion date
- credential URL
- optional capstone relationship

A certificate does not become practical evidence merely because it has a credential URL.

### Capstone Relationship

When a course certificate points to a capstone that is also submitted as a practical project, both representations should reference the same underlying artifact lineage where they represent the same work.

Technical work is counted once; certificate evidence may contribute only within the certificate aggregation rules.

## 5. GitHub and Hackathon Details

### GitHubRepositoryLink

Stores a canonical repository reference associated with an Artifact.

Repository URL normalization is required to identify obvious formatting variants as the same repository.

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
- algorithm version identifier

Configuration is data, not scattered hard-coded constants.

## 7. Derived Assessment Domain

### ReadinessAssessment

Immutable assessment snapshot for a target role at a specific evaluationDate.

Stores enough derived data to reproduce what the student saw at that point, including:

- role
- evaluationDate
- scoring configuration version
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

It should preserve the evidence-derived score at assessment time so later scoring changes do not rewrite history.

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
- scoring algorithm/configuration version
- role framework version where applicable
- skill importance weight used
- evidence-derived scores used in the assessment

Current scoring configuration changes must not silently alter past assessments.

## 10. Domain Invariants

1. All student-owned evidence is owner-scoped.
2. EvidenceSkill relationships are skill-specific.
3. One underlying artifact must not receive duplicate technical depth through multiple representations.
4. PracticalDepth and Quality are derived, not student-authored final scores.
5. EvidenceScore and SkillScore are server-derived.
6. Confidence is separate from SkillScore.
7. Invalid evidence scores cannot enter aggregation.
8. Assessment history is immutable.
9. Scoring configuration is versioned.

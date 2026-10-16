/**
 * Evidence and Artifact input types for the InternshipOS Readiness Engine.
 *
 * Reference: docs/SCORING_MODEL.md §2.1, §5, §6; docs/DOMAIN_MODEL.md §3-§5
 */

export type EvidenceType =
  | 'PROJECT'
  | 'GITHUB_REPOSITORY'
  | 'HACKATHON'
  | 'CERTIFICATE'
  | 'COURSEWORK';

export type EvidenceCategory = 'PRACTICAL' | 'LEARNING';

export type ConfidenceLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type ReadinessTier = 'EARLY_STAGE' | 'NEEDS_WORK' | 'CLOSE' | 'READY';

/**
 * Factual rubric answers associated with an evidence item for a specific skill.
 * Students do not directly author PracticalDepth or Quality; they are derived from structured facts.
 */
export interface EvidenceSkillFactInput {
  skillId: string;
  questionSetVersion: string;
  /** Practical depth (0-100), derived from structured rubric answers for practical evidence */
  practicalDepth?: number | null;
  /** Quality (0-100), derived from structured rubric answers */
  quality?: number | null;
  /** Direct score (0-100) for learning/certificate evidence */
  score?: number | null;
  /** Raw factual answers stored for provenance/auditing */
  answers?: Record<string, unknown> | null;
}

/**
 * An evidence item representing a project, repository, hackathon, certificate, or coursework.
 * Evidence is already lineage-resolved before entering the engine, carrying its resolved artifactId.
 */
export interface EvidenceInput {
  id: string;
  title: string;
  type: EvidenceType;
  category: EvidenceCategory;
  /** Single recency anchor date (activityDate) */
  activityDate: Date | string;
  /** Canonical underlying artifact identity */
  artifactId: string;
  /** Optional reference to a practical artifact corroborated by this (learning) evidence */
  corroboratesArtifactId?: string | null;
  /** Optional precalculated recency multiplier (0.5 - 1.0) */
  recencyMultiplier?: number | null;
  /** Skills demonstrated by this evidence item */
  skills: EvidenceSkillFactInput[];
}

/**
 * A skill-scoped view of an evidence item used during skill assessment.
 */
export interface SkillEvidenceInput {
  evidenceId: string;
  title: string;
  type: EvidenceType;
  category: EvidenceCategory;
  activityDate: Date | string;
  artifactId: string;
  corroboratesArtifactId?: string | null;
  questionSetVersion: string;
  practicalDepth?: number | null;
  quality?: number | null;
  score?: number | null;
  recencyMultiplier?: number | null;
}

/**
 * An evidence item with its computed evidenceScore and recencyMultiplier.
 */
export interface ScoredEvidenceItem {
  evidenceId: string;
  title: string;
  type: EvidenceType;
  category: EvidenceCategory;
  activityDate: Date;
  artifactId: string;
  corroboratesArtifactId?: string | null;
  questionSetVersion: string;
  practicalDepth: number | null;
  quality: number | null;
  recencyMultiplier: number;
  evidenceScore: number;
}

/**
 * A consolidated artifact grouping all representations referencing the same underlying artifact.
 * ArtifactScore = max(EvidenceScore for those Evidence rows)
 */
export interface ConsolidatedArtifact {
  artifactId: string;
  category: EvidenceCategory;
  /** Max evidence score across all representations for this artifact */
  artifactScore: number;
  /** The primary representation that established the peak score */
  primaryRepresentation: ScoredEvidenceItem;
  /** All representations of this artifact for this skill */
  representations: ScoredEvidenceItem[];
  /** Whether different representations for this artifact had significantly divergent scores */
  hasConflictingEvidence: boolean;
  /** Number of corroborating representations */
  corroborationCount: number;
}

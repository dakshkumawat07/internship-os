/**
 * Output and breakdown types for the InternshipOS Readiness Engine.
 *
 * Ensures all scoring calculations are fully explainable and deterministic.
 *
 * Reference: docs/SCORING_MODEL.md §7-§10, §13; docs/DOMAIN_MODEL.md §7
 */

import { ScoringConfig } from './config';
import { ConfidenceLevel, EvidenceCategory, ReadinessTier, ScoredEvidenceItem } from './evidence';
import { RoleSkillInput, SkillImportance } from './role';

export interface PracticalAggregationBreakdown {
  peakPracticalScore: number;
  qualifyingArtifactCount: number;
  nonQualifyingArtifactCount: number;
  totalPracticalArtifactCount: number;
  supportThreshold: number;
  primaryContribution: number;
  secondaryContribution: number;
  tertiaryContribution: number;
  tailContribution: number;
  totalPracticalScore: number;
  qualifyingScores: number[];
  nonQualifyingScores: number[];
}

export interface CertificateAggregationBreakdown {
  mode: 'STANDALONE' | 'WITH_PRACTICAL' | 'NONE';
  certificateCount: number;
  rawCertificateScore: number;
  appliedCap: number;
  finalCertificateScore: number;
  sortedCertificateScores: number[];
}

export interface SkillScoreBreakdown {
  practical: PracticalAggregationBreakdown;
  certificate: CertificateAggregationBreakdown;
  rawTotalScore: number;
  roundedScore: number;
  finalSkillScore: number;
  explanation: string;
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  reasons: string[];
  qualifyingPracticalCount: number;
  corroborationCount: number;
  hasConflictingEvidence: boolean;
  hasCertificateCorroboration: boolean;
}

export interface SkillAssessmentOutput {
  skillId: string;
  skillName?: string;
  importance: SkillImportance;
  weight: number;
  skillScore: number;
  confidence: ConfidenceLevel;
  confidenceDetails: ConfidenceAssessment;
  breakdown: SkillScoreBreakdown;
  practicalArtifactCount: number;
  certificateCount: number;
  contributingEvidence: ScoredEvidenceItem[];
}

export interface ExcludedEvidenceItem {
  evidenceId: string;
  title: string;
  skillId: string;
  reason: 'REQUIRES_REANSWERING' | 'INVALID_INPUT' | 'INCOMPATIBLE_VERSION';
  questionSetVersion: string;
  details?: string;
}

export interface SkillGapOutput {
  skillId: string;
  skillName?: string;
  importance: SkillImportance;
  weight: number;
  currentScore: number;
  targetScore: number;
  gap: number;
  priorityScore: number;
  isCoreGateTrigger: boolean;
  recommendation: string;
}

export interface OverallReadinessOutput {
  overallScore: number;
  readinessTier: ReadinessTier;
  rawTierBeforeCoreGate: ReadinessTier;
  coreGateTriggered: boolean;
  coreGateSkillIds: string[];
  totalSkillsAssessed: number;
  totalWeight: number;
  scoringConfigVersion: string;
  frameworkVersion: string;
  evaluationDate: string;
}

export interface ReadinessInput {
  targetRoleId: string;
  roleTitle?: string;
  frameworkVersion: string;
  roleSkills: RoleSkillInput[];
  evidence: Array<{
    id: string;
    title: string;
    type: string;
    category: EvidenceCategory;
    activityDate: Date | string;
    artifactId: string;
    corroboratesArtifactId?: string | null;
    recencyMultiplier?: number | null;
    skills: Array<{
      skillId: string;
      questionSetVersion: string;
      practicalDepth?: number | null;
      quality?: number | null;
      score?: number | null;
      answers?: Record<string, unknown> | null;
    }>;
  }>;
  evaluationDate: Date | string;
  scoringConfig?: ScoringConfig;
}

export interface ReadinessOutput {
  overall: OverallReadinessOutput;
  skills: SkillAssessmentOutput[];
  skillGaps: SkillGapOutput[];
  excludedEvidence: ExcludedEvidenceItem[];
  evaluationDate: string;
}

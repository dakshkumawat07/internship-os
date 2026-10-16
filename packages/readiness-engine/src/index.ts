/**
 * @internship-os/readiness-engine
 *
 * Pure TypeScript deterministic readiness scoring engine for InternshipOS.
 *
 * Zero external dependencies. Zero side-effects. Zero system clock calls.
 */

// Core calculation entrypoint
export { calculateReadiness } from './engine';

// Component scoring functions (ARCHITECTURE.md §5)
export { scoreEvidence } from './scoring/evidence-scorer';
export { aggregateSkillScore } from './scoring/skill-scorer';
export { computeRoleReadiness, applyCoreOverride, determineReadinessTier } from './scoring/role-readiness';
export { computeSkillGaps } from './scoring/skill-gaps';
export { calculateRecencyMultiplier, getElapsedMonths } from './scoring/recency';
export { consolidateArtifacts } from './scoring/artifact-consolidator';
export { aggregatePracticalArtifacts } from './scoring/practical-aggregator';
export { aggregateCertificates } from './scoring/certificate-aggregator';

// Config and Framework constants
export { DEFAULT_SCORING_CONFIG_V1 } from './config/default-scoring-config';
export {
  FRAMEWORK_VERSION_MVP1,
  MVP1_ROLES,
  SWE_INTERN_SKILLS_MVP1,
  BACKEND_INTERN_SKILLS_MVP1,
  FRONTEND_INTERN_SKILLS_MVP1,
  DATA_ANALYST_INTERN_SKILLS_MVP1,
} from './config/mvp1-framework';

// Validation helpers
export {
  validateScoreRange,
  validateDate,
  validateDateOrder,
  validateRecencyMultiplier,
  validateRoleSkill,
  isQuestionSetVersionCompatible,
} from './validation/validator';

// Types and errors
export * from './types';

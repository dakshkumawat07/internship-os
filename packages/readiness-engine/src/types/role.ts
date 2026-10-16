/**
 * Role and Skill types for the InternshipOS Readiness Engine.
 *
 * Reference: docs/SCORING_MODEL.md §2.2, §2.4; docs/DECISIONS.md ADR-026, ADR-027
 */

export type SkillImportance = 'CORE' | 'IMPORTANT' | 'USEFUL' | 'OPTIONAL';

export const IMPORTANCE_WEIGHT_MAP: Readonly<Record<SkillImportance, number>> = {
  CORE: 4,
  IMPORTANT: 3,
  USEFUL: 2,
  OPTIONAL: 1,
};

export interface RoleSkillInput {
  skillId: string;
  skillName?: string;
  importance: SkillImportance;
  weight: number;
  frameworkVersion: string;
}

export interface TargetRoleInput {
  roleId: string;
  roleTitle?: string;
  frameworkVersion: string;
  roleSkills: RoleSkillInput[];
}

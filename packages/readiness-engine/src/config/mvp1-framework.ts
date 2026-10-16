import { RoleSkillInput, TargetRoleInput } from '../types/role';

/**
 * Locked role-skill framework for mvp-1.
 *
 * Source: docs/DECISIONS.md ADR-027
 */

export const FRAMEWORK_VERSION_MVP1 = 'mvp-1';

export const SWE_INTERN_SKILLS_MVP1: ReadonlyArray<RoleSkillInput> = Object.freeze([
  { skillId: 'dsa', skillName: 'Data Structures & Algorithms', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'prog-fund', skillName: 'Programming Fundamentals', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'git', skillName: 'Git & Version Control', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'db-sql', skillName: 'Database Systems & SQL', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'web-rest', skillName: 'Web Fundamentals & REST APIs', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'testing-qa', skillName: 'Testing & Quality Assurance', importance: 'USEFUL', weight: 2, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'sys-design', skillName: 'System Design & Architecture', importance: 'OPTIONAL', weight: 1, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
]);

export const BACKEND_INTERN_SKILLS_MVP1: ReadonlyArray<RoleSkillInput> = Object.freeze([
  { skillId: 'db-sql', skillName: 'Database Systems & SQL', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'web-rest', skillName: 'Web Fundamentals & REST APIs', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'prog-fund', skillName: 'Programming Fundamentals', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'git', skillName: 'Git & Version Control', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'testing-qa', skillName: 'Testing & Quality Assurance', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'dsa', skillName: 'Data Structures & Algorithms', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'sys-design', skillName: 'System Design & Architecture', importance: 'USEFUL', weight: 2, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
]);

export const FRONTEND_INTERN_SKILLS_MVP1: ReadonlyArray<RoleSkillInput> = Object.freeze([
  { skillId: 'frontend-core', skillName: 'Frontend Core (HTML/CSS/JS)', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'frontend-frameworks', skillName: 'Frontend Frameworks & UI Engineering', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'web-rest', skillName: 'Web Fundamentals & REST APIs', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'git', skillName: 'Git & Version Control', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'prog-fund', skillName: 'Programming Fundamentals', importance: 'USEFUL', weight: 2, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'testing-qa', skillName: 'Testing & Quality Assurance', importance: 'USEFUL', weight: 2, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'dsa', skillName: 'Data Structures & Algorithms', importance: 'OPTIONAL', weight: 1, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
]);

export const DATA_ANALYST_INTERN_SKILLS_MVP1: ReadonlyArray<RoleSkillInput> = Object.freeze([
  { skillId: 'db-sql', skillName: 'Database Systems & SQL', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'data-analysis', skillName: 'Data Analysis & Visualization', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'applied-stats', skillName: 'Applied Statistics & Mathematics', importance: 'CORE', weight: 4, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'prog-fund', skillName: 'Programming Fundamentals', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'git', skillName: 'Git & Version Control', importance: 'IMPORTANT', weight: 3, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
  { skillId: 'web-rest', skillName: 'Web Fundamentals & REST APIs', importance: 'OPTIONAL', weight: 1, frameworkVersion: FRAMEWORK_VERSION_MVP1 },
]);

export const MVP1_ROLES: Readonly<Record<string, TargetRoleInput>> = Object.freeze({
  'swe-intern': {
    roleId: 'swe-intern',
    roleTitle: 'Software Engineer Intern',
    frameworkVersion: FRAMEWORK_VERSION_MVP1,
    roleSkills: [...SWE_INTERN_SKILLS_MVP1],
  },
  'backend-intern': {
    roleId: 'backend-intern',
    roleTitle: 'Backend Developer Intern',
    frameworkVersion: FRAMEWORK_VERSION_MVP1,
    roleSkills: [...BACKEND_INTERN_SKILLS_MVP1],
  },
  'frontend-intern': {
    roleId: 'frontend-intern',
    roleTitle: 'Frontend Developer Intern',
    frameworkVersion: FRAMEWORK_VERSION_MVP1,
    roleSkills: [...FRONTEND_INTERN_SKILLS_MVP1],
  },
  'data-analyst-intern': {
    roleId: 'data-analyst-intern',
    roleTitle: 'Data Analyst Intern',
    frameworkVersion: FRAMEWORK_VERSION_MVP1,
    roleSkills: [...DATA_ANALYST_INTERN_SKILLS_MVP1],
  },
});

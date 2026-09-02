# InternshipOS — Project Memory / Handoff

## Current Product
InternshipOS

## Current Objective
Build a professional, evidence-based internship-readiness web application for 1st–3rd year college students.

## Current Product Flow
Sign up
→ Profile
→ Target Role
→ Skills
→ Evidence
→ Readiness
→ Skill Gaps
→ Action Plan
→ Progress

## Core Differentiator
Claimed skill ≠ demonstrated skill.

## Approved Visual Direction
The Mark — Assay / Verification / Foundry

Requirements:
- premium
- professional
- 3D
- scroll-responsive
- responsive
- recruiter-facing
- no blue/purple AI theme
- no generic AI/SaaS aesthetic

## Repository
GitHub repository:
internship-os

## Source of Truth
- 00-PRD.md
- 01-RULES.md
- 02-PHASES.md
- 03-MEMORY.md
- DESIGN_SYSTEM.md
- ARCHITECTURE.md
- DOMAIN_MODEL.md
- SCORING_MODEL.md
- API_SPEC.md
- DECISIONS.md

## AI Team
ChatGPT:
Product and architecture coordination; final review.

Claude:
Architecture/design/critical review.

Antigravity:
Primary implementation.

Codex:
Testing/debugging/refactoring/review.

Gemini:
Independent critique/research.

## Locked Technical Direction
Frontend:
React + TypeScript + Vite + TailwindCSS

Backend:
Node.js + TypeScript + Express

Database:
PostgreSQL + Prisma

Validation:
Zod

Authentication:
JWT + database-tracked refresh token + Argon2id

Testing:
Jest + Supertest + React Testing Library + Playwright

Architecture:
Modular monolith

Readiness engine:
Pure isolated package with no Express/Prisma/HTTP dependency.

## Locked Product Constraints
- no black-box LLM grading in MVP
- no leaderboard
- no employer-facing verified credential
- no file uploads in MVP
- URL-based verification
- evidence reusable across roles
- duplicate evidence must not double-count
- team contribution must be explicit
- historical assessments must be immutable/reproducible
- public deployed recruiter demo preferred
- local development should be simple and documented

## Readiness Engine
EvidenceScore:
(0.6 × PracticalDepth + 0.4 × Quality) × RecencyMultiplier

SkillScore:
e1 + 0.4e2 + 0.2e3 + 0.1 remaining evidence
capped at 100

Importance:
CORE = 4
IMPORTANT = 3
USEFUL = 2
OPTIONAL = 1

Core gate:
If any CORE skill < 40, readiness tier cannot exceed Needs Work.

Tiers:
0–39 Early Stage
40–69 Needs Work
70–84 Close
85–100 Ready

Priority:
NormalizedGap × ImportanceWeight × ExpectedImpact

CORE priority override applies.

## Current Repository State
Design system has been committed and pushed.

## Current Work
Finalizing the evidence assessment rubric before database implementation.

## Important Working Rule
Do not start implementation merely because a design idea exists. Lock the relevant specification first.

## Last Known Next Action
Review and finalize Evidence Rubric v1, then create technical schema/source-of-truth files and begin implementation in controlled tickets.

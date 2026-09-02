# InternshipOS — Engineering & Multi-Agent Rules

## Status
Protected project contract

## Core Rule
Implementation agents must implement the approved product and architecture. They must not silently redefine it.

## Source of Truth
Before making changes, agents must read the relevant protected documentation.

Protected documents:
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

## Product Rules
- Stay inside the approved MVP.
- Do not add features merely because they are technically interesting.
- Do not introduce AI features without an approved product reason.
- Do not turn the product into a generic AI career assistant.

## Architecture Rules
- Use the approved modular-monolith architecture.
- Do not introduce microservices without explicit approval.
- Do not introduce Kubernetes without explicit approval.
- Keep the readiness engine isolated from Express, Prisma, HTTP, and external side effects.
- Do not directly access the database from the frontend.
- Do not bypass Prisma with scattered raw SQL.

## Readiness Rules
- The readiness engine is deterministic and auditable.
- Do not change formulas, thresholds, weights, or gates without approval.
- Do not introduce LLM/ML scoring in MVP.
- Do not score raw GitHub commit counts.
- Do not score repository counts.
- Do not use prestige multipliers.
- Do not double-count duplicate evidence.
- Team evidence must describe the student's actual contribution.
- Certificates are not equivalent to practical evidence.
- Historical readiness assessments must remain reproducible.

## Design Rules
- DESIGN_SYSTEM.md is a protected visual contract.
- No blue/purple AI gradient theme.
- No generic SaaS/glassmorphism treatment.
- No decorative 3D without product purpose.
- No random visual patterns invented per component.
- Use the defined design tokens.
- New visual patterns must be proposed before implementation.

## Security Rules
- Never commit secrets.
- Never commit .env files containing real credentials.
- Validate untrusted input.
- Enforce ownership checks on student-owned resources.
- Never trust client-supplied ownership identifiers.
- Authentication and authorization changes require careful review.

## Git Rules
Use small, meaningful commits.

Preferred examples:
- feat(auth): add student registration
- feat(evidence): add project evidence flow
- fix(engine): enforce core readiness gate
- test(engine): add recency boundary tests
- docs: update architecture contract

Avoid:
- final
- final2
- test
- changes
- done
- misc

## Agent Reporting Rules
Every implementation task must report:
1. What changed
2. Files changed
3. Tests/checks run
4. Result of those checks
5. Any unresolved issue
6. Any proposed architecture/design change

## Protected File Rule
Agents must not silently modify protected contracts.

If implementation reveals an ambiguity:
- stop
- describe the issue
- propose the smallest change
- wait for approval

## Multi-Agent Roles

### ChatGPT
Product/architecture coordination and final review.

### Claude
Architecture, design, and critical review.

### Antigravity
Primary implementation.

### Codex
Testing, debugging, refactoring, implementation review.

### Gemini
Independent critique and research when useful.

## No AI-Specific Project Artifacts
Do not create files whose purpose is to advertise which AI generated them.

Examples not allowed:
- ai-generated-final.ts
- claude-helper.js
- chatgpt-code/
- gemini-output/
- agent-junk/

The repository should look like a professional engineering project.

## Completion Rule
A task is not complete merely because code exists.

A task is complete when:
- implementation works
- tests/checks pass
- documentation is updated when required
- Git changes are clean and scoped
- acceptance criteria are satisfied

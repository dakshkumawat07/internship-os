# InternshipOS — DESIGN_SYSTEM.md

**Status:** Locked specification. Visual direction: **"The Mark"** (Assay / Verification). This document is the single source of truth for all visual decisions — implementation agents consume tokens from here, they don't invent them. Any gap in this spec gets proposed as an addition to this file, not resolved ad hoc in a component.

---

## 1. Design Principles

1. **Depth comes from material, not decoration.** Emboss, texture, and weight communicate premium quality — never gradients, glow, or blur.
2. **One signature moment, everywhere else restrained.** The seal/strike motif is the memorable thing; surrounding UI stays quiet and disciplined.
3. **Every visual element earns its place.** No icon, badge, card, or animation exists without a real content reason.
4. **The dashboard is a working tool, not a brand showcase.** Ceremony belongs on marketing pages; the authenticated app prioritizes speed and legibility.
5. **Numbers are never replaced by metaphor — only accompanied by it.** Every visualization (seal depth, fog, etc.) has a plain-text equivalent alongside it.

---

## 2. Brand Personality

Premium, confident, trustworthy, sophisticated, technical, human, memorable — expressed as: *quiet authority, not loud enthusiasm.* InternshipOS should read like a well-made object you'd trust with something important, not a startup announcing itself.

---

## 3. Color System

### Base tokens (locked — do not alter)
| Token | Hex |
|---|---|
| `--ios-color-primary` | `#22201D` |
| `--ios-color-secondary` | `#9C7A44` |
| `--ios-color-accent` | `#B5651D` |
| `--ios-color-bg` | `#EDE7DC` |
| `--ios-color-surface` | `#E3DCCC` |
| `--ios-color-text` | `#211E1A` |
| `--ios-color-text-muted` | `#6E6558` |
| `--ios-color-success` | `#3F6B52` |
| `--ios-color-warning` | `#9C7A44` |
| `--ios-color-error` | `#9C3B2E` |

### Derived semantic tokens
| Token | Hex | Use |
|---|---|---|
| `--ios-bg-page` | `#EDE7DC` | Default app background |
| `--ios-bg-page-dark` | `#22201D` | Deliberate "dark moment" sections only (marketing hero, seal-completion celebration) — never for text-dense dashboard screens |
| `--ios-bg-surface` | `#E3DCCC` | Cards, panels |
| `--ios-bg-surface-raised` | `#FAF8F2` | Elevated content: modals, the readiness score focal panel |
| `--ios-bg-surface-sunken` | `#DAD2BE` | Inputs, pressed states, skeleton loaders |
| `--ios-border-default` | `#D7CFBC` | Hairline borders, dividers |
| `--ios-border-strong` | `#B8AF9E` | Heavier dividers, disabled fills |
| `--ios-text-primary` | `#211E1A` | Body, headings |
| `--ios-text-secondary` | `#4A453D` | Sub-headings, labels |
| `--ios-text-muted` | `#6E6558` | Metadata, placeholders |
| `--ios-text-disabled` | `#A39C8C` | Disabled states |
| `--ios-text-on-dark` | `#EDE7DC` | Text on `--ios-bg-page-dark` |
| `--ios-text-on-dark-muted` | `#B7AC97` | Muted text on dark sections |

### Interactive states
| State | Token | Hex |
|---|---|---|
| Primary button rest | `--ios-btn-primary-bg` | `#22201D` |
| Primary button hover | `--ios-btn-primary-bg-hover` | `#302D27` |
| Primary button active (pressed) | `--ios-btn-primary-bg-active` | `#1A1815` |
| Accent button rest | `--ios-btn-accent-bg` | `#B5651D` |
| Accent button hover | `--ios-btn-accent-bg-hover` | `#C27430` |
| Accent button active | `--ios-btn-accent-bg-active` | `#9A5419` |
| Focus ring | `--ios-focus-ring` | `#B5651D` at 2px solid, 2px offset |
| Disabled fill | `--ios-disabled-bg` | `#B8AF9E` |
| Disabled text | `--ios-disabled-text` | `#8C8577` |

### Success / warning / error (tinted backgrounds for banners, badges, toasts)
| Semantic | Background | Text | Border |
|---|---|---|---|
| Success | `#E4EBE4` | `#3F6B52` | `#9CB5A2` |
| Warning | `#EFE7D8` | `#7A5F35`* | `#C9B48A` |
| Error | `#F3E2DE` | `#9C3B2E` | `#D9A79D` |

*The locked warning color `#9C7A44` fails AA text contrast on light backgrounds at small sizes — use `#9C7A44` for icons/borders only, and this darker `#7A5F35` for actual warning text. Verify all pairs against WCAG AA with a contrast tool during implementation before shipping — the values here are a careful starting point, not a substitute for that check.

### Dark/light usage
There is **no user-toggleable dark mode in MVP.** `--ios-bg-page-dark` exists solely for deliberate brand moments (marketing hero, seal-completion celebration) — never apply it to functional, text-dense dashboard screens where reading speed matters more than drama.

---

## 4. Typography System

| Role | Family | Source |
|---|---|---|
| Display | Fraunces | Google Fonts (variable) |
| Body | Source Serif 4 | Google Fonts (variable) |
| UI | Inter | Google Fonts |
| Data readouts | IBM Plex Mono | Google Fonts — reserved for numeric data only (scores, dates, percentages) |

### Type scale
| Token | Size | Line height |
|---|---|---|
| `--ios-text-xs` | 12px | 16px |
| `--ios-text-sm` | 14px | 20px |
| `--ios-text-base` | 16px | 24px |
| `--ios-text-md` | 18px | 28px |
| `--ios-text-lg` | 20px | 30px |
| `--ios-text-xl` | 24px | 32px |
| `--ios-text-2xl` | 30px | 38px |
| `--ios-text-3xl` | 36px | 44px |
| `--ios-text-4xl` | 48px | 56px |
| `--ios-text-5xl` | 64px | 70px — hero display only |

### Heading hierarchy
- **H1** (page/hero title): Fraunces, weight 500–600 (600 reserved for the single hero moment on a page), `text-4xl`–`text-5xl`, letter-spacing `-0.01em`, line-height 1.1–1.15.
- **H2** (section header): Fraunces, weight 500, `text-3xl`, letter-spacing `-0.005em`, line-height 1.2.
- **H3**: Marketing pages — Fraunces 500, `text-xl`. Dashboard — Inter 600 (semibold), `text-lg`. This split matches the ceremonial-vs-working layout shift defined in the approved direction.
- **Body**: Source Serif 4, regular, `text-base`–`text-md`, line-height 1.6, max line length ~70–75 characters.
- **UI text** (labels, nav, buttons, forms, table content): Inter, regular/medium, `text-sm`–`text-base`, line-height 1.4–1.5.
- **Data** (scores, dates, metadata): IBM Plex Mono, regular only (no bold — use size/color for emphasis, not weight), tabular-nums, `text-sm`–`text-base`.

### Rules
- Never track out labels in ALL CAPS. Sentence case, normal tracking, distinguished by size/weight/color instead.
- Positive letter-spacing is never used to fake a "premium" label — that reads as generic SaaS chrome.
- Fraunces weight 600 appears **at most once per screen** — the single hero moment, not repeated across every heading.

---

## 5. Layout System

**Max widths:** `--ios-container-max: 1280px` (default content) · `--ios-container-narrow: 720px` (long-form copy) · `--ios-container-wide: 1440px` (full-bleed hero/3D only).

**Grid:** 12-column, 24px gutters on marketing pages (desktop ≥1024px); margins 64px desktop / 32px tablet / 20px mobile. The dashboard uses flexible panel-stacking built from the spacing scale directly, not a strict magazine grid.

**Spacing scale** (4px base, matches Tailwind defaults for direct implementation):
`--ios-space-1: 4px` · `-2: 8px` · `-3: 12px` · `-4: 16px` · `-5: 24px` · `-6: 32px` · `-7: 48px` · `-8: 64px` · `-9: 96px` · `-10: 128px`

Section vertical padding (marketing): 96–128px desktop / 64px tablet / 48px mobile. Dashboard panel padding: 24px desktop / 16px mobile. Card internal padding: 24px.

**Page sections (marketing):** Hero → Claim vs. Evidence (core differentiator) → How it works (Claim → Evidence → Assessment → Gap → Action → New Evidence, as an actual sequence) → Role coverage (4 target roles) → Evidence types → Trust/verification statement → Final CTA → Footer.

**Dashboard sections:** Top nav → Readiness summary panel (score, tier, core-gate status) → Skill breakdown → Priority action list → Evidence library → Progress history.

---

## 6. Border/Radius System

| Token | Value | Use |
|---|---|---|
| `--ios-radius-none` | 0 | Seal/stamp graphic, full-bleed panels |
| `--ios-radius-sm` | 2px | Buttons, chips, badges — "struck edge" |
| `--ios-radius-md` | 4px | Cards, panels, inputs |
| `--ios-radius-lg` | 8px | Modals, large containers only |

**Never exceed 8px anywhere.** No pill-shaped buttons or badges.

---

## 7. Shadows / Elevation

Direction 2 rejects drop-shadow-as-default in favor of emboss. Two primary tokens:

- `--ios-emboss-raised`: `inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.15)` — subtle raised-surface feel for panels.
- `--ios-emboss-inset`: `inset 0 -1px 0 rgba(255,255,255,0.3), inset 0 1px 0 rgba(0,0,0,0.18)` — pressed/active buttons, input fields.
- `--ios-shadow-float`: `0 8px 24px rgba(34,32,29,0.18)` — the **only** true drop shadow in the system, reserved for genuinely floating elements: modals and dropdown menus. One elevation level, not a 5-step shadow scale.

---

## 8. Surface / Material Treatment

- Panels: optional low-opacity (2–4%) tileable paper-grain texture as a background-image — reinforces the parchment feel without adding visual noise or hurting performance. Degrade to flat color under reduced-data/low-power conditions.
- Metallic accents (seal graphic, small accent icons, dividers): a subtle 2–3 stop linear gradient within the brass/copper hue range only (e.g. `#9C7A44` → `#B5651D` → `#8C6E54`), implying brushed metal. **Never** used as a background wash on large surfaces, and never outside the brass/copper hue range.

---

## 9. Buttons

| Variant | Fill | Text | Use |
|---|---|---|---|
| Primary | `--ios-btn-primary-bg` | `--ios-text-on-dark` | Default action button |
| Accent/Verification | `--ios-btn-accent-bg` | `--ios-text-on-dark` | The single most important action per screen (e.g. "Run Readiness Assessment," "Submit Evidence") — never more than one accent button visible at once |
| Secondary | transparent, 1.5px `--ios-color-primary` border | `--ios-text-primary` | Secondary actions |
| Ghost | transparent, no border | `--ios-text-primary` or `--ios-color-accent` | Tertiary/inline actions |

Sizes: sm 32px height · md 40px height (default) · lg 48px height (hero CTAs only).

Icons appear only when they add real meaning (e.g. a checkmark on "Mark Complete"). **Never** append a decorative arrow (→) to link or button text.

---

## 10. Forms and Inputs

- Fields use `--ios-bg-surface-sunken` + `--ios-emboss-inset`, `--ios-radius-md`, `--ios-border-default` at rest.
- Focus: border becomes `--ios-color-accent` (solid color change, not glow) plus the standard focus ring.
- Labels sit **above** the field as real `<label>` elements — never placeholder-as-label.
- Helper/error text below the field, `text-xs`, error text in `--ios-color-error` with a small inline icon — never color alone.
- Required fields marked with an accessible asterisk + label, not color.

---

## 11. Cards / Panels

- Base: `--ios-bg-surface` fill, `--ios-border-default` border, `--ios-radius-md`, no drop shadow (emboss-raised only if genuinely nested/highlighted).
- **Card treatment varies by content type** — an evidence token, a skill-gap row, and an action item are visually distinct components, not the same rounded-card template reused everywhere. The evidence library grid is the one legitimate place a repeated-card grid is appropriate, since that content genuinely is a homogeneous collection.

---

## 12. Navigation

- Top nav: static; a 1px `--ios-border-default` bottom border appears on scroll (not a shadow).
- Logo/seal-glyph left, links center-or-right, primary CTA right.
- Active link state: underline in `--ios-color-accent` — never a pill/chip background.
- Mobile: hamburger + slide-in panel, used consistently across marketing and dashboard for MVP simplicity. (A persistent bottom tab bar for the dashboard is a reasonable post-MVP enhancement, not required now.)

---

## 13. Tables / Data Display

- No zebra-striping — a single `--ios-border-default` hairline between rows instead.
- Column headers: Inter medium, `text-sm`, `--ios-text-secondary`, **sentence case, never uppercase.**
- Numeric columns right-aligned, IBM Plex Mono, tabular-nums.
- Row hover: subtle `--ios-bg-surface-sunken` tint, no shadow.

---

## 14. Badges / Status Indicators

- Shape: small rectangle, `--ios-radius-sm` — never a pill.
- Semantic background/text pairs per §3's success/warning/error table, or neutral (`--ios-bg-surface-sunken` / `--ios-text-secondary`) for non-semantic tags (evidence type).
- Status always icon+text where meaningful, never color alone.
- Readiness tier mapping: Early Stage = neutral · Needs Work = warning-toned · Close = accent-toned (copper — "almost struck") · Ready = success-toned.

---

## 15. Readiness Score Visualization

- Primary visual: the seal/medallion graphic, its impression depth/crispness mapped 0–100 to the readiness score (e.g. via an SVG mask or radial reveal on the struck pattern).
- Numeric score + tier label always rendered as real, readable text directly beside the graphic — never inside a canvas-only element.
- CORE-gate-triggered state gets a distinct visual (e.g. a visible flaw/incomplete center on the seal) **plus** explicit text naming the triggering CORE skill(s) — the visual metaphor never replaces the plain-language explanation.

---

## 16. Evidence Visualization

Each evidence item is an `EvidenceToken`: type glyph (distinct simple mark per PROJECT / GITHUB_REPO / HACKATHON / CERTIFICATE), title, skill tags, depth/quality/recency readout in Plex Mono, confidence label, verification indicator (small check/seal icon if `verification_url` present). Desktop: 2–3 column grid. Mobile: single-column list.

---

## 17. Skill-Gap Visualization

Per-skill row: skill name, importance-weight badge, current score (numeric + mini partial-seal graphic), confidence label. Sorted by priority score by default. CORE skills get a small "CORE" badge and slightly heavier row treatment — never color alone.

---

## 18. Action-Plan Visualization

A sorted list (not a kanban board — not a locked product feature) of `ActionItemRow`s by priority rank: title, targeted skill + importance, short description, status. Completed items get a small "struck" checkmark treatment. Dismissed items move to a collapsed section at reduced opacity rather than disappearing.

---

## 19. Dashboard Visual Language

Warm bone/parchment background, minimal chrome, generous spacing from the defined scale, panels distinguished by border+fill rather than shadow. Brass/copper reserved for primary actions and key data highlights only — never decorative. Plex Mono used consistently for all numeric data.

---

## 20. 3D Design Rules

- **One primary 3D asset family: the verification seal/medallion.** No other 3D elements without a documented product reason.
- Materials: brushed metal (brass/copper hues) and matte stone (neutral hues) only — no glass, no glossy plastic, no emissive/neon materials.
- Lighting: single soft key light + subtle fill, warm "museum object" quality — no colored rim lighting, no lens flares, no neon glow.
- Geometry budget: target under 50k triangles for the hero asset, single texture atlas — realistic for a small team and consistent with the low-poly-is-authentic aesthetic (this is a struck medallion, not a photoreal prop).
- Always paired with a static 2D fallback (a rendered still of the seal) for reduced-motion, low-power, or failed-load scenarios.

---

## 21. 3D Asset Strategy

- **Build once, parameterize, reuse.** The single seal asset represents different states (partial/complete impression, per-skill mini-versions) via shader uniforms or texture swaps — not multiple modeled objects.
- Format: glTF/GLB — small footprint, compatible with three.js/react-three-fiber on the locked React/TS stack.
- The authenticated dashboard does **not** load the 3D engine/asset by default — it uses the static/2D seal representation. Full 3D is a marketing-page-only experience.

---

## 22. Scroll Interaction Rules

- **One primary scroll-driven moment per page** — the seal striking down in the marketing hero/story section. No fade-in-on-scroll applied to every subsequent section.
- Scroll-linked animation is scrubbed to scroll position (progress-based), not time-based autoplay — works correctly at any scroll speed and pauses cleanly under reduced motion.
- All other section transitions: no motion, or at most a simple opacity fade under 200ms.

---

## 23. Motion System

| Moment | Duration | Notes |
|---|---|---|
| Hover/focus micro-feedback | 100–150ms, ease-out | Background tint / underline / brightness shift only — no scale/bounce |
| Standard UI transition (panel open, tab switch) | 200–250ms, ease-in-out | |
| Evidence added → mark deepens | 400–600ms | Custom eased curve: `cubic-bezier(0.2, 0.8, 0.2, 1)` (fast-in, settle-out — mimics a physical press) |
| Assessment completed → seal completes | 800ms–1s | The primary celebratory moment — restrained, not confetti/fireworks |
| Task completed → confirmation | 200–300ms | Small "stamp" checkmark motion |

**Rule:** motion never fires because an element entered the viewport. It fires only on a real state change (data changed, action completed) or as the one designated hero moment per page.

---

## 24. Hover / Focus / Active States

- **Hover:** subtle tint/underline/brightness shift only — no scale or bounce.
- **Focus (keyboard):** visible 2px `--ios-color-accent` outline, 2px offset, on every interactive element, always. `outline: none` without a replacement is never acceptable.
- **Active/pressed:** the `--ios-emboss-inset` treatment consistently applied to buttons and toggles — functional reinforcement of the stamp metaphor, not just decoration.

---

## 25. Responsive Breakpoints

`--ios-bp-mobile: 0–639px` · `--ios-bp-tablet: 640–1023px` · `--ios-bp-desktop: 1024–1439px` · `--ios-bp-wide: 1440px+`

---

## 26. Mobile Adaptations

- 3D seal → static image or lightweight CSS/SVG "impression" graphic; WebGL only loads after a capability check, never assumed.
- Grids collapse to single column; the evidence token grid becomes a single-column list.
- Minimum touch target: 44×44px.
- Navigation: hamburger + slide-in panel (§12).

---

## 27. Accessibility Requirements

- WCAG 2.1 AA minimum contrast for every text/background pairing actually shipped — verify with a contrast tool at implementation time, especially the brass/copper tones flagged in §3.
- Every interactive element keyboard-navigable with a visible focus state.
- No information conveyed by color alone anywhere (tiers, status badges, skill gaps, form errors).
- Every visual/3D element has a real-text equivalent in the DOM (score, tier, labels) — never data trapped inside a canvas or image only.
- Real `<label>` elements on all form fields.
- Minimum 44×44px touch targets.

---

## 28. `prefers-reduced-motion` Behavior

When set: scroll-driven sections render their end-state static image immediately (no scrubbing); strike/deepen animations become instant state changes or a ≤150ms opacity crossfade; all remaining transitions capped near 100ms. Implemented via the actual `prefers-reduced-motion` media query — an in-app toggle mirroring it is a reasonable future addition, not required for MVP.

---

## 29. Performance Rules

- 3D assets lazy-loaded and code-split, fetched only when the hero/story section approaches the viewport (intersection observer) — never on initial page load.
- Total 3D payload budget: glTF + textures under ~2–3MB.
- Fonts: `font-display: swap`, subset to used characters, only the weights actually used are loaded.
- Images: WebP/AVIF with fallback, responsive `srcset`, lazy-loaded below the fold.
- CSS: rely on Tailwind's production purge for a small bundle rather than hand-rolled stylesheets.
- JS: code-split by route so the dashboard bundle never includes marketing/3D code and vice versa.

---

## 30. Image / Asset Rules

- Paper-grain texture: one small tileable asset reused everywhere, never unique per surface.
- **No generic stock photography** (no "students smiling at laptops" imagery). Prefer the seal/mark motif, real product screenshots once available, and typographic treatments.
- One consistent icon set only (see §31).

---

## 31. Iconography

- Single icon family, geometric/line-based, consistent stroke weight (1.5px). No mixing filled and outline styles in the same context.
- Icons appear only where they add real meaning (evidence-type glyphs, verification checkmark, status confirmation) — never decoratively next to every heading or list item.
- `--ios-color-accent` reserved specifically for the verification/checkmark icon so it stays meaningful.

---

## 32. Empty / Loading / Error States

- **Empty:** explain what's missing and the action to take, in the interface's voice — e.g. *"No evidence yet. Add a project, repo, hackathon, or certificate to start building your readiness profile."* — with a clear primary action button, not a decorative illustration alone.
- **Loading:** skeleton panels in `--ios-bg-surface-sunken` with a subtle pulse (static under reduced motion) — never generic grey shimmer bars that clash with the warm palette.
- **Error:** plain, specific language about what happened and how to recover, in `--ios-color-error` styling, always paired with a recovery action where possible. Never apologetic or vague.

---

## 33. Do / Don't Examples

| Do | Don't |
|---|---|
| Underline for active nav state | Pill/chip background for active nav state |
| One accent-copper CTA per screen | Multiple competing accent buttons on one screen |
| Sentence-case labels | Tracked-out ALL-CAPS labels |
| Emboss/inset for depth | Drop shadows and blur/glass panels |
| Content-specific card components | One rounded-card template reused for everything |
| Icons only where meaningful | A decorative icon next to every heading |
| One scroll-driven hero moment | Fade-in-on-scroll for every section |
| Real product screenshots / the seal motif | Generic "smiling student at laptop" stock photography |
| 2–4px radii throughout | 16px+ pill radii |

---

## 34. Rules Specifically Preventing AI-Generated/Template UI

No blue/purple gradients, anywhere, ever. No glassmorphism or blur panels. No floating decorative blobs. No uniform SaaS card grid applied to unlike content. No tracked-out ALL-CAPS eyebrow labels. No meta strings joined with middle dots. No "WORD — fragment" em-dash labels. No tinted-near-black standing in for true black (use the specified warm hex values exactly). No arrow (→) appended to link/button text. No decorative icon beside every heading. No more than one orchestrated non-user-triggered motion moment per page. Every card style must be justified by its actual content type.

---

## 35. Component Naming Conventions

- React components: PascalCase, domain-language names — `EvidenceToken`, `SkillGapRow`, `ReadinessSeal`, `ActionItemRow`, `VerificationBadge`, `TierBadge`, `Panel`, `Button` (variant via prop, not separate component names).
- CSS custom properties: prefixed `--ios-`, semantic naming (`--ios-color-bg-page`, `--ios-space-4`, `--ios-radius-sm`) — never raw/context-free names.
- File structure: grouped by domain, matching the architecture spec's domain model — `components/evidence/`, `components/readiness/`, `components/action-plan/`, plus a small shared `components/ui/` for primitives (Button, Input, Badge, Panel).

---

## 36. Rules for Implementation Agents (Preventing Drift)

1. **This document is a protected, read-only contract** — the same status as `SCORING_MODEL.md` and `API_SPEC.md`. Deviations are proposed as a documented change here first, never implemented ad hoc in a component.
2. **No raw values in component code.** Every color, spacing, radius, and typography value is consumed from the defined token set (a Tailwind theme config extended with these exact tokens) — no raw hex codes, arbitrary pixel values, or Tailwind arbitrary-value classes like `bg-[#123456]`.
3. **A single token source file is the actual source of truth** this document maps to 1:1 — "does this match the design system" becomes a mechanically checkable question (diff against the config), not a subjective one.
4. **New UI patterns not covered here** (a new badge type, a new card variant) must be checked against this doc first; if genuinely uncovered, propose an addition to this file in the same PR rather than inventing silently.
5. **No new 3D assets, gradients, shadow styles, or animation patterns** beyond what's defined here without explicit sign-off — this ties directly to the "protected files" review rule in the architecture spec.
6. Any PR touching visual/token-level code should be reviewed against this document specifically, in addition to routine functional code review.

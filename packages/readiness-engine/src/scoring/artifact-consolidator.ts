/**
 * Artifact Consolidation Module.
 *
 * Consolidates multiple representations referencing the same underlying Artifact:
 * ArtifactScore = max(EvidenceScore for those Evidence rows)
 *
 * Deterministic ordering:
 * 1. EvidenceScore descending
 * 2. Canonical artifactId ascending as tie-breaker
 *
 * Reference: docs/SCORING_MODEL.md §5, §10, §11; docs/DECISIONS.md ADR-003, ADR-012
 */

import { ConsolidatedArtifact, ScoredEvidenceItem } from '../types/evidence';

/**
 * Consolidates a list of scored evidence items by their underlying artifactId.
 *
 * @param items - Scored evidence items for a specific skill
 * @returns Map or sorted array of consolidated artifacts
 */
export function consolidateArtifacts(items: ScoredEvidenceItem[]): ConsolidatedArtifact[] {
  const groups = new Map<string, ScoredEvidenceItem[]>();

  for (const item of items) {
    const list = groups.get(item.artifactId) ?? [];
    list.push(item);
    groups.set(item.artifactId, list);
  }

  const consolidated: ConsolidatedArtifact[] = [];

  for (const [artifactId, representations] of groups.entries()) {
    // Sort representations descending by evidenceScore, then evidenceId ascending for tie-breaking
    representations.sort((a, b) => {
      if (b.evidenceScore !== a.evidenceScore) {
        return b.evidenceScore - a.evidenceScore;
      }
      return a.evidenceId.localeCompare(b.evidenceId);
    });

    const primaryRepresentation = representations[0];
    const artifactScore = primaryRepresentation.evidenceScore;
    const category = primaryRepresentation.category;

    // Detect conflicting representations for the same artifact (ADR-012)
    // E.g. project claim 90 vs repository 20 (min < 0.5 * max or diff > 30)
    let hasConflictingEvidence = false;
    if (representations.length > 1) {
      const minScore = representations[representations.length - 1].evidenceScore;
      if (artifactScore - minScore > 30 || minScore < 0.5 * artifactScore) {
        hasConflictingEvidence = true;
      }
    }

    consolidated.push({
      artifactId,
      category,
      artifactScore,
      primaryRepresentation,
      representations,
      hasConflictingEvidence,
      corroborationCount: representations.length - 1,
    });
  }

  // Sort consolidated artifacts deterministically:
  // 1. artifactScore descending
  // 2. artifactId ascending
  consolidated.sort((a, b) => {
    if (b.artifactScore !== a.artifactScore) {
      return b.artifactScore - a.artifactScore;
    }
    return a.artifactId.localeCompare(b.artifactId);
  });

  return consolidated;
}

-- CreateEnum
CREATE TYPE "SkillImportance" AS ENUM ('CORE', 'IMPORTANT', 'USEFUL', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PROJECT', 'GITHUB_REPOSITORY', 'HACKATHON', 'CERTIFICATE', 'COURSEWORK');

-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('PRACTICAL', 'LEARNING');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReadinessTier" AS ENUM ('EARLY_STAGE', 'NEEDS_WORK', 'CLOSE', 'READY');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ArtifactKeyType" AS ENUM ('REPOSITORY', 'PROJECT_DEMO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "graduationYear" INTEGER,
    "institution" TEXT,
    "bio" TEXT,
    "targetRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "currentFrameworkVersion" TEXT NOT NULL DEFAULT 'mvp-1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_skills" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "importance" "SkillImportance" NOT NULL,
    "weight" INTEGER NOT NULL,
    "frameworkVersion" TEXT NOT NULL DEFAULT 'mvp-1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_configs" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "practicalDepthWeight" DOUBLE PRECISION NOT NULL,
    "qualityWeight" DOUBLE PRECISION NOT NULL,
    "recencyMin" DOUBLE PRECISION NOT NULL,
    "recencyMax" DOUBLE PRECISION NOT NULL,
    "recencyDecayMonths" INTEGER NOT NULL,
    "practicalW1" DOUBLE PRECISION NOT NULL,
    "practicalW2" DOUBLE PRECISION NOT NULL,
    "practicalW3" DOUBLE PRECISION NOT NULL,
    "practicalWTail" DOUBLE PRECISION NOT NULL,
    "practicalSupportThreshold" DOUBLE PRECISION NOT NULL,
    "certCapWithPractical" DOUBLE PRECISION NOT NULL,
    "certCapAlone" DOUBLE PRECISION NOT NULL,
    "certW1Standalone" DOUBLE PRECISION NOT NULL,
    "certW2Standalone" DOUBLE PRECISION NOT NULL,
    "certWTailStandalone" DOUBLE PRECISION NOT NULL,
    "certW1WithPractical" DOUBLE PRECISION NOT NULL,
    "certWTailWithPractical" DOUBLE PRECISION NOT NULL,
    "tierNeedsWorkMin" INTEGER NOT NULL,
    "tierCloseMin" INTEGER NOT NULL,
    "tierReadyMin" INTEGER NOT NULL,
    "coreGateMin" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifact_keys" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "keyType" "ArtifactKeyType" NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artifact_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "category" "EvidenceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "artifactId" TEXT,
    "corroboratesArtifactId" TEXT,
    "declaredArtifactId" TEXT,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "demoUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_skills" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "questionSetVersion" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_details" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "issuingOrganization" TEXT,
    "courseName" TEXT,
    "completionDate" TIMESTAMP(3),
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_repository_links" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "repoOwner" TEXT,
    "repoName" TEXT,
    "description" TEXT,
    "repoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repository_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_details" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "eventName" TEXT,
    "organizer" TEXT,
    "eventDate" TIMESTAMP(3),
    "teamSize" INTEGER,
    "placement" TEXT,
    "contributionDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_assessments" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "scoringConfigId" TEXT NOT NULL,
    "scoringConfigVersion" TEXT NOT NULL,
    "frameworkVersion" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "readinessTier" "ReadinessTier" NOT NULL,
    "coreGateTriggered" BOOLEAN NOT NULL DEFAULT false,
    "coreGateSkillIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_assessments" (
    "id" TEXT NOT NULL,
    "readinessAssessmentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "importance" "SkillImportance" NOT NULL,
    "weight" INTEGER NOT NULL,
    "confidence" "ConfidenceLevel" NOT NULL,
    "skillScore" DOUBLE PRECISION NOT NULL,
    "practicalArtifactCount" INTEGER NOT NULL DEFAULT 0,
    "certificateCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_assessment_evidence" (
    "id" TEXT NOT NULL,
    "skillAssessmentId" TEXT NOT NULL,
    "evidenceIdSnapshot" TEXT NOT NULL,
    "artifactIdSnapshot" TEXT,
    "artifactCanonicalKeySnapshot" TEXT,
    "evidenceType" "EvidenceType" NOT NULL,
    "evidenceCategory" "EvidenceCategory" NOT NULL,
    "evidenceTitle" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "questionSetVersion" TEXT NOT NULL,
    "practicalDepth" DOUBLE PRECISION,
    "quality" DOUBLE PRECISION,
    "recencyMultiplier" DOUBLE PRECISION,
    "evidenceScore" DOUBLE PRECISION NOT NULL,
    "isPrimaryPractical" BOOLEAN NOT NULL DEFAULT false,
    "contributionDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_assessment_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plans" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "readinessAssessmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_completions" (
    "id" TEXT NOT NULL,
    "actionItemId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE INDEX "role_skills_roleId_frameworkVersion_idx" ON "role_skills"("roleId", "frameworkVersion");

-- CreateIndex
CREATE UNIQUE INDEX "role_skills_roleId_skillId_frameworkVersion_key" ON "role_skills"("roleId", "skillId", "frameworkVersion");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_configs_version_key" ON "scoring_configs"("version");

-- CreateIndex
CREATE INDEX "artifacts_studentProfileId_idx" ON "artifacts"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "artifacts_id_studentProfileId_key" ON "artifacts"("id", "studentProfileId");

-- CreateIndex
CREATE INDEX "artifact_keys_artifactId_idx" ON "artifact_keys"("artifactId");

-- CreateIndex
CREATE INDEX "artifact_keys_artifactId_studentProfileId_idx" ON "artifact_keys"("artifactId", "studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "artifact_keys_studentProfileId_keyType_normalizedValue_key" ON "artifact_keys"("studentProfileId", "keyType", "normalizedValue");

-- CreateIndex
CREATE INDEX "evidence_studentProfileId_idx" ON "evidence"("studentProfileId");

-- CreateIndex
CREATE INDEX "evidence_studentProfileId_deletedAt_idx" ON "evidence"("studentProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "evidence_artifactId_studentProfileId_idx" ON "evidence"("artifactId", "studentProfileId");

-- CreateIndex
CREATE INDEX "evidence_corroboratesArtifactId_studentProfileId_idx" ON "evidence"("corroboratesArtifactId", "studentProfileId");

-- CreateIndex
CREATE INDEX "evidence_skills_skillId_idx" ON "evidence_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_skills_evidenceId_skillId_key" ON "evidence_skills"("evidenceId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_details_evidenceId_key" ON "certificate_details"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "github_repository_links_evidenceId_key" ON "github_repository_links"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_details_evidenceId_key" ON "hackathon_details"("evidenceId");

-- CreateIndex
CREATE INDEX "readiness_assessments_studentProfileId_idx" ON "readiness_assessments"("studentProfileId");

-- CreateIndex
CREATE INDEX "readiness_assessments_studentProfileId_evaluationDate_idx" ON "readiness_assessments"("studentProfileId", "evaluationDate");

-- CreateIndex
CREATE UNIQUE INDEX "readiness_assessments_id_studentProfileId_key" ON "readiness_assessments"("id", "studentProfileId");

-- CreateIndex
CREATE INDEX "skill_assessments_skillId_idx" ON "skill_assessments"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_assessments_readinessAssessmentId_skillId_key" ON "skill_assessments"("readinessAssessmentId", "skillId");

-- CreateIndex
CREATE INDEX "skill_assessment_evidence_skillAssessmentId_idx" ON "skill_assessment_evidence"("skillAssessmentId");

-- CreateIndex
CREATE INDEX "skill_assessment_evidence_evidenceIdSnapshot_idx" ON "skill_assessment_evidence"("evidenceIdSnapshot");

-- CreateIndex
CREATE INDEX "skill_assessment_evidence_artifactIdSnapshot_idx" ON "skill_assessment_evidence"("artifactIdSnapshot");

-- CreateIndex
CREATE INDEX "action_plans_studentProfileId_idx" ON "action_plans"("studentProfileId");

-- CreateIndex
CREATE INDEX "action_plans_readinessAssessmentId_studentProfileId_idx" ON "action_plans"("readinessAssessmentId", "studentProfileId");

-- CreateIndex
CREATE INDEX "action_items_actionPlanId_idx" ON "action_items"("actionPlanId");

-- CreateIndex
CREATE INDEX "action_items_skillId_idx" ON "action_items"("skillId");

-- CreateIndex
CREATE INDEX "task_completions_actionItemId_idx" ON "task_completions"("actionItemId");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_targetRoleId_fkey" FOREIGN KEY ("targetRoleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skills" ADD CONSTRAINT "role_skills_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skills" ADD CONSTRAINT "role_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifact_keys" ADD CONSTRAINT "artifact_keys_artifactId_studentProfileId_fkey" FOREIGN KEY ("artifactId", "studentProfileId") REFERENCES "artifacts"("id", "studentProfileId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_artifactId_studentProfileId_fkey" FOREIGN KEY ("artifactId", "studentProfileId") REFERENCES "artifacts"("id", "studentProfileId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_corroboratesArtifactId_studentProfileId_fkey" FOREIGN KEY ("corroboratesArtifactId", "studentProfileId") REFERENCES "artifacts"("id", "studentProfileId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_details" ADD CONSTRAINT "certificate_details_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repository_links" ADD CONSTRAINT "github_repository_links_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_details" ADD CONSTRAINT "hackathon_details_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_assessments" ADD CONSTRAINT "readiness_assessments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_assessments" ADD CONSTRAINT "readiness_assessments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_assessments" ADD CONSTRAINT "readiness_assessments_scoringConfigId_fkey" FOREIGN KEY ("scoringConfigId") REFERENCES "scoring_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_readinessAssessmentId_fkey" FOREIGN KEY ("readinessAssessmentId") REFERENCES "readiness_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_skillAssessmentId_fkey" FOREIGN KEY ("skillAssessmentId") REFERENCES "skill_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_readinessAssessmentId_studentProfileId_fkey" FOREIGN KEY ("readinessAssessmentId", "studentProfileId") REFERENCES "readiness_assessments"("id", "studentProfileId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "action_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "action_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- =============================================================================
-- DOMAIN CHECK CONSTRAINTS
-- =============================================================================

-- 1. Practical evidence requires an Artifact.
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_practical_requires_artifact_check"
  CHECK (category != 'PRACTICAL' OR "artifactId" IS NOT NULL);

-- 2. Learning corroboration is allowed only in the canonical learning case.
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_corroboration_only_learning_check"
  CHECK ("corroboratesArtifactId" IS NULL OR category = 'LEARNING');

-- 3. artifactId and corroboratesArtifactId cannot refer to the same Artifact.
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_distinct_artifacts_check"
  CHECK ("artifactId" IS NULL OR "corroboratesArtifactId" IS NULL OR "artifactId" != "corroboratesArtifactId");

-- 4. Evidence category and type alignment.
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_category_type_alignment_check"
  CHECK (
    (category = 'PRACTICAL' AND type IN ('PROJECT', 'GITHUB_REPOSITORY', 'HACKATHON')) OR
    (category = 'LEARNING' AND type IN ('CERTIFICATE', 'COURSEWORK'))
  );

-- 5. Score range checks: 0-100 for persisted scores.
ALTER TABLE "readiness_assessments" ADD CONSTRAINT "readiness_assessments_overall_score_range_check"
  CHECK ("overallScore" >= 0 AND "overallScore" <= 100);

ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_skill_score_range_check"
  CHECK ("skillScore" >= 0 AND "skillScore" <= 100);

ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_score_range_check"
  CHECK ("evidenceScore" >= 0 AND "evidenceScore" <= 100);

ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_practical_depth_range_check"
  CHECK ("practicalDepth" IS NULL OR ("practicalDepth" >= 0 AND "practicalDepth" <= 100));

ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_quality_range_check"
  CHECK ("quality" IS NULL OR ("quality" >= 0 AND "quality" <= 100));

ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_recency_range_check"
  CHECK ("recencyMultiplier" IS NULL OR ("recencyMultiplier" >= 0.5 AND "recencyMultiplier" <= 1.0));

-- 5b. Practical snapshot requires non-null artifactIdSnapshot and non-empty artifactCanonicalKeySnapshot.
ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_practical_artifact_snapshot_check"
  CHECK (
    "evidenceCategory" != 'PRACTICAL' OR (
      "artifactIdSnapshot" IS NOT NULL AND
      "artifactCanonicalKeySnapshot" IS NOT NULL AND
      trim("artifactCanonicalKeySnapshot") <> ''
    )
  );

-- 6. ScoringConfig recencyMultiplier range: 0.5 - 1.0.
ALTER TABLE "scoring_configs" ADD CONSTRAINT "scoring_configs_recency_range_check"
  CHECK ("recencyMin" >= 0.5 AND "recencyMax" <= 1.0 AND "recencyMin" <= "recencyMax");

ALTER TABLE "scoring_configs" ADD CONSTRAINT "scoring_configs_formula_weights_check"
  CHECK ("practicalDepthWeight" >= 0 AND "qualityWeight" >= 0 AND "practicalDepthWeight" <= 1 AND "qualityWeight" <= 1);

-- 7. ArtifactKey.normalizedValue must not be empty.
ALTER TABLE "artifact_keys" ADD CONSTRAINT "artifact_keys_normalized_value_non_empty_check"
  CHECK (length(trim("normalizedValue")) > 0);

-- 8. RoleSkill importance/weight canonical mapping:
--    CORE = 4, IMPORTANT = 3, USEFUL = 2, OPTIONAL = 1
ALTER TABLE "role_skills" ADD CONSTRAINT "role_skills_importance_weight_check"
  CHECK (
    (importance = 'CORE' AND weight = 4) OR
    (importance = 'IMPORTANT' AND weight = 3) OR
    (importance = 'USEFUL' AND weight = 2) OR
    (importance = 'OPTIONAL' AND weight = 1)
  );

ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_importance_weight_check"
  CHECK (
    (importance = 'CORE' AND weight = 4) OR
    (importance = 'IMPORTANT' AND weight = 3) OR
    (importance = 'USEFUL' AND weight = 2) OR
    (importance = 'OPTIONAL' AND weight = 1)
  );

-- =============================================================================
-- IMMUTABILITY ENFORCEMENT (UPDATE AND DELETE PROHIBITION)
-- Prohibits both UPDATE and DELETE on historical assessments and versioned scoring configs
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_immutable_table_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Table % is immutable: % operation is strictly prohibited.', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_readiness_assessments_immutable
BEFORE UPDATE OR DELETE ON "readiness_assessments"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();

CREATE TRIGGER trg_skill_assessments_immutable
BEFORE UPDATE OR DELETE ON "skill_assessments"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();

CREATE TRIGGER trg_skill_assessment_evidence_immutable
BEFORE UPDATE OR DELETE ON "skill_assessment_evidence"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();

CREATE TRIGGER trg_scoring_configs_immutable
BEFORE UPDATE OR DELETE ON "scoring_configs"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();
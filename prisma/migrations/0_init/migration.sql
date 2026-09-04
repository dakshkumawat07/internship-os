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
    "evidenceId" TEXT,
    "artifactId" TEXT,
    "evidenceScore" DOUBLE PRECISION NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "questionSetVersion" TEXT NOT NULL,
    "isPrimaryPractical" BOOLEAN NOT NULL DEFAULT false,
    "evidenceCategory" "EvidenceCategory" NOT NULL,
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
    "skillId" TEXT,
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
CREATE INDEX "artifact_keys_artifactId_idx" ON "artifact_keys"("artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "artifact_keys_studentProfileId_keyType_normalizedValue_key" ON "artifact_keys"("studentProfileId", "keyType", "normalizedValue");

-- CreateIndex
CREATE INDEX "evidence_studentProfileId_idx" ON "evidence"("studentProfileId");

-- CreateIndex
CREATE INDEX "evidence_studentProfileId_deletedAt_idx" ON "evidence"("studentProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "evidence_artifactId_idx" ON "evidence"("artifactId");

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
CREATE INDEX "skill_assessments_skillId_idx" ON "skill_assessments"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_assessments_readinessAssessmentId_skillId_key" ON "skill_assessments"("readinessAssessmentId", "skillId");

-- CreateIndex
CREATE INDEX "skill_assessment_evidence_skillAssessmentId_idx" ON "skill_assessment_evidence"("skillAssessmentId");

-- CreateIndex
CREATE INDEX "skill_assessment_evidence_evidenceId_idx" ON "skill_assessment_evidence"("evidenceId");

-- CreateIndex
CREATE INDEX "action_plans_studentProfileId_idx" ON "action_plans"("studentProfileId");

-- CreateIndex
CREATE INDEX "action_items_actionPlanId_idx" ON "action_items"("actionPlanId");

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
ALTER TABLE "artifact_keys" ADD CONSTRAINT "artifact_keys_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_corroboratesArtifactId_fkey" FOREIGN KEY ("corroboratesArtifactId") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_assessment_evidence" ADD CONSTRAINT "skill_assessment_evidence_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "action_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "action_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;


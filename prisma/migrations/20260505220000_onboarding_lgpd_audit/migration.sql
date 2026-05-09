ALTER TABLE "UserProfile"
ADD COLUMN "crn" TEXT,
ADD COLUMN "clinicName" TEXT,
ADD COLUMN "professionalPhone" TEXT,
ADD COLUMN "clinicLogoUrl" TEXT,
ADD COLUMN "specialty" TEXT,
ADD COLUMN "reportSignature" TEXT,
ADD COLUMN "defaultReturnInterval" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "defaultConsultationTime" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN "defaultPdfFooter" TEXT NOT NULL DEFAULT '',
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'pt-BR',
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acceptedTermsAt" TIMESTAMP(3);

ALTER TABLE "Patient"
ADD COLUMN "consentToStoreHealthData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "consentDate" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Patient_userId_deletedAt_idx" ON "Patient"("userId", "deletedAt");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);
CREATE INDEX "AuditLog_userId_entityType_entityId_idx" ON "AuditLog"("userId", "entityType", "entityId");

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

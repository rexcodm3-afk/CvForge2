-- AlterTable
ALTER TABLE "Usage" ADD COLUMN     "atsAnalysisCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AtsAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cvId" TEXT,
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "jobDescription" TEXT NOT NULL DEFAULT '',
    "score" INTEGER NOT NULL DEFAULT 0,
    "analysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtsAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtsAnalysis_userId_idx" ON "AtsAnalysis"("userId");

-- CreateIndex
CREATE INDEX "AtsAnalysis_cvId_idx" ON "AtsAnalysis"("cvId");

-- CreateIndex
CREATE INDEX "AtsAnalysis_createdAt_idx" ON "AtsAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "AtsAnalysis" ADD CONSTRAINT "AtsAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

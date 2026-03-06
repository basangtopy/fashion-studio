-- CreateTable
CREATE TABLE "measurement_history" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "changedFields" JSONB NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedByRole" TEXT NOT NULL,
    "updatedByName" TEXT NOT NULL,
    "disclaimerSignedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "measurement_history" ADD CONSTRAINT "measurement_history_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TrackRecommendation" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "trackArtist" TEXT NOT NULL,
    "trackImage" TEXT,
    "trackUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackRecommendation_memberId_idx" ON "TrackRecommendation"("memberId");

-- AddForeignKey
ALTER TABLE "TrackRecommendation" ADD CONSTRAINT "TrackRecommendation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "GroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TrackPlay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackPlay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackPlay_userId_playedAt_idx" ON "TrackPlay"("userId", "playedAt");

-- AddForeignKey
ALTER TABLE "TrackPlay" ADD CONSTRAINT "TrackPlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

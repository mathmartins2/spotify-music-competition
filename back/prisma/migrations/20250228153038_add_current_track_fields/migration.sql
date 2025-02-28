-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "currentTrackArtist" TEXT,
ADD COLUMN     "currentTrackId" TEXT,
ADD COLUMN     "currentTrackImage" TEXT,
ADD COLUMN     "currentTrackName" TEXT,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

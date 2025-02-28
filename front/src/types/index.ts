export interface Member {
  id: string;
  rank: number;
  score: number;
  topTrackId?: string;
  topTrackName?: string;
  topTrackArtist?: string;
  topTrackImage?: string;
  currentTrackId?: string;
  currentTrackName?: string;
  currentTrackArtist?: string;
  currentTrackImage?: string;
  lastUpdated?: Date;
  user: {
    id: string;
    displayName?: string;
    email: string;
    photoUrl?: string;
  };
} 
export interface Member {
  id: string;
  rank: number;
  score: number;
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
  recommendations: {
    id: string;
    trackId: string;
    trackName: string;
    trackArtist: string;
    trackImage?: string;
    trackUrl: string;
    createdAt: Date;
  }[];
} 
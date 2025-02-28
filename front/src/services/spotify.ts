import api from './api';

export const SpotifyService = {
  getTrackGenre: async (trackId: string): Promise<string[]> => {
    try {
      const response = await api.get(`/spotify/track-genre/${trackId}`);
      return response.data.genres || [];
    } catch (error) {
      console.error('Erro ao obter gênero da música:', error);
      return [];
    }
  }
}; 
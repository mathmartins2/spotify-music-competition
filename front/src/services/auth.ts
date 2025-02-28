import api from './api';

export const AuthService = {
  loginWithSpotify: () => {
    window.location.href = 'http://localhost:3000/auth/spotify';
  },

  handleCallback: async (code: string) => {
    try {
      localStorage.setItem('access_token', code);
      return code;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
}; 
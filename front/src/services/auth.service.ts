import api from './api';

export class AuthService {
  static async refreshToken() {
    return api.post('/auth/refresh');
  }
} 
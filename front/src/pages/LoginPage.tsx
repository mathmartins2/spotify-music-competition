import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth';

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      navigate('/groups');
    }
  }, [navigate]);

  const handleLogin = () => {
    AuthService.loginWithSpotify();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-spotify-black p-4">
      <h1 className="text-4xl font-bold text-spotify-green mb-8">
        Spotify Competition
      </h1>
      <button
        onClick={handleLogin}
        className="bg-spotify-green hover:bg-opacity-80 text-spotify-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105"
      >
        Login with Spotify
      </button>
    </div>
  );
} 
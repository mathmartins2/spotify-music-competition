import { Outlet } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-spotify-black text-spotify-white">
      <header className="bg-spotify-gray px-6 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-spotify-green">Spotify Competition</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-spotify-lightgray hover:text-spotify-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
} 
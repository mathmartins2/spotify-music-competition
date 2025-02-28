import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      localStorage.setItem('access_token', code);
      navigate('/groups');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div>Authenticating...</div>;
} 
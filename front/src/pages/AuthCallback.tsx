import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('code');
    if (token) {
      // Decodifica o token para pegar o userId
      const decoded = jwtDecode(token);
      console.log(decoded);

      // Salva o token e o userId
      localStorage.setItem('access_token', token);
      localStorage.setItem('userId', decoded.sub);

      navigate('/groups');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div>Authenticating...</div>;
} 
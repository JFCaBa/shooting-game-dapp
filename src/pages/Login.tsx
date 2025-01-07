import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/players/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404 ? 'Player not found' : 'Invalid credentials'
        );
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/game');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-game-dark text-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          className="text-blue-500 text-lg flex items-center space-x-1"
          onClick={() => navigate('/create-user')}
        >
          <ChevronLeft className="text-blue-500" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-center flex-1">Login</h1>
      </div>

      {/* Logo */}
      <div className="text-center my-12">
        <h1 className="text-5xl font-bold">
          Shooting<span className="text-red-500">D</span>app
        </h1>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-800 rounded-lg p-4 text-white placeholder-gray-400"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-800 rounded-lg p-4 text-white placeholder-gray-400"
          required
        />

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 
                   disabled:cursor-not-allowed rounded-lg p-4 mt-8 font-semibold"
        >
          {isLoading ? 'Loading...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/create-user')}
          className="w-full text-blue-500 p-2 text-center"
        >
          Create account instead
        </button>
      </form>
    </div>
  );
};

export default Login;

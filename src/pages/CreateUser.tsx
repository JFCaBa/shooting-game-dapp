import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const CreateUser = () => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const playerId = localStorage.getItem('playerId');

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/players/addPlayerDetails`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId,
            nickname,
            email,
            password,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          const useExisting = window.confirm(
            'User already exists. Would you like to login instead?'
          );
          if (useExisting) {
            navigate('/login');
          }
          return;
        }
        throw new Error(data.message || 'Failed to create user');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/game');
    } catch (error) {
      alert(error.message);
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
          onClick={() => navigate('/settings')}
        >
          <ChevronLeft className="text-blue-500" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-center flex-1">
          Create User
        </h1>
      </div>

      {/* Player ID Display */}
      <div className="mb-6">
        <p className="text-gray-400">Player ID: {playerId}</p>
      </div>

      {/* Create User Form */}
      <form onSubmit={handleCreateUser} className="space-y-4">
        <input
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full bg-gray-800 rounded-lg p-4 text-white placeholder-gray-400"
          required
        />

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

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-gray-800 rounded-lg p-4 text-white placeholder-gray-400"
          required
        />

        <button
          type="submit"
          disabled={
            isLoading || !nickname || !email || !password || !confirmPassword
          }
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 
                   disabled:cursor-not-allowed rounded-lg p-4 mt-8 font-semibold"
        >
          {isLoading ? 'Creating...' : 'Save'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full text-blue-500 p-2 text-center"
        >
          Login instead
        </button>
      </form>
    </div>
  );
};

export default CreateUser;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ProfileService } from '../services/ProfileService';

interface UserProfile {
  nickname: string;
  email: string;
  playerId: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const profileService = ProfileService.getInstance();

  useEffect(() => {
    fetchProfile();
  });

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
    }
  }, [profile]);

  const fetchProfile = async () => {
    const playerId = localStorage.getItem('playerId');

    if (!playerId) {
      navigate('/settings');
      return;
    }

    try {
      const data = await profileService.getProfile(playerId);

      if (data.details) {
        setProfile({
          playerId: playerId,
          nickname: data.details.nickname || '',
          email: data.details.email || '',
        });
        setNickname(data.details.nickname || '');
      } else {
        throw new Error('Invalid profile data structure');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
      setProfile({
        playerId: playerId,
        nickname: '',
        email: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const playerId = localStorage.getItem('playerId');
    if (!playerId) return;

    try {
      await profileService.updateDetails(playerId, nickname);
      setProfile((prev) => (prev ? { ...prev, nickname } : null));
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    const playerId = localStorage.getItem('playerId');
    if (!playerId) return;

    try {
      await profileService.updatePassword(
        playerId,
        currentPassword,
        newPassword
      );
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-game-dark text-white p-4 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

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
          User Profile
        </h1>
      </div>

      {/* Profile Content */}
      {profile && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-sm text-gray-400">Player ID</h2>
            <p className="text-lg break-all">{profile.playerId}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-sm text-gray-400">Nickname</h2>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 bg-gray-700 rounded p-2 text-white"
                />
                <button
                  onClick={handleUpdateProfile}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNickname(profile.nickname);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-lg">{profile.nickname}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-sm text-gray-400">Email</h2>
            <p className="text-lg">{profile.email}</p>
          </div>

          {showPasswordForm ? (
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-800 rounded-lg p-4 text-white"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-800 rounded-lg p-4 text-white"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 rounded-lg p-4 text-white"
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-blue-500 text-white p-4 rounded-lg"
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 bg-gray-600 text-white p-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full bg-blue-500 text-white p-4 rounded-lg"
            >
              Change Password
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;

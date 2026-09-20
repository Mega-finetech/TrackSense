import React, { useEffect, useRef, useState } from 'react';
import { User, Bell, Eye, LogOut, Download, Smartphone, CheckCircle } from 'lucide-react';
import apiClient from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { canInstall, isInstalled, isStandalone, promptInstall } = usePWAInstall();
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', avatar_url: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });

  // Settings state
  const [displayPrefs, setDisplayPrefs] = useState({
    dark_mode: isDarkMode,
    compact_view: false,
    default_landing_page: 'dashboard',
  });

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    task_due: true,
    exam_soon: true,
    streak_risk: true,
    goal_deadline: true,
    assignment_overdue: true,
  });

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSettings();
    fetchNotificationPrefs();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiClient.get('/settings/profile');
      setProfile(data);
      setProfileForm({ name: data.name, email: data.email });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await apiClient.get('/settings/display');
      setDisplayPrefs(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const data = await apiClient.get('/settings/notifications');
      setNotifPrefs(data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updated = await apiClient.put('/settings/profile', profileForm);
      setProfile(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisplayPrefsUpdate = async (updates) => {
    try {
      const newPrefs = { ...displayPrefs, ...updates };
      const updated = await apiClient.put('/settings/display', updates);
      setDisplayPrefs(updated);

      if (updates.dark_mode !== undefined) {
        await toggleDarkMode(updates.dark_mode);
      }

      setMessage({ type: 'success', text: 'Display preferences updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    }
  };

  const handleNotifPrefUpdate = async (key) => {
    try {
      const updates = { [key]: !notifPrefs[key] };
      const updated = await apiClient.put('/settings/notifications', updates);
      setNotifPrefs(updated);
      setMessage({ type: 'success', text: 'Notification preferences updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/export');
      const dataStr = JSON.stringify(response, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `tracksense-export-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setMessage({ type: 'success', text: 'Data exported successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await apiClient.delete('/settings/account');
      // Redirect to login after deletion
      window.location.href = '/login';
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account' });
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        updateAvatar(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAvatar = async (dataUrl) => {
    try {
      setLoading(true);
      const updated = await apiClient.put('/settings/profile', { avatar_url: dataUrl });
      setProfile(updated);
      setMessage({ type: 'success', text: 'Avatar updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update avatar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#0A1628]">Settings</h1>
          <p className="text-sm text-[#4A6080] mt-0.5">Manage your profile, preferences, and account.</p>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-[#E0F7FC] border-[#00B4D8]'
            : 'bg-[#FEE2E2] border-[#FCA5A5]'
        }`}>
          <p className={message.type === 'success' ? 'text-[#0A1628]' : 'text-[#DC2626]'}>
            {message.text}
          </p>
        </div>
      )}

      {/* FILTER/TAB BAR */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#E8F4F8] pb-0">
        {['profile', 'display', 'notifications', 'data'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t
                ? 'text-[#0A1628] font-medium border-b-2 border-[#00B4D8]'
                : 'text-[#4A6080] border-b-2 border-transparent hover:text-[#0A1628]'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">👤</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 text-sm font-medium transition-colors"
                  >
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                {/* Form */}
                <form onSubmit={handleProfileUpdate} className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 font-medium transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {tab === 'display' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Display Preferences</h2>

              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enable dark mode for easier viewing</p>
                  </div>
                  <button
                    onClick={() => handleDisplayPrefsUpdate({ dark_mode: !displayPrefs.dark_mode })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      displayPrefs.dark_mode ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        displayPrefs.dark_mode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Compact View */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Compact View</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Use condensed spacing and smaller fonts</p>
                  </div>
                  <button
                    onClick={() => handleDisplayPrefsUpdate({ compact_view: !displayPrefs.compact_view })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      displayPrefs.compact_view ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        displayPrefs.compact_view ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Default Landing Page */}
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Default Landing Page
                  </label>
                  <select
                    value={displayPrefs.default_landing_page}
                    onChange={(e) => handleDisplayPrefsUpdate({ default_landing_page: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="goals">Goals</option>
                    <option value="tasks">Tasks</option>
                    <option value="timer">Timer & Focus</option>
                    <option value="analytics">Analytics</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h2>

              <div className="space-y-3">
                {[
                  { key: 'task_due', label: 'Task Due Today', icon: '✓' },
                  { key: 'exam_soon', label: 'Exam in 3 Days', icon: '📝' },
                  { key: 'streak_risk', label: 'Streak at Risk', icon: '🔥' },
                  { key: 'goal_deadline', label: 'Goal Deadline Approaching', icon: '🎯' },
                  { key: 'assignment_overdue', label: 'Assignment Overdue', icon: '⚠️' },
                ].map(({ key, label, icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                    </div>
                    <button
                      onClick={() => handleNotifPrefUpdate(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifPrefs[key] ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {tab === 'data' && (
          <div className="space-y-6">

            {/* Install App Banner */}
            {!isStandalone && (
              <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #064E6B 100%)', borderColor: '#1B3A5C' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00B4D8]/20 flex items-center justify-center flex-shrink-0">
                    <Smartphone size={22} className="text-[#00B4D8]" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white mb-0.5">Install TrackSense</p>
                    <p className="text-xs text-[#90E0EF] mb-3 leading-relaxed">
                      Add to your home screen for a full app experience — works offline too!
                    </p>
                    {canInstall ? (
                      <button
                        onClick={promptInstall}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0A1628] transition-all active:scale-95"
                        style={{ background: '#00B4D8' }}
                      >
                        <Download size={15} /> Install App
                      </button>
                    ) : isInstalled ? (
                      <div className="flex items-center gap-2 text-xs text-[#00B4D8] font-semibold">
                        <CheckCircle size={14} /> Already installed!
                      </div>
                    ) : (
                      <p className="text-xs text-[#90E0EF]">
                        Open in Chrome/Safari and tap "Add to Home Screen" to install.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Export Data */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Export Your Data</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Download all your data (goals, tasks, projects, sessions, etc.) as a JSON file.
              </p>
              <button
                onClick={handleExportData}
                disabled={loading}
                className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? 'Exporting...' : '📥 Download All Data'}
              </button>
            </div>

            {/* Delete Account */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl shadow p-6 border border-red-200 dark:border-red-700">
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">Danger Zone</h2>
              <p className="text-red-600 dark:text-red-400 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-medium transition-colors"
                >
                  🗑️ Delete Account
                </button>
              ) : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-300 dark:border-red-600">
                  <p className="text-gray-900 dark:text-white font-medium mb-3">
                    Are you sure? This will delete your account and all associated data.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 font-medium transition-colors"
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
  );
}

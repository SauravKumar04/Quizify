import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, contestAPI } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiUser, FiMail, FiBook, FiEdit2, FiAward, FiTrendingUp, FiTarget, FiSave, FiX, FiCamera, FiClock } from 'react-icons/fi';

const UserProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [stats, setStats] = useState(null);
  const [contestHistory, setContestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    bio: '',
    profilePicture: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        college: user.college || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
      });
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, contestHistoryRes] = await Promise.all([
        authAPI.getUserStats(),
        contestAPI.getMyHistory(),
      ]);
      setStats(statsRes.data.stats);
      setContestHistory(contestHistoryRes.data.history);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authAPI.updateProfile(formData);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await authAPI.uploadProfilePicture(uploadData);
      
      const updatedUser = { ...user, profilePicture: response.data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setFormData(prev => ({ ...prev, profilePicture: response.data.profilePicture }));
      
      toast.success('Profile picture uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 flex items-center justify-center">
            <LoadingAnimation message="Loading profile" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
          <div className="max-w-3xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Profile Picture */}
                <div className="relative shrink-0">
                  {formData.profilePicture || user?.profilePicture ? (
                    <img
                      src={formData.profilePicture || user?.profilePicture}
                      alt={user?.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-slate-100"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-500">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handlePictureUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPicture}
                    className="absolute bottom-0 right-0 bg-slate-900 text-white p-1.5 rounded-full hover:bg-slate-800 disabled:opacity-50"
                  >
                    {uploadingPicture ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiCamera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Profile Info */}
                <div className="flex-1 w-full text-center sm:text-left min-w-0">
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">College/Organization</label>
                        <input
                          type="text"
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                          placeholder="Enter your college"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm resize-none"
                          placeholder="Tell us about yourself"
                          rows={2}
                          maxLength={200}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm font-medium"
                        >
                          <FiSave className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setFormData({
                              name: user.name || '',
                              college: user.college || '',
                              bio: user.bio || '',
                              profilePicture: user.profilePicture || '',
                            });
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm"
                        >
                          <FiX className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <h1 className="text-lg sm:text-xl font-bold text-slate-900">{user?.name}</h1>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                            user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user?.role === 'admin' ? 'Admin' : 'Student'}
                          </span>
                        </div>
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-slate-500 text-sm">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <FiMail className="w-3.5 h-3.5" />
                          <span className="truncate text-xs sm:text-sm">{user?.email}</span>
                        </div>
                        {user?.college && (
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <FiBook className="w-3.5 h-3.5" />
                            <span className="text-xs sm:text-sm">{user.college}</span>
                          </div>
                        )}
                        {user?.bio && (
                          <p className="text-xs text-slate-400 mt-2 italic">"{user.bio}"</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats?.totalQuizzes || 0}</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Quizzes</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">{stats?.avgQuizScore || 0}%</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Avg Score</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats?.totalContests || 0}</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Contests</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-lg sm:text-2xl font-bold text-amber-600">
                  {stats?.bestContestRank ? `#${stats.bestContestRank}` : '-'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">Best Rank</p>
              </div>
            </div>

            {/* Contest History */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <FiAward className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900">Contest History</h2>
              </div>
              
              {contestHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <FiAward className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No contests attempted yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {contestHistory.slice(0, 5).map((result) => (
                    <div 
                      key={result._id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      {/* Rank */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        result.rank === 1 ? 'bg-amber-100 text-amber-700' :
                        result.rank === 2 ? 'bg-slate-100 text-slate-600' :
                        result.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        #{result.rank}
                      </div>
                      
                      {/* Contest Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{result.contest?.title}</p>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400">
                          <span>{result.score}/{result.totalQuestions}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <FiClock className="w-3 h-3" />
                            {formatTime(result.timeTaken)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className={`px-2 py-1 rounded text-xs font-semibold shrink-0 ${
                        result.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        result.percentage >= 60 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {result.percentage}%
                      </div>
                      
                      {/* View Button */}
                      <button
                        onClick={() => navigate(`/contest/${result.contest?._id}/leaderboard`)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0"
                      >
                        <FiTrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;

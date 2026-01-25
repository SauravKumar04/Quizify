import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminContestAPI } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiClock, FiAward } from 'react-icons/fi';

const AdminContestDashboard = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const response = await adminContestAPI.getMyContests();
      setContests(response.data.contests);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
      toast.error('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContest = async (contestId) => {
    if (confirm('Are you sure you want to delete this contest? All results will be deleted.')) {
      try {
        await adminContestAPI.deleteContest(contestId);
        toast.success('Contest deleted successfully');
        fetchContests();
      } catch (error) {
        toast.error('Failed to delete contest');
      }
    }
  };

  const getContestStatus = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    } else if (now >= start && now <= end) {
      return { label: 'Live', color: 'bg-green-100 text-green-700' };
    } else {
      return { label: 'Ended', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Contest Management</h1>
                <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">Create and manage quiz contests</p>
              </div>
              <button
                onClick={() => navigate('/admin/contest/create')}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-slate-800 transition text-sm sm:text-base font-semibold whitespace-nowrap"
              >
                <FiPlus className="w-5 h-5" />
                <span>Create Contest</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
              </div>
            ) : contests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiAward className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium text-lg">No contests yet</p>
                <p className="text-slate-400 text-sm mt-1">Create your first contest to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {contests.map((contest) => {
                  const status = getContestStatus(contest);
                  const isUpcoming = status.label === 'Upcoming';
                  const isLive = status.label === 'Live';
                  
                  return (
                    <div
                      key={contest._id}
                      className={`bg-white rounded-xl sm:rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                        isLive ? 'border-slate-900' : 'border-gray-100 hover:border-slate-300'
                      }`}
                    >
                      {/* Header with Status */}
                      <div className={`px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between ${
                        isLive ? 'bg-slate-900' : 'bg-slate-50'
                      }`}>
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${
                          isLive ? 'text-white' : 'text-slate-500'
                        }`}>
                          {status.label}
                        </span>
                        {isLive && (
                          <span className="flex items-center gap-1 sm:gap-1.5">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] sm:text-xs text-green-400 font-medium">LIVE NOW</span>
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="text-[10px] sm:text-xs text-slate-400">{contest.questionCount} questions</span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-3 sm:p-5">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2 line-clamp-1">{contest.title}</h3>
                        
                        {contest.description && (
                          <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{contest.description}</p>
                        )}
                        
                        {/* Stats Row */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <FiUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-base sm:text-lg font-bold text-slate-900">{contest.participantCount}</p>
                              <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase">Participants</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <FiClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-base sm:text-lg font-bold text-slate-900">{contest.duration || 30}</p>
                              <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase">Minutes</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Time Info */}
                        <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                          <div className="flex justify-between text-slate-500">
                            <span>Starts</span>
                            <span className="font-medium text-slate-700 text-right">{formatDateTime(contest.startTime)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Ends</span>
                            <span className="font-medium text-slate-700 text-right">{formatDateTime(contest.endTime)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="px-3 sm:px-5 py-3 sm:py-4 border-t border-gray-100 flex items-center gap-1.5 sm:gap-2">
                        <Link
                          to={`/admin/contest/${contest._id}/leaderboard`}
                          className="flex-1 text-center py-2 sm:py-2.5 bg-slate-900 text-white rounded-lg sm:rounded-xl hover:bg-slate-800 transition text-xs sm:text-sm font-semibold"
                        >
                          Leaderboard
                        </Link>
                        {isUpcoming && (
                          <button
                            onClick={() => navigate(`/admin/contest/edit/${contest._id}`)}
                            className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg sm:rounded-xl transition border border-gray-200"
                            title="Edit Contest"
                          >
                            <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContest(contest._id)}
                          className="p-2 sm:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition border border-gray-200"
                          title="Delete Contest"
                        >
                          <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminContestDashboard;

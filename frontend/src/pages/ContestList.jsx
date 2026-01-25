import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contestAPI } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiClock, FiUsers, FiAward, FiPlay, FiTrendingUp, FiCalendar, FiZap } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const ContestList = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const response = await contestAPI.getAllContests();
      setContests(response.data.contests);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
      toast.error('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  const getContestStatus = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) {
      return { label: 'Upcoming', type: 'upcoming' };
    } else if (now >= start && now <= end) {
      return { label: 'Live Now', type: 'live' };
    } else {
      return { label: 'Ended', type: 'ended' };
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (dateString) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredContests = contests.filter((contest) => {
    if (filter === 'all') return true;
    return getContestStatus(contest).type === filter;
  });

  const handleContestAction = (contest) => {
    const status = getContestStatus(contest);
    if (status.type === 'live' && !contest.hasAttempted) {
      navigate(`/contest/${contest._id}`);
    } else {
      navigate(`/contest/${contest._id}/leaderboard`);
    }
  };

  // Count contests by type
  const liveCount = contests.filter(c => getContestStatus(c).type === 'live').length;
  const upcomingCount = contests.filter(c => getContestStatus(c).type === 'upcoming').length;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <BsLightningFill className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Quiz Contests</h1>
                    <p className="text-slate-400 text-sm sm:text-base">Compete with others in timed challenges</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 mt-6">
                  {liveCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="text-white text-sm font-medium">{liveCount} Live Now</span>
                    </div>
                  )}
                  {upcomingCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <FiCalendar className="w-4 h-4 text-slate-300" />
                      <span className="text-white text-sm font-medium">{upcomingCount} Upcoming</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { key: 'all', label: 'All Contests' },
                { key: 'live', label: 'Live', dot: true },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'ended', label: 'Ended' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    filter === tab.key
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {tab.dot && filter !== tab.key && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingAnimation message="Loading contests" />
              </div>
            ) : filteredContests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiAward className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-lg">No contests found</p>
                <p className="text-slate-500 text-sm mt-1">Check back later for new challenges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {filteredContests.map((contest) => {
                  const status = getContestStatus(contest);
                  const timeRemaining = status.type === 'upcoming' ? getTimeRemaining(contest.startTime) : null;
                  const timeLeft = status.type === 'live' ? getTimeRemaining(contest.endTime) : null;
                  const isLive = status.type === 'live';
                  const isUpcoming = status.type === 'upcoming';
                  const isEnded = status.type === 'ended';

                  return (
                    <div
                      key={contest._id}
                      className={`group bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl ${
                        isLive 
                          ? 'border-slate-900 shadow-lg shadow-slate-900/10' 
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {/* Status Header */}
                      <div className={`px-5 py-3 flex items-center justify-between ${
                        isLive ? 'bg-slate-900' : 'bg-slate-50 border-b border-slate-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          {isLive && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
                          <span className={`text-xs font-bold uppercase tracking-wider ${
                            isLive ? 'text-white' : 'text-slate-500'
                          }`}>
                            {status.label}
                          </span>
                        </div>
                        {contest.hasAttempted && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isLive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-slate-700 transition-colors">
                          {contest.title}
                        </h3>
                        
                        {contest.description && (
                          <p className="text-slate-500 text-sm mb-4 line-clamp-2">{contest.description}</p>
                        )}
                        
                        {/* Stats Row */}
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <FiClock className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-slate-900">{contest.duration}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Minutes</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <FiZap className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-slate-900">{contest.questionCount || 0}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Questions</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timer Card */}
                        {isUpcoming && timeRemaining && (
                          <div className="p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Starts In</p>
                                <p className="text-xl font-bold text-slate-900 tabular-nums">{timeRemaining}</p>
                              </div>
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <FiCalendar className="w-5 h-5 text-slate-600" />
                              </div>
                            </div>
                          </div>
                        )}
                        {isLive && timeLeft && (
                          <div className="p-4 bg-slate-900 rounded-xl mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Time Left</p>
                                <p className="text-xl font-bold text-white tabular-nums">{timeLeft}</p>
                              </div>
                              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <FiClock className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Button */}
                        <button
                          onClick={() => handleContestAction(contest)}
                          disabled={isUpcoming}
                          className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                            isLive && !contest.hasAttempted
                              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
                              : isEnded || contest.hasAttempted
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isLive && !contest.hasAttempted ? (
                            <>
                              <FiPlay className="w-4 h-4" />
                              Start Contest
                            </>
                          ) : isEnded || contest.hasAttempted ? (
                            <>
                              <FiTrendingUp className="w-4 h-4" />
                              View Leaderboard
                            </>
                          ) : (
                            'Coming Soon'
                          )}
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

export default ContestList;

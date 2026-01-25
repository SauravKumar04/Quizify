import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminContestAPI } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiArrowLeft, FiAward, FiClock, FiUsers } from 'react-icons/fi';

const ContestLeaderboard = () => {
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const { contestId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [contestId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await adminContestAPI.getLeaderboard(contestId);
      setContest(response.data.contest);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { badge: '🥇', bg: 'bg-amber-100 text-amber-700' };
    if (rank === 2) return { badge: '🥈', bg: 'bg-slate-100 text-slate-600' };
    if (rank === 3) return { badge: '🥉', bg: 'bg-orange-100 text-orange-700' };
    return { badge: rank, bg: 'bg-slate-50 text-slate-600' };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
          <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 mb-4 text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>

            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingAnimation message="Loading leaderboard" />
              </div>
            ) : (
              <>
                {/* Contest Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <FiAward className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{contest?.title}</h1>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          contest?.hasEnded ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {contest?.hasEnded ? 'Ended' : 'Live'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <FiUsers className="w-3.5 h-3.5" />
                          {leaderboard.length} participants
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                {leaderboard.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <FiUsers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No participants yet</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {/* Top 3 Podium - Only show if 3+ participants */}
                    {leaderboard.length >= 3 && (
                      <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                        <div className="flex items-end justify-center gap-3 sm:gap-6">
                          {/* 2nd Place */}
                          <div className="text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-1.5 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                              {leaderboard[1].user?.profilePicture ? (
                                <img src={leaderboard[1].user.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm sm:text-base font-bold text-slate-500">
                                  {leaderboard[1].user?.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <p className="text-lg sm:text-xl mb-0.5">🥈</p>
                            <p className="font-medium text-slate-900 text-xs truncate max-w-[60px] sm:max-w-[80px]">
                              {leaderboard[1].user?.name}
                            </p>
                            <p className="text-[10px] text-slate-500">{leaderboard[1].percentage}%</p>
                          </div>
                          
                          {/* 1st Place */}
                          <div className="text-center -mt-3">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-1.5 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden border-2 border-amber-300">
                              {leaderboard[0].user?.profilePicture ? (
                                <img src={leaderboard[0].user.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-base sm:text-lg font-bold text-amber-600">
                                  {leaderboard[0].user?.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <p className="text-xl sm:text-2xl mb-0.5">🥇</p>
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate max-w-[70px] sm:max-w-[90px]">
                              {leaderboard[0].user?.name}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-500">{leaderboard[0].percentage}%</p>
                          </div>
                          
                          {/* 3rd Place */}
                          <div className="text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-1.5 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-orange-200">
                              {leaderboard[2].user?.profilePicture ? (
                                <img src={leaderboard[2].user.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm sm:text-base font-bold text-orange-600">
                                  {leaderboard[2].user?.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <p className="text-lg sm:text-xl mb-0.5">🥉</p>
                            <p className="font-medium text-slate-900 text-xs truncate max-w-[60px] sm:max-w-[80px]">
                              {leaderboard[2].user?.name}
                            </p>
                            <p className="text-[10px] text-slate-500">{leaderboard[2].percentage}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Leaderboard List */}
                    <div className="divide-y divide-slate-100">
                      {leaderboard.map((entry, index) => {
                        const rankInfo = getRankDisplay(entry.rank);
                        return (
                          <div key={index} className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50">
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 ${rankInfo.bg}`}>
                              {rankInfo.badge}
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              {entry.user?.profilePicture ? (
                                <img 
                                  src={entry.user.profilePicture} 
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <span className="text-slate-500 font-medium text-sm">
                                    {entry.user?.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 text-sm truncate">{entry.user?.name}</p>
                                {entry.user?.college && (
                                  <p className="text-xs text-slate-400 truncate hidden sm:block">{entry.user.college}</p>
                                )}
                              </div>
                            </div>

                            {/* Score */}
                            <div className="text-right shrink-0">
                              <p className={`text-xs sm:text-sm font-semibold ${
                                entry.percentage >= 80 ? 'text-emerald-600' :
                                entry.percentage >= 60 ? 'text-amber-600' :
                                'text-rose-600'
                              }`}>
                                {entry.percentage}%
                              </p>
                              <p className="text-[10px] text-slate-400">{entry.score}/{entry.totalQuestions}</p>
                            </div>

                            {/* Time - Hidden on mobile */}
                            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 shrink-0 w-16 justify-end">
                              <FiClock className="w-3 h-3" />
                              {formatTime(entry.timeTaken)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContestLeaderboard;

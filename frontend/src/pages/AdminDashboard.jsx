import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminQuizAPI, adminContestAPI } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import QuizCard from '../components/QuizCard';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiPlus, FiAward, FiUsers, FiBarChart2, FiTrendingUp, FiFileText } from 'react-icons/fi';

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalContests: 0,
    totalQuizAttempts: 0,
    totalContestParticipants: 0,
    avgQuizScore: 0,
    avgContestScore: 0,
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesRes, contestsRes] = await Promise.all([
        adminQuizAPI.getMyQuizzes(),
        adminContestAPI.getMyContests(),
      ]);
      
      const quizzesData = quizzesRes.data.quizzes;
      const contestsData = contestsRes.data.contests;
      
      setQuizzes(quizzesData);
      setContests(contestsData);
      
      // Calculate stats
      const totalQuizAttempts = quizzesData.reduce((acc, q) => acc + (q.attemptCount || 0), 0);
      const totalContestParticipants = contestsData.reduce((acc, c) => acc + (c.participantCount || 0), 0);
      
      setStats({
        totalQuizzes: quizzesData.length,
        totalContests: contestsData.length,
        totalQuizAttempts,
        totalContestParticipants,
        liveContests: contestsData.filter(c => {
          const now = new Date();
          return now >= new Date(c.startTime) && now <= new Date(c.endTime);
        }).length,
        upcomingContests: contestsData.filter(c => new Date() < new Date(c.startTime)).length,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      try {
        await adminQuizAPI.deleteQuiz(quizId);
        toast.success('Quiz deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete quiz');
      }
    }
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
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">Overview & Analytics</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/admin/contests"
                  className="flex items-center gap-2 bg-white border border-slate-900 text-slate-900 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-slate-50 transition text-sm sm:text-base font-semibold whitespace-nowrap"
                >
                  <FiAward className="w-5 h-5" />
                  <span>Contests</span>
                </Link>
                <button
                  onClick={() => navigate('/admin/create-quiz')}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-slate-800 transition text-sm sm:text-base font-semibold whitespace-nowrap"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Create Quiz</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingAnimation message="Loading dashboard" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.totalQuizzes}</p>
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">Quizzes</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <FiAward className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.totalContests}</p>
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">Contests</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.totalQuizAttempts}</p>
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">Quiz Attempts</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                        <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.totalContestParticipants}</p>
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">Participants</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                        <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.liveContests}</p>
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">Live</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                        <FiAward className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.upcomingContests}</p>
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">Upcoming</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Contests Section */}
                {contests.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Contests</h2>
                      <Link to="/admin/contests" className="text-sm text-slate-600 hover:text-slate-900">
                        View All →
                      </Link>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Contest</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Participants</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Questions</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-gray-100">
                          {contests.slice(0, 5).map((contest) => {
                            const now = new Date();
                            const start = new Date(contest.startTime);
                            const end = new Date(contest.endTime);
                            let status = { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
                            if (now >= start && now <= end) {
                              status = { label: 'Live', color: 'bg-green-100 text-green-700' };
                            } else if (now > end) {
                              status = { label: 'Ended', color: 'bg-gray-100 text-gray-700' };
                            }
                            
                            return (
                              <tr key={contest._id} className="hover:bg-slate-50">
                                <td className="px-3 sm:px-4 py-3">
                                  <p className="font-medium text-slate-900 text-sm sm:text-base">{contest.title}</p>
                                </td>
                                <td className="px-3 sm:px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                    {status.label}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-slate-600 hidden sm:table-cell">{contest.participantCount || 0}</td>
                                <td className="px-3 sm:px-4 py-3 text-slate-600 hidden sm:table-cell">{contest.questionCount || 0}</td>
                                <td className="px-3 sm:px-4 py-3">
                                  <Link 
                                    to={`/admin/contest/${contest._id}/leaderboard`}
                                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quizzes Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Your Quizzes</h2>
                  </div>
                  {quizzes.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                      <p className="text-slate-500 text-sm sm:text-base">No quizzes created yet. Create your first quiz!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {quizzes.map((quiz) => (
                        <QuizCard
                          key={quiz._id}
                          quiz={quiz}
                          onDelete={() => handleDeleteQuiz(quiz._id)}
                          isAdmin={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

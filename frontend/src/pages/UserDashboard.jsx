import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userQuizAPI } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import QuizCard from '../components/QuizCard';
import { HiSparkles } from 'react-icons/hi';
import { FiClock, FiCheckCircle, FiTrendingUp, FiAward, FiTrash2 } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizzesWithProgress, setQuizzesWithProgress] = useState(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    checkSavedProgress();
  }, []);

  // Re-check progress when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSavedProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkSavedProgress);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkSavedProgress);
    };
  }, []);

  const checkSavedProgress = () => {
    const progressSet = new Set();
    // Check localStorage for saved quiz progress
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('quiz_progress_')) {
        const quizId = key.replace('quiz_progress_', '');
        progressSet.add(quizId);
      }
    });
    setQuizzesWithProgress(progressSet);
  };

  const fetchData = async () => {
    try {
      const [quizzesRes, historyRes] = await Promise.all([
        userQuizAPI.getAllQuizzes(),
        userQuizAPI.getQuizHistory(),
      ]);
      setQuizzes(quizzesRes.data.quizzes);
      setHistory(historyRes.data.results);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = async (resultId) => {
    if (confirm('Are you sure you want to delete this quiz result?')) {
      try {
        await userQuizAPI.deleteResult(resultId);
        setHistory(history.filter(result => result._id !== resultId));
        toast.success('Result deleted successfully');
      } catch (error) {
        toast.error('Failed to delete result');
      }
    }
  };

  // Calculate stats
  const totalQuizzesTaken = history.length;
  const averageScore = history.length > 0 
    ? Math.round(history.reduce((acc, h) => acc + h.percentage, 0) / history.length) 
    : 0;
  const bestScore = history.length > 0 
    ? Math.max(...history.map(h => h.percentage)) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Welcome back, {user?.name}
              </h1>
              <p className="text-slate-600 mt-1">Ready to test your knowledge today?</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Quizzes Taken</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{totalQuizzesTaken}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FiCheckCircle className="w-6 h-6 text-slate-700" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Average Score</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{averageScore}%</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-slate-700" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Best Score</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{bestScore}%</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FiAward className="w-6 h-6 text-slate-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all text-sm ${
                    activeTab === 'available'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BsLightningFill className="w-4 h-4" />
                  Available Quizzes
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all text-sm ${
                    activeTab === 'history'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FiClock className="w-4 h-4" />
                  Quiz History
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-slate-900"></div>
                <p className="mt-4 text-slate-600 font-medium">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'available' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {quizzes.length === 0 ? (
                      <div className="col-span-full text-center py-16 bg-white border border-gray-200 rounded-lg">
                        <p className="text-slate-500 text-base font-medium">No quizzes available</p>
                        <p className="text-slate-400 text-sm mt-2">Check back later for new challenges!</p>
                      </div>
                    ) : (
                      quizzes.map((quiz) => (
                        <QuizCard
                          key={quiz._id}
                          quiz={quiz}
                          onClick={() => navigate(`/quiz/${quiz._id}`)}
                          hasProgress={quizzesWithProgress.has(quiz._id)}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <>
                    {history.length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-lg text-center py-16">
                        <p className="text-slate-500 text-base font-medium">No quiz attempts yet</p>
                        <p className="text-slate-400 text-sm mt-2">Start your first quiz to begin tracking your progress!</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">Quiz</th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">Score</th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">Percentage</th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {history.map((result) => (
                                  <tr key={result._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-semibold text-slate-900">{result.quizId?.title}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-bold text-slate-900">
                                        {result.score}/{result.totalQuestions}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        result.percentage >= 70 ? 'bg-emerald-100 text-emerald-800' : 
                                        result.percentage >= 50 ? 'bg-amber-100 text-amber-800' : 
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {result.percentage}%
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                      {new Date(result.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => navigate(`/result/${result._id}`)}
                                          className="text-slate-900 hover:text-slate-700 font-semibold text-sm"
                                        >
                                          View Details →
                                        </button>
                                        <button
                                          onClick={() => handleDeleteResult(result._id)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                                          title="Delete result"
                                        >
                                          <FiTrash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                          {history.map((result) => (
                            <div key={result._id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-sm font-bold text-slate-900 flex-1 pr-2">{result.quizId?.title}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                                  result.percentage >= 70 ? 'bg-emerald-100 text-emerald-800' : 
                                  result.percentage >= 50 ? 'bg-amber-100 text-amber-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {result.percentage}%
                                </span>
                              </div>
                              
                              <div className="space-y-2 mb-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Score:</span>
                                  <span className="font-bold text-slate-900">{result.score}/{result.totalQuestions}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Date:</span>
                                  <span className="font-medium text-slate-900">{new Date(result.submittedAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate(`/result/${result._id}`)}
                                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 font-semibold text-sm transition-all"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleDeleteResult(result._id)}
                                  className="bg-red-600 text-white p-2.5 rounded-lg hover:bg-red-700 transition-all"
                                  title="Delete result"
                                >
                                  <FiTrash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;

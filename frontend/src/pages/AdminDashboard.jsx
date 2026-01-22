import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminQuizAPI } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import QuizCard from '../components/QuizCard';
import { FiPlus } from 'react-icons/fi';

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await adminQuizAPI.getMyQuizzes();
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      try {
        await adminQuizAPI.deleteQuiz(quizId);
        fetchQuizzes();
      } catch (error) {
        alert('Failed to delete quiz');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your quizzes</p>
              </div>
              <button
                onClick={() => navigate('/admin/create-quiz')}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-slate-800 transition text-sm sm:text-base font-semibold whitespace-nowrap"
              >
                <FiPlus className="w-5 h-5" />
                <span>Create New Quiz</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-slate-500 text-base sm:text-lg">No quizzes created yet. Create your first quiz!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

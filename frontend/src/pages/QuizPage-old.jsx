import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userQuizAPI } from '../services/api';
import Header from '../components/Header';
import QuestionCard from '../components/QuestionCard';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      const response = await userQuizAPI.getQuizForAttempt(quizId);
      setQuiz(response.data.quiz);
      setTimeLeft(response.data.quiz.duration * 60); // Convert to seconds
    } catch (error) {
      alert('Failed to load quiz');
      navigate('/user/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) {
      if (!confirm(`You have answered ${answeredCount} out of ${quiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1,
      }));

      const response = await userQuizAPI.submitQuiz(quizId, formattedAnswers);
      navigate(`/result/${response.data.result._id}`);
    } catch (error) {
      alert('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600 mt-2">{quiz.description}</p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span>📝 {quiz.questions.length} Questions</span>
                <span>⏱️ {quiz.duration} minutes</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-indigo-600'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-500 mt-1">Time Remaining</p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {quiz.questions.map((question, index) => (
            <QuestionCard
              key={question._id}
              question={question}
              questionNumber={index + 1}
              selectedOption={answers[question._id]}
              onSelectOption={(optionIndex) => handleAnswerSelect(question._id, optionIndex)}
            />
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Answered: {Object.keys(answers).length} / {quiz.questions.length}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;

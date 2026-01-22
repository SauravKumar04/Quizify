import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userQuizAPI } from '../services/api';
import { FiClock, FiCheckCircle, FiAlertCircle, FiArrowRight, FiArrowLeft, FiFlag } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { BsLightningFill } from 'react-icons/bs';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [flagged, setFlagged] = useState(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit(true);
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
      setTimeLeft(response.data.quiz.duration * 60);
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

  const toggleFlag = (questionIndex) => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(questionIndex)) {
      newFlagged.delete(questionIndex);
    } else {
      newFlagged.add(questionIndex);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;

    const answeredCount = Object.keys(answers).length;
    if (!autoSubmit && answeredCount < quiz.questions.length) {
      setShowSubmitModal(true);
      return;
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

  const getTimeWarning = () => {
    if (timeLeft <= 60) return 'text-red-600';
    if (timeLeft <= 300) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgress = () => {
    return ((Object.keys(answers).length / quiz.questions.length) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700 font-medium">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Quiz Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <HiSparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">Question {currentQuestion + 1} of {quiz.questions.length}</p>
              </div>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-lg border-2 ${
              timeLeft <= 60 ? 'border-red-500 animate-pulse-slow' : 
              timeLeft <= 300 ? 'border-yellow-500' : 'border-green-500'
            }`}>
              <FiClock className={`w-5 h-5 ${getTimeWarning()}`} />
              <span className={`text-lg font-bold ${getTimeWarning()}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">Progress: {getProgress()}%</span>
              <span>{Object.keys(answers).length}/{quiz.questions.length} answered</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - LeetCode Style Layout */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
          {/* LEFT SIDE - Question & Image */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Question Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
                  <span>Question {currentQuestion + 1}</span>
                  <span>•</span>
                  <span>{quiz.questions.length} Total</span>
                </div>
              </div>
              <button
                onClick={() => toggleFlag(currentQuestion)}
                className={`p-2 rounded-lg transition-all ${
                  flagged.has(currentQuestion)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <FiFlag className="w-4 h-4" />
              </button>
            </div>

            {/* Question Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {currentQ.questionText}
              </h2>

              {/* Question Image */}
              {currentQ.questionImage && (
                <div className="mb-6">
                  <img
                    src={currentQ.questionImage}
                    alt="Question"
                    className="w-full max-h-[500px] object-contain rounded-xl shadow-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Question Navigation Grid */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <BsLightningFill className="text-yellow-500" />
                  All Questions
                </h3>
                <div className="grid grid-cols-10 gap-2">
                  {quiz.questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`relative w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        currentQuestion === idx
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-110 ring-2 ring-indigo-300'
                          : answers[q._id] !== undefined
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                      {flagged.has(idx) && (
                        <FiFlag className="absolute -top-1 -right-1 w-3 h-3 text-red-500 fill-red-500" />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <span>Unanswered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiFlag className="w-3 h-3 text-red-500" />
                    <span>Flagged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Options & Controls */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Options Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Choose Your Answer</h3>
              <p className="text-sm text-gray-600 mt-1">Select one option from below</p>
            </div>

            {/* Options - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = answers[currentQ._id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(currentQ._id, idx)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-base flex-1 ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <FiCheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentQuestion === quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Next
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slideInUp">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Ready to Submit?
              </h3>
              <p className="text-gray-600 mb-6">
                You've answered {Object.keys(answers).length} out of {quiz.questions.length} questions.
                {Object.keys(answers).length < quiz.questions.length && (
                  <span className="block mt-2 text-yellow-600 font-medium">
                    {quiz.questions.length - Object.keys(answers).length} questions remain unanswered.
                  </span>
                )}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Review
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;

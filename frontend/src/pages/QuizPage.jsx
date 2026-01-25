import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userQuizAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiClock, FiCheckCircle, FiArrowRight, FiArrowLeft, FiFlag } from 'react-icons/fi';

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
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showResumeNotice, setShowResumeNotice] = useState(false);
  const [questionTimeSpent, setQuestionTimeSpent] = useState({}); // Track time spent on each question
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const questionStartTimeRef = useRef(Date.now());

  // Load saved state on mount
  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  // Save state whenever it changes
  useEffect(() => {
    if (quiz && !submitting) {
      saveState();
    }
  }, [answers, timeLeft, currentQuestion, flagged, quiz, questionTimeSpent]);

  // Track time for current question
  useEffect(() => {
    if (!quiz || submitting || isPaused) return;
    
    // Reset the start time when question changes
    questionStartTimeRef.current = Date.now();
    
    return () => {
      // Save time spent on this question when leaving
      if (quiz && !submitting) {
        const timeOnQuestion = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
        const questionId = quiz.questions[currentQuestion]?._id;
        if (questionId && timeOnQuestion > 0) {
          setQuestionTimeSpent(prev => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + timeOnQuestion
          }));
        }
      }
    };
  }, [currentQuestion, quiz, submitting, isPaused]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || isPaused || submitting) return;

    if (timeLeft === 0) {
      // Auto-submit when time runs out
      const autoSubmitQuiz = async () => {
        if (submitting) return;
        
        setSubmitting(true);
        clearState();

        // Calculate final time spent including current question
        const timeOnCurrentQ = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
        const currentQId = quiz.questions[currentQuestion]?._id;
        const finalTimeSpent = { ...questionTimeSpent };
        if (currentQId) {
          finalTimeSpent[currentQId] = (finalTimeSpent[currentQId] || 0) + timeOnCurrentQ;
        }
        const totalTimeTaken = quiz.duration * 60; // Full duration since time ran out

        const submitToast = toast.loading('Time up! Submitting quiz...');
        try {
          const formattedAnswers = quiz.questions.map((q) => ({
            questionId: q._id,
            selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1,
            timeSpent: finalTimeSpent[q._id] || 0,
          }));

          const response = await userQuizAPI.submitQuiz(quizId, formattedAnswers, totalTimeTaken);
          toast.success('Quiz submitted successfully!', { id: submitToast });
          navigate(`/result/${response.data.result._id}`);
        } catch (error) {
          toast.error('Failed to submit quiz', { id: submitToast });
          setSubmitting(false);
        }
      };
      
      autoSubmitQuiz();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, isPaused, submitting, quiz, answers, quizId, navigate]);

  // Prevent accidental tab close/navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitting) {
        e.preventDefault();
        e.returnValue = '';
        saveState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitting]);

  const saveState = () => {
    if (!quiz) return;
    
    // Save current question's time before saving state
    const timeOnQuestion = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const currentQuestionId = quiz.questions[currentQuestion]?._id;
    const updatedTimeSpent = { ...questionTimeSpent };
    if (currentQuestionId && timeOnQuestion > 0) {
      updatedTimeSpent[currentQuestionId] = (updatedTimeSpent[currentQuestionId] || 0) + timeOnQuestion;
    }
    
    const state = {
      answers,
      timeLeft,
      currentQuestion,
      flagged: Array.from(flagged),
      questionTimeSpent: updatedTimeSpent,
      timestamp: Date.now()
    };
    
    localStorage.setItem(`quiz_${quizId}`, JSON.stringify(state));
  };

  const loadState = () => {
    const saved = localStorage.getItem(`quiz_${quizId}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          setAnswers(state.answers || {});
          setTimeLeft(state.timeLeft);
          setCurrentQuestion(state.currentQuestion || 0);
          setFlagged(new Set(state.flagged || []));
          setQuestionTimeSpent(state.questionTimeSpent || {});
          toast.success('Quiz progress restored', { duration: 3000 });
          return true;
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
    return false;
  };

  const clearState = () => {
    localStorage.removeItem(`quiz_${quizId}`);
  };

  const fetchQuiz = async () => {
    try {
      const response = await userQuizAPI.getQuizForAttempt(quizId);
      setQuiz(response.data.quiz);
      
      // Try to load saved state, otherwise use fresh state
      const stateLoaded = loadState();
      if (!stateLoaded) {
        setTimeLeft(response.data.quiz.duration * 60);
      }
    } catch (error) {
      toast.error('Failed to load quiz');
      navigate('/user/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuit = () => {
    saveState();
    clearInterval(timerRef.current);
    toast.success('Progress saved');
    navigate('/user/dashboard');
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    // Toggle off if already selected, otherwise select
    if (answers[questionId] === optionIndex) {
      const newAnswers = { ...answers };
      delete newAnswers[questionId];
      setAnswers(newAnswers);
    } else {
      setAnswers({ ...answers, [questionId]: optionIndex });
    }
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

  const handleSubmit = async (forceSubmit = false) => {
    if (submitting) return;

    const answeredCount = Object.keys(answers).length;
    // Show confirmation modal only if not forcing submit and there are unanswered questions
    if (!forceSubmit && answeredCount < quiz.questions.length) {
      setShowSubmitModal(true);
      return;
    }

    // Close modal if open
    setShowSubmitModal(false);
    setSubmitting(true);
    clearState(); // Clear saved state when submitting

    // Calculate final time spent including current question
    const timeOnCurrentQ = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const currentQId = quiz.questions[currentQuestion]?._id;
    const finalTimeSpent = { ...questionTimeSpent };
    if (currentQId) {
      finalTimeSpent[currentQId] = (finalTimeSpent[currentQId] || 0) + timeOnCurrentQ;
    }
    const totalTimeTaken = (quiz.duration * 60) - timeLeft;

    const submitToast = toast.loading('Submitting quiz...');
    try {
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1,
        timeSpent: finalTimeSpent[q._id] || 0,
      }));

      const response = await userQuizAPI.submitQuiz(quizId, formattedAnswers, totalTimeTaken);
      toast.success('Quiz submitted successfully!', { id: submitToast });
      navigate(`/result/${response.data.result._id}`);
    } catch (error) {
      toast.error('Failed to submit quiz', { id: submitToast });
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((Object.keys(answers).length / quiz.questions.length) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingAnimation message="Loading quiz" />
      </div>
    );
  }

  if (!quiz) return null;

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Resume Notice */}
      {showResumeNotice && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideInRight">
          <FiCheckCircle className="w-5 h-5" />
          <span className="font-medium">Quiz resumed from where you left off!</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Quiz Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQuitModal(true)}
                className="text-slate-600 hover:text-slate-900 font-medium text-sm"
              >
                ← Back
              </button>
              <div className="border-l border-gray-300 pl-3">
                <h1 className="text-lg font-semibold text-slate-900">{quiz.title}</h1>
                <p className="text-sm text-slate-600">Question {currentQuestion + 1} of {quiz.questions.length}</p>
              </div>
            </div>

            {/* Timer & Progress */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-sm ${
                timeLeft <= 60 ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 
                timeLeft <= 300 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 
                'bg-slate-100 text-slate-700'
              }`}>
                <FiClock className="w-4 h-4" />
                <span className="tabular-nums">{formatTime(timeLeft)}</span>
              </div>
              
              <div className="flex-1 sm:w-40">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{Object.keys(answers).length}/{quiz.questions.length}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-500"
                    style={{ width: `${getProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-450 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* LEFT - Question */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-900">Question {currentQuestion + 1}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{quiz.questions.length} Total</span>
              </div>
              <button
                onClick={() => toggleFlag(currentQuestion)}
                className={`p-2 rounded-lg transition-all ${
                  flagged.has(currentQuestion)
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FiFlag className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
                {currentQ.questionText}
              </h2>

              {currentQ.questionImage && (
                <div className="mb-6">
                  <img
                    src={currentQ.questionImage}
                    alt="Question"
                    className="w-full max-h-75 sm:max-h-100 object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Question Grid */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-slate-900 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-slate-700">All Questions</h3>
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                  {quiz.questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`relative w-9 h-9 rounded-lg font-semibold text-xs transition-all ${
                        currentQuestion === idx
                          ? 'bg-slate-900 text-white ring-2 ring-slate-300'
                          : answers[q._id] !== undefined
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
                      }`}
                    >
                      {idx + 1}
                      {flagged.has(idx) && (
                        <FiFlag className="absolute -top-1 -right-1 w-3 h-3 text-red-600 fill-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Options */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-slate-900">Choose Your Answer</h3>
              <p className="text-sm text-slate-600 mt-0.5">Select one option</p>
            </div>

            <div className="p-5 sm:p-6 space-y-2.5">
              {currentQ.options.map((option, idx) => {
                const isSelected = answers[currentQ._id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(currentQ._id, idx)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-sm'
                        : 'border-gray-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-base flex-1 ${isSelected ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <FiCheckCircle className="w-5 h-5 text-slate-900" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-gray-200">
              <div className="flex items-center justify-between gap-2.5">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-gray-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {currentQuestion === quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all text-sm"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-slate-900 hover:bg-slate-800 transition-all text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Submit Quiz?</h3>
            <p className="text-slate-600 mb-4">
              You have answered {Object.keys(answers).length} out of {quiz.questions.length} questions.
              {Object.keys(answers).length < quiz.questions.length && ' Unanswered questions will be marked as incorrect.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quit Confirmation Modal */}
      {showQuitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Exit Quiz?</h3>
            <p className="text-slate-600 mb-4">
              Your progress will be saved and you can continue later. The timer will pause when you exit.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-slate-700">
                <p><strong>Current Progress:</strong></p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Answered: {Object.keys(answers).length}/{quiz.questions.length} questions</li>
                  <li>• Time remaining: {formatTime(timeLeft)}</li>
                  <li>• Current question: {currentQuestion + 1}</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Continue Quiz
              </button>
              <button
                onClick={handleQuit}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all"
              >
                Exit & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contestAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiClock, FiCheckCircle, FiArrowRight, FiArrowLeft, FiFlag } from 'react-icons/fi';

const ContestPage = () => {
  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [questionTimeSpent, setQuestionTimeSpent] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const questionStartTimeRef = useRef(Date.now());

  const { contestId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContest();
  }, [contestId]);

  // Track time for current question
  useEffect(() => {
    if (!questions.length || submitting) return;
    
    questionStartTimeRef.current = Date.now();
    
    return () => {
      if (questions.length && !submitting) {
        const timeOnQuestion = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
        if (timeOnQuestion > 0) {
          setQuestionTimeSpent(prev => ({
            ...prev,
            [currentQuestion]: (prev[currentQuestion] || 0) + timeOnQuestion
          }));
        }
      }
    };
  }, [currentQuestion, questions.length, submitting]);

  const fetchContest = async () => {
    try {
      const response = await contestAPI.getContestForAttempt(contestId);
      setContest(response.data.contest);
      setQuestions(response.data.questions || []);
      setTimeLeft(response.data.contest.duration * 60);
      setStartedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load contest');
      navigate('/contests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (forceSubmit = false) => {
    if (submitting) return;

    const answeredCount = Object.keys(answers).length;
    if (!forceSubmit && answeredCount < questions.length) {
      setShowSubmitModal(true);
      return;
    }

    setShowSubmitModal(false);
    setSubmitting(true);

    const timeOnCurrentQ = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const finalTimeSpent = { ...questionTimeSpent };
    finalTimeSpent[currentQuestion] = (finalTimeSpent[currentQuestion] || 0) + timeOnCurrentQ;

    try {
      const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedOption]) => ({
        questionIndex: parseInt(questionIndex),
        selectedOption,
        timeSpent: finalTimeSpent[parseInt(questionIndex)] || 0,
      }));

      questions.forEach((_, idx) => {
        if (!formattedAnswers.find(a => a.questionIndex === idx)) {
          formattedAnswers.push({
            questionIndex: idx,
            selectedOption: null,
            timeSpent: finalTimeSpent[idx] || 0,
          });
        }
      });

      const response = await contestAPI.submitContest(contestId, {
        answers: formattedAnswers,
        startedAt,
      });

      toast.success('Contest submitted successfully!');
      navigate(`/contest/${contestId}/leaderboard`, { 
        state: { result: response.data.result } 
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit contest');
      setSubmitting(false);
    }
  }, [contestId, answers, startedAt, submitting, navigate, questionTimeSpent, currentQuestion, questions]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (answers[questionIndex] === optionIndex) {
      const newAnswers = { ...answers };
      delete newAnswers[questionIndex];
      setAnswers(newAnswers);
    } else {
      setAnswers((prev) => ({
        ...prev,
        [questionIndex]: optionIndex,
      }));
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

  const getProgress = () => {
    return ((Object.keys(answers).length / questions.length) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingAnimation message="Loading contest" />
      </div>
    );
  }

  if (!contest || questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Contest Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/contests')}
                className="text-slate-600 hover:text-slate-900 font-medium text-sm"
              >
                ← Back
              </button>
              <div className="border-l border-gray-300 pl-3">
                <h1 className="text-lg font-semibold text-slate-900">{contest.title}</h1>
                <p className="text-sm text-slate-600">Question {currentQuestion + 1} of {questions.length}</p>
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
                  <span className="font-semibold">{answeredCount}/{questions.length}</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* LEFT - Question */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-900">Question {currentQuestion + 1}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{questions.length} Total</span>
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
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
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
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`relative w-9 h-9 rounded-lg font-semibold text-xs transition-all ${
                        currentQuestion === idx
                          ? 'bg-slate-900 text-white ring-2 ring-slate-300'
                          : answers[idx] !== undefined
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
                const isSelected = answers[currentQuestion] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(currentQuestion, idx)}
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

                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={() => handleSubmit()}
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all text-sm disabled:opacity-50"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Submit Contest'}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
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
            <h3 className="text-xl font-bold text-slate-900 mb-2">Submit Contest?</h3>
            <p className="text-slate-600 mb-4">
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && ' Unanswered questions will be marked as incorrect.'}
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
    </div>
  );
};

export default ContestPage;

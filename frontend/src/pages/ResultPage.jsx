import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userQuizAPI } from '../services/api';
import Header from '../components/Header';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiCheckCircle, FiXCircle, FiHome, FiMinusCircle, FiChevronDown, FiChevronUp, FiTarget, FiTrendingUp, FiClock } from 'react-icons/fi';

const ResultPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await userQuizAPI.getResultDetails(resultId);
      setResult(response.data.result);
    } catch (error) {
      alert('Failed to load result');
      navigate('/user/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (index) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const expandAll = () => {
    const allIndexes = new Set(result.detailedAnswers.map((_, i) => i));
    setExpandedQuestions(allIndexes);
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <LoadingAnimation message="Loading results" />
        </div>
      </div>
    );
  }

  // Calculate stats
  const correctCount = result.detailedAnswers.filter(a => a.isCorrect).length;
  const unattemptedCount = result.detailedAnswers.filter(a => a.selectedOption === -1).length;
  const incorrectCount = result.totalQuestions - correctCount - unattemptedCount;
  const attemptedCount = result.totalQuestions - unattemptedCount;
  const accuracy = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(0) : 0;

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getGradeLabel = (percentage) => {
    if (percentage >= 90) return 'Outstanding';
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Great Job';
    if (percentage >= 60) return 'Good Effort';
    if (percentage >= 50) return 'Keep Trying';
    return 'Room to Grow';
  };

  // Filter questions
  const filteredAnswers = result.detailedAnswers.filter((answer) => {
    if (filterType === 'all') return true;
    if (filterType === 'correct') return answer.isCorrect;
    if (filterType === 'incorrect') return !answer.isCorrect && answer.selectedOption !== -1;
    if (filterType === 'unattempted') return answer.selectedOption === -1;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Results Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 mb-4 sm:mb-6">
          <div className="p-4 sm:p-6">
            {/* Quiz Title */}
            <div className="text-center mb-4 sm:mb-6">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Quiz Results</p>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{result.quizId.title}</h1>
            </div>

            {/* Score Display */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={result.percentage >= 80 ? '#10b981' : result.percentage >= 60 ? '#f59e0b' : '#f43f5e'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${result.percentage * 2.64} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl sm:text-3xl font-bold ${getScoreColor(result.percentage)}`}>
                    {Math.round(result.percentage)}%
                  </span>
                  <span className="text-xs text-slate-500">{result.score}/{result.totalQuestions}</span>
                </div>
              </div>
            </div>

            {/* Grade Label */}
            <p className={`text-center text-sm sm:text-base font-semibold ${getScoreColor(result.percentage)} mb-4 sm:mb-6`}>
              {getGradeLabel(result.percentage)}
            </p>

            {/* Stats Row - Compact */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3">
              <div className="text-center p-2 sm:p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-lg sm:text-xl font-bold text-emerald-600">{correctCount}</p>
                <p className="text-[10px] sm:text-xs text-emerald-700 font-medium">Correct</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-rose-50 rounded-lg border border-rose-100">
                <p className="text-lg sm:text-xl font-bold text-rose-600">{incorrectCount}</p>
                <p className="text-[10px] sm:text-xs text-rose-700 font-medium">Wrong</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-slate-100 rounded-lg border border-slate-200">
                <p className="text-lg sm:text-xl font-bold text-slate-600">{unattemptedCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-600 font-medium">Skipped</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-lg sm:text-xl font-bold text-blue-600">{accuracy}%</p>
                <p className="text-[10px] sm:text-xs text-blue-700 font-medium">Accuracy</p>
              </div>
            </div>

            {/* Time Stats Row */}
            {result.totalTimeTaken > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <FiClock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                    <p className="text-lg sm:text-xl font-bold text-purple-600">
                      {Math.floor(result.totalTimeTaken / 60)}:{(result.totalTimeTaken % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-purple-700 font-medium">Total Time</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <FiTarget className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                    <p className="text-lg sm:text-xl font-bold text-indigo-600">{result.avgTimePerQuestion || 0}s</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-indigo-700 font-medium">Avg per Question</p>
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => navigate('/user/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 mx-auto px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
            >
              <FiHome className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Detailed Review Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">Detailed Review</h2>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={expandAll} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded">
                  Expand
                </button>
                <span className="text-slate-300">|</span>
                <button onClick={collapseAll} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded">
                  Collapse
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {[
                { key: 'all', label: 'All', count: result.totalQuestions },
                { key: 'correct', label: 'Correct', count: correctCount },
                { key: 'incorrect', label: 'Wrong', count: incorrectCount },
                { key: 'unattempted', label: 'Skipped', count: unattemptedCount },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                    filterType === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1 py-0.5 rounded text-[10px] ${
                    filterType === tab.key ? 'bg-white/20' : 'bg-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          <div className="divide-y divide-slate-100">
            {filteredAnswers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-sm">No questions in this category</p>
              </div>
            ) : (
              filteredAnswers.map((answer) => {
                const originalIndex = result.detailedAnswers.indexOf(answer);
                const isExpanded = expandedQuestions.has(originalIndex);
                const isUnattempted = answer.selectedOption === -1;
                const timeSpent = answer.timeSpent || 0;
                const avgTime = result.avgTimePerQuestion || 0;
                const isSlowAnswer = timeSpent > avgTime * 1.5 && avgTime > 0;

                return (
                  <div key={originalIndex}>
                    {/* Question Header */}
                    <button
                      onClick={() => toggleQuestion(originalIndex)}
                      className="w-full px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 hover:bg-slate-50 text-left"
                    >
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 ${
                        answer.isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : isUnattempted
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {originalIndex + 1}
                      </div>

                      <p className="flex-1 min-w-0 text-xs sm:text-sm text-slate-800 truncate">
                        {answer.questionText}
                      </p>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Time spent badge */}
                        {timeSpent > 0 && (
                          <span className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isSlowAnswer ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <FiClock className="w-3 h-3" />
                            {timeSpent}s
                          </span>
                        )}
                        {answer.isCorrect ? (
                          <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : isUnattempted ? (
                          <FiMinusCircle className="w-4 h-4 text-slate-400" />
                        ) : (
                          <FiXCircle className="w-4 h-4 text-rose-500" />
                        )}
                        {isExpanded ? (
                          <FiChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <FiChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-4 bg-slate-50">
                        <div className="pl-9 sm:pl-11">
                          <p className="text-sm text-slate-800 font-medium mb-3">{answer.questionText}</p>

                          {/* Question Image */}
                          {answer.questionImage && (
                            <div className="mb-3">
                              <img 
                                src={answer.questionImage} 
                                alt="Question" 
                                className="max-w-full h-auto rounded-lg border border-slate-200 max-h-48 object-contain"
                              />
                            </div>
                          )}

                          {/* Options */}
                          <div className="space-y-1.5 mb-3">
                            {answer.options.map((option, optIndex) => {
                              const isCorrect = optIndex === answer.correctOption;
                              const isSelected = optIndex === answer.selectedOption;

                              return (
                                <div
                                  key={optIndex}
                                  className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-lg border text-xs sm:text-sm ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-200'
                                      : isSelected && !isCorrect
                                      ? 'bg-rose-50 border-rose-200'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-white'
                                      : isSelected && !isCorrect
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <span className={`flex-1 ${isCorrect ? 'text-emerald-800' : isSelected ? 'text-rose-800' : 'text-slate-700'}`}>
                                    {option}
                                  </span>
                                  {isCorrect && <span className="text-[10px] sm:text-xs font-medium text-emerald-600">✓ Correct</span>}
                                  {isSelected && !isCorrect && <span className="text-[10px] sm:text-xs font-medium text-rose-600">Your answer</span>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Time spent info */}
                          {timeSpent > 0 && (
                            <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${
                              isSlowAnswer ? 'bg-amber-50 border border-amber-200' : 'bg-slate-100 border border-slate-200'
                            }`}>
                              <FiClock className={`w-4 h-4 ${isSlowAnswer ? 'text-amber-600' : 'text-slate-500'}`} />
                              <span className={`text-xs font-medium ${isSlowAnswer ? 'text-amber-700' : 'text-slate-600'}`}>
                                Time spent: {timeSpent}s
                                {isSlowAnswer && <span className="ml-2 text-amber-600">(Above average)</span>}
                                {!isSlowAnswer && avgTime > 0 && <span className="ml-2 text-slate-400">(Avg: {avgTime}s)</span>}
                              </span>
                            </div>
                          )}

                          {isUnattempted && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                              <p className="text-xs text-amber-700">You did not attempt this question</p>
                            </div>
                          )}

                          {answer.explanation && (
                            <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-[10px] sm:text-xs font-semibold text-blue-700 uppercase mb-1">Explanation</p>
                              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">{answer.explanation}</p>
                              {answer.explanationImage && (
                                <div className="mt-3">
                                  <img 
                                    src={answer.explanationImage} 
                                    alt="Explanation" 
                                    className="max-w-full h-auto rounded-lg border border-blue-200 max-h-64 object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

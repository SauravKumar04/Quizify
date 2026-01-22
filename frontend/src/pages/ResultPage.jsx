import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userQuizAPI } from '../services/api';
import Header from '../components/Header';
import { FiCheckCircle, FiXCircle, FiHome, FiInfo } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const ResultPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900 mb-4"></div>
            <p className="text-slate-600 font-medium">Loading your results...</p>
          </div>
        </div>
      </div>
    );
  }

  const getGradeTextColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeLabel = (percentage) => {
    if (percentage >= 90) return 'Outstanding!';
    if (percentage >= 80) return 'Excellent!';
    if (percentage >= 70) return 'Great Job!';
    if (percentage >= 60) return 'Good Effort!';
    return 'Keep Learning!';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4">
        {/* Results Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 border border-gray-200">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">{result.quizId.title}</h2>

            {/* Score Display */}
            <div className="mb-6">
              <div className={`text-5xl sm:text-6xl font-bold ${getGradeTextColor(result.percentage)} mb-2`}>
                {result.percentage}%
              </div>
              <p className={`text-xl sm:text-2xl font-semibold ${getGradeTextColor(result.percentage)} mb-1`}>
                {getGradeLabel(result.percentage)}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200">
                <FiCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{result.score}</div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                <FiXCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-red-600">
                  {result.totalQuestions - result.score}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Incorrect</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <BsLightningFill className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{result.totalQuestions}</div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Total</div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/user/dashboard')}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-all font-semibold text-sm sm:text-base mx-auto"
            >
              <FiHome className="w-4 h-4 sm:w-5 sm:h-5" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Detailed Answers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FiInfo className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Detailed Review</h2>
          </div>
          
          {result.detailedAnswers.map((answer, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-sm p-4 sm:p-5 border-l-4 ${
                answer.isCorrect ? 'border-emerald-500' : 'border-red-500'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 bg-slate-900 text-white rounded text-sm font-bold">
                    {index + 1}
                  </span>
                  Question {index + 1}
                </h3>
                {answer.isCorrect ? (
                  <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-red-100 text-red-800 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full">
                    <FiXCircle className="w-3.5 h-3.5" />
                    Incorrect
                  </span>
                )}
              </div>

              <p className="text-slate-800 mb-4 text-sm sm:text-base font-medium">{answer.questionText}</p>

              {/* Options */}
              <div className="space-y-2 mb-3">
                {answer.options.map((option, optIndex) => {
                  const isCorrect = optIndex === answer.correctOption;
                  const isSelected = optIndex === answer.selectedOption;

                  return (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg border ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-500'
                          : isSelected
                          ? 'bg-red-50 border-red-500'
                          : 'bg-slate-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`${isCorrect || isSelected ? 'font-semibold' : ''} text-slate-900 text-sm sm:text-base`}>
                          {option}
                        </span>
                        {isCorrect && (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs sm:text-sm whitespace-nowrap">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Correct
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="flex items-center gap-1 text-red-600 font-bold text-xs sm:text-sm whitespace-nowrap">
                            <FiXCircle className="w-3.5 h-3.5" />
                            Your Answer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {answer.explanation && (
                <div className="p-3 bg-slate-50 rounded-lg border border-gray-200">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Explanation</p>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{answer.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

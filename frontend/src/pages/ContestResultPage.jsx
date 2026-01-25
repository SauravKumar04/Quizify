import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contestAPI } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiInfo, FiAward, FiClock, FiUsers, FiTarget } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const ContestResultPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await contestAPI.getResultDetails(resultId);
      setResult(response.data.result);
    } catch (error) {
      console.error('Failed to load result:', error);
      alert(error.response?.data?.message || 'Failed to load result');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center py-20">
            <LoadingAnimation message="Loading results" />
          </main>
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Profile
            </button>

            {/* Results Summary Card */}
            <div className="bg-white rounded-xl border-2 border-gray-100 p-4 sm:p-6 mb-6">
              <div className="text-center">
                {/* Contest Title */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <FiAward className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{result.contestTitle}</h2>
                </div>

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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
                  <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-200">
                    <FiCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 mx-auto mb-2" />
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{result.score}</div>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Correct</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 sm:p-4 border border-red-200">
                    <FiXCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">
                      {result.totalQuestions - result.score}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Incorrect</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                    <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">{formatTime(result.timeTaken)}</div>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Time Taken</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 sm:p-4 border border-purple-200">
                    <FiTarget className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{result.avgTimePerQuestion || 0}s</div>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Avg/Question</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                    <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl sm:text-3xl font-bold text-amber-600">#{result.rank}</div>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">of {result.totalParticipants}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate(`/contest/${result.contestId}/leaderboard`)}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm sm:text-base"
                  >
                    <FiAward className="w-4 h-4 sm:w-5 sm:h-5" />
                    View Leaderboard
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center justify-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all font-semibold text-sm sm:text-base"
                  >
                    <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Back to Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Answers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FiInfo className="w-5 h-5 text-slate-900" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Detailed Review</h2>
                {result.avgTimePerQuestion > 0 && (
                  <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                    <FiTarget className="w-3 h-3" />
                    Avg: {result.avgTimePerQuestion}s/question
                  </span>
                )}
              </div>
              
              {result.detailedAnswers.map((answer, index) => {
                const timeSpent = answer.timeSpent || 0;
                const avgTime = result.avgTimePerQuestion || 0;
                const isSlowAnswer = timeSpent > avgTime * 1.5 && avgTime > 0;

                return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 ${
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
                    <div className="flex items-center gap-2">
                      {/* Time spent badge */}
                      {timeSpent > 0 && (
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          isSlowAnswer ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <FiClock className="w-3 h-3" />
                          {timeSpent}s
                          {isSlowAnswer && <span className="text-amber-600 ml-1">⚠</span>}
                        </span>
                      )}
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
                  </div>

                  <p className="text-slate-800 mb-4 text-sm sm:text-base font-medium">{answer.questionText}</p>

                  {/* Question Image */}
                  {answer.questionImage && (
                    <div className="mb-4">
                      <img 
                        src={answer.questionImage} 
                        alt="Question" 
                        className="max-w-full h-auto rounded-lg border border-gray-200 max-h-64 object-contain"
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2 mb-3">
                    {answer.options.map((option, optIndex) => {
                      const isCorrect = optIndex === answer.correctOption;
                      const isSelected = optIndex === answer.selectedOption;

                      let optionClass = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (isCorrect) {
                        optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'bg-red-50 border-red-300 text-red-800';
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border-2 ${optionClass} flex items-center gap-3`}
                        >
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            isCorrect ? 'bg-emerald-600 text-white' : 
                            isSelected && !isCorrect ? 'bg-red-600 text-white' : 
                            'bg-slate-300 text-slate-700'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="flex-1 text-sm sm:text-base">{option}</span>
                          {isCorrect && (
                            <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                          )}
                          {isSelected && !isCorrect && (
                            <FiXCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Not Answered */}
                  {answer.selectedOption === null && (
                    <p className="text-sm text-slate-500 italic">Not answered</p>
                  )}
                </div>
              )})}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContestResultPage;

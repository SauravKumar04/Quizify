import { FiClock, FiFileText, FiUser, FiTrash2, FiPlay } from 'react-icons/fi';

const QuizCard = ({ quiz, onClick, onDelete, isAdmin, hasProgress }) => {
  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-2 flex-1">
              {quiz.title}
            </h3>
            {hasProgress && !isAdmin && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded whitespace-nowrap">
                In Progress
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm mb-4 sm:mb-5 line-clamp-3 leading-relaxed">{quiz.description}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200">
            <FiFileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
            <span className="font-medium">{quiz.questions?.length || 0} Questions</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200">
            <FiClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
            <span className="font-medium">{quiz.duration} min</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onClick && (
            <button
              onClick={onClick}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-slate-800 transition-all font-semibold text-sm"
            >
              <FiPlay className="w-4 h-4" />
              {isAdmin ? 'View Quiz' : hasProgress ? 'Resume Quiz' : 'Start Quiz'}
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-red-700 transition-all font-semibold"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;

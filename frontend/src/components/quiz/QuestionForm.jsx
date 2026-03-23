import { FiTrash2 } from 'react-icons/fi';
import RichTextEditor from '../RichTextEditor';

const QuestionForm = ({
  sectionIndex,
  questionIndex,
  question,
  canRemove,
  onRemove,
  onUpdateQuestion,
  onUpdateOption,
  onUploadImage,
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm sm:text-base font-semibold text-slate-900">Question {questionIndex + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-md text-sm"
          >
            <FiTrash2 className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Question</label>
          <RichTextEditor
            value={question.questionText}
            onChange={(value) => onUpdateQuestion('questionText', value)}
            placeholder="Write the question..."
            onImageUpload={onUploadImage}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Options</label>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`correct-${sectionIndex}-${questionIndex}`}
                  checked={question.correctAnswer === optionIndex}
                  onChange={() => onUpdateQuestion('correctAnswer', optionIndex)}
                  className="w-4 h-4"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Select the correct option using the radio button.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Explanation (Optional)</label>
          <RichTextEditor
            value={question.explanation}
            onChange={(value) => onUpdateQuestion('explanation', value)}
            placeholder="Explain the answer..."
            onImageUpload={onUploadImage}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;

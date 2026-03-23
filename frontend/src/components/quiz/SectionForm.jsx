import { FiPlus, FiTrash2 } from 'react-icons/fi';
import QuestionForm from './QuestionForm';

const SectionForm = ({
  section,
  sectionIndex,
  canRemove,
  onRemoveSection,
  onUpdateSectionField,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onUpdateOption,
  onUploadImage,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">Section {sectionIndex + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemoveSection}
            className="inline-flex items-center gap-1.5 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-md text-sm"
          >
            <FiTrash2 className="w-4 h-4" />
            Remove Section
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Section Title</label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdateSectionField('title', e.target.value)}
            placeholder={`Section ${sectionIndex + 1}`}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Time Limit (minutes)</label>
          <input
            type="number"
            min="1"
            value={section.timeLimit}
            onChange={(e) => onUpdateSectionField('timeLimit', Math.max(1, Number(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
          />
        </div>
      </div>

      <div className="space-y-4">
        {section.questions.map((question, questionIndex) => (
          <QuestionForm
            key={questionIndex}
            sectionIndex={sectionIndex}
            questionIndex={questionIndex}
            question={question}
            canRemove={section.questions.length > 1}
            onRemove={() => onRemoveQuestion(questionIndex)}
            onUpdateQuestion={(field, value) => onUpdateQuestion(questionIndex, field, value)}
            onUpdateOption={(optionIndex, value) => onUpdateOption(questionIndex, optionIndex, value)}
            onUploadImage={onUploadImage}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddQuestion}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 rounded-lg py-2.5 font-semibold"
      >
        <FiPlus className="w-4 h-4" />
        Add Question
      </button>
    </div>
  );
};

export default SectionForm;

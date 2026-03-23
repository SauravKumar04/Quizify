import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiSave } from 'react-icons/fi';
import SectionForm from './SectionForm';
import { hasRichTextContent, sanitizeRichTextHtml } from '../../utils/richText';

const DRAFT_KEY = 'quiz_multisection_draft';
const SUBJECT_OPTIONS = [
  { value: 'full-test', label: 'Full Test' },
  { value: 'aptitude', label: 'Aptitude' },
  { value: 'logical-reasoning', label: 'Logical Reasoning' },
  { value: 'verbal-ability', label: 'Verbal Ability' },
  { value: 'coding', label: 'Coding' },
  { value: 'web-development', label: 'Web Development' },
  { value: 'dsa', label: 'DSA' },
  { value: 'databases', label: 'Databases' },
  { value: 'operating-system', label: 'Operating System' },
  { value: 'computer-networks', label: 'Computer Networks' },
  { value: 'oops', label: 'OOPS' },
  { value: 'data-interpretation', label: 'Data Interpretation' },
];

const createEmptyQuestion = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
  questionImage: '',
  explanationImage: '',
});

const createEmptySection = (index) => ({
  title: `Section ${index + 1}`,
  timeLimit: 10,
  questions: [createEmptyQuestion()],
});

const QuizBuilder = ({ onSubmitQuiz, saving, onCancel, uploadImage }) => {
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    subject: 'full-test',
    sections: [createEmptySection(0)],
  });

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft);
      if (parsed?.sections?.length) {
        setQuiz({
          ...parsed,
          subject: parsed.subject || 'full-test',
        });
        toast.success('Draft restored', { duration: 1500 });
      }
    } catch (error) {
      console.error('Failed to parse draft', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(quiz));
  }, [quiz]);

  const totalTimeLimit = useMemo(() => quiz.sections.reduce((sum, section) => sum + (Number(section.timeLimit) || 0), 0), [quiz.sections]);

  const addSection = () => {
    setQuiz((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection(prev.sections.length)],
    }));
  };

  const removeSection = (sectionIndex) => {
    if (quiz.sections.length === 1) return;

    setQuiz((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex).map((section, index) => ({
        ...section,
        title: section.title || `Section ${index + 1}`,
      })),
    }));
  };

  const updateSectionField = (sectionIndex, field, value) => {
    setQuiz((prev) => {
      const sections = [...prev.sections];
      sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
      return { ...prev, sections };
    });
  };

  const addQuestion = (sectionIndex) => {
    setQuiz((prev) => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        questions: [...sections[sectionIndex].questions, createEmptyQuestion()],
      };
      return { ...prev, sections };
    });
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    setQuiz((prev) => {
      const sections = [...prev.sections];
      if (sections[sectionIndex].questions.length === 1) return prev;

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        questions: sections[sectionIndex].questions.filter((_, index) => index !== questionIndex),
      };

      return { ...prev, sections };
    });
  };

  const updateQuestion = (sectionIndex, questionIndex, field, value) => {
    setQuiz((prev) => {
      const sections = [...prev.sections];
      const questions = [...sections[sectionIndex].questions];
      questions[questionIndex] = { ...questions[questionIndex], [field]: value };
      sections[sectionIndex] = { ...sections[sectionIndex], questions };
      return { ...prev, sections };
    });
  };

  const updateOption = (sectionIndex, questionIndex, optionIndex, value) => {
    setQuiz((prev) => {
      const sections = [...prev.sections];
      const questions = [...sections[sectionIndex].questions];
      const options = [...questions[questionIndex].options];
      options[optionIndex] = value;
      questions[questionIndex] = { ...questions[questionIndex], options };
      sections[sectionIndex] = { ...sections[sectionIndex], questions };
      return { ...prev, sections };
    });
  };

  const validateQuiz = () => {
    if (!quiz.title.trim() || !quiz.description.trim()) {
      toast.error('Quiz title and description are required');
      return false;
    }

    for (let sectionIndex = 0; sectionIndex < quiz.sections.length; sectionIndex += 1) {
      const section = quiz.sections[sectionIndex];

      if (!section.title.trim()) {
        toast.error(`Section ${sectionIndex + 1} title is required`);
        return false;
      }

      if (!section.timeLimit || section.timeLimit <= 0) {
        toast.error(`Section ${sectionIndex + 1} must have a valid time limit`);
        return false;
      }

      for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex += 1) {
        const question = section.questions[questionIndex];

        if (!hasRichTextContent(question.questionText)) {
          toast.error(`Section ${sectionIndex + 1}, Question ${questionIndex + 1} is empty`);
          return false;
        }

        const hasEmptyOption = question.options.some((option) => !option.trim());
        if (hasEmptyOption) {
          toast.error(`Section ${sectionIndex + 1}, Question ${questionIndex + 1} has empty options`);
          return false;
        }
      }
    }

    if (!quiz.subject) {
      toast.error('Please select a subject for this quiz');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateQuiz()) return;

    const payload = {
      title: quiz.title.trim(),
      description: quiz.description.trim(),
      subject: quiz.subject,
      duration: totalTimeLimit,
      sections: quiz.sections.map((section, sectionIndex) => ({
        title: section.title.trim() || `Section ${sectionIndex + 1}`,
        timeLimit: Number(section.timeLimit) || 1,
        questions: section.questions.map((question) => ({
          questionText: sanitizeRichTextHtml(question.questionText),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer,
          explanation: sanitizeRichTextHtml(question.explanation),
          questionImage: question.questionImage || '',
          explanationImage: question.explanationImage || '',
        })),
      })),
    };

    await onSubmitQuiz(payload);
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quiz Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              placeholder="Multi-section quiz title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={quiz.description}
              onChange={(e) => setQuiz((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              rows="3"
              placeholder="What does this quiz test?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Quiz Subject</label>
            <select
              value={quiz.subject}
              onChange={(e) => setQuiz((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              required
            >
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">This subject decides where the quiz appears in dashboard filters.</p>
          </div>

          <p className="text-xs text-slate-500">Total quiz time: {totalTimeLimit} minutes (sum of all section limits)</p>
        </div>
      </div>

      <div className="space-y-4">
        {quiz.sections.map((section, sectionIndex) => (
          <SectionForm
            key={sectionIndex}
            section={section}
            sectionIndex={sectionIndex}
            canRemove={quiz.sections.length > 1}
            onRemoveSection={() => removeSection(sectionIndex)}
            onUpdateSectionField={(field, value) => updateSectionField(sectionIndex, field, value)}
            onAddQuestion={() => addQuestion(sectionIndex)}
            onRemoveQuestion={(questionIndex) => removeQuestion(sectionIndex, questionIndex)}
            onUpdateQuestion={(questionIndex, field, value) => updateQuestion(sectionIndex, questionIndex, field, value)}
            onUpdateOption={(questionIndex, optionIndex, value) => updateOption(sectionIndex, questionIndex, optionIndex, value)}
            onUploadImage={uploadImage}
          />
        ))}

        <button
          type="button"
          onClick={addSection}
          className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 rounded-lg py-3 font-semibold"
        >
          <FiPlus className="w-5 h-5" />
          Add Section
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold disabled:opacity-60"
        >
          <FiSave className="w-4 h-4" />
          {saving ? 'Saving...' : 'Create Quiz'}
        </button>
      </div>
    </form>
  );
};

export default QuizBuilder;

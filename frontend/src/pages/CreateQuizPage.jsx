import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import LoadingAnimation from '../components/LoadingAnimation';
import QuizBuilder from '../components/quiz/QuizBuilder';
import { adminQuizAPI } from '../services/api';

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [saving, setSaving] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [initialQuiz, setInitialQuiz] = useState(null);
  const isEditMode = useMemo(() => Boolean(quizId), [quizId]);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchQuiz = async () => {
      setLoadingQuiz(true);
      try {
        const response = await adminQuizAPI.getQuizById(quizId);
        const quiz = response.data?.quiz;

        if (!quiz) {
          toast.error('Quiz not found');
          navigate('/admin/dashboard');
          return;
        }

        const mappedSections = Array.isArray(quiz.sections) && quiz.sections.length > 0
          ? quiz.sections.map((section, index) => ({
              title: section.title || `Section ${index + 1}`,
              timeLimit: Number(section.timeLimit) || 1,
              questions: (section.questions || []).map((question) => ({
                questionText: question.questionText || '',
                options: Array.isArray(question.options) ? question.options : ['', '', '', ''],
                correctAnswer: Number.isInteger(question.correctOption)
                  ? question.correctOption
                  : (Number.isInteger(question.correctAnswer) ? question.correctAnswer : 0),
                explanation: question.explanation || '',
                questionImage: question.questionImage || '',
                explanationImage: question.explanationImage || '',
              })),
            }))
          : [{
              title: 'Section 1',
              timeLimit: Number(quiz.duration) || 1,
              questions: (quiz.questions || []).map((question) => ({
                questionText: question.questionText || '',
                options: Array.isArray(question.options) ? question.options : ['', '', '', ''],
                correctAnswer: Number.isInteger(question.correctOption)
                  ? question.correctOption
                  : (Number.isInteger(question.correctAnswer) ? question.correctAnswer : 0),
                explanation: question.explanation || '',
                questionImage: question.questionImage || '',
                explanationImage: question.explanationImage || '',
              })),
            }];

        setInitialQuiz({
          title: quiz.title || '',
          description: quiz.description || '',
          subject: quiz.subject || 'full-test',
          sections: mappedSections,
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load quiz');
        navigate('/admin/dashboard');
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuiz();
  }, [isEditMode, navigate, quizId]);

  const handleUploadImage = async (file) => {
    const uploadToast = toast.loading('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await adminQuizAPI.uploadQuestionImage(formData);
      toast.success('Image uploaded', { id: uploadToast });
      return response.data.imageUrl;
    } catch (error) {
      toast.error('Image upload failed', { id: uploadToast });
      return null;
    }
  };

  const handleSubmitQuiz = async (payload) => {
    if (saving) return;

    setSaving(true);
    const submitToast = toast.loading(isEditMode ? 'Updating quiz...' : 'Submitting quiz...');

    try {
      if (isEditMode) {
        await adminQuizAPI.updateQuiz(quizId, payload);
        toast.success('Quiz updated successfully', { id: submitToast });
      } else {
        await adminQuizAPI.createQuiz(payload);
        toast.success('Quiz created successfully', { id: submitToast });
      }
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} quiz`, { id: submitToast });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Multi-Section Quiz' : 'Create Multi-Section Quiz'}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {isEditMode
              ? 'Update quiz details, sections, and questions.'
              : 'Build timed sections with independent questions and scoring.'}
          </p>
        </div>

        {loadingQuiz ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <LoadingAnimation message="Loading quiz" />
          </div>
        ) : (
          <QuizBuilder
            onSubmitQuiz={handleSubmitQuiz}
            onCancel={handleCancel}
            saving={saving}
            uploadImage={handleUploadImage}
            initialQuiz={initialQuiz}
            mode={isEditMode ? 'edit' : 'create'}
            draftKey={isEditMode ? `quiz_multisection_draft_${quizId}` : 'quiz_multisection_draft'}
          />
        )}
      </div>
    </div>
  );
};

export default CreateQuizPage;

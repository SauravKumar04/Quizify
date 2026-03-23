import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import QuizBuilder from '../components/quiz/QuizBuilder';
import { adminQuizAPI } from '../services/api';

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

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

  const handleCreateQuiz = async (payload) => {
    if (saving) return;

    setSaving(true);
    const submitToast = toast.loading('Submitting quiz...');

    try {
      await adminQuizAPI.createQuiz(payload);
      toast.success('Quiz created successfully', { id: submitToast });
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create quiz', { id: submitToast });
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Create Multi-Section Quiz</h1>
          <p className="text-sm text-slate-600 mt-1">Build timed sections with independent questions and scoring.</p>
        </div>

        <QuizBuilder
          onSubmitQuiz={handleCreateQuiz}
          onCancel={handleCancel}
          saving={saving}
          uploadImage={handleUploadImage}
        />
      </div>
    </div>
  );
};

export default CreateQuizPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminQuizAPI } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave, FiCheck } from 'react-icons/fi';

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    duration: 30,
    questions: [
      {
        questionText: '',
        questionImage: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        explanationImage: '',
      },
    ],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved draft from localStorage
    const savedDraft = localStorage.getItem('quiz_draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setNewQuiz(parsedDraft);
        toast.success('Draft restored', { duration: 2000 });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (newQuiz.title || newQuiz.description || newQuiz.questions[0].questionText) {
      localStorage.setItem('quiz_draft', JSON.stringify(newQuiz));
    }
  }, [newQuiz]);

  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [
        ...newQuiz.questions,
        {
          questionText: '',
          questionImage: '',
          options: ['', '', '', ''],
          correctOption: 0,
          explanation: '',
          explanationImage: '',
        },
      ],
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[index][field] = value;
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[qIndex].options[optIndex] = value;
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    if (newQuiz.questions.length > 1) {
      const updatedQuestions = newQuiz.questions.filter((_, i) => i !== index);
      setNewQuiz({ ...newQuiz, questions: updatedQuestions });
    }
  };

  const handleImageUpload = async (qIndex, file) => {
    if (!file) return;
    
    const uploadToast = toast.loading('Uploading image...');
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await adminQuizAPI.uploadQuestionImage(formData);
      const imageUrl = response.data.imageUrl;
      
      const updatedQuestions = [...newQuiz.questions];
      updatedQuestions[qIndex].questionImage = imageUrl;
      setNewQuiz({ ...newQuiz, questions: updatedQuestions });
      toast.success('Image uploaded successfully', { id: uploadToast });
    } catch (error) {
      toast.error('Failed to upload image', { id: uploadToast });
    }
  };

  const handleExplanationImageUpload = async (qIndex, file) => {
    if (!file) return;
    
    const uploadToast = toast.loading('Uploading explanation image...');
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await adminQuizAPI.uploadQuestionImage(formData);
      const imageUrl = response.data.imageUrl;
      
      const updatedQuestions = [...newQuiz.questions];
      updatedQuestions[qIndex].explanationImage = imageUrl;
      setNewQuiz({ ...newQuiz, questions: updatedQuestions });
      toast.success('Image uploaded successfully', { id: uploadToast });
    } catch (error) {
      toast.error('Failed to upload image', { id: uploadToast });
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminQuizAPI.createQuiz(newQuiz);
      localStorage.removeItem('quiz_draft');
      toast.success('Quiz created successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Failed to create quiz: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (newQuiz.title || newQuiz.description || newQuiz.questions[0].questionText) {
      if (confirm('You have unsaved changes. Discard and go back?')) {
        navigate('/admin/dashboard');
      }
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Header />
      
      {/* Sticky Top Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors flex-shrink-0"
              >
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">Create New Quiz</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">Auto-saving to drafts</p>
              </div>
            </div>
            <button
              onClick={handleCreateQuiz}
              disabled={saving}
              className="flex items-center gap-1 sm:gap-2 bg-slate-900 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-slate-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-shrink-0"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Creating...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Quiz</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <form onSubmit={handleCreateQuiz}>
          {/* Quiz Details Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold">1</span>
              Quiz Information
            </h2>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-slate-900 placeholder-slate-400"
                  placeholder="e.g., JavaScript Fundamentals Quiz"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-slate-900 placeholder-slate-400"
                  rows="3"
                  placeholder="Brief description of what this quiz covers..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={newQuiz.duration}
                  onChange={(e) => setNewQuiz({ ...newQuiz, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-slate-900"
                  min="1"
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold">2</span>
                Questions ({newQuiz.questions.length})
              </h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {newQuiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="border border-gray-200 rounded-lg p-3 sm:p-5 bg-slate-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 sm:mb-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 text-white rounded-lg text-sm sm:text-base font-bold shrink-0">
                        {qIndex + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Question {qIndex + 1}</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500">Fill in the question details below</p>
                      </div>
                    </div>
                    {newQuiz.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="flex items-center gap-1.5 sm:gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-medium"
                      >
                        <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={question.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                        rows="2"
                        placeholder="Enter your question here..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Question Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(qIndex, e.target.files[0])}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:transition-all cursor-pointer"
                      />
                      {question.questionImage && (
                        <div className="mt-3 relative inline-block">
                          <img 
                            src={question.questionImage} 
                            alt="Question preview" 
                            className="max-w-xs rounded-lg shadow-md border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIndex, 'questionImage', '')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                        Answer Options <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2 sm:space-y-2.5">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 sm:gap-3 group">
                            <input
                              type="radio"
                              id={`correct-${qIndex}-${optIndex}`}
                              name={`correct-${qIndex}`}
                              checked={question.correctOption === optIndex}
                              onChange={() => updateQuestion(qIndex, 'correctOption', optIndex)}
                              className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              required
                              value={option}
                              onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                              className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 text-sm sm:text-base"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            {question.correctOption === optIndex && (
                              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg whitespace-nowrap">
                                <FiCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden md:inline">Correct</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-2">Select the correct answer by clicking the radio button</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Explanation (Optional)
                      </label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                        rows="2"
                        placeholder="Explain why this is the correct answer..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Explanation Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleExplanationImageUpload(qIndex, e.target.files[0])}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:transition-all cursor-pointer"
                      />
                      {question.explanationImage && (
                        <div className="mt-3 relative inline-block">
                          <img 
                            src={question.explanationImage} 
                            alt="Explanation preview" 
                            className="max-w-xs rounded-lg shadow-md border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIndex, 'explanationImage', '')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all font-semibold flex items-center justify-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                Add Another Question
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              {newQuiz.questions.length} {newQuiz.questions.length === 1 ? 'question' : 'questions'} added
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-slate-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    <span>Create Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuizPage;

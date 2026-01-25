import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaImage, FaTimes, FaSave, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { adminContestAPI } from '../services/api';

const CreateContestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 30,
  });

  const [questions, setQuestions] = useState([
    {
      questionText: '',
      questionImage: '',
      options: ['', '', '', ''],
      correctOption: 0,
      explanation: '',
      explanationImage: '',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);
  const fileInputRefs = useRef([]);

  useEffect(() => {
    if (isEditing) {
      fetchContest();
    }
  }, [id]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const response = await adminContestAPI.getContestById(id);
      const contest = response.data.contest;
      
      // Format dates for datetime-local input
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        title: contest.title,
        description: contest.description || '',
        startTime: formatDate(contest.startTime),
        endTime: formatDate(contest.endTime),
        duration: contest.duration,
      });

      if (contest.questions && contest.questions.length > 0) {
        setQuestions(contest.questions.map(q => {
          // Pad options array to always have 4 items
          const options = [...(q.options || [])];
          while (options.length < 4) {
            options.push('');
          }
          return {
            questionText: q.questionText,
            questionImage: q.questionImage || '',
            options,
            correctOption: q.correctOption,
            explanation: q.explanation || '',
            explanationImage: q.explanationImage || '',
          };
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch contest');
      navigate('/admin/contests');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      const newOptions = [...updated[questionIndex].options];
      newOptions[optionIndex] = value;
      updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
      return updated;
    });
  };

  const handleImageUpload = async (questionIndex, file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(questionIndex);
      const formData = new FormData();
      formData.append('image', file);

      const response = await adminContestAPI.uploadQuestionImage(formData);
      
      handleQuestionChange(questionIndex, 'questionImage', response.data.imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const removeImage = (questionIndex) => {
    handleQuestionChange(questionIndex, 'questionImage', '');
  };

  const handleExplanationImageUpload = async (questionIndex, file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(`explanation-${questionIndex}`);
      const formData = new FormData();
      formData.append('image', file);

      const response = await adminContestAPI.uploadQuestionImage(formData);
      
      handleQuestionChange(questionIndex, 'explanationImage', response.data.imageUrl);
      toast.success('Explanation image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const removeExplanationImage = (questionIndex) => {
    handleQuestionChange(questionIndex, 'explanationImage', '');
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        questionText: '',
        questionImage: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        explanationImage: '',
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('Contest must have at least one question');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter contest title');
      return false;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error('Please set start and end times');
      return false;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast.error('End time must be after start time');
      return false;
    }

    if (formData.duration < 1) {
      toast.error('Duration must be at least 1 minute');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return false;
      }
      
      const filledOptions = q.options.filter(opt => opt.trim());
      if (filledOptions.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options`);
        return false;
      }

      if (!q.options[q.correctOption]?.trim()) {
        toast.error(`Question ${i + 1} correct option cannot be empty`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const contestData = {
        ...formData,
        duration: parseInt(formData.duration),
        questions: questions.map(q => ({
          questionText: q.questionText,
          questionImage: q.questionImage || undefined,
          options: q.options.filter(opt => opt.trim()),
          correctOption: q.correctOption,
          explanation: q.explanation || undefined,
          explanationImage: q.explanationImage || undefined,
        })),
      };

      if (isEditing) {
        await adminContestAPI.updateContest(id, contestData);
        toast.success('Contest updated successfully');
      } else {
        await adminContestAPI.createContest(contestData);
        toast.success('Contest created successfully');
      }

      navigate('/admin/contests');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save contest');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/admin/contests')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <FaArrowLeft /> Back to Contests
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
        {isEditing ? 'Edit Contest' : 'Create New Contest'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Contest Details */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Contest Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter contest title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter contest description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleFormChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Time allowed for each participant to complete the contest
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Questions ({questions.length})</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
            >
              <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Question
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {questions.map((question, qIndex) => (
              <div
                key={qIndex}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="font-medium text-base sm:text-lg">Question {qIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Question Text */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Question Text *
                  </label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter your question"
                  />
                </div>

                {/* Question Image */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Question Image (Optional)
                  </label>
                  
                  {question.questionImage ? (
                    <div className="relative inline-block">
                      <img
                        src={question.questionImage}
                        alt="Question"
                        className="max-w-full sm:max-w-xs max-h-36 sm:max-h-48 rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(qIndex)}
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full p-0.5 sm:p-1 hover:bg-red-600"
                      >
                        <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => (fileInputRefs.current[qIndex] = el)}
                        onChange={(e) => handleImageUpload(qIndex, e.target.files[0])}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[qIndex]?.click()}
                        disabled={uploadingImage === qIndex}
                        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 text-sm sm:text-base"
                      >
                        {uploadingImage === qIndex ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-indigo-500"></div>
                            <span className="text-xs sm:text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <FaImage className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="text-xs sm:text-sm">Upload Image</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Options * (Select the correct answer)
                  </label>
                  <div className="space-y-1.5 sm:space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctOption === oIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correctOption', oIndex)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base min-w-0"
                          placeholder={`Option ${oIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Explanation (Optional)
                  </label>
                  <textarea
                    value={question.explanation}
                    onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Explain the correct answer"
                  />
                </div>

                {/* Explanation Image */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Explanation Image (Optional)
                  </label>
                  {question.explanationImage ? (
                    <div className="relative inline-block">
                      <img
                        src={question.explanationImage}
                        alt="Explanation preview"
                        className="max-w-xs h-auto rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeExplanationImage(qIndex)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleExplanationImageUpload(qIndex, e.target.files[0])}
                        className="hidden"
                        id={`explanation-image-${qIndex}`}
                      />
                      <label
                        htmlFor={`explanation-image-${qIndex}`}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-xs sm:text-sm"
                      >
                        {uploadingImage === `explanation-${qIndex}` ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-indigo-500"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <FaImage className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span>Add Explanation Image</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/contests')}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm sm:text-base order-1 sm:order-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave className="w-3 h-3 sm:w-4 sm:h-4" /> <span>{isEditing ? 'Update Contest' : 'Create Contest'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateContestPage;

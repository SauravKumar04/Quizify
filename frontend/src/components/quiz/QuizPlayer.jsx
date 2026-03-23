import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiLogOut, FiShield } from 'react-icons/fi';
import { userQuizAPI } from '../../services/api';
import LoadingAnimation from '../LoadingAnimation';
import Timer from './Timer';
import { sanitizeRichTextHtml } from '../../utils/richText';

const getStorageKey = (quizId) => `quiz_multi_session_${quizId}`;

const QuizPlayer = ({ quizId }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersBySection, setAnswersBySection] = useState({});
  const [questionTimeBySection, setQuestionTimeBySection] = useState({});
  const [sectionSubmissions, setSectionSubmissions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const [sectionTransitioning, setSectionTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  const transitionLockRef = useRef(false);
  const questionStartTimeRef = useRef(Date.now());
  const questionTimeBySectionRef = useRef({});

  const sections = quiz?.sections || [];
  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex];
  const totalSections = sections.length;
  const totalQuestionsInSection = currentSection?.questions?.length || 0;

  const answeredInCurrentSection = useMemo(() => {
    const sectionAnswers = answersBySection[currentSectionIndex] || {};
    return Object.keys(sectionAnswers).length;
  }, [answersBySection, currentSectionIndex]);

  const sectionProgressState = useMemo(
    () => sections.map((section, index) => {
      if (index < currentSectionIndex) return 'completed';
      if (index === currentSectionIndex) return 'current';
      return 'upcoming';
    }),
    [sections, currentSectionIndex]
  );

  const persistState = (state) => {
    localStorage.setItem(getStorageKey(quizId), JSON.stringify(state));
  };

  const clearSavedSession = () => {
    localStorage.removeItem(getStorageKey(quizId));
  };

  const syncQuestionTimeMap = (nextMap) => {
    questionTimeBySectionRef.current = nextMap;
    setQuestionTimeBySection(nextMap);
  };

  const recordCurrentQuestionTime = () => {
    if (!currentQuestion) return questionTimeBySectionRef.current;

    const elapsed = Math.max(0, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    if (elapsed === 0) return questionTimeBySectionRef.current;

    const currentMap = questionTimeBySectionRef.current || {};
    const sectionMap = { ...(currentMap[currentSectionIndex] || {}) };
    sectionMap[currentQuestion._id] = (sectionMap[currentQuestion._id] || 0) + elapsed;

    const nextMap = {
      ...currentMap,
      [currentSectionIndex]: sectionMap,
    };

    syncQuestionTimeMap(nextMap);
    questionStartTimeRef.current = Date.now();
    return nextMap;
  };

  const restoreState = (quizData) => {
    const saved = localStorage.getItem(getStorageKey(quizId));
    if (!saved) {
      setTimeLeft((quizData.sections?.[0]?.timeLimit || 1) * 60);
      return false;
    }

    try {
      const parsed = JSON.parse(saved);
      if (!parsed || parsed.quizId !== quizId) {
        setTimeLeft((quizData.sections?.[0]?.timeLimit || 1) * 60);
        return false;
      }

      const restoredSectionIndex = parsed.currentSectionIndex || 0;
      const maxQuestionIndex = (quizData.sections?.[restoredSectionIndex]?.questions?.length || 1) - 1;
      const restoredQuestionIndex = Math.min(parsed.currentQuestionIndex || 0, Math.max(maxQuestionIndex, 0));

      setCurrentSectionIndex(restoredSectionIndex);
      setCurrentQuestionIndex(restoredQuestionIndex);
      setAnswersBySection(parsed.answersBySection || {});
      setSectionSubmissions(parsed.sectionSubmissions || []);

      const restoredQuestionTimes = parsed.questionTimeBySection || {};
      setQuestionTimeBySection(restoredQuestionTimes);
      questionTimeBySectionRef.current = restoredQuestionTimes;

      const fallbackTime = (quizData.sections?.[restoredSectionIndex]?.timeLimit || 1) * 60;
      setTimeLeft(parsed.timeLeft > 0 ? parsed.timeLeft : fallbackTime);

      toast.success('Quiz session restored', { duration: 1400 });
      return true;
    } catch (error) {
      setTimeLeft((quizData.sections?.[0]?.timeLimit || 1) * 60);
      return false;
    }
  };

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await userQuizAPI.getQuizForAttempt(quizId);
        const quizData = response.data.quiz;

        setQuiz(quizData);
        const restored = restoreState(quizData);
        setShowInstructionsModal(!restored);
      } catch (error) {
        toast.error('Failed to load quiz');
        navigate('/user/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, navigate]);

  useEffect(() => {
    if (!quiz || submitting || !currentSection) return;

    persistState({
      quizId,
      currentSectionIndex,
      currentQuestionIndex,
      answersBySection,
      questionTimeBySection,
      sectionSubmissions,
      timeLeft,
      savedAt: Date.now(),
    });
  }, [quizId, quiz, currentSectionIndex, currentQuestionIndex, answersBySection, questionTimeBySection, sectionSubmissions, timeLeft, submitting, currentSection]);

  useEffect(() => {
    if (!quiz || submitting || !currentSection || sectionTransitioning || showInstructionsModal) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, currentSection, submitting, sectionTransitioning, showInstructionsModal]);

  useEffect(() => {
    if (timeLeft === 0 && currentSection && !submitting && !sectionTransitioning) {
      handleSubmitSection(true);
    }
  }, [timeLeft, currentSection, submitting, sectionTransitioning]);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentSectionIndex, currentQuestionIndex]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (quiz && !submitting) {
        recordCurrentQuestionTime();
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handlePopState = () => {
      if (!submitting) {
        window.history.pushState(null, '', window.location.href);
        toast.error('Back navigation is disabled during quiz');
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [quiz, submitting, currentQuestion]);

  const handleAnswer = (questionId, optionIndex) => {
    setAnswersBySection((prev) => {
      const currentSectionAnswers = { ...(prev[currentSectionIndex] || {}) };
      const isAlreadySelected = currentSectionAnswers[questionId] === optionIndex;

      if (isAlreadySelected) {
        delete currentSectionAnswers[questionId];
      } else {
        currentSectionAnswers[questionId] = optionIndex;
      }

      return {
        ...prev,
        [currentSectionIndex]: currentSectionAnswers,
      };
    });
  };

  const goToQuestion = (nextIndex) => {
    if (!currentSection) return;
    if (nextIndex < 0 || nextIndex >= currentSection.questions.length) return;
    if (sectionTransitioning || submitting) return;

    recordCurrentQuestionTime();
    setCurrentQuestionIndex(nextIndex);
  };

  const submitFinalQuiz = async (finalSectionSubmissions) => {
    if (!quiz) return;

    setSubmitting(true);
    const submitToast = toast.loading('Submitting quiz...');

    try {
      const totalTimeTaken = finalSectionSubmissions.reduce((sum, section) => sum + (section.timeTaken || 0), 0);
      const response = await userQuizAPI.submitQuiz(quizId, {
        sectionSubmissions: finalSectionSubmissions,
        totalTimeTaken,
      });

      clearSavedSession();
      sessionStorage.setItem('quizify_result_celebrate', response.data.result._id);
      toast.success('Quiz submitted', { id: submitToast });
      navigate(`/result/${response.data.result._id}`, { state: { celebrate: true } });
    } catch (error) {
      toast.error('Failed to submit quiz', { id: submitToast });
      setSubmitting(false);
      transitionLockRef.current = false;
    }
  };

  const startNextSectionTransition = (nextSectionIndex, message) => {
    setTransitionMessage(message);
    setSectionTransitioning(true);

    setTimeout(() => {
      setCurrentSectionIndex(nextSectionIndex);
      setCurrentQuestionIndex(0);
      setTimeLeft((sections[nextSectionIndex].timeLimit || 1) * 60);
      questionStartTimeRef.current = Date.now();
      transitionLockRef.current = false;
      setSectionTransitioning(false);
    }, 1400);
  };

  const handleSubmitSection = async (isAutoSubmit = false) => {
    if (!quiz || !currentSection || submitting || sectionTransitioning || transitionLockRef.current) return;

    transitionLockRef.current = true;

    const timingMapSnapshot = recordCurrentQuestionTime();
    const sectionAnswers = answersBySection[currentSectionIndex] || {};
    const sectionTimeInSeconds = (currentSection.timeLimit || 1) * 60;

    const sectionPayload = {
      sectionIndex: currentSectionIndex,
      timeTaken: Math.max(sectionTimeInSeconds - timeLeft, 0),
      autoSubmitted: isAutoSubmit,
      answers: currentSection.questions.map((question) => ({
        questionId: question._id,
        selectedOption: sectionAnswers[question._id] !== undefined ? sectionAnswers[question._id] : -1,
        timeSpent: timingMapSnapshot?.[currentSectionIndex]?.[question._id] || 0,
      })),
    };

    const updatedSubmissions = [...sectionSubmissions, sectionPayload];
    setSectionSubmissions(updatedSubmissions);

    if (currentSectionIndex === totalSections - 1) {
      await submitFinalQuiz(updatedSubmissions);
      return;
    }

    const nextSectionIndex = currentSectionIndex + 1;
    startNextSectionTransition(
      nextSectionIndex,
      isAutoSubmit ? 'Time over. Next section starts now.' : 'Section submitted. Next section starts now.'
    );
  };

  const openQuitModal = () => {
    if (submitting || sectionTransitioning) return;
    setShowQuitModal(true);
  };

  const requestManualSubmitSection = () => {
    if (submitting || sectionTransitioning) return;
    setShowSubmitConfirmModal(true);
  };

  const confirmManualSubmitSection = async () => {
    setShowSubmitConfirmModal(false);
    await handleSubmitSection(false);
  };

  const confirmQuitQuiz = () => {
    recordCurrentQuestionTime();
    setShowQuitModal(false);
    toast.success('Quiz progress saved');
    navigate('/user/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingAnimation message="Loading section" />
      </div>
    );
  }

  if (!quiz || !currentSection || !currentQuestion) return null;

  const selectedOption = answersBySection[currentSectionIndex]?.[currentQuestion._id];
  const solvedProgressPercent = totalQuestionsInSection > 0
    ? Math.round((answeredInCurrentSection / totalQuestionsInSection) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-425 mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{quiz.title}</h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5 truncate">
                Section {currentSectionIndex + 1} of {totalSections} • {currentSection.title}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Timer secondsLeft={timeLeft} warningThreshold={10} />
              <button
                type="button"
                onClick={openQuitModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm"
              >
                <FiLogOut className="w-4 h-4" />
                Quit Quiz
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {sections.map((section, index) => {
              const state = sectionProgressState[index];

              return (
                <div
                  key={`${section.title}-${index}`}
                  title={section.title}
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                    state === 'completed'
                      ? 'border-slate-300 bg-slate-100 text-slate-700'
                      : state === 'current'
                      ? 'border-slate-900 bg-white text-slate-900 ring-1 ring-slate-900'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  Section {index + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-425 mx-auto px-4 sm:px-6 py-5 sm:py-6 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-11 items-start gap-5 lg:min-h-[calc(100vh-150px)]">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden lg:col-span-6 flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-800">Question {currentQuestionIndex + 1} of {totalQuestionsInSection}</p>
              <p className="text-xs text-slate-500 mt-1">Answered {answeredInCurrentSection}/{totalQuestionsInSection} in this section</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${solvedProgressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex-1 overflow-visible lg:overflow-y-auto lg:overscroll-contain lg:max-h-[calc(100vh-290px)]">
              <div
                className="rich-text-content rich-text-read text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(currentQuestion.questionText) }}
              ></div>

              {currentQuestion.questionImage && (
                <div className="mt-5">
                  <img
                    src={currentQuestion.questionImage}
                    alt="Question"
                    className="w-full max-h-80 object-contain rounded-lg border border-slate-200"
                  />
                </div>
              )}

              <div className="mt-7 pt-5 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">All Questions</h3>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                  {currentSection.questions.map((question, index) => {
                    const answered = answersBySection[currentSectionIndex]?.[question._id] !== undefined;
                    const active = currentQuestionIndex === index;

                    return (
                      <button
                        key={question._id}
                        type="button"
                        onClick={() => goToQuestion(index)}
                        disabled={sectionTransitioning || submitting}
                        className={`relative w-9 h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          active
                            ? 'bg-slate-900 text-white ring-2 ring-slate-300'
                            : answered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden lg:col-span-5 flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-800">Choose your answer</p>
              <p className="text-xs text-slate-500 mt-0.5">Selection highlights border only</p>
            </div>

            <div className="p-5 sm:p-6 space-y-2.5 flex-1 overflow-visible lg:overflow-y-auto lg:overscroll-contain lg:max-h-[calc(100vh-290px)]">
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = selectedOption === optionIndex;

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    onClick={() => handleAnswer(currentQuestion._id, optionIndex)}
                    disabled={sectionTransitioning || submitting}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-slate-900 bg-white text-slate-900 ring-1 ring-slate-900'
                        : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <button
                type="button"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0 || sectionTransitioning || submitting}
                className="inline-flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <FiArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentQuestionIndex < totalQuestionsInSection - 1 && (
                  <button
                    type="button"
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    disabled={sectionTransitioning || submitting}
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-60 flex-1 sm:flex-none"
                  >
                    Next
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                )}
                {currentQuestionIndex === totalQuestionsInSection - 1 && (
                  <button
                    type="button"
                    onClick={requestManualSubmitSection}
                    disabled={submitting || sectionTransitioning}
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold text-sm disabled:opacity-60 flex-1 sm:flex-none"
                  >
                    {currentSectionIndex === totalSections - 1 ? 'Submit Quiz' : 'Submit Section'}
                    <FiCheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {sectionTransitioning && (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-800">{transitionMessage || 'Next section starts now...'}</p>
          </div>
        </div>
      )}

      {showQuitModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5">
            <h3 className="text-lg font-bold text-slate-900">Quit Quiz?</h3>
            <p className="text-sm text-slate-600 mt-2">
              Your current progress will be saved, and you can continue later. If you are in an active section, timer progress is also saved.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQuitModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmQuitQuiz}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold"
              >
                Quit & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-55 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5">
            <h3 className="text-lg font-bold text-slate-900">
              {currentSectionIndex === totalSections - 1 ? 'Submit Quiz?' : 'Submit Section?'}
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              You are submitting before timer ends. Remaining time: <span className="font-semibold text-slate-800">{timeLeft}s</span>.
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {currentSectionIndex === totalSections - 1
                ? 'After submitting, your quiz will be finalized and result will be generated.'
                : 'After submitting, you cannot return to this section.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmManualSubmitSection}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstructionsModal && (
        <div className="fixed inset-0 z-60 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-0 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white">
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <FiShield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Before You Start</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Review the section plan and rules for this attempt.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {sections.map((section, index) => (
                  <div key={`${section.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">Section {index + 1}: {section.title}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-700">
                      <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">
                        {section.questions.length} questions
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">
                        {section.timeLimit} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                <p className="text-sm text-slate-700 font-medium">
                  You cannot switch back to previous sections once a section is submitted.
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;

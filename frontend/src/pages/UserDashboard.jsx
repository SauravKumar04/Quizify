import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userQuizAPI } from "../services/api";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import QuizCard from "../components/QuizCard";
import LoadingAnimation from "../components/LoadingAnimation";
import {
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiAward,
  FiTrash2,
  FiFilter,
  FiX,
} from "react-icons/fi";
import { BsLightningFill } from "react-icons/bs";

const FILTER_PRIORITY = [
  "all",
  "full-test",
  "aptitude",
  "logical-reasoning",
  "verbal-ability",
  "coding",
  "web-development",
  "dsa",
  "databases",
  "operating-system",
  "computer-networks",
  "oops",
  "data-interpretation",
];
const QUIZZES_PAGE_SIZE = 12;

const formatFilterLabel = (tag) => {
  if (!tag) return "";
  return tag
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
};

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [quizzesWithProgress, setQuizzesWithProgress] = useState(new Set());
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [quizPage, setQuizPage] = useState(1);
  const [hasMoreQuizzes, setHasMoreQuizzes] = useState(false);
  const filtersReadyRef = useRef(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    checkSavedProgress();
  }, []);

  useEffect(() => {
    if (!filtersReadyRef.current || loading) return;
    fetchQuizzes({ page: 1, tag: selectedFilter, append: false });
  }, [selectedFilter]);

  // Re-check progress when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSavedProgress();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkSavedProgress);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkSavedProgress);
    };
  }, []);

  const checkSavedProgress = () => {
    const progressSet = new Set();
    // Check localStorage for saved quiz progress
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("quiz_progress_") ||
        key.startsWith("quiz_multi_session_")
      ) {
        const quizId = key.startsWith("quiz_progress_")
          ? key.replace("quiz_progress_", "")
          : key.replace("quiz_multi_session_", "");
        progressSet.add(quizId);
      }
    });
    setQuizzesWithProgress(progressSet);
  };

  const fetchQuizzes = async ({
    page = 1,
    tag = "all",
    append = false,
  } = {}) => {
    const response = await userQuizAPI.getAllQuizzes({
      page,
      limit: QUIZZES_PAGE_SIZE,
      subject: tag,
    });

    const incomingQuizzes = response.data?.quizzes || [];
    const pagination = response.data?.pagination || {};

    setQuizzes((prev) =>
      append ? [...prev, ...incomingQuizzes] : incomingQuizzes,
    );
    setQuizPage(page);
    setHasMoreQuizzes(Boolean(pagination.hasMore));
  };

  const fetchData = async () => {
    try {
      const [quizzesRes, historyRes] = await Promise.all([
        userQuizAPI.getAllQuizzes({
          page: 1,
          limit: QUIZZES_PAGE_SIZE,
          subject: selectedFilter,
        }),
        userQuizAPI.getQuizHistory(),
      ]);

      setQuizzes(quizzesRes.data?.quizzes || []);
      setHasMoreQuizzes(Boolean(quizzesRes.data?.pagination?.hasMore));
      setQuizPage(1);
      setHistory(historyRes.data.results);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      filtersReadyRef.current = true;
      setLoading(false);
    }
  };

  const handleShowMore = async () => {
    if (loadingMore || !hasMoreQuizzes) return;
    setLoadingMore(true);

    try {
      await fetchQuizzes({
        page: quizPage + 1,
        tag: selectedFilter,
        append: true,
      });
    } catch (error) {
      toast.error("Failed to load more quizzes");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteResult = async (resultId) => {
    if (confirm("Are you sure you want to delete this quiz result?")) {
      try {
        await userQuizAPI.deleteResult(resultId);
        setHistory(history.filter((result) => result._id !== resultId));
        toast.success("Result deleted successfully");
      } catch (error) {
        toast.error("Failed to delete result");
      }
    }
  };

  // Calculate stats
  const totalQuizzesTaken = history.length;
  const averageScore =
    history.length > 0
      ? Math.round(
          history.reduce((acc, h) => acc + h.percentage, 0) / history.length,
        )
      : 0;
  const bestScore =
    history.length > 0 ? Math.max(...history.map((h) => h.percentage)) : 0;

  return (
    <div className="min-h-screen dashboard-shell overflow-x-hidden">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8 premium-surface max-w-6xl mx-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-3 sm:gap-4 items-center">
              <div>
                <p className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Student Dashboard
                </p>
                <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  Welcome back,
                  <span className="block mt-0.5 text-slate-700">
                    {user?.name}
                  </span>
                </h1>
                <p className="text-slate-600 mt-2 max-w-xl">
                  Ready for another focused session? Keep your streak strong and
                  sharpen your accuracy today.
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl">
                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                    <div className="absolute left-0 top-0 h-1 w-full bg-linear-to-r from-slate-900 to-slate-600"></div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                      Quiz Taken
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                        {totalQuizzesTaken}
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <FiCheckCircle className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                    <div className="absolute left-0 top-0 h-1 w-full bg-linear-to-r from-slate-900 to-slate-600"></div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                      Avg Score
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                        {averageScore}%
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <FiTrendingUp className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                    <div className="absolute left-0 top-0 h-1 w-full bg-linear-to-r from-slate-900 to-slate-600"></div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                      Best Score
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                        {bestScore}%
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <FiAward className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-center lg:justify-center">
                <div className="relative w-full max-w-75 sm:max-w-85 h-55 sm:h-65 lg:h-75 rounded-xl overflow-hidden bg-transparent">
                  <iframe
                    src="https://lottie.host/embed/d784e297-43b2-47ff-8ad6-5182c4397689/ukvFIQWKOA.lottie"
                    title="Student dashboard animation"
                    className="w-full h-full"
                    loading="lazy"
                    allow="autoplay"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 premium-surface p-1.5">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("available")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all text-sm ${
                    activeTab === "available"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BsLightningFill className="w-4 h-4" />
                  Available Quizzes
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all text-sm ${
                    activeTab === "history"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FiClock className="w-4 h-4" />
                  Quiz History
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingAnimation message="Loading quizzes" />
              </div>
            ) : (
              <>
                {activeTab === "available" && (
                  <>
                    <div className="mb-4 sm:mb-5 premium-surface p-3.5 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div>
                          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <FiFilter className="w-3.5 h-3.5" />
                            Filter Quizzes
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Showing:{" "}
                            <span className="font-semibold text-slate-800">
                              {formatFilterLabel(selectedFilter)}
                            </span>
                          </p>
                        </div>

                        {selectedFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => setSelectedFilter("all")}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FiX className="w-3.5 h-3.5" />
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="mt-3 overflow-x-auto pb-1">
                        <div className="flex gap-2 min-w-max pr-1">
                          {FILTER_PRIORITY.map((filterTag) => {
                            const isActive = selectedFilter === filterTag;
                            return (
                              <button
                                key={filterTag}
                                type="button"
                                onClick={() => setSelectedFilter(filterTag)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                  isActive
                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                                }`}
                              >
                                {formatFilterLabel(filterTag)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {quizzes.length === 0 ? (
                        <div className="col-span-full text-center py-16 premium-surface">
                          <p className="text-slate-500 text-base font-medium">
                            No quizzes found for this filter
                          </p>
                          <p className="text-slate-400 text-sm mt-2">
                            Try another category or check back later.
                          </p>
                        </div>
                      ) : (
                        quizzes.map((quiz) => (
                          <QuizCard
                            key={quiz._id}
                            quiz={quiz}
                            onClick={() => navigate(`/quiz/${quiz._id}`)}
                            hasProgress={quizzesWithProgress.has(quiz._id)}
                          />
                        ))
                      )}
                    </div>

                    {quizzes.length > 0 && hasMoreQuizzes && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={handleShowMore}
                          disabled={loadingMore}
                          className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-60 shadow-sm"
                        >
                          {loadingMore ? "Loading..." : "Show More"}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "history" && (
                  <>
                    {history.length === 0 ? (
                      <div className="premium-surface text-center py-16">
                        <p className="text-slate-500 text-base font-medium">
                          No quiz attempts yet
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                          Start your first quiz to begin tracking your progress!
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block premium-surface overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">
                                    Quiz
                                  </th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">
                                    Score
                                  </th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">
                                    Percentage
                                  </th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">
                                    Date
                                  </th>
                                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {history.map((result) => (
                                  <tr
                                    key={result._id}
                                    className="hover:bg-slate-50 transition-colors"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-semibold text-slate-900">
                                        {result.quizId?.title}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-bold text-slate-900">
                                        {result.score}/{result.totalQuestions}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          result.percentage >= 70
                                            ? "bg-emerald-100 text-emerald-800"
                                            : result.percentage >= 50
                                              ? "bg-amber-100 text-amber-800"
                                              : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {result.percentage}%
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                      {new Date(
                                        result.submittedAt,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() =>
                                            navigate(`/result/${result._id}`)
                                          }
                                          className="text-slate-900 hover:text-slate-700 font-semibold text-sm"
                                        >
                                          View Details →
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteResult(result._id)
                                          }
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                                          title="Delete result"
                                        >
                                          <FiTrash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                          {history.map((result) => (
                            <div
                              key={result._id}
                              className="premium-surface p-4"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-sm font-bold text-slate-900 flex-1 pr-2">
                                  {result.quizId?.title}
                                </h3>
                                <span
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                                    result.percentage >= 70
                                      ? "bg-emerald-100 text-emerald-800"
                                      : result.percentage >= 50
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {result.percentage}%
                                </span>
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Score:</span>
                                  <span className="font-bold text-slate-900">
                                    {result.score}/{result.totalQuestions}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Date:</span>
                                  <span className="font-medium text-slate-900">
                                    {new Date(
                                      result.submittedAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    navigate(`/result/${result._id}`)
                                  }
                                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 font-semibold text-sm transition-all"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleDeleteResult(result._id)}
                                  className="bg-red-600 text-white p-2.5 rounded-lg hover:bg-red-700 transition-all"
                                  title="Delete result"
                                >
                                  <FiTrash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;

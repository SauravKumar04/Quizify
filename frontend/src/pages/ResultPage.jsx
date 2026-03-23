import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import LoadingAnimation from '../components/LoadingAnimation';
import { userQuizAPI } from '../services/api';
import { getRichTextPreview, hasRichTextContent, sanitizeRichTextHtml } from '../utils/richText';
import { FiCheckCircle, FiChevronDown, FiChevronUp, FiClock, FiMinusCircle, FiTrendingDown, FiTrendingUp, FiXCircle } from 'react-icons/fi';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CircularScore = ({ percentage, size = 96, stroke = 8, label, centerTop, centerBottom }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const dash = (safePercentage / 100) * circumference;
  const primaryText = centerTop || `${safePercentage}%`;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#0f172a"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
          <p className="text-base sm:text-lg font-bold text-slate-900">{primaryText}</p>
          {centerBottom && <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">{centerBottom}</p>}
        </div>
      </div>
      {label && <p className="mt-1 text-xs text-slate-500 font-medium">{label}</p>}
    </div>
  );
};

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  if (safeSeconds < 60) return `${safeSeconds} sec`;

  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  if (secs === 0) return `${mins} min`;

  return `${mins} min ${secs} sec`;
};

const filterAnswersByType = (answers = [], filter = 'all') => {
  if (filter === 'correct') return answers.filter((answer) => answer.isCorrect);
  if (filter === 'wrong') return answers.filter((answer) => !answer.isCorrect && answer.selectedOption !== -1);
  if (filter === 'skipped') return answers.filter((answer) => answer.selectedOption === -1);
  return answers;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const PerformanceTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const statusIcon = point.isSkipped
    ? <FiMinusCircle className="w-3.5 h-3.5 text-slate-600" />
    : point.isCorrect
    ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
    : <FiXCircle className="w-3.5 h-3.5 text-rose-600" />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 shadow-lg px-3.5 py-3 min-w-56 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-900">{point.questionLabel}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{point.sectionTitle}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          {statusIcon}
          {point.statusLabel}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
        <p className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1"><FiClock className="w-3.5 h-3.5 text-slate-500" />Time Spent</span>
          <span className="font-semibold">{formatDuration(point.timeSpent)}</span>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span>Expected</span>
          <span className="font-semibold">{point.expectedTime > 0 ? formatDuration(point.expectedTime) : 'N/A'}</span>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span>Performance</span>
          <span className="font-semibold text-slate-900">{point.performanceScore}</span>
        </p>
        <p className="flex items-center justify-between gap-3 border-t border-slate-100 pt-1.5">
          <span className="inline-flex items-center gap-1">{point.delta >= 0 ? <FiTrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <FiTrendingDown className="w-3.5 h-3.5 text-rose-600" />}Impact</span>
          <span className={`font-semibold ${point.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{point.delta >= 0 ? '+' : ''}{point.delta}</span>
        </p>
      </div>
    </div>
  );
};

const SectionSplitTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 shadow-lg px-3.5 py-3 min-w-52 backdrop-blur-sm">
      <p className="text-xs font-semibold text-slate-900">{point.name}</p>
      <div className="mt-2 space-y-1.5 text-xs text-slate-700">
        <p className="flex items-center justify-between gap-2">
          <span>Score</span>
          <span className="font-semibold">{point.score}/{point.totalQuestions}</span>
        </p>
        <p className="flex items-center justify-between gap-2">
          <span>Share of Total</span>
          <span className="font-semibold">{point.share}%</span>
        </p>
      </div>
    </div>
  );
};

const ResultPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [sectionFilters, setSectionFilters] = useState({});
  const [expandedReportItems, setExpandedReportItems] = useState(new Set());
  const [expandedSectionReports, setExpandedSectionReports] = useState(new Set());

  const celebrationPlayedRef = useRef(false);
  const shouldCelebrate = useMemo(() => {
    if (location.state?.celebrate) return true;

    try {
      const storedResultId = sessionStorage.getItem('quizify_result_celebrate');
      return Boolean(storedResultId && storedResultId === resultId);
    } catch (error) {
      return false;
    }
  }, [location.state, resultId]);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await userQuizAPI.getResultDetails(resultId);
        setResult(response.data.result);
      } catch (error) {
        navigate('/user/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId, navigate]);

  useEffect(() => {
    if (loading || !result || celebrationPlayedRef.current || !shouldCelebrate) return;

    celebrationPlayedRef.current = true;
    try {
      sessionStorage.removeItem('quizify_result_celebrate');
    } catch (error) {
      // Ignore storage access issues.
    }
    let interval;

    // Side-origin confetti for a cleaner directional celebration effect.
    import('canvas-confetti').then(({ default: confetti }) => {
      const duration = 1800;
      const animationEnd = Date.now() + duration;
      const colors = ['#22c55e', '#38bdf8', '#f59e0b', '#f43f5e', '#8b5cf6', '#0f172a'];

      const fireLeft = (particleRatio, opts = {}) => {
        confetti({
          ...opts,
          angle: 58,
          spread: 58,
          startVelocity: 50,
          origin: { x: 0.02, y: 0.72 },
          colors,
          particleCount: Math.floor(170 * particleRatio),
        });
      };

      const fireRight = (particleRatio, opts = {}) => {
        confetti({
          ...opts,
          angle: 122,
          spread: 58,
          startVelocity: 50,
          origin: { x: 0.98, y: 0.72 },
          colors,
          particleCount: Math.floor(170 * particleRatio),
        });
      };

      fireLeft(0.28, { scalar: 1.0 });
      fireRight(0.28, { scalar: 1.0 });
      fireLeft(0.18, { scalar: 0.85, decay: 0.92 });
      fireRight(0.18, { scalar: 0.85, decay: 0.92 });

      interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          window.clearInterval(interval);
          return;
        }

        fireLeft(0.07, {
          startVelocity: 24,
          spread: 62,
          ticks: 150,
          scalar: 0.78,
        });
        fireRight(0.07, {
          startVelocity: 24,
          spread: 62,
          ticks: 150,
          scalar: 0.78,
        });
      }, 220);
    }).catch(() => {
      // Non-blocking fallback for confetti loading failures.
    });

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [loading, result, shouldCelebrate]);

  const sectionResults = result?.sectionResults || [];

  const sectionMetaMap = useMemo(() => {
    const map = new Map();

    sectionResults.forEach((section) => {
      const expected = section.totalQuestions > 0
        ? Math.round(((section.timeLimit || 0) * 60) / section.totalQuestions)
        : 0;

      map.set(section.sectionIndex, {
        ...section,
        expectedPerQuestion: expected > 0
          ? expected
          : (section.totalQuestions > 0 ? Math.round((section.timeTaken || 0) / section.totalQuestions) : 0),
      });
    });

    return map;
  }, [sectionResults]);

  const sectionStatsMap = useMemo(() => {
    const statsMap = new Map();

    (result?.detailedAnswers || []).forEach((answer) => {
      const current = statsMap.get(answer.sectionIndex) || { correct: 0, wrong: 0, skipped: 0 };

      if (answer.selectedOption === -1) {
        current.skipped += 1;
      } else if (answer.isCorrect) {
        current.correct += 1;
      } else {
        current.wrong += 1;
      }

      statsMap.set(answer.sectionIndex, current);
    });

    return statsMap;
  }, [result]);

  const sectionScoreSplitData = useMemo(() => {
    if (!sectionResults.length) return [];

    const totalScore = Math.max(1, sectionResults.reduce((sum, section) => sum + (section.score || 0), 0));
    const chartPalette = ['#1d4ed8', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#475569'];

    return sectionResults.map((section, index) => {
      const score = section.score || 0;
      const share = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;

      return {
        sectionIndex: section.sectionIndex,
        name: section.sectionTitle || `Section ${section.sectionIndex + 1}`,
        value: score,
        score,
        totalQuestions: section.totalQuestions || 0,
        share,
        color: chartPalette[index % chartPalette.length],
      };
    });
  }, [sectionResults]);

  const sectionColorMap = useMemo(() => {
    const map = new Map();
    sectionScoreSplitData.forEach((item) => {
      map.set(item.sectionIndex, item.color);
    });
    return map;
  }, [sectionScoreSplitData]);

  const topScoringSection = useMemo(() => {
    if (!sectionScoreSplitData.length) return null;
    return sectionScoreSplitData.slice().sort((a, b) => b.score - a.score)[0] || null;
  }, [sectionScoreSplitData]);

  const topSummaryMessage = useMemo(() => {
    const percentage = Math.round(result?.percentage || 0);

    if (percentage >= 85) {
      return {
        title: 'Excellent Performance',
        description: 'Outstanding consistency across sections. Keep this momentum and revise lightly to stay sharp.',
      };
    }

    if (percentage >= 60) {
      return {
        title: 'Well Done',
        description: 'Strong attempt overall with good fundamentals. A focused review can lift your next score significantly.',
      };
    }

    return {
      title: 'Needs Improvement',
      description: 'You are building momentum. Focus on weak sections and pacing to convert more questions next attempt.',
    };
  }, [result]);

  const filteredAnswers = useMemo(() => {
    if (!result) return [];
    const answers = result.detailedAnswers || [];

    if (activeSection === 'all') return answers;

    return answers.filter((answer) => answer.sectionIndex === Number(activeSection));
  }, [result, activeSection]);

  const groupedAnswers = useMemo(() => {
    if (!filteredAnswers.length) return [];

    const groupedMap = new Map();

    filteredAnswers.forEach((answer) => {
      if (!groupedMap.has(answer.sectionIndex)) {
        groupedMap.set(answer.sectionIndex, {
          sectionIndex: answer.sectionIndex,
          sectionTitle: answer.sectionTitle || `Section ${answer.sectionIndex + 1}`,
          answers: [],
        });
      }

      groupedMap.get(answer.sectionIndex).answers.push(answer);
    });

    return Array.from(groupedMap.values()).sort((a, b) => a.sectionIndex - b.sectionIndex);
  }, [filteredAnswers]);

  const performanceChartData = useMemo(() => {
    const sourceAnswers = filteredAnswers || [];
    if (sourceAnswers.length === 0) return [];

    const sectionQuestionCounter = new Map();
    let runningPerformance = 50;

    return sourceAnswers.map((answer, index) => {
      const currentCount = sectionQuestionCounter.get(answer.sectionIndex) || 0;
      const questionInSection = currentCount + 1;
      sectionQuestionCounter.set(answer.sectionIndex, questionInSection);

      const sectionMeta = sectionMetaMap.get(answer.sectionIndex);
      const expectedTime = Math.max(0, sectionMeta?.expectedPerQuestion || 0);
      const timeSpent = Math.max(0, answer.timeSpent || 0);
      const isSkipped = answer.selectedOption === -1;
      const isWrong = !answer.isCorrect && !isSkipped;
      const isSlow = expectedTime > 0 && timeSpent > expectedTime;

      let delta = 0;
      if (isSkipped) {
        delta = -8;
      } else if (answer.isCorrect) {
        delta = isSlow ? 2 : 6;
      } else {
        delta = isSlow ? -9 : -6;
      }

      runningPerformance = clamp(runningPerformance + delta, 0, 100);

      const statusLabel = isSkipped ? 'Skipped' : answer.isCorrect ? (isSlow ? 'Correct but slow' : 'Correct on pace') : (isSlow ? 'Wrong and slow' : 'Wrong');
      const statusTone = isSkipped
        ? 'text-slate-700'
        : answer.isCorrect
        ? (isSlow ? 'text-amber-700' : 'text-emerald-700')
        : 'text-rose-700';

      const dotColor = isSkipped
        ? '#94a3b8'
        : answer.isCorrect
        ? '#22c55e'
        : '#ef4444';

      const barColor = isSkipped
        ? '#cbd5e1'
        : answer.isCorrect
        ? (isSlow ? '#f59e0b' : '#22c55e')
        : '#f43f5e';

      return {
        xIndex: index + 1,
        questionLabel: `Q${index + 1} (S${answer.sectionIndex + 1} - Q${questionInSection})`,
        sectionTitle: answer.sectionTitle || `Section ${answer.sectionIndex + 1}`,
        timeSpent,
        expectedTime,
        performanceScore: runningPerformance,
        delta,
        statusLabel,
        statusTone,
        isCorrect: answer.isCorrect,
        isSkipped,
        dotColor,
        barColor,
      };
    });
  }, [filteredAnswers, sectionMetaMap]);

  const performanceInsights = useMemo(() => {
    if (performanceChartData.length === 0) {
      return { onPace: 0, slow: 0, improved: 0, dropped: 0 };
    }

    let onPace = 0;
    let slow = 0;
    let improved = 0;
    let dropped = 0;

    performanceChartData.forEach((point) => {
      if (point.expectedTime > 0 && point.timeSpent <= point.expectedTime) {
        onPace += 1;
      }
      if (point.expectedTime > 0 && point.timeSpent > point.expectedTime) {
        slow += 1;
      }
      if (point.delta > 0) improved += 1;
      if (point.delta < 0) dropped += 1;
    });

    return { onPace, slow, improved, dropped };
  }, [performanceChartData]);

  const sectionReportCards = useMemo(() => {
    if (!result) return [];

    const detailedAnswers = result.detailedAnswers || [];

    return sectionResults.map((section) => {
      const sectionAnswers = detailedAnswers.filter((answer) => answer.sectionIndex === section.sectionIndex);
      const expectedPerQuestion = sectionMetaMap.get(section.sectionIndex)?.expectedPerQuestion || 0;

      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      let slowCount = 0;

      const improvementQuestions = [];

      sectionAnswers.forEach((answer, index) => {
        const timeSpent = answer.timeSpent || 0;
        const isSkipped = answer.selectedOption === -1;
        const isWrong = !answer.isCorrect && !isSkipped;
        const isSlow = expectedPerQuestion > 0 && timeSpent > expectedPerQuestion;

        if (answer.isCorrect) {
          correctCount += 1;
        }

        if (isWrong) {
          wrongCount += 1;
        }

        if (isSkipped) {
          skippedCount += 1;
        }

        if (isSlow) {
          slowCount += 1;
        }

        if (isSkipped || isWrong || isSlow) {
          const reasons = [];
          if (isSkipped) reasons.push('Skipped');
          if (isWrong) reasons.push('Incorrect');
          if (isSlow) reasons.push(`Slow (${formatDuration(timeSpent)} vs ${formatDuration(expectedPerQuestion)})`);

          improvementQuestions.push({
            questionNumber: index + 1,
            preview: getRichTextPreview(answer.questionText, 110),
            reasons,
            explanation: answer.explanation,
            explanationImage: answer.explanationImage,
          });
        }
      });

      const sectionAccuracy = section.totalQuestions > 0
        ? Math.round((section.score / section.totalQuestions) * 100)
        : 0;

      const goodThings = [];
      if (sectionAccuracy >= 80) {
        goodThings.push(`Strong accuracy (${sectionAccuracy}%)`);
      }
      if (skippedCount === 0) {
        goodThings.push('No skipped questions');
      }
      if (expectedPerQuestion > 0 && slowCount === 0 && sectionAnswers.length > 0) {
        goodThings.push('Time pace stayed within expected range');
      }
      if (wrongCount <= 1) {
        goodThings.push('Concept retention looks stable in this section');
      }
      if (goodThings.length === 0) {
        goodThings.push('Attempt was completed with consistent effort');
      }

      const improvementNeeds = [];
      if (wrongCount > 0) {
        improvementNeeds.push(`Revisit ${wrongCount} incorrect ${wrongCount === 1 ? 'question' : 'questions'}`);
      }
      if (skippedCount > 0) {
        improvementNeeds.push(`Practice speed/clarity for ${skippedCount} skipped ${skippedCount === 1 ? 'question' : 'questions'}`);
      }
      if (slowCount > 0) {
        improvementNeeds.push(`Improve pace on ${slowCount} ${slowCount === 1 ? 'question' : 'questions'}`);
      }
      if (improvementNeeds.length === 0) {
        improvementNeeds.push('Keep this section performance steady with quick revision');
      }

      return {
        sectionIndex: section.sectionIndex,
        sectionTitle: section.sectionTitle,
        goodThings,
        improvementNeeds,
        improvementQuestions: improvementQuestions.slice(0, 5),
        totalImprovementQuestions: improvementQuestions.length,
        stats: {
          correctCount,
          wrongCount,
          skippedCount,
        },
      };
    });
  }, [result, sectionResults, sectionMetaMap]);

  const expandAll = () => {
    const expanded = new Set(
      groupedAnswers.flatMap((group, index) =>
        filterAnswersByType(group.answers, sectionFilters[group.sectionIndex] || 'all')
          .map((answer, answerIndex) => `${group.sectionIndex}-${index}-${answer.questionId || answer._id || answerIndex}`)
      )
    );
    setExpandedQuestions(expanded);
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  const toggleExpanded = (key) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleReportItem = (key) => {
    setExpandedReportItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSectionReport = (sectionIndex) => {
    setExpandedSectionReports((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) {
        next.delete(sectionIndex);
      } else {
        next.add(sectionIndex);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="py-20 flex items-center justify-center">
          <LoadingAnimation message="Loading result" />
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-linear-to-b from-white to-slate-50/60 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quiz Testing Summary</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1.5 wrap-break-word">{result.quizId?.title}</h1>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
                    <FiCheckCircle className="w-3.5 h-3.5 text-slate-700" />
                    Total Score
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{result.score}/{result.totalQuestions}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-slate-700" />
                    Time Taken
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatDuration(result.totalTimeTaken || 0)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
                    <FiTrendingUp className="w-3.5 h-3.5 text-slate-700" />
                    Percentage
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{Math.round(result.percentage || 0)}%</p>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 rounded-xl border border-slate-200 border-l-4 border-l-slate-800 bg-slate-100/80 px-4 py-3.5 sm:px-5 sm:py-4">
                <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">{topSummaryMessage.title}</p>
                <p className="text-sm sm:text-[15px] leading-relaxed mt-1.5 text-slate-700">
                  {topSummaryMessage.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2.5">Section Marks Split</p>

              {sectionScoreSplitData.length > 0 ? (
                <>
                  <div className="h-56 w-full [&_.recharts-wrapper:focus]:outline-none [&_.recharts-sector:focus]:outline-none [&_.recharts-surface:focus]:outline-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart accessibilityLayer={false}>
                        <Pie
                          data={sectionScoreSplitData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={86}
                          paddingAngle={3}
                          rootTabIndex={-1}
                          isAnimationActive
                          animationDuration={900}
                        >
                          {sectionScoreSplitData.map((entry) => (
                            <Cell key={`top-split-${entry.name}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-xl font-bold">
                          {Math.round(result.percentage || 0)}%
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                          Overall
                        </text>
                        <Tooltip content={<SectionSplitTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5">
                    {sectionScoreSplitData.map((item) => (
                      <div key={`legend-${item.name}`} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {topScoringSection && (
                    <div className="mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Highest Scoring Section</p>
                      <p className="text-xs font-semibold text-slate-900 mt-0.5">
                        {topScoringSection.name} ({topScoringSection.score}/{topScoringSection.totalQuestions})
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-40 rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
                  Section split data is not available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200"></div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Section Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sectionResults.map((section) => {
              const sectionPercentage = section.totalQuestions > 0
                ? (section.score / section.totalQuestions) * 100
                : 0;

              const stats = sectionStatsMap.get(section.sectionIndex) || { correct: 0, wrong: 0, skipped: 0 };
              const sectionColor = sectionColorMap.get(section.sectionIndex) || '#334155';

              return (
                <div
                  key={section.sectionIndex}
                  className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm"
                  style={{ borderTopWidth: 4, borderTopColor: sectionColor }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sectionColor }}></span>
                        {section.sectionTitle}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-600">
                          Section Time: <span className="font-semibold text-slate-800">{section.timeLimit || 0} min</span>
                        </p>
                        <p className="text-xs text-slate-600">
                          Time Taken: <span className="font-semibold text-slate-800">{formatDuration(section.timeTaken || 0)}</span>
                        </p>
                      </div>
                    </div>
                    <CircularScore
                      percentage={sectionPercentage}
                      size={88}
                      stroke={7}
                      centerTop={`${section.score}/${section.totalQuestions}`}
                      centerBottom="Score"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 py-2">
                      <p className="text-xs text-slate-500">Correct</p>
                      <p className="text-sm font-bold text-slate-900">{stats.correct}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 py-2">
                      <p className="text-xs text-slate-500">Wrong</p>
                      <p className="text-sm font-bold text-slate-900">{stats.wrong}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 py-2">
                      <p className="text-xs text-slate-500">Skipped</p>
                      <p className="text-sm font-bold text-slate-900">{stats.skipped}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold ${
                    activeSection === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  All Sections
                </button>
                {sectionResults.map((section) => (
                  <button
                    key={section.sectionIndex}
                    type="button"
                    onClick={() => setActiveSection(section.sectionIndex)}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold ${
                      activeSection === section.sectionIndex ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {section.sectionTitle}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50/50">
            {groupedAnswers.map((group, groupIndex) => (
              <div key={group.sectionIndex} className="space-y-2.5">
                <div className="px-1">
                  {(() => {
                    const correctCount = group.answers.filter((a) => a.isCorrect).length;
                    const wrongCount = group.answers.filter((a) => !a.isCorrect && a.selectedOption !== -1).length;
                    const skippedCount = group.answers.filter((a) => a.selectedOption === -1).length;
                    const groupFilter = sectionFilters[group.sectionIndex] || 'all';

                    return (
                      <>
                  <h3 className="text-sm font-bold text-slate-900">{group.sectionTitle}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSectionFilters((prev) => ({ ...prev, [group.sectionIndex]: 'all' }))}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                        groupFilter === 'all' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      All {group.answers.length}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionFilters((prev) => ({ ...prev, [group.sectionIndex]: 'correct' }))}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                        groupFilter === 'correct'
                          ? 'border border-emerald-300 bg-emerald-100 text-emerald-800'
                          : 'border border-slate-300 bg-slate-100 text-slate-700'
                      }`}
                    >
                      Correct {correctCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionFilters((prev) => ({ ...prev, [group.sectionIndex]: 'wrong' }))}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                        groupFilter === 'wrong'
                          ? 'border border-rose-300 bg-rose-100 text-rose-800'
                          : 'border border-slate-300 bg-slate-100 text-slate-700'
                      }`}
                    >
                      Wrong {wrongCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionFilters((prev) => ({ ...prev, [group.sectionIndex]: 'skipped' }))}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                        groupFilter === 'skipped'
                          ? 'border border-slate-400 bg-slate-200 text-slate-800'
                          : 'border border-slate-300 bg-slate-100 text-slate-700'
                      }`}
                    >
                      Skipped {skippedCount}
                    </button>
                  </div>
                      </>
                    );
                  })()}
                </div>

                {filterAnswersByType(group.answers, sectionFilters[group.sectionIndex] || 'all').length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
                    No questions found for this filter.
                  </div>
                )}

                {filterAnswersByType(group.answers, sectionFilters[group.sectionIndex] || 'all').map((answer, index) => {
                  const answerId = answer.questionId || answer._id || index;
                  const sectionQuestionIndex = group.answers.findIndex((item, itemIndex) => {
                    const itemId = item.questionId || item._id || itemIndex;
                    return itemId === answerId;
                  });
                  const sectionQuestionNumber = sectionQuestionIndex >= 0 ? sectionQuestionIndex + 1 : index + 1;
                  const answerKey = answer.questionId || answer._id || index;
                  const key = `${group.sectionIndex}-${groupIndex}-${answerKey}`;
                  const expanded = expandedQuestions.has(key);
                  const sectionMeta = sectionMetaMap.get(answer.sectionIndex);
                  const expected = sectionMeta?.expectedPerQuestion || 0;
                  const timeSpent = answer.timeSpent || 0;
                  const paceLabel = expected > 0 && timeSpent > 0
                    ? (timeSpent > expected ? 'Slower than expected' : timeSpent < expected ? 'Faster than expected' : 'On expected pace')
                    : 'Not visited';
                  const paceTone = expected > 0 && timeSpent > 0
                    ? (timeSpent > expected ? 'text-amber-700' : timeSpent < expected ? 'text-emerald-700' : 'text-slate-700')
                    : 'text-slate-500';
                  const paceIconTone = expected > 0 && timeSpent > 0
                    ? (timeSpent > expected ? 'text-amber-600' : timeSpent < expected ? 'text-emerald-600' : 'text-slate-500')
                    : 'text-slate-400';

                  const isUnattempted = answer.selectedOption === -1;

                  return (
                    <div key={key} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(key)}
                        className="w-full px-4 sm:px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50 text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          answer.isCorrect
                            ? 'bg-emerald-100 text-emerald-700'
                            : isUnattempted
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {answer.isCorrect ? <FiCheckCircle className="w-4 h-4" /> : isUnattempted ? <FiMinusCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-slate-500 mb-0.5">Q{sectionQuestionNumber}</p>
                          <p className="text-sm text-slate-800 truncate">{getRichTextPreview(answer.questionText, 140)}</p>
                        </div>

                        <div className="hidden sm:flex flex-col text-right shrink-0">
                          <span className={`text-xs inline-flex items-center justify-end gap-1 font-semibold ${paceIconTone}`}>
                            <FiClock className="w-3.5 h-3.5" />
                            {formatDuration(timeSpent)}
                          </span>
                        </div>

                        {expanded ? <FiChevronUp className="w-4 h-4 text-slate-400" /> : <FiChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {expanded && (
                        <div className="px-4 sm:px-6 pb-4 bg-slate-50/70">
                          <div className="sm:pl-11">
                            <div
                              className="rich-text-content rich-text-read text-base sm:text-lg font-semibold text-slate-900 mb-3 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(answer.questionText) }}
                            ></div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">Question {sectionQuestionNumber} in {group.sectionTitle}</p>

                            {answer.questionImage && (
                              <img src={answer.questionImage} alt="Question" className="max-w-full max-h-64 object-contain rounded-lg border border-slate-200 mb-3" />
                            )}

                            <div className="space-y-1.5 mb-3">
                              {answer.options.map((option, optionIndex) => {
                                const isCorrect = optionIndex === answer.correctOption;
                                const isSelected = optionIndex === answer.selectedOption;

                                return (
                                  <div
                                    key={optionIndex}
                                    className={`px-3 py-2 rounded-md border text-sm ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : isSelected
                                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span className="font-semibold mr-1.5">{String.fromCharCode(65 + optionIndex)}.</span>
                                    {option}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mb-3 p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                              <p className="text-xs text-slate-600 flex items-center gap-1.5"><FiClock className="w-3.5 h-3.5" />Time spent: {formatDuration(timeSpent)} • Expected: {formatDuration(expected)}</p>
                              <p className={`text-xs font-semibold ${paceTone}`}>{paceLabel}</p>
                            </div>

                            {(hasRichTextContent(answer.explanation) || answer.explanationImage) && (
                              <div className="p-3 rounded-lg border border-sky-200 bg-sky-50/40">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Explanation</p>
                                {hasRichTextContent(answer.explanation) && (
                                  <div
                                    className="rich-text-content rich-text-read text-sm text-slate-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(answer.explanation) }}
                                  ></div>
                                )}
                                {answer.explanationImage && (
                                  <img
                                    src={answer.explanationImage}
                                    alt="Explanation"
                                    className={`max-w-full max-h-64 object-contain rounded-lg border border-slate-200 ${hasRichTextContent(answer.explanation) ? 'mt-3' : ''}`}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Performance vs Time Trend</h2>
              <p className="text-sm text-slate-600 mt-1">
                Trend drops when answers are incorrect, skipped, or slower than expected section pace.
              </p>
            </div>
            <div className="text-xs text-slate-500 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              Baseline starts at 50 and dynamically adjusts per question.
            </div>
          </div>

          {performanceChartData.length > 0 ? (
            <>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                    <FiCheckCircle className="w-3.5 h-3.5" /> On Pace
                  </p>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{performanceInsights.onPace}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-amber-700 font-semibold inline-flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5" /> Slow Pace
                  </p>
                  <p className="text-sm font-bold text-amber-800 mt-0.5">{performanceInsights.slow}</p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-sky-700 font-semibold inline-flex items-center gap-1.5">
                    <FiTrendingUp className="w-3.5 h-3.5" /> Up Moves
                  </p>
                  <p className="text-sm font-bold text-sky-800 mt-0.5">{performanceInsights.improved}</p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-rose-700 font-semibold inline-flex items-center gap-1.5">
                    <FiTrendingDown className="w-3.5 h-3.5" /> Down Moves
                  </p>
                  <p className="text-sm font-bold text-rose-800 mt-0.5">{performanceInsights.dropped}</p>
                </div>
              </div>

              <div className="mt-4 h-80 w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2 sm:p-3 [&_.recharts-wrapper:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-surface:focus]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceChartData} margin={{ top: 10, right: 14, left: 0, bottom: 0 }} accessibilityLayer={false}>
                    <defs>
                      <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f172a" stopOpacity={0.26} />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="xIndex" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                    <YAxis
                      yAxisId="perf"
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      width={36}
                    />
                    <YAxis
                      yAxisId="time"
                      orientation="right"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      width={40}
                    />
                    <Tooltip content={<PerformanceTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine yAxisId="perf" y={50} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Bar yAxisId="time" dataKey="timeSpent" name="Time Spent (sec)" barSize={13} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={750}>
                      {performanceChartData.map((entry, index) => (
                        <Cell key={`${entry.xIndex}-bar-${index}`} fill={entry.barColor} />
                      ))}
                    </Bar>
                    <Area
                      yAxisId="perf"
                      type="monotone"
                      dataKey="performanceScore"
                      name="Performance Area"
                      stroke="none"
                      fill="url(#performanceFill)"
                      isAnimationActive
                      animationDuration={900}
                    />
                    <Line
                      yAxisId="perf"
                      type="monotone"
                      dataKey="performanceScore"
                      name="Performance Score"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      isAnimationActive
                      animationDuration={950}
                      dot={({ cx, cy, payload }) => (
                        <circle cx={cx} cy={cy} r={4} stroke="#ffffff" strokeWidth={1.5} fill={payload?.dotColor || '#0f172a'} />
                      )}
                      activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1.5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              No question data available to plot performance trend yet.
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Section Report Card</h2>
          <p className="text-sm text-slate-600 mt-1">Strengths, focus areas, and question-level improvements for each section.</p>

          <div className="mt-4 space-y-3">
            {sectionReportCards.map((card) => (
              <div key={card.sectionIndex} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSectionReport(card.sectionIndex)}
                  className="w-full p-4 flex items-center justify-between gap-2 text-left hover:bg-slate-50"
                >
                  <h3 className="text-sm font-bold text-slate-900">{card.sectionTitle}</h3>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-semibold">C {card.stats.correctCount}</span>
                      <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-semibold">W {card.stats.wrongCount}</span>
                      <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-semibold">S {card.stats.skippedCount}</span>
                    </div>
                    {expandedSectionReports.has(card.sectionIndex) ? (
                      <FiChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <FiChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedSectionReports.has(card.sectionIndex) && (
                  <div className="px-4 pt-3 pb-4 space-y-3 border-t border-slate-200 bg-white">
                    <div className="flex sm:hidden items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-semibold">C {card.stats.correctCount}</span>
                      <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-semibold">W {card.stats.wrongCount}</span>
                      <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-semibold">S {card.stats.skippedCount}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Good Things</p>
                        <div className="mt-1.5 space-y-1.5">
                          {card.goodThings.map((point, idx) => (
                            <p key={idx} className="text-xs text-emerald-900">• {point}</p>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Improvement Needed</p>
                        <div className="mt-1.5 space-y-1.5">
                          {card.improvementNeeds.map((point, idx) => (
                            <p key={idx} className="text-xs text-amber-900">• {point}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Questions To Improve</p>
                      {card.improvementQuestions.length === 0 ? (
                        <p className="text-xs text-slate-600 mt-1.5">No immediate question-level issues found in this section.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {card.improvementQuestions.map((item, idx) => (
                            <div key={idx} className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                              <p className="text-xs font-semibold text-slate-700">Q{item.questionNumber} • {item.reasons.join(' • ')}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{item.preview}</p>

                              {(hasRichTextContent(item.explanation) || item.explanationImage) && (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportItem(`${card.sectionIndex}-${item.questionNumber}-${idx}`)}
                                    className="px-2 py-1 rounded-md border border-slate-300 bg-slate-50 text-[11px] font-semibold text-slate-700"
                                  >
                                    {expandedReportItems.has(`${card.sectionIndex}-${item.questionNumber}-${idx}`) ? 'Hide Explanation' : 'Show Explanation'}
                                  </button>

                                  {expandedReportItems.has(`${card.sectionIndex}-${item.questionNumber}-${idx}`) && (
                                    <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-sky-200 bg-sky-50/40 p-2.5">
                                      {hasRichTextContent(item.explanation) && (
                                        <div
                                          className="rich-text-content rich-text-read text-xs text-slate-700 leading-relaxed"
                                          dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(item.explanation) }}
                                        ></div>
                                      )}

                                      {item.explanationImage && (
                                        <img
                                          src={item.explanationImage}
                                          alt="Improvement explanation"
                                          className={`max-w-full max-h-52 object-contain rounded-lg border border-slate-200 ${hasRichTextContent(item.explanation) ? 'mt-2' : ''}`}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          {card.totalImprovementQuestions > card.improvementQuestions.length && (
                            <p className="text-[11px] text-slate-500">+{card.totalImprovementQuestions - card.improvementQuestions.length} more question(s) in this section.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

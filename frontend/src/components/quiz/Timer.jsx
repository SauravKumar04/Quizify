import { FiClock } from 'react-icons/fi';

const Timer = ({ secondsLeft, warningThreshold = 10 }) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft <= warningThreshold;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold ${
      isWarning ? 'text-red-700 bg-red-50 border-red-200 animate-pulse' : 'text-slate-700 bg-slate-100 border-slate-200'
    }`}>
      <FiClock className="w-4 h-4" />
      <span className="tabular-nums">{minutes}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
};

export default Timer;

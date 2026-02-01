interface WeekTimelineProps {
  currentWeek: number;
  totalWeeks: number;
  className?: string;
}

export function WeekTimeline({ currentWeek, totalWeeks, className = '' }: WeekTimelineProps) {
  const weeksRemaining = totalWeeks - currentWeek;
  const progress = (currentWeek / totalWeeks) * 100;

  // Color based on time remaining
  const getColor = () => {
    if (weeksRemaining <= 10) return 'from-red-500 to-red-600';
    if (weeksRemaining <= 20) return 'from-amber-500 to-orange-500';
    return 'from-emerald-500 to-green-600';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Month 1</span>
        <span className="text-gray-400">Month {totalWeeks}</span>
      </div>
      <div className="timeline-bar">
        <div
          className={`timeline-fill bg-gradient-to-r ${getColor()}`}
          style={{ width: `${progress}%` }}
        />
        <div
          className="timeline-marker"
          style={{ left: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {currentWeek > 0 ? `Month ${currentWeek}` : 'Start'}
        </span>
        <span className={`text-xs font-medium ${
          weeksRemaining <= 10 ? 'text-red-400' :
          weeksRemaining <= 20 ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {weeksRemaining} months left
        </span>
      </div>
    </div>
  );
}

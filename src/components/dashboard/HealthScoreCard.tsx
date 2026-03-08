interface HealthScoreCardProps {
  score: number;
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const circumference = 2 * Math.PI * 52;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  const getScoreColor = (s: number) => {
    if (s >= 75) return "hsl(152 69% 41%)";
    if (s >= 50) return "hsl(38 92% 50%)";
    return "hsl(0 72% 51%)";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <div className="metric-card flex flex-col items-center justify-center py-8 animate-slide-up">
      <p className="text-[13px] font-medium text-muted-foreground mb-5">Financial Health Score</p>
      <div className="relative">
        <svg width="130" height="130" viewBox="0 0 116 116">
          <circle
            cx="58"
            cy="58"
            r="52"
            fill="none"
            stroke="hsl(0 0% 94%)"
            strokeWidth="6"
          />
          <circle
            cx="58"
            cy="58"
            r="52"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 58 58)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xxs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color: getScoreColor(score) }}>
        {getScoreLabel(score)}
      </p>
      <p className="mt-0.5 text-xxs text-muted-foreground">Updated today</p>
    </div>
  );
}

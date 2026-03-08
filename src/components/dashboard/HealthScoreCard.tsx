interface HealthScoreCardProps {
  score: number;
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const circumference = 2 * Math.PI * 54;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  const getScoreColor = (score: number) => {
    if (score >= 75) return "hsl(160 84% 39%)";
    if (score >= 50) return "hsl(38 92% 50%)";
    return "hsl(0 84% 60%)";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <div className="metric-card flex flex-col items-center justify-center py-8 animate-slide-up">
      <p className="text-sm font-medium text-muted-foreground mb-6">Financial Health Score</p>
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold" style={{ color: getScoreColor(score) }}>
        {getScoreLabel(score)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Updated today</p>
    </div>
  );
}

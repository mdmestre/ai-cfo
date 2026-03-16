interface HealthScoreCardProps {
  score: number;
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const circumference = 2 * Math.PI * 48;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  const getScoreColor = (s: number) => {
    if (s >= 75) return "hsl(var(--success))";
    if (s >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excelente";
    if (s >= 60) return "Boa";
    if (s >= 40) return "Regular";
    return "Precisa de atencao";
  };

  return (
    <div className="metric-card flex flex-col items-center justify-center py-6 animate-slide-up">
      <p className="section-label mb-5">Saude Financeira</p>
      <div className="relative">
        <svg width="110" height="110" viewBox="0 0 108 108">
          <circle cx="54" cy="54" r="48" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
          <circle
            cx="54" cy="54" r="48" fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 54 54)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold text-foreground leading-none">{score}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">/100</span>
        </div>
      </div>
      <p className="mt-3 text-[13px] font-semibold" style={{ color: getScoreColor(score) }}>
        {getScoreLabel(score)}
      </p>
    </div>
  );
}

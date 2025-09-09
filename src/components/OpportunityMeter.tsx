import { getOpportunityLevel } from '../types/jtbd';

interface OpportunityMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function OpportunityMeter({ score, size = 'md' }: OpportunityMeterProps) {
  const level = getOpportunityLevel(score);
  const percentage = Math.min((score / 20) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-2 text-xs',
    md: 'h-3 text-sm',
    lg: 'h-4 text-base'
  };

  const getColorClass = () => {
    switch (level) {
      case 'high':
        return 'bg-opportunity-high';
      case 'medium':
        return 'bg-opportunity-medium';
      case 'low':
        return 'bg-opportunity-low';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-secondary rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-500 ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-medium ${sizeClasses[size]} min-w-12 text-right`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LittleJob } from '../types/jtbd';
import { ChevronRight, CheckSquare } from 'lucide-react';

interface LittleJobCardProps {
  littleJob: LittleJob;
  onClick: () => void;
}

export function LittleJobCard({ littleJob, onClick }: LittleJobCardProps) {
  const avgOpportunityScore = littleJob.outcomes.reduce((acc, outcome) => acc + outcome.opportunityScore, 0) / littleJob.outcomes.length;
  const highOpportunityCount = littleJob.outcomes.filter(o => o.opportunityScore >= 15).length;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-accent/30 bg-gradient-to-br from-card to-accent/5"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">{littleJob.name}</CardTitle>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription className="text-sm">{littleJob.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary">{littleJob.outcomes.length} Outcomes</Badge>
            {highOpportunityCount > 0 && (
              <Badge variant="destructive">{highOpportunityCount} High Opportunity</Badge>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Avg. Opportunity</div>
            <div className="text-lg font-bold text-accent">{avgOpportunityScore.toFixed(1)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
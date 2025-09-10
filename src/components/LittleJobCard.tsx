import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SupabaseLittleJob } from '@/types/supabase';
import { ChevronRight, CheckSquare } from 'lucide-react';

interface LittleJobCardProps {
  littleJob: SupabaseLittleJob;
  onNavigate: (littleJob: SupabaseLittleJob) => void;
}

export function LittleJobCard({ littleJob, onNavigate }: LittleJobCardProps) {
  const outcomesWithScores = littleJob.outcomes.filter(o => o.opportunityScore !== undefined);
  const avgOpportunityScore = outcomesWithScores.length > 0 
    ? outcomesWithScores.reduce((acc, outcome) => acc + (outcome.opportunityScore || 0), 0) / outcomesWithScores.length 
    : 0;
  const highOpportunityCount = littleJob.outcomes.filter(o => (o.opportunityScore || 0) >= 15).length;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-accent/30 bg-gradient-to-br from-card to-accent/5"
      onClick={() => onNavigate(littleJob)}
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
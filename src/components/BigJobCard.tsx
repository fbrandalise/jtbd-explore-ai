import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SupabaseBigJob } from '@/types/supabase';
import { ChevronRight, Target } from 'lucide-react';

interface BigJobCardProps {
  bigJob: SupabaseBigJob;
  onNavigate: (bigJob: SupabaseBigJob) => void;
}

export function BigJobCard({ bigJob, onNavigate }: BigJobCardProps) {
  const totalOutcomes = bigJob.littleJobs.reduce((acc, lj) => acc + lj.outcomes.length, 0);
  const outcomesWithScores = bigJob.littleJobs
    .flatMap(lj => lj.outcomes)
    .filter(outcome => outcome.opportunityScore !== undefined);
  const avgOpportunityScore = outcomesWithScores.length > 0 
    ? outcomesWithScores.reduce((acc, outcome) => acc + (outcome.opportunityScore || 0), 0) / outcomesWithScores.length
    : 0;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/20 bg-gradient-to-br from-card to-muted/20"
      onClick={() => onNavigate(bigJob)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{bigJob.name}</CardTitle>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription className="text-sm">{bigJob.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary">{bigJob.littleJobs.length} Little Jobs</Badge>
            <Badge variant="outline">{totalOutcomes} Outcomes</Badge>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Avg. Opportunity</div>
            <div className="text-lg font-bold text-primary">{avgOpportunityScore.toFixed(1)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
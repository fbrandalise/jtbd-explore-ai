import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SupabaseOutcome } from '@/types/supabase';
import { getOpportunityLevel } from '@/types/jtbd';
import { OpportunityMeter } from './OpportunityMeter';
import { TrendingUp, Star, Target } from 'lucide-react';

interface OutcomeTableProps {
  outcomes: SupabaseOutcome[];
  showFilters?: boolean;
}

export function OutcomeTable({ outcomes, showFilters = true }: OutcomeTableProps) {
  // Filter outcomes that have scores and sort by opportunity score
  const outcomesWithScores = outcomes.filter(outcome => 
    outcome.opportunityScore !== undefined && 
    outcome.importance !== undefined && 
    outcome.satisfaction !== undefined
  );
  
  const sortedOutcomes = [...outcomesWithScores].sort((a, b) => 
    (b.opportunityScore || 0) - (a.opportunityScore || 0)
  );

  const getOpportunityBadge = (score: number) => {
    const level = getOpportunityLevel(score);
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    const labels = {
      high: 'Alta Oportunidade',
      medium: 'Média Oportunidade',
      low: 'Baixa Oportunidade'
    };

    return (
      <Badge variant={variants[level]}>
        {labels[level]}
      </Badge>
    );
  };

  if (sortedOutcomes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Outcomes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum outcome com dados de pesquisa disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>Outcomes ({sortedOutcomes.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Outcome</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4" />
                  Importância
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Satisfação
                </div>
              </TableHead>
              <TableHead className="text-center">Opportunity Score</TableHead>
              <TableHead className="text-center">Nível</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOutcomes.map((outcome) => (
              <TableRow key={outcome.id} className="hover:bg-muted/50">
                <TableCell>
                  <div>
                    <div className="font-medium">{outcome.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {outcome.description}
                    </div>
                    {outcome.tags && outcome.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {outcome.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">
                    {outcome.importance?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">
                    {outcome.satisfaction?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <OpportunityMeter score={outcome.opportunityScore || 0} />
                </TableCell>
                <TableCell className="text-center">
                  {outcome.opportunityScore !== undefined && 
                    getOpportunityBadge(outcome.opportunityScore)
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
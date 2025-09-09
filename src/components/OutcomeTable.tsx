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
import { Outcome, getOpportunityLevel } from '../types/jtbd';
import { OpportunityMeter } from './OpportunityMeter';
import { TrendingUp, Star, Target } from 'lucide-react';

interface OutcomeTableProps {
  outcomes: Outcome[];
  title: string;
}

export function OutcomeTable({ outcomes, title }: OutcomeTableProps) {
  const sortedOutcomes = [...outcomes].sort((a, b) => b.opportunityScore - a.opportunityScore);

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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>{title}</CardTitle>
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
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{outcome.importance.toFixed(1)}</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{outcome.satisfaction.toFixed(1)}</div>
                </TableCell>
                <TableCell>
                  <OpportunityMeter score={outcome.opportunityScore} />
                </TableCell>
                <TableCell className="text-center">
                  {getOpportunityBadge(outcome.opportunityScore)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
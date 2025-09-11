import { useState, useMemo } from 'react';
import { mockResearchRounds } from '@/data/mockData';
import { ResearchRound, Outcome, BigJob, LittleJob, getOpportunityLevel } from '@/types/jtbd';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Line } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OutcomeData extends Outcome {
  bigJobName: string;
  littleJobName: string;
  bigJobId: string;
  littleJobId: string;
}

const Analysis = () => {
  const [selectedResearch, setSelectedResearch] = useState<string>(mockResearchRounds[0].id);
  const [selectedBigJob, setSelectedBigJob] = useState<string>('all');
  const [selectedLittleJob, setSelectedLittleJob] = useState<string>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'opportunity' | 'importance' | 'satisfaction'>('opportunity');
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeData | null>(null);

  const currentResearch = mockResearchRounds.find(r => r.id === selectedResearch);
  
  const allOutcomes = useMemo(() => {
    if (!currentResearch) return [];
    
    const outcomes: OutcomeData[] = [];
    currentResearch.data.bigJobs.forEach((bigJob: BigJob) => {
      bigJob.littleJobs.forEach((littleJob: LittleJob) => {
        littleJob.outcomes.forEach((outcome: Outcome) => {
          outcomes.push({
            ...outcome,
            bigJobName: bigJob.name,
            littleJobName: littleJob.name,
            bigJobId: bigJob.id,
            littleJobId: littleJob.id
          });
        });
      });
    });
    return outcomes;
  }, [currentResearch]);

  const filteredOutcomes = useMemo(() => {
    let filtered = allOutcomes;

    if (selectedBigJob !== 'all') {
      filtered = filtered.filter(o => o.bigJobId === selectedBigJob);
    }

    if (selectedLittleJob !== 'all') {
      filtered = filtered.filter(o => o.littleJobId === selectedLittleJob);
    }

    if (opportunityFilter !== 'all') {
      if (opportunityFilter === 'high') {
        filtered = filtered.filter(o => o.opportunityScore >= 15);
      } else if (opportunityFilter === 'medium') {
        filtered = filtered.filter(o => o.opportunityScore >= 10 && o.opportunityScore < 15);
      } else if (opportunityFilter === 'low') {
        filtered = filtered.filter(o => o.opportunityScore < 10);
      }
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'opportunity') return b.opportunityScore - a.opportunityScore;
      if (sortBy === 'importance') return b.importance - a.importance;
      if (sortBy === 'satisfaction') return b.satisfaction - a.satisfaction;
      return 0;
    });
  }, [allOutcomes, selectedBigJob, selectedLittleJob, opportunityFilter, sortBy]);

  const getZoneColor = (importance: number, satisfaction: number) => {
    // Underserved: high importance, low satisfaction
    if (importance >= 7 && satisfaction <= 5) return 'hsl(var(--destructive))';
    // Overserved: low importance, high satisfaction  
    if (importance <= 6 && satisfaction >= 7) return 'hsl(var(--primary))';
    // Appropriately served: balanced
    return 'hsl(var(--success))';
  };

  const getZoneLabel = (importance: number, satisfaction: number) => {
    if (importance >= 7 && satisfaction <= 5) return 'Underserved';
    if (importance <= 6 && satisfaction >= 7) return 'Overserved';
    return 'Appropriately Served';
  };

  const chartData = filteredOutcomes.map(outcome => ({
    x: outcome.importance,
    y: outcome.satisfaction,
    name: outcome.name,
    opportunityScore: outcome.opportunityScore,
    bigJob: outcome.bigJobName,
    littleJob: outcome.littleJobName,
    outcome: outcome
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground mb-2">{data.bigJob} → {data.littleJob}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span>Importância:</span>
              <span className="font-medium">{data.x.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Satisfação:</span>
              <span className="font-medium">{data.y.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Opportunity Score:</span>
              <span className="font-medium">{data.opportunityScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const availableLittleJobs = useMemo(() => {
    if (selectedBigJob === 'all') return [];
    const bigJob = currentResearch?.data.bigJobs.find(bj => bj.id === selectedBigJob);
    return bigJob?.littleJobs || [];
  }, [selectedBigJob, currentResearch]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <NavigationHeader 
        title="Análise ODI"
        subtitle="Gráfico de Importância vs Satisfação"
      />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Pesquisa</label>
                  <Select value={selectedResearch} onValueChange={setSelectedResearch}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockResearchRounds.map(round => (
                        <SelectItem key={round.id} value={round.id}>
                          {round.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Big Job</label>
                  <Select value={selectedBigJob} onValueChange={(value) => {
                    setSelectedBigJob(value);
                    setSelectedLittleJob('all');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {currentResearch?.data.bigJobs.map(bigJob => (
                        <SelectItem key={bigJob.id} value={bigJob.id}>
                          {bigJob.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBigJob !== 'all' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Little Job</label>
                    <Select value={selectedLittleJob} onValueChange={setSelectedLittleJob}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableLittleJobs.map(littleJob => (
                          <SelectItem key={littleJob.id} value={littleJob.id}>
                            {littleJob.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Opportunity Score</label>
                  <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="high">Alto (≥15)</SelectItem>
                      <SelectItem value="medium">Médio (10-15)</SelectItem>
                      <SelectItem value="low">Baixo (&lt;10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opportunity">Opportunity Score</SelectItem>
                      <SelectItem value="importance">Importância</SelectItem>
                      <SelectItem value="satisfaction">Satisfação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Outcomes List */}
            <Card>
              <CardHeader>
                <CardTitle>Outcomes ({filteredOutcomes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredOutcomes.map(outcome => (
                    <div
                      key={outcome.id}
                      className="p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedOutcome(outcome)}
                    >
                      <h4 className="font-medium text-sm">{outcome.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {outcome.bigJobName} → {outcome.littleJobName}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={getOpportunityLevel(outcome.opportunityScore) === 'high' ? 'default' : getOpportunityLevel(outcome.opportunityScore) === 'medium' ? 'secondary' : 'outline'}>
                          {outcome.opportunityScore.toFixed(1)}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {outcome.importance.toFixed(1)} / {outcome.satisfaction.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Mapa de Oportunidades ODI</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Importância vs Satisfação • {currentResearch?.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Importância"
                        domain={[0, 10]}
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        label={{ value: 'Importância', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="Satisfação"
                        domain={[0, 10]}
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        label={{ value: 'Satisfação', angle: -90, position: 'insideLeft' }}
                      />
                      
                      {/* Reference Lines for Zones */}
                      <ReferenceLine x={6} stroke="hsl(var(--border))" strokeDasharray="5 5" />
                      <ReferenceLine y={5} stroke="hsl(var(--border))" strokeDasharray="5 5" />
                      <ReferenceLine y={7} stroke="hsl(var(--border))" strokeDasharray="5 5" />
                      
                      {/* Diagonal Lines */}
                      <ReferenceLine 
                        segment={[{ x: 5, y: 0 }, { x: 10, y: 10 }]} 
                        stroke="black" 
                        strokeWidth={0.8}
                      />
                      <ReferenceLine 
                        segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} 
                        stroke="black" 
                        strokeWidth={0.8}
                      />
                      
                      <Tooltip content={<CustomTooltip />} />
                      
                      <Scatter
                        data={chartData}
                        fill="hsl(var(--primary))"
                        onClick={(data) => setSelectedOutcome(data.outcome)}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getZoneColor(entry.x, entry.y)}
                            className="cursor-pointer hover:opacity-80"
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  
                  {/* Underserved Area Overlay */}
                  <div 
                    className="absolute top-5 left-16 right-5 bottom-10 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, transparent 50%, rgba(239, 68, 68, 0.08) 50%)',
                      clipPath: 'polygon(50% 100%, 100% 0%, 100% 100%)'
                    }}
                  />
                  
                  {/* Overserved Area Overlay */}
                  <div 
                    className="absolute top-5 left-16 right-5 bottom-10 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 100%, transparent 0%)',
                      clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)'
                    }}
                  />
                  
                  {/* Well served area (yellow) */}
                  <div 
                    className="absolute top-5 left-16 right-5 bottom-10 pointer-events-none"
                    style={{
                      background: 'rgba(199, 253, 5)',
                      clipPath: 'polygon(0% 100%, 50% 0%, 100% 0%, 100% 100%)'
                    }}
                  />
                  
                  {/* Labels */}
                  <div className="absolute bottom-20 right-8 text-xs text-red-500/70 font-medium pointer-events-none">
                    Underserved
                  </div>
                  <div className="absolute top-8 left-32 text-xs text-green-500/70 font-medium pointer-events-none">
                    Overserved
                  </div>
                  <div className="absolute bottom-32 left-28 text-xs text-yellow-600/70 font-medium pointer-events-none">
                    Well served
                  </div>
                </div>
                
                {/* Zone Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                    <span className="text-sm">Underserved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }} />
                    <span className="text-sm">Appropriately Served</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                    <span className="text-sm">Overserved</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Outcome Detail Modal */}
      <Dialog open={!!selectedOutcome} onOpenChange={() => setSelectedOutcome(null)}>
        <DialogContent className="max-w-md">
          {selectedOutcome && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedOutcome.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedOutcome.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Big Job:</span>
                    <span className="text-sm font-medium">{selectedOutcome.bigJobName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Little Job:</span>
                    <span className="text-sm font-medium">{selectedOutcome.littleJobName}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Importância:</span>
                    <span className="text-sm font-medium">{selectedOutcome.importance.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Satisfação:</span>
                    <span className="text-sm font-medium">{selectedOutcome.satisfaction.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Opportunity Score:</span>
                    <Badge variant={getOpportunityLevel(selectedOutcome.opportunityScore) === 'high' ? 'default' : getOpportunityLevel(selectedOutcome.opportunityScore) === 'medium' ? 'secondary' : 'outline'}>
                      {selectedOutcome.opportunityScore.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Zona ODI:</span>
                    <span className="text-sm font-medium">
                      {getZoneLabel(selectedOutcome.importance, selectedOutcome.satisfaction)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analysis;
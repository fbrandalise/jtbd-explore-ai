import { useState, useMemo } from 'react';
import { mockResearchRounds } from '@/data/mockData';
import { ResearchRound, Outcome, BigJob, LittleJob, getOpportunityLevel } from '@/types/jtbd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, TrendingUp, TrendingDown, Search, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OutcomeEvolution {
  id: string;
  name: string;
  bigJobId: string;
  bigJobName: string;
  littleJobId: string;
  littleJobName: string;
  series: {
    surveyId: string;
    surveyLabel: string;
    date: string;
    opportunity: number;
    importance: number;
    satisfaction: number;
  }[];
}

const Analytics = () => {
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>(mockResearchRounds.map(r => r.id));
  const [selectedBigJob, setSelectedBigJob] = useState<string>('all');
  const [selectedLittleJob, setSelectedLittleJob] = useState<string>('all');
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'opportunity_avg' | 'opportunity_change' | 'importance_avg' | 'satisfaction_avg'>('opportunity_change');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOutcomeDetail, setSelectedOutcomeDetail] = useState<OutcomeEvolution | null>(null);
  
  // Generate evolution data
  const evolutionData = useMemo(() => {
    const outcomeMap = new Map<string, OutcomeEvolution>();
    
    mockResearchRounds.forEach(round => {
      round.data.bigJobs.forEach((bigJob: BigJob) => {
        bigJob.littleJobs.forEach((littleJob: LittleJob) => {
          littleJob.outcomes.forEach((outcome: Outcome) => {
            const key = `${bigJob.id}-${littleJob.id}-${outcome.id}`;
            
            if (!outcomeMap.has(key)) {
              outcomeMap.set(key, {
                id: outcome.id,
                name: outcome.name,
                bigJobId: bigJob.id,
                bigJobName: bigJob.name,
                littleJobId: littleJob.id,
                littleJobName: littleJob.name,
                series: []
              });
            }
            
            const evolution = outcomeMap.get(key)!;
            evolution.series.push({
              surveyId: round.id,
              surveyLabel: round.name,
              date: round.date,
              opportunity: outcome.opportunityScore,
              importance: outcome.importance,
              satisfaction: outcome.satisfaction
            });
          });
        });
      });
    });
    
    return Array.from(outcomeMap.values());
  }, []);

  // Filter and sort outcomes
  const filteredEvolution = useMemo(() => {
    let filtered = evolutionData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.bigJobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.littleJobName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by Big Job
    if (selectedBigJob !== 'all') {
      filtered = filtered.filter(o => o.bigJobId === selectedBigJob);
    }

    // Filter by Little Job
    if (selectedLittleJob !== 'all') {
      filtered = filtered.filter(o => o.littleJobId === selectedLittleJob);
    }

    // Filter by Opportunity Score
    if (opportunityFilter !== 'all') {
      filtered = filtered.filter(o => {
        const avgOpportunity = o.series.reduce((sum, s) => sum + s.opportunity, 0) / o.series.length;
        if (opportunityFilter === 'high') return avgOpportunity >= 15;
        if (opportunityFilter === 'medium') return avgOpportunity >= 10 && avgOpportunity < 15;
        if (opportunityFilter === 'low') return avgOpportunity < 10;
        return true;
      });
    }

    // Sort outcomes
    return filtered.sort((a, b) => {
      if (sortBy === 'opportunity_avg') {
        const avgA = a.series.reduce((sum, s) => sum + s.opportunity, 0) / a.series.length;
        const avgB = b.series.reduce((sum, s) => sum + s.opportunity, 0) / b.series.length;
        return avgB - avgA;
      }
      if (sortBy === 'opportunity_change') {
        const changeA = a.series.length > 1 ? a.series[a.series.length - 1].opportunity - a.series[0].opportunity : 0;
        const changeB = b.series.length > 1 ? b.series[b.series.length - 1].opportunity - b.series[0].opportunity : 0;
        return Math.abs(changeB) - Math.abs(changeA);
      }
      if (sortBy === 'importance_avg') {
        const avgA = a.series.reduce((sum, s) => sum + s.importance, 0) / a.series.length;
        const avgB = b.series.reduce((sum, s) => sum + s.importance, 0) / b.series.length;
        return avgB - avgA;
      }
      if (sortBy === 'satisfaction_avg') {
        const avgA = a.series.reduce((sum, s) => sum + s.satisfaction, 0) / a.series.length;
        const avgB = b.series.reduce((sum, s) => sum + s.satisfaction, 0) / b.series.length;
        return avgB - avgA;
      }
      return 0;
    });
  }, [evolutionData, searchTerm, selectedBigJob, selectedLittleJob, opportunityFilter, sortBy]);

  // Chart data
  const chartData = useMemo(() => {
    const surveys = mockResearchRounds
      .filter(r => selectedSurveys.includes(r.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return surveys.map(survey => {
      const dataPoint: any = {
        survey: `${survey.name} • ${new Date(survey.date).toLocaleDateString('pt-BR')}`,
        date: survey.date
      };
      
      const displayedOutcomes = selectedOutcomes.length > 0 
        ? filteredEvolution.filter(o => selectedOutcomes.includes(o.id))
        : filteredEvolution.slice(0, 10); // Show top 10 by default
      
      displayedOutcomes.forEach(outcome => {
        const seriesPoint = outcome.series.find(s => s.surveyId === survey.id);
        dataPoint[outcome.id] = seriesPoint ? seriesPoint.opportunity : null;
      });
      
      return dataPoint;
    });
  }, [selectedSurveys, filteredEvolution, selectedOutcomes]);

  const availableLittleJobs = useMemo(() => {
    if (selectedBigJob === 'all') return [];
    const firstRound = mockResearchRounds[0];
    const bigJob = firstRound?.data.bigJobs.find(bj => bj.id === selectedBigJob);
    return bigJob?.littleJobs || [];
  }, [selectedBigJob]);

  const displayedOutcomes = selectedOutcomes.length > 0 
    ? filteredEvolution.filter(o => selectedOutcomes.includes(o.id))
    : filteredEvolution.slice(0, 10);

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--destructive))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(210, 100%, 60%)',
    'hsl(280, 100%, 60%)',
    'hsl(45, 100%, 50%)',
    'hsl(160, 100%, 40%)',
    'hsl(0, 100%, 50%)',
    'hsl(30, 100%, 50%)'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const outcome = filteredEvolution.find(o => o.id === entry.dataKey);
              if (!outcome || entry.value === null) return null;
              
              return (
                <div key={index} className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-0.5" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium">{outcome.name}</span>
                  </div>
                  <div className="text-muted-foreground ml-5">
                    Opportunity Score: {entry.value.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const toggleOutcomeSelection = (outcomeId: string) => {
    setSelectedOutcomes(prev => 
      prev.includes(outcomeId) 
        ? prev.filter(id => id !== outcomeId)
        : [...prev, outcomeId]
    );
  };

  const getOpportunityChange = (outcome: OutcomeEvolution) => {
    if (outcome.series.length < 2) return 0;
    const sorted = outcome.series.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[sorted.length - 1].opportunity - sorted[0].opportunity;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Analytics ODI
              </h1>
              <p className="text-muted-foreground">
                Evolução dos Opportunity Scores ao longo do tempo
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/analysis">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Scatter Plot
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Pesquisas</label>
                <div className="space-y-2">
                  {mockResearchRounds.map(round => (
                    <div key={round.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={round.id}
                        checked={selectedSurveys.includes(round.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSurveys(prev => [...prev, round.id]);
                          } else {
                            setSelectedSurveys(prev => prev.filter(id => id !== round.id));
                          }
                        }}
                      />
                      <label htmlFor={round.id} className="text-sm">
                        {round.name}
                      </label>
                    </div>
                  ))}
                </div>
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
                    {mockResearchRounds[0]?.data.bigJobs.map(bigJob => (
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
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Buscar Outcome</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do outcome, big job ou little job..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunity_change">Maior Variação</SelectItem>
                    <SelectItem value="opportunity_avg">Opportunity Score Médio</SelectItem>
                    <SelectItem value="importance_avg">Importância Média</SelectItem>
                    <SelectItem value="satisfaction_avg">Satisfação Média</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Outcomes List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  Outcomes ({filteredEvolution.length})
                  {selectedOutcomes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedOutcomes.length} selecionados
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEvolution.map((outcome, index) => {
                    const isSelected = selectedOutcomes.includes(outcome.id);
                    const change = getOpportunityChange(outcome);
                    const avgOpportunity = outcome.series.reduce((sum, s) => sum + s.opportunity, 0) / outcome.series.length;

                    return (
                      <div
                        key={outcome.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-accent/50'
                        }`}
                        onClick={() => toggleOutcomeSelection(outcome.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{outcome.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {outcome.bigJobName} → {outcome.littleJobName}
                            </p>
                          </div>
                          <div 
                            className="w-3 h-3 rounded-full ml-2 mt-1" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={getOpportunityLevel(avgOpportunity) === 'high' ? 'default' : getOpportunityLevel(avgOpportunity) === 'medium' ? 'secondary' : 'outline'}>
                            {avgOpportunity.toFixed(1)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs">
                            {change > 0 ? (
                              <TrendingUp className="h-3 w-3 text-success" />
                            ) : change < 0 ? (
                              <TrendingDown className="h-3 w-3 text-destructive" />
                            ) : null}
                            <span className={change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Evolução dos Opportunity Scores</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedOutcomes.length > 0 
                    ? `${selectedOutcomes.length} outcomes selecionados`
                    : `Top 10 outcomes por ${sortBy.replace('_', ' ')}`
                  }
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="survey" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        fontSize={12}
                      />
                      <YAxis 
                        label={{ value: 'Opportunity Score', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        onClick={(e) => toggleOutcomeSelection(e.dataKey as string)}
                      />
                      
                      {displayedOutcomes.map((outcome, index) => (
                        <Line
                          key={outcome.id}
                          type="monotone"
                          dataKey={outcome.id}
                          stroke={colors[index % colors.length]}
                          strokeWidth={selectedOutcomes.includes(outcome.id) ? 3 : 2}
                          dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                          connectNulls={false}
                          name={outcome.name}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Outcome</th>
                    <th className="text-left p-2">Big Job → Little Job</th>
                    <th className="text-right p-2">Δ Score</th>
                    <th className="text-right p-2">Score Atual</th>
                    <th className="text-right p-2">Importância Média</th>
                    <th className="text-right p-2">Satisfação Média</th>
                    <th className="text-center p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvolution.slice(0, 20).map((outcome) => {
                    const change = getOpportunityChange(outcome);
                    const avgOpportunity = outcome.series.reduce((sum, s) => sum + s.opportunity, 0) / outcome.series.length;
                    const avgImportance = outcome.series.reduce((sum, s) => sum + s.importance, 0) / outcome.series.length;
                    const avgSatisfaction = outcome.series.reduce((sum, s) => sum + s.satisfaction, 0) / outcome.series.length;
                    const currentScore = outcome.series.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.opportunity || 0;

                    return (
                      <tr key={outcome.id} className="border-b hover:bg-accent/50">
                        <td className="p-2 font-medium">{outcome.name}</td>
                        <td className="p-2 text-muted-foreground">
                          {outcome.bigJobName} → {outcome.littleJobName}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {change > 0 ? (
                              <TrendingUp className="h-3 w-3 text-success" />
                            ) : change < 0 ? (
                              <TrendingDown className="h-3 w-3 text-destructive" />
                            ) : null}
                            <span className={change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <Badge variant={getOpportunityLevel(currentScore) === 'high' ? 'default' : getOpportunityLevel(currentScore) === 'medium' ? 'secondary' : 'outline'}>
                            {currentScore.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">{avgImportance.toFixed(1)}</td>
                        <td className="p-2 text-right">{avgSatisfaction.toFixed(1)}</td>
                        <td className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOutcomeDetail(outcome)}
                          >
                            Detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Detail Modal */}
      <Dialog open={!!selectedOutcomeDetail} onOpenChange={() => setSelectedOutcomeDetail(null)}>
        <DialogContent className="max-w-2xl">
          {selectedOutcomeDetail && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedOutcomeDetail.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedOutcomeDetail.bigJobName} → {selectedOutcomeDetail.littleJobName}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Pesquisa</th>
                        <th className="text-right p-2">Opportunity Score</th>
                        <th className="text-right p-2">Importância</th>
                        <th className="text-right p-2">Satisfação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOutcomeDetail.series
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((point) => (
                        <tr key={point.surveyId} className="border-b">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{point.surveyLabel}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(point.date).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            <Badge variant={getOpportunityLevel(point.opportunity) === 'high' ? 'default' : getOpportunityLevel(point.opportunity) === 'medium' ? 'secondary' : 'outline'}>
                              {point.opportunity.toFixed(1)}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">{point.importance.toFixed(1)}</td>
                          <td className="p-2 text-right">{point.satisfaction.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link to={`/analysis?outcome=${selectedOutcomeDetail.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver no Scatter Plot
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics;
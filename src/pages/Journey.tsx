import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { mockResearchRounds } from '../data/mockData';
import { BigJob, LittleJob, Outcome, getOpportunityLevel } from '../types/jtbd';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Search, Target, ChevronRight, BarChart3, TrendingUp, Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OpportunityMeter } from '../components/OpportunityMeter';

// Custom Node Components
const BigJobNode = ({ data }: { data: any }) => {
  const { bigJob, isExpanded, onToggle } = data;
  
  return (
    <div className="bg-gradient-to-br from-primary via-primary-variant to-primary-glow text-primary-foreground rounded-lg shadow-lg border border-primary/20 min-w-[200px]">
      <Handle type="target" position={Position.Left} style={{ background: 'transparent' }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Target className="h-5 w-5" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
        <h3 className="font-semibold text-sm">{bigJob.name}</h3>
        <p className="text-xs opacity-90 mt-1">{bigJob.description}</p>
        <Badge variant="secondary" className="mt-2 text-xs">
          {bigJob.littleJobs.length} Little Jobs
        </Badge>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'transparent' }} />
    </div>
  );
};

const LittleJobNode = ({ data }: { data: any }) => {
  const { littleJob, isExpanded, onToggle } = data;
  
  return (
    <div className="bg-card border-2 border-accent rounded-lg shadow-md min-w-[180px]">
      <Handle type="target" position={Position.Left} style={{ background: 'hsl(var(--accent))' }} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Zap className="h-4 w-4 text-accent" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="text-accent hover:bg-accent/20"
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
        <h4 className="font-medium text-sm">{littleJob.name}</h4>
        <p className="text-xs text-muted-foreground mt-1">{littleJob.description}</p>
        <Badge variant="outline" className="mt-2 text-xs">
          {littleJob.outcomes.length} Outcomes
        </Badge>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'hsl(var(--accent))' }} />
    </div>
  );
};

const OutcomeNode = ({ data }: { data: any }) => {
  const { outcome, onSelect } = data;
  const level = getOpportunityLevel(outcome.opportunityScore);
  
  const getLevelColor = () => {
    switch (level) {
      case 'high': return 'border-opportunity-high bg-opportunity-high/10';
      case 'medium': return 'border-opportunity-medium bg-opportunity-medium/10';
      case 'low': return 'border-opportunity-low bg-opportunity-low/10';
      default: return 'border-muted bg-muted/10';
    }
  };

  const nodeSize = Math.max(120, Math.min(180, 120 + (outcome.opportunityScore - 10) * 3));
  
  return (
    <div 
      className={`bg-card border-2 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all ${getLevelColor()}`}
      style={{ minWidth: `${nodeSize}px` }}
      onClick={() => onSelect(outcome)}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'hsl(var(--muted-foreground))' }} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {outcome.opportunityScore.toFixed(1)}
          </Badge>
        </div>
        <h5 className="font-medium text-xs leading-tight">{outcome.name}</h5>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Imp:</span>
            <span>{outcome.importance}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Sat:</span>
            <span>{outcome.satisfaction}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  bigJob: BigJobNode,
  littleJob: LittleJobNode,
  outcome: OutcomeNode,
};

const Journey = () => {
  const [selectedResearch, setSelectedResearch] = useState(mockResearchRounds[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBigJob, setSelectedBigJob] = useState<string>('all');
  const [opportunityRange, setOpportunityRange] = useState([0]);
  const [expandedBigJobs, setExpandedBigJobs] = useState<Set<string>>(new Set());
  const [expandedLittleJobs, setExpandedLittleJobs] = useState<Set<string>>(new Set());
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);

  const currentResearch = mockResearchRounds.find(r => r.id === selectedResearch);
  const currentData = currentResearch?.data;

  // Generate nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!currentData) return { initialNodes: [], initialEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yPosition = 0;
    const nodeSpacing = 250;
    const levelSpacing = 300;

    // Filter data based on filters
    const filteredBigJobs = currentData.bigJobs.filter(bj => {
      if (selectedBigJob !== 'all' && bj.id !== selectedBigJob) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return bj.name.toLowerCase().includes(searchLower) ||
               bj.description.toLowerCase().includes(searchLower) ||
               bj.littleJobs.some(lj => 
                 lj.name.toLowerCase().includes(searchLower) ||
                 lj.outcomes.some(o => o.name.toLowerCase().includes(searchLower))
               );
      }
      return true;
    });

    filteredBigJobs.forEach((bigJob, bigJobIndex) => {
      // Big Job node
      const bigJobY = yPosition;
      nodes.push({
        id: `bj-${bigJob.id}`,
        type: 'bigJob',
        position: { x: 0, y: bigJobY },
        data: {
          bigJob,
          isExpanded: expandedBigJobs.has(bigJob.id),
          onToggle: () => {
            setExpandedBigJobs(prev => {
              const newSet = new Set(prev);
              if (newSet.has(bigJob.id)) {
                newSet.delete(bigJob.id);
                // Also collapse all little jobs
                bigJob.littleJobs.forEach(lj => newSet.delete(lj.id));
              } else {
                newSet.add(bigJob.id);
              }
              return newSet;
            });
          }
        }
      });

      if (expandedBigJobs.has(bigJob.id)) {
        let littleJobY = bigJobY;
        
        bigJob.littleJobs.forEach((littleJob, littleJobIndex) => {
          // Little Job node
          nodes.push({
            id: `lj-${littleJob.id}`,
            type: 'littleJob',
            position: { x: levelSpacing, y: littleJobY },
            data: {
              littleJob,
              isExpanded: expandedLittleJobs.has(littleJob.id),
              onToggle: () => {
                setExpandedLittleJobs(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(littleJob.id)) {
                    newSet.delete(littleJob.id);
                  } else {
                    newSet.add(littleJob.id);
                  }
                  return newSet;
                });
              }
            }
          });

          // Edge from Big Job to Little Job
          edges.push({
            id: `bj-${bigJob.id}-to-lj-${littleJob.id}`,
            source: `bj-${bigJob.id}`,
            target: `lj-${littleJob.id}`,
            style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 },
            animated: true
          });

          if (expandedLittleJobs.has(littleJob.id)) {
            let outcomeY = littleJobY;
            
            // Filter outcomes by opportunity score
            const filteredOutcomes = littleJob.outcomes.filter(outcome => 
              outcome.opportunityScore >= opportunityRange[0]
            );

            filteredOutcomes.forEach((outcome, outcomeIndex) => {
              // Outcome node
              nodes.push({
                id: `o-${outcome.id}`,
                type: 'outcome',
                position: { x: levelSpacing * 2, y: outcomeY },
                data: {
                  outcome,
                  onSelect: setSelectedOutcome
                }
              });

              // Edge from Little Job to Outcome
              edges.push({
                id: `lj-${littleJob.id}-to-o-${outcome.id}`,
                source: `lj-${littleJob.id}`,
                target: `o-${outcome.id}`,
                style: { 
                  stroke: getOpportunityLevel(outcome.opportunityScore) === 'high' ? 'hsl(var(--opportunity-high))' : 
                          getOpportunityLevel(outcome.opportunityScore) === 'medium' ? 'hsl(var(--opportunity-medium))' :
                          'hsl(var(--opportunity-low))',
                  strokeWidth: 1
                }
              });

              outcomeY += nodeSpacing / 2;
            });

            littleJobY = Math.max(littleJobY + nodeSpacing, outcomeY);
          } else {
            littleJobY += nodeSpacing;
          }
        });

        yPosition = Math.max(yPosition + nodeSpacing * 2, littleJobY);
      } else {
        yPosition += nodeSpacing;
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [currentData, selectedBigJob, searchTerm, opportunityRange, expandedBigJobs, expandedLittleJobs]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when dependencies change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!currentData) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Jornada JTBD</h1>
                <p className="text-muted-foreground">Mapa visual de Jobs to Be Done</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/analysis">
                  <BarChart3 className="h-4 w-4" />
                  Análise ODI
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/analytics">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Voltar</Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedResearch} onValueChange={setSelectedResearch}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar pesquisa" />
              </SelectTrigger>
              <SelectContent>
                {mockResearchRounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBigJob} onValueChange={setSelectedBigJob}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os Big Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Big Jobs</SelectItem>
                {currentData.bigJobs.map((bigJob) => (
                  <SelectItem key={bigJob.id} value={bigJob.id}>
                    {bigJob.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Opp. Score ≥</label>
              <div className="w-32">
                <Slider
                  value={opportunityRange}
                  onValueChange={setOpportunityRange}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{opportunityRange[0]}</span>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar jobs ou outcomes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Journey Map */}
      <div className="relative h-[calc(100vh-140px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Controls />
          <MiniMap />
          <Background gap={20} size={1} />
        </ReactFlow>
      </div>

      {/* Outcome Details Sheet */}
      <Sheet open={!!selectedOutcome} onOpenChange={() => setSelectedOutcome(null)}>
        <SheetContent className="w-96">
          {selectedOutcome && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedOutcome.name}</SheetTitle>
                <SheetDescription>
                  Detalhes do outcome e métricas ODI
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Métricas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <OpportunityMeter score={selectedOutcome.opportunityScore} size="lg" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Importância</div>
                        <div className="text-2xl font-bold text-primary">{selectedOutcome.importance}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Satisfação</div>
                        <div className="text-2xl font-bold text-accent">{selectedOutcome.satisfaction}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Nível de Oportunidade</div>
                      <Badge variant={
                        getOpportunityLevel(selectedOutcome.opportunityScore) === 'high' ? 'destructive' :
                        getOpportunityLevel(selectedOutcome.opportunityScore) === 'medium' ? 'default' : 'secondary'
                      }>
                        {getOpportunityLevel(selectedOutcome.opportunityScore) === 'high' ? 'Alto' :
                         getOpportunityLevel(selectedOutcome.opportunityScore) === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{selectedOutcome.description}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild className="gap-2">
                    <Link to={`/analysis?outcome=${selectedOutcome.id}`}>
                      <BarChart3 className="h-4 w-4" />
                      Ver no Scatter Plot
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <Link to={`/analytics?outcome=${selectedOutcome.id}`}>
                      <TrendingUp className="h-4 w-4" />
                      Ver Evolução
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Journey;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { mockResearchRounds } from '../data/mockData';
import { getOpportunityLevel } from '../types/jtbd';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '../components/ui/drawer';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Search, Filter, TrendingUp, BarChart3, Maximize2, Download } from 'lucide-react';

// Custom node components
const BigJobNode = ({ data }: { data: any }) => (
  <div className="bg-card border-2 border-primary/20 rounded-lg p-4 min-w-[200px] cursor-pointer hover:shadow-lg transition-shadow">
    <Handle type="target" position={Position.Left} style={{ background: 'transparent' }} />
    <div className="text-sm font-semibold text-primary">{data.label}</div>
    <div className="text-xs text-muted-foreground mt-1">{data.description}</div>
    <Badge variant="outline" className="mt-2">{data.count} Little Jobs</Badge>
    <Handle type="source" position={Position.Right} style={{ background: 'hsl(var(--primary))' }} />
  </div>
);

const LittleJobNode = ({ data }: { data: any }) => (
  <div className="bg-card border border-border rounded-lg p-3 min-w-[180px] cursor-pointer hover:shadow-md transition-shadow">
    <Handle type="target" position={Position.Left} style={{ background: 'transparent' }} />
    <div className="text-sm font-medium">{data.label}</div>
    <div className="text-xs text-muted-foreground mt-1">{data.description}</div>
    <Badge variant="secondary" className="mt-2">{data.count} Outcomes</Badge>
    <Handle type="source" position={Position.Right} style={{ background: 'hsl(var(--accent))' }} />
  </div>
);

const OutcomeNode = ({ data }: { data: any }) => {
  const level = getOpportunityLevel(data.opportunityScore);
  const colorClass = level === 'high' ? 'border-red-500 bg-red-50' : 
                    level === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
                    'border-green-500 bg-green-50';
  
  const size = Math.max(120, Math.min(200, 120 + (data.opportunityScore * 3)));
  
  return (
    <div 
      className={`border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${colorClass}`}
      style={{ width: size, minHeight: 80 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'transparent' }} />
      <div className="text-xs font-medium leading-tight">{data.label}</div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant={level === 'high' ? 'destructive' : level === 'medium' ? 'default' : 'secondary'} className="text-xs">
          OS {data.opportunityScore.toFixed(1)}
        </Badge>
      </div>
      {data.sparklineData && (
        <div className="mt-2 h-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.sparklineData}>
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke={level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981'} 
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  bigJob: BigJobNode,
  littleJob: LittleJobNode,
  outcome: OutcomeNode,
};

const Journey = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRound, setSelectedRound] = useState(searchParams.get('round') || '2025');
  const [expandedBigJobs, setExpandedBigJobs] = useState<Set<string>>(new Set());
  const [expandedLittleJobs, setExpandedLittleJobs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [opportunityRange, setOpportunityRange] = useState([0, 30]);
  const [selectedBigJobFilter, setSelectedBigJobFilter] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Get current research data
  const currentResearch = useMemo(() => 
    mockResearchRounds.find(r => r.id === selectedRound), 
    [selectedRound]
  );

  // Generate sparkline data for outcomes
  const generateSparklineData = useCallback((outcomeId: string) => {
    return mockResearchRounds.map(round => {
      const outcome = round.data.bigJobs
        .flatMap(bj => bj.littleJobs)
        .flatMap(lj => lj.outcomes)
        .find(o => o.id === outcomeId);
      
      return {
        round: round.name.split(' ')[1] || round.id,
        score: outcome?.opportunityScore || 0
      };
    }).filter(d => d.score > 0);
  }, []);

  // Generate layout
  const generateLayout = useCallback(() => {
    if (!currentResearch) return { nodes: [], edges: [] };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    let yOffset = 0;
    let xOffset = 0;
    const bigJobSpacing = 300;
    const littleJobSpacing = 200;
    const outcomeSpacing = 150;

    currentResearch.data.bigJobs.forEach((bigJob, bigJobIndex) => {
      // Filter by search and selected big job
      if (selectedBigJobFilter !== 'all' && selectedBigJobFilter !== bigJob.id) return;
      
      if (searchQuery && !bigJob.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !bigJob.littleJobs.some(lj => 
            lj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lj.outcomes.some(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
          )) return;

      const bigJobY = yOffset;
      const bigJobX = xOffset;
      
      // Big Job Node
      newNodes.push({
        id: `big-${bigJob.id}`,
        type: 'bigJob',
        //position: { x: 0, y: bigJobY },
        position: { x: bigJobX, y: bigJobY },
        data: {
          label: bigJob.name,
          description: bigJob.description,
          count: bigJob.littleJobs.length,
          bigJobId: bigJob.id
        }
      });

      if (expandedBigJobs.has(bigJob.id)) {
        let littleJobY = bigJobY;
        let littleJobX = bigJobX;
        bigJob.littleJobs.forEach((littleJob, littleJobIndex) => {
          const littleJobId = `little-${bigJob.id}-${littleJob.id}`;
          
          // Little Job Node
          newNodes.push({
            id: littleJobId,
            type: 'littleJob',
            
            position: { x: 300, y: littleJobY },
            
            data: {
              label: littleJob.name,
              description: littleJob.description,
              count: littleJob.outcomes.length,
              littleJobId: littleJob.id,
              bigJobId: bigJob.id
            }
          });

          // Edge from Big Job to Little Job
          newEdges.push({
            id: `edge-big-${bigJob.id}-little-${littleJob.id}`,
            source: `big-${bigJob.id}`,
            target: littleJobId,
            type: 'smoothstep',
            sourcePosition: Position.Bottom,
            label:"teste",
            style: { stroke: 'hsl(var(--primary))' },
            markerEnd: {
              type: MarkerType.ArrowClosed, // seta fechada
              color: '#FF0072',             // cor da seta
              width: 20,                    // largura
              height: 20,                   // altura
            },
          });

          if (expandedLittleJobs.has(littleJobId)) {
            let outcomeY = littleJobY;
            let outcomeX = littleJobX;
            
            littleJob.outcomes.forEach((outcome, outcomeIndex) => {
              // Filter by opportunity score
              if (outcome.opportunityScore < opportunityRange[0] || outcome.opportunityScore > opportunityRange[1]) return;
              
              // Filter by search
              if (searchQuery && !outcome.name.toLowerCase().includes(searchQuery.toLowerCase())) return;
              
              const outcomeId = `outcome-${bigJob.id}-${littleJob.id}-${outcome.id}`;
              
              // Outcome Node
              newNodes.push({
                id: outcomeId,
                type: 'outcome',
                position: { x: 600, y: outcomeY },
                data: {
                  
                  label: outcome.name,
                  description: outcome.description,
                  importance: outcome.importance,
                  satisfaction: outcome.satisfaction,
                  opportunityScore: outcome.opportunityScore,
                  outcomeId: outcome.id,
                  littleJobId: littleJob.id,
                  bigJobId: bigJob.id,
                  sparklineData: generateSparklineData(outcome.id)
                }
              });

              // Edge from Little Job to Outcome
              newEdges.push({
                id: `edge-little-${littleJob.id}-outcome-${outcome.id}`,
                source: littleJobId,
                target: outcomeId,
                type: 'smoothstep'
              });

              outcomeY += outcomeSpacing;
            });
          }

    /*      littleJobY += Math.max(littleJobSpacing, 
            expandedLittleJobs.has(littleJobId) ? 
              littleJob.outcomes.length * outcomeSpacing : littleJobSpacing
          );*/
          littleJobX += Math.max(littleJobSpacing, 
            expandedLittleJobs.has(littleJobId) ? 
              littleJob.outcomes.length * outcomeSpacing : littleJobSpacing
          );
        });
        xOffset = Math.max(xOffset + bigJobSpacing, littleJobX);
    //    yOffset = Math.max(yOffset + bigJobSpacing, littleJobY);
      } else {
     //   yOffset += bigJobSpacing;
        xOffset += bigJobSpacing;
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, [currentResearch, expandedBigJobs, expandedLittleJobs, searchQuery, opportunityRange, selectedBigJobFilter, generateSparklineData]);

  // Update layout when dependencies change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateLayout();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [generateLayout, setNodes, setEdges]);

  const initialNodes = [
  {
    id: '0',
    type: 'input',
    data: { label: 'Node' },
    position: { x: 0, y: 50 },
  },
];

  // Handle node clicks
  const onNodeClick = useCallback((event: any, node: Node) => {
    if (node.type === 'bigJob') {
      const bigJobId = node.data.bigJobId;
      setExpandedBigJobs(prev => {
        //console.log('Toggling Big Job:', prev);
        const newSet = new Set(prev);
        if (newSet.has(bigJobId)) {
          newSet.delete(bigJobId);
          // Also collapse all little jobs in this big job
          setExpandedLittleJobs(prevLittle => {
            const newLittleSet = new Set(prevLittle);
            Array.from(prevLittle).forEach(id => {
              if (id.startsWith(`little-${bigJobId}-`)) {
                newLittleSet.delete(id);
              }
            });
            return newLittleSet;
          });
        } else {
          //console.log('Expanding Big Job:', bigJobId);
          newSet.add(bigJobId);
        }
        console.log('New Expanded Big Jobss:', newSet); 
        return newSet;
      });
    } else if (node.type === 'littleJob') {
      const littleJobId = node.id;
      setExpandedLittleJobs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(littleJobId)) {
          newSet.delete(littleJobId);
        } else {
          newSet.add(littleJobId);
          newSet.add(initialNodes);
        }
        return newSet;
      });
    } else if (node.type === 'outcome') {
      setSelectedOutcome(node.data);
      setDrawerOpen(true);
    }
  }, []);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedRound !== '2025') params.set('round', selectedRound);
    if (searchQuery) params.set('search', searchQuery);
    setSearchParams(params);
  }, [selectedRound, searchQuery, setSearchParams]);

  const getOutcomeEvolution = (outcomeId: string) => {
    return mockResearchRounds.map(round => {
      const outcome = round.data.bigJobs
        .flatMap(bj => bj.littleJobs)
        .flatMap(lj => lj.outcomes)
        .find(o => o.id === outcomeId);
      
      return {
        round: round.name,
        date: round.date,
        importance: outcome?.importance || 0,
        satisfaction: outcome?.satisfaction || 0,
        opportunityScore: outcome?.opportunityScore || 0
      };
    }).filter(d => d.opportunityScore > 0);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Mapa da Jornada ODI</h1>
              <p className="text-sm text-muted-foreground">Navegação visual por Big Jobs → Little Jobs → Outcomes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/analysis">
                <BarChart3 className="h-4 w-4 mr-2" />
                Scatter Plot
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Evolução
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-48">
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

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar outcomes, jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedBigJobFilter} onValueChange={setSelectedBigJobFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Big Jobs</SelectItem>
              {currentResearch?.data.bigJobs.map(bigJob => (
                <SelectItem key={bigJob.id} value={bigJob.id}>
                  {bigJob.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">OS:</span>
            <div className="w-32">
              <Slider
                value={opportunityRange}
                onValueChange={setOpportunityRange}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {opportunityRange[0]}-{opportunityRange[1]}
            </span>
          </div>
        </div>
      </header>

      {/* Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Outcome Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              <span>{selectedOutcome?.label}</span>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm">×</Button>
              </DrawerClose>
            </DrawerTitle>
          </DrawerHeader>
          
          {selectedOutcome && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Métricas Atuais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Importância:</span>
                      <Badge variant="outline">{selectedOutcome.importance?.toFixed(1)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Satisfação:</span>
                      <Badge variant="outline">{selectedOutcome.satisfaction?.toFixed(1)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Opportunity Score:</span>
                      <Badge variant="destructive">{selectedOutcome.opportunityScore?.toFixed(1)}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Evolução do OS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getOutcomeEvolution(selectedOutcome.outcomeId)}>
                          <XAxis dataKey="round" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Line 
                            type="monotone" 
                            dataKey="opportunityScore" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-3">Histórico por Pesquisa</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getOutcomeEvolution(selectedOutcome.outcomeId).map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <span className="font-medium text-sm">{data.round}</span>
                        <span className="text-xs text-muted-foreground ml-2">{data.date}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">I: {data.importance.toFixed(1)}</Badge>
                        <Badge variant="outline" className="text-xs">S: {data.satisfaction.toFixed(1)}</Badge>
                        <Badge variant="destructive" className="text-xs">OS: {data.opportunityScore.toFixed(1)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link to={`/analysis?outcome=${selectedOutcome.outcomeId}`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver no Scatter
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/analytics?outcome=${selectedOutcome.outcomeId}`}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Evolução
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Journey;
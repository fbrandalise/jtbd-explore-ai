import { useState } from 'react';
import { BigJob, LittleJob, Outcome } from '../types/jtbd';
import { mockResearchRounds } from '../data/mockData';
import { ResearchSelector } from '../components/ResearchSelector';
import { BigJobCard } from '../components/BigJobCard';
import { LittleJobCard } from '../components/LittleJobCard';
import { OutcomeTable } from '../components/OutcomeTable';
import { Breadcrumb } from '../components/Breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ShoppingCart, TrendingUp, Target, Award, BarChart3, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

type NavigationState = {
  level: 'bigJobs' | 'littleJobs' | 'outcomes';
  selectedBigJob?: BigJob;
  selectedLittleJob?: LittleJob;
};

const Index = () => {
  const [selectedResearch, setSelectedResearch] = useState(mockResearchRounds[0].id);
  const [navigation, setNavigation] = useState<NavigationState>({ level: 'bigJobs' });

  const currentResearch = mockResearchRounds.find(r => r.id === selectedResearch);
  const currentData = currentResearch?.data;

  const resetNavigation = () => {
    setNavigation({ level: 'bigJobs' });
  };

  const navigateToBigJob = (bigJob: BigJob) => {
    setNavigation({
      level: 'littleJobs',
      selectedBigJob: bigJob
    });
  };

  const navigateToLittleJob = (littleJob: LittleJob) => {
    setNavigation({
      ...navigation,
      level: 'outcomes',
      selectedLittleJob: littleJob
    });
  };

  const getBreadcrumbItems = () => {
    const items = [{ label: 'Jobs to Be Done', onClick: resetNavigation }];
    
    if (navigation.selectedBigJob) {
      items.push({
        label: navigation.selectedBigJob.name,
        onClick: navigation.level === 'outcomes' ? () => setNavigation({ 
          level: 'littleJobs', 
          selectedBigJob: navigation.selectedBigJob 
        }) : undefined
      });
    }
    
    if (navigation.selectedLittleJob) {
      items.push({
        label: navigation.selectedLittleJob.name,
        onClick: undefined
      });
    }
    
    return items;
  };

  const getAllOutcomes = () => {
    if (!currentData) return [];
    return currentData.bigJobs.flatMap(bj => 
      bj.littleJobs.flatMap(lj => lj.outcomes)
    );
  };

  const getTopOpportunities = () => {
    return getAllOutcomes()
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 3);
  };

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
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">JTBD Marketplace Explorer</h1>
                <p className="text-muted-foreground">Análise de Jobs to Be Done para vendedores em marketplaces</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild className="gap-2">
                <Link to="/analysis">
                  <BarChart3 className="h-4 w-4" />
                  Análise ODI
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/analytics">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/journey">
                  <Map className="h-4 w-4" />
                  Jornada
                </Link>
              </Button>
            </div>
          </div>
          
          <Breadcrumb items={getBreadcrumbItems()} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <ResearchSelector
              researchRounds={mockResearchRounds}
              selectedRound={selectedResearch}
              onRoundChange={setSelectedResearch}
            />

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Big Jobs</span>
                  <Badge variant="outline">{currentData.bigJobs.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Little Jobs</span>
                  <Badge variant="outline">
                    {currentData.bigJobs.reduce((acc, bj) => acc + bj.littleJobs.length, 0)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outcomes</span>
                  <Badge variant="outline">{getAllOutcomes().length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alta Oportunidade</span>
                  <Badge variant="destructive">
                    {getAllOutcomes().filter(o => o.opportunityScore >= 15).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Top Opportunities */}
            {navigation.level === 'bigJobs' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getTopOpportunities().map((outcome, index) => (
                    <div key={outcome.id} className="space-y-1">
                      <div className="text-sm font-medium">{outcome.name}</div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                        <Badge variant="destructive" className="text-xs">
                          {outcome.opportunityScore.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {navigation.level === 'bigJobs' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Big Jobs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentData.bigJobs.map((bigJob) => (
                    <BigJobCard
                      key={bigJob.id}
                      bigJob={bigJob}
                      onClick={() => navigateToBigJob(bigJob)}
                    />
                  ))}
                </div>
              </div>
            )}

            {navigation.level === 'littleJobs' && navigation.selectedBigJob && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-semibold">Little Jobs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {navigation.selectedBigJob.littleJobs.map((littleJob) => (
                    <LittleJobCard
                      key={littleJob.id}
                      littleJob={littleJob}
                      onClick={() => navigateToLittleJob(littleJob)}
                    />
                  ))}
                </div>
              </div>
            )}

            {navigation.level === 'outcomes' && navigation.selectedLittleJob && (
              <div className="space-y-6">
                <OutcomeTable
                  outcomes={navigation.selectedLittleJob.outcomes}
                  title={`Outcomes - ${navigation.selectedLittleJob.name}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
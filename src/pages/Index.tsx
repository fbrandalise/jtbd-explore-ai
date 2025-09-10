import { useState, useEffect } from "react";
import { ResearchSelector } from "@/components/ResearchSelector";
import { BigJobCard } from "@/components/BigJobCard";
import { LittleJobCard } from "@/components/LittleJobCard";
import { OutcomeTable } from "@/components/OutcomeTable";
import { OpportunityMeter } from "@/components/OpportunityMeter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import type { SupabaseResearchRound, SupabaseBigJob, SupabaseLittleJob, SupabaseOutcome } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NavigationState {
  level: 'bigJobs' | 'littleJobs' | 'outcomes';
  selectedBigJob?: SupabaseBigJob;
  selectedLittleJob?: SupabaseLittleJob;
}

const Index = () => {
  const { researchRounds, isLoading, isSeeding, error } = useSupabaseData();
  const [selectedResearch, setSelectedResearch] = useState<SupabaseResearchRound | null>(null);
  const [navigation, setNavigation] = useState<NavigationState>({ level: 'bigJobs' });

  // Set default research round when data loads
  useEffect(() => {
    if (researchRounds.length > 0 && !selectedResearch) {
      setSelectedResearch(researchRounds[0]);
    }
  }, [researchRounds, selectedResearch]);

  const resetNavigation = () => {
    setNavigation({ level: 'bigJobs' });
  };

  const navigateToBigJob = (bigJob: SupabaseBigJob) => {
    setNavigation({
      level: 'littleJobs',
      selectedBigJob: bigJob
    });
  };

  const navigateToLittleJob = (littleJob: SupabaseLittleJob) => {
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
        onClick: () => setNavigation({ level: 'littleJobs', selectedBigJob: navigation.selectedBigJob })
      });
    }
    
    if (navigation.selectedLittleJob) {
      items.push({
        label: navigation.selectedLittleJob.name,
        onClick: () => setNavigation({ ...navigation, level: 'outcomes' })
      });
    }
    
    return items;
  };

  const getAllOutcomes = (data: SupabaseResearchRound['data']): SupabaseOutcome[] => {
    return data.bigJobs.flatMap(bigJob =>
      bigJob.littleJobs.flatMap(littleJob => littleJob.outcomes)
    );
  };

  const getTopOpportunities = (outcomes: SupabaseOutcome[]) => {
    return outcomes
      .filter(outcome => outcome.opportunityScore !== undefined)
      .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
      .slice(0, 3);
  };

  const currentData = selectedResearch?.data;
  const allOutcomes = currentData ? getAllOutcomes(currentData) : [];
  const topOpportunities = getTopOpportunities(allOutcomes);

  // Loading and error states
  if (isLoading || isSeeding) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">
                {isSeeding ? 'Inicializando banco de dados...' : 'Carregando dados...'}
              </p>
              {isSeeding && (
                <p className="text-sm text-muted-foreground mt-2">
                  Primeira execução - migrando dados para Supabase
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!selectedResearch) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma pesquisa disponível
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span className="font-medium">JTBD Marketplace Explorer</span>
              </Link>
              <nav className="flex space-x-6">
                <Link to="/analysis" className="text-sm text-muted-foreground hover:text-foreground">
                  Análise
                </Link>
                <Link to="/analytics" className="text-sm text-muted-foreground hover:text-foreground">
                  Analytics
                </Link>
                <Link to="/journey" className="text-sm text-muted-foreground hover:text-foreground">
                  Jornada
                </Link>
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              </nav>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedResearch.name}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-80 space-y-6">
            <ResearchSelector
              researchRounds={researchRounds}
              selectedResearch={selectedResearch}
              onSelectionChange={setSelectedResearch}
            />

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Pesquisa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {currentData?.bigJobs.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Big Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {currentData?.bigJobs.reduce((acc, bj) => acc + bj.littleJobs.length, 0) || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Little Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {allOutcomes.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Outcomes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {allOutcomes.filter(o => (o.opportunityScore || 0) >= 15).length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Opportunity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Opportunities Card */}
            {topOpportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Oportunidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topOpportunities.map((outcome, index) => (
                    <div key={outcome.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{outcome.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <OpportunityMeter score={outcome.opportunityScore || 0} size="sm" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary ml-2">
                        {outcome.opportunityScore?.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Breadcrumb items={getBreadcrumbItems()} />
              </div>

              {navigation.level === 'bigJobs' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentData?.bigJobs.map((bigJob) => (
                    <BigJobCard
                      key={bigJob.id}
                      bigJob={bigJob}
                      onNavigate={navigateToBigJob}
                    />
                  ))}
                </div>
              )}

              {navigation.level === 'littleJobs' && navigation.selectedBigJob && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {navigation.selectedBigJob.littleJobs.map((littleJob) => (
                    <LittleJobCard
                      key={littleJob.id}
                      littleJob={littleJob}
                      onNavigate={navigateToLittleJob}
                    />
                  ))}
                </div>
              )}

              {navigation.level === 'outcomes' && navigation.selectedLittleJob && (
                <OutcomeTable
                  outcomes={navigation.selectedLittleJob.outcomes}
                  showFilters={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
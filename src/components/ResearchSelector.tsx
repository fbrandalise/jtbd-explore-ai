import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { SupabaseResearchRound } from '@/types/supabase';
import { Calendar, Database } from 'lucide-react';

interface ResearchSelectorProps {
  researchRounds: SupabaseResearchRound[];
  selectedResearch: SupabaseResearchRound | null;
  onSelectionChange: (round: SupabaseResearchRound) => void;
}

export function ResearchSelector({ researchRounds, selectedResearch, onSelectionChange }: ResearchSelectorProps) {
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Pesquisa ODI Selecionada</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select 
            value={selectedResearch?.id || ''} 
            onValueChange={(value) => {
              const round = researchRounds.find(r => r.id === value);
              if (round) onSelectionChange(round);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma pesquisa" />
            </SelectTrigger>
            <SelectContent>
              {researchRounds.map((round) => (
                <SelectItem key={round.id} value={round.id}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {round.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedResearch && (
            <div className="text-sm text-muted-foreground">
              <div className="font-medium">{selectedResearch.description}</div>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(selectedResearch.date).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
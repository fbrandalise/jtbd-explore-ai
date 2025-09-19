import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleGuard } from '@/components/RoleGuard';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Save,
  ArrowLeft,
  Calendar,
  FileText
} from 'lucide-react';
import {
  parseFile,
  matchOutcomes,
  previewToTable,
  commitImport,
  downloadTemplate,
  type ParsedRow,
  type MatchedRow,
  type PreviewModel,
  type SurveyMetadata
} from '@/lib/importRepo';

type ImportStep = 'upload' | 'preview' | 'confirm' | 'executing' | 'completed';

export default function ImportSurvey() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [surveyMeta, setSurveyMeta] = useState<SurveyMetadata>({
    code: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [matchedRows, setMatchedRows] = useState<MatchedRow[]>([]);
  const [preview, setPreview] = useState<PreviewModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

  // Validation
  const canProceedToPreview = useMemo(() => {
    return file && surveyMeta.code && surveyMeta.name && surveyMeta.date;
  }, [file, surveyMeta]);

  const canProceedToImport = useMemo(() => {
    return preview && preview.errorRows === 0 && preview.validRows > 0;
  }, [preview]);

  // File upload handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV ou Excel (.xlsx, .xls)",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  }, [toast]);

  // Load and preview handler
  const handleLoadPreview = useCallback(async () => {
    if (!file || !canProceedToPreview) return;

    setIsLoading(true);
    setProgress(0);

    try {
      // Step 1: Parse file
      setProgress(25);
      const parsed = await parseFile(file);
      setParsedRows(parsed);

      if (parsed.length === 0) {
        throw new Error('Arquivo não contém dados válidos');
      }

      // Step 2: Match outcomes
      setProgress(50);
      const matched = await matchOutcomes(parsed, 'default'); // TODO: Get org from context
      setMatchedRows(matched);

      // Step 3: Generate preview
      setProgress(75);
      const previewData = previewToTable(matched);
      setPreview(previewData);

      setProgress(100);
      setCurrentStep('preview');

      toast({
        title: "Pré-visualização carregada",
        description: `${previewData.totalRows} linhas processadas. ${previewData.validRows} válidas, ${previewData.warningRows} com avisos, ${previewData.errorRows} com erros.`
      });

    } catch (error: any) {
      toast({
        title: "Erro ao processar arquivo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [file, canProceedToPreview, toast]);

  // Manual outcome selection
  const handleManualMatch = useCallback((rowIndex: number, outcomeId: string, outcomeName: string) => {
    setMatchedRows(prev => prev.map((row, index) => 
      index === rowIndex ? {
        ...row,
        outcome_id: outcomeId,
        outcome_name: outcomeName,
        matchType: 'manual' as const,
        issues: row.issues.filter(issue => !issue.includes('não encontrado'))
      } : row
    ));
  }, []);

  // Confirm and proceed to import
  const handleConfirm = useCallback(() => {
    if (!canProceedToImport) return;
    setCurrentStep('confirm');
  }, [canProceedToImport]);

  // Execute import
  const handleExecuteImport = useCallback(async () => {
    if (!canProceedToImport) return;

    setCurrentStep('executing');
    setIsLoading(true);
    setProgress(0);

    try {
      const result = await commitImport({
        orgSlug: 'default', // TODO: Get from context
        surveyMeta,
        matchedRows
      });

      setImportResult(result);
      setProgress(100);
      setCurrentStep('completed');

      if (result.success) {
        toast({
          title: "Importação concluída",
          description: result.message
        });
      } else {
        toast({
          title: "Erro na importação",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [canProceedToImport, surveyMeta, matchedRows, toast]);

  // Reset to start over
  const handleStartOver = useCallback(() => {
    setCurrentStep('upload');
    setFile(null);
    setParsedRows([]);
    setMatchedRows([]);
    setPreview(null);
    setImportResult(null);
    setProgress(0);
  }, []);

  const getStatusIcon = (row: MatchedRow) => {
    if (!row.outcome_id || row.issues.some(issue => issue.includes('deve estar entre') || issue.includes('não encontrado'))) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (row.issues.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (row: MatchedRow) => {
    if (!row.outcome_id || row.issues.some(issue => issue.includes('deve estar entre') || issue.includes('não encontrado'))) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (row.issues.length > 0) {
      return <Badge variant="secondary">Atenção</Badge>;
    }
    return <Badge variant="default">OK</Badge>;
  };

  return (
    <RoleGuard requiredRole="writer">
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Importar Pesquisa</h1>
                <p className="text-muted-foreground">
                  Importe dados de pesquisas a partir de arquivos CSV ou Excel
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span className={currentStep === 'upload' ? 'text-primary font-medium' : ''}>
                  1. Upload & Configuração
                </span>
                <span className={['preview', 'confirm'].includes(currentStep) ? 'text-primary font-medium' : ''}>
                  2. Pré-visualização
                </span>
                <span className={currentStep === 'confirm' ? 'text-primary font-medium' : ''}>
                  3. Confirmação
                </span>
                <span className={['executing', 'completed'].includes(currentStep) ? 'text-primary font-medium' : ''}>
                  4. Importação
                </span>
              </div>
              {isLoading && <Progress value={progress} className="w-full" />}
            </div>

            {/* Step 1: Upload & Configuration */}
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Seleção do Arquivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Arquivo CSV ou Excel</Label>
                      <div className="mt-2">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          className="cursor-pointer"
                        />
                        {file && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <FileSpreadsheet className="h-4 w-4" />
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadTemplate}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Dados da Pesquisa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="code">Código *</Label>
                        <Input
                          id="code"
                          placeholder="ex: 2025-10"
                          value={surveyMeta.code}
                          onChange={(e) => setSurveyMeta(prev => ({ ...prev, code: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Data *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={surveyMeta.date}
                          onChange={(e) => setSurveyMeta(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        placeholder="ex: Pesquisa ODI 2025.7"
                        value={surveyMeta.name}
                        onChange={(e) => setSurveyMeta(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        placeholder="Descrição opcional da pesquisa..."
                        value={surveyMeta.description}
                        onChange={(e) => setSurveyMeta(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleLoadPreview}
                    disabled={!canProceedToPreview || isLoading}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {isLoading ? 'Processando...' : 'Carregar e Pré-visualizar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Preview & Validation */}
            {['preview', 'confirm'].includes(currentStep) && preview && (
              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo da Pré-visualização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.totalRows}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{preview.validRows}</div>
                        <div className="text-sm text-muted-foreground">Válidas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{preview.warningRows}</div>
                        <div className="text-sm text-muted-foreground">Avisos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{preview.errorRows}</div>
                        <div className="text-sm text-muted-foreground">Erros</div>
                      </div>
                    </div>
                    
                    {preview.errorRows > 0 && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Existem linhas com erro que impedem a importação. Corrija os mapeamentos ou remova as linhas problemáticas.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Preview Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pré-visualização dos Dados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Status</TableHead>
                            <TableHead>Outcome</TableHead>
                            <TableHead>Mapeado Para</TableHead>
                            <TableHead>Import.</TableHead>
                            <TableHead>Satisf.</TableHead>
                            <TableHead>Oport.</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.rows.slice(0, 100).map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {getStatusIcon(row)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {row.rawOutcome}
                              </TableCell>
                              <TableCell>
                                {row.outcome_name ? (
                                  <div>
                                    <div className="font-medium">{row.outcome_name}</div>
                                    {row.matchType !== 'name' && (
                                      <div className="text-xs text-muted-foreground">
                                        {row.outcome_slug}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Não mapeado</span>
                                )}
                              </TableCell>
                              <TableCell>{row.importance}</TableCell>
                              <TableCell>{row.satisfaction}</TableCell>
                              <TableCell>{row.opportunity_score}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {getStatusBadge(row)}
                                  {row.issues.map((issue, issueIndex) => (
                                    <div key={issueIndex} className="text-xs text-muted-foreground">
                                      {issue}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {preview.rows.length > 100 && (
                      <div className="mt-4 text-center text-sm text-muted-foreground">
                        Mostrando primeiras 100 linhas de {preview.rows.length}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                    Voltar
                  </Button>
                  {currentStep === 'preview' && (
                    <Button 
                      onClick={handleConfirm}
                      disabled={!canProceedToImport}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Confirmar Importação
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 'confirm' && preview && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Confirmação da Importação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Dados da Pesquisa</h3>
                        <div className="space-y-2 text-sm">
                          <div><strong>Código:</strong> {surveyMeta.code}</div>
                          <div><strong>Nome:</strong> {surveyMeta.name}</div>
                          <div><strong>Data:</strong> {new Date(surveyMeta.date).toLocaleDateString('pt-BR')}</div>
                          {surveyMeta.description && (
                            <div><strong>Descrição:</strong> {surveyMeta.description}</div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Resumo da Importação</h3>
                        <div className="space-y-2 text-sm">
                          <div><strong>Linhas válidas:</strong> {preview.validRows}</div>
                          <div><strong>Linhas com avisos:</strong> {preview.warningRows}</div>
                          <div><strong>Total a importar:</strong> {preview.validRows + preview.warningRows}</div>
                        </div>
                      </div>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Esta ação criará uma nova pesquisa e inserirá todos os resultados no banco de dados. 
                        Esta operação não pode ser desfeita automaticamente.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('preview')}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleExecuteImport}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Executar Importação
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Executing */}
            {currentStep === 'executing' && (
              <Card>
                <CardHeader>
                  <CardTitle>Executando Importação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-lg mb-4">Processando dados...</div>
                    <Progress value={progress} className="w-full max-w-md mx-auto" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Completed */}
            {currentStep === 'completed' && importResult && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {importResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {importResult.success ? 'Importação Concluída' : 'Erro na Importação'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{importResult.inserted}</div>
                        <div className="text-sm text-muted-foreground">Inseridos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                        <div className="text-sm text-muted-foreground">Atualizados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                        <div className="text-sm text-muted-foreground">Erros</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg">{importResult.message}</div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={handleStartOver}>
                    Nova Importação
                  </Button>
                  <Button onClick={() => navigate('/analytics')}>
                    Ver Análises
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
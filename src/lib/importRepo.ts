import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export interface ParsedRow {
  rowIndex: number;
  rawOutcome: string;
  importance: number;
  satisfaction: number;
  opportunity_score: number;
  originalRow: Record<string, any>;
}

export interface MatchedRow extends ParsedRow {
  outcome_id: string | null;
  outcome_name?: string;
  outcome_slug?: string;
  matchType: 'slug' | 'name' | 'fuzzy' | 'manual' | 'none';
  matchScore?: number;
  issues: string[];
}

export interface PreviewModel {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  rows: MatchedRow[];
}

export interface ImportResult {
  success: boolean;
  survey_id?: string;
  inserted: number;
  updated: number;
  errors: number;
  error_details?: any[];
  message: string;
}

export interface SurveyMetadata {
  code: string;
  name: string;
  date: string;
  description?: string;
}

// Normalize column headers to handle different aliases
const normalizeHeaders = (headers: string[]): Record<string, string> => {
  const normalized: Record<string, string> = {};
  
  headers.forEach((header, index) => {
    const cleanHeader = header.trim().toLowerCase();
    
    if (cleanHeader === 'outcome') {
      normalized.outcome = header;
    } else if (['importancia', 'importance'].includes(cleanHeader)) {
      normalized.importance = header;
    } else if (['satisfacao', 'satisfaction'].includes(cleanHeader)) {
      normalized.satisfaction = header;
    } else if (['opportunity_score', 'opportunityscore', 'oportunidade'].includes(cleanHeader)) {
      normalized.opportunity_score = header;
    }
  });
  
  return normalized;
};

// Parse numeric value, handling comma as decimal separator
const parseNumeric = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  
  const cleaned = value.trim().replace(',', '.');
  return parseFloat(cleaned);
};

// Calculate similarity between two strings (simple Levenshtein-based)
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

export const parseFile = async (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const parsed = processResults(results.data as any[], results.meta.fields || []);
            resolve(parsed);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error),
        delimiter: '',  // Auto-detect
        encoding: 'UTF-8'
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('Arquivo vazio'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const parsedData = rows.map((row, index) => {
            const rowObj: Record<string, any> = {};
            headers.forEach((header, colIndex) => {
              rowObj[header] = row[colIndex];
            });
            return rowObj;
          });
          
          const parsed = processResults(parsedData, headers);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Formato de arquivo não suportado. Use CSV ou XLSX.'));
    }
  });
};

const processResults = (data: any[], headers: string[]): ParsedRow[] => {
  const headerMap = normalizeHeaders(headers);
  
  if (!headerMap.outcome) {
    throw new Error('Coluna "outcome" não encontrada');
  }
  if (!headerMap.importance) {
    throw new Error('Coluna de importância não encontrada (aceita: importancia, importance)');
  }
  if (!headerMap.satisfaction) {
    throw new Error('Coluna de satisfação não encontrada (aceita: satisfacao, satisfaction)');
  }
  if (!headerMap.opportunity_score) {
    throw new Error('Coluna de opportunity score não encontrada (aceita: opportunity_score, opportunityScore)');
  }
  
  return data.map((row, index) => {
    const rawOutcome = row[headerMap.outcome]?.toString().trim() || '';
    const importance = parseNumeric(row[headerMap.importance]);
    const satisfaction = parseNumeric(row[headerMap.satisfaction]);
    const opportunity_score = parseNumeric(row[headerMap.opportunity_score]);
    
    return {
      rowIndex: index + 1,
      rawOutcome,
      importance,
      satisfaction,
      opportunity_score,
      originalRow: row
    };
  }).filter(row => row.rawOutcome); // Remove empty rows
};

export const matchOutcomes = async (rows: ParsedRow[], orgId: string): Promise<MatchedRow[]> => {
  // Fetch all active outcomes for the organization
  const { data: outcomes, error } = await supabase
    .from('outcomes')
    .select('id, slug, name')
    .eq('org_id', orgId)
    .eq('status', 'active');
  
  if (error) {
    throw new Error(`Erro ao buscar outcomes: ${error.message}`);
  }
  
  return rows.map(row => {
    const issues: string[] = [];
    let outcome_id: string | null = null;
    let outcome_name: string | undefined;
    let outcome_slug: string | undefined;
    let matchType: MatchedRow['matchType'] = 'none';
    let matchScore: number | undefined;
    
    // Validate numeric ranges
    if (isNaN(row.importance) || row.importance < 0 || row.importance > 10) {
      issues.push('Importância deve estar entre 0 e 10');
    }
    if (isNaN(row.satisfaction) || row.satisfaction < 0 || row.satisfaction > 10) {
      issues.push('Satisfação deve estar entre 0 e 10');
    }
    if (isNaN(row.opportunity_score) || row.opportunity_score < 0 || row.opportunity_score > 99.9) {
      issues.push('Opportunity Score deve estar entre 0 e 99.9');
    }
    
    // Try to match outcome
    if (outcomes && outcomes.length > 0) {
      // 1. Exact slug match
      const slugMatch = outcomes.find(o => o.slug === row.rawOutcome);
      if (slugMatch) {
        outcome_id = slugMatch.id;
        outcome_name = slugMatch.name;
        outcome_slug = slugMatch.slug;
        matchType = 'slug';
      } else {
        // 2. Exact name match
        const nameMatch = outcomes.find(o => o.name === row.rawOutcome);
        if (nameMatch) {
          outcome_id = nameMatch.id;
          outcome_name = nameMatch.name;
          outcome_slug = nameMatch.slug;
          matchType = 'name';
        } else {
          // 3. Fuzzy match
          let bestMatch: typeof outcomes[0] | null = null;
          let bestScore = 0;
          
          outcomes.forEach(outcome => {
            const nameScore = calculateSimilarity(row.rawOutcome, outcome.name);
            const slugScore = calculateSimilarity(row.rawOutcome, outcome.slug);
            const score = Math.max(nameScore, slugScore);
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = outcome;
            }
          });
          
          if (bestMatch && bestScore >= 0.85) {
            outcome_id = bestMatch.id;
            outcome_name = bestMatch.name;
            outcome_slug = bestMatch.slug;
            matchType = 'fuzzy';
            matchScore = bestScore;
            issues.push(`Correspondência aproximada (${Math.round(bestScore * 100)}%)`);
          } else {
            issues.push('Outcome não encontrado');
          }
        }
      }
    }
    
    return {
      ...row,
      outcome_id,
      outcome_name,
      outcome_slug,
      matchType,
      matchScore,
      issues
    };
  });
};

export const previewToTable = (matched: MatchedRow[]): PreviewModel => {
  const validRows = matched.filter(row => row.outcome_id && row.issues.length === 0).length;
  const warningRows = matched.filter(row => row.outcome_id && row.issues.length > 0).length;
  const errorRows = matched.filter(row => !row.outcome_id || row.issues.some(issue => 
    issue.includes('deve estar entre') || issue.includes('não encontrado')
  )).length;
  
  return {
    totalRows: matched.length,
    validRows,
    warningRows,
    errorRows,
    rows: matched
  };
};

export const commitImport = async ({
  orgSlug,
  surveyMeta,
  matchedRows
}: {
  orgSlug: string;
  surveyMeta: SurveyMetadata;
  matchedRows: MatchedRow[];
}): Promise<ImportResult> => {
  // Filter only valid rows
  const validRows = matchedRows.filter(row => 
    row.outcome_id && 
    !isNaN(row.importance) && row.importance >= 0 && row.importance <= 10 &&
    !isNaN(row.satisfaction) && row.satisfaction >= 0 && row.satisfaction <= 10 &&
    !isNaN(row.opportunity_score) && row.opportunity_score >= 0 && row.opportunity_score <= 99.9
  );
  
  if (validRows.length === 0) {
    return {
      success: false,
      inserted: 0,
      updated: 0,
      errors: matchedRows.length,
      message: 'Nenhuma linha válida para importar'
    };
  }
  
  const payload = {
    org_slug: orgSlug,
    survey: surveyMeta as any,
    rows: validRows.map(row => ({
      outcome: row.outcome_slug || row.outcome_name,
      importance: row.importance,
      satisfaction: row.satisfaction,
      opportunity_score: row.opportunity_score
    }))
  } as any;
  
  try {
    const { data, error } = await supabase.rpc('rpc_import_survey', { payload });
    
    if (error) {
      throw error;
    }
    
    const result = data as any;
    
    return {
      success: true,
      survey_id: result.survey_id,
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors,
      error_details: result.error_details,
      message: `Importação concluída: ${result.inserted} inseridos, ${result.updated} atualizados`
    };
  } catch (error: any) {
    return {
      success: false,
      inserted: 0,
      updated: 0,
      errors: validRows.length,
      message: `Erro na importação: ${error.message}`
    };
  }
};

export const generateTemplate = (): string => {
  const template = [
    ['outcome', 'importancia', 'satisfacao', 'opportunity_score'],
    ['exemplo-outcome-slug', '9.2', '4.6', '21.0'],
    ['Nome do Outcome', '8.5', '5.2', '16.3']
  ];
  
  return Papa.unparse(template);
};

export const downloadTemplate = () => {
  const csv = generateTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'template-importacao-pesquisa.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
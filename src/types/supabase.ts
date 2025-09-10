import { Database } from '@/integrations/supabase/types';

// Database table types
export type BigJobRow = Database['public']['Tables']['big_jobs']['Row'];
export type LittleJobRow = Database['public']['Tables']['little_jobs']['Row'];
export type OutcomeRow = Database['public']['Tables']['outcomes']['Row'];
export type SurveyRow = Database['public']['Tables']['surveys']['Row'];
export type OutcomeResultRow = Database['public']['Tables']['outcome_results']['Row'];
export type ChangeLogRow = Database['public']['Tables']['change_logs']['Row'];

// Insert types for creating new records
export type BigJobInsert = Database['public']['Tables']['big_jobs']['Insert'];
export type LittleJobInsert = Database['public']['Tables']['little_jobs']['Insert'];
export type OutcomeInsert = Database['public']['Tables']['outcomes']['Insert'];
export type SurveyInsert = Database['public']['Tables']['surveys']['Insert'];
export type OutcomeResultInsert = Database['public']['Tables']['outcome_results']['Insert'];
export type ChangeLogInsert = Database['public']['Tables']['change_logs']['Insert'];

// Update types
export type BigJobUpdate = Database['public']['Tables']['big_jobs']['Update'];
export type LittleJobUpdate = Database['public']['Tables']['little_jobs']['Update'];
export type OutcomeUpdate = Database['public']['Tables']['outcomes']['Update'];
export type SurveyUpdate = Database['public']['Tables']['surveys']['Update'];
export type OutcomeResultUpdate = Database['public']['Tables']['outcome_results']['Update'];

// View types
export type OutcomeLongView = Database['public']['Views']['vw_outcomes_long']['Row'];

// Cache para mapear slug ⇄ uuid
export interface SlugToUuidMap {
  bigJobs: Record<string, string>;
  littleJobs: Record<string, string>;
  outcomes: Record<string, string>;
  surveys: Record<string, string>;
}

// Converted types for frontend (using slugs as IDs)
export interface SupabaseBigJob {
  id: string; // slug
  name: string;
  description: string | null;
  tags: string[];
  status: 'active' | 'archived';
  orderIndex: number;
  littleJobs: SupabaseLittleJob[];
}

export interface SupabaseLittleJob {
  id: string; // slug
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  orderIndex: number;
  outcomes: SupabaseOutcome[];
}

export interface SupabaseOutcome {
  id: string; // slug
  name: string;
  description: string | null;
  tags: string[];
  status: 'active' | 'archived';
  orderIndex: number;
  importance?: number;
  satisfaction?: number;
  opportunityScore?: number;
}

export interface SupabaseSurvey {
  id: string; // code
  name: string;
  date: string;
  description: string | null;
}

export interface SupabaseJTBDData {
  bigJobs: SupabaseBigJob[];
}

export interface SupabaseResearchRound {
  id: string; // code
  name: string;
  date: string;
  description: string;
  data: SupabaseJTBDData;
}

// Filter interfaces
export interface OutcomeLongFilters {
  surveyCodes?: string[];
  bigJobSlugs?: string[];
  littleJobSlugs?: string[];
  outcomeSlugs?: string[];
}

// Export/Import interfaces
export interface ExportData {
  hierarchy: SupabaseJTBDData;
  surveys: SupabaseSurvey[];
  outcomeResults: OutcomeResultRow[];
  exportedAt: string;
}

export interface ImportOptions {
  dryRun?: boolean;
  mergeBehavior: 'skip' | 'overwrite' | 'merge';
}

export interface ImportResult {
  bigJobs: { created: number; updated: number; skipped: number };
  littleJobs: { created: number; updated: number; skipped: number };
  outcomes: { created: number; updated: number; skipped: number };
  surveys: { created: number; updated: number; skipped: number };
  outcomeResults: { created: number; updated: number; skipped: number };
  conflicts: Array<{
    type: 'big_job' | 'little_job' | 'outcome' | 'survey';
    slug: string;
    existing: any;
    incoming: any;
  }>;
}
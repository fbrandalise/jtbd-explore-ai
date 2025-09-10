import { supabase } from '@/integrations/supabase/client';
import { calculateOpportunityScore } from '@/types/jtbd';
import type {
  BigJobRow,
  LittleJobRow,
  OutcomeRow,
  SurveyRow,
  OutcomeResultRow,
  BigJobInsert,
  LittleJobInsert,
  OutcomeInsert,
  SurveyInsert,
  OutcomeResultInsert,
  ChangeLogInsert,
  OutcomeLongView,
  SlugToUuidMap,
  SupabaseBigJob,
  SupabaseLittleJob,
  SupabaseOutcome,
  SupabaseSurvey,
  SupabaseJTBDData,
  SupabaseResearchRound,
  OutcomeLongFilters,
  ExportData,
  ImportOptions,
  ImportResult
} from '@/types/supabase';

class SupabaseRepository {
  private slugToUuidCache: SlugToUuidMap = {
    bigJobs: {},
    littleJobs: {},
    outcomes: {},
    surveys: {}
  };

  private async refreshSlugCache() {
    const [bigJobs, littleJobs, outcomes, surveys] = await Promise.all([
      supabase.from('big_jobs').select('id, slug'),
      supabase.from('little_jobs').select('id, slug'),
      supabase.from('outcomes').select('id, slug'),
      supabase.from('surveys').select('id, code')
    ]);

    if (bigJobs.data) {
      this.slugToUuidCache.bigJobs = Object.fromEntries(
        bigJobs.data.map(bj => [bj.slug, bj.id])
      );
    }

    if (littleJobs.data) {
      this.slugToUuidCache.littleJobs = Object.fromEntries(
        littleJobs.data.map(lj => [lj.slug, lj.id])
      );
    }

    if (outcomes.data) {
      this.slugToUuidCache.outcomes = Object.fromEntries(
        outcomes.data.map(oc => [oc.slug, oc.id])
      );
    }

    if (surveys.data) {
      this.slugToUuidCache.surveys = Object.fromEntries(
        surveys.data.map(su => [su.code, su.id])
      );
    }
  }

  private getUuidFromSlug(type: keyof SlugToUuidMap, slug: string): string | null {
    return this.slugToUuidCache[type][slug] || null;
  }

  private async logChange(
    entity: string,
    entityId: string,
    action: string,
    before?: any,
    after?: any
  ) {
    const log: ChangeLogInsert = {
      entity: entity as any,
      entity_id: entityId,
      action: action as any,
      before: before || null,
      after: after || null,
      actor: 'current_user' // TODO: Get from auth when implemented
    };

    await supabase.from('change_logs').insert(log);
  }

  // HIERARCHY METHODS
  async getHierarchy(): Promise<SupabaseJTBDData | null> {
    console.log('📊 Fetching hierarchy from Supabase...');
    await this.refreshSlugCache();
    
    const { data: bigJobs, error } = await supabase
      .from('big_jobs')
      .select(`
        *,
        little_jobs:little_jobs(
          *,
          outcomes:outcomes(*)
        )
      `)
      .eq('status', 'active')
      .order('order_index');

    if (error) {
      console.error('💥 Error fetching hierarchy:', error);
      return null;
    }

    console.log('📊 Raw bigJobs data:', bigJobs?.length || 0);
    if (!bigJobs) {
      console.log('⚠️ No bigJobs found, returning empty hierarchy');
      return { bigJobs: [] };
    }

    const convertedBigJobs: SupabaseBigJob[] = bigJobs.map(bj => ({
      id: bj.slug,
      name: bj.name,
      description: bj.description,
      tags: bj.tags || [],
      status: bj.status as 'active' | 'archived',
      orderIndex: bj.order_index,
      littleJobs: (bj.little_jobs || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(lj => ({
          id: lj.slug,
          name: lj.name,
          description: lj.description,
          status: lj.status as 'active' | 'archived',
          orderIndex: lj.order_index,
          outcomes: (lj.outcomes || [])
            .sort((a, b) => a.order_index - b.order_index)
            .map(oc => ({
              id: oc.slug,
              name: oc.name,
              description: oc.description,
              tags: oc.tags || [],
              status: oc.status as 'active' | 'archived',
              orderIndex: oc.order_index
            }))
        }))
    }));

    console.log('✅ Converted hierarchy with', convertedBigJobs.length, 'big jobs');
    return { bigJobs: convertedBigJobs };
  }

  // SURVEY METHODS
  async listSurveys(): Promise<SupabaseSurvey[]> {
    console.log('📊 Fetching surveys from Supabase...');
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('💥 Error fetching surveys:', error);
      return [];
    }

    console.log('📊 Found', data?.length || 0, 'surveys');
    const surveys = data.map(survey => ({
      id: survey.code,
      name: survey.name,
      date: survey.date,
      description: survey.description
    }));
    
    console.log('✅ Converted surveys:', surveys);
    return surveys;
  }

  async upsertSurvey(survey: Omit<SupabaseSurvey, 'id'> & { code: string }): Promise<boolean> {
    const surveyData: SurveyInsert = {
      code: survey.code,
      name: survey.name,
      date: survey.date,
      description: survey.description
    };

    const { error } = await supabase
      .from('surveys')
      .upsert(surveyData, { onConflict: 'code' });

    if (!error) {
      await this.logChange('survey', survey.code, 'upsert', null, surveyData);
    }

    return !error;
  }

  // OUTCOME RESULTS METHODS
  async getOutcomesLong(filters?: OutcomeLongFilters): Promise<OutcomeLongView[]> {
    let query = supabase.from('vw_outcomes_long').select('*');

    if (filters?.surveyCodes?.length) {
      query = query.in('survey_code', filters.surveyCodes);
    }
    if (filters?.bigJobSlugs?.length) {
      query = query.in('big_job_slug', filters.bigJobSlugs);
    }
    if (filters?.littleJobSlugs?.length) {
      query = query.in('little_job_slug', filters.littleJobSlugs);
    }
    if (filters?.outcomeSlugs?.length) {
      query = query.in('outcome_slug', filters.outcomeSlugs);
    }

    const { data, error } = await query.order('survey_code').order('opportunity_score', { ascending: false });

    if (error) {
      console.error('Error fetching outcomes long:', error);
      return [];
    }

    return data || [];
  }

  async upsertOutcomeResult(result: {
    surveyCode: string;
    outcomeSlug: string;
    importance: number;
    satisfaction: number;
    opportunityScore?: number;
  }): Promise<boolean> {
    await this.refreshSlugCache();
    
    const surveyId = this.getUuidFromSlug('surveys', result.surveyCode);
    const outcomeId = this.getUuidFromSlug('outcomes', result.outcomeSlug);

    if (!surveyId || !outcomeId) {
      console.error('Could not find survey or outcome ID');
      return false;
    }

    const opportunityScore = result.opportunityScore || calculateOpportunityScore(result.importance, result.satisfaction);

    const resultData: OutcomeResultInsert = {
      survey_id: surveyId,
      outcome_id: outcomeId,
      importance: result.importance,
      satisfaction: result.satisfaction,
      opportunity_score: opportunityScore
    };

    const { error } = await supabase
      .from('outcome_results')
      .upsert(resultData, { onConflict: 'survey_id,outcome_id' });

    if (!error) {
      await this.logChange('outcome_result', `${surveyId}-${outcomeId}`, 'upsert', null, resultData);
    }

    return !error;
  }

  // RESEARCH ROUND METHODS
  async getResearchRounds(): Promise<SupabaseResearchRound[]> {
    const surveys = await this.listSurveys();
    const hierarchy = await this.getHierarchy();
    
    if (!hierarchy) return [];

    const results: SupabaseResearchRound[] = [];

    for (const survey of surveys) {
      const outcomeResults = await this.getOutcomesLong({ surveyCodes: [survey.id] });
      
      // Create a map for quick lookup of scores
      const scoresMap = new Map<string, { importance: number; satisfaction: number; opportunityScore: number }>();
      outcomeResults.forEach(result => {
        scoresMap.set(result.outcome_slug, {
          importance: result.importance,
          satisfaction: result.satisfaction,
          opportunityScore: result.opportunity_score
        });
      });

      // Add scores to hierarchy
      const dataWithScores: SupabaseJTBDData = {
        bigJobs: hierarchy.bigJobs.map(bj => ({
          ...bj,
          littleJobs: bj.littleJobs.map(lj => ({
            ...lj,
            outcomes: lj.outcomes.map(oc => {
              const scores = scoresMap.get(oc.id);
              return {
                ...oc,
                importance: scores?.importance,
                satisfaction: scores?.satisfaction,
                opportunityScore: scores?.opportunityScore
              };
            })
          }))
        }))
      };

      results.push({
        id: survey.id,
        name: survey.name,
        date: survey.date,
        description: survey.description || '',
        data: dataWithScores
      });
    }

    return results;
  }

  // CRUD METHODS FOR BIG JOBS
  async createBigJob(payload: { slug: string; name: string; description?: string; tags?: string[]; orderIndex?: number }): Promise<boolean> {
    const bigJobData: BigJobInsert = {
      slug: payload.slug,
      name: payload.name,
      description: payload.description || null,
      tags: payload.tags || [],
      order_index: payload.orderIndex || 0
    };

    const { data, error } = await supabase
      .from('big_jobs')
      .insert(bigJobData)
      .select()
      .single();

    if (!error && data) {
      await this.logChange('big_job', data.id, 'create', null, bigJobData);
      this.slugToUuidCache.bigJobs[payload.slug] = data.id;
    }

    return !error;
  }

  async updateBigJob(slug: string, payload: Partial<{ name: string; description: string; tags: string[]; orderIndex: number }>): Promise<boolean> {
    await this.refreshSlugCache();
    const id = this.getUuidFromSlug('bigJobs', slug);
    if (!id) return false;

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.orderIndex !== undefined) updateData.order_index = payload.orderIndex;

    const { error } = await supabase
      .from('big_jobs')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      await this.logChange('big_job', id, 'update', null, updateData);
    }

    return !error;
  }

  async archiveBigJob(slug: string): Promise<boolean> {
    return this.updateBigJob(slug, { orderIndex: -1 }); // Using orderIndex as archive flag
  }

  async deleteBigJob(slug: string): Promise<boolean> {
    await this.refreshSlugCache();
    const id = this.getUuidFromSlug('bigJobs', slug);
    if (!id) return false;

    const { error } = await supabase
      .from('big_jobs')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.logChange('big_job', id, 'delete', null, null);
      delete this.slugToUuidCache.bigJobs[slug];
    }

    return !error;
  }

  // CRUD METHODS FOR LITTLE JOBS
  async createLittleJob(payload: { bigJobSlug: string; slug: string; name: string; description?: string; orderIndex?: number }): Promise<boolean> {
    await this.refreshSlugCache();
    const bigJobId = this.getUuidFromSlug('bigJobs', payload.bigJobSlug);
    if (!bigJobId) return false;

    const littleJobData: LittleJobInsert = {
      big_job_id: bigJobId,
      slug: payload.slug,
      name: payload.name,
      description: payload.description || null,
      order_index: payload.orderIndex || 0
    };

    const { data, error } = await supabase
      .from('little_jobs')
      .insert(littleJobData)
      .select()
      .single();

    if (!error && data) {
      await this.logChange('little_job', data.id, 'create', null, littleJobData);
      this.slugToUuidCache.littleJobs[payload.slug] = data.id;
    }

    return !error;
  }

  async updateLittleJob(slug: string, payload: Partial<{ name: string; description: string; orderIndex: number }>): Promise<boolean> {
    await this.refreshSlugCache();
    const id = this.getUuidFromSlug('littleJobs', slug);
    if (!id) return false;

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.orderIndex !== undefined) updateData.order_index = payload.orderIndex;

    const { error } = await supabase
      .from('little_jobs')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      await this.logChange('little_job', id, 'update', null, updateData);
    }

    return !error;
  }

  async archiveLittleJob(slug: string): Promise<boolean> {
    return this.updateLittleJob(slug, { orderIndex: -1 });
  }

  async deleteLittleJob(slug: string): Promise<boolean> {
    await this.refreshSlugCache();
    const id = this.getUuidFromSlug('littleJobs', slug);
    if (!id) return false;

    const { error } = await supabase
      .from('little_jobs')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.logChange('little_job', id, 'delete', null, null);
      delete this.slugToUuidCache.littleJobs[slug];
    }

    return !error;
  }

  // CRUD METHODS FOR OUTCOMES
  async createOutcome(payload: { littleJobSlug: string; slug: string; name: string; description?: string; tags?: string[]; orderIndex?: number }): Promise<boolean> {
    await this.refreshSlugCache();
    const littleJobId = this.getUuidFromSlug('littleJobs', payload.littleJobSlug);
    if (!littleJobId) return false;

    const outcomeData: OutcomeInsert = {
      little_job_id: littleJobId,
      slug: payload.slug,
      name: payload.name,
      description: payload.description || null,
      tags: payload.tags || [],
      order_index: payload.orderIndex || 0
    };

    const { data, error } = await supabase
      .from('outcomes')
      .insert(outcomeData)
      .select()
      .single();

    if (!error && data) {
      await this.logChange('outcome', data.id, 'create', null, outcomeData);
      this.slugToUuidCache.outcomes[payload.slug] = data.id;
    }

    return !error;
  }

  async updateOutcome(slug: string, payload: Partial<{ name: string; description: string; tags: string[]; orderIndex: number }>): Promise<boolean> {
    await this.refreshSlugCache();
    const id = this.getUuidFromSlug('outcomes', slug);
    if (!id) return false;

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.orderIndex !== undefined) updateData.order_index = payload.orderIndex;

    const { error } = await supabase
      .from('outcomes')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      await this.logChange('outcome', id, 'update', null, updateData);
    }

    return !error;
  }

  async archiveOutcome(slug: string): Promise<boolean> {
    return this.updateOutcome(slug, { orderIndex: -1 });
  }

  async deleteOutcome(slug: string): Promise<boolean> {
    await this.refreshSlugCache();
    const id = this.getUuidFromSlug('outcomes', slug);
    if (!id) return false;

    const { error } = await supabase
      .from('outcomes')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.logChange('outcome', id, 'delete', null, null);
      delete this.slugToUuidCache.outcomes[slug];
    }

    return !error;
  }

  // EXPORT/IMPORT METHODS
  async exportData(): Promise<ExportData | null> {
    const [hierarchy, surveys, outcomeResults] = await Promise.all([
      this.getHierarchy(),
      this.listSurveys(),
      supabase.from('outcome_results').select('*')
    ]);

    if (!hierarchy || outcomeResults.error) {
      return null;
    }

    return {
      hierarchy,
      surveys,
      outcomeResults: outcomeResults.data || [],
      exportedAt: new Date().toISOString()
    };
  }

  async importData(data: ExportData, options: ImportOptions = { mergeBehavior: 'skip' }): Promise<ImportResult> {
    const result: ImportResult = {
      bigJobs: { created: 0, updated: 0, skipped: 0 },
      littleJobs: { created: 0, updated: 0, skipped: 0 },
      outcomes: { created: 0, updated: 0, skipped: 0 },
      surveys: { created: 0, updated: 0, skipped: 0 },
      outcomeResults: { created: 0, updated: 0, skipped: 0 },
      conflicts: []
    };

    if (options.dryRun) {
      // TODO: Implement dry run logic
      return result;
    }

    // Import surveys first
    for (const survey of data.surveys) {
      const success = await this.upsertSurvey({
        code: survey.id,
        name: survey.name,
        date: survey.date,
        description: survey.description
      });
      if (success) result.surveys.created++;
    }

    // Import hierarchy
    for (const bigJob of data.hierarchy.bigJobs) {
      const bigJobSuccess = await this.createBigJob({
        slug: bigJob.id,
        name: bigJob.name,
        description: bigJob.description,
        tags: bigJob.tags,
        orderIndex: bigJob.orderIndex
      });
      if (bigJobSuccess) result.bigJobs.created++;

      for (const littleJob of bigJob.littleJobs) {
        const littleJobSuccess = await this.createLittleJob({
          bigJobSlug: bigJob.id,
          slug: littleJob.id,
          name: littleJob.name,
          description: littleJob.description,
          orderIndex: littleJob.orderIndex
        });
        if (littleJobSuccess) result.littleJobs.created++;

        for (const outcome of littleJob.outcomes) {
          const outcomeSuccess = await this.createOutcome({
            littleJobSlug: littleJob.id,
            slug: outcome.id,
            name: outcome.name,
            description: outcome.description,
            tags: outcome.tags,
            orderIndex: outcome.orderIndex
          });
          if (outcomeSuccess) result.outcomes.created++;
        }
      }
    }

    return result;
  }
}

export const supabaseRepository = new SupabaseRepository();
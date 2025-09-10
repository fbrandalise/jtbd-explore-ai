import { useState, useCallback, useEffect } from 'react';
import { supabaseRepository } from '@/lib/supabaseRepository';
import { useSupabaseHierarchy } from '@/hooks/useSupabaseData';
import { toast } from '@/hooks/use-toast';
import type { SupabaseJTBDData, SupabaseBigJob, SupabaseLittleJob, SupabaseOutcome } from '@/types/supabase';

export interface CreateBigJobData {
  name: string;
  description?: string;
  tags?: string[];
}

export interface CreateLittleJobData {
  name: string;
  description?: string;
  bigJobSlug: string;
}

export interface CreateOutcomeData {
  name: string;
  description?: string;
  tags?: string[];
  littleJobSlug: string;
}

export const useSupabaseJTBDAdmin = () => {
  const { hierarchy, isLoading, error, refreshHierarchy } = useSupabaseHierarchy();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate slug from name
  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }, []);

  // Create Big Job
  const createBigJob = useCallback(async (data: CreateBigJobData): Promise<boolean> => {
    if (!data.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const slug = generateSlug(data.name);
      const success = await supabaseRepository.createBigJob({
        slug,
        name: data.name.trim(),
        description: data.description?.trim() || '',
        tags: data.tags || [],
        orderIndex: hierarchy?.bigJobs.length || 0
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: `Big Job "${data.name}" criado com sucesso`
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o Big Job",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating big job:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao criar Big Job",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [generateSlug, hierarchy?.bigJobs.length, refreshHierarchy]);

  // Create Little Job
  const createLittleJob = useCallback(async (data: CreateLittleJobData): Promise<boolean> => {
    if (!data.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const slug = generateSlug(data.name);
      const success = await supabaseRepository.createLittleJob({
        bigJobSlug: data.bigJobSlug,
        slug,
        name: data.name.trim(),
        description: data.description?.trim() || '',
        orderIndex: 0
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: `Little Job "${data.name}" criado com sucesso`
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o Little Job",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating little job:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao criar Little Job",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [generateSlug, refreshHierarchy]);

  // Create Outcome
  const createOutcome = useCallback(async (data: CreateOutcomeData): Promise<boolean> => {
    if (!data.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const slug = generateSlug(data.name);
      const success = await supabaseRepository.createOutcome({
        littleJobSlug: data.littleJobSlug,
        slug,
        name: data.name.trim(),
        description: data.description?.trim() || '',
        tags: data.tags || [],
        orderIndex: 0
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: `Outcome "${data.name}" criado com sucesso`
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o Outcome",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating outcome:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao criar Outcome",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [generateSlug, refreshHierarchy]);

  // Update Big Job
  const updateBigJob = useCallback(async (slug: string, data: Partial<CreateBigJobData>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const success = await supabaseRepository.updateBigJob(slug, {
        name: data.name?.trim(),
        description: data.description?.trim(),
        tags: data.tags
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Big Job atualizado com sucesso"
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o Big Job",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating big job:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao atualizar Big Job",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshHierarchy]);

  // Update Little Job
  const updateLittleJob = useCallback(async (slug: string, data: Partial<CreateLittleJobData>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const success = await supabaseRepository.updateLittleJob(slug, {
        name: data.name?.trim(),
        description: data.description?.trim()
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Little Job atualizado com sucesso"
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o Little Job",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating little job:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao atualizar Little Job",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshHierarchy]);

  // Update Outcome
  const updateOutcome = useCallback(async (slug: string, data: Partial<CreateOutcomeData>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const success = await supabaseRepository.updateOutcome(slug, {
        name: data.name?.trim(),
        description: data.description?.trim(),
        tags: data.tags
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Outcome atualizado com sucesso"
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o Outcome",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao atualizar Outcome",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshHierarchy]);

  // Delete/Archive functions
  const deleteBigJob = useCallback(async (slug: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const success = await supabaseRepository.deleteBigJob(slug);

      if (success) {
        toast({
          title: "Sucesso",
          description: "Big Job removido com sucesso"
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível remover o Big Job",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting big job:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao remover Big Job",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshHierarchy]);

  const archiveBigJob = useCallback(async (slug: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const success = await supabaseRepository.archiveBigJob(slug);

      if (success) {
        toast({
          title: "Sucesso",
          description: "Big Job arquivado com sucesso"
        });
        refreshHierarchy();
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível arquivar o Big Job",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error archiving big job:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao arquivar Big Job",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshHierarchy]);

  return {
    hierarchy,
    isLoading,
    isSubmitting,
    error,
    refreshHierarchy,
    
    // CRUD operations
    createBigJob,
    createLittleJob,
    createOutcome,
    updateBigJob,
    updateLittleJob,
    updateOutcome,
    deleteBigJob,
    archiveBigJob,
    
    // Utility
    generateSlug
  };
};
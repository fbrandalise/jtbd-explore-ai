import { useState, useEffect } from 'react';
import { supabaseRepository } from '@/lib/supabaseRepository';
import { seedDatabase, isDatabaseSeeded } from '@/lib/seedData';
import type { SupabaseResearchRound, SupabaseJTBDData } from '@/types/supabase';

export function useSupabaseData() {
  const [researchRounds, setResearchRounds] = useState<SupabaseResearchRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      console.log('🔄 Starting data load...');
      setIsLoading(true);
      setError(null);

      // Check if database is seeded
      console.log('🔍 Checking if database is seeded...');
      const isSeeded = await isDatabaseSeeded();
      console.log('📊 Database seeded:', isSeeded);
      
      if (!isSeeded) {
        console.log('🌱 Database not seeded, starting seeding process...');
        setIsSeeding(true);
        const seedSuccess = await seedDatabase();
        console.log('✅ Seed success:', seedSuccess);
        
        if (!seedSuccess) {
          console.error('❌ Failed to seed database');
          setError('Failed to seed database with initial data');
          return;
        }
        setIsSeeding(false);
      }

      // Load research rounds
      console.log('📥 Loading research rounds...');
      const rounds = await supabaseRepository.getResearchRounds();
      console.log('📊 Loaded rounds:', rounds.length, rounds);
      setResearchRounds(rounds);
    } catch (err) {
      console.error('💥 Error loading Supabase data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = () => {
    loadData();
  };

  return {
    researchRounds,
    isLoading,
    isSeeding,
    error,
    refreshData
  };
}

export function useSupabaseHierarchy() {
  const [hierarchy, setHierarchy] = useState<SupabaseJTBDData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHierarchy = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await supabaseRepository.getHierarchy();
      setHierarchy(data);
    } catch (err) {
      console.error('Error loading hierarchy:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, []);

  const refreshHierarchy = () => {
    loadHierarchy();
  };

  return {
    hierarchy,
    isLoading,
    error,
    refreshHierarchy
  };
}
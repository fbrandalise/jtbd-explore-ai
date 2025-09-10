import { supabaseRepository } from './supabaseRepository';
import { BASE_JOBS, ROUNDS_META, mockResearchRounds } from '@/data/mockData';

/**
 * Script to migrate data from mock to Supabase
 * This will seed the database with existing mock data
 */
export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Big Jobs, Little Jobs, and Outcomes from BASE_JOBS
    console.log('📋 Creating JTBD hierarchy...');
    
    for (const bigJob of BASE_JOBS) {
      console.log(`Creating Big Job: ${bigJob.name}`);
      
      const bigJobSuccess = await supabaseRepository.createBigJob({
        slug: bigJob.id,
        name: bigJob.name,
        description: bigJob.description,
        tags: [],
        orderIndex: 0
      });

      if (!bigJobSuccess) {
        console.warn(`Failed to create Big Job: ${bigJob.name}`);
        continue;
      }

      for (const littleJob of bigJob.littleJobs) {
        console.log(`  Creating Little Job: ${littleJob.name}`);
        
        const littleJobSuccess = await supabaseRepository.createLittleJob({
          bigJobSlug: bigJob.id,
          slug: littleJob.id,
          name: littleJob.name,
          description: littleJob.description,
          orderIndex: 0
        });

        if (!littleJobSuccess) {
          console.warn(`  Failed to create Little Job: ${littleJob.name}`);
          continue;
        }

        for (const outcome of littleJob.outcomes) {
          console.log(`    Creating Outcome: ${outcome.name}`);
          
          const outcomeSuccess = await supabaseRepository.createOutcome({
            littleJobSlug: littleJob.id,
            slug: outcome.id,
            name: outcome.name,
            description: outcome.description,
            tags: [],
            orderIndex: 0
          });

          if (!outcomeSuccess) {
            console.warn(`    Failed to create Outcome: ${outcome.name}`);
          }
        }
      }
    }

    // 2. Create Surveys from ROUNDS_META
    console.log('📊 Creating surveys...');
    
    for (const round of ROUNDS_META) {
      console.log(`Creating Survey: ${round.name}`);
      
      const surveySuccess = await supabaseRepository.upsertSurvey({
        code: round.id,
        name: round.name,
        date: round.date,
        description: round.desc
      });

      if (!surveySuccess) {
        console.warn(`Failed to create Survey: ${round.name}`);
      }
    }

    // 3. Create Outcome Results from mockResearchRounds
    console.log('📈 Creating outcome results...');
    
    for (const researchRound of mockResearchRounds) {
      console.log(`Processing results for round: ${researchRound.name}`);
      
      for (const bigJob of researchRound.data.bigJobs) {
        for (const littleJob of bigJob.littleJobs) {
          for (const outcome of littleJob.outcomes) {
            if (outcome.importance !== undefined && outcome.satisfaction !== undefined) {
              const resultSuccess = await supabaseRepository.upsertOutcomeResult({
                surveyCode: researchRound.id,
                outcomeSlug: outcome.id,
                importance: outcome.importance,
                satisfaction: outcome.satisfaction,
                opportunityScore: outcome.opportunityScore
              });

              if (!resultSuccess) {
                console.warn(`Failed to create result for ${outcome.name} in ${researchRound.name}`);
              }
            }
          }
        }
      }
    }

    console.log('✅ Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    return false;
  }
}

/**
 * Function to check if database has been seeded
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const hierarchy = await supabaseRepository.getHierarchy();
    const surveys = await supabaseRepository.listSurveys();
    
    return !!(hierarchy?.bigJobs.length && surveys.length);
  } catch (error) {
    console.error('Error checking if database is seeded:', error);
    return false;
  }
}

/**
 * Function to clear all data (for testing purposes)
 */
export async function clearDatabase() {
  console.log('🧹 Clearing database...');
  
  try {
    // Due to foreign key constraints, we need to delete in reverse order
    // This is a simplified version - in production you'd want more robust cleanup
    
    console.log('⚠️ Database clearing not implemented yet - use Supabase dashboard to truncate tables');
    return false;
  } catch (error) {
    console.error('Error clearing database:', error);
    return false;
  }
}
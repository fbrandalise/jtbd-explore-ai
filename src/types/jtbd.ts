export interface Outcome {
  id: string;
  name: string;
  description: string;
  importance: number; // 1-10 scale
  satisfaction: number; // 1-10 scale
  opportunityScore: number; // Calculated: importance + (importance - satisfaction)
}

export interface LittleJob {
  id: string;
  name: string;
  description: string;
  outcomes: Outcome[];
}

export interface BigJob {
  id: string;
  name: string;
  description: string;
  littleJobs: LittleJob[];
}

export interface JTBDData {
  bigJobs: BigJob[];
}

export interface ResearchRound {
  id: string;
  name: string;
  date: string;
  description: string;
  data: JTBDData;
}

export type OpportunityLevel = 'high' | 'medium' | 'low';

export function getOpportunityLevel(score: number): OpportunityLevel {
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

export function calculateOpportunityScore(importance: number, satisfaction: number): number {
  return importance + (importance - satisfaction);
}
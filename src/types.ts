export interface ExperienceAudit {
  score: number;
  aiLikelihood: string; // "High" | "Medium" | "Low"
  feedback: string;
  genericPhrasesFound: string[];
}

export interface StructureAudit {
  score: number;
  hookEvaluation: string;
  contextEvaluation: string;
  bodyEvaluation: string;
  takeawaysEvaluation: string;
  conclusionEvaluation: string;
}

export interface TechnicalAudit {
  score: number;
  feedback: string;
  suggestedFeatures: string[];
  codeAccuracyFeedback: string;
}

export interface SpecificRecommendation {
  type: string; // "structure" | "technical" | "experience" | "general"
  issue: string;
  suggestion: string;
  originalSnippet: string;
  suggestedRevision: string;
}

export interface ChecklistItem {
  item: string;
  status: string; // "met" | "missing" | "partial"
  details: string;
}

export interface AuditReport {
  score: number;
  wordCount: number;
  experienceAudit: ExperienceAudit;
  structureAudit: StructureAudit;
  technicalAudit: TechnicalAudit;
  specificRecommendations: SpecificRecommendation[];
  checklistReport: ChecklistItem[];
}

export interface SavedDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  score?: number;
}

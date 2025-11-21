
export enum GameRole {
  NONE = 'NONE',
  WORK_COACH = 'WORK_COACH',
  DECISION_MAKER = 'DECISION_MAKER',
  CASE_MANAGER = 'CASE_MANAGER'
}

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  GAMEPLAY = 'GAMEPLAY',
  SHIFT_END = 'SHIFT_END'
}

export interface ClaimantProfile {
  id: string;
  name: string;
  nino: string; // National Insurance Number format
  dateOfBirth: string; // DD/MM/YYYY
  address: string;
  details: string; // Initial circumstance summary
  sincerityScore: number; // Hidden metric 0-100
  mood: 'Agitated' | 'Despondent' | 'Evasive' | 'Polite';
  journal: string[]; // Past message history
}

export interface DialogueOption {
  id: string;
  text: string; // What the player says
  tone: 'Empathetic' | 'Direct' | 'Procedural';
}

export interface DialogueTurn {
  speaker: 'Player' | 'Claimant';
  text: string;
  mood?: string; // For claimant visual cues
}

export interface EvidenceItem {
  id: string;
  type: 'Bank Statement' | 'GP Letter' | 'Tenancy Agreement' | 'Universal Credit Journal' | 'Interview Record' | 'Tip-off';
  content: string;
  isValid: boolean;
}

export interface LegislativeClause {
  id: string;
  code: string; // e.g., REG-K1
  text: string;
  description: string;
}

export interface TimelineEvent {
  date: string;
  description: string;
}

export interface DecisionCase {
  id: string;
  title: string;
  description: string; // Brief internal description
  summary: string; // Plain English summary for the player
  timeline: TimelineEvent[];
  evidence: EvidenceItem[];
  clauses: LegislativeClause[];
  correctClauseId: string;
  correctEvidenceId: string; // The specific evidence that proves the clause applies
}

export interface TaskEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  urgency: 'Routine' | 'Urgent' | 'Escalation';
  actionRequired: 'Authorize' | 'Block' | 'Reply';
  value?: number;
}

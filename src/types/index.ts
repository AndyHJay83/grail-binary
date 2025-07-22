export type BinaryChoice = 'L' | 'R';

export interface WordList {
  id: string;
  name: string;
  words: string[];
  description?: string;
  isDefault?: boolean;
}

export interface LetterSequence {
  id: string;
  name: string;
  sequence: string;
  isDefault?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  exportPreferences: {
    defaultFilename: string;
    includeTimestamp: boolean;
  };
  selectedLetterSequence: string;
  originalLetterSequence: string; // NEW: Store the user's original choice
  mostFrequentFilter: boolean;
  selectedWordListId: string;
  confirmNoLetter: boolean;
  // NEW: Psychological profiling preferences
  psychologicalProfiling: {
    enabled: boolean;
    questions: PresetQuestion[];
  };
}

// NEW: Types for psychological profiling
export interface PresetQuestion {
  id: string;
  text: string;
  enabled: boolean;
  order: number;
}

export interface PsychologicalProfile {
  questions: PresetQuestion[];
  answers: { [questionId: string]: { person1: BinaryChoice; person2: BinaryChoice } };
  decodedProfile: string[];
}

export interface FilterState {
  currentLetter: string;
  sequence: BinaryChoice[];
  leftWords: string[];
  rightWords: string[];
  letterIndex: number;
  usedLetters: Set<string>;
  dynamicSequence: string[];
  isDynamicMode: boolean;
  sideOfferLetter?: string;
  confirmedSide?: 'L' | 'R';
  confirmedSideValue?: 'YES' | 'NO';
  // NEW: Psychological profiling state
  psychologicalQuestions?: PresetQuestion[];
  psychologicalAnswers?: { [questionId: string]: { person1: BinaryChoice; person2: BinaryChoice } };
  psychologicalProfile?: PsychologicalProfile;
}

export interface AppState {
  selectedWordList: WordList | null;
  filterState: FilterState;
  userPreferences: UserPreferences;
}

export interface WordListCard {
  id: string;
  name: string;
  wordCount: number;
  preview: string[];
  description?: string;
} 
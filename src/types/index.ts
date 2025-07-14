export interface LetterSequence {
  id: string;
  name: string;
  sequence: string;
  isDefault: boolean;
}

export interface WordList {
  id: string;
  name: string;
  words: string[];
  description?: string;
}

export interface FilterState {
  currentLetter: string;
  sequence: ('L' | 'R')[];
  leftWords: string[];
  rightWords: string[];
  letterIndex: number;
}

export interface AppState {
  selectedWordList: WordList | null;
  filterState: FilterState;
  userPreferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  defaultWordListId?: string;
  exportPreferences: {
    defaultFilename: string;
    includeTimestamp: boolean;
  };
  selectedLetterSequence: string; // ID of the selected sequence
}

export type BinaryChoice = 'L' | 'R';

export interface WordListCard {
  id: string;
  name: string;
  wordCount: number;
  preview: string[];
  description?: string;
} 
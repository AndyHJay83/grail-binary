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
  isDefault?: boolean;
}

export interface FilterState {
  currentLetter: string;
  sequence: ('L' | 'R')[];
  leftWords: string[];
  rightWords: string[];
  letterIndex: number;
  usedLetters: Set<string>;
  dynamicSequence: string[];
  isDynamicMode: boolean;
  sideOfferLetter?: string; // NEW: Letter offered for side confirmation
  confirmedSide?: 'L' | 'R'; // NEW: Which side is confirmed as NO
  confirmedSideValue?: 'YES' | 'NO'; // NEW: What the confirmed side represents
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
  mostFrequentFilter: boolean; // NEW: Toggle for dynamic letter selection
  selectedWordListId?: string; // ID of the selected word list
  confirmNoLetter: boolean; // NEW: Toggle for side confirmation feature
}

export type BinaryChoice = 'L' | 'R';

export interface WordListCard {
  id: string;
  name: string;
  wordCount: number;
  preview: string[];
  description?: string;
} 
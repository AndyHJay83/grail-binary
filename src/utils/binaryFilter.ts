import { BinaryChoice } from '../types';

// Default alphabet for fallback
const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface FilterResult {
  leftWords: string[];
  rightWords: string[];
  leftCount: number;
  rightCount: number;
  currentLetter: string;
  letterIndex: number;
  isComplete: boolean;
  sequence: ('L' | 'R')[];
}

export const filterWords = (
  wordList: string[],
  sequence: BinaryChoice[],
  currentLetterIndex: number,
  letterSequence: string = DEFAULT_ALPHABET
): FilterResult => {
  const currentLetter = letterSequence[currentLetterIndex] || '';
  const isComplete = currentLetterIndex >= letterSequence.length;

  if (sequence.length === 0) {
    return {
      leftWords: wordList,
      rightWords: wordList,
      leftCount: wordList.length,
      rightCount: wordList.length,
      currentLetter,
      letterIndex: currentLetterIndex,
      isComplete,
      sequence
    };
  }

  // For each word, determine if it matches the user's binary pattern
  const leftWords: string[] = [];
  const rightWords: string[] = [];

  wordList.forEach(word => {
    const upperWord = word.toUpperCase();
    let matchesLeftPattern = true;
    let matchesRightPattern = true;

    // Check each letter in the sequence
    for (let i = 0; i < sequence.length; i++) {
      const letter = letterSequence[i];
      const choice = sequence[i];
      const hasLetter = upperWord.includes(letter);

      // Left pattern: L choice means include letter, R choice means exclude letter
      if (choice === 'L' && !hasLetter) matchesLeftPattern = false;
      if (choice === 'R' && hasLetter) matchesLeftPattern = false;

      // Right pattern: R choice means include letter, L choice means exclude letter  
      if (choice === 'R' && !hasLetter) matchesRightPattern = false;
      if (choice === 'L' && hasLetter) matchesRightPattern = false;
    }

    // Add word to appropriate list(s)
    if (matchesLeftPattern) leftWords.push(word);
    if (matchesRightPattern) rightWords.push(word);
  });

  return {
    leftWords,
    rightWords,
    leftCount: leftWords.length,
    rightCount: rightWords.length,
    currentLetter,
    letterIndex: currentLetterIndex,
    isComplete,
    sequence
  };
};

export const getBackgroundColor = (count: number, totalCount: number): string => {
  const percentage = count / totalCount;
  
  if (percentage <= 0.1) return 'bg-success-green'; // Light green for fewer words
  if (percentage >= 0.5) return 'bg-warning-red'; // Light red for more words
  return 'bg-black'; // Default black
};

export const getNextLetter = (currentIndex: number, letterSequence: string = DEFAULT_ALPHABET): string => {
  if (currentIndex >= letterSequence.length - 1) {
    return '';
  }
  return letterSequence[currentIndex + 1];
};

export const isFilterComplete = (sequence: BinaryChoice[], letterSequence: string = DEFAULT_ALPHABET): boolean => {
  return sequence.length >= letterSequence.length;
};

export const resetFilter = (letterSequence: string = DEFAULT_ALPHABET): FilterResult => {
  return {
    leftWords: [],
    rightWords: [],
    leftCount: 0,
    rightCount: 0,
    currentLetter: letterSequence[0] || 'A',
    letterIndex: 0,
    isComplete: false,
    sequence: []
  };
}; 
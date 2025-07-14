import { BinaryChoice } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
  currentLetterIndex: number
): FilterResult => {
  const currentLetter = ALPHABET[currentLetterIndex];
  const isComplete = currentLetterIndex >= ALPHABET.length;

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

  const filterByPattern = (words: string[], includeOnLeft: boolean): string[] => {
    return words.filter(word => {
      const upperWord = word.toUpperCase();
      return sequence.every((choice, index) => {
        const letter = ALPHABET[index];
        const shouldInclude = includeOnLeft ? choice === 'L' : choice === 'R';
        const hasLetter = upperWord.includes(letter);
        return shouldInclude === hasLetter;
      });
    });
  };

  const leftWords = filterByPattern(wordList, true);
  const rightWords = filterByPattern(wordList, false);

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

export const getNextLetter = (currentIndex: number): string => {
  if (currentIndex >= ALPHABET.length - 1) {
    return '';
  }
  return ALPHABET[currentIndex + 1];
};

export const isFilterComplete = (sequence: BinaryChoice[]): boolean => {
  return sequence.length >= ALPHABET.length;
};

export const resetFilter = (): FilterResult => {
  return {
    leftWords: [],
    rightWords: [],
    leftCount: 0,
    rightCount: 0,
    currentLetter: 'A',
    letterIndex: 0,
    isComplete: false,
    sequence: []
  };
}; 
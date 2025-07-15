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
  letterSequence: string = DEFAULT_ALPHABET,
  dynamicSequence: string[] = []
): FilterResult => {
  // Determine the current letter based on whether we're in predefined or dynamic mode
  let currentLetter: string;
  let isComplete: boolean;
  
  // For "Most Frequent" sequence (empty letterSequence), use dynamic sequence for all letters
  if (letterSequence === '') {
    currentLetter = dynamicSequence[currentLetterIndex] || '';
    isComplete = currentLetterIndex >= dynamicSequence.length;
  } else if (currentLetterIndex < letterSequence.length) {
    // Still in predefined sequence
    currentLetter = letterSequence[currentLetterIndex] || '';
    isComplete = currentLetterIndex >= letterSequence.length;
  } else {
    // In dynamic mode (after predefined sequence)
    const dynamicIndex = currentLetterIndex - letterSequence.length;
    currentLetter = dynamicSequence[dynamicIndex] || '';
    isComplete = dynamicIndex >= dynamicSequence.length;
  }

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
      let letter: string;
      
      // For "Most Frequent" sequence (empty letterSequence), use dynamic sequence for all letters
      if (letterSequence === '') {
        letter = dynamicSequence[i] || '';
      } else if (i < letterSequence.length) {
        // Predefined sequence letter
        letter = letterSequence[i];
      } else {
        // Dynamic sequence letter (after predefined sequence)
        const dynamicIndex = i - letterSequence.length;
        letter = dynamicSequence[dynamicIndex] || '';
      }
      
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

// Analyze letter frequency in remaining words
export const analyzeLetterFrequency = (words: string[]): Map<string, number> => {
  const frequency = new Map<string, number>();
  
  for (const word of words) {
    for (const char of word.toUpperCase()) {
      if (char >= 'A' && char <= 'Z') {
        frequency.set(char, (frequency.get(char) || 0) + 1);
      }
    }
  }
  
  return frequency;
};

// Select next dynamic letter based on frequency
export const selectNextDynamicLetter = (
  words: string[], 
  usedLetters: Set<string>
): string | null => {
  console.log('selectNextDynamicLetter called with:', {
    wordsCount: words.length,
    usedLetters: Array.from(usedLetters),
    sampleWords: words.slice(0, 5)
  });
  
  if (words.length === 0) {
    console.log('No words to analyze - returning null');
    return null;
  }
  
  const frequency = analyzeLetterFrequency(words);
  
  console.log('Letter frequency:', Object.fromEntries(frequency));
  
  // Find most frequent unused letter (each letter can only be used once)
  let maxFreq = 0;
  let selectedLetter = null;
  
  for (const [letter, freq] of frequency) {
    // Skip letters we've already used
    if (usedLetters.has(letter)) {
      console.log('Skipping used letter:', letter);
      continue;
    }
    
    if (freq > maxFreq) {
      maxFreq = freq;
      selectedLetter = letter;
    }
  }
  
  console.log('Selected letter:', selectedLetter, 'with frequency:', maxFreq);
  return selectedLetter;
};

// Get next letter (predefined or dynamic)
export const getNextLetterWithDynamic = (
  currentIndex: number,
  letterSequence: string,
  remainingWords: string[],
  usedLetters: Set<string>,
  mostFrequentFilter: boolean
): { letter: string; isDynamic: boolean } => {
  console.log('getNextLetterWithDynamic:', {
    currentIndex,
    letterSequence,
    letterSequenceLength: letterSequence.length,
    remainingWordsCount: remainingWords.length,
    usedLetters: Array.from(usedLetters),
    mostFrequentFilter
  });
  
  // Special handling for "Most Frequent" sequence (empty sequence)
  if (letterSequence === '') {
    console.log('Detected empty sequence - using Most Frequent mode');
    console.log('Current index:', currentIndex, 'Used letters:', Array.from(usedLetters));
    const dynamicLetter = selectNextDynamicLetter(remainingWords, usedLetters);
    console.log('Selected dynamic letter:', dynamicLetter);
    return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
  }
  
  // If still within predefined sequence
  if (currentIndex < letterSequence.length) {
    const letter = letterSequence[currentIndex];
    console.log('Using predefined letter:', letter);
    return { letter, isDynamic: false };
  }
  
  // If most frequent filter is OFF, stop
  if (!mostFrequentFilter) {
    console.log('Most frequent filter OFF - stopping');
    return { letter: '', isDynamic: false };
  }
  
  // If most frequent filter is ON, find next dynamic letter
  const dynamicLetter = selectNextDynamicLetter(remainingWords, usedLetters);
  console.log('Using dynamic letter (after predefined):', dynamicLetter);
  return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
};

export const resetFilter = (letterSequence: string = DEFAULT_ALPHABET) => {
  // For "Most Frequent" sequence (empty), we need to get the first dynamic letter
  let currentLetter = letterSequence[0] || 'A';
  let isDynamicMode = false;
  
  if (letterSequence === '') {
    // This will be set properly when we have the word list
    currentLetter = 'A'; // Placeholder
    isDynamicMode = true;
  }
  
  return {
    leftWords: [],
    rightWords: [],
    leftCount: 0,
    rightCount: 0,
    currentLetter,
    letterIndex: 0,
    isComplete: false,
    sequence: [],
    usedLetters: new Set<string>(),
    dynamicSequence: [],
    isDynamicMode
  };
}; 
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

  // DISABLED: Confirmed side filtering logic - now using "no duplicate letters" approach
  // The confirmed side logic was causing all words to be rejected because it was
  // applying the confirmed interpretation to ALL letters in the sequence history
  // Instead, we now use the "no duplicate letters" rule to prevent conflicts
  
  // Original dual-interpretation logic for when no side is confirmed

  // Original dual-interpretation logic for when no side is confirmed
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
        // Use the full dynamic sequence, not just the remaining part
        letter = dynamicSequence[i] || '';
      }
      
      const choice = sequence[i];
      
      // Skip empty letters - they shouldn't be processed
      if (!letter || letter === '') {
        continue;
      }
      
      const hasLetter = upperWord.includes(letter);

      // Left pattern: L choice means include letter, R choice means exclude letter
      if (choice === 'L' && !hasLetter) {
        matchesLeftPattern = false;
      }
      if (choice === 'R' && hasLetter) {
        matchesLeftPattern = false;
      }

      // Right pattern: R choice means include letter, L choice means exclude letter  
      if (choice === 'R' && !hasLetter) {
        matchesRightPattern = false;
      }
      if (choice === 'L' && hasLetter) {
        matchesRightPattern = false;
      }
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

export const getBackgroundColor = (count: number): string => {
  if (count === 1) return 'bg-success-green'; // Green for single word
  if (count >= 2 && count <= 5) return 'bg-orange-400'; // Orange for 2-5 words
  if (count >= 6 && count <= 10) return 'bg-red-400'; // Light red for 6-10 words
  return 'bg-black'; // Default black for 11+ words
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
    words,
    usedLetters: Array.from(usedLetters),
    wordCount: words.length
  });
  
  if (words.length === 0) {
    console.log('selectNextDynamicLetter: No words provided, returning null');
    return null;
  }
  
  // If we have very few words left (5 or fewer), try to find a differentiating letter
  if (words.length <= 5) {
    console.log('selectNextDynamicLetter: 5 or fewer words detected, using smart selection');
    // Get all unique letters from the remaining words
    const lettersInWords = new Set<string>();
    for (const word of words) {
      for (const char of word.toUpperCase()) {
        if (char >= 'A' && char <= 'Z') {
          lettersInWords.add(char);
        }
      }
    }
    
    // First, try to find a letter that appears in exactly one word (perfect differentiation)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of alphabet) {
      if (usedLetters.has(letter)) {
        continue; // Skip already used letters
      }
      
      // Check if this letter appears in exactly one of the words
      let wordsWithLetter = 0;
      for (const word of words) {
        if (word.toUpperCase().includes(letter)) {
          wordsWithLetter++;
        }
      }
      
      // If the letter appears in exactly one word, it's perfect for differentiation
      if (wordsWithLetter === 1) {
        console.log(`Smart selection: Found perfect differentiating letter '${letter}' for ${words.length} words`);
        return letter;
      }
    }
    
    // If no perfect differentiating letter found, look for any unused letter that appears in the words
    for (const letter of lettersInWords) {
      if (!usedLetters.has(letter)) {
        console.log(`Smart selection: Found unused letter '${letter}' from words for ${words.length} words`);
        return letter;
      }
    }
    
    // If all letters in the words have been used, try to find a letter that can help differentiate
    // by checking which letters appear in different combinations
    for (const letter of alphabet) {
      if (usedLetters.has(letter)) {
        continue;
      }
      
      // Check if this letter would help differentiate the words
      let wordsWithLetter = 0;
      for (const word of words) {
        if (word.toUpperCase().includes(letter)) {
          wordsWithLetter++;
        }
      }
      
      // If the letter appears in some but not all words, it can help differentiate
      if (wordsWithLetter > 0 && wordsWithLetter < words.length) {
        console.log(`Smart selection: Found differentiating letter '${letter}' (${wordsWithLetter}/${words.length} words) for ${words.length} words`);
        return letter;
      }
    }
    
    // If we still can't find a useful letter, return null to indicate completion
    console.log(`Smart selection: No useful letter found for ${words.length} words. All letters used or no differentiation possible.`);
    return null;
  }
  
  const frequency = analyzeLetterFrequency(words);
  
  // Find most frequent unused letter (each letter can only be used once)
  let maxFreq = 0;
  let selectedLetter = null;
  
  for (const [letter, freq] of frequency) {
    // Skip letters we've already used
    if (usedLetters.has(letter)) {
      continue;
    }
    
    if (freq > maxFreq) {
      maxFreq = freq;
      selectedLetter = letter;
    }
  }
  
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
  // Special handling for "Most Frequent" sequence (empty sequence)
  if (letterSequence === '') {
    const dynamicLetter = selectNextDynamicLetter(remainingWords, usedLetters);
    return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
  }
  
  // If still within predefined sequence
  if (currentIndex < letterSequence.length) {
    const letter = letterSequence[currentIndex];
    
    // Check if this letter is already used
    if (usedLetters.has(letter)) {
      // Skip to next unused letter in sequence
      for (let i = currentIndex + 1; i < letterSequence.length; i++) {
        const nextLetter = letterSequence[i];
        if (!usedLetters.has(nextLetter)) {
          return { letter: nextLetter, isDynamic: false };
        }
      }
      
      // If all predefined letters are used, switch to dynamic
      const dynamicLetter = selectNextDynamicLetter(remainingWords, usedLetters);
      return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
    }
    
    return { letter, isDynamic: false };
  }
  
  // If most frequent filter is OFF, stop
  if (!mostFrequentFilter) {
    return { letter: '', isDynamic: false };
  }
  
  // If most frequent filter is ON, find next dynamic letter
  const dynamicLetter = selectNextDynamicLetter(remainingWords, usedLetters);
  return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
};

export const resetFilter = (letterSequence: string = DEFAULT_ALPHABET) => {
  // For "Most Frequent" sequence (empty), we need to get the first dynamic letter
  let currentLetter = letterSequence[0] || '';
  let isDynamicMode = false;
  
  if (letterSequence === '') {
    // This will be set properly when we have the word list
    currentLetter = ''; // No placeholder - will be set when we have words
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
    isDynamicMode,
    sideOfferLetter: undefined,
    confirmedSide: undefined,
    confirmedSideValue: undefined
  };
};

// Find a letter that doesn't appear in any of the remaining words (for side offer)
export const findSideOfferLetter = (words: string[], usedLetters: Set<string> = new Set()): string | null => {
  if (words.length === 0) {
    return null;
  }
  
  // Get all unique letters from all words
  const lettersInWords = new Set<string>();
  for (const word of words) {
    for (const char of word.toUpperCase()) {
      if (char >= 'A' && char <= 'Z') {
        lettersInWords.add(char);
      }
    }
  }
  
  // Find first alphabetical letter that's not in any words AND not already used (excluding X and Z)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWY'; // Excluding X and Z
  
  for (const letter of alphabet) {
    if (!lettersInWords.has(letter) && !usedLetters.has(letter)) {
      return letter;
    }
  }
  
  return null; // No suitable letter found
}; 
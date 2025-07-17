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

  console.log('=== FILTERING DEBUG ===');
  console.log('Word list length:', wordList.length);
  console.log('Sequence length:', sequence.length);
  console.log('Letter sequence:', letterSequence);
  console.log('Dynamic sequence:', dynamicSequence);
  console.log('Current letter index:', currentLetterIndex);

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
        console.log(`  Word "${word}": skipping empty letter at position ${i}`);
        continue;
      }
      
      const hasLetter = upperWord.includes(letter);

      console.log(`  Word "${word}": choice=${choice}, letter=${letter}, hasLetter=${hasLetter}`);

      // Left pattern: L choice means include letter, R choice means exclude letter
      if (choice === 'L' && !hasLetter) {
        console.log(`    Rejecting from left: L=YES but word doesn't have ${letter}`);
        matchesLeftPattern = false;
      }
      if (choice === 'R' && hasLetter) {
        console.log(`    Rejecting from left: R=NO but word has ${letter}`);
        matchesLeftPattern = false;
      }

      // Right pattern: R choice means include letter, L choice means exclude letter  
      if (choice === 'R' && !hasLetter) {
        console.log(`    Rejecting from right: R=YES but word doesn't have ${letter}`);
        matchesRightPattern = false;
      }
      if (choice === 'L' && hasLetter) {
        console.log(`    Rejecting from right: L=NO but word has ${letter}`);
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
    wordsCount: words.length,
    usedLetters: Array.from(usedLetters),
    sampleWords: words.slice(0, 5)
  });
  
  if (words.length === 0) {
    console.log('No words to analyze - returning null');
    return null;
  }
  
  // If we have very few words left (5 or fewer), try to find a differentiating letter
  if (words.length <= 5) {
    console.log('Very few words left (5 or fewer) - looking for differentiating letter');
    
    // Get all unique letters from the remaining words
    const lettersInWords = new Set<string>();
    for (const word of words) {
      for (const char of word.toUpperCase()) {
        if (char >= 'A' && char <= 'Z') {
          lettersInWords.add(char);
        }
      }
    }
    
    console.log('Letters in remaining words:', Array.from(lettersInWords).sort());
    
    // Check each letter in the alphabet to see if it can differentiate the words
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
        console.log('Found perfect differentiating letter:', letter);
        return letter;
      }
    }
    
    // If no perfect differentiating letter found, look for any unused letter that appears in the words
    for (const letter of lettersInWords) {
      if (!usedLetters.has(letter)) {
        console.log('Found unused letter in words:', letter);
        return letter;
      }
    }
    
    // If no unused letters found in the words, offer any unused letter from the alphabet
    const fullAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of fullAlphabet) {
      if (!usedLetters.has(letter)) {
        console.log('Found unused letter from alphabet:', letter);
        return letter;
      }
    }
    
    console.log('No suitable differentiating letter found');
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
  console.log('Used letters after selection:', Array.from(usedLetters));
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
    
    // Check if this letter is already used
    if (usedLetters.has(letter)) {
      console.log('Predefined letter already used:', letter, '- skipping to next unused letter');
      
      // Skip to next unused letter in sequence
      for (let i = currentIndex + 1; i < letterSequence.length; i++) {
        const nextLetter = letterSequence[i];
        if (!usedLetters.has(nextLetter)) {
          console.log('Using next unused predefined letter:', nextLetter);
          return { letter: nextLetter, isDynamic: false };
        }
      }
      
      // If all predefined letters are used, switch to dynamic
      console.log('All predefined letters used, switching to dynamic');
      const dynamicLetter = selectNextDynamicLetter(remainingWords, usedLetters);
      return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
    }
    
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
  console.log('=== findSideOfferLetter called ===');
  console.log('Words to analyze:', words);
  console.log('Used letters:', Array.from(usedLetters));
  
  if (words.length === 0) {
    console.log('No words provided - returning null');
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
  
  console.log('Letters found in words:', Array.from(lettersInWords).sort());
  
  // Find first alphabetical letter that's not in any words AND not already used (excluding X and Z)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWY'; // Excluding X and Z
  console.log('Checking alphabet:', alphabet);
  
  for (const letter of alphabet) {
    if (!lettersInWords.has(letter) && !usedLetters.has(letter)) {
      console.log('Found unused letter:', letter);
      return letter;
    }
  }
  
  console.log('No suitable letter found - all letters A-W, Y are present or already used');
  return null; // No suitable letter found
}; 
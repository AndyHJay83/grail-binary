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
  dynamicSequence: string[] = [],
  confirmedSide?: 'L' | 'R',
  confirmedSideValue?: 'YES' | 'NO'
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

  // CRITICAL FIX: For Most Frequent mode, ensure we have a working dynamic sequence
  // that includes the current letter if it's missing
  let workingDynamicSequence = [...dynamicSequence];
  if (letterSequence === '' && currentLetter && !workingDynamicSequence.includes(currentLetter)) {
    // Add the current letter to the working sequence if it's missing
    workingDynamicSequence.push(currentLetter);
  }

  // If a side is confirmed, use simple YES/NO filtering
  if (confirmedSide && confirmedSideValue) {
    console.log('Using confirmed side filtering:', { confirmedSide, confirmedSideValue });
    
    // Apply simple YES/NO filtering based on the confirmed side
    const filteredWords: string[] = [];
    
    wordList.forEach(word => {
      const upperWord = word.toUpperCase();
      let matchesPattern = true;
      
      // Check each letter in the sequence
      for (let i = 0; i < sequence.length; i++) {
        let letter: string;
        
        // For "Most Frequent" sequence (empty letterSequence), use working dynamic sequence for all letters
        if (letterSequence === '') {
          letter = workingDynamicSequence[i] || '';
        } else if (i < letterSequence.length) {
          // Predefined sequence letter
          letter = letterSequence[i];
        } else {
          // Dynamic sequence letter (after predefined sequence)
          const dynamicIndex = i - letterSequence.length;
          letter = workingDynamicSequence[dynamicIndex] || '';
        }
        
        const choice = sequence[i];
        const hasLetter = upperWord.includes(letter);
        
        // Apply confirmed side logic only to actual user choices
        // The side offer letter that was confirmed as NO should be excluded entirely
        if (confirmedSide && confirmedSideValue) {
          console.log(`Filtering word "${word}": letter="${letter}", choice="${choice}", hasLetter=${hasLetter}, confirmedSide=${confirmedSide}, confirmedSideValue=${confirmedSideValue}`);
          
          // Skip the side offer letter that was confirmed as NO
          // This letter should be excluded from consideration entirely
          // const isSideOfferLetter = false; // We'll determine this based on the sequence context
          
          if (confirmedSide === 'R' && confirmedSideValue === 'NO') {
            // R=NO, L=YES interpretation
            if (choice === 'R' && hasLetter) {
              console.log(`  Rejecting: R=NO but word has letter ${letter}`);
              matchesPattern = false;
            }
            if (choice === 'L' && !hasLetter) {
              console.log(`  Rejecting: L=YES but word doesn't have letter ${letter}`);
              matchesPattern = false;
            }
          } else if (confirmedSide === 'L' && confirmedSideValue === 'NO') {
            // L=NO, R=YES interpretation
            if (choice === 'L' && hasLetter) {
              console.log(`  Rejecting: L=NO but word has letter ${letter}`);
              matchesPattern = false;
            }
            if (choice === 'R' && !hasLetter) {
              console.log(`  Rejecting: R=YES but word doesn't have letter ${letter}`);
              matchesPattern = false;
            }
          } else if (confirmedSide === 'R' && confirmedSideValue === 'YES') {
            // R=YES, L=NO interpretation
            if (choice === 'R' && !hasLetter) {
              console.log(`  Rejecting: R=YES but word doesn't have letter ${letter}`);
              matchesPattern = false;
            }
            if (choice === 'L' && hasLetter) {
              console.log(`  Rejecting: L=NO but word has letter ${letter}`);
              matchesPattern = false;
            }
          } else if (confirmedSide === 'L' && confirmedSideValue === 'YES') {
            // L=YES, R=NO interpretation
            if (choice === 'L' && !hasLetter) {
              console.log(`  Rejecting: L=YES but word doesn't have letter ${letter}`);
              matchesPattern = false;
            }
            if (choice === 'R' && hasLetter) {
              console.log(`  Rejecting: R=NO but word has letter ${letter}`);
              matchesPattern = false;
            }
          }
        } else {
          // No confirmed side, use normal dual-interpretation logic
          if (choice === 'L' && !hasLetter) matchesPattern = false;
          if (choice === 'R' && hasLetter) matchesPattern = false;
        }
      }
      
      if (matchesPattern) filteredWords.push(word);
    });
    
    // Return only the correct interpretation based on confirmed side
    // When R is confirmed as NO, L becomes YES, so show left words
    // When L is confirmed as NO, R becomes YES, so show right words
    if ((confirmedSide === 'R' && confirmedSideValue === 'NO') || 
        (confirmedSide === 'L' && confirmedSideValue === 'YES')) {
      // Show left words (L=YES interpretation)
      return {
        leftWords: filteredWords,
        rightWords: [],
        leftCount: filteredWords.length,
        rightCount: 0,
        currentLetter,
        letterIndex: currentLetterIndex,
        isComplete,
        sequence
      };
    } else {
      // Show right words (R=YES interpretation)
      return {
        leftWords: [],
        rightWords: filteredWords,
        leftCount: 0,
        rightCount: filteredWords.length,
        currentLetter,
        letterIndex: currentLetterIndex,
        isComplete,
        sequence
      };
    }
  }

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
      
      // For "Most Frequent" sequence (empty letterSequence), use working dynamic sequence for all letters
      if (letterSequence === '') {
        letter = workingDynamicSequence[i] || '';
      } else if (i < letterSequence.length) {
        // Predefined sequence letter
        letter = letterSequence[i];
      } else {
        // Dynamic sequence letter (after predefined sequence)
        const dynamicIndex = i - letterSequence.length;
        letter = workingDynamicSequence[dynamicIndex] || '';
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
    isDynamicMode,
    sideOfferLetter: undefined,
    confirmedSide: undefined,
    confirmedSideValue: undefined
  };
};

// Find a letter that doesn't appear in any of the remaining words (for side offer)
export const findSideOfferLetter = (words: string[]): string | null => {
  console.log('=== findSideOfferLetter called ===');
  console.log('Words to analyze:', words);
  
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
  
  // Find first alphabetical letter that's not in any words (excluding X and Z)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWY'; // Excluding X and Z
  console.log('Checking alphabet:', alphabet);
  
  for (const letter of alphabet) {
    if (!lettersInWords.has(letter)) {
      console.log('Found missing letter:', letter);
      return letter;
    }
  }
  
  console.log('No suitable letter found - all letters A-W, Y are present');
  return null; // No suitable letter found
}; 
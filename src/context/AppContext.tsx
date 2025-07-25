import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, WordList, UserPreferences, BinaryChoice, PresetQuestion } from '../types';
import { filterWords, resetFilter, getNextLetterWithDynamic } from '../utils/binaryFilter';

import { getAllWordLists, getWordListById } from '../data/wordListManager';
import { getSequenceById } from '../data/letterSequences';

interface AppAction {
  type: string;
  payload?: any;
}

const initialState: AppState = {
  selectedWordList: null,
  filterState: {
    currentLetter: 'A',
    sequence: [],
    leftWords: [],
    rightWords: [],
    letterIndex: 0,
    usedLetters: new Set<string>(),
    dynamicSequence: [],
    isDynamicMode: false
  },
  userPreferences: {
    theme: 'dark',
    exportPreferences: {
      defaultFilename: 'WORDLIST-RESULTS',
      includeTimestamp: false
    },
    selectedLetterSequence: 'full-alphabet',
    originalLetterSequence: 'full-alphabet', // NEW: Store the original choice
    mostFrequentFilter: true, // Default to ON
    selectedWordListId: 'en-uk', // Default to EN-UK
    confirmNoLetter: true, // NEW: Default to ON
    // NEW: Psychological profiling preferences
    psychologicalProfiling: {
      enabled: false, // Default to OFF
      questions: [
        {
          id: 'q1',
          text: 'Are you Person 1?',
          enabled: false,
          order: 1
        },
        {
          id: 'q2',
          text: 'Are you Person 2?',
          enabled: false,
          order: 2
        },
        {
          id: 'q3',
          text: 'Do you prefer Left choices?',
          enabled: false,
          order: 3
        },
        {
          id: 'q4',
          text: 'Do you prefer Right choices?',
          enabled: false,
          order: 4
        },
        {
          id: 'q5',
          text: 'Are you the active performer?',
          enabled: false,
          order: 5
        }
      ]
    }
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_WORD_LIST': {
      const selectSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const selectLetterSequence = selectSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      console.log('[DEBUG] SELECT_WORD_LIST: selectedLetterSequence:', state.userPreferences.selectedLetterSequence, '->', selectSequence);
      const selectFilterResult = resetFilter(selectLetterSequence);
      return {
        ...state,
        filterState: {
          ...selectFilterResult,
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    }
    
    case 'MAKE_BINARY_CHOICE':
      const { choice } = action.payload;
      const newSequence = [...state.filterState.sequence, choice];
      const newLetterIndex = state.filterState.letterIndex + 1;
      
      // FIX: Use the current selected letter sequence instead of the original
      const currentSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const currentLetterSequence = currentSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // Check if we're still within the current sequence bounds
      const hasMoreCurrentLetters = newLetterIndex < currentLetterSequence.length;
      
      let letterSequence: string;
      
      // Apply the current choice to get the remaining words first
      const tempFilterResult = state.selectedWordList 
        ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, currentLetterSequence, state.filterState.dynamicSequence)
        : resetFilter();
      const wordsForAnalysis = [...tempFilterResult.leftWords, ...tempFilterResult.rightWords];
      
      // NEW: Check if we have 5 or fewer words and should switch to smart mode
      const hasFewWords = wordsForAnalysis.length <= 5;
      
      if (hasFewWords) {
        // Switch to smart mode when we have 5 or fewer words
        console.log('MAKE_BINARY_CHOICE: 5 or fewer words detected, switching to smart mode');
        letterSequence = ''; // Empty sequence for smart mode
      } else if (hasMoreCurrentLetters) {
        // Continue with current sequence
        letterSequence = currentLetterSequence;
      } else {
        // Current sequence exhausted - use Most Frequent mode
        letterSequence = ''; // Empty sequence for Most Frequent mode
      }
      
      // Get current letter
      const currentLetter = state.filterState.currentLetter;
      
      // FIX: For Most Frequent mode, we need to handle the transition differently
      // The issue is that we're trying to determine the next letter before properly applying the current choice
      let nextLetterInfo: { letter: string; isDynamic: boolean };
      
      // Re-apply the current choice with the correct letter sequence
      const finalTempFilterResult = state.selectedWordList 
        ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, letterSequence, state.filterState.dynamicSequence)
        : resetFilter();
      const finalWordsForAnalysis = [...finalTempFilterResult.leftWords, ...finalTempFilterResult.rightWords];
      

      
      // Create a temporary used letters set that includes the current letter for frequency analysis
      const tempUsedLetters = new Set(state.filterState.usedLetters);
      tempUsedLetters.add(currentLetter);
      
      // Get next letter based on Smart Hybrid logic
      if (letterSequence === '') {
        // Smart mode or Most Frequent mode
        nextLetterInfo = getNextLetterWithDynamic(
          newSequence.length, // Use sequence length as index for Most Frequent
          '', // Empty sequence for Most Frequent
          finalWordsForAnalysis,
          tempUsedLetters,
          state.userPreferences.mostFrequentFilter
        );
      } else {
        // Original sequence mode
        nextLetterInfo = getNextLetterWithDynamic(
          newLetterIndex,
          letterSequence,
          finalWordsForAnalysis,
          tempUsedLetters,
          state.userPreferences.mostFrequentFilter
        );
      }
      
      // Add current letter to used letters AFTER getting the next letter
      const newUsedLetters = new Set(state.filterState.usedLetters);
      newUsedLetters.add(currentLetter);
      
      // Update dynamic sequence if needed
      const newDynamicSequence = [...state.filterState.dynamicSequence];
      
      // Add the current letter to the dynamic sequence (the letter the user just chose)
      if (currentLetter && !newDynamicSequence.includes(currentLetter)) {
        newDynamicSequence.push(currentLetter);
      }
      
      // Add the next letter if it's dynamic
      if (nextLetterInfo.isDynamic && nextLetterInfo.letter) {
        // Only add if not already in the sequence
        if (!newDynamicSequence.includes(nextLetterInfo.letter)) {
          newDynamicSequence.push(nextLetterInfo.letter);
        }
      }
      
      // Now get the filtered words for the current state
      const currentFilterResult = state.selectedWordList 
        ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, letterSequence, newDynamicSequence)
        : resetFilter();
      
      // Check if we need to switch to Most Frequent mode and update preferences accordingly
      let updatedPreferences = state.userPreferences;
      if (letterSequence === '' && state.userPreferences.selectedLetterSequence !== 'most-frequent') {
        // Sequence exhausted - switch to Most Frequent mode while preserving original choice
        updatedPreferences = {
          ...state.userPreferences,
          selectedLetterSequence: 'most-frequent'
        };
      }
      
      return {
        ...state,
        userPreferences: updatedPreferences,
        filterState: {
          currentLetter: nextLetterInfo.letter || '', // Allow empty letters when no more letters to offer
          sequence: newSequence,
          leftWords: currentFilterResult.leftWords,
          rightWords: currentFilterResult.rightWords,
          letterIndex: newLetterIndex,
          usedLetters: newUsedLetters,
          dynamicSequence: newDynamicSequence,
          isDynamicMode: nextLetterInfo.isDynamic,
          sideOfferLetter: state.filterState.sideOfferLetter,
          confirmedSide: undefined, // Clear confirmed side when making a new binary choice
          confirmedSideValue: undefined, // Clear confirmed side value when making a new binary choice
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    
    case 'SET_SELECTED_WORD_LIST':
      const setSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const setLetterSequence = setSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const resetResult = resetFilter(setLetterSequence);
      
      // Special handling for "Most Frequent" sequence
      let setCurrentLetter = resetResult.currentLetter;
      let setIsDynamicMode = resetResult.isDynamicMode;
      
      if (setLetterSequence === '' && action.payload?.words.length > 0) {
        // For "Most Frequent" sequence, we'll get the first letter in the component
        // For now, use a placeholder that will be updated
        setCurrentLetter = ''; // Will be updated when component loads
        setIsDynamicMode = true;
      }
      
      return {
        ...state,
        selectedWordList: action.payload,
        filterState: {
          currentLetter: setCurrentLetter,
          sequence: resetResult.sequence,
          leftWords: resetResult.leftWords,
          rightWords: resetResult.rightWords,
          letterIndex: resetResult.letterIndex,
          usedLetters: resetResult.usedLetters,
          dynamicSequence: resetResult.dynamicSequence,
          isDynamicMode: setIsDynamicMode,
          sideOfferLetter: resetResult.sideOfferLetter,
          confirmedSide: resetResult.confirmedSide, // RESTORED: Needed for long press functionality
          confirmedSideValue: resetResult.confirmedSideValue, // RESTORED: Needed for long press functionality
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    
    case 'RESET_FILTER':
      // Always use the original letter sequence for reset to restore user's choice
      // If we're currently on Most Frequent, restore the original sequence
      const sequenceToUse = state.userPreferences.selectedLetterSequence === 'most-frequent' 
        ? state.userPreferences.originalLetterSequence 
        : state.userPreferences.selectedLetterSequence;
      const resetSequence = getSequenceById(sequenceToUse);
      const resetLetterSequence = resetSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const resetFilterResult = resetFilter(resetLetterSequence);
      
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          selectedLetterSequence: sequenceToUse
        },
        filterState: {
          currentLetter: resetFilterResult.currentLetter,
          sequence: resetFilterResult.sequence,
          leftWords: resetFilterResult.leftWords,
          rightWords: resetFilterResult.rightWords,
          letterIndex: resetFilterResult.letterIndex,
          usedLetters: resetFilterResult.usedLetters,
          dynamicSequence: resetFilterResult.dynamicSequence,
          isDynamicMode: resetFilterResult.isDynamicMode,
          sideOfferLetter: resetFilterResult.sideOfferLetter,
          confirmedSide: resetFilterResult.confirmedSide, // RESTORED: Needed for long press functionality
          confirmedSideValue: resetFilterResult.confirmedSideValue, // RESTORED: Needed for long press functionality
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };
    
    case 'UPDATE_LETTER_SEQUENCE': {
      const updateSequence = getSequenceById(action.payload);
      const updateLetterSequence = updateSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      console.log('[DEBUG] UPDATE_LETTER_SEQUENCE: action.payload:', action.payload, '->', updateSequence);
      const updateFilterResult = resetFilter(updateLetterSequence);
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          selectedLetterSequence: action.payload
        },
        filterState: {
          currentLetter: updateFilterResult.currentLetter,
          sequence: updateFilterResult.sequence,
          leftWords: updateFilterResult.leftWords,
          rightWords: updateFilterResult.rightWords,
          letterIndex: updateFilterResult.letterIndex,
          usedLetters: updateFilterResult.usedLetters,
          dynamicSequence: updateFilterResult.dynamicSequence,
          isDynamicMode: updateFilterResult.isDynamicMode,
          sideOfferLetter: updateFilterResult.sideOfferLetter,
          confirmedSide: updateFilterResult.confirmedSide, // RESTORED: Needed for long press functionality
          confirmedSideValue: updateFilterResult.confirmedSideValue, // RESTORED: Needed for long press functionality
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    }
    case 'SET_DEFAULT_LETTER_SEQUENCE': {
      const updateSequence = getSequenceById(action.payload);
      const updateLetterSequence = updateSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      console.log('[DEBUG] SET_DEFAULT_LETTER_SEQUENCE: action.payload:', action.payload, '->', updateSequence);
      const updateFilterResult = resetFilter(updateLetterSequence);
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          selectedLetterSequence: action.payload,
          originalLetterSequence: action.payload
        },
        filterState: {
          currentLetter: updateFilterResult.currentLetter,
          sequence: updateFilterResult.sequence,
          leftWords: updateFilterResult.leftWords,
          rightWords: updateFilterResult.rightWords,
          letterIndex: updateFilterResult.letterIndex,
          usedLetters: updateFilterResult.usedLetters,
          dynamicSequence: updateFilterResult.dynamicSequence,
          isDynamicMode: updateFilterResult.isDynamicMode,
          sideOfferLetter: updateFilterResult.sideOfferLetter,
          confirmedSide: updateFilterResult.confirmedSide, // RESTORED: Needed for long press functionality
          confirmedSideValue: updateFilterResult.confirmedSideValue, // RESTORED: Needed for long press functionality
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    }
    
    case 'INITIALIZE_MOST_FREQUENT':
      // REMOVE all logic from here, handled in provider
      return state;
    case 'SET_MOST_FREQUENT_INITIALIZED': {
      const { firstLetter } = action.payload;
      
      // Only initialize if we don't already have used letters
      const usedLetters = state.filterState.usedLetters.size > 0 
        ? state.filterState.usedLetters 
        : (firstLetter ? new Set<string>([firstLetter]) : new Set<string>());
      

      
      return {
        ...state,
        filterState: {
          ...state.filterState,
          currentLetter: firstLetter || '',
          dynamicSequence: firstLetter ? [firstLetter] : [],
          isDynamicMode: true,
          usedLetters: usedLetters,
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    }
    
    case 'SET_SIDE_OFFER_LETTER': {
      const { letter } = action.payload;
      return {
        ...state,
        filterState: {
          ...state.filterState,
          sideOfferLetter: letter,
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    }
    
    case 'CONFIRM_SIDE': {
      const { side, value } = action.payload;
      
      // Get the side offer letter before clearing it
      const sideOfferLetter = state.filterState.sideOfferLetter;
      
      // Add the side offer letter to the dynamic sequence ONLY if it was confirmed as YES
      const newDynamicSequence = [...state.filterState.dynamicSequence];
      const newUsedLetters = new Set(state.filterState.usedLetters);
      
      // Only add the side offer letter if it was confirmed as YES
      // If it was confirmed as NO, it should be excluded entirely
      if (sideOfferLetter && !newUsedLetters.has(sideOfferLetter)) {
        // Check if the side offer letter should be included based on the confirmation
        const shouldIncludeLetter = (side === 'R' && value === 'YES') || (side === 'L' && value === 'YES');
        
        if (shouldIncludeLetter) {
          newDynamicSequence.push(sideOfferLetter);
          newUsedLetters.add(sideOfferLetter);
        }
        // If confirmed as NO, don't add it to the sequence at all
      }
      
      // NEW: Eliminate words from the opposite side when a side is confirmed
      // This makes the filtering much more efficient by removing words we know won't be the target
      let wordsForAnalysis = state.selectedWordList?.words || [];
      
      // Apply the current sequence filtering to preserve the previous choices
      if (state.filterState.sequence.length > 0) {
        wordsForAnalysis = wordsForAnalysis.filter(word => {
          const upperWord = word.toUpperCase();
          for (let i = 0; i < state.filterState.sequence.length; i++) {
            // Get the letter from the original sequence (not the selected sequence which might have changed)
            const originalSequence = getSequenceById(state.userPreferences.originalLetterSequence);
            const letterSequence = originalSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const letter = letterSequence[i] || '';
            const choice = state.filterState.sequence[i];
            const hasLetter = upperWord.includes(letter);
            
            if (choice === 'L' && !hasLetter) return false;
            if (choice === 'R' && hasLetter) return false;
          }
          return true;
        });
      }
      
      // Now eliminate words from the opposite side based on the side confirmation
      let confirmedWords: string[] = [];
      let eliminatedWords: string[] = [];
      
      if (sideOfferLetter) {
        // Split words into confirmed and eliminated based on side confirmation
        wordsForAnalysis.forEach(word => {
          const upperWord = word.toUpperCase();
          const hasSideOfferLetter = upperWord.includes(sideOfferLetter);
          
          let shouldKeep = false;
          if (side === 'L' && value === 'YES') {
            // Left side confirmed as YES - keep words WITHOUT the side offer letter (current words)
            shouldKeep = !hasSideOfferLetter;
          } else if (side === 'L' && value === 'NO') {
            // Left side confirmed as NO - keep words WITHOUT the side offer letter (current words)
            shouldKeep = !hasSideOfferLetter;
          } else if (side === 'R' && value === 'YES') {
            // Right side confirmed as YES - keep words WITHOUT the side offer letter (current words)
            shouldKeep = !hasSideOfferLetter;
          } else if (side === 'R' && value === 'NO') {
            // Right side confirmed as NO - keep words WITHOUT the side offer letter (current words)
            shouldKeep = !hasSideOfferLetter;
          }
          
          if (shouldKeep) {
            confirmedWords.push(word);
          } else {
            eliminatedWords.push(word);
          }
        });
        
        // Update wordsForAnalysis to only include confirmed words
        wordsForAnalysis = confirmedWords;
      } else {
        // If no side offer letter, all words are confirmed
        confirmedWords = wordsForAnalysis;
      }
      
      // Side offer letter confirmation - this confirms the side as NO for both the side offer letter AND binary choices
      let newLeftWords: string[] = [];
      let newRightWords: string[] = [];
      
      if (sideOfferLetter) {
        // When side offer letter is confirmed, we know the binary interpretation
        // The confirmed side is NO, the opposite side is YES
        if (side === 'L') {
          // Left side confirmed as NO, so right side is YES
          // Keep only words that match the right pattern (YES pattern)
          newLeftWords = [];
          newRightWords = confirmedWords;
        } else {
          // Right side confirmed as NO, so left side is YES
          // Keep only words that match the left pattern (YES pattern)
          newLeftWords = confirmedWords;
          newRightWords = [];
        }
      } else {
        // This shouldn't happen with side offer letters, but fallback
        newLeftWords = state.filterState.leftWords;
        newRightWords = state.filterState.rightWords;
      }
      
      // Switch to Most Frequent mode after side confirmation
      let updatedPreferences = state.userPreferences;
      if (sideOfferLetter) {
        // Switch to Most Frequent mode while preserving original choice
        updatedPreferences = {
          ...state.userPreferences,
          selectedLetterSequence: 'most-frequent'
        };
      }
      
      const newFilterState = {
        ...state.filterState,
        confirmedSide: side, // Keep confirmed side for visual feedback
        confirmedSideValue: value, // Keep confirmed side value for visual feedback
        sideOfferLetter: undefined, // Clear the side offer letter
        dynamicSequence: newDynamicSequence,
        usedLetters: newUsedLetters,
        currentLetter: '', // Clear current letter to trigger Most Frequent initialization
        isDynamicMode: true, // Switch to dynamic mode
        letterIndex: state.filterState.letterIndex, // Keep current index unchanged
        leftWords: newLeftWords, // Update with filtered words
        rightWords: newRightWords, // Update with filtered words
        leftCount: newLeftWords.length,
        rightCount: newRightWords.length
      };

      // Add debug log for every CONFIRM_SIDE
      console.log('[DEBUG] CONFIRM_SIDE:', {
        sideOfferLetter,
        sideChosen: side,
        valueChosen: value,
        confirmedWordsCount: confirmedWords.length,
        leftWordsCount: newLeftWords.length,
        rightWordsCount: newRightWords.length
      });

      // NEW: Decode psychological profile after side confirmation
      const updatedState = {
        ...state,
        userPreferences: updatedPreferences,
        filterState: newFilterState
      };

      // If we have psychological answers, decode the profile
      if (state.filterState.psychologicalAnswers && Object.keys(state.filterState.psychologicalAnswers).length > 0) {
        const answers = state.filterState.psychologicalAnswers;
        const questions = updatedState.userPreferences.psychologicalProfiling.questions.filter(q => q.enabled);
        
        const decodedProfile: string[] = [];
        
        questions.forEach(question => {
          const answer = answers[question.id];
          if (answer) {
            // Decode the answer based on confirmed side
            let person1Answer: boolean;
            let person2Answer: boolean;
            
            if (side === 'R' && value === 'NO') {
              // R=NO, L=YES
              person1Answer = answer.person1 === 'L';
              person2Answer = answer.person2 === 'L';
            } else if (side === 'L' && value === 'NO') {
              // L=NO, R=YES
              person1Answer = answer.person1 === 'R';
              person2Answer = answer.person2 === 'R';
            } else if (side === 'R' && value === 'YES') {
              // R=YES, L=NO
              person1Answer = answer.person1 === 'R';
              person2Answer = answer.person2 === 'R';
            } else {
              // L=YES, R=NO
              person1Answer = answer.person1 === 'L';
              person2Answer = answer.person2 === 'L';
            }
            
            decodedProfile.push(`${question.text}: Person 1: ${person1Answer ? 'YES' : 'NO'}, Person 2: ${person2Answer ? 'YES' : 'NO'}`);
          }
        });
        
        return {
          ...updatedState,
          filterState: {
            ...newFilterState,
            psychologicalAnswers: state.filterState.psychologicalAnswers, // Preserve the answers
            psychologicalProfile: {
              questions,
              answers,
              decodedProfile
            }
          }
        };
      }

      return updatedState;
    }
    
    // NEW: Psychological profiling actions
    case 'TOGGLE_PSYCHOLOGICAL_PROFILING': {
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          psychologicalProfiling: {
            ...state.userPreferences.psychologicalProfiling,
            enabled: action.payload
          }
        }
      };
    }
    
    case 'UPDATE_PSYCHOLOGICAL_QUESTION': {
      const { questionId, updates } = action.payload;
      const updatedQuestions = state.userPreferences.psychologicalProfiling.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      );
      
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          psychologicalProfiling: {
            ...state.userPreferences.psychologicalProfiling,
            questions: updatedQuestions
          }
        }
      };
    }
    
    case 'SET_PSYCHOLOGICAL_ANSWERS': {
      return {
        ...state,
        filterState: {
          ...state.filterState,
          psychologicalAnswers: action.payload
        }
      };
    }
    
    case 'DECODE_PSYCHOLOGICAL_PROFILE': {
      const { confirmedSide, confirmedSideValue } = action.payload;
      const answers = state.filterState.psychologicalAnswers || {};
      const questions = state.userPreferences.psychologicalProfiling.questions.filter(q => q.enabled);
      
      const decodedProfile: string[] = [];
      
      questions.forEach(question => {
        const answer = answers[question.id];
        if (answer) {
          // Decode the answer based on confirmed side
          let person1Answer: boolean;
          let person2Answer: boolean;
          
          if (confirmedSide === 'R' && confirmedSideValue === 'NO') {
            // R=NO, L=YES
            person1Answer = answer.person1 === 'L';
            person2Answer = answer.person2 === 'L';
          } else if (confirmedSide === 'L' && confirmedSideValue === 'NO') {
            // L=NO, R=YES
            person1Answer = answer.person1 === 'R';
            person2Answer = answer.person2 === 'R';
          } else if (confirmedSide === 'R' && confirmedSideValue === 'YES') {
            // R=YES, L=NO
            person1Answer = answer.person1 === 'R';
            person2Answer = answer.person2 === 'R';
          } else {
            // L=YES, R=NO
            person1Answer = answer.person1 === 'L';
            person2Answer = answer.person2 === 'L';
          }
          
          decodedProfile.push(`${question.text}: Person 1: ${person1Answer ? 'YES' : 'NO'}, Person 2: ${person2Answer ? 'YES' : 'NO'}`);
        }
      });
      
      return {
        ...state,
        filterState: {
          ...state.filterState,
          psychologicalProfile: {
            questions,
            answers,
            decodedProfile
          }
        }
      };
    }
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  selectWordList: (id: string) => void;
  makeBinaryChoice: (choice: BinaryChoice) => void;
  resetFilter: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateLetterSequence: (sequenceId: string) => void;
  setDefaultLetterSequence: (sequenceId: string) => void;
  updateMostFrequentFilter: (enabled: boolean) => void;
  initializeMostFrequent: () => void;
  getAllWordLists: () => WordList[];
  setSideOfferLetter: (letter: string) => void;
  confirmSide: (side: 'L' | 'R', value: 'YES' | 'NO') => void;
  // NEW: Psychological profiling functions
  togglePsychologicalProfiling: (enabled: boolean) => void;
  updatePsychologicalQuestion: (questionId: string, updates: Partial<PresetQuestion>) => void;
  setPsychologicalAnswers: (answers: { [questionId: string]: { person1: BinaryChoice; person2: BinaryChoice } }) => void;
  decodePsychologicalProfile: (confirmedSide: 'L' | 'R', confirmedSideValue: 'YES' | 'NO') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const selectWordList = async (id: string) => {
    dispatch({ type: 'SELECT_WORD_LIST', payload: id });
    
    // Get word list from the new management system
    const wordList = getWordListById(id);
    if (wordList) {
      // If words aren't loaded yet, load them
      if (wordList.words.length === 0) {
        try {
          // Map word list IDs to their corresponding filenames
          const filenameMap: Record<string, string> = {
            'en-uk': 'EN-UK.txt',
            '19k': '19K.txt',
            'all-names': 'AllNames.txt',
            'boys-names': 'BoysNames.txt',
            'girls-names': 'GirlsNames.txt',
            'months-starsigns': 'MONTHS_STARSIGNS.txt'
          };
          
          const filename = filenameMap[id];
          if (filename) {
            const { loadWordList } = await import('../data/wordLists');
            const words = await loadWordList(filename);
            wordList.words = words;
          }
        } catch (error) {
          console.error('Failed to load word list:', error);
        }
      }
      
      dispatch({ type: 'SET_SELECTED_WORD_LIST', payload: wordList });
    }
  };

  const makeBinaryChoice = (choice: BinaryChoice) => {
    dispatch({ type: 'MAKE_BINARY_CHOICE', payload: { choice } });
  };

  const resetFilter = () => {
    dispatch({ type: 'RESET_FILTER' });
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const updateLetterSequence = (sequenceId: string) => {
    dispatch({ type: 'UPDATE_LETTER_SEQUENCE', payload: sequenceId });
  };

  // Add this function for Settings
  const setDefaultLetterSequence = (sequenceId: string) => {
    dispatch({ type: 'SET_DEFAULT_LETTER_SEQUENCE', payload: sequenceId });
  };

  const updateMostFrequentFilter = (enabled: boolean) => {
    updatePreferences({ mostFrequentFilter: enabled });
  };

  const initializeMostFrequent = async () => {
    if (!state.selectedWordList) return;
    const { selectNextDynamicLetter } = await import('../utils/binaryFilter');
    const firstLetter = selectNextDynamicLetter(state.selectedWordList.words, new Set<string>());
    if (firstLetter) {
      dispatch({ type: 'SET_MOST_FREQUENT_INITIALIZED', payload: { firstLetter } });
    } else {
      // If no letter is found (e.g., very few words), set empty letter
      dispatch({ type: 'SET_MOST_FREQUENT_INITIALIZED', payload: { firstLetter: '' } });
    }
  };

  const setSideOfferLetter = (letter: string) => {
    dispatch({ type: 'SET_SIDE_OFFER_LETTER', payload: { letter } });
  };

  const confirmSide = (side: 'L' | 'R', value: 'YES' | 'NO') => {
    dispatch({ type: 'CONFIRM_SIDE', payload: { side, value } });
  };

  const togglePsychologicalProfiling = (enabled: boolean) => {
    dispatch({ type: 'TOGGLE_PSYCHOLOGICAL_PROFILING', payload: enabled });
  };

  const updatePsychologicalQuestion = (questionId: string, updates: Partial<PresetQuestion>) => {
    dispatch({ type: 'UPDATE_PSYCHOLOGICAL_QUESTION', payload: { questionId, updates } });
  };

  const setPsychologicalAnswers = (answers: { [questionId: string]: { person1: BinaryChoice; person2: BinaryChoice } }) => {
    dispatch({ type: 'SET_PSYCHOLOGICAL_ANSWERS', payload: answers });
  };

  const decodePsychologicalProfile = (confirmedSide: 'L' | 'R', confirmedSideValue: 'YES' | 'NO') => {
    dispatch({ type: 'DECODE_PSYCHOLOGICAL_PROFILE', payload: { confirmedSide, confirmedSideValue } });
  };

  const value: AppContextType = {
    state,
    dispatch,
    selectWordList,
    makeBinaryChoice,
    resetFilter,
    updatePreferences,
    updateLetterSequence,
    setDefaultLetterSequence, // Add to context
    updateMostFrequentFilter,
    initializeMostFrequent,
    getAllWordLists,
    setSideOfferLetter,
    confirmSide,
    togglePsychologicalProfiling,
    updatePsychologicalQuestion,
    setPsychologicalAnswers,
    decodePsychologicalProfile
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 
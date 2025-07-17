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
          text: 'Do you like sports?',
          enabled: false,
          order: 1
        },
        {
          id: 'q2',
          text: 'Are you an introvert?',
          enabled: false,
          order: 2
        },
        {
          id: 'q3',
          text: 'Do you prefer coffee over tea?',
          enabled: false,
          order: 3
        },
        {
          id: 'q4',
          text: 'Are you a morning person?',
          enabled: false,
          order: 4
        },
        {
          id: 'q5',
          text: 'Do you enjoy traveling?',
          enabled: false,
          order: 5
        }
      ]
    }
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_WORD_LIST':
      // This will be handled asynchronously in the component
      const selectSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const selectLetterSequence = selectSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
    
    case 'MAKE_BINARY_CHOICE':
      const { choice } = action.payload;
      const newSequence = [...state.filterState.sequence, choice];
      const newLetterIndex = state.filterState.letterIndex + 1;
      
      // Get the current letter sequence - use original sequence for predefined letters
      const currentSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const originalSequence = getSequenceById(state.userPreferences.originalLetterSequence);
      let letterSequence = currentSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // If we're in dynamic mode after side confirmation, use original sequence for predefined letters
      // and dynamic for letters beyond the original sequence
      if (state.filterState.isDynamicMode && state.filterState.confirmedSide) {
        const originalLetterSequence = originalSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        // Use original sequence for predefined letters, empty for dynamic letters
        letterSequence = originalLetterSequence;
      }
      
      // Get current letter
      const currentLetter = state.filterState.currentLetter;
      
      // For "Most Frequent" sequence, analyze frequency on the remaining words
      // For dynamic letter selection, we need to analyze frequency on the words that remain
      // after the current choice, but before we know the next letter
      let wordsForAnalysis: string[] = [];
      
      // Always use filterWords to ensure confirmed side filtering is applied correctly
      const tempFilterResult = state.selectedWordList 
        ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, letterSequence, state.filterState.dynamicSequence, state.filterState.confirmedSide, state.filterState.confirmedSideValue)
        : resetFilter();
      wordsForAnalysis = [...tempFilterResult.leftWords, ...tempFilterResult.rightWords];
      
      console.log('MAKE_BINARY_CHOICE: Words for analysis:', {
        leftWordsCount: tempFilterResult.leftWords.length,
        rightWordsCount: tempFilterResult.rightWords.length,
        totalWordsForAnalysis: wordsForAnalysis.length,
        confirmedSide: state.filterState.confirmedSide,
        confirmedSideValue: state.filterState.confirmedSideValue
      });
      
      // Get next letter (predefined or dynamic)
      // For "Most Frequent" sequence, use the sequence length as the index
      const letterIndexForNext = letterSequence === '' ? newSequence.length : newLetterIndex;
      
      // Create a temporary used letters set that includes the current letter for frequency analysis
      const tempUsedLetters = new Set(state.filterState.usedLetters);
      tempUsedLetters.add(currentLetter);
      
      // Ensure we use empty string for Most Frequent mode
      const effectiveLetterSequence = letterSequence === '' ? '' : letterSequence;
      
      const nextLetterInfo = getNextLetterWithDynamic(
        letterIndexForNext,
        effectiveLetterSequence,
        wordsForAnalysis,
        tempUsedLetters, // Use used letters including current letter
        state.userPreferences.mostFrequentFilter
      );
      
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
        ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, letterSequence, newDynamicSequence, state.filterState.confirmedSide, state.filterState.confirmedSideValue)
        : resetFilter();
      
      return {
        ...state,
        filterState: {
          currentLetter: nextLetterInfo.letter,
          sequence: newSequence,
          leftWords: currentFilterResult.leftWords,
          rightWords: currentFilterResult.rightWords,
          letterIndex: newLetterIndex,
          usedLetters: newUsedLetters,
          dynamicSequence: newDynamicSequence,
          isDynamicMode: nextLetterInfo.isDynamic,
          sideOfferLetter: state.filterState.sideOfferLetter,
          confirmedSide: state.filterState.confirmedSide,
          confirmedSideValue: state.filterState.confirmedSideValue,
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
        setCurrentLetter = 'A'; // Will be updated when component loads
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
          confirmedSide: resetResult.confirmedSide,
          confirmedSideValue: resetResult.confirmedSideValue,
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    
    case 'RESET_FILTER':
      // Always use the original letter sequence for reset
      const resetSequence = getSequenceById(state.userPreferences.originalLetterSequence);
      const resetLetterSequence = resetSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const resetFilterResult = resetFilter(resetLetterSequence);
      
      // Also reset the selectedLetterSequence back to the original
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          selectedLetterSequence: state.userPreferences.originalLetterSequence
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
          confirmedSide: resetFilterResult.confirmedSide,
          confirmedSideValue: resetFilterResult.confirmedSideValue,
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
    
    case 'UPDATE_LETTER_SEQUENCE':
      const updateSequence = getSequenceById(action.payload);
      const updateLetterSequence = updateSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const updateFilterResult = resetFilter(updateLetterSequence);
      
      // Store the original sequence if this is the first time selecting it
      // or if we're resetting to a new sequence (not from Most Frequent mode)
      const shouldUpdateOriginal = state.userPreferences.originalLetterSequence === 'full-alphabet' || 
        (state.userPreferences.selectedLetterSequence === 'most-frequent' && action.payload !== 'most-frequent');
      
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          selectedLetterSequence: action.payload,
          originalLetterSequence: shouldUpdateOriginal ? action.payload : state.userPreferences.originalLetterSequence
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
          confirmedSide: updateFilterResult.confirmedSide,
          confirmedSideValue: updateFilterResult.confirmedSideValue,
          // Preserve psychological profiling data
          psychologicalAnswers: state.filterState.psychologicalAnswers,
          psychologicalProfile: state.filterState.psychologicalProfile
        }
      };
    
    case 'INITIALIZE_MOST_FREQUENT':
      // REMOVE all logic from here, handled in provider
      return state;
    case 'SET_MOST_FREQUENT_INITIALIZED': {
      const { firstLetter } = action.payload;
      
      // Only initialize if we don't already have used letters
      const usedLetters = state.filterState.usedLetters.size > 0 
        ? state.filterState.usedLetters 
        : new Set<string>([firstLetter]);
      

      
      return {
        ...state,
        filterState: {
          ...state.filterState,
          currentLetter: firstLetter,
          dynamicSequence: [firstLetter],
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
      
      // CRITICAL FIX: First, apply the current sequence filtering to get the properly filtered word list
      // This ensures we carry forward the filtering from the previous sequence
      let wordsForAnalysis = state.selectedWordList?.words || [];
      
      // Apply the current sequence filtering to preserve the previous choices
      if (state.filterState.sequence.length > 0) {
        console.log('CONFIRM_SIDE: Applying sequence filtering:', {
          sequence: state.filterState.sequence,
          originalSequence: getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence,
          wordCount: wordsForAnalysis.length
        });
        
        wordsForAnalysis = wordsForAnalysis.filter(word => {
          const upperWord = word.toUpperCase();
          for (let i = 0; i < state.filterState.sequence.length; i++) {
            // Get the letter from the original sequence
            const originalSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
            const letterSequence = originalSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const letter = letterSequence[i] || '';
            const choice = state.filterState.sequence[i];
            const hasLetter = upperWord.includes(letter);
            
            console.log(`Checking word "${word}": letter="${letter}", choice="${choice}", hasLetter=${hasLetter}`);
            
            if (choice === 'L' && !hasLetter) return false;
            if (choice === 'R' && hasLetter) return false;
          }
          return true;
        });
        
        console.log('CONFIRM_SIDE: After filtering:', {
          filteredWordCount: wordsForAnalysis.length,
          filteredWords: wordsForAnalysis.slice(0, 10) // Show first 10 for debugging
        });
      }
      
      // Use the original letter sequence for predefined letters, but allow dynamic mode for beyond
      const originalSequence = getSequenceById(state.userPreferences.originalLetterSequence);
      const letterSequence = originalSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // Get the next most frequent letter from the properly filtered word list
      const nextLetterInfo = getNextLetterWithDynamic(
        newDynamicSequence.length, // Use dynamic sequence length as index
        letterSequence, // Use original sequence for predefined letters
        wordsForAnalysis, // Use the filtered word list
        newUsedLetters,
        true // Always enable most frequent filter
      );
      
      // Keep the original sequence selected, don't switch to Most Frequent
      const updatedPreferences = {
        ...state.userPreferences
        // Keep selectedLetterSequence as the original sequence
      };
      
      const newFilterState = {
        ...state.filterState,
        confirmedSide: side,
        confirmedSideValue: value,
        sideOfferLetter: undefined, // Clear the side offer letter
        dynamicSequence: newDynamicSequence,
        usedLetters: newUsedLetters,
        currentLetter: nextLetterInfo.letter,
        isDynamicMode: true, // Switch to dynamic mode
        letterIndex: newDynamicSequence.length // Update letter index
      };

      console.log('CONFIRM_SIDE: Final state update:', {
        confirmedSide: newFilterState.confirmedSide,
        confirmedSideValue: newFilterState.confirmedSideValue,
        sideOfferLetter: newFilterState.sideOfferLetter,
        isDynamicMode: newFilterState.isDynamicMode,
        currentLetter: newFilterState.currentLetter
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
          const choice = answers[question.id];
          if (choice) {
            // Decode the answer based on confirmed side
            let answer: boolean;
            if (side === 'R' && value === 'NO') {
              // R=NO, L=YES
              answer = choice === 'L';
            } else if (side === 'L' && value === 'NO') {
              // L=NO, R=YES
              answer = choice === 'R';
            } else if (side === 'R' && value === 'YES') {
              // R=YES, L=NO
              answer = choice === 'R';
            } else {
              // L=YES, R=NO
              answer = choice === 'L';
            }
            
            decodedProfile.push(`${question.text}: ${answer ? 'YES' : 'NO'}`);
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
        const choice = answers[question.id];
        if (choice) {
          // Decode the answer based on confirmed side
          let answer: boolean;
          if (confirmedSide === 'R' && confirmedSideValue === 'NO') {
            // R=NO, L=YES
            answer = choice === 'L';
          } else if (confirmedSide === 'L' && confirmedSideValue === 'NO') {
            // L=NO, R=YES
            answer = choice === 'R';
          } else if (confirmedSide === 'R' && confirmedSideValue === 'YES') {
            // R=YES, L=NO
            answer = choice === 'R';
          } else {
            // L=YES, R=NO
            answer = choice === 'L';
          }
          
          decodedProfile.push(`${question.text}: ${answer ? 'YES' : 'NO'}`);
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
  updateMostFrequentFilter: (enabled: boolean) => void;
  initializeMostFrequent: () => void;
  getAllWordLists: () => WordList[];
  setSideOfferLetter: (letter: string) => void;
  confirmSide: (side: 'L' | 'R', value: 'YES' | 'NO') => void;
  // NEW: Psychological profiling functions
  togglePsychologicalProfiling: (enabled: boolean) => void;
  updatePsychologicalQuestion: (questionId: string, updates: Partial<PresetQuestion>) => void;
  setPsychologicalAnswers: (answers: { [questionId: string]: BinaryChoice }) => void;
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

  const updateMostFrequentFilter = (enabled: boolean) => {
    updatePreferences({ mostFrequentFilter: enabled });
  };

  const initializeMostFrequent = async () => {
    if (!state.selectedWordList) return;
    const { selectNextDynamicLetter } = await import('../utils/binaryFilter');
    const firstLetter = selectNextDynamicLetter(state.selectedWordList.words, new Set<string>());
    if (firstLetter) {
      dispatch({ type: 'SET_MOST_FREQUENT_INITIALIZED', payload: { firstLetter } });
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

  const setPsychologicalAnswers = (answers: { [questionId: string]: BinaryChoice }) => {
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
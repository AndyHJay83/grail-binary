import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, WordList, UserPreferences, BinaryChoice } from '../types';
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
    mostFrequentFilter: true, // Default to ON
    selectedWordListId: 'en-uk', // Default to EN-UK
    confirmNoLetter: true // NEW: Default to ON
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
        filterState: selectFilterResult
      };
    
    case 'MAKE_BINARY_CHOICE':
      const { choice } = action.payload;
      const newSequence = [...state.filterState.sequence, choice];
      const newLetterIndex = state.filterState.letterIndex + 1;
      
      // Get the current letter sequence
      const currentSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const letterSequence = currentSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // Get current letter
      const currentLetter = state.filterState.currentLetter;
      
      // For "Most Frequent" sequence, analyze frequency on the remaining words
      // For dynamic letter selection, we need to analyze frequency on the words that remain
      // after the current choice, but before we know the next letter
      let wordsForAnalysis: string[] = [];
      
      if (letterSequence === '') {
        // For "Most Frequent" sequence, analyze frequency on the original word list
        // but exclude words that don't match the current sequence
        wordsForAnalysis = state.selectedWordList?.words || [];
        
        console.log('Filtering words for Most Frequent sequence:', {
          originalWordCount: wordsForAnalysis.length,
          sequence: newSequence,
          dynamicSequence: state.filterState.dynamicSequence
        });
        
        // Filter out words that don't match the current sequence
        wordsForAnalysis = wordsForAnalysis.filter(word => {
          const upperWord = word.toUpperCase();
          for (let i = 0; i < newSequence.length; i++) {
            const letter = state.filterState.dynamicSequence[i] || '';
            const choice = newSequence[i];
            const hasLetter = upperWord.includes(letter);
            
            if (choice === 'L' && !hasLetter) return false;
            if (choice === 'R' && hasLetter) return false;
          }
          return true;
        });
        
        console.log('Filtered word count:', wordsForAnalysis.length);
      } else {
        // For predefined sequences, use the normal filtered words
        const tempFilterResult = state.selectedWordList 
          ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, letterSequence, state.filterState.dynamicSequence, state.filterState.confirmedSide, state.filterState.confirmedSideValue)
          : resetFilter();
        wordsForAnalysis = [...tempFilterResult.leftWords, ...tempFilterResult.rightWords];
      }
      
      // Get next letter (predefined or dynamic)
      // For "Most Frequent" sequence, use the sequence length as the index
      const letterIndexForNext = letterSequence === '' ? newSequence.length : newLetterIndex;
      
      console.log('Getting next letter with:', {
        letterIndexForNext,
        currentUsedLetters: Array.from(state.filterState.usedLetters),
        currentLetter,
        sequenceLength: newSequence.length
      });
      
      // Create a temporary used letters set that includes the current letter for frequency analysis
      const tempUsedLetters = new Set(state.filterState.usedLetters);
      tempUsedLetters.add(currentLetter);
      
      const nextLetterInfo = getNextLetterWithDynamic(
        letterIndexForNext,
        letterSequence,
        wordsForAnalysis,
        tempUsedLetters, // Use used letters including current letter
        state.userPreferences.mostFrequentFilter
      );
      
      // Add current letter to used letters AFTER getting the next letter
      const newUsedLetters = new Set(state.filterState.usedLetters);
      newUsedLetters.add(currentLetter);
      
      console.log('Used letters tracking:', {
        currentLetter,
        previousUsedLetters: Array.from(state.filterState.usedLetters),
        newUsedLetters: Array.from(newUsedLetters)
      });
      
      // Update dynamic sequence if needed
      const newDynamicSequence = [...state.filterState.dynamicSequence];
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
          confirmedSideValue: state.filterState.confirmedSideValue
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
          confirmedSideValue: resetResult.confirmedSideValue
        }
      };
    
    case 'RESET_FILTER':
      const resetSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const resetLetterSequence = resetSequence?.sequence ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const resetFilterResult = resetFilter(resetLetterSequence);
      return {
        ...state,
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
          confirmedSideValue: resetFilterResult.confirmedSideValue
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
          confirmedSide: updateFilterResult.confirmedSide,
          confirmedSideValue: updateFilterResult.confirmedSideValue
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
      
      console.log('SET_MOST_FREQUENT_INITIALIZED:', {
        firstLetter,
        existingUsedLetters: Array.from(state.filterState.usedLetters),
        newUsedLetters: Array.from(usedLetters)
      });
      
      return {
        ...state,
        filterState: {
          ...state.filterState,
          currentLetter: firstLetter,
          dynamicSequence: [firstLetter],
          isDynamicMode: true,
          usedLetters: usedLetters
        }
      };
    }
    
    case 'SET_SIDE_OFFER_LETTER': {
      const { letter } = action.payload;
      return {
        ...state,
        filterState: {
          ...state.filterState,
          sideOfferLetter: letter
        }
      };
    }
    
    case 'CONFIRM_SIDE': {
      const { side, value } = action.payload;
      return {
        ...state,
        filterState: {
          ...state.filterState,
          confirmedSide: side,
          confirmedSideValue: value,
          sideOfferLetter: undefined // Clear the side offer letter
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
    confirmSide
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 
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
    selectedWordListId: 'en-uk' // Default to EN-UK
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_WORD_LIST':
      // This will be handled asynchronously in the component
      const selectSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const selectLetterSequence = selectSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return {
        ...state,
        filterState: resetFilter(selectLetterSequence)
      };
    
    case 'MAKE_BINARY_CHOICE':
      const { choice } = action.payload;
      const newSequence = [...state.filterState.sequence, choice];
      const newLetterIndex = state.filterState.letterIndex + 1;
      
      // Get the current letter sequence
      const currentSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const letterSequence = currentSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // Get current letter
      const currentLetter = state.filterState.currentLetter;
      
      // Add current letter to used letters
      const newUsedLetters = new Set(state.filterState.usedLetters);
      newUsedLetters.add(currentLetter);
      
      // First, get the current filtered words to analyze for frequency
      const currentFilterResult = state.selectedWordList 
        ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, letterSequence, state.filterState.dynamicSequence)
        : resetFilter();
      
      // Use the filtered words for frequency analysis (combine left and right for analysis)
      const remainingWords = [...currentFilterResult.leftWords, ...currentFilterResult.rightWords];
      
      // Get next letter (predefined or dynamic)
      const nextLetterInfo = getNextLetterWithDynamic(
        newLetterIndex,
        letterSequence,
        remainingWords,
        newUsedLetters,
        state.userPreferences.mostFrequentFilter
      );
      
      // Update dynamic sequence if needed
      const newDynamicSequence = [...state.filterState.dynamicSequence];
      if (nextLetterInfo.isDynamic && nextLetterInfo.letter) {
        newDynamicSequence.push(nextLetterInfo.letter);
      }
      
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
          isDynamicMode: nextLetterInfo.isDynamic
        }
      };
    
    case 'SET_SELECTED_WORD_LIST':
      const setSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const setLetterSequence = setSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const resetResult = resetFilter(setLetterSequence);
      return {
        ...state,
        selectedWordList: action.payload,
        filterState: {
          currentLetter: resetResult.currentLetter,
          sequence: resetResult.sequence,
          leftWords: resetResult.leftWords,
          rightWords: resetResult.rightWords,
          letterIndex: resetResult.letterIndex,
          usedLetters: resetResult.usedLetters,
          dynamicSequence: resetResult.dynamicSequence,
          isDynamicMode: resetResult.isDynamicMode
        }
      };
    
    case 'RESET_FILTER':
      const resetSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const resetLetterSequence = resetSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
          isDynamicMode: resetFilterResult.isDynamicMode
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
      const updateLetterSequence = updateSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
          isDynamicMode: updateFilterResult.isDynamicMode
        }
      };
    
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
  getAllWordLists: () => WordList[];
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
          const loadedWordList = await getWordListById(id);
          if (loadedWordList) {
            wordList.words = loadedWordList.words;
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

  const value: AppContextType = {
    state,
    dispatch,
    selectWordList,
    makeBinaryChoice,
    resetFilter,
    updatePreferences,
    updateLetterSequence,
    updateMostFrequentFilter,
    getAllWordLists
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 
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
  },
  undoStack: [] // Initialize empty undo stack
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
      
      // Save current state to undo stack before making choice
      const currentState = {
        currentLetter: state.filterState.currentLetter,
        sequence: [...state.filterState.sequence],
        leftWords: [...state.filterState.leftWords],
        rightWords: [...state.filterState.rightWords],
        letterIndex: state.filterState.letterIndex,
        usedLetters: new Set(state.filterState.usedLetters),
        dynamicSequence: [...state.filterState.dynamicSequence],
        isDynamicMode: state.filterState.isDynamicMode
      };
      
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
        undoStack: [...state.undoStack, currentState], // Add current state to undo stack
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
        undoStack: [], // Clear undo stack when resetting
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
    
    case 'UNDO':
      if (state.undoStack.length === 0) {
        return state; // Nothing to undo
      }
      
      // Get the previous state from the undo stack
      const previousState = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1); // Remove the last item
      
      return {
        ...state,
        undoStack: newUndoStack,
        filterState: previousState
      };
    
    case 'RESET_UNDO':
      return {
        ...state,
        undoStack: []
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
  undo: () => void;
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
    
    try {
      // Map word list IDs to their corresponding filenames
      const filenameMap: Record<string, string> = {
        'en-uk': 'EN-UK.txt',
        '19k': '19K.txt',
        'all-names': 'AllNames.txt',
        'boys-names': 'BoysNames.txt',
        'girls-names': 'GirlsNames.txt'
      };
      
      const filename = filenameMap[id];
      if (filename) {
        const { loadWordList } = await import('../data/wordLists');
        const words = await loadWordList(filename);
        
        // Get the word list definition from the manager
        const wordList = getWordListById(id);
        if (wordList) {
          // Create a new word list object with the loaded words
          const loadedWordList = {
            ...wordList,
            words: words
          };
          
          dispatch({ type: 'SET_SELECTED_WORD_LIST', payload: loadedWordList });
        }
      }
    } catch (error) {
      console.error('Failed to load word list:', error);
    }
  };

  const makeBinaryChoice = (choice: BinaryChoice) => {
    dispatch({ type: 'MAKE_BINARY_CHOICE', payload: { choice } });
  };

  const undo = () => {
    dispatch({ type: 'UNDO' });
  };

  const resetFilter = () => {
    dispatch({ type: 'RESET_FILTER' });
    dispatch({ type: 'RESET_UNDO' }); // Clear undo stack when resetting
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
    undo,
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
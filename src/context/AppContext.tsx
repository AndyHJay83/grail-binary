import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, WordList, UserPreferences, BinaryChoice } from '../types';
import { filterWords, resetFilter } from '../utils/binaryFilter';
import { getAllWordLists, getWordListById } from '../data/wordLists';
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
    letterIndex: 0
  },
  userPreferences: {
    theme: 'dark',
    exportPreferences: {
      defaultFilename: 'WORDLIST-RESULTS',
      includeTimestamp: false
    },
    selectedLetterSequence: 'full-alphabet'
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
      
      const filterResult = state.selectedWordList 
        ? filterWords(state.selectedWordList.words, newSequence, newLetterIndex, letterSequence)
        : resetFilter();
      
      return {
        ...state,
        filterState: {
          currentLetter: filterResult.currentLetter,
          sequence: newSequence,
          leftWords: filterResult.leftWords,
          rightWords: filterResult.rightWords,
          letterIndex: newLetterIndex
        }
      };
    
    case 'SET_SELECTED_WORD_LIST':
      const setSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const setLetterSequence = setSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return {
        ...state,
        selectedWordList: action.payload,
        filterState: resetFilter(setLetterSequence)
      };
    
    case 'RESET_FILTER':
      const resetSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      const resetLetterSequence = resetSequence?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return {
        ...state,
        filterState: resetFilter(resetLetterSequence)
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
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          selectedLetterSequence: action.payload
        },
        filterState: resetFilter(updateLetterSequence) // Reset filter when sequence changes
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
  getAllWordLists: () => Promise<WordList[]>;
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
    const wordList = await getWordListById(id);
    if (wordList) {
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

  const value: AppContextType = {
    state,
    dispatch,
    selectWordList,
    makeBinaryChoice,
    resetFilter,
    updatePreferences,
    updateLetterSequence,
    getAllWordLists
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 
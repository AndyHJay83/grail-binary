import { WordList } from '../types';
import { wordLists as defaultWordLists } from './wordLists';

// Storage key for custom word lists
const CUSTOM_WORDLISTS_KEY = 'word-filter-custom-wordlists';

// Cache for loaded word lists
const wordListCache = new Map<string, string[]>();

// Get all word lists (default + custom)
export const getAllWordLists = (): WordList[] => {
  const customWordLists = getCustomWordLists();
  const allWordLists = [...defaultWordLists, ...customWordLists];
  
  // Update word lists with cached words
  return allWordLists.map(wordList => ({
    ...wordList,
    words: wordListCache.get(wordList.id) || wordList.words
  }));
};

// Update word list cache
export const updateWordListCache = (id: string, words: string[]): void => {
  wordListCache.set(id, words);
};

// Get custom word lists from localStorage
export const getCustomWordLists = (): WordList[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_WORDLISTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom word lists:', error);
    return [];
  }
};

// Save custom word lists to localStorage
export const saveCustomWordLists = (wordLists: WordList[]): void => {
  try {
    localStorage.setItem(CUSTOM_WORDLISTS_KEY, JSON.stringify(wordLists));
  } catch (error) {
    console.error('Error saving custom word lists:', error);
  }
};

// Parse text into word list
export const parseWordList = (text: string): string[] => {
  return text
    .split('\n')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0)
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
};

// Add a new custom word list
export const addCustomWordList = (name: string, words: string[], description?: string): WordList => {
  const customWordLists = getCustomWordLists();
  const newWordList: WordList = {
    id: `custom-${Date.now()}`,
    name,
    words,
    description: description || `Custom word list with ${words.length} words`,
    isDefault: false
  };
  
  const updatedWordLists = [...customWordLists, newWordList];
  saveCustomWordLists(updatedWordLists);
  
  return newWordList;
};

// Update an existing custom word list
export const updateCustomWordList = (id: string, name: string, words: string[], description?: string): WordList | null => {
  const customWordLists = getCustomWordLists();
  const wordListIndex = customWordLists.findIndex(wl => wl.id === id);
  
  if (wordListIndex === -1) return null;
  
  const updatedWordList: WordList = {
    ...customWordLists[wordListIndex],
    name,
    words,
    description: description || `Custom word list with ${words.length} words`
  };
  
  const updatedWordLists = [...customWordLists];
  updatedWordLists[wordListIndex] = updatedWordList;
  saveCustomWordLists(updatedWordLists);
  
  return updatedWordList;
};

// Delete a custom word list
export const deleteCustomWordList = (id: string): void => {
  const customWordLists = getCustomWordLists();
  const updatedWordLists = customWordLists.filter(wl => wl.id !== id);
  saveCustomWordLists(updatedWordLists);
};

// Get word list by ID
export const getWordListById = (id: string): WordList | undefined => {
  const allWordLists = getAllWordLists();
  return allWordLists.find(wl => wl.id === id);
};

// Validate word list
export const validateWordList = (words: string[]): { isValid: boolean; error?: string } => {
  if (words.length < 3) {
    return { isValid: false, error: 'Word list must contain at least 3 words' };
  }
  
  if (words.length > 50000) {
    return { isValid: false, error: 'Word list must contain 50,000 words or less' };
  }
  
  // Check for empty words
  if (words.some(word => word.length === 0)) {
    return { isValid: false, error: 'Word list cannot contain empty words' };
  }
  
  // Check for words that are too long
  if (words.some(word => word.length > 50)) {
    return { isValid: false, error: 'Words must be 50 characters or less' };
  }
  
  return { isValid: true };
};

// Handle file upload
export const handleFileUpload = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const words = parseWordList(text);
        resolve(words);
      } catch (error) {
        reject(new Error('Failed to parse file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}; 
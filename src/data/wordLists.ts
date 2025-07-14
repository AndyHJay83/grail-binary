import { WordList } from '../types';

export const wordLists: WordList[] = [
  {
    id: 'en-uk',
    name: 'EN-UK Dictionary',
    words: [], // Will be loaded dynamically
    description: 'English (UK) word list for binary filtering'
  }
];

export const loadWordList = async (filename: string): Promise<string[]> => {
  try {
    console.log(`Attempting to load word list from: /wordlist/${filename}`);
    const response = await fetch(`/wordlist/${filename}`);
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load word list: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log(`Loaded text length: ${text.length} characters`);
    console.log(`First 100 characters: ${text.substring(0, 100)}`);
    
    const words = text
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0 && !word.startsWith('#'))
      .map(word => word.toLowerCase());
    
    console.log(`Parsed ${words.length} words from file`);
    return words;
  } catch (error) {
    console.error('Error loading word list:', error);
    throw new Error('Failed to load word list - EN-UK.txt is required');
  }
};

export const getWordListById = async (id: string): Promise<WordList | undefined> => {
  const wordList = wordLists.find(list => list.id === id);
  if (!wordList) return undefined;
  
  // If words are already loaded, return the word list
  if (wordList.words.length > 0) {
    return wordList;
  }
  
  // Load words from file
  try {
    const words = await loadWordList('EN-UK.txt');
    wordList.words = words;
    return wordList;
  } catch (error) {
    console.error('Error loading word list:', error);
    throw error;
  }
};

export const getAllWordLists = async (): Promise<WordList[]> => {
  // Load words for all word lists
  const loadedWordLists = await Promise.all(
    wordLists.map(async (wordList) => {
      if (wordList.words.length === 0) {
        try {
          const words = await loadWordList('EN-UK.txt');
          wordList.words = words;
        } catch (error) {
          console.error('Error loading word list:', error);
          throw error;
        }
      }
      return wordList;
    })
  );
  
  return loadedWordLists;
}; 
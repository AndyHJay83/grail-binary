import { WordList } from '../types';

export const wordLists: WordList[] = [
  {
    id: 'en-uk',
    name: 'EN-UK Dictionary',
    words: [], // Will be loaded dynamically
    description: 'English (UK) word list for binary filtering',
    isDefault: true
  },
  {
    id: '19k',
    name: '19K Word List',
    words: [], // Will be loaded dynamically
    description: 'Medium-sized word list (19K words)',
    isDefault: true
  },
  {
    id: 'all-names',
    name: 'All Names',
    words: [], // Will be loaded dynamically
    description: 'Comprehensive list of names',
    isDefault: true
  },
  {
    id: 'boys-names',
    name: 'Boys Names',
    words: [], // Will be loaded dynamically
    description: 'List of boys names',
    isDefault: true
  },
  {
    id: 'girls-names',
    name: 'Girls Names',
    words: [], // Will be loaded dynamically
    description: 'List of girls names',
    isDefault: true
  }
];

export const loadWordList = async (filename: string): Promise<string[]> => {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const url = `${baseUrl}wordlist/${filename}`;
    console.log(`Attempting to load word list from: ${url}`);
    const response = await fetch(url);
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
  
  // Map word list IDs to their corresponding filenames
  const filenameMap: Record<string, string> = {
    'en-uk': 'EN-UK.txt',
    '19k': '19K.txt',
    'all-names': 'AllNames.txt',
    'boys-names': 'BoysNames.txt',
    'girls-names': 'GirlsNames.txt'
  };
  
  const filename = filenameMap[id];
  if (!filename) {
    throw new Error(`Unknown word list ID: ${id}`);
  }
  
  // Load words from file
  try {
    const words = await loadWordList(filename);
    wordList.words = words;
    return wordList;
  } catch (error) {
    console.error('Error loading word list:', error);
    throw error;
  }
};

export const getAllWordLists = async (): Promise<WordList[]> => {
  // Map word list IDs to their corresponding filenames
  const filenameMap: Record<string, string> = {
    'en-uk': 'EN-UK.txt',
    '19k': '19K.txt',
    'all-names': 'AllNames.txt',
    'boys-names': 'BoysNames.txt',
    'girls-names': 'GirlsNames.txt'
  };
  
  // Load words for all word lists
  const loadedWordLists = await Promise.all(
    wordLists.map(async (wordList) => {
      if (wordList.words.length === 0) {
        try {
          const filename = filenameMap[wordList.id];
          if (!filename) {
            console.error(`Unknown word list ID: ${wordList.id}`);
            return wordList;
          }
          const words = await loadWordList(filename);
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
import { LetterSequence } from '../types';

// Default letter sequences that are always available
export const defaultSequences: LetterSequence[] = [
  {
    id: 'full-alphabet',
    name: 'Full Alphabet',
    sequence: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    isDefault: true
  },
  {
    id: 'seatjk',
    name: 'SEATJK',
    sequence: 'SEATJK',
    isDefault: true
  },
  {
    id: 'vowels',
    name: 'Vowels Only',
    sequence: 'AEIOU',
    isDefault: true
  }
];

// Storage key for custom sequences
const CUSTOM_SEQUENCES_KEY = 'word-filter-custom-sequences';

// Get all sequences (default + custom)
export const getAllSequences = (): LetterSequence[] => {
  const customSequences = getCustomSequences();
  return [...defaultSequences, ...customSequences];
};

// Get custom sequences from localStorage
export const getCustomSequences = (): LetterSequence[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_SEQUENCES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom sequences:', error);
    return [];
  }
};

// Save custom sequences to localStorage
export const saveCustomSequences = (sequences: LetterSequence[]): void => {
  try {
    localStorage.setItem(CUSTOM_SEQUENCES_KEY, JSON.stringify(sequences));
  } catch (error) {
    console.error('Error saving custom sequences:', error);
  }
};

// Add a new custom sequence
export const addCustomSequence = (name: string, sequence: string): LetterSequence => {
  const customSequences = getCustomSequences();
  const newSequence: LetterSequence = {
    id: `custom-${Date.now()}`,
    name,
    sequence: sequence.toUpperCase(),
    isDefault: false
  };
  
  const updatedSequences = [...customSequences, newSequence];
  saveCustomSequences(updatedSequences);
  
  return newSequence;
};

// Delete a custom sequence
export const deleteCustomSequence = (id: string): void => {
  const customSequences = getCustomSequences();
  const updatedSequences = customSequences.filter(seq => seq.id !== id);
  saveCustomSequences(updatedSequences);
};

// Get sequence by ID
export const getSequenceById = (id: string): LetterSequence | undefined => {
  const allSequences = getAllSequences();
  return allSequences.find(seq => seq.id === id);
};

// Validate sequence
export const validateSequence = (sequence: string): { isValid: boolean; error?: string } => {
  if (sequence.length < 3) {
    return { isValid: false, error: 'Sequence must be at least 3 characters long' };
  }
  
  if (sequence.length > 50) {
    return { isValid: false, error: 'Sequence must be 50 characters or less' };
  }
  
  if (!/^[A-Z0-9]+$/.test(sequence)) {
    return { isValid: false, error: 'Sequence can only contain letters and numbers' };
  }
  
  return { isValid: true };
}; 
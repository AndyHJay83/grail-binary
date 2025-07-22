import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BinaryChoice } from '../types';
import { filterWords, getBackgroundColor, getNextLetterWithDynamic } from '../utils/binaryFilter';
import { getSequenceById } from '../data/letterSequences';

const SpectatorFilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { selectedWordList } = state;
  const { initializeMostFrequent } = useAppContext();

  // State for two independent spectators
  const [spectator1TopWords, setSpectator1TopWords] = useState<string[]>([]);
  const [spectator1BottomWords, setSpectator1BottomWords] = useState<string[]>([]);
  const [spectator2TopWords, setSpectator2TopWords] = useState<string[]>([]);
  const [spectator2BottomWords, setSpectator2BottomWords] = useState<string[]>([]);
  const [spectator1TopSequence, setSpectator1TopSequence] = useState<BinaryChoice[]>([]);
  const [spectator1BottomSequence, setSpectator1BottomSequence] = useState<BinaryChoice[]>([]);
  const [spectator2TopSequence, setSpectator2TopSequence] = useState<BinaryChoice[]>([]);
  const [spectator2BottomSequence, setSpectator2BottomSequence] = useState<BinaryChoice[]>([]);
  const [spectator1LetterIndex, setSpectator1LetterIndex] = useState<number>(0);
  const [spectator2LetterIndex, setSpectator2LetterIndex] = useState<number>(0);
  
  // Dynamic mode state for each section
  const [_spectator1TopIsDynamic, setSpectator1TopIsDynamic] = useState<boolean>(false);
  const [_spectator1BottomIsDynamic, setSpectator1BottomIsDynamic] = useState<boolean>(false);
  const [_spectator2TopIsDynamic, setSpectator2TopIsDynamic] = useState<boolean>(false);
  const [_spectator2BottomIsDynamic, setSpectator2BottomIsDynamic] = useState<boolean>(false);
  
  // Local state for tracking used letters (like PERFORM)
  const [usedLetters, setUsedLetters] = useState<Set<string>>(new Set());
  const [dynamicSequence, setDynamicSequence] = useState<string[]>([]);

  // Handle "Most Frequent" sequence initialization (like PERFORM)
  React.useEffect(() => {
    if (selectedWordList && state.filterState.isDynamicMode && state.filterState.currentLetter === 'A') {
      // This is likely the "Most Frequent" sequence that needs initialization
      const sequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      if (sequence?.sequence === '') {
        // Only initialize if we don't already have a dynamic sequence
        if (state.filterState.dynamicSequence.length === 0) {
          initializeMostFrequent();
        }
      }
    }
  }, [selectedWordList, state.filterState.isDynamicMode, state.filterState.currentLetter, state.userPreferences.selectedLetterSequence, state.filterState.dynamicSequence.length, initializeMostFrequent]);

  // Initialize both spectators with the same word list using PERFORM logic
  useEffect(() => {
    if (selectedWordList && selectedWordList.words.length > 0) {
      // Start with the full word list like PERFORM does
      setSpectator1TopWords([...selectedWordList.words]);
      setSpectator1BottomWords([...selectedWordList.words]);
      setSpectator2TopWords([...selectedWordList.words]);
      setSpectator2BottomWords([...selectedWordList.words]);
      setSpectator1TopSequence([]);
      setSpectator1BottomSequence([]);
      setSpectator2TopSequence([]);
      setSpectator2BottomSequence([]);
      setSpectator1LetterIndex(0);
      setSpectator2LetterIndex(0);
      
      // Reset dynamic mode state
      setSpectator1TopIsDynamic(false);
      setSpectator1BottomIsDynamic(false);
      setSpectator2TopIsDynamic(false);
      setSpectator2BottomIsDynamic(false);
      
      // Reset local state for used letters and dynamic sequence
      setUsedLetters(new Set());
      setDynamicSequence([]);
    }
  }, [selectedWordList, state.userPreferences.selectedLetterSequence, state.filterState.dynamicSequence]);

  const getCurrentLetter = (): { letter: string; isDynamic: boolean } => {
    const letterSequence = getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const currentIndex = Math.max(spectator1LetterIndex, spectator2LetterIndex);
    
    // Get all remaining words from all sections for frequency analysis
    const allRemainingWords = [
      ...spectator1TopWords,
      ...spectator1BottomWords,
      ...spectator2TopWords,
      ...spectator2BottomWords
    ];
    
    // Debug logging
    console.log('getCurrentLetter debug:', {
      letterSequence,
      currentIndex,
      allRemainingWordsLength: allRemainingWords.length,
      usedLetters: Array.from(usedLetters),
      mostFrequentFilter: state.userPreferences.mostFrequentFilter
    });
    
    // Use the same logic as PERFORM with local used letters
    const result = getNextLetterWithDynamic(
      currentIndex,
      letterSequence,
      allRemainingWords,
      usedLetters,
      state.userPreferences.mostFrequentFilter
    );
    
    console.log('getCurrentLetter result:', result);
    return result;
  };

  const filterSpectatorWords = (words: string[], sequence: BinaryChoice[], letterIndex: number): { leftWords: string[]; isDynamic: boolean } => {
    const letterSequence = getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Use the same logic as PERFORM - apply the sequence to filter words
    const result = filterWords(words, sequence, letterIndex, letterSequence, dynamicSequence);
    
    // Determine if we're in dynamic mode (same logic as PERFORM)
    let isDynamic = false;
    if (letterSequence === '') {
      // Most Frequent sequence - always dynamic
      isDynamic = true;
    } else if (letterIndex >= letterSequence.length) {
      // Predefined sequence exhausted - now in dynamic mode
      isDynamic = true;
    }
    
    // Return the left words (like PERFORM's left interpretation) and dynamic mode
    return {
      leftWords: result.leftWords,
      isDynamic: isDynamic
    };
  };

  const handleButtonPress = (button: 'left' | 'right' | 'up' | 'down') => {
    let spectator1TopChoice: BinaryChoice;
    let spectator1BottomChoice: BinaryChoice;
    let spectator2TopChoice: BinaryChoice;
    let spectator2BottomChoice: BinaryChoice;

    switch (button) {
      case 'left':
        spectator1TopChoice = 'L';
        spectator1BottomChoice = 'R';
        spectator2TopChoice = 'L';
        spectator2BottomChoice = 'R';
        break;
      case 'right':
        spectator1TopChoice = 'R';
        spectator1BottomChoice = 'L';
        spectator2TopChoice = 'R';
        spectator2BottomChoice = 'L';
        break;
      case 'up':
        spectator1TopChoice = 'L';
        spectator1BottomChoice = 'R';
        spectator2TopChoice = 'R';
        spectator2BottomChoice = 'L';
        break;
      case 'down':
        spectator1TopChoice = 'R';
        spectator1BottomChoice = 'L';
        spectator2TopChoice = 'L';
        spectator2BottomChoice = 'R';
        break;
      default:
        return;
    }

    // Get current letter before updating (like PERFORM does)
    const currentLetterInfo = getCurrentLetter();
    const currentLetter = currentLetterInfo.letter;

    // Update spectator 1 - each section filters independently with opposite choices
    const newSpectator1TopSequence = [...spectator1TopSequence, spectator1TopChoice];
    const newSpectator1BottomSequence = [...spectator1BottomSequence, spectator1BottomChoice];
    const newSpectator1LetterIndex = spectator1LetterIndex + 1;
    
    setSpectator1TopSequence(newSpectator1TopSequence);
    setSpectator1BottomSequence(newSpectator1BottomSequence);
    setSpectator1LetterIndex(newSpectator1LetterIndex);
    
    // Filter each section independently like PERFORM
    const spectator1TopResult = filterSpectatorWords(selectedWordList?.words || [], newSpectator1TopSequence, newSpectator1LetterIndex);
    const spectator1BottomResult = filterSpectatorWords(selectedWordList?.words || [], newSpectator1BottomSequence, newSpectator1LetterIndex);
    
    setSpectator1TopWords(spectator1TopResult.leftWords);
    setSpectator1BottomWords(spectator1BottomResult.leftWords);
    setSpectator1TopIsDynamic(spectator1TopResult.isDynamic);
    setSpectator1BottomIsDynamic(spectator1BottomResult.isDynamic);

    // Update spectator 2 - each section filters independently with opposite choices
    const newSpectator2TopSequence = [...spectator2TopSequence, spectator2TopChoice];
    const newSpectator2BottomSequence = [...spectator2BottomSequence, spectator2BottomChoice];
    const newSpectator2LetterIndex = spectator2LetterIndex + 1;
    
    setSpectator2TopSequence(newSpectator2TopSequence);
    setSpectator2BottomSequence(newSpectator2BottomSequence);
    setSpectator2LetterIndex(newSpectator2LetterIndex);
    
    // Filter each section independently like PERFORM
    const spectator2TopResult = filterSpectatorWords(selectedWordList?.words || [], newSpectator2TopSequence, newSpectator2LetterIndex);
    const spectator2BottomResult = filterSpectatorWords(selectedWordList?.words || [], newSpectator2BottomSequence, newSpectator2LetterIndex);
    
    setSpectator2TopWords(spectator2TopResult.leftWords);
    setSpectator2BottomWords(spectator2BottomResult.leftWords);
    setSpectator2TopIsDynamic(spectator2TopResult.isDynamic);
    setSpectator2BottomIsDynamic(spectator2BottomResult.isDynamic);

    // Update used letters and dynamic sequence like PERFORM does
    if (currentLetter) {
      // Add current letter to used letters
      const newUsedLetters = new Set(usedLetters);
      newUsedLetters.add(currentLetter);
      setUsedLetters(newUsedLetters);
      
      // Update dynamic sequence if the current letter is not already in it
      const newDynamicSequence = [...dynamicSequence];
      if (!newDynamicSequence.includes(currentLetter)) {
        newDynamicSequence.push(currentLetter);
      }
      setDynamicSequence(newDynamicSequence);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleReset = () => {
    if (selectedWordList) {
      // Reset to full word list like PERFORM does
      setSpectator1TopWords([...selectedWordList.words]);
      setSpectator1BottomWords([...selectedWordList.words]);
      setSpectator2TopWords([...selectedWordList.words]);
      setSpectator2BottomWords([...selectedWordList.words]);
      setSpectator1TopSequence([]);
      setSpectator1BottomSequence([]);
      setSpectator2TopSequence([]);
      setSpectator2BottomSequence([]);
      setSpectator1LetterIndex(0);
      setSpectator2LetterIndex(0);
      
      // Reset dynamic mode state
      setSpectator1TopIsDynamic(false);
      setSpectator1BottomIsDynamic(false);
      setSpectator2TopIsDynamic(false);
      setSpectator2BottomIsDynamic(false);
      
      // Reset local state for used letters and dynamic sequence
      setUsedLetters(new Set());
      setDynamicSequence([]);
    }
  };

  const getWordsToShow = (words: string[]) => {
    if (words.length <= 10) return words;
    return words.slice(0, 10);
  };

  const getTopHalf = (words: string[]) => {
    return words; // Full word list in top section
  };

  const getBottomHalf = (words: string[]) => {
    return words; // Full word list in bottom section
  };

  const getTextColor = (backgroundColor: string): string => {
    if (backgroundColor.includes('success-green') || backgroundColor.includes('orange-400') || backgroundColor.includes('red-400')) {
      return 'text-black';
    }
    return 'text-white';
  };

  // Background color functions for each section
  const getSpectator1TopBackgroundColor = () => {
    if (!selectedWordList) return 'bg-black';
    return getBackgroundColor(spectator1TopWords.length);
  };

  const getSpectator1BottomBackgroundColor = () => {
    if (!selectedWordList) return 'bg-black';
    return getBackgroundColor(spectator1BottomWords.length);
  };

  const getSpectator2TopBackgroundColor = () => {
    if (!selectedWordList) return 'bg-black';
    return getBackgroundColor(spectator2TopWords.length);
  };

  const getSpectator2BottomBackgroundColor = () => {
    if (!selectedWordList) return 'bg-black';
    return getBackgroundColor(spectator2BottomWords.length);
  };

  if (!selectedWordList) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">No Word List Selected</div>
          <button onClick={handleHomeClick} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentLetterInfo = getCurrentLetter();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Letter Display Bubble - Centered in D-Pad X */}
      {currentLetterInfo.letter && (
        <div className="absolute top-4/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50" style={{ marginTop: '425px' }}>
          <div className={`bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${currentLetterInfo.isDynamic ? 'text-red-500' : ''}`}>
            {currentLetterInfo.letter}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={handleHomeClick}
          className="btn-secondary"
          aria-label="Home"
        >
          🏠 Home
        </button>
        <button
          onClick={handleReset}
          className="btn-secondary"
          aria-label="Reset"
        >
          🔄 Reset
        </button>
      </div>

      {/* Spectator Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Spectator 1 */}
        <div className="bg-black border-2 border-white rounded-lg p-6 relative">
          {/* Spectator 1 Number Circle */}
          <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
            1
          </div>
          
          <div className="space-y-4">
            {/* Top Half */}
            <div>
              <div className={`p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto ${getSpectator1TopBackgroundColor()}`}>
                {getWordsToShow(getTopHalf(spectator1TopWords)).map((word, index) => (
                  <div key={index} className={`text-sm mb-1 ${getTextColor(getSpectator1TopBackgroundColor())}`}>
                    {word}
                  </div>
                ))}
                {getTopHalf(spectator1TopWords).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getTopHalf(spectator1TopWords).length - 10} more
                  </div>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="border-t-2 border-gray-600 my-4"></div>

            {/* Bottom Half */}
            <div>
              <div className={`p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto ${getSpectator1BottomBackgroundColor()}`}>
                {getWordsToShow(getBottomHalf(spectator1BottomWords)).map((word, index) => (
                  <div key={index} className={`text-sm mb-1 ${getTextColor(getSpectator1BottomBackgroundColor())}`}>
                    {word}
                  </div>
                ))}
                {getBottomHalf(spectator1BottomWords).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getBottomHalf(spectator1BottomWords).length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spectator 2 */}
        <div className="bg-black border-2 border-white rounded-lg p-6 relative">
          {/* Spectator 2 Number Circle */}
          <div className="absolute top-2 left-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
            2
          </div>
          
          <div className="space-y-4">
            {/* Top Half */}
            <div>
              <div className={`p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto ${getSpectator2TopBackgroundColor()}`}>
                {getWordsToShow(getTopHalf(spectator2TopWords)).map((word, index) => (
                  <div key={index} className={`text-sm mb-1 ${getTextColor(getSpectator2TopBackgroundColor())}`}>
                    {word}
                  </div>
                ))}
                {getTopHalf(spectator2TopWords).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getTopHalf(spectator2TopWords).length - 10} more
                  </div>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="border-t-2 border-gray-600 my-4"></div>

            {/* Bottom Half */}
            <div>
              <div className={`p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto ${getSpectator2BottomBackgroundColor()}`}>
                {getWordsToShow(getBottomHalf(spectator2BottomWords)).map((word, index) => (
                  <div key={index} className={`text-sm mb-1 ${getTextColor(getSpectator2BottomBackgroundColor())}`}>
                    {word}
                  </div>
                ))}
                {getBottomHalf(spectator2BottomWords).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getBottomHalf(spectator2BottomWords).length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagonal D-pad Button Layout */}
      <div className="w-full relative" style={{ height: '35vh' }}>
        <div className="relative w-full h-full">
          {/* Diagonal lines creating X pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(45deg, transparent calc(50% - 1px), white calc(50% - 1px), white calc(50% + 1px), transparent calc(50% + 1px))' }}></div>
            <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(-45deg, transparent calc(50% - 1px), white calc(50% - 1px), white calc(50% + 1px), transparent calc(50% + 1px))' }}></div>
          </div>
          {/* Clickable triangular regions (buttons) */}
          <button onClick={() => handleButtonPress('up')} className="absolute top-0 left-0 w-full h-1/2 bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }} aria-label="Up"><div className="flex items-center justify-center h-full text-white font-bold text-lg">1 & 4</div></button>
          <button onClick={() => handleButtonPress('right')} className="absolute top-0 right-0 w-1/2 h-full bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }} aria-label="Right"><div className="flex items-center justify-center h-full text-white font-bold text-lg">2 & 4</div></button>
          <button onClick={() => handleButtonPress('down')} className="absolute bottom-0 left-0 w-full h-1/2 bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }} aria-label="Down"><div className="flex items-center justify-center h-full text-white font-bold text-lg">2 & 3</div></button>
          <button onClick={() => handleButtonPress('left')} className="absolute top-0 left-0 w-1/2 h-full bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }} aria-label="Left"><div className="flex items-center justify-center h-full text-white font-bold text-lg">1 & 3</div></button>
        </div>
      </div>
    </div>
  );
};

export default SpectatorFilterPage; 
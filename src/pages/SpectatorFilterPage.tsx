import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BinaryChoice } from '../types';
import { filterWords, getBackgroundColor } from '../utils/binaryFilter';
import { getSequenceById } from '../data/letterSequences';

const SpectatorFilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { selectedWordList } = state;

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
    }
  }, [selectedWordList, state.userPreferences.selectedLetterSequence, state.filterState.dynamicSequence]);

  const getCurrentLetter = (): string => {
    const letterSequence = getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // For "Most Frequent" sequence (empty letterSequence), use dynamic sequence
    if (letterSequence === '') {
      return state.filterState.dynamicSequence[Math.max(spectator1LetterIndex, spectator2LetterIndex)] || '';
    } else {
      const currentIndex = Math.max(spectator1LetterIndex, spectator2LetterIndex);
      if (currentIndex < letterSequence.length) {
        // Still in predefined sequence
        return letterSequence[currentIndex] || '';
      } else {
        // In dynamic mode (after predefined sequence)
        const dynamicIndex = currentIndex - letterSequence.length;
        return state.filterState.dynamicSequence[dynamicIndex] || '';
      }
    }
  };

  const filterSpectatorWords = (words: string[], sequence: BinaryChoice[], letterIndex: number): string[] => {
    const letterSequence = getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Use the same logic as PERFORM - apply the sequence to filter words
    const result = filterWords(words, sequence, letterIndex, letterSequence, state.filterState.dynamicSequence);
    
    // Return the left words (like PERFORM's left interpretation)
    return result.leftWords;
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
    
    setSpectator1TopWords(spectator1TopResult);
    setSpectator1BottomWords(spectator1BottomResult);

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
    
    setSpectator2TopWords(spectator2TopResult);
    setSpectator2BottomWords(spectator2BottomResult);
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

  const currentLetter = getCurrentLetter();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Letter Display Bubble - Fixed Center Overlay */}
      {currentLetter && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
            {currentLetter}
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
        <div className="bg-black border-2 border-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Spectator 1</h2>
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
        <div className="bg-black border-2 border-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Spectator 2</h2>
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
      <div className="w-full" style={{ height: '35vh' }}>
        <div className="relative w-full h-full">
          {/* Diagonal lines creating X pattern */}
          <div className="absolute inset-0">
            {/* Diagonal line from top-left to bottom-right */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div 
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  background: 'linear-gradient(45deg, transparent calc(50% - 1px), white calc(50% - 1px), white calc(50% + 1px), transparent calc(50% + 1px))'
                }}
              ></div>
            </div>
            {/* Diagonal line from top-right to bottom-left */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div 
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  background: 'linear-gradient(-45deg, transparent calc(50% - 1px), white calc(50% - 1px), white calc(50% + 1px), transparent calc(50% + 1px))'
                }}
              ></div>
            </div>
          </div>

          {/* Clickable triangular regions */}
          {/* Top region (Up button) */}
          <button
            onClick={() => handleButtonPress('up')}
            className="absolute top-0 left-0 w-full h-1/2 bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'scale(0.7)',
              transformOrigin: 'center'
            }}
            aria-label="Up"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-2xl">↑</div>
          </button>

          {/* Right region (Right button) */}
          <button
            onClick={() => handleButtonPress('right')}
            className="absolute top-0 right-0 w-1/2 h-full bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'scale(0.7)',
              transformOrigin: 'center'
            }}
            aria-label="Right"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-2xl">→</div>
          </button>

          {/* Bottom region (Down button) */}
          <button
            onClick={() => handleButtonPress('down')}
            className="absolute bottom-0 left-0 w-full h-1/2 bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'scale(0.7)',
              transformOrigin: 'center'
            }}
            aria-label="Down"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-2xl">↓</div>
          </button>

          {/* Left region (Left button) */}
          <button
            onClick={() => handleButtonPress('left')}
            className="absolute top-0 left-0 w-1/2 h-full bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'scale(0.7)',
              transformOrigin: 'center'
            }}
            aria-label="Left"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-2xl">←</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpectatorFilterPage; 
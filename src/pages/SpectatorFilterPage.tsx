import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BinaryChoice } from '../types';
import { filterWords } from '../utils/binaryFilter';
import { getSequenceById } from '../data/letterSequences';

const SpectatorFilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { selectedWordList } = state;

  // State for two independent spectators
  const [spectator1Words, setSpectator1Words] = useState<string[]>([]);
  const [spectator2Words, setSpectator2Words] = useState<string[]>([]);
  const [spectator1Sequence, setSpectator1Sequence] = useState<BinaryChoice[]>([]);
  const [spectator2Sequence, setSpectator2Sequence] = useState<BinaryChoice[]>([]);

  // Letter tracking state - track independently for each spectator
  const [spectator1LetterIndex, setSpectator1LetterIndex] = useState<number>(0);
  const [spectator2LetterIndex, setSpectator2LetterIndex] = useState<number>(0);

  // Initialize both spectators with the same word list using PERFORM logic
  useEffect(() => {
    if (selectedWordList && selectedWordList.words.length > 0) {
      const letterSequence = getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // Initialize with empty sequences to get the full word list split
      const initialResult = filterWords(selectedWordList.words, [], 0, letterSequence, state.filterState.dynamicSequence);
      
      setSpectator1Words(initialResult.leftWords);
      setSpectator2Words(initialResult.leftWords); // Both start with left words
      setSpectator1Sequence([]);
      setSpectator2Sequence([]);
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

  const filterSpectatorWords = (words: string[], sequence: BinaryChoice[], letterIndex: number, choice: BinaryChoice): string[] => {
    const letterSequence = getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newSequence = [...sequence, choice];
    const newLetterIndex = letterIndex + 1;
    
    // Use the same logic as PERFORM
    const result = filterWords(words, newSequence, newLetterIndex, letterSequence, state.filterState.dynamicSequence);
    return choice === 'L' ? result.leftWords : result.rightWords;
  };

  const handleButtonPress = (button: 'left' | 'right' | 'up' | 'down') => {
    let spectator1Choice: BinaryChoice;
    let spectator2Choice: BinaryChoice;

    switch (button) {
      case 'left':
        spectator1Choice = 'L';
        spectator2Choice = 'L';
        break;
      case 'right':
        spectator1Choice = 'R';
        spectator2Choice = 'R';
        break;
      case 'up':
        spectator1Choice = 'L';
        spectator2Choice = 'R';
        break;
      case 'down':
        spectator1Choice = 'R';
        spectator2Choice = 'L';
        break;
      default:
        return;
    }

    // Update spectator 1
    const newSpectator1Sequence = [...spectator1Sequence, spectator1Choice];
    const newSpectator1LetterIndex = spectator1LetterIndex + 1;
    setSpectator1Sequence(newSpectator1Sequence);
    setSpectator1LetterIndex(newSpectator1LetterIndex);
    setSpectator1Words(prev => filterSpectatorWords(prev, newSpectator1Sequence, spectator1LetterIndex, spectator1Choice));

    // Update spectator 2
    const newSpectator2Sequence = [...spectator2Sequence, spectator2Choice];
    const newSpectator2LetterIndex = spectator2LetterIndex + 1;
    setSpectator2Sequence(newSpectator2Sequence);
    setSpectator2LetterIndex(newSpectator2LetterIndex);
    setSpectator2Words(prev => filterSpectatorWords(prev, newSpectator2Sequence, spectator2LetterIndex, spectator2Choice));
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleReset = () => {
    if (selectedWordList) {
      const letterSequence = getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const initialResult = filterWords(selectedWordList.words, [], 0, letterSequence, state.filterState.dynamicSequence);
      
      setSpectator1Words(initialResult.leftWords);
      setSpectator2Words(initialResult.leftWords);
      setSpectator1Sequence([]);
      setSpectator2Sequence([]);
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
              <div className="bg-dark-grey p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto">
                {getWordsToShow(getTopHalf(spectator1Words)).map((word, index) => (
                  <div key={index} className="text-white text-sm mb-1">
                    {word}
                  </div>
                ))}
                {getTopHalf(spectator1Words).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getTopHalf(spectator1Words).length - 10} more
                  </div>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="border-t-2 border-gray-600 my-4"></div>

            {/* Bottom Half */}
            <div>
              <div className="bg-dark-grey p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto">
                {getWordsToShow(getBottomHalf(spectator1Words)).map((word, index) => (
                  <div key={index} className="text-white text-sm mb-1">
                    {word}
                  </div>
                ))}
                {getBottomHalf(spectator1Words).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getBottomHalf(spectator1Words).length - 10} more
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
              <div className="bg-dark-grey p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto">
                {getWordsToShow(getTopHalf(spectator2Words)).map((word, index) => (
                  <div key={index} className="text-white text-sm mb-1">
                    {word}
                  </div>
                ))}
                {getTopHalf(spectator2Words).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getTopHalf(spectator2Words).length - 10} more
                  </div>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="border-t-2 border-gray-600 my-4"></div>

            {/* Bottom Half */}
            <div>
              <div className="bg-dark-grey p-3 rounded min-h-[100px] max-h-[100px] overflow-y-auto">
                {getWordsToShow(getBottomHalf(spectator2Words)).map((word, index) => (
                  <div key={index} className="text-white text-sm mb-1">
                    {word}
                  </div>
                ))}
                {getBottomHalf(spectator2Words).length > 10 && (
                  <div className="text-gray-400 text-xs">
                    +{getBottomHalf(spectator2Words).length - 10} more
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
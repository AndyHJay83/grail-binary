import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BinaryChoice } from '../types';

const SpectatorFilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { selectedWordList } = state;

  // State for two independent spectators
  const [spectator1Words, setSpectator1Words] = useState<string[]>([]);
  const [spectator2Words, setSpectator2Words] = useState<string[]>([]);

  // Initialize both spectators with the same word list
  useEffect(() => {
    if (selectedWordList && selectedWordList.words.length > 0) {
      setSpectator1Words([...selectedWordList.words]);
      setSpectator2Words([...selectedWordList.words]);
    }
  }, [selectedWordList]);

  const filterWords = (words: string[], choice: BinaryChoice): string[] => {
    if (words.length <= 1) return words;
    
    const midPoint = Math.ceil(words.length / 2);
    return choice === 'L' ? words.slice(0, midPoint) : words.slice(midPoint);
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

    setSpectator1Words(prev => filterWords(prev, spectator1Choice));
    setSpectator2Words(prev => filterWords(prev, spectator2Choice));
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleReset = () => {
    if (selectedWordList) {
      setSpectator1Words([...selectedWordList.words]);
      setSpectator2Words([...selectedWordList.words]);
    }
  };

  const getWordsToShow = (words: string[]) => {
    if (words.length <= 10) return words;
    return words.slice(0, 10);
  };

  const getTopHalf = (words: string[]) => {
    const midPoint = Math.ceil(words.length / 2);
    return words.slice(0, midPoint);
  };

  const getBottomHalf = (words: string[]) => {
    const midPoint = Math.ceil(words.length / 2);
    return words.slice(midPoint);
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

  return (
    <div className="min-h-screen bg-black text-white p-4">
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
              <h3 className="text-sm text-gray-400 mb-2">Top 50%</h3>
              <div className="bg-dark-grey p-3 rounded min-h-[200px] max-h-[200px] overflow-y-auto">
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
              <h3 className="text-sm text-gray-400 mb-2">Bottom 50%</h3>
              <div className="bg-dark-grey p-3 rounded min-h-[200px] max-h-[200px] overflow-y-auto">
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
              <h3 className="text-sm text-gray-400 mb-2">Top 50%</h3>
              <div className="bg-dark-grey p-3 rounded min-h-[200px] max-h-[200px] overflow-y-auto">
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
              <h3 className="text-sm text-gray-400 mb-2">Bottom 50%</h3>
              <div className="bg-dark-grey p-3 rounded min-h-[200px] max-h-[200px] overflow-y-auto">
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

      {/* D-pad Button Layout */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-4">
          {/* Top row */}
          <div></div>
          <button
            onClick={() => handleButtonPress('up')}
            className="bg-black border-2 border-gray-600 hover:border-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200"
            aria-label="Up"
          >
            ↑
          </button>
          <div></div>

          {/* Middle row */}
          <button
            onClick={() => handleButtonPress('left')}
            className="bg-black border-2 border-gray-600 hover:border-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200"
            aria-label="Left"
          >
            ←
          </button>
          <div className="w-16 h-16"></div>
          <button
            onClick={() => handleButtonPress('right')}
            className="bg-black border-2 border-gray-600 hover:border-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200"
            aria-label="Right"
          >
            →
          </button>

          {/* Bottom row */}
          <div></div>
          <button
            onClick={() => handleButtonPress('down')}
            className="bg-black border-2 border-gray-600 hover:border-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200"
            aria-label="Down"
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default SpectatorFilterPage; 
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { exportWordList, generateFilename, sanitizeFilename } from '../utils/fileExport';
import { getBackgroundColor } from '../utils/binaryFilter';
import { BinaryChoice } from '../types';

const FilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, makeBinaryChoice, resetFilter } = useAppContext();
  const { selectedWordList, filterState, userPreferences } = state;

  const handleBinaryChoice = (choice: BinaryChoice) => {
    makeBinaryChoice(choice);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleReset = () => {
    resetFilter();
  };

  const handleExport = (words: string[], side: 'left' | 'right') => {
    const baseFilename = userPreferences.exportPreferences.defaultFilename;
    const filename = generateFilename(
      `${sanitizeFilename(baseFilename)}-${side.toUpperCase()}`,
      userPreferences.exportPreferences.includeTimestamp
    );
    exportWordList(words, filename);
  };

  const getLeftBackgroundColor = () => {
    if (!selectedWordList) return 'bg-black';
    return getBackgroundColor(filterState.leftWords.length, selectedWordList.words.length);
  };

  const getRightBackgroundColor = () => {
    if (!selectedWordList) return 'bg-black';
    return getBackgroundColor(filterState.rightWords.length, selectedWordList.words.length);
  };

  const getTextColor = (backgroundColor: string): string => {
    if (backgroundColor.includes('success-green') || backgroundColor.includes('warning-red')) {
      return 'text-black';
    }
    return 'text-white';
  };

  if (!selectedWordList) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Word List Selected</h1>
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{selectedWordList.name}</h1>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary">
            Reset
          </button>
          <button onClick={handleHomeClick} className="btn-secondary">
            🏠 Home
          </button>
        </div>
      </div>

      {/* Results Area - Top 50% */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4" style={{ height: '50vh' }}>
        {/* Left Results */}
        <div className={`word-list ${getLeftBackgroundColor()}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="word-count">
              {filterState.leftWords.length.toLocaleString()} words
            </div>
            <button
              onClick={() => handleExport(filterState.leftWords, 'left')}
              className="export-btn"
              disabled={filterState.leftWords.length === 0}
            >
              Export
            </button>
          </div>
          <div className="overflow-y-auto h-full">
            {filterState.leftWords.map((word, index) => (
              <div key={index} className={`text-sm py-1 ${getTextColor(getLeftBackgroundColor())}`}>
                {word}
              </div>
            ))}
          </div>
        </div>

        {/* Right Results */}
        <div className={`word-list ${getRightBackgroundColor()}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="word-count">
              {filterState.rightWords.length.toLocaleString()} words
          </div>
            <button
              onClick={() => handleExport(filterState.rightWords, 'right')}
              className="export-btn"
              disabled={filterState.rightWords.length === 0}
            >
              Export
            </button>
          </div>

          <div className="overflow-y-auto h-full">
            {filterState.rightWords.map((word, index) => (
              <div key={index} className={`text-sm py-1 ${getTextColor(getRightBackgroundColor())}`}>
                {word}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Binary Input Area - Bottom 50% */}
      <div className="relative" style={{ height: '40vh' }}>
        {/* Buttons Container */}
        <div className="flex h-full">
          {/* Left Button - 50% width */}
          <div className="h-full w-1/2">
            <button
              onClick={() => handleBinaryChoice('L')}
              className="binary-button w-full h-full"
              disabled={filterState.letterIndex >= 26}
              aria-label="Choose left option"
            >
              {/* Unlabelled button */}
            </button>
          </div>

          {/* Right Button - 50% width */}
          <div className="h-full w-1/2">
            <button
              onClick={() => handleBinaryChoice('R')}
              className="binary-button w-full h-full"
              disabled={filterState.letterIndex >= 26}
              aria-label="Choose right option"
            >
              {/* Unlabelled button */}
            </button>
          </div>
        </div>

        {/* Current Letter - Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="letter-bubble">
            {filterState.currentLetter}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="text-center mt-4">
        <div className="text-sm text-gray-400">
          Progress: {filterState.letterIndex}/26 letters
        </div>
        {filterState.sequence.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Sequence: {filterState.sequence.join(' ')}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          <span className="inline-block bg-dark-grey px-2 py-1 rounded">Both lists below are valid interpretations of your choices.</span>
        </div>
      </div>
    </div>
  );
};

export default FilterPage; 
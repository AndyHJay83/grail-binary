import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { exportWordList, generateFilename, sanitizeFilename } from '../utils/fileExport';
import { getBackgroundColor, findSideOfferLetter } from '../utils/binaryFilter';
import { BinaryChoice } from '../types';
import { getSequenceById } from '../data/letterSequences';

const FilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, makeBinaryChoice, resetFilter, initializeMostFrequent, setSideOfferLetter, confirmSide } = useAppContext();
  const { selectedWordList, filterState, userPreferences } = state;
  
  // Refs for long press detection
  const leftButtonRef = useRef<HTMLButtonElement>(null);
  const rightButtonRef = useRef<HTMLButtonElement>(null);
  const leftPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rightPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressCompletedRef = useRef<boolean>(false);
  const longPressDelayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Touch detection to prevent double clicks
  const touchOccurredRef = useRef<boolean>(false);

  // Handle "Most Frequent" sequence initialization
  React.useEffect(() => {
    if (selectedWordList && filterState.isDynamicMode && filterState.currentLetter === 'A') {
      // This is likely the "Most Frequent" sequence that needs initialization
      const sequence = getSequenceById(userPreferences.selectedLetterSequence);
      if (sequence?.sequence === '') {
        // Only initialize if we don't already have a dynamic sequence
        if (filterState.dynamicSequence.length === 0) {
          console.log('Initializing Most Frequent sequence');
          initializeMostFrequent();
        }
      }
    }
  }, [selectedWordList, filterState.isDynamicMode, filterState.currentLetter, userPreferences.selectedLetterSequence, filterState.dynamicSequence.length, initializeMostFrequent]);

  // Check for side offer letter when filtered words change
  React.useEffect(() => {
    console.log('Checking for side offer letter:', {
      confirmNoLetter: userPreferences.confirmNoLetter,
      confirmedSide: filterState.confirmedSide,
      leftWordsCount: filterState.leftWords.length,
      rightWordsCount: filterState.rightWords.length
    });

    if (!userPreferences.confirmNoLetter || filterState.confirmedSide) {
      console.log('Side offer letter disabled:', {
        confirmNoLetter: userPreferences.confirmNoLetter,
        confirmedSide: filterState.confirmedSide
      });
      // Clear side offer letter if it exists
      if (filterState.sideOfferLetter) {
        setSideOfferLetter('');
      }
      return;
    }

    const allWords = [...filterState.leftWords, ...filterState.rightWords];
    if (allWords.length === 0) {
      console.log('No words to check for side offer letter');
      // Clear side offer letter if it exists
      if (filterState.sideOfferLetter) {
        setSideOfferLetter('');
      }
      return;
    }

    console.log('Looking for side offer letter in', allWords.length, 'words');
    const sideOfferLetter = findSideOfferLetter(allWords);
    console.log('Side offer letter found:', sideOfferLetter);
    
    // Only update if the letter has changed
    if (sideOfferLetter !== filterState.sideOfferLetter) {
      if (sideOfferLetter) {
        setSideOfferLetter(sideOfferLetter);
      } else {
        setSideOfferLetter('');
      }
    }
  }, [filterState.leftWords, filterState.rightWords, userPreferences.confirmNoLetter, filterState.confirmedSide, filterState.sideOfferLetter, setSideOfferLetter]);

  // Long press handlers
  const startLongPress = (side: 'L' | 'R', timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (!filterState.sideOfferLetter) return;
    
    console.log('Starting long press for side:', side);
    
    timerRef.current = setTimeout(() => {
      console.log('Long press completed for side:', side, 'confirming as NO');
      // Confirm the pressed side as NO
      confirmSide(side, 'NO');
      
      // Set a delay to prevent accidental clicks
      longPressCompletedRef.current = true;
      longPressDelayRef.current = setTimeout(() => {
        longPressCompletedRef.current = false;
        longPressDelayRef.current = null;
      }, 500); // 500ms delay
    }, 500); // 0.5 seconds
  };

  const endLongPress = (timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Touch/click handlers for left button
  const handleLeftMouseDown = () => {
    // Ignore mouse events if a touch occurred recently
    if (touchOccurredRef.current) {
      touchOccurredRef.current = false;
      return;
    }
    
    if (filterState.sideOfferLetter) {
      startLongPress('L', leftPressTimerRef);
    }
  };

  const handleLeftMouseUp = () => {
    // Ignore mouse events if a touch occurred recently
    if (touchOccurredRef.current) {
      touchOccurredRef.current = false;
      return;
    }
    
    endLongPress(leftPressTimerRef);
    // Only make binary choice if no long press delay is active
    if (!longPressCompletedRef.current) {
      handleBinaryChoice('L');
    }
  };

  const handleLeftTouchStart = () => {
    touchOccurredRef.current = true;
    if (filterState.sideOfferLetter) {
      startLongPress('L', leftPressTimerRef);
    }
  };

  const handleLeftTouchEnd = () => {
    endLongPress(leftPressTimerRef);
    // Only make binary choice if no long press delay is active
    if (!longPressCompletedRef.current) {
      handleBinaryChoice('L');
    }
  };

  // Touch/click handlers for right button
  const handleRightMouseDown = () => {
    // Ignore mouse events if a touch occurred recently
    if (touchOccurredRef.current) {
      touchOccurredRef.current = false;
      return;
    }
    
    if (filterState.sideOfferLetter) {
      startLongPress('R', rightPressTimerRef);
    }
  };

  const handleRightMouseUp = () => {
    // Ignore mouse events if a touch occurred recently
    if (touchOccurredRef.current) {
      touchOccurredRef.current = false;
      return;
    }
    
    endLongPress(rightPressTimerRef);
    // Only make binary choice if no long press delay is active
    if (!longPressCompletedRef.current) {
      handleBinaryChoice('R');
    }
  };

  const handleRightTouchStart = () => {
    touchOccurredRef.current = true;
    if (filterState.sideOfferLetter) {
      startLongPress('R', rightPressTimerRef);
    }
  };

  const handleRightTouchEnd = () => {
    endLongPress(rightPressTimerRef);
    // Only make binary choice if no long press delay is active
    if (!longPressCompletedRef.current) {
      handleBinaryChoice('R');
    }
  };

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
    return getBackgroundColor(filterState.leftWords.length);
  };

  const getRightBackgroundColor = () => {
    if (!selectedWordList) return 'bg-black';
    return getBackgroundColor(filterState.rightWords.length);
  };

  const getTextColor = (backgroundColor: string): string => {
    if (backgroundColor.includes('success-green') || backgroundColor.includes('orange-400') || backgroundColor.includes('red-400')) {
      return 'text-black';
    }
    return 'text-white';
  };

  // Determine which words to show based on confirmed side
  const getWordsToShow = () => {
    console.log('getWordsToShow called with:', {
      confirmedSide: filterState.confirmedSide,
      confirmedSideValue: filterState.confirmedSideValue,
      leftWordsCount: filterState.leftWords.length,
      rightWordsCount: filterState.rightWords.length
    });

    if (!filterState.confirmedSide) {
      return {
        leftWords: filterState.leftWords,
        rightWords: filterState.rightWords
      };
    }

    // If side is confirmed, only show the confirmed interpretation
    if (filterState.confirmedSide === 'L') {
      console.log('Showing only left words (right confirmed as NO)');
      return {
        leftWords: filterState.leftWords,
        rightWords: []
      };
    } else {
      console.log('Showing only right words (left confirmed as NO)');
      return {
        leftWords: [],
        rightWords: filterState.rightWords
      };
    }
  };

  const { leftWords: displayLeftWords, rightWords: displayRightWords } = getWordsToShow();

  // Debug side offer letter display
  console.log('Side offer letter display check:', {
    sideOfferLetter: filterState.sideOfferLetter,
    confirmedSide: filterState.confirmedSide,
    shouldShow: filterState.sideOfferLetter && !filterState.confirmedSide
  });

  if (!selectedWordList) {
    navigate('/');
    return null;
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
              {displayLeftWords.length.toLocaleString()} words
            </div>
            <button
              onClick={() => handleExport(displayLeftWords, 'left')}
              className="export-btn"
              disabled={displayLeftWords.length === 0}
            >
              Export
            </button>
          </div>
          <div className="overflow-y-auto h-full">
            {displayLeftWords.map((word, index) => (
              <div key={index} className={`text-base py-1 ${getTextColor(getLeftBackgroundColor())}`}>
                {word}
              </div>
            ))}
          </div>
        </div>

        {/* Right Results */}
        <div className={`word-list ${getRightBackgroundColor()}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="word-count">
              {displayRightWords.length.toLocaleString()} words
          </div>
            <button
              onClick={() => handleExport(displayRightWords, 'right')}
              className="export-btn"
              disabled={displayRightWords.length === 0}
            >
              Export
            </button>
          </div>

          <div className="overflow-y-auto h-full">
            {displayRightWords.map((word, index) => (
              <div key={index} className={`text-base py-1 ${getTextColor(getRightBackgroundColor())}`}>
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
              ref={leftButtonRef}
              onMouseDown={handleLeftMouseDown}
              onMouseUp={handleLeftMouseUp}
              onTouchStart={handleLeftTouchStart}
              onTouchEnd={handleLeftTouchEnd}
              className="binary-button w-full h-full flex items-center justify-center"
              disabled={filterState.letterIndex >= 26}
              aria-label="Choose left option"
            >
              {filterState.confirmedSide && (
                <span className={`text-2xl font-bold ${filterState.confirmedSide === 'L' ? 'text-red-400' : 'text-green-400'}`}>
                  {filterState.confirmedSide === 'L' ? 'NO' : 'YES'}
                </span>
              )}
            </button>
          </div>

          {/* Right Button - 50% width */}
          <div className="h-full w-1/2">
            <button
              ref={rightButtonRef}
              onMouseDown={handleRightMouseDown}
              onMouseUp={handleRightMouseUp}
              onTouchStart={handleRightTouchStart}
              onTouchEnd={handleRightTouchEnd}
              className="binary-button w-full h-full flex items-center justify-center"
              disabled={filterState.letterIndex >= 26}
              aria-label="Choose right option"
            >
              {filterState.confirmedSide && (
                <span className={`text-2xl font-bold ${filterState.confirmedSide === 'R' ? 'text-red-400' : 'text-green-400'}`}>
                  {filterState.confirmedSide === 'R' ? 'NO' : 'YES'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Current Letter - Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`letter-bubble ${filterState.isDynamicMode ? 'text-red-500' : ''}`}>
            {filterState.currentLetter}
          </div>
        </div>

        {/* Side Offer Letter - Center Overlay */}
        {filterState.sideOfferLetter && !filterState.confirmedSide && (
          <div className="absolute left-0 w-full flex items-center justify-center pointer-events-none" style={{ top: '5%', position: 'absolute' }}>
            <div className="letter-bubble text-red-600 font-bold">
              {filterState.sideOfferLetter}
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="text-center mt-4">
        <div className="text-sm text-gray-400">
          Progress: {filterState.letterIndex}/{getSequenceById(state.userPreferences.selectedLetterSequence)?.sequence.length || 26} letters
        </div>
        {filterState.sequence.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Sequence: {filterState.sequence.join(' ')}
          </div>
        )}
        {!filterState.confirmedSide && (
          <div className="text-xs text-gray-500 mt-2">
            <span className="inline-block bg-dark-grey px-2 py-1 rounded">Both lists below are valid interpretations of your choices.</span>
          </div>
        )}
        {filterState.confirmedSide && (
          <div className="text-xs text-green-400 mt-2">
            <span className="inline-block bg-green-900 px-2 py-1 rounded">Side confirmed: {filterState.confirmedSide === 'L' ? 'Left' : 'Right'} = {filterState.confirmedSideValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPage; 
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { findSideOfferLetter } from '../utils/binaryFilter';

const FilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, makeBinaryChoice, resetFilter, initializeMostFrequent, setSideOfferLetter, confirmSide } = useAppContext();
  const { selectedWordList, filterState, userPreferences } = state;
  
  // NEW: Psychological profiling state
  const [isPsychologicalProfilingActive] = React.useState(false);

  // Long press timers
  const leftLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const rightLongPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Most Frequent mode if needed
  useEffect(() => {
    if (selectedWordList && userPreferences.selectedLetterSequence === 'most-frequent' && !filterState.isDynamicMode) {
      initializeMostFrequent();
    }
  }, [selectedWordList, userPreferences.selectedLetterSequence, filterState.isDynamicMode, initializeMostFrequent]);

  // Side offer letter effect - FIXED: Remove infinite loop
  useEffect(() => {
    if (!userPreferences.confirmNoLetter || filterState.confirmedSide) {
      if (filterState.sideOfferLetter) {
        setSideOfferLetter('');
      }
      return;
    }

    const allWords = [...filterState.leftWords, ...filterState.rightWords];
    if (allWords.length === 0) {
      if (filterState.sideOfferLetter) {
        setSideOfferLetter('');
      }
      return;
    }

    console.log('Looking for side offer letter in', allWords.length, 'words');
    console.log('Sample words:', allWords.slice(0, 5));
    console.log('=== findSideOfferLetter called ===');
    console.log('Words to analyze:', allWords);
    
    const sideOfferLetter = findSideOfferLetter(allWords);
    
    console.log('Side offer letter found:', sideOfferLetter);
    
    if (sideOfferLetter !== filterState.sideOfferLetter) {
      if (sideOfferLetter) {
        console.log('Setting side offer letter:', sideOfferLetter);
        setSideOfferLetter(sideOfferLetter);
      } else {
        console.log('Clearing side offer letter');
        setSideOfferLetter('');
      }
    } else {
      console.log('Side offer letter unchanged:', sideOfferLetter);
    }
  }, [filterState.leftWords, filterState.rightWords, userPreferences.confirmNoLetter, filterState.confirmedSide]);

  // Long press handlers
  const startLongPress = (side: 'L' | 'R', timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    console.log('startLongPress called:', { side });
    timerRef.current = setTimeout(() => {
      console.log('Long press triggered for:', side);
      confirmSide(side, 'NO');
    }, 500);
  };

  const endLongPress = (timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleLeftClick = () => {
    if (isPsychologicalProfilingActive) {
      // Psychological profiling not implemented in this version
    } else {
      makeBinaryChoice('L');
    }
  };

  const handleRightClick = () => {
    if (isPsychologicalProfilingActive) {
      // Psychological profiling not implemented in this version
    } else {
      makeBinaryChoice('R');
    }
  };

  const handleLeftMouseDown = () => {
    startLongPress('L', leftLongPressTimer);
  };

  const handleLeftMouseUp = () => {
    endLongPress(leftLongPressTimer);
  };

  const handleRightMouseDown = () => {
    startLongPress('R', rightLongPressTimer);
  };

  const handleRightMouseUp = () => {
    endLongPress(rightLongPressTimer);
  };

  const handleLeftTouchStart = () => {
    startLongPress('L', leftLongPressTimer);
  };

  const handleLeftTouchEnd = () => {
    endLongPress(leftLongPressTimer);
  };

  const handleRightTouchStart = () => {
    startLongPress('R', rightLongPressTimer);
  };

  const handleRightTouchEnd = () => {
    endLongPress(rightLongPressTimer);
  };

  const getWordsToShow = () => {
    const { confirmedSide, confirmedSideValue, leftWordsCount, rightWordsCount, psychologicalAnswers } = {
      confirmedSide: filterState.confirmedSide,
      confirmedSideValue: filterState.confirmedSideValue,
      leftWordsCount: filterState.leftWords.length,
      rightWordsCount: filterState.rightWords.length,
      psychologicalAnswers: filterState.psychologicalAnswers
    };

    console.log('getWordsToShow called:', { confirmedSide, confirmedSideValue, leftWordsCount, rightWordsCount, psychologicalAnswers });

    if (confirmedSide && confirmedSideValue) {
      console.log('Side confirmed - showing single interpretation');
      return confirmedSide === 'L' ? filterState.leftWords : filterState.rightWords;
    } else {
      console.log('No side confirmed - showing both interpretations');
      return [...filterState.leftWords, ...filterState.rightWords];
    }
  };

  const wordsToShow = getWordsToShow();

  if (!selectedWordList) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">No Word List Selected</div>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/')} className="btn-secondary">
          ← Back
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{selectedWordList.name}</h1>
          <p className="text-gray-400">{selectedWordList.words.length.toLocaleString()} words</p>
        </div>
        <button onClick={() => navigate('/settings')} className="btn-secondary">
          ⚙️ Settings
        </button>
      </div>

      {/* Current Letter Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold mb-4">{filterState.currentLetter}</div>
        <div className="text-gray-400">
          Sequence: {filterState.sequence.join('')}
        </div>
      </div>

      {/* Word Count Display */}
      <div className="text-center mb-8">
        <div className="text-xl">
          {wordsToShow.length.toLocaleString()} words remaining
        </div>
        {filterState.confirmedSide && (
          <div className="text-sm text-gray-400 mt-2">
            Side confirmed: {filterState.confirmedSide} = {filterState.confirmedSideValue}
          </div>
        )}
      </div>

      {/* Binary Choice Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={handleLeftClick}
          onMouseDown={handleLeftMouseDown}
          onMouseUp={handleLeftMouseUp}
          onTouchStart={handleLeftTouchStart}
          onTouchEnd={handleLeftTouchEnd}
          className="btn-primary text-2xl py-8"
        >
          LEFT
        </button>
        <button
          onClick={handleRightClick}
          onMouseDown={handleRightMouseDown}
          onMouseUp={handleRightMouseUp}
          onTouchStart={handleRightTouchStart}
          onTouchEnd={handleRightTouchEnd}
          className="btn-primary text-2xl py-8"
        >
          RIGHT
        </button>
      </div>

      {/* Side Offer Letter Display */}
      {filterState.sideOfferLetter && (
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400 mb-2">Side Offer Letter:</div>
          <div className="text-2xl font-bold">{filterState.sideOfferLetter}</div>
          <div className="text-xs text-gray-400 mt-1">
            Long press either button to confirm that side as NO
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="text-center">
        <button onClick={resetFilter} className="btn-secondary">
          Reset Filter
        </button>
      </div>
    </div>
  );
};

export default FilterPage; 
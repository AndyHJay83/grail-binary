import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { exportWordList, generateFilename, sanitizeFilename } from '../utils/fileExport';
import { getBackgroundColor, findSideOfferLetter } from '../utils/binaryFilter';
import { generateAiReading } from '../utils/aiService';
import { BinaryChoice } from '../types';
import { getSequenceById } from '../data/letterSequences';

const FilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, makeBinaryChoice, resetFilter, initializeMostFrequent, setSideOfferLetter, confirmSide, setPsychologicalAnswers } = useAppContext();
  const { selectedWordList, filterState, userPreferences } = state;
  
  // NEW: Psychological profiling state
  const [currentPsychologicalQuestionIndex, setCurrentPsychologicalQuestionIndex] = React.useState<number>(-1);
  const [psychologicalAnswers, setPsychologicalAnswersLocal] = React.useState<{ [questionId: string]: BinaryChoice }>({});
  const [psychologicalQuestionsCompleted, setPsychologicalQuestionsCompleted] = React.useState<boolean>(false);
  
  // NEW: AI reading state
  const [aiReading, setAiReading] = React.useState<string>('');
  const [isGeneratingReading, setIsGeneratingReading] = React.useState<boolean>(false);
  
  // Get enabled psychological questions
  const enabledPsychologicalQuestions = userPreferences.psychologicalProfiling.enabled 
    ? userPreferences.psychologicalProfiling.questions.filter(q => q.enabled)
    : [];
  
  // Check if we should show psychological questions
  const shouldShowPsychologicalQuestions = enabledPsychologicalQuestions.length > 0 && 
    currentPsychologicalQuestionIndex >= 0 && 
    currentPsychologicalQuestionIndex < enabledPsychologicalQuestions.length &&
    !psychologicalQuestionsCompleted;
  
  // Initialize psychological questions when component mounts
  React.useEffect(() => {
    if (enabledPsychologicalQuestions.length > 0 && currentPsychologicalQuestionIndex === -1 && !psychologicalQuestionsCompleted) {
      console.log('Starting psychological profiling with', enabledPsychologicalQuestions.length, 'questions');
      setCurrentPsychologicalQuestionIndex(0);
    }
  }, [enabledPsychologicalQuestions.length, psychologicalQuestionsCompleted]);
  
  // Refs for long press detection
  const leftButtonRef = useRef<HTMLButtonElement>(null);
  const rightButtonRef = useRef<HTMLButtonElement>(null);
  const leftPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rightPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressCompletedRef = useRef<boolean>(false);
  const longPressDelayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Touch detection to prevent double clicks
  const touchOccurredRef = useRef<boolean>(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  // Check for side offer letter when filtered words change
  React.useEffect(() => {
    console.log('=== SIDE OFFER LETTER EFFECT TRIGGERED ===');
    console.log('Side offer letter effect:', {
      confirmNoLetter: userPreferences.confirmNoLetter,
      confirmedSide: filterState.confirmedSide,
      leftWordsCount: filterState.leftWords.length,
      rightWordsCount: filterState.rightWords.length,
      currentSideOfferLetter: filterState.sideOfferLetter,
      sampleLeftWords: filterState.leftWords.slice(0, 3),
      sampleRightWords: filterState.rightWords.slice(0, 3)
    });

    if (!userPreferences.confirmNoLetter || filterState.confirmedSide) {
      console.log('Side offer letter disabled or side already confirmed');
      // Clear side offer letter if it exists
      if (filterState.sideOfferLetter) {
        setSideOfferLetter('');
      }
      return;
    }

    const allWords = [...filterState.leftWords, ...filterState.rightWords];
    console.log('All words for side offer analysis:', allWords);
    
    if (allWords.length === 0) {
      console.log('No words to check for side offer letter');
      // Clear side offer letter if it exists
      if (filterState.sideOfferLetter) {
        setSideOfferLetter('');
      }
      return;
    }

    console.log('Looking for side offer letter in', allWords.length, 'words');
    console.log('Sample words:', allWords.slice(0, 5));
    const sideOfferLetter = findSideOfferLetter(allWords);
    console.log('Side offer letter found:', sideOfferLetter);
    
    // Only update if the letter has changed
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
  }, [filterState.leftWords, filterState.rightWords, userPreferences.confirmNoLetter, filterState.confirmedSide, filterState.sideOfferLetter, setSideOfferLetter]);

  // Long press handlers
  const startLongPress = (side: 'L' | 'R', timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    console.log('startLongPress called:', { side, sideOfferLetter: filterState.sideOfferLetter });
    if (!filterState.sideOfferLetter) {
      console.log('No side offer letter - returning');
      return;
    }
    
    console.log('Starting long press timer for side:', side);
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
    console.log('handleLeftMouseDown called');
    // Ignore mouse events if a touch occurred recently
    if (touchOccurredRef.current) {
      console.log('Touch occurred recently - ignoring mouse event');
      touchOccurredRef.current = false;
      return;
    }
    
    if (filterState.sideOfferLetter) {
      console.log('Starting long press for left button');
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

  const handleLeftTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse events from firing
    touchOccurredRef.current = true;
    
    // Clear any existing timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    // Set a timeout to reset the touch flag after mouse events would have fired
    touchTimeoutRef.current = setTimeout(() => {
      touchOccurredRef.current = false;
    }, 300);
    
    if (filterState.sideOfferLetter) {
      startLongPress('L', leftPressTimerRef);
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse events from firing
    endLongPress(leftPressTimerRef);
    // Only make binary choice if no long press delay is active
    if (!longPressCompletedRef.current) {
      handleBinaryChoice('L');
    }
  };

  // Touch/click handlers for right button
  const handleRightMouseDown = () => {
    console.log('handleRightMouseDown called');
    // Ignore mouse events if a touch occurred recently
    if (touchOccurredRef.current) {
      console.log('Touch occurred recently - ignoring mouse event');
      touchOccurredRef.current = false;
      return;
    }
    
    if (filterState.sideOfferLetter) {
      console.log('Starting long press for right button');
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

  const handleRightTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse events from firing
    touchOccurredRef.current = true;
    
    // Clear any existing timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    // Set a timeout to reset the touch flag after mouse events would have fired
    touchTimeoutRef.current = setTimeout(() => {
      touchOccurredRef.current = false;
    }, 300);
    
    if (filterState.sideOfferLetter) {
      startLongPress('R', rightPressTimerRef);
    }
  };

  const handleRightTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse events from firing
    endLongPress(rightPressTimerRef);
    // Only make binary choice if no long press delay is active
    if (!longPressCompletedRef.current) {
      handleBinaryChoice('R');
    }
  };

  const handleBinaryChoice = (choice: BinaryChoice) => {
    console.log('Binary choice made:', choice);
    
    // NEW: Handle psychological questions first
    if (shouldShowPsychologicalQuestions) {
      const currentQuestion = enabledPsychologicalQuestions[currentPsychologicalQuestionIndex];
      console.log('Answering psychological question:', currentQuestion.text, 'with choice:', choice);
      
      // Store the answer
      const newAnswers = { ...psychologicalAnswers, [currentQuestion.id]: choice };
      setPsychologicalAnswersLocal(newAnswers);
      
      // Move to next question or start letter sequence
      const nextIndex = currentPsychologicalQuestionIndex + 1;
      if (nextIndex < enabledPsychologicalQuestions.length) {
        console.log('Moving to next psychological question:', nextIndex);
        setCurrentPsychologicalQuestionIndex(nextIndex);
      } else {
        console.log('All psychological questions answered, starting letter sequence');
        setCurrentPsychologicalQuestionIndex(-1); // Hide questions
        setPsychologicalAnswers(newAnswers); // Save to context
        setPsychologicalQuestionsCompleted(true); // Mark questions as completed
        // Reset filter to start letter sequence
        resetFilter();
      }
      return;
    }
    
    // Normal letter sequence logic
    makeBinaryChoice(choice);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleReset = () => {
    resetFilter();
    // Reset psychological questions state
    setCurrentPsychologicalQuestionIndex(-1);
    setPsychologicalAnswersLocal({});
    setPsychologicalQuestionsCompleted(false);
  };

  const handleExport = (words: string[], side: 'left' | 'right') => {
    const baseFilename = userPreferences.exportPreferences.defaultFilename;
    const filename = generateFilename(
      `${sanitizeFilename(baseFilename)}-${side.toUpperCase()}`,
      userPreferences.exportPreferences.includeTimestamp
    );
    exportWordList(words, filename);
  };

  // NEW: AI reading generation function
  const handleGenerateAiReading = async (profileAnswers: string[]) => {
    if (profileAnswers.length === 0) return;
    
    setIsGeneratingReading(true);
    setAiReading(''); // Clear previous reading
    
    try {
      const response = await generateAiReading({
        prompt: 'Generate a psychological reading based on the user\'s binary choice responses.',
        profileAnswers: profileAnswers
      });
      
      setAiReading(response.reading);
    } catch (error) {
      console.error('Error generating AI reading:', error);
      setAiReading('Unable to generate reading at this time. Please try again later.');
    } finally {
      setIsGeneratingReading(false);
    }
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
    console.log('getWordsToShow called:', {
      confirmedSide: filterState.confirmedSide,
      confirmedSideValue: filterState.confirmedSideValue,
      leftWordsCount: filterState.leftWords.length,
      rightWordsCount: filterState.rightWords.length,
      psychologicalAnswers: filterState.psychologicalAnswers,
      psychologicalProfile: filterState.psychologicalProfile
    });

    if (!filterState.confirmedSide) {
      console.log('No side confirmed - showing both interpretations');
      return {
        leftWords: filterState.leftWords,
        rightWords: filterState.rightWords
      };
    }

    // If side is confirmed, show only the correct interpretation
    // When R is confirmed as NO, L becomes YES, so show left words
    // When L is confirmed as NO, R becomes YES, so show right words
    if (filterState.confirmedSide === 'R' && filterState.confirmedSideValue === 'NO') {
      console.log('R confirmed as NO, L is YES - showing left words');
      
      // Check if we have psychological profile to display
      if (filterState.psychologicalProfile && filterState.psychologicalProfile.decodedProfile) {
        console.log('Showing psychological profile in right wordlist');
        return {
          leftWords: filterState.leftWords,
          rightWords: filterState.psychologicalProfile.decodedProfile // Show profile in right (empty) wordlist
        };
      }
      
      return {
        leftWords: filterState.leftWords,
        rightWords: []
      };
    } else if (filterState.confirmedSide === 'L' && filterState.confirmedSideValue === 'NO') {
      console.log('L confirmed as NO, R is YES - showing right words');
      
      // Check if we have psychological profile to display
      if (filterState.psychologicalProfile && filterState.psychologicalProfile.decodedProfile) {
        console.log('Showing psychological profile in left wordlist');
        return {
          leftWords: filterState.psychologicalProfile.decodedProfile, // Show profile in left (empty) wordlist
          rightWords: filterState.rightWords
        };
      }
      
      return {
        leftWords: [],
        rightWords: filterState.rightWords
      };
    } else {
      console.log('Unexpected confirmed side state:', { confirmedSide: filterState.confirmedSide, confirmedSideValue: filterState.confirmedSideValue });
      return {
        leftWords: filterState.leftWords,
        rightWords: filterState.rightWords
      };
    }
  };

  const { leftWords: displayLeftWords, rightWords: displayRightWords } = getWordsToShow();

  if (!selectedWordList) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 no-highlight">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold no-highlight">{selectedWordList.name}</h1>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary no-highlight">
            Reset
          </button>
          <button onClick={handleHomeClick} className="btn-secondary no-highlight">
            🏠 Home
          </button>
        </div>
      </div>

      {/* NEW: Psychological Question Display */}
      {shouldShowPsychologicalQuestions && (
        <div className="bg-dark-grey p-6 rounded-lg mb-4 no-highlight">
          <div className="text-center">
            <div className="text-lg font-medium no-highlight">
              {enabledPsychologicalQuestions[currentPsychologicalQuestionIndex].text}
            </div>
          </div>
        </div>
      )}

      {/* Results Area - Dynamic height based on psychological questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4" style={{ height: shouldShowPsychologicalQuestions ? '20vh' : '50vh' }}>
        {/* Left Results */}
        <div className={`word-list ${getLeftBackgroundColor()} relative no-highlight`}>
          <div className="flex justify-between items-center mb-2">
            <div className="word-count no-highlight">
              {displayLeftWords.length > 0 && displayLeftWords.length <= 10 && displayLeftWords.every(word => word.includes(': '))
                ? 'Profile Results' 
                : `${displayLeftWords.length.toLocaleString()} words`}
            </div>
            <button
              onClick={() => handleExport(displayLeftWords, 'left')}
              className="export-btn no-highlight"
              disabled={displayLeftWords.length === 0}
            >
              Export
            </button>
          </div>
          <div className="overflow-y-auto h-full">
            {displayLeftWords.map((word, index) => (
              <div key={index} className={`text-base py-1 no-highlight ${getTextColor(getLeftBackgroundColor())}`}>
                {word}
              </div>
            ))}
          </div>
          
          {/* AI Button for psychological profile - temporarily hidden */}
          {/* {displayLeftWords.length > 0 && displayLeftWords.length <= 10 && displayLeftWords.every(word => word.includes(': ')) && (
            <button
              onClick={() => handleGenerateAiReading(displayLeftWords)}
              disabled={isGeneratingReading}
              className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isGeneratingReading ? '🤖 Thinking...' : '🤖 AI Reading'}
            </button>
          )} */}
        </div>

        {/* Right Results */}
        <div className={`word-list ${getRightBackgroundColor()} relative no-highlight`}>
          <div className="flex justify-between items-center mb-2">
            <div className="word-count no-highlight">
              {displayRightWords.length > 0 && displayRightWords.length <= 10 && displayRightWords.every(word => word.includes(': '))
                ? 'Profile Results' 
                : `${displayRightWords.length.toLocaleString()} words`}
            </div>
            <button
              onClick={() => handleExport(displayRightWords, 'right')}
              className="export-btn no-highlight"
              disabled={displayRightWords.length === 0}
            >
              Export
            </button>
          </div>

          <div className="overflow-y-auto h-full">
            {displayRightWords.map((word, index) => (
              <div key={index} className={`text-base py-1 no-highlight ${getTextColor(getRightBackgroundColor())}`}>
                {word}
              </div>
            ))}
          </div>
          
          {/* AI Button for psychological profile - temporarily hidden */}
          {/* {displayRightWords.length > 0 && displayRightWords.length <= 10 && displayRightWords.every(word => word.includes(': ')) && (
            <button
              onClick={() => handleGenerateAiReading(displayRightWords)}
              disabled={isGeneratingReading}
              className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isGeneratingReading ? '🤖 Thinking...' : '🤖 AI Reading'}
            </button>
          )} */}
        </div>
      </div>

      {/* NEW: AI Reading Display */}
      {aiReading && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-lg mb-4 border border-purple-500 no-highlight">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2 no-highlight">🤖</span>
            <h3 className="text-xl font-semibold text-white no-highlight">AI Reading</h3>
          </div>
          <p className="text-white text-lg leading-relaxed no-highlight">{aiReading}</p>
          <button
            onClick={() => setAiReading('')}
            className="mt-3 text-purple-300 hover:text-white text-sm underline no-highlight"
          >
            Clear Reading
          </button>
        </div>
      )}

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
                <span className={`text-2xl font-bold no-highlight ${filterState.confirmedSide === 'L' ? 'text-red-400' : 'text-green-400'}`}>
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
                <span className={`text-2xl font-bold no-highlight ${filterState.confirmedSide === 'R' ? 'text-red-400' : 'text-green-400'}`}>
                  {filterState.confirmedSide === 'R' ? 'NO' : 'YES'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Current Letter - Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`letter-bubble no-highlight ${filterState.isDynamicMode ? 'text-red-500' : ''}`}>
            {shouldShowPsychologicalQuestions ? 'L' : filterState.currentLetter}
          </div>
        </div>

        {/* Right Button Label - Overlay */}
        {shouldShowPsychologicalQuestions && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="letter-bubble no-highlight text-blue-400">
              R
            </div>
          </div>
        )}

        {/* Side Offer Letter - Overlay */}
        {filterState.sideOfferLetter && !shouldShowPsychologicalQuestions && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="letter-bubble no-highlight bg-yellow-600 text-black">
              {filterState.sideOfferLetter}
            </div>
          </div>
        )}

        {/* Long Press Instructions - Overlay */}
        {filterState.sideOfferLetter && !shouldShowPsychologicalQuestions && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm no-highlight">
              Long press to confirm side
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator - Removed to prevent text highlighting during long press */}
    </div>
  );
};

export default FilterPage; 
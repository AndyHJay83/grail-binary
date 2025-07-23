import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BinaryChoice } from '../types';
import { filterWords, getBackgroundColor, getNextLetterWithDynamic, selectNextDynamicLetter } from '../utils/binaryFilter';
import { getSequenceById } from '../data/letterSequences';

const SpectatorFilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setPsychologicalAnswers } = useAppContext();
  const { selectedWordList } = state;
  const { userPreferences } = state;
  const enabledPsychologicalQuestions = userPreferences.psychologicalProfiling.enabled
    ? userPreferences.psychologicalProfiling.questions.filter(q => q.enabled)
    : [];
  const [currentPsychologicalQuestionIndex, setCurrentPsychologicalQuestionIndex] = useState<number>(-1);
  const [psychologicalAnswers, setPsychologicalAnswersLocal] = useState<{ [questionId: string]: { person1: BinaryChoice; person2: BinaryChoice } }>({});
  const [psychologicalQuestionsCompleted, setPsychologicalQuestionsCompleted] = useState<boolean>(false);

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

  // Add state for long press
  const [longPressYesSide, setLongPressYesSide] = useState<[BinaryChoice, BinaryChoice] | null>(null);

  // Helper to decode answers
  const decodeProfilingAnswers = (yesSide: [BinaryChoice, BinaryChoice]) => {
    const person1Results: string[] = [];
    const person2Results: string[] = [];
    enabledPsychologicalQuestions.forEach(q => {
      const ans = psychologicalAnswers[q.id];
      // If unanswered, leave blank
      if (!ans) {
        person1Results.push(`${q.text} : `);
        person2Results.push(`${q.text} : `);
        return;
      }
      person1Results.push(`${q.text} : ${ans.person1 === yesSide[0] ? 'YES' : 'NO'}`);
      person2Results.push(`${q.text} : ${ans.person2 === yesSide[1] ? 'YES' : 'NO'}`);
    });
    return { person1Results, person2Results };
  };

  // Auto-start question phase on mount if profiling enabled and questions ticked
  useEffect(() => {
    if (
      enabledPsychologicalQuestions.length > 0 &&
      currentPsychologicalQuestionIndex === -1 &&
      !psychologicalQuestionsCompleted
    ) {
      setCurrentPsychologicalQuestionIndex(0);
    }
  }, [enabledPsychologicalQuestions.length, currentPsychologicalQuestionIndex, psychologicalQuestionsCompleted]);

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
      
      // Reset local state for used letters
      setUsedLetters(new Set());
      
      // Handle Most Frequent sequence initialization
      const sequence = getSequenceById(state.userPreferences.selectedLetterSequence);
      if (sequence?.sequence === '') {
        // Most Frequent sequence selected - initialize the first letter
        const firstLetter = selectNextDynamicLetter(selectedWordList.words, new Set());
        if (firstLetter) {
          setDynamicSequence([firstLetter]);
        } else {
          // No letters available - set empty sequence to show completion
          setDynamicSequence([]);
        }
      } else {
        // Reset dynamic sequence for non-Most Frequent sequences
        setDynamicSequence([]);
      }
    }
  }, [selectedWordList, state.userPreferences.selectedLetterSequence, state.filterState.dynamicSequence]);

  const getCurrentLetter = (): { letter: string; isDynamic: boolean } => {
    // Don't try to get current letter if we don't have a word list yet
    if (!selectedWordList || selectedWordList.words.length === 0) {
      return { letter: '', isDynamic: false };
    }

    const selectedSequence = getSequenceById(state.userPreferences.selectedLetterSequence);
    const letterSequence = selectedSequence?.sequence !== undefined ? selectedSequence.sequence : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const currentIndex = Math.max(spectator1LetterIndex, spectator2LetterIndex);
    
    // Get all remaining words from all sections for frequency analysis
    const allRemainingWords = [
      ...spectator1TopWords,
      ...spectator1BottomWords,
      ...spectator2TopWords,
      ...spectator2BottomWords
    ];
    
    // Use the same logic as PERFORM with local used letters
    const result = getNextLetterWithDynamic(
      currentIndex,
      letterSequence,
      allRemainingWords,
      usedLetters,
      state.userPreferences.mostFrequentFilter
    );
    
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

  // Modified handleButtonPress to support profiling phase
  const handleButtonPress = (button: 'left' | 'right' | 'up' | 'down') => {
    // If in profiling phase, log answer and progress
    if (
      enabledPsychologicalQuestions.length > 0 &&
      currentPsychologicalQuestionIndex >= 0 &&
      currentPsychologicalQuestionIndex < enabledPsychologicalQuestions.length &&
      !psychologicalQuestionsCompleted
    ) {
      const currentQuestion = enabledPsychologicalQuestions[currentPsychologicalQuestionIndex];
      let answer: { person1: BinaryChoice; person2: BinaryChoice };
      switch (button) {
        case 'left':
          answer = { person1: 'L', person2: 'L' };
          break;
        case 'right':
          answer = { person1: 'R', person2: 'R' };
          break;
        case 'up':
          answer = { person1: 'L', person2: 'R' };
          break;
        case 'down':
          answer = { person1: 'R', person2: 'L' };
          break;
        default:
          return;
      }
      const newAnswers = { ...psychologicalAnswers, [currentQuestion.id]: answer };
      // LOGGING: Show question, answer, and all answers so far
      console.log('[PROFILING] Q:', currentQuestion.text, '| Chosen:', answer, '| All:', newAnswers);
      setPsychologicalAnswersLocal(newAnswers);
      const nextIndex = currentPsychologicalQuestionIndex + 1;
      if (nextIndex < enabledPsychologicalQuestions.length) {
        setCurrentPsychologicalQuestionIndex(nextIndex);
      } else {
        setCurrentPsychologicalQuestionIndex(-1);
        setPsychologicalAnswers(newAnswers);
        setPsychologicalQuestionsCompleted(true);
      }
      return;
    }

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

  // Modify D-Pad buttons to support long press
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleDPadPress = (button: 'left' | 'right' | 'up' | 'down') => {
    // Normal press: answer profiling or letter sequence
    handleButtonPress(button);
  };
  const handleDPadLongPress = (button: 'left' | 'right' | 'up' | 'down') => {
    // Set YES side based on button
    let yesSide: [BinaryChoice, BinaryChoice];
    switch (button) {
      case 'left': yesSide = ['L', 'L']; break;
      case 'right': yesSide = ['R', 'R']; break;
      case 'up': yesSide = ['L', 'R']; break;
      case 'down': yesSide = ['R', 'L']; break;
      default: return;
    }
    setLongPressYesSide(yesSide);
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
      {(currentLetterInfo.letter || currentLetterInfo.letter === '') && (
        <div className="absolute top-4/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50" style={{ marginTop: '385px' }}>
          <div className={`bg-white w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${currentLetterInfo.isDynamic ? 'text-red-500' : 'text-black'}`}>
            {currentLetterInfo.letter || '✓'}
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
      {/* Profiling Question Box */}
      {enabledPsychologicalQuestions.length > 0 &&
        currentPsychologicalQuestionIndex >= 0 &&
        currentPsychologicalQuestionIndex < enabledPsychologicalQuestions.length &&
        !psychologicalQuestionsCompleted && (
          <div className="w-full bg-dark-grey p-4 rounded-lg mb-4 no-highlight">
            <div className="text-center">
              <div className="text-lg font-medium no-highlight">
                {enabledPsychologicalQuestions[currentPsychologicalQuestionIndex].text}
              </div>
            </div>
          </div>
        )}
      {/* Results after long press */}
      {longPressYesSide && (
        <div className="w-full bg-dark-grey p-4 rounded-lg mb-4 no-highlight flex flex-col justify-between" style={{ minHeight: '200px', height: '300px' }}>
          {/* Top 50%: Person 1 */}
          <div className="flex-1 flex flex-col justify-end items-center border-b border-gray-600 pb-2">
            {decodeProfilingAnswers(longPressYesSide).person1Results.map((line, idx) => (
              <div key={idx} className="text-base py-1">{line}</div>
            ))}
          </div>
          {/* Bottom 50%: Person 2 */}
          <div className="flex-1 flex flex-col justify-start items-center pt-2">
            {decodeProfilingAnswers(longPressYesSide).person2Results.map((line, idx) => (
              <div key={idx} className="text-base py-1">{line}</div>
            ))}
          </div>
        </div>
      )}
      {/* Spectator Lists (hide NO side if long press) */}
      {!longPressYesSide && (
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
      )}
      {/* D-Pad with long press handlers */}
      <div className="w-full relative" style={{ height: '35vh' }}>
        <div className="relative w-full h-full">
          {/* Diagonal lines creating X pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(45deg, transparent calc(50% - 1px), white calc(50% - 1px), white calc(50% + 1px), transparent calc(50% + 1px))' }}></div>
            <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(-45deg, transparent calc(50% - 1px), white calc(50% - 1px), white calc(50% + 1px), transparent calc(50% + 1px))' }}></div>
          </div>
          {/* Clickable triangular regions (buttons) */}
          <button
            onMouseDown={() => { longPressTimeout.current = setTimeout(() => handleDPadLongPress('up'), 500); }}
            onMouseUp={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; handleDPadPress('up'); } }}
            onMouseLeave={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; } }}
            className="absolute top-0 left-0 w-full h-1/2 bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }}
            aria-label="Up"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-lg">1 & 4</div>
          </button>
          <button
            onMouseDown={() => { longPressTimeout.current = setTimeout(() => handleDPadLongPress('right'), 500); }}
            onMouseUp={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; handleDPadPress('right'); } }}
            onMouseLeave={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; } }}
            className="absolute top-0 right-0 w-1/2 h-full bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }}
            aria-label="Right"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-lg">2 & 4</div>
          </button>
          <button
            onMouseDown={() => { longPressTimeout.current = setTimeout(() => handleDPadLongPress('down'), 500); }}
            onMouseUp={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; handleDPadPress('down'); } }}
            onMouseLeave={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; } }}
            className="absolute bottom-0 left-0 w-full h-1/2 bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }}
            aria-label="Down"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-lg">2 & 3</div>
          </button>
          <button
            onMouseDown={() => { longPressTimeout.current = setTimeout(() => handleDPadLongPress('left'), 500); }}
            onMouseUp={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; handleDPadPress('left'); } }}
            onMouseLeave={() => { if (longPressTimeout.current) { clearTimeout(longPressTimeout.current); longPressTimeout.current = null; } }}
            className="absolute top-0 left-0 w-1/2 h-full bg-black border-2 border-gray-600 hover:border-gray-500 transition-colors duration-200"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', transform: 'scale(0.7)', transformOrigin: 'center' }}
            aria-label="Left"
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-lg">1 & 3</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpectatorFilterPage; 
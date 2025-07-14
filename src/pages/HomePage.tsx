import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { WordListCard } from '../types';
import { getSequenceById } from '../data/letterSequences';


const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { getAllWordLists, selectWordList, state } = useAppContext();
  const [wordLists, setWordLists] = React.useState<WordListCard[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadSelectedWordList = async () => {
      try {
        const selectedWordListId = state.userPreferences.selectedWordListId;
        console.log('HomePage: selectedWordListId =', selectedWordListId);
        
        if (!selectedWordListId) {
          console.log('HomePage: No selected word list ID, showing "No Word List Selected"');
          setLoading(false);
          return;
        }

        const allWordLists = getAllWordLists();
        console.log('HomePage: allWordLists =', allWordLists.map(wl => ({ id: wl.id, name: wl.name, wordCount: wl.words.length })));
        
        const selectedWordList = allWordLists.find(wl => wl.id === selectedWordListId);
        console.log('HomePage: selectedWordList =', selectedWordList);
        
        if (selectedWordList) {
          // If words aren't loaded yet, load them using the context
          if (selectedWordList.words.length === 0) {
            console.log('HomePage: Loading words for', selectedWordList.id);
            await selectWordList(selectedWordList.id);
            // Re-fetch the word list after loading
            const updatedWordLists = getAllWordLists();
            const updatedSelectedWordList = updatedWordLists.find(wl => wl.id === selectedWordListId);
            if (updatedSelectedWordList) {
              selectedWordList.words = updatedSelectedWordList.words;
            }
          } else {
            console.log('HomePage: Words already loaded, count =', selectedWordList.words.length);
          }

          const card = {
            id: selectedWordList.id,
            name: selectedWordList.name,
            wordCount: selectedWordList.words.length,
            preview: selectedWordList.words.slice(0, 5),
            description: selectedWordList.description
          };
          console.log('HomePage: Created card =', card);
          setWordLists([card]);
        } else {
          console.log('HomePage: No selected word list found');
        }
      } catch (error) {
        console.error('Error loading word list:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSelectedWordList();
  }, [state.userPreferences.selectedWordListId, selectWordList, getAllWordLists]);

  const handleWordListSelect = (wordListId: string) => {
    selectWordList(wordListId);
    navigate('/filter');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const getWordListCards = (): WordListCard[] => {
    return wordLists.map(list => ({
      id: list.id,
      name: list.name,
      wordCount: list.wordCount,
      preview: list.preview,
      description: list.description
    }));
  };

  const wordListCards = getWordListCards();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading word list...</div>
          <div className="text-gray-400">Please wait</div>
        </div>
      </div>
    );
  }

  if (wordListCards.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">No Word List Selected</div>
          <div className="text-gray-400 mb-4">Please select a word list in Settings</div>
          <button onClick={handleSettingsClick} className="btn-primary">
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-end items-center mb-8">
        <button
          onClick={handleSettingsClick}
          className="btn-secondary"
          aria-label="Settings"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Word List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wordListCards.map((card) => (
          <div
            key={card.id}
            className="bg-black border-2 border-white rounded-lg p-6 hover:border-success-green transition-colors duration-200"
          >
            <h2 className="text-2xl font-bold mb-2">{card.name}</h2>
            <p className="text-gray-300 mb-4">{card.description}</p>
            
            <div className="mb-4">
              <span className="word-count">
                {card.wordCount.toLocaleString()} words
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400">
                Letter sequence: {getSequenceById(state.userPreferences.selectedLetterSequence)?.name || 'Full Alphabet'}
              </p>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Preview:</p>
              <div className="flex flex-wrap gap-1">
                {card.preview.map((word, index) => (
                  <span
                    key={index}
                    className="bg-dark-grey text-white px-2 py-1 rounded text-xs"
                  >
                    {word}
                  </span>
                ))}
                {card.wordCount > 5 && (
                  <span className="text-gray-400 text-xs px-2 py-1">
                    +{card.wordCount - 5} more
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => handleWordListSelect(card.id)}
              className="btn-primary w-full"
              aria-label={`Start filtering ${card.name}`}
            >
              Perform
            </button>
          </div>
        ))}
      </div>


    </div>
  );
};

export default HomePage; 
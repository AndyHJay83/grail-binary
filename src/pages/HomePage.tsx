import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { WordListCard } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { getAllWordLists, selectWordList } = useAppContext();
  const wordLists = getAllWordLists();

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
      wordCount: list.words.length,
      preview: list.words.slice(0, 5),
      description: list.description
    }));
  };

  const wordListCards = getWordListCards();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Word Filter PWA</h1>
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

      {/* PWA Install Prompt */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Install this app for the best experience
        </p>
      </div>
    </div>
  );
};

export default HomePage; 
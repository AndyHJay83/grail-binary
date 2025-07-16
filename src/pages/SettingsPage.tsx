import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getAllWordLists } from '../data/wordListManager';
import { getAllSequences } from '../data/letterSequences';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updatePreferences, updateLetterSequence, updateMostFrequentFilter, togglePsychologicalProfiling, updatePsychologicalQuestion } = useAppContext();
  const { userPreferences } = state;
  
  const wordLists = getAllWordLists();
  const letterSequences = getAllSequences();

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button onClick={handleHomeClick} className="btn-secondary">
          🏠 Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Word List Selection */}
        <div className="bg-dark-grey p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Word List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wordLists.map((wordList) => (
              <button
                key={wordList.id}
                onClick={() => updatePreferences({ selectedWordListId: wordList.id })}
                className={`p-4 rounded-lg text-left transition-colors ${
                  userPreferences.selectedWordListId === wordList.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="font-semibold">{wordList.name}</div>
                <div className="text-sm opacity-75">
                  {wordList.words.length.toLocaleString()} words
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Letter Sequence Selection */}
        <div className="bg-dark-grey p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Letter Sequence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {letterSequences.map((sequence) => (
              <button
                key={sequence.id}
                onClick={() => updateLetterSequence(sequence.id)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  userPreferences.selectedLetterSequence === sequence.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="font-semibold">{sequence.name}</div>
                <div className="text-sm opacity-75">
                  {sequence.sequence || 'Dynamic'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Most Frequent Filter Toggle */}
        <div className="bg-dark-grey p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Most Frequent Filter</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Most Frequent Letter Selection</div>
              <div className="text-sm opacity-75">
                Automatically select the most frequent unused letter in remaining words
              </div>
            </div>
            <button
              onClick={() => updateMostFrequentFilter(!userPreferences.mostFrequentFilter)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                userPreferences.mostFrequentFilter
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {userPreferences.mostFrequentFilter ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Confirm NO Letter Toggle */}
        <div className="bg-dark-grey p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Confirm NO Letter</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Side Offer Letter</div>
              <div className="text-sm opacity-75">
                Offer a letter that doesn't appear in any remaining words for side confirmation
              </div>
            </div>
            <button
              onClick={() => updatePreferences({ confirmNoLetter: !userPreferences.confirmNoLetter })}
              className={`px-4 py-2 rounded-lg transition-colors ${
                userPreferences.confirmNoLetter
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {userPreferences.confirmNoLetter ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* NEW: Psychological Profiling Section */}
        <div className="bg-dark-grey p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Psychological Profiling</h2>
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-medium">Enable Psychological Profiling</div>
              <div className="text-sm opacity-75">
                Ask custom Yes/No questions before letter sequence to gather psychological insights
              </div>
            </div>
            <button
              onClick={() => togglePsychologicalProfiling(!userPreferences.psychologicalProfiling.enabled)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                userPreferences.psychologicalProfiling.enabled
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {userPreferences.psychologicalProfiling.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Questions Management */}
          {userPreferences.psychologicalProfiling.enabled && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Questions (1-5 enabled)</h3>
              <div className="space-y-3">
                {userPreferences.psychologicalProfiling.questions.map((question) => (
                  <div key={question.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                    <input
                      type="checkbox"
                      checked={question.enabled}
                      onChange={(e) => updatePsychologicalQuestion(question.id, { enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updatePsychologicalQuestion(question.id, { text: e.target.value })}
                      className="flex-1 bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your question..."
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm opacity-75">
                <p>• Questions will be asked before the letter sequence begins</p>
                <p>• User makes L/R choices for each enabled question</p>
                <p>• After long press confirmation, psychological profile will be revealed</p>
              </div>
            </div>
          )}
        </div>

        {/* Export Preferences */}
        <div className="bg-dark-grey p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Export Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Filename</label>
              <input
                type="text"
                value={userPreferences.exportPreferences.defaultFilename}
                onChange={(e) =>
                  updatePreferences({
                    exportPreferences: {
                      ...userPreferences.exportPreferences,
                      defaultFilename: e.target.value
                    }
                  })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={userPreferences.exportPreferences.includeTimestamp}
                onChange={(e) =>
                  updatePreferences({
                    exportPreferences: {
                      ...userPreferences.exportPreferences,
                      includeTimestamp: e.target.checked
                    }
                  })
                }
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm">Include timestamp in filename</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LetterSequenceManager from '../components/LetterSequenceManager';
import WordListManager from '../components/WordListManager';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updatePreferences, updateLetterSequence, updateMostFrequentFilter, togglePsychologicalProfiling, updatePsychologicalQuestion } = useAppContext();
  const { userPreferences } = state;

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleExportFilenameChange = (filename: string) => {
    updatePreferences({
      exportPreferences: {
        ...userPreferences.exportPreferences,
        defaultFilename: filename
      }
    });
  };

  const handleTimestampToggle = (includeTimestamp: boolean) => {
    updatePreferences({
      exportPreferences: {
        ...userPreferences.exportPreferences,
        includeTimestamp
      }
    });
  };

  const handleMostFrequentFilterToggle = (enabled: boolean) => {
    updateMostFrequentFilter(enabled);
  };

  const handleConfirmNoLetterToggle = (enabled: boolean) => {
    updatePreferences({
      confirmNoLetter: enabled
    });
  };

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    localStorage.clear();
    alert('Cache cleared successfully!');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Settings</h1>
        <button onClick={handleHomeClick} className="btn-secondary">
          🏠 Home
        </button>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Letter Sequences */}
        <LetterSequenceManager />

        {/* Word Lists */}
        <WordListManager />

        {/* Filtering Options */}
        <div className="bg-black border-2 border-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Filtering Options</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="mostFrequentFilter"
                checked={userPreferences.mostFrequentFilter}
                onChange={(e) => handleMostFrequentFilterToggle(e.target.checked)}
                className="w-4 h-4 text-success-green bg-black border-white rounded focus:ring-success-green"
              />
              <label htmlFor="mostFrequentFilter" className="text-sm">
                Most Frequent Filter
              </label>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>When enabled, after exhausting the letter sequence, automatically select the most frequent unused letter from remaining words.</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="confirmNoLetter"
                checked={userPreferences.confirmNoLetter}
                onChange={(e) => handleConfirmNoLetterToggle(e.target.checked)}
                className="w-4 h-4 text-success-green bg-black border-white rounded focus:ring-success-green"
              />
              <label htmlFor="confirmNoLetter" className="text-sm">
                Confirm NO Letter
              </label>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>When enabled, offers a letter that doesn't appear in any remaining words. Long press (0.5s) on either side to confirm that side as NO.</p>
            </div>
          </div>
        </div>

        {/* NEW: Psychological Profiling Section */}
        <div className="bg-black border-2 border-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Psychological Profiling</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="psychologicalProfiling"
                checked={userPreferences.psychologicalProfiling.enabled}
                onChange={(e) => togglePsychologicalProfiling(e.target.checked)}
                className="w-4 h-4 text-success-green bg-black border-white rounded focus:ring-success-green"
              />
              <label htmlFor="psychologicalProfiling" className="text-sm">
                Enable Psychological Profiling
              </label>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>Ask custom Yes/No questions before letter sequence to gather psychological insights.</p>
            </div>

            {/* Questions Management */}
            {userPreferences.psychologicalProfiling.enabled && (
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-bold">Custom Questions (1-5 enabled)</h3>
                <div className="space-y-3">
                  {userPreferences.psychologicalProfiling.questions.map((question) => (
                    <div key={question.id} className="flex items-center space-x-3 p-3 bg-dark-grey rounded">
                      <input
                        type="checkbox"
                        checked={question.enabled}
                        onChange={(e) => updatePsychologicalQuestion(question.id, { enabled: e.target.checked })}
                        className="w-4 h-4 text-success-green bg-black border-white rounded focus:ring-success-green"
                      />
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updatePsychologicalQuestion(question.id, { text: e.target.value })}
                        className="flex-1 bg-black border-2 border-white rounded px-3 py-2 text-white focus:border-success-green outline-none text-sm"
                        placeholder="Enter your question..."
                      />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  <p>• Questions will be asked before the letter sequence begins</p>
                  <p>• User makes L/R choices for each enabled question</p>
                  <p>• After long press confirmation, psychological profile will be revealed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Preferences */}
        <div className="bg-black border-2 border-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Export Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="filename" className="block text-sm font-medium mb-2">
                Default Export Filename
              </label>
              <input
                type="text"
                id="filename"
                value={userPreferences.exportPreferences.defaultFilename}
                onChange={(e) => handleExportFilenameChange(e.target.value)}
                className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none"
                placeholder="Enter default filename"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="timestamp"
                checked={userPreferences.exportPreferences.includeTimestamp}
                onChange={(e) => handleTimestampToggle(e.target.checked)}
                className="w-4 h-4 text-success-green bg-black border-white rounded focus:ring-success-green"
              />
              <label htmlFor="timestamp" className="text-sm">
                Include timestamp in export filenames
              </label>
            </div>
          </div>
        </div>

        {/* App Management */}
        <div className="bg-black border-2 border-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">App Management</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleClearCache}
              className="btn-secondary w-full"
            >
              Clear Cache & Reset App
            </button>
            
            <div className="text-sm text-gray-400">
              <p>This will clear all cached data and reset the app to its initial state.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 
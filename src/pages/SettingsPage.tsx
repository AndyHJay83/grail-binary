import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LetterSequenceManager from '../components/LetterSequenceManager';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updatePreferences } = useAppContext();
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

        {/* Letter Sequences */}
        <LetterSequenceManager />

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
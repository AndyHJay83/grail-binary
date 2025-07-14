import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  addCustomWordList, 
  updateCustomWordList, 
  deleteCustomWordList, 
  getAllWordLists,
  handleFileUpload,
  parseWordList,
  validateWordList
} from '../data/wordListManager';
import { loadWordList } from '../data/wordLists';
import { WordList } from '../types';

interface AddWordListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (wordList: WordList) => void;
  editingWordList?: WordList;
}

const AddWordListModal: React.FC<AddWordListModalProps> = ({ isOpen, onClose, onAdd, editingWordList }) => {
  const [name, setName] = useState(editingWordList?.name || '');
  const [description, setDescription] = useState(editingWordList?.description || '');
  const [textInput, setTextInput] = useState(editingWordList?.words.join('\n') || '');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const words = parseWordList(textInput);
    const validation = validateWordList(words);
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid word list');
      return;
    }

    try {
      if (editingWordList) {
        const updatedWordList = updateCustomWordList(editingWordList.id, name.trim(), words, description.trim());
        if (updatedWordList) {
          onAdd(updatedWordList);
          onClose();
        }
      } else {
        const newWordList = addCustomWordList(name.trim(), words, description.trim());
        onAdd(newWordList);
        onClose();
      }
    } catch (error) {
      setError('Failed to save word list');
    }
  };

  const handleFileUploadLocal = async (file: File) => {
    setIsUploading(true);
    setError('');

    try {
      const words = await handleFileUpload(file);
      setTextInput(words.join('\n'));
    } catch (error) {
      setError('Failed to upload file. Please check the file format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUploadLocal(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      handleFileUploadLocal(file);
    } else {
      setError('Please upload a .txt file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {editingWordList ? 'Edit Word List' : 'Add New Word List'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none"
              placeholder="My Custom Word List"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none"
              placeholder="Description of this word list"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Upload File or Enter Words</label>
            
            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-white rounded-lg p-6 mb-4 text-center hover:border-success-green transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary mb-2"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Choose .txt File'}
              </button>
              <p className="text-sm text-gray-400">
                Drag and drop a .txt file here, or click to browse
              </p>
            </div>
            
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Or enter words manually (one per line)</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none h-32 resize-none"
                placeholder="Enter words here, one per line..."
              />
              <div className="text-xs text-gray-400 mt-1">
                {textInput.split('\n').filter(line => line.trim().length > 0).length} words
              </div>
            </div>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {editingWordList ? 'Update Word List' : 'Add Word List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WordListManager: React.FC = () => {
  const { state, updatePreferences } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWordList, setEditingWordList] = useState<WordList | undefined>();
  const [wordLists, setWordLists] = useState<WordList[]>([]);

  React.useEffect(() => {
    const loadWordLists = async () => {
      const lists = getAllWordLists();
      
      // Load all default word lists that don't have words loaded yet
      const updatedLists = await Promise.all(
        lists.map(async (wordList) => {
          if (wordList.isDefault && wordList.words.length === 0) {
            try {
              // Map word list IDs to their corresponding filenames
              const filenameMap: Record<string, string> = {
                'en-uk': 'EN-UK.txt',
                '19k': '19K.txt',
                'all-names': 'AllNames.txt',
                'boys-names': 'BoysNames.txt',
                'girls-names': 'GirlsNames.txt'
              };
              
              const filename = filenameMap[wordList.id];
              if (filename) {
                const words = await loadWordList(filename);
                return { ...wordList, words };
              }
            } catch (error) {
              console.error(`Failed to load word list ${wordList.id}:`, error);
            }
          }
          return wordList;
        })
      );
      
      setWordLists(updatedLists);
    };
    
    loadWordLists();
  }, []);

  const handleWordListChange = (wordListId: string) => {
    updatePreferences({ selectedWordListId: wordListId });
  };

  const handleAddWordList = (wordList: WordList) => {
    setWordLists(prev => [...prev, wordList]);
    setShowAddModal(false);
    setEditingWordList(undefined);
  };

  const handleEditWordList = (wordList: WordList) => {
    setEditingWordList(wordList);
    setShowAddModal(true);
  };

  const handleDeleteWordList = (id: string) => {
    if (confirm('Are you sure you want to delete this word list?')) {
      deleteCustomWordList(id);
      setWordLists(prev => prev.filter(wl => wl.id !== id));
      
      // If the deleted word list was selected, reset to default
      if (state.userPreferences.selectedWordListId === id) {
        updatePreferences({ selectedWordListId: undefined });
      }
    }
  };

  const currentWordList = wordLists.find(wl => wl.id === state.userPreferences.selectedWordListId);

  return (
    <div className="bg-black border-2 border-white rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Word Lists</h2>
      
      <div className="space-y-4">
        {/* Current Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Current Word List</label>
          <select
            value={state.userPreferences.selectedWordListId || ''}
            onChange={(e) => handleWordListChange(e.target.value)}
            className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none"
          >
            <option value="">Select a word list</option>
            {wordLists.map(wl => (
              <option key={wl.id} value={wl.id}>
                {wl.name} ({wl.words.length} words)
              </option>
            ))}
          </select>
        </div>

        {/* Current Word List Info */}
        {currentWordList && (
          <div className="bg-dark-grey p-3 rounded">
            <div className="text-sm font-medium mb-1">{currentWordList.name}</div>
            <div className="text-xs text-gray-400">{currentWordList.description}</div>
            <div className="text-xs text-gray-400">{currentWordList.words.length} words</div>
          </div>
        )}

        {/* Custom Word Lists */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Custom Word Lists</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-sm"
            >
              Add New
            </button>
          </div>
          
          <div className="space-y-2">
            {wordLists.filter(wl => !wl.isDefault).map(wl => (
              <div key={wl.id} className="flex justify-between items-center bg-dark-grey p-3 rounded">
                <div>
                  <div className="font-medium">{wl.name}</div>
                  <div className="text-xs text-gray-400">{wl.description}</div>
                  <div className="text-xs text-gray-400">{wl.words.length} words</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditWordList(wl)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteWordList(wl.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {wordLists.filter(wl => !wl.isDefault).length === 0 && (
              <div className="text-gray-400 text-sm">No custom word lists yet. Click "Add New" to create one.</div>
            )}
          </div>
        </div>
      </div>

      <AddWordListModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingWordList(undefined);
        }}
        onAdd={handleAddWordList}
        editingWordList={editingWordList}
      />
    </div>
  );
};

export default WordListManager; 
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAllSequences, addCustomSequence, deleteCustomSequence, validateSequence } from '../data/letterSequences';
import { LetterSequence } from '../types';

interface AddSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, sequence: string) => void;
}

const AddSequenceModal: React.FC<AddSequenceModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateSequence(sequence);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid sequence');
      return;
    }

    onAdd(name, sequence);
    setName('');
    setSequence('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add New Letter Sequence</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none"
              placeholder="My Custom Sequence"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Sequence</label>
            <input
              type="text"
              value={sequence}
              onChange={(e) => {
                setSequence(e.target.value.toUpperCase());
                setError('');
              }}
              className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none"
              placeholder="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              {sequence.length} characters
            </div>
            {error && (
              <div className="text-xs text-red-400 mt-1">{error}</div>
            )}
          </div>
          
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
              Add Sequence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LetterSequenceManager: React.FC = () => {
  const { state, updateLetterSequence, updatePreferences } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [sequences, setSequences] = useState<LetterSequence[]>(getAllSequences());

  const handleAddSequence = (name: string, sequence: string) => {
    addCustomSequence(name, sequence);
    setSequences(getAllSequences());
  };

  const handleDeleteSequence = (id: string) => {
    deleteCustomSequence(id);
    setSequences(getAllSequences());
    
    // If we deleted the currently selected sequence, switch to full alphabet
    if (state.userPreferences.selectedLetterSequence === id) {
      updateLetterSequence('full-alphabet');
    }
  };

  // Update both selectedLetterSequence and originalLetterSequence when changed from settings
  const handleSequenceChange = (sequenceId: string) => {
    updatePreferences({
      selectedLetterSequence: sequenceId,
      originalLetterSequence: sequenceId
    });
    updateLetterSequence(sequenceId);
  };

  // Use originalLetterSequence for the dropdown value
  const currentSequence = sequences.find(seq => seq.id === state.userPreferences.originalLetterSequence);

  return (
    <div className="bg-black border-2 border-white rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Letter Sequences</h2>
      
      <div className="space-y-4">
        {/* Current Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Current Sequence</label>
          <select
            value={state.userPreferences.originalLetterSequence}
            onChange={(e) => handleSequenceChange(e.target.value)}
            className="w-full bg-black border-2 border-white rounded-lg px-4 py-2 text-white focus:border-success-green outline-none"
          >
            {sequences.map(seq => (
              <option key={seq.id} value={seq.id}>
                {seq.name} ({seq.sequence.length} chars)
              </option>
            ))}
          </select>
        </div>

        {/* Current Sequence Info */}
        {currentSequence && (
          <div className="bg-dark-grey p-3 rounded">
            <div className="text-sm font-medium mb-1">{currentSequence.name}</div>
            <div className="text-xs text-gray-400">Sequence: {currentSequence.sequence}</div>
            <div className="text-xs text-gray-400">{currentSequence.sequence.length} characters</div>
          </div>
        )}

        {/* Custom Sequences */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Custom Sequences</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-sm"
            >
              Add New
            </button>
          </div>
          
          <div className="space-y-2">
            {sequences.filter(seq => !seq.isDefault).map(seq => (
              <div key={seq.id} className="flex justify-between items-center bg-dark-grey p-3 rounded">
                <div>
                  <div className="font-medium">{seq.name}</div>
                  <div className="text-xs text-gray-400">{seq.sequence}</div>
                </div>
                <button
                  onClick={() => handleDeleteSequence(seq.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
            
            {sequences.filter(seq => !seq.isDefault).length === 0 && (
              <div className="text-gray-400 text-sm">No custom sequences yet. Click "Add New" to create one.</div>
            )}
          </div>
        </div>
      </div>

      <AddSequenceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSequence}
      />
    </div>
  );
};

export default LetterSequenceManager; 
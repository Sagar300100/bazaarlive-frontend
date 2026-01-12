
import React, { useState } from 'react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const [confirmationText, setConfirmationText] = useState('');
  if (!isOpen) return null;

  const canDelete = confirmationText === 'DELETE';

  const handleDelete = () => {
    if (canDelete) {
      alert('Account deleted.');
      // Here you would typically redirect the user or log them out.
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-red-500">Delete Account</h2>
        <p className="text-gray-300 mt-4">This action is irreversible. All your data, including purchases, sales history, and saved items will be permanently deleted.</p>
        <p className="text-gray-300 mt-4">To confirm, please type <strong className="text-white">DELETE</strong> in the box below.</p>
        
        <input 
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="w-full mt-4 input-field"
          placeholder="DELETE"
        />

        <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors">Cancel</button>
            <button 
                onClick={handleDelete}
                disabled={!canDelete}
                className={`py-2 px-5 rounded-lg font-bold transition-colors ${canDelete ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            >
                Delete Account
            </button>
        </div>
        <style>{`.input-field { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; } .input-field:focus { outline: none; box-shadow: 0 0 0 2px #EF4444; }`}</style>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
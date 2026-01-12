
import React from 'react';

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email change logic here
    alert('Email change request sent!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Change Email</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="new-email" className="block text-sm font-medium text-gray-300 mb-1">New Email Address</label>
              <input type="email" name="new-email" id="new-email" className="w-full input-field" required />
            </div>
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
              <input type="password" name="current-password" id="current-password" className="w-full input-field" required />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-4">
              <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors">Cancel</button>
              <button type="submit" className="py-2 px-5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Save Changes</button>
          </div>
        </form>
         <style>{`.input-field { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; } .input-field:focus { outline: none; box-shadow: 0 0 0 2px #F97316; }`}</style>
      </div>
    </div>
  );
};

export default ChangeEmailModal;
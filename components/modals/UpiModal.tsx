
import React, { useState } from 'react';

interface UpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUpi: (upi: string) => void;
}

const UpiModal: React.FC<UpiModalProps> = ({ isOpen, onClose, onAddUpi }) => {
  const [upi, setUpi] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upi)) {
      setError('Please enter a valid UPI ID (e.g., yourname@bank).');
      return;
    }
    setError('');
    onAddUpi(upi);
    setUpi('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Add UPI ID</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="upi" className="block text-sm font-medium text-gray-300 mb-2">UPI ID</label>
              <input
                type="text"
                name="upi"
                id="upi"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="yourname@bank"
                required
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Add UPI ID</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpiModal;
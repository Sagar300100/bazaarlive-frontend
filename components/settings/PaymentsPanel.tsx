
import React, { useState } from 'react';
import UpiModal from '../modals/UpiModal';
import { TrashIcon } from '../Icons';

interface UpiId {
    id: number;
    upi: string;
}

const PaymentsPanel: React.FC = () => {
    const [upiIds, setUpiIds] = useState<UpiId[]>([
        { id: 1, upi: 'sagar@okhdfcbank' }
    ]);
    const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

    const addUpiId = (upi: string) => {
        setUpiIds(prev => [...prev, { id: Date.now(), upi }]);
    };
    
    const deleteUpiId = (id: number) => {
        setUpiIds(prev => prev.filter(item => item.id !== id));
    };

    return (
        <>
            <div className="bg-gray-900 rounded-lg">
                <div className="p-8">
                    <h2 className="text-xl font-bold text-white mb-8">Payments</h2>
                    
                    <div className="bg-gray-800 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-semibold text-white">UPI IDs</h3>
                                <p className="text-sm text-gray-400 mt-1">Manage your UPI IDs for instant payments during live auctions.</p>
                            </div>
                            <button 
                                onClick={() => setIsUpiModalOpen(true)}
                                className="bg-white text-gray-900 font-bold py-2 px-5 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Add UPI ID
                            </button>
                        </div>
                        
                        {upiIds.length > 0 ? (
                             <div className="mt-6 space-y-3">
                                {upiIds.map(item => (
                                     <div key={item.id} className="border border-gray-700 rounded-lg p-4 flex justify-between items-center bg-gray-900/50">
                                        <p className="font-mono text-green-400">{item.upi}</p>
                                        <button onClick={() => deleteUpiId(item.id)} aria-label={`Delete UPI ID ${item.upi}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 text-center py-6 border-2 border-dashed border-gray-700 rounded-lg">
                                <p className="text-gray-400">No UPI IDs added yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <UpiModal 
                isOpen={isUpiModalOpen} 
                onClose={() => setIsUpiModalOpen(false)}
                onAddUpi={addUpiId}
            />
        </>
    );
};

export default PaymentsPanel;
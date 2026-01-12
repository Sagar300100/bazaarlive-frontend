import React, { useState } from 'react';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCouponModal: React.FC<CreateCouponModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [couponCode, setCouponCode] = useState('5OFF10');

    if (!isOpen) return null;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };
    
    const handleClose = () => {
        setStep(1);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                {step === 1 && (
                    <form onSubmit={handleCreate}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Create a coupon</h2>
                                <button type="button" onClick={handleClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="audience" className="block text-sm font-medium text-gray-300 mb-1">Audience <span className="text-red-500">*</span></label>
                                    <select id="audience" className="w-full input-field"><option>New Buyers for You</option></select>
                                </div>
                                <div>
                                    <label htmlFor="couponCode" className="block text-sm font-medium text-gray-300 mb-1">Coupon Code <span className="text-red-500">*</span></label>
                                    <input type="text" id="couponCode" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="w-full input-field" />
                                </div>
                                 <div>
                                    <label htmlFor="couponType" className="block text-sm font-medium text-gray-300 mb-1">Coupon Type</label>
                                    <select id="couponType" className="w-full input-field"><option>Fixed Amount</option></select>
                                </div>
                                 <div>
                                    <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-300 mb-1">Discount Amount (₹) <span className="text-red-500">*</span></label>
                                    <input type="number" id="discountAmount" defaultValue="5" className="w-full input-field" />
                                </div>
                                 <div>
                                    <label htmlFor="minPurchase" className="block text-sm font-medium text-gray-300 mb-1">Minimum Purchase Amount (₹)</label>
                                    <input type="number" id="minPurchase" defaultValue="10" className="w-full input-field" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-4 flex justify-end">
                             <button type="submit" className="py-2 px-5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Next</button>
                        </div>
                    </form>
                )}
                {step === 2 && (
                    <div className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-white">Coupon created!</h2>
                        <p className="text-gray-400 mt-2 mb-6">Review your new coupon's details and share it with your buyers.</p>
                        <div className="bg-gray-700 rounded-lg p-4 text-left text-sm space-y-2">
                             <div className="flex justify-between"><span>Coupon</span> <span className="font-semibold text-white flex items-center gap-2">{couponCode} <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Active</span></span></div>
                            <div className="flex justify-between"><span>Discount</span> <span className="font-semibold text-white">₹5.00</span></div>
                             <div className="flex justify-between"><span>Audience</span> <span className="font-semibold text-white">New Buyers for You</span></div>
                             <div className="flex justify-between"><span>Eligible Livestreams</span> <span className="font-semibold text-white">All</span></div>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(couponCode)} className="mt-6 w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Copy Coupon Code</button>
                        <button onClick={handleClose} className="mt-3 w-full text-sm font-semibold text-gray-300 hover:text-white">Done</button>
                    </div>
                )}
                 <style>{`.input-field { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; -webkit-appearance: none; } .input-field:focus { outline: none; box-shadow: 0 0 0 2px #F97316; border-color: #F97316 }`}</style>
            </div>
        </div>
    );
};

export default CreateCouponModal;

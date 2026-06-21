
import React, { useState } from 'react';
import { onboardingCategories, subCategories } from '../constants/onboardingData';
import { HonorIcon, NoCounterfeitIcon, NoLieIcon, ShipQuicklyIcon, PreApprovalIcon, CheckmarkCircleIcon } from './Icons';

interface SellerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" style={{ width: `${(current / total) * 100}%` }}></div>
    </div>
);

const SellerOnboardingModal: React.FC<SellerOnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
    const TOTAL_STEPS = 8;
    const [step, setStep] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    
    if (!isOpen) return null;

    const handleNext = () => {
        if (step < TOTAL_STEPS) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };
    
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                const guidelines = [
                    { icon: <HonorIcon />, title: "Honor purchases and giveaways", description: "Don't cancel auctions for going below a desired amount." },
                    { icon: <NoCounterfeitIcon />, title: "Do not sell counterfeits", description: "Don't sell fake items on Any & All. If you're unsure, just don't sell it." },
                    { icon: <NoLieIcon />, title: "Do not lie about an item", description: "Don't mislead buyers about an item's condition, value, or anything else." },
                    { icon: <ShipQuicklyIcon />, title: "Ship quickly and safely", description: "Ship items within 2 business days after a show has ended or an item is sold." },
                    { icon: <PreApprovalIcon />, title: "Pre-approval required for ages 13-17", description: "Tap here to learn more." },
                ];
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Let's get started!</h2>
                        <p className="text-gray-400 mb-6">Before you kick off your selling journey, please agree to these guidelines.</p>
                        <div className="space-y-4">
                            {guidelines.map(g => (
                                <div key={g.title} className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mt-1">{g.icon}</div>
                                    <div>
                                        <h3 className="font-semibold text-white">{g.title}</h3>
                                        <p className="text-sm text-gray-400">{g.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="mt-6 flex items-start gap-3">
                            <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500" />
                            <label htmlFor="agree" className="text-sm text-gray-400">By agreeing to the rules and providing my phone number to Any & All, I agree and acknowledge that Any & All may text my number to confirm submission of my responses and notify me based on my progress.</label>
                        </div>
                        <button onClick={handleNext} disabled={!agreed} className="mt-8 w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Got it!</button>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-white mb-2">Which category will you sell in most often?</h2>
                        <p className="text-gray-400 text-center mb-6">You can always add more later.</p>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2">
                            {onboardingCategories.map(cat => (
                                <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); handleNext(); }} className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-end p-2">
                                        <p className="text-white font-bold text-sm">{cat.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                 return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Which subcategory will you sell in most often?</h2>
                        <p className="text-gray-400 mb-6">You can always add more later.</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {(subCategories[selectedCategory || ''] || []).map(sub => (
                                <button key={sub} onClick={handleNext} className="py-2 px-5 rounded-full font-semibold transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600">{sub}</button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Are you currently selling somewhere else?</h2>
                        <p className="text-gray-400 mb-8">We'll tailor your experience based on what you pick.</p>
                         <div className="space-y-4 max-w-sm mx-auto">
                            <button onClick={handleNext} className="w-full text-left p-4 border border-gray-600 rounded-lg hover:border-orange-500 transition-colors flex justify-between items-center"><span>Yes</span> <div className="w-5 h-5 rounded-full border-2 border-gray-500"></div></button>
                            <button onClick={handleNext} className="w-full text-left p-4 border border-gray-600 rounded-lg hover:border-orange-500 transition-colors flex justify-between items-center"><span>No</span> <div className="w-5 h-5 rounded-full border-2 border-gray-500"></div></button>
                        </div>
                    </div>
                );
            case 5:
            case 6: // Combine address and verification
                 return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Where should we send purchases and returns?</h2>
                        <p className="text-gray-400 mb-6">To prevent delays in receiving your payouts, you must provide your legal name as it appears on your ID.</p>
                         <form className="space-y-4">
                            <input type="text" placeholder="Full Name" className="w-full input-field" />
                            <input type="text" placeholder="Address Line 1" className="w-full input-field" />
                            <input type="text" placeholder="Address Line 2" className="w-full input-field" />
                            <input type="text" placeholder="City" className="w-full input-field" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="State/Region/Province" className="w-full input-field" />
                                <input type="text" placeholder="Postal Code" className="w-full input-field" />
                            </div>
                        </form>
                         {step === 6 && (
                             <div className="mt-4 relative bg-gray-700/50 p-4 rounded-lg text-center">
                                 <h3 className="font-bold text-white">Verify Address</h3>
                                <p className="text-sm text-gray-300 mt-2">We found this address for the one you entered.</p>
                                <div className="my-3 bg-gray-900 p-3 rounded text-sm text-left">Sagar Singhal<br/>28 Ruby Street<br/>GREATER London, SE15 1LL<br/>GB</div>
                                 <div className="flex gap-2 justify-center">
                                    <button className="text-sm font-semibold py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-500">Edit Entered Address</button>
                                    <button onClick={handleNext} className="text-sm font-semibold py-2 px-4 rounded-lg bg-white text-black hover:bg-gray-200">Accept Suggested Address</button>
                                 </div>
                            </div>
                         )}
                        <button onClick={handleNext} className="mt-8 w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Next</button>
                    </div>
                 );
             case 7:
                 return (
                    <div className="text-center">
                         <h2 className="text-2xl font-bold text-white mb-2">Do you have a local bank account?</h2>
                        <p className="text-gray-400 mb-8">A local bank is required for payouts and regulatory compliance post sale.</p>
                         <div className="space-y-4 max-w-sm mx-auto">
                            <button onClick={handleNext} className="w-full text-left p-4 border border-gray-600 rounded-lg hover:border-orange-500 transition-colors">Yes, I have one</button>
                            <button onClick={handleNext} className="w-full text-left p-4 border border-gray-600 rounded-lg hover:border-orange-500 transition-colors">No, but I am planning to get one</button>
                        </div>
                    </div>
                );
            case 8:
                 return (
                    <div className="text-center">
                        <div className="w-full aspect-video bg-black rounded-lg mb-6 flex items-center justify-center">
                            <p className="text-gray-500">[Welcome Video Placeholder]</p>
                        </div>
                         <h2 className="text-2xl font-bold text-white mb-2">You're about to unlock seller access</h2>
                        <button onClick={onComplete} className="mt-6 w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Unlock Seller Access</button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
             <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl m-4 relative border border-gray-700">
                <div className="p-4 sm:p-6 flex items-center gap-4 border-b border-gray-800">
                    {step > 1 && <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>}
                    <div className="flex-1">
                        <ProgressBar current={step} total={TOTAL_STEPS} />
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                 <div className="p-6 sm:p-8">
                    {renderStepContent()}
                </div>
                 <style>{`.input-field { background-color: #1F2937; border: 1px solid #4B5563; border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; } .input-field:focus { outline: none; box-shadow: 0 0 0 2px #F97316; border-color: #F97316 }`}</style>
            </div>
        </div>
    );
};

export default SellerOnboardingModal;
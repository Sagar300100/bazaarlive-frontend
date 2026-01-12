
import React, { useState } from 'react';
import { onboardingCategories, subCategories, paymentMethods } from '../constants/onboardingData';
import { CheckmarkCircleIcon, UpiIcon, WalletIcon, NetBankingIcon, CardIcon, UploadIcon } from './Icons';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (preferences: string[]) => void;
}

const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (
    <div className="w-full bg-gray-600 rounded-full h-1.5 mb-6">
        <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
    </div>
);

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
    const TOTAL_STEPS = 7;
    const [step, setStep] = useState(1);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
    const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
    const [isPictureUploaded, setIsPictureUploaded] = useState(false);
    const [username, setUsername] = useState(`anujanu${Math.floor(Math.random() * 10000)}`);
    
    if (!isOpen) return null;

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };
    
    const toggleSubCategory = (subCategory: string) => {
        setSelectedSubCategories(prev =>
            prev.includes(subCategory)
                ? prev.filter(sc => sc !== subCategory)
                : [...prev, subCategory]
        );
    };

    const togglePayment = (payment: string) => {
        setSelectedPayments(prev =>
            prev.includes(payment)
                ? prev.filter(p => p !== payment)
                : [...prev, payment]
        );
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS) {
            setStep(step + 1);
        } else {
            onComplete(selectedCategories);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const paymentIcons: { [key: string]: React.FC } = {
        UpiIcon,
        WalletIcon,
        NetBankingIcon,
        CardIcon,
    };
    
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-white mb-2">What do you like to shop for?</h2>
                        <p className="text-gray-400 text-center mb-6">Pick a couple to get started.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-80 overflow-y-auto pr-2">
                            {onboardingCategories.map(cat => (
                                <button key={cat.name} onClick={() => toggleCategory(cat.name)} className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-end p-2">
                                        <p className="text-white font-bold text-sm">{cat.name}</p>
                                    </div>
                                    {selectedCategories.includes(cat.name) && (
                                        <div className="absolute inset-0 bg-orange-600/70 flex items-center justify-center">
                                            <CheckmarkCircleIcon />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleNext} disabled={selectedCategories.length === 0} className="mt-6 w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                );
            case 2:
                 const relevantSubCategories = selectedCategories.flatMap(cat => subCategories[cat] || []);
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-white mb-2">Tell us a bit more.</h2>
                        <p className="text-gray-400 text-center mb-6">This will help us create the best shopping experience for you!</p>
                        <div className="flex flex-wrap gap-2 justify-center max-h-80 overflow-y-auto">
                            {relevantSubCategories.map(subCat => (
                                <button key={subCat} onClick={() => toggleSubCategory(subCat)} className={`py-2 px-4 rounded-full font-semibold transition-colors ${selectedSubCategories.includes(subCat) ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                    {subCat}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-6">
                           <button onClick={handleBack} className="w-full py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors">Back</button>
                           <button onClick={handleNext} className="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Next</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Create Username</h2>
                        <p className="text-gray-400 mb-6">You can always change it later.</p>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full text-center px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                         <button onClick={handleNext} className="mt-6 w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">
                            Great, Let's Go!
                        </button>
                    </div>
                );
            case 4:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Verify your phone number</h2>
                        <p className="text-gray-400 mb-6">To participate in shows and bid on items, you need to verify your phone first.</p>
                        <div className="flex">
                            <select className="bg-gray-700 border border-gray-600 rounded-l-lg text-white px-3 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                <option>IN +91</option>
                                <option>US +1</option>
                                <option>UK +44</option>
                            </select>
                            <input
                                type="tel"
                                placeholder="9876543210"
                                className="w-full px-4 py-3 bg-gray-700 border-t border-b border-r border-gray-600 rounded-r-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                         <button onClick={handleNext} className="mt-6 w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">
                            Send code
                        </button>
                    </div>
                );
            case 5:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-center text-white mb-2">Payment Methods</h2>
                        <p className="text-gray-400 text-center mb-6">Select your preferred ways to pay for a faster checkout.</p>
                        <div className="grid grid-cols-2 gap-4">
                            {paymentMethods.map(method => {
                                const Icon = paymentIcons[method.iconName];
                                const isSelected = selectedPayments.includes(method.name);
                                return (
                                    <button 
                                        key={method.name} 
                                        onClick={() => togglePayment(method.name)}
                                        className={`relative flex flex-col items-center justify-center p-6 rounded-lg transition-all duration-200 border-2 ${isSelected ? 'bg-orange-500/10 border-orange-500' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}
                                    >
                                        <Icon />
                                        <span className={`mt-2 font-semibold ${isSelected ? 'text-orange-400' : 'text-gray-300'}`}>{method.name}</span>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 text-orange-500">
                                                <CheckmarkCircleIcon />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-4 mt-6">
                           <button onClick={handleBack} className="w-full py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors">Back</button>
                           <button onClick={handleNext} className="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Next</button>
                        </div>
                    </div>
                );
            case 6:
                 return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-white mb-2">Set up your profile picture</h2>
                        <p className="text-gray-400 text-center mb-6">This helps others recognize you in the community.</p>
                        <div className="flex justify-center">
                            <button onClick={() => setIsPictureUploaded(true)} className="relative w-40 h-40 rounded-full bg-gray-700 flex flex-col items-center justify-center border-2 border-dashed border-gray-500 hover:border-orange-500 hover:bg-gray-600 transition-all group">
                                {isPictureUploaded ? (
                                    <>
                                        <div className="text-green-400"><CheckmarkCircleIcon /></div>
                                        <span className="mt-2 text-sm font-semibold text-green-400">Uploaded!</span>
                                    </>
                                ) : (
                                     <>
                                        <div className="text-gray-400 group-hover:text-orange-400 transition-colors"><UploadIcon /></div>
                                        <span className="mt-2 text-sm font-semibold text-gray-400 group-hover:text-orange-400 transition-colors">Upload Photo</span>
                                     </>
                                )}
                            </button>
                        </div>
                        <div className="flex gap-4 mt-6">
                           <button onClick={handleBack} className="w-full py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors">Back</button>
                           <button onClick={handleNext} className="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Next</button>
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Get the full experience on the BazaarLive app</h2>
                        <p className="text-gray-400 mb-6">Scan the QR code on your phone.</p>
                        <div className="flex justify-center">
                            <div className="p-4 bg-white rounded-lg">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com" alt="QR Code" />
                            </div>
                        </div>
                         <button onClick={() => onComplete(selectedCategories)} className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors">
                            Finish Setup
                        </button>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                <div className="p-8">
                    {step < TOTAL_STEPS && <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />}
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
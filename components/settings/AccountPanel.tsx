
import React, { useState } from 'react';
import { ChevronRightIcon } from '../Icons';
import AadhaarModal from '../modals/AadhaarModal';
import ChangeEmailModal from '../modals/ChangeEmailModal';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import DeleteAccountModal from '../modals/DeleteAccountModal';

const AccountPanel: React.FC = () => {
    const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
    const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleAadhaarSuccess = () => {
        setIsAadhaarVerified(true);
        setIsAadhaarModalOpen(false);
    };

    return (
        <>
        <div className="bg-gray-900 rounded-lg">
            <div className="p-8 space-y-8">
                 <h2 className="text-xl font-bold text-white">Account</h2>

                {/* Buyer Settings */}
                <div className="bg-gray-800 rounded-lg p-6">
                     <h3 className="font-semibold text-white mb-4">Buyer Settings</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-300">Verified Buyer Status</h4>
                                <p className="text-sm text-gray-400">Once verified you will be able to bid in any stream.</p>
                            </div>
                            {isAadhaarVerified ? (
                                <div className="flex items-center gap-2 bg-green-500/10 text-green-400 font-bold py-2 px-4 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Verified
                                </div>
                            ) : (
                                <button onClick={() => setIsAadhaarModalOpen(true)} className="bg-white text-gray-900 font-bold py-2 px-5 rounded-lg hover:bg-gray-200 transition-colors">
                                    Verify With Aadhaar
                                </button>
                            )}
                        </div>
                         <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-300">Sales Tax Exemption Status</h4>
                                <p className="text-sm text-gray-400">Save from paying tax on your purchases from BazaarLive.</p>
                            </div>
                            <button className="bg-gray-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-600 transition-colors">
                                Set Up
                            </button>
                        </div>
                     </div>
                </div>

                 {/* Account Management */}
                <div className="bg-gray-800 rounded-lg p-6">
                     <h3 className="font-semibold text-white mb-2">Account Management</h3>
                     <div className="divide-y divide-gray-700">
                        <button onClick={() => setIsEmailModalOpen(true)} className="w-full flex justify-between items-center py-4 hover:bg-gray-700/50 -mx-6 px-6 rounded-md transition-colors text-left">
                            <span>Change Email</span>
                            <ChevronRightIcon />
                        </button>
                         <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex justify-between items-center py-4 hover:bg-gray-700/50 -mx-6 px-6 rounded-md transition-colors text-left">
                            <span>Change Password</span>
                            <ChevronRightIcon />
                        </button>
                         <button onClick={() => setIsDeleteModalOpen(true)} className="w-full flex justify-between items-center py-4 hover:bg-gray-700/50 -mx-6 px-6 rounded-md transition-colors text-left">
                            <span className="text-red-500">Delete Account</span>
                            <ChevronRightIcon />
                        </button>
                     </div>
                </div>
            </div>
        </div>
        <AadhaarModal isOpen={isAadhaarModalOpen} onClose={() => setIsAadhaarModalOpen(false)} onVerifySuccess={handleAadhaarSuccess} />
        <ChangeEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
        </>
    );
};

export default AccountPanel;
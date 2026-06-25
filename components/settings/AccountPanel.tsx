
import React, { useState } from 'react';
import { ChevronRightIcon } from '../Icons';
import DigiLockerModal from '../modals/DigiLockerModal';
import ChangeEmailModal from '../modals/ChangeEmailModal';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import DeleteAccountModal from '../modals/DeleteAccountModal';

const AccountPanel: React.FC = () => {
    const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
    const [isDigiLockerModalOpen, setIsDigiLockerModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleAadhaarSuccess = () => {
        setIsAadhaarVerified(true);
        setIsDigiLockerModalOpen(false);
    };

    const NAVY = "#1B3A6B";
    const BLUE = "#2B6CB8";
    const CREAM = "#F8F5F0";

    return (
        <>
        <div className="rounded-2xl" style={{ background: CREAM, border: `1.5px solid rgba(43,108,184,0.18)` }}>
            <div className="p-8 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Account</h2>
                    <p className="text-sm mt-1" style={{ color: "#4A7AB5" }}>Manage verification, payments info, and security.</p>
                </div>

                {/* Buyer Settings */}
                <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: `1.5px solid rgba(43,108,184,0.14)`, boxShadow: "0 2px 8px rgba(43,108,184,0.05)" }}>
                    <h3 className="font-bold text-lg mb-4" style={{ color: NAVY }}>Buyer Settings</h3>
                    <div className="space-y-5">
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <h4 className="font-semibold" style={{ color: NAVY }}>Verified Buyer Status</h4>
                                <p className="text-sm" style={{ color: "#4A7AB5" }}>Once verified you will be able to bid in any stream.</p>
                            </div>
                            {isAadhaarVerified ? (
                                <div className="flex items-center gap-2 font-bold py-2 px-4 rounded-lg" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Verified
                                </div>
                            ) : (
                                <button onClick={() => setIsDigiLockerModalOpen(true)} className="font-bold py-2.5 px-5 rounded-lg transition-all" style={{ background: NAVY, color: "white", boxShadow: "0 2px 8px rgba(27,58,107,0.25)" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = BLUE; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = NAVY; }}>
                                    Verify With Aadhaar
                                </button>
                            )}
                        </div>
                        <div className="flex justify-between items-center gap-4 pt-5" style={{ borderTop: `1.5px solid rgba(43,108,184,0.1)` }}>
                            <div className="flex-1">
                                <h4 className="font-semibold" style={{ color: NAVY }}>Sales Tax Exemption Status</h4>
                                <p className="text-sm" style={{ color: "#4A7AB5" }}>Save from paying tax on your purchases from Any &amp; All.</p>
                            </div>
                            <button className="font-bold py-2.5 px-5 rounded-lg transition-all" style={{ background: "rgba(43,108,184,0.1)", color: NAVY, border: `1.5px solid rgba(43,108,184,0.2)` }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,108,184,0.18)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,108,184,0.1)"; }}>
                                Set Up
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Management */}
                <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: `1.5px solid rgba(43,108,184,0.14)`, boxShadow: "0 2px 8px rgba(43,108,184,0.05)" }}>
                    <h3 className="font-bold text-lg mb-2" style={{ color: NAVY }}>Account Management</h3>
                    <div>
                        <button onClick={() => setIsEmailModalOpen(true)} className="w-full flex justify-between items-center py-4 -mx-6 px-6 rounded-md transition-colors text-left"
                            style={{ color: NAVY }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(43,108,184,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <span className="font-semibold">Change Email</span>
                            <ChevronRightIcon />
                        </button>
                        <div style={{ borderTop: `1px solid rgba(43,108,184,0.1)` }} />
                        <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex justify-between items-center py-4 -mx-6 px-6 rounded-md transition-colors text-left"
                            style={{ color: NAVY }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(43,108,184,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <span className="font-semibold">Change Password</span>
                            <ChevronRightIcon />
                        </button>
                        <div style={{ borderTop: `1px solid rgba(43,108,184,0.1)` }} />
                        <button onClick={() => setIsDeleteModalOpen(true)} className="w-full flex justify-between items-center py-4 -mx-6 px-6 rounded-md transition-colors text-left"
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <span className="font-semibold text-red-500">Delete Account</span>
                            <ChevronRightIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <DigiLockerModal isOpen={isDigiLockerModalOpen} onClose={() => setIsDigiLockerModalOpen(false)} />
        <ChangeEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
        </>
    );
};

export default AccountPanel;

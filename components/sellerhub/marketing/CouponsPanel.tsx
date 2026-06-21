import React, { useState } from 'react';
import CreateCouponModal from '../../modals/CreateCouponModal';

const CouponsPanel: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-sm text-[#4A7AB5] font-medium">Marketing</p>
                    <h1 className="text-3xl font-bold text-[#1B3A6B]">Coupons</h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-white px-5 py-2 rounded-xl font-bold transition-colors text-sm"
                    style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
                >
                    Create Coupon
                </button>
            </div>

            <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead style={{ background: "rgba(43,108,184,0.05)" }}>
                            <tr>
                                {["Coupon Code", "Date Added", "Type", "Amount", "Applied", "Status", ""].map(h => (
                                    <th key={h} scope="col" className="px-6 py-3 text-xs font-semibold text-[#4A7AB5] uppercase tracking-wide">
                                        {h || <span className="sr-only">Actions</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={7} className="text-center py-14 px-6">
                                    <div
                                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                                        style={{ background: "rgba(43,108,184,0.08)" }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#4A7AB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#1B3A6B]">No Coupons Yet</h3>
                                    <p className="text-[#4A7AB5] text-sm mt-1">Click "Create Coupon" to get started.</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <CreateCouponModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default CouponsPanel;

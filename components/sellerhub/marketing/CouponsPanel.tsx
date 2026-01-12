import React, { useState } from 'react';
import CreateCouponModal from '../../modals/CreateCouponModal';

const CouponsPanel: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Coupons</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm">Create Coupon</button>
            </div>
            
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Coupon Code</th>
                                <th scope="col" className="px-6 py-3">Date Added</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Amount</th>
                                <th scope="col" className="px-6 py-3">Applied</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Empty state */}
                            <tr>
                                <td colSpan={7} className="text-center py-12 px-6">
                                    <h3 className="text-xl font-bold text-white">No Coupons Yet</h3>
                                    <p className="text-gray-500 mt-1">Click "Create Coupon" to get started.</p>
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

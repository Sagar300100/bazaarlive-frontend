import React, { useState } from 'react';
import { FriendsIcon } from './Icons';

const ActivityDropdown: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Purchases');
    const [activeSubTab, setActiveSubTab] = useState('Orders');
    const tabs = ['Purchases', 'Bids', 'Offers', 'Saved'];

    const renderContent = () => {
        const purchasedItems = [
            { id: 1, name: 'E1 STARTS - ITEM ON SCREEN #103', price: '£0.00', date: '6/13/2025', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=100', status: 'COMPLETED' },
            { id: 2, name: 'E1 STARTS - ITEM ON SCREEN #13', price: '£0.00', date: '6/13/2025', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=100', status: 'COMPLETED' },
            { id: 3, name: 'PYJAMA PARTY - ITEM ON SCREEN #7', price: '£3.39', date: '6/13/2025', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=100', status: 'COMPLETED' },
        ];

        switch (activeTab) {
            case 'Purchases':
                return (
                    <div>
                        <div className="flex px-4 pt-2 text-sm">
                            <button 
                                onClick={() => setActiveSubTab('Orders')} 
                                className={`font-semibold py-2 px-3 rounded-t-md ${activeSubTab === 'Orders' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Orders
                            </button>
                            <button 
                                onClick={() => setActiveSubTab('Community')} 
                                className={`font-semibold py-2 px-3 rounded-t-md ${activeSubTab === 'Community' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Community Boost
                            </button>
                        </div>
                        <div className="bg-gray-100 max-h-80 overflow-y-auto">
                            {activeSubTab === 'Orders' ? (
                                <div className="p-4 space-y-3">
                                    {purchasedItems.map(item => (
                                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white">
                                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs font-semibold text-gray-500">{item.status}</p>
                                                <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">Purchased: {item.price}</p>
                                                <p className="text-xs text-gray-500">Date: {item.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-sm font-semibold text-orange-600 hover:underline pt-2">Download Orders History</button>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-gray-500 text-sm">Community Boost is not available yet.</div>
                            )}
                        </div>
                    </div>
                );
            default:
                return <div className="p-10 text-center text-gray-500 text-sm">Content for {activeTab} is not available yet.</div>;
        }
    };
    
    return (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl text-gray-900 border border-gray-200 transform transition-all duration-200 ease-out origin-top-right animate-fade-in-down">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-lg">Activity</h3>
                <a href="#" className="text-sm font-semibold text-orange-600 hover:underline flex items-center gap-1">
                    <FriendsIcon />
                    Friends
                </a>
            </div>
            <div className="flex border-b border-gray-200 px-2">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-3 text-sm font-semibold transition-all ${activeTab === tab ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            {renderContent()}
            <style>{`
              @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .animate-fade-in-down { animation: fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default ActivityDropdown;
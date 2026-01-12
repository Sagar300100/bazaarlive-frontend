import React, { useState } from 'react';

const NotificationsDropdown: React.FC = () => {
    const [activeTab, setActiveTab] = useState('All');
    const tabs = ['All', 'Buyer', 'Seller', 'Important'];
    
    return (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl text-gray-900 border border-gray-200 transform transition-all duration-200 ease-out origin-top-right animate-fade-in-down">
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-lg">Notifications</h3>
            </div>
             <div className="p-2 border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-1">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-1.5 px-3 text-sm font-semibold rounded-full transition-all ${activeTab === tab ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400">
                        {/* BazaarLive Logo */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 19-7-7 7-7"/>
                            <path d="M19 12H5"/>
                        </svg>
                    </div>
                </div>
                <h4 className="font-semibold text-gray-800">Nothing to see here...</h4>
                <p className="text-sm text-gray-500 mt-1">All new notifications will appear in this tab. For now, you're all caught up!</p>
            </div>
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

export default NotificationsDropdown;
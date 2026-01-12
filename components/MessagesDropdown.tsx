import React from 'react';

const MessagesDropdown: React.FC = () => {
    const messages = [
        { id: 1, user: 'labelvaults', text: 'Hey, is that vintage jacket still available?', avatar: 'LV' },
        { id: 2, user: 'fleshy_swordfight', text: 'Thanks for the raid last night!', avatar: 'FS' },
        { id: 3, user: 'BazaarLiveSupport', text: 'Your payout has been processed.', avatar: 'BL' },
    ];

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl text-gray-900 border border-gray-200 transform transition-all duration-200 ease-out origin-top-right animate-fade-in-down">
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-lg">Messages</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {messages.length > 0 ? messages.map(msg => (
                    <a href="#" key={msg.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">{msg.avatar}</div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-sm truncate">{msg.user}</p>
                            <p className="text-xs text-gray-500 truncate">{msg.text}</p>
                        </div>
                    </a>
                )) : (
                     <div className="p-10 text-center text-sm text-gray-500">No new messages.</div>
                )}
            </div>
            <div className="p-2 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                 <button className="w-full text-center text-sm font-semibold text-orange-600 hover:underline py-1">View All Messages</button>
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

export default MessagesDropdown;

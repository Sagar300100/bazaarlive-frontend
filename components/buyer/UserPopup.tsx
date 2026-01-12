import React from 'react';
import { ChatMessage } from '../../services/LiveSessionService';

interface UserPopupProps {
    user: ChatMessage;
    onClose: () => void;
    onNavigate: (page: string, data?: { username?: string }) => void;
}

const UserPopup: React.FC<UserPopupProps> = ({ user, onClose, onNavigate }) => {
    
    // Stop propagation to prevent clicks inside from closing it
    const handleInnerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleViewProfile = () => {
        onNavigate('profile', { username: user.user });
        onClose();
    };

    const handleMessage = () => {
        onNavigate('messages', { username: user.user });
        onClose();
    };


    return (
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-xl w-full max-w-xs p-6 shadow-2xl border border-gray-700"
                onClick={handleInnerClick}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {user.avatar}
                    </div>
                    <div>
                        <p className="font-bold text-white">{user.user}</p>
                        {/* Static followers for demo */}
                        <p className="text-sm text-gray-400">1.2k followers</p>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button className="flex-1 bg-yellow-400 text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-300">
                        Follow
                    </button>
                    {/* Message button as requested */}
                    <button onClick={handleMessage} className="flex-1 bg-gray-700 text-white font-bold py-2 rounded-lg text-sm hover:bg-gray-600">
                        Message
                    </button>
                </div>
                
                <div className="mt-4 space-y-1 text-sm">
                    <button onClick={handleViewProfile} className="w-full text-left p-2 rounded-md hover:bg-gray-700">View Profile</button>
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-700">Block</button>
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-700 text-red-500">Report</button>
                </div>
            </div>
        </div>
    );
};

export default UserPopup;
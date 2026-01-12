import React from 'react';
import { ListItemIcon, ScheduleShowIcon } from './Icons';

interface PlusDropdownProps {
  onNavigateToSellerHub: (page: 'inventory' | 'schedule_show') => void;
}

const PlusDropdown: React.FC<PlusDropdownProps> = ({ onNavigateToSellerHub }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl text-gray-900 border border-gray-200 transform transition-all duration-200 ease-out origin-top-right animate-fade-in-down">
      <div className="p-2">
        <button
          onClick={() => onNavigateToSellerHub('inventory')}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ListItemIcon />
          <span className="font-medium text-sm">List an Item</span>
        </button>
        <button
          onClick={() => onNavigateToSellerHub('schedule_show')}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ScheduleShowIcon />
          <span className="font-medium text-sm">Schedule a Show</span>
        </button>
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

export default PlusDropdown;

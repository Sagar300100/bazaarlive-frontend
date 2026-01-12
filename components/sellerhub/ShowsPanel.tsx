import React, { useState } from 'react';
import { CopyIcon, StartSharingIcon, CancelIcon } from '../Icons';
import type { ShowData } from '../../services/api';

function formatShowDate(show: ShowData) {
  const when =
    (show as any).scheduled_time
      ? new Date((show as any).scheduled_time)
      : show.date && show.date !== 'TBD'
      ? new Date(show.date)
      : null;

  return {
    month: when ? when.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD',
    day: when ? String(when.getDate()).padStart(2, '0') : '--',
  };
}

const UpcomingShowCard: React.FC<{
  show: ShowData;
  onEdit: (show: ShowData) => void;
  onCancel: (id: number) => void;
  onOpen: (show: ShowData) => void;
}> = ({ show, onEdit, onCancel, onOpen }) => {
  const { month, day } = formatShowDate(show);

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-center">
            <span className="text-xs text-gray-400">{month}</span>
            <span className="text-xl font-bold text-white">{day}</span>
          </div>
          <div>
            <p className="font-bold text-white">
              {show.name} - {show.time}
            </p>
            <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
              <CopyIcon />
              Copy show link
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpen(show)}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Open Show
          </button>
          <button
            onClick={() => onEdit(show)}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Edit show
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm">
            <StartSharingIcon /> Start sharing
          </button>
          <button
            onClick={() => onCancel(show.id as any)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm"
          >
            <CancelIcon /> Cancel Show
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
            Disable Private Mode
          </button>
        </div>
      </div>
    </div>
  );
};

const PastShowCard: React.FC<{ show: ShowData }> = ({ show }) => {
  const itemsSoldCount = (show as any).soldItems?.length || 0;
  const totalSales =
    (show as any).soldItems?.reduce((acc: number, item: any) => acc + (item.startingPrice || 0), 0) ||
    0;
  const { month, day } = formatShowDate(show);

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 opacity-70">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-center">
            <span className="text-xs text-gray-500">{month}</span>
            <span className="text-xl font-bold text-gray-300">{day}</span>
          </div>
          <div>
            <p className="font-bold text-gray-300">
              {show.name} - {show.time}
            </p>
            {itemsSoldCount > 0 ? (
              <span className="text-xs text-gray-400">
                Ended - Sold {itemsSoldCount} item(s) for a total of ₹{totalSales.toFixed(2)}
              </span>
            ) : (
              <span className="text-xs text-gray-500">Ended - No items sold</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShowsPanelProps {
  shows: ShowData[];
  pastShows: ShowData[];
  onScheduleShow: () => void;
  onEditShow: (show: ShowData) => void;
  onCancelShow: (id: number) => void;
  onOpenShow: (show: ShowData) => void;
  initialTab?: 'upcoming' | 'past';
}

const ShowsPanel: React.FC<ShowsPanelProps> = ({
  shows,
  pastShows,
  onScheduleShow,
  onEditShow,
  onCancelShow,
  onOpenShow,
  initialTab = 'upcoming',
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const upcomingShows = shows;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Shows</h1>
        <div className="flex items-center gap-4">
          <button className="text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
            OBS Tools
          </button>
          <button className="text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
            Going Live Help
          </button>
          <button
            onClick={onScheduleShow}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm"
          >
            Schedule a Show
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'upcoming' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'past' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Past
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingShows.length > 0 ? (
            upcomingShows.map((show) => (
              <UpcomingShowCard
                key={show.id}
                show={show}
                onEdit={onEditShow}
                onCancel={onCancelShow}
                onOpen={onOpenShow}
              />
            ))
          ) : (
            <div className="bg-gray-900 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-black rounded-full text-white font-bold flex items-center justify-center">
                    B
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">No Results</h3>
                <p className="text-gray-400 mt-2">There are no upcoming shows to display.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastShows.length > 0 ? (
            pastShows.map((show) => <PastShowCard key={show.id} show={show} />)
          ) : (
            <div className="bg-gray-900 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">No Past Shows</h3>
                <p className="text-gray-400 mt-2">Your completed shows will appear here.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowsPanel;

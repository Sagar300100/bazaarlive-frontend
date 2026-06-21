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

const btnBase = "font-bold py-2 px-4 rounded-xl text-sm transition-colors";
const btnBlue = `${btnBase} text-white`;
const btnOutline = `${btnBase} text-[#2B6CB8] bg-white hover:bg-blue-50`;

const UpcomingShowCard: React.FC<{
  show: ShowData;
  onEdit: (show: ShowData) => void;
  onCancel: (id: number) => void;
  onOpen: (show: ShowData) => void;
}> = ({ show, onEdit, onCancel, onOpen }) => {
  const { month, day } = formatShowDate(show);

  return (
    <div
      className="bg-white rounded-2xl p-4"
      style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 2px 10px rgba(43,108,184,0.07)" }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-4">
          <div
            className="flex flex-col text-center min-w-[48px] rounded-xl p-2"
            style={{ background: "rgba(43,108,184,0.08)" }}
          >
            <span className="text-xs font-semibold text-[#4A7AB5]">{month}</span>
            <span className="text-xl font-bold text-[#1B3A6B]">{day}</span>
          </div>
          <div>
            <p className="font-bold text-[#1B3A6B]">{show.name} - {show.time}</p>
            <button className="flex items-center gap-1 text-xs text-[#4A7AB5] hover:text-[#2B6CB8] mt-0.5">
              <CopyIcon />
              Copy show link
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpen(show)}
            className={btnOutline}
            style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
          >
            Open Show
          </button>
          <button
            onClick={() => onEdit(show)}
            className={btnOutline}
            style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
          >
            Edit show
          </button>
          <button
            className={`${btnBlue} flex items-center gap-1`}
            style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)" }}
          >
            <StartSharingIcon /> Start sharing
          </button>
          <button
            onClick={() => onCancel(show.id as any)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1 text-sm transition-colors"
          >
            <CancelIcon /> Cancel Show
          </button>
          <button
            className={btnOutline}
            style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
          >
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
    (show as any).soldItems?.reduce((acc: number, item: any) => acc + (item.startingPrice || 0), 0) || 0;
  const { month, day } = formatShowDate(show);

  return (
    <div
      className="bg-white rounded-2xl p-4 opacity-70"
      style={{ border: "1.5px solid rgba(43,108,184,0.12)" }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div
            className="flex flex-col text-center min-w-[48px] rounded-xl p-2"
            style={{ background: "rgba(43,108,184,0.06)" }}
          >
            <span className="text-xs text-[#4A7AB5]">{month}</span>
            <span className="text-xl font-bold text-[#4A7AB5]">{day}</span>
          </div>
          <div>
            <p className="font-bold text-[#4A7AB5]">{show.name} - {show.time}</p>
            {itemsSoldCount > 0 ? (
              <span className="text-xs text-[#4A7AB5]">
                Ended · Sold {itemsSoldCount} item(s) for a total of ₹{totalSales.toFixed(2)}
              </span>
            ) : (
              <span className="text-xs text-[#4A7AB5]">Ended · No items sold</span>
            )}
          </div>
        </div>
        <button
          className={btnOutline}
          style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
        >
          View Details
        </button>
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Shows</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="text-[#2B6CB8] hover:bg-blue-50 px-4 py-2 rounded-xl font-semibold transition-colors text-sm"
            style={{ border: "1.5px solid rgba(43,108,184,0.2)" }}
          >
            OBS Tools
          </button>
          <button
            className="text-[#2B6CB8] hover:bg-blue-50 px-4 py-2 rounded-xl font-semibold transition-colors text-sm"
            style={{ border: "1.5px solid rgba(43,108,184,0.2)" }}
          >
            Going Live Help
          </button>
          <button
            onClick={onScheduleShow}
            className="text-white px-5 py-2 rounded-xl font-bold transition-colors text-sm"
            style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
          >
            Schedule a Show
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-6" style={{ borderBottom: "2px solid rgba(43,108,184,0.1)" }}>
        {(['upcoming', 'past'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-5 font-semibold capitalize text-sm transition-colors ${
              activeTab === tab
                ? 'text-[#2B6CB8] border-b-2 border-[#2B6CB8] -mb-[2px]'
                : 'text-[#4A7AB5] hover:text-[#2B6CB8]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {shows.length > 0 ? (
            shows.map((show) => (
              <UpcomingShowCard
                key={show.id}
                show={show}
                onEdit={onEditShow}
                onCancel={onCancelShow}
                onOpen={onOpenShow}
              />
            ))
          ) : (
            <div
              className="bg-white rounded-2xl p-8 min-h-[400px] flex items-center justify-center"
              style={{ border: "1.5px solid rgba(43,108,184,0.12)" }}
            >
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(43,108,184,0.08)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#4A7AB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1B3A6B]">No Upcoming Shows</h3>
                <p className="text-[#4A7AB5] mt-2">There are no upcoming shows to display.</p>
                <button
                  onClick={onScheduleShow}
                  className="mt-4 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors"
                  style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
                >
                  Schedule a Show
                </button>
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
            <div
              className="bg-white rounded-2xl p-8 min-h-[400px] flex items-center justify-center"
              style={{ border: "1.5px solid rgba(43,108,184,0.12)" }}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#1B3A6B]">No Past Shows</h3>
                <p className="text-[#4A7AB5] mt-2">Your completed shows will appear here.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowsPanel;

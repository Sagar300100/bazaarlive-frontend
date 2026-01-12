
import React, { useState } from 'react';

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-green-500' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
        onClick={() => onChange(!enabled)}
    >
        <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
    </button>
);

const SettingRow: React.FC<{ title: string; description: string; children: React.ReactNode; }> = ({ title, description, children }) => (
    <div className="flex justify-between items-center py-4">
        <div>
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-sm text-gray-400 max-w-md">{description}</p>
        </div>
        {children}
    </div>
);


const PreferencesPanel: React.FC = () => {
    const [directMessages, setDirectMessages] = useState(true);
    const [receiveGifts, setReceiveGifts] = useState(false);
    const [activityStatus, setActivityStatus] = useState(true);
    const [suggestToOthers, setSuggestToOthers] = useState(true);
    const [clips, setClips] = useState(true);
    const [pastShows, setPastShows] = useState(true);
    const [vacationMode, setVacationMode] = useState(false);

    return (
        <div className="bg-gray-900 rounded-lg">
            <div className="p-8">
                <h2 className="text-xl font-bold text-white mb-2">Privacy</h2>
                <p className="text-gray-400 mb-6">Select how you can interact with and be viewed by others.</p>

                <div className="divide-y divide-gray-700">
                    <SettingRow title="Direct Messages" description="Turn this on if you'd like to receive direct messages from BazaarLive users.">
                        <ToggleSwitch enabled={directMessages} onChange={setDirectMessages} />
                    </SettingRow>
                    <SettingRow title="Receive gifts" description="Turn this on to be discoverable to receive gift purchases from other BazaarLive users.">
                        <ToggleSwitch enabled={receiveGifts} onChange={setReceiveGifts} />
                    </SettingRow>
                    <SettingRow title="Activity Status" description="Turn this on if you'd like to share your activities with your friends.">
                         <ToggleSwitch enabled={activityStatus} onChange={setActivityStatus} />
                    </SettingRow>
                     <SettingRow title="Suggest account to others" description="Whatnot will suggest your account to your contacts.">
                         <ToggleSwitch enabled={suggestToOthers} onChange={setSuggestToOthers} />
                    </SettingRow>
                </div>
            </div>

             <div className="p-8 border-t border-gray-800">
                <h2 className="text-xl font-bold text-white mb-2">Profile</h2>
                <p className="text-gray-400 mb-6">Control what is visible on your public profile.</p>
                <div className="divide-y divide-gray-700">
                     <SettingRow title="Clips of you" description="Turn this on if you'd like clips of you to be visible on your profile. Clips are user generated videos from your livestream.">
                         <ToggleSwitch enabled={clips} onChange={setClips} />
                    </SettingRow>
                      <SettingRow title="Your past shows" description="Turn this on if you'd like your past shows to be visible on your profile. You can hide them individually or hide all of them by toggling this option off.">
                         <ToggleSwitch enabled={pastShows} onChange={setPastShows} />
                    </SettingRow>
                      <SettingRow title="Vacation Mode" description="Turn this on to show you are temporarily inactive. Temporarily makes items in your store not purchasable.">
                         <ToggleSwitch enabled={vacationMode} onChange={setVacationMode} />
                    </SettingRow>
                </div>
            </div>
        </div>
    );
};

export default PreferencesPanel;
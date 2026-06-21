import React from 'react';

const GiveawaysPanel: React.FC = () => {
    const giveaways: any[] = [];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-sm text-[#4A7AB5] font-medium">Giveaways</p>
                    <h1 className="text-3xl font-bold text-[#1B3A6B]">Giveaways</h1>
                </div>
                <button
                    className="text-white px-5 py-2 rounded-xl font-bold transition-colors text-sm"
                    style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
                >
                    Create Giveaway
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
                                {["Giveaway Name", "Show Date", "Type", "Entries", "Status", ""].map(h => (
                                    <th key={h} scope="col" className="px-6 py-3 text-xs font-semibold text-[#4A7AB5] uppercase tracking-wide">
                                        {h || <span className="sr-only">Actions</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {giveaways.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-14 px-6">
                                        <div
                                            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                                            style={{ background: "rgba(43,108,184,0.08)" }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#4A7AB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a4 4 0 00-4-4H6a4 4 0 000 8h6m0-8V6a4 4 0 014-4h2a4 4 0 010 8h-6m-6 4h12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#1B3A6B]">No Giveaways Created</h3>
                                        <p className="text-[#4A7AB5] text-sm mt-1">Create a giveaway to engage your audience during a live show.</p>
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GiveawaysPanel;

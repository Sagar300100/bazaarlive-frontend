import React from 'react';

const PromoteToolsPanel: React.FC = () => {
    return (
        <div>
            <div className="mb-6">
                <p className="text-sm text-[#4A7AB5] font-medium">Marketing</p>
                <h1 className="text-3xl font-bold text-[#1B3A6B]">Promote Tools</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    className="bg-white rounded-2xl p-6"
                    style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(43,108,184,0.1)", color: "#2B6CB8" }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[#1B3A6B] mb-2">Shareable Links</h2>
                    <p className="text-[#4A7AB5] text-sm mb-5">Create custom links to your profile or upcoming shows to share on social media. Track clicks and see where your audience is coming from.</p>
                    <button
                        className="text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors"
                        style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
                    >
                        Create Link
                    </button>
                </div>

                <div
                    className="bg-white rounded-2xl p-6"
                    style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(43,108,184,0.1)", color: "#2B6CB8" }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[#1B3A6B] mb-2">Social Media Templates</h2>
                    <p className="text-[#4A7AB5] text-sm mb-5">Download pre-made templates for Instagram Stories, Twitter, and Facebook to easily announce your upcoming shows.</p>
                    <button
                        className="text-[#2B6CB8] px-5 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-blue-50"
                        style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
                    >
                        Download Templates
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromoteToolsPanel;

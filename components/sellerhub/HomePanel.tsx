import React, { useState } from 'react';
import { PlayIcon } from '../Icons';

interface HomePanelProps { onScheduleShow: () => void; }

const HomePanel: React.FC<HomePanelProps> = ({ onScheduleShow }) => {
    const [tutorialTab, setTutorialTab] = useState('pre-show');
    const [bannerVisible, setBannerVisible] = useState(true);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[#1B3A6B]">Hello, Sagar Singhal!</h1>

            {/* Welcome Banner */}
            {bannerVisible && (
                <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 8px 32px rgba(43,108,184,0.25)" }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white, transparent 60%)" }} />
                    <div className="relative z-10 p-6 pr-52">
                        <h2 className="font-bold text-xl text-white">Welcome to your first day as an Any &amp; All seller!</h2>
                        <p className="mt-1 text-white/80 text-sm">Check out our <a href="#" className="font-bold underline text-white">onboarding videos</a> or try <a href="#" className="font-bold underline text-white">rehearsal mode</a> to do a test-run of a live show.</p>
                        <div className="mt-4 flex gap-3">
                            <button className="bg-white text-[#2B6CB8] font-bold py-2 px-5 rounded-xl hover:bg-blue-50 transition-colors text-sm shadow">Try Rehearsal Mode</button>
                            <button onClick={() => setBannerVisible(false)} className="text-white/80 font-semibold py-2 px-4 rounded-xl hover:bg-white/10 transition-colors text-sm">Dismiss</button>
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-48">
                        <img src="https://images.unsplash.com/photo-1575037614876-c38a1b55f288?q=80&w=400" alt="" className="h-full w-full object-cover opacity-40" />
                    </div>
                    <button onClick={() => setBannerVisible(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Upcoming Shows */}
                    <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[#1B3A6B] text-lg">Upcoming Shows</h3>
                            <a href="#" className="text-sm font-semibold text-[#2B6CB8] hover:underline">View All</a>
                        </div>
                        <div className="text-center py-10 border-2 border-dashed rounded-xl" style={{ borderColor: "rgba(43,108,184,0.2)" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#4A7AB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-2 font-semibold text-[#1B3A6B]">No upcoming shows</p>
                            <p className="text-sm text-[#4A7AB5] mt-1">Schedule one now and watch the bids (and your balance) rise.</p>
                            <button onClick={onScheduleShow} className="mt-4 font-bold py-2 px-6 rounded-xl text-white text-sm transition-colors"
                                style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}>
                                Schedule a Show
                            </button>
                        </div>
                    </div>

                    {/* Shipping */}
                    <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[#1B3A6B] text-lg">Shipping</h3>
                            <a href="#" className="text-sm font-semibold text-[#2B6CB8] hover:underline">View All</a>
                        </div>
                        <p className="text-[#4A7AB5] text-center py-8">You're all caught up</p>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* Tutorials */}
                    <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}>
                        <h3 className="font-bold text-[#1B3A6B] text-lg mb-4">Tutorials</h3>
                        <div className="flex border-b text-sm" style={{ borderColor: "rgba(43,108,184,0.15)" }}>
                            {['pre-show','showtime','shipping'].map(tab => (
                                <button key={tab} onClick={() => setTutorialTab(tab)}
                                    className={`pb-2 px-2 mr-3 font-semibold capitalize transition-colors ${tutorialTab === tab ? 'text-[#2B6CB8] border-b-2 border-[#2B6CB8]' : 'text-[#4A7AB5] hover:text-[#2B6CB8]'}`}>
                                    {tab.replace('-',' ')}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 space-y-3">
                            {[{ title: 'Share Your Show', desc: 'Learn how to share your show and score a crowd.', img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=128&q=80' },
                              { title: 'Stream with OBS', desc: 'Learn how to connect OBS to Any & All.', img: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=128&q=80' }
                            ].map(t => (
                                <a key={t.title} href="#" className="flex items-center gap-3 p-2 rounded-xl transition-colors group" style={{ ':hover': {} }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(43,108,184,0.06)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <img src={t.img} alt={t.title} className="rounded-lg w-16 h-9 object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#1B3A6B] text-sm">{t.title}</p>
                                        <p className="text-xs text-[#4A7AB5] mt-0.5">{t.desc}</p>
                                    </div>
                                    <div className="text-[#2B6CB8] flex-shrink-0"><PlayIcon /></div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Sales Match Bonus */}
                    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}>
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-[#1B3A6B] text-sm">₹1500 Sales Match Bonus</h4>
                            <button className="text-[#4A7AB5] hover:text-[#2B6CB8]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <p className="text-xs text-[#4A7AB5] mt-1 mb-3">Sell to 5 different buyers</p>
                        <div className="w-full rounded-full h-2" style={{ background: "rgba(43,108,184,0.1)" }}>
                            <div className="h-2 rounded-full" style={{ width: '0%', background: "linear-gradient(90deg,#2B6CB8,#1A4B8C)" }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-[#4A7AB5] mt-1.5">
                            <span>0/5 completed</span>
                            <span>Expires in 30 days</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePanel;

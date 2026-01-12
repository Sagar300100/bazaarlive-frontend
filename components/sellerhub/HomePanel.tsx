import React, { useState } from 'react';
import { PlayIcon } from '../Icons';

interface HomePanelProps {
    onScheduleShow: () => void;
}

const HomePanel: React.FC<HomePanelProps> = ({ onScheduleShow }) => {
    const [tutorialTab, setTutorialTab] = useState('pre-show');
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Hello, Sagar Singhal!</h1>
            
            {/* Welcome Banner */}
            <div className="bg-yellow-400 text-black rounded-lg p-6 flex justify-between items-center relative overflow-hidden">
                <div>
                    <h2 className="font-bold text-xl">Welcome to your first day as a BazaarLive seller!</h2>
                    <p className="mt-1 text-gray-800">To help you get started, check out our <a href="#" className="font-bold underline">onboarding videos</a> or try <a href="#" className="font-bold underline">rehearsal mode on iOS</a> to do a test-run of a live show.</p>
                    <div className="mt-4">
                        <button className="bg-black text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-800 transition-colors">Try Rehearsal Mode</button>
                        <button className="ml-4 font-bold py-2 px-5 rounded-lg hover:bg-yellow-500/50 transition-colors">Dismiss</button>
                    </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-64">
                    <img src="https://images.unsplash.com/photo-1575037614876-c38a1b55f288?q=80&w=400" alt="Seller abstract art" className="h-full w-full object-cover opacity-80" />
                </div>
                 <button className="absolute top-4 right-4 text-black hover:bg-black/10 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Upcoming Shows */}
                    <div className="bg-gray-900 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-lg">Upcoming Shows</h3>
                            <a href="#" className="text-sm font-semibold text-orange-400 hover:underline">View All</a>
                        </div>
                        <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="mt-2 font-semibold text-white">No upcoming shows</p>
                            <p className="text-sm text-gray-400 mt-1">Schedule one now and watch the bids (and your balance) rise.</p>
                            <button onClick={onScheduleShow} className="mt-4 bg-yellow-400 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition-colors">Schedule a Show</button>
                        </div>
                    </div>
                    {/* Shipping */}
                     <div className="bg-gray-900 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-lg">Shipping</h3>
                            <a href="#" className="text-sm font-semibold text-orange-400 hover:underline">View All</a>
                        </div>
                        <p className="text-gray-400 text-center py-8">You're all caught up</p>
                    </div>
                </div>
                
                <div className="lg:col-span-1 space-y-8">
                    {/* Tutorials */}
                    <div className="bg-gray-900 rounded-lg p-6">
                         <h3 className="font-bold text-white text-lg mb-4">Tutorials</h3>
                         <div className="flex border-b border-gray-700 text-sm">
                            <button onClick={() => setTutorialTab('pre-show')} className={`pb-2 px-1 mr-4 font-semibold ${tutorialTab === 'pre-show' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-white'}`}>Pre-show</button>
                            <button onClick={() => setTutorialTab('showtime')} className={`pb-2 px-1 mr-4 font-semibold ${tutorialTab === 'showtime' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-white'}`}>Showtime</button>
                            <button onClick={() => setTutorialTab('shipping')} className={`pb-2 px-1 mr-4 font-semibold ${tutorialTab === 'shipping' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-white'}`}>Shipping</button>
                         </div>
                         <div className="mt-4 space-y-4">
                            <a href="#" className="flex items-center gap-4 group p-2 -m-2 rounded-lg hover:bg-gray-800">
                                <img src="https://via.placeholder.com/64x36" alt="Share your show" className="rounded w-16 h-9" />
                                <div>
                                    <p className="font-semibold text-white">Share Your Show</p>
                                    <p className="text-sm text-gray-400">Learn how to share your show and score a crowd.</p>
                                </div>
                                <PlayIcon />
                            </a>
                            <a href="#" className="flex items-center gap-4 group p-2 -m-2 rounded-lg hover:bg-gray-800">
                                <img src="https://via.placeholder.com/64x36" alt="Stream with OBS" className="rounded w-16 h-9" />
                                <div>
                                    <p className="font-semibold text-white">Stream with OBS</p>
                                    <p className="text-sm text-gray-400">Learn how to connect OBS to BazaarLive.</p>
                                </div>
                                <PlayIcon />
                            </a>
                         </div>
                    </div>
                    {/* Sales Match Bonus */}
                     <div className="bg-gray-900 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-white text-sm">₹1500 Sales Match Bonus</h4>
                            <button className="text-gray-500 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 mb-2">Sell to 5 different buyers</p>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0/5 completed</span>
                            <span>Expires 30 days</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePanel;

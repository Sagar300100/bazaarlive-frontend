
import React from 'react';
import { liveShows, Show } from '../services/geminiService';

const ShowCard: React.FC<{ show: Show }> = ({ show }) => {
    return (
        <div className="group relative bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ease-in-out">
            <div className="relative">
                <img src={show.thumbnail} alt={show.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                {show.isLive && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse-fast"></span>
                        LIVE
                    </div>
                )}
                 <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>{show.viewers}</span>
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-md font-bold text-white truncate group-hover:text-orange-400 transition-colors">{show.title}</h3>
                <p className="text-sm text-gray-400 mt-1">by {show.seller}</p>
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-300">{show.price}</p>
                    <a href="#" className={`text-sm font-bold py-2 px-4 rounded-md transition-colors ${show.isLive ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>
                        {show.isLive ? 'Join Now' : 'Notify Me'}
                    </a>
                </div>
            </div>
        </div>
    );
};

interface LiveShowsGridProps {
    preferences: string[];
}

export const LiveShowsGrid: React.FC<LiveShowsGridProps> = ({ preferences }) => {
    const shows = liveShows; // from our repurposed geminiService file

    const filteredShows = preferences.length > 0
        ? shows.filter(show => preferences.includes(show.category))
        : shows;

    return (
        <section id="live" className="py-16 sm:py-24 bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {preferences.length > 0 ? "For You" : "Happening Now"}
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                        {preferences.length > 0 
                            ? "Shows and auctions curated based on your interests."
                            : "Jump into live auctions and sales. The action is waiting for you."
                        }
                    </p>
                </div>
                {filteredShows.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredShows.map((show) => (
                            <ShowCard key={show.id} show={show} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-gray-800 rounded-lg">
                        <h3 className="text-xl font-bold text-white">No Live Shows Match Your Interests</h3>
                        <p className="text-gray-400 mt-2">Check back later or update your preferences in your account settings.</p>
                    </div>
                )}
                 <div className="mt-16 text-center">
                    <a href="#" className="text-orange-500 font-semibold hover:text-orange-400 text-lg transition-colors">
                        View all shows &rarr;
                    </a>
                </div>
            </div>
        </section>
    );
};

import React from 'react';

interface HelpCenterPageProps {
    onNavigate: (page: string, data?: { category: string }) => void;
}

const CategoryButton: React.FC<{ title: string; onClick: () => void }> = ({ title, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full bg-gray-200 hover:bg-white text-gray-900 text-lg font-semibold p-8 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 shadow-md"
    >
        {title}
    </button>
);

const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigate }) => {
    return (
        <div className="bg-gray-800 text-gray-200 min-h-screen">
            <header className="bg-gray-900 border-b border-gray-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white tracking-tight">
                            Any &amp; All Help Center
                        </span>
                    </div>
                     <div>
                        <button className="text-sm font-semibold bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg">Contact Us</button>
                    </div>
                </div>
            </header>
            
            <main>
                <section 
                    className="py-20 bg-cover bg-center"
                    style={{backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1470&auto=format&fit=crop')"}}
                >
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Type your question here..."
                                className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg py-4 pl-5 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CategoryButton title="Buying" onClick={() => onNavigate('help-category', { category: 'buying' })} />
                        <CategoryButton title="Selling" onClick={() => {}} /> 
                        <CategoryButton title="Account" onClick={() => onNavigate('help-category', { category: 'account' })} />
                        <CategoryButton title="Safety & Policies" onClick={() => {}} />
                    </div>
                </section>
            </main>

            <footer className="bg-gray-900 border-t border-gray-700 mt-4">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400 text-sm">
                    <p className="font-semibold text-white">© Whatnot</p>
                    <p className="mt-2">Powered by <a href="#" className="font-semibold hover:underline">Premium Plus</a></p>
                </div>
            </footer>
        </div>
    );
};

export default HelpCenterPage;

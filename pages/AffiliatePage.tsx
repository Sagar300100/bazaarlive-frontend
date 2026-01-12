import React, { useState } from 'react';
import { LinkIcon, ContentIcon, CashIcon, PlusIcon } from '../components/Icons';

const FAQItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-700 py-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <h3 className="text-lg font-semibold text-white">{question}</h3>
                <span className={`transform transition-transform ${isOpen ? 'rotate-45' : ''}`}><PlusIcon /></span>
            </button>
            {isOpen && <div className="mt-4 text-gray-400 pr-8">{children}</div>}
        </div>
    );
};

const AffiliatePage: React.FC = () => {
    return (
        <div className="bg-gray-900 text-gray-200">
            {/* Hero Section */}
            <header className="bg-yellow-400 text-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">BazaarLive Affiliates</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-800">
                        Want to get paid to share the app you already love? Whether you're a content creator, run an online community, or have a website, blog or newsletter then you can now join BazaarLive Affiliates!
                    </p>
                    <button className="mt-8 bg-black text-white font-bold py-3 px-8 rounded-full hover:bg-gray-800 transition-transform duration-300 transform hover:scale-105">
                        Sign Up
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* What is BazaarLive Section */}
                <section className="text-center max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white">What is BazaarLive?</h2>
                    <p className="mt-4 text-lg text-gray-400">
                        BazaarLive is the largest live shopping platform in India and Europe to buy, sell, & discover products you love. With multiple categories, you can find rare and unique items from Sports Cards, Collectibles, Comics, Fashion, and more!
                    </p>
                </section>

                {/* Features Section */}
                <section className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-800 p-8 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">Learn More & Apply</h3>
                        <p className="text-gray-400 mb-6">Apply directly here to BazaarLive Affiliates, powered by Impact.com. Set up an account and start earning right away!</p>
                        <button className="bg-yellow-400 text-black font-bold py-2 px-6 rounded-full hover:bg-yellow-300 transition-colors">Get Started</button>
                    </div>
                     <div className="bg-gray-800 p-8 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">Generate Links</h3>
                        <p className="text-gray-400 mb-6">Create links to BazaarLive products, shows, searches and more. You can make links on Impact.com, from BazaarLive's app, or directly on BazaarLive's website.</p>
                        <button className="bg-yellow-400 text-black font-bold py-2 px-6 rounded-full hover:bg-yellow-300 transition-colors">Create Links</button>
                    </div>
                     <div className="bg-gray-800 p-8 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">Create & Share Content</h3>
                        <p className="text-gray-400 mb-6">Make engaging content so users will click through your link!</p>
                        <button className="bg-yellow-400 text-black font-bold py-2 px-6 rounded-full hover:bg-yellow-300 transition-colors">Get Tips</button>
                    </div>
                     <div className="bg-gray-800 p-8 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">Earn Cash</h3>
                        <p className="text-gray-400 mb-6">Earn money when anyone clicks on your affiliate link and purchases within the 3 day window!</p>
                        <button className="bg-yellow-400 text-black font-bold py-2 px-6 rounded-full hover:bg-yellow-300 transition-colors">Get Info</button>
                    </div>
                </section>
                
                {/* FAQ Section */}
                <section className="mt-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-8">FAQs</h2>
                    <FAQItem question="Who can apply?">
                        <p>Anyone can apply to become a BazaarLive Affiliate! We review applications based on a variety of factors, including channel size, engagement, and content quality.</p>
                    </FAQItem>
                    <FAQItem question="How long does an affiliate tracking cookie last?">
                        <p>The tracking cookie for BazaarLive affiliate links lasts for 3 days. This means you will earn a commission on any eligible purchases made by a user within 3 days of them clicking your link.</p>
                    </FAQItem>
                    <FAQItem question="How are referrals tracked?">
                        <p>Our affiliate program is powered by Impact.com, which uses a combination of cookies and tracking pixels to monitor clicks and attribute sales to your unique affiliate links.</p>
                    </FAQItem>
                     <FAQItem question="How do I get paid?">
                        <p>Payouts are managed through Impact.com. You can set up your preferred payment method (e.g., direct deposit, PayPal) within your Impact.com dashboard.</p>
                    </FAQItem>
                </section>
            </main>
            
            {/* Footer */}
            <footer className="bg-black text-gray-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Company</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#" className="hover:text-white">About us</a></li>
                                <li><a href="#" className="hover:text-white">Careers</a></li>
                                <li><a href="#" className="hover:text-white">FAQ</a></li>
                            </ul>
                        </div>
                         <div>
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Follow us</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
                                <li><a href="#" className="hover:text-white">Instagram</a></li>
                                <li><a href="#" className="hover:text-white">TikTok</a></li>
                                <li><a href="#" className="hover:text-white">Facebook</a></li>
                            </ul>
                        </div>
                         <div>
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Contact Us</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#" className="hover:text-white">Support</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AffiliatePage;

import React from 'react';
import { AnalyticsIcon, TicketIcon } from '../Icons';

const BenefitCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-orange-500/10 text-orange-500 mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-base text-gray-400">{description}</p>
    </div>
);


const MembershipPanel: React.FC = () => {
    return (
        <div>
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    The <span className="text-orange-500">Pro Seller</span> Toolkit
                </h1>
                <p className="mt-4 text-lg text-gray-400">
                   This is more than a membership; it's an investment in your business. Unlock a powerful suite of tools designed to help you save time, make more money, and build your brand.
                </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <BenefitCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    title="Reduced Commission"
                    description="The core financial perk. Pay only 8% commission instead of the standard 10% on all sales, putting more profit in your pocket."
                />
                 <BenefitCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    title="Boosted Show Discovery"
                    description="Get priority placement on the homepage, in search results, and at the top of category pages. More visibility means more viewers."
                />
                <BenefitCard
                    icon={<AnalyticsIcon />}
                    title="Advanced Analytics"
                    description="Access a private dashboard with sales trends, top buyers, and peak viewer times. Make data-driven decisions to grow your sales."
                />
                 <BenefitCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                    title="Branding Tools"
                    description="Build trust with an official Pro Seller badge and make your stream look professional with custom-branded overlays."
                />
                <BenefitCard
                    icon={<TicketIcon />}
                    title="Enhanced Giveaways"
                    description="Run advanced giveaways with special rules (like followers-only) and automatic winner selection to supercharge your stream's engagement."
                />
                 <BenefitCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    title="Priority Support"
                    description="Get your questions answered faster. Pro Seller tickets are moved to the front of the support queue."
                />
            </div>
            
            <div className="mt-16 text-center">
                 <button className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-10 rounded-lg text-lg transition-transform duration-300 transform hover:scale-105">
                    Upgrade to Pro for ₹999/month
                </button>
                <p className="text-gray-500 text-sm mt-4">Cancel anytime. Billed monthly.</p>
            </div>
        </div>
    );
};

export default MembershipPanel;
import React from 'react';

const AboutUsPage: React.FC = () => {
    return (
        <div className="bg-gray-900 text-gray-200">
            {/* Hero Section */}
            <header className="relative bg-gray-800 py-24 sm:py-32">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop"
                        alt="Community of people"
                        className="w-full h-full object-cover opacity-30"
                    />
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                        Connecting India, <span className="text-orange-500">Live.</span>
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300">
                        BazaarLive is more than a marketplace. We are a community-driven platform bringing the excitement of live auctions and shopping directly to you, from sellers across the nation.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Our Story Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Our Story</h2>
                        <p className="mt-4 text-gray-400">
                            Born from a passion for collectibles and the vibrant energy of Indian bazaars, BazaarLive was created to bridge the gap between passionate sellers and enthusiastic buyers. We saw an opportunity to use technology not just to transact, but to connect, share stories, and build genuine relationships.
                        </p>
                        <p className="mt-4 text-gray-400">
                            We're on a mission to empower creators, collectors, and entrepreneurs by giving them a stage to share what they love. Our platform is built on the principles of trust, community, and the thrill of the find.
                        </p>
                    </div>
                    <div className="rounded-lg overflow-hidden">
                         <img
                            src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1470&auto=format&fit=crop"
                            alt="Seller interacting with customer"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </section>

                {/* What We Do Section */}
                <section className="mt-24">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-white">The Heart of the Bazaar</h2>
                        <p className="mt-4 text-lg text-gray-400">
                            We've modernized the marketplace experience, keeping the human connection at its core.
                        </p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="bg-gray-800 p-8 rounded-lg">
                            <h3 className="text-xl font-bold text-orange-400">Live Auctions</h3>
                            <p className="mt-2 text-gray-400">Experience the adrenaline rush of real-time bidding. Interact with sellers, ask questions, and snag incredible deals as they happen.</p>
                        </div>
                        <div className="bg-gray-800 p-8 rounded-lg">
                            <h3 className="text-xl font-bold text-orange-400">Instant Purchases</h3>
                            <p className="mt-2 text-gray-400">Don't want to wait? Many of our sellers offer items for immediate purchase. See it, love it, buy it instantly.</p>
                        </div>
                        <div className="bg-gray-800 p-8 rounded-lg">
                            <h3 className="text-xl font-bold text-orange-400">Community First</h3>
                            <p className="mt-2 text-gray-400">Follow your favorite hosts, chat with fellow collectors, and be part of a community that shares your passions. It's shopping, but social.</p>
                        </div>
                    </div>
                </section>
                
                {/* Call to Action Section */}
                <section className="mt-24 bg-gray-800 rounded-lg p-12 text-center">
                     <h2 className="text-3xl font-bold text-white">Join the Community</h2>
                     <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                        Whether you're looking to find your next prized possession or start your own live selling business, your journey begins here.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <a href="#" className="bg-orange-600 text-white font-bold py-3 px-8 rounded-md hover:bg-orange-500 transition-colors">Start Exploring</a>
                        <a href="#" className="bg-gray-700 text-white font-bold py-3 px-8 rounded-md hover:bg-gray-600 transition-colors">Become a Seller</a>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default AboutUsPage;

import React from 'react';

const PromoteToolsPanel: React.FC = () => {
    return (
        <div>
             <h1 className="text-3xl font-bold text-white mb-6">Promote Tools</h1>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-2">Shareable Links</h2>
                    <p className="text-gray-400 mb-4">Create custom links to your profile or upcoming shows to share on social media. Track clicks and see where your audience is coming from.</p>
                    <button className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm">Create Link</button>
                </div>
                 <div className="bg-gray-900 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-2">Social Media Templates</h2>
                    <p className="text-gray-400 mb-4">Download pre-made templates for Instagram Stories, Twitter, and Facebook to easily announce your upcoming shows.</p>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm">Download Templates</button>
                </div>
             </div>
        </div>
    );
};

export default PromoteToolsPanel;

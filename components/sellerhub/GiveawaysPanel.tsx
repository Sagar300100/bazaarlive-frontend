import React from 'react';

const GiveawaysPanel: React.FC = () => {
    // In a real app, this would come from state or an API call
    const giveaways: any[] = [];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Giveaways</h1>
                <button className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm">Create Giveaway</button>
            </div>
            
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Giveaway Name</th>
                                <th scope="col" className="px-6 py-3">Show Date</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Entries</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {giveaways.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 px-6">
                                        <h3 className="text-xl font-bold text-white">No Giveaways Created</h3>
                                        <p className="text-gray-500 mt-1">Create a giveaway to engage your audience during a live show.</p>
                                    </td>
                                </tr>
                            ) : (
                                // Map over giveaways here
                                null
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GiveawaysPanel;

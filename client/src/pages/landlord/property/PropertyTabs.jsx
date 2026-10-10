import React from 'react';

const PropertyTabs = ({ activeTab, setActiveTab }) => (
    <div className="flex gap-2 mb-6">
        <div className="bg-gray-200 rounded-lg border-2 border-gray-200 space-x-0.5">
            {['rentals', 'listings'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                            ? 'bg-white text-black'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
        </div>
    </div>
);

export default PropertyTabs;

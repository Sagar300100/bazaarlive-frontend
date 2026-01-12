import React from 'react';
import { onboardingCategories } from '../constants/onboardingData';
import CategoryCard from '../components/buyer/CategoryCard';

interface BrowsePageProps {
    onSelectCategory: (category: string) => void;
}

// Simple deduplication based on category name
const uniqueCategories = onboardingCategories.reduce((acc, current) => {
    if (!acc.find(item => item.name === current.name)) {
        acc.push(current);
    }
    return acc;
}, [] as typeof onboardingCategories);


const BrowsePage: React.FC<BrowsePageProps> = ({ onSelectCategory }) => {
    return (
        <div className="bg-gray-900 text-gray-200">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-white mb-8">Browse by Category</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {uniqueCategories.map(category => (
                        <CategoryCard 
                            key={category.name}
                            name={category.name}
                            image={category.image}
                            onClick={() => onSelectCategory(category.name)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default BrowsePage;

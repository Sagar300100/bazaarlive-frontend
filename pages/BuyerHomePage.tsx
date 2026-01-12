import React from 'react';
import { Sidebar, Filters } from '../components/buyer/Sidebar';
import { ShowGrid } from '../components/buyer/ShowGrid';
import type { ShowData } from '../services/api';

interface BuyerHomePageProps {
    shows: ShowData[];
    onJoinShow: (show: ShowData) => void;
    onSwitchToSelling: () => void;
    onNavigate: (page: string) => void;
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const initialFilters: Filters = {
    categories: [],
    timeOfShow: [],
    showFormat: [],
    brands: [],
    sellerRating: null,
    shippedFrom: [],
};

const BuyerHomePage: React.FC<BuyerHomePageProps> = ({ shows, onJoinShow, onSwitchToSelling, onNavigate, filters, setFilters }) => {

    const filteredShows = shows.filter(show => {
        const categoryMatch = filters.categories.length === 0 || filters.categories.some(filterCategory => {
            const filterCatLower = filterCategory.toLowerCase();
            return (
                show.category.toLowerCase().includes(filterCatLower) ||
                show.subcategory.toLowerCase().includes(filterCatLower) ||
                show.name.toLowerCase().includes(filterCatLower) ||
                show.tags.some(tag => tag.toLowerCase().includes(filterCatLower))
            );
        });
        
        const timeMatch = filters.timeOfShow.length === 0 ||
            (filters.timeOfShow.includes('Live') && show.isLive) ||
            (filters.timeOfShow.includes('Upcoming') && !show.isLive);
            
        const formatMatch = filters.showFormat.length === 0 || filters.showFormat.includes(show.sellingFormat);
        
        const brandMatch = filters.brands.length === 0 || filters.brands.some(filterBrand => {
            const filterBrandLower = filterBrand.toLowerCase();
            // Handle brand names with extra details like "Essentials (Fear of God)"
            const simpleFilterBrand = filterBrandLower.split('(')[0].trim();
            return (
                (show.brand && show.brand.toLowerCase().includes(simpleFilterBrand)) ||
                show.name.toLowerCase().includes(simpleFilterBrand) ||
                show.tags.some(tag => tag.toLowerCase().includes(simpleFilterBrand))
            );
        });
        
        const ratingMatch = !filters.sellerRating ||
            (filters.sellerRating === '5 stars' && show.sellerRating >= 4.9) ||
            (filters.sellerRating === '4.5 & Up' && show.sellerRating >= 4.5) ||
            (filters.sellerRating === '4.0 & Up' && show.sellerRating >= 4.0);

        const shippingMatch = filters.shippedFrom.length === 0 || (show.shippedFrom && filters.shippedFrom.includes(show.shippedFrom));

        return categoryMatch && timeMatch && formatMatch && brandMatch && ratingMatch && shippingMatch;
    });

    const activeFilterCount = Object.values(filters).reduce((count, value) => {
        if (Array.isArray(value)) return count + value.length;
        if (value) return count + 1;
        return count;
    }, 0);


    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex items-center justify-end mt-6 mb-4 px-1">
            <div className="flex items-center gap-3 text-sm text-white/70">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-[#ffffff1a]">Filters {activeFilterCount}</span>
                {activeFilterCount > 0 && (
                    <button onClick={() => setFilters(initialFilters)} className="font-semibold text-[#ff5f6d] hover:underline">Clear</button>
                )}
            </div>
        </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                <Sidebar 
                    onSwitchToSelling={onSwitchToSelling}
                    filters={filters}
                    setFilters={setFilters}
                    onNavigate={onNavigate}
                />
                <main className="space-y-8 fade-rise d2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Explore Shows</h2>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                            <span>{filteredShows.length} results</span>
                            <button onClick={() => setFilters(initialFilters)} className="font-semibold text-[#ff5f6d] hover:underline">Clear</button>
                        </div>
                    </div>
                    <ShowGrid shows={filteredShows} onJoinShow={onJoinShow} />
                </main>
            </div>
        </div>
    );
};

export default BuyerHomePage;

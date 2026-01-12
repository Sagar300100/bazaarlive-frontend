import React from 'react';

interface CategoryCardProps {
    name: string;
    image: string;
    onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, image, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative block w-full aspect-[4/3] rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500"
        >
            <img 
                src={image} 
                alt={name} 
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 p-3 sm:p-4 w-full">
                <h3 className="text-white text-sm sm:text-base font-bold text-left">{name}</h3>
            </div>
        </button>
    );
};

export default CategoryCard;

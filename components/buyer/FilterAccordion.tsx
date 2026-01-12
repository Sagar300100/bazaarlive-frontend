import React, { useState } from 'react';

interface FilterAccordionProps {
  title: string;
  options: readonly string[];
  selectionType: 'checkbox' | 'radio';
  selected: string[];
  onSelectionChange: (option: string) => void;
}

const FilterAccordion: React.FC<FilterAccordionProps> = ({ title, options, selectionType, selected, onSelectionChange }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="py-2 border-b border-gray-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center"
                aria-expanded={isOpen}
            >
                <h3 className="font-semibold text-gray-300 text-sm">{title}</h3>
                <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="mt-2 space-y-2">
                    {options.map((option) => (
                        <label key={option} className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type={selectionType}
                                name={title}
                                value={option}
                                checked={selected.includes(option)}
                                onChange={() => onSelectionChange(option)}
                                className={selectionType === 'checkbox' 
                                    ? "form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-orange-500 focus:ring-orange-500" 
                                    : "form-radio h-4 w-4 bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500"
                                }
                            />
                            <span className="text-gray-300 text-sm">{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FilterAccordion;

import React from "react";
import { CATEGORIES } from "../../constants/filterData";

export interface Filters {
  categories: string[];
  timeOfShow: string[];
  showFormat: string[];
  brands: string[];
  sellerRating: string | null;
  shippedFrom: string[];
}

interface SidebarProps {
  onSwitchToSelling: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onSwitchToSelling,
  filters,
  setFilters,
  onNavigate,
}) => {
  const handleFilterChange = (filterKey: keyof Filters, value: string) => {
    setFilters((prev) => {
      const currentSelection = prev[filterKey];
      if (Array.isArray(currentSelection)) {
        const newSelection = currentSelection.includes(value)
          ? currentSelection.filter((item) => item !== value)
          : [...currentSelection, value];
        return { ...prev, [filterKey]: newSelection };
      } else {
        const newSelection = currentSelection === value ? null : value;
        return { ...prev, [filterKey]: newSelection };
      }
    });
  };

  const categories = CATEGORIES;
  const primaryLinks = [
    { label: "For You" },
    { label: "Followed Hosts" },
  ];
  const storedName = (localStorage.getItem("bl_user") || "there").trim();
  const displayName = storedName.length ? storedName : "there";

  return (
    <aside className="hidden md:flex flex-col w-72 sidebar-whatnot glass">
      <div className="mb-6 leading-tight">
        <p className="text-lg font-bold text-white capitalize">Hi {displayName}!</p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {primaryLinks.map((item, idx) => (
          <button
            key={item.label}
            className={`nav-chip ${idx === 0 ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="section-title">Browse</div>
        <div className="category-scroll">
          {categories.map((cat) => {
            const isSelected = filters.categories.includes(cat);
            return (
              <button
                key={cat}
                className={`nav-link ${isSelected ? "active" : ""}`}
                onClick={() => handleFilterChange("categories", cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-[#e6e6e6] text-sm text-gray-500 space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <a href="#" className="hover:text-gray-800">
            Blog
          </a>
          <a href="#" className="hover:text-gray-800">
            Careers
          </a>
          <button onClick={() => onNavigate("about")} className="hover:text-gray-800">
            About Us
          </button>
          <a href="#" className="hover:text-gray-800">
            FAQ
          </a>
          <a href="#" className="hover:text-gray-800">
            Privacy
          </a>
          <a href="#" className="hover:text-gray-800">
            Terms
          </a>
          <a href="#" className="hover:text-gray-800">
            Contact
          </a>
        </div>
        <div>
          <button className="flex items-center gap-2 hover:text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9V3"
              />
            </svg>
            English
          </button>
        </div>
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} BazaarLive Inc.</p>
      </div>
    </aside>
  );
};

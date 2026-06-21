import React, { useState, useEffect } from "react";
import { Sparkles, Heart, ChevronRight, Globe } from "lucide-react";
import { CATEGORIES } from "../../constants/filterData";
import { getAuth } from "firebase/auth";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";

export interface Filters {
  categories: string[];
  timeOfShow: string[];
  showFormat: string[];
  brands: string[];
  sellerRating: string | null;
  shippedFrom: string[];
  forYou?: boolean;
  followedOnly?: boolean;
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
  const [followedSellers, setFollowedSellers] = useState<string[]>([]);

  // Load followed sellers from Firebase
  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;
    const db = getFirestore();
    const q  = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    getDocs(q).then(snap => {
      setFollowedSellers(snap.docs.map(d => d.data().sellerId as string));
    }).catch(() => {});
  }, []);

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

  const setTab = (tab: 'for_you' | 'followed') => {
    setFilters(prev => ({
      ...prev,
      forYou:       tab === 'for_you',
      followedOnly: tab === 'followed',
    }));
  };

  const categories = CATEGORIES;
  const storedName = (localStorage.getItem("bl_user") || "there").trim();
  const displayName = storedName.length ? storedName : "there";
  const activeTab = filters.followedOnly ? 'followed' : 'for_you';

  return (
    <aside className="hidden md:flex flex-col w-full sidebar-whatnot glass">
      <div className="mb-6 leading-tight">
        <p className="text-lg font-bold text-white capitalize">Hi {displayName}!</p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={() => setTab('for_you')}
          className={`nav-chip ${activeTab === 'for_you' ? 'active' : ''}`}
        >
          <span className="nav-chip-icon"><Sparkles size={14} strokeWidth={2.2} /></span>
          <span className="nav-chip-label">For You</span>
          <ChevronRight size={14} className="nav-chip-arrow" />
        </button>
        <button
          onClick={() => setTab('followed')}
          className={`nav-chip ${activeTab === 'followed' ? 'active' : ''}`}
        >
          <span className="nav-chip-icon"><Heart size={14} strokeWidth={2.2} fill="currentColor" /></span>
          <span className="nav-chip-label">Followed Hosts</span>
          {followedSellers.length > 0 && (
            <span className="nav-chip-badge">{followedSellers.length}</span>
          )}
          <ChevronRight size={14} className="nav-chip-arrow" />
        </button>
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
            <Globe size={14} strokeWidth={2} />
            English
          </button>
        </div>
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Any & All Inc.</p>
      </div>
    </aside>
  );
};

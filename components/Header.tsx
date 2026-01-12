import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ProfileDropdown } from "./ProfileDropdown";
import { PlusCircleIcon, HeartIcon, ChatBubbleIcon, BellIcon } from "./Icons";
import PlusDropdown from "./PlusDropdown";
import ActivityDropdown from "./ActivityDropdown";
import NotificationsDropdown from "./NotificationsDropdown";
import MessagesDropdown from "./MessagesDropdown";

export const Logo = ({ onBack }: { onBack?: () => void }) => {
  const arrow = (
    <span className="p-1 rounded-full hover:bg-white/10 transition-colors inline-flex">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff6f3c]">
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      {onBack ? (
        <span
          role="button"
          tabIndex={0}
          onClick={onBack}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onBack();
          }}
          aria-label="Back"
        >
          {arrow}
        </span>
      ) : (
        arrow
      )}
      <span className="text-2xl font-bold tracking-tight text-white">
        Bazaar<span className="text-[#ff5f6d]">Live</span>
      </span>
    </div>
  );
};

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const HamburgerIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface HeaderProps {
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  onSellClick: () => void;
  onNavigateToSellerHub: (page: "inventory" | "schedule_show" | "shows" | "home") => void;
  currentPage: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, isLoggedIn, onLoginClick, onLogout, onSellClick, onNavigateToSellerHub, currentPage, onBack }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [logoMenu, setLogoMenu] = useState(false);
  const [displayName, setDisplayName] = useState<string>("S");
  const [initial, setInitial] = useState<string>("S");
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getAuth();
    const updateFromUser = (user: any) => {
      if (!user) {
        setDisplayName("User");
        setInitial("U");
        return;
      }
      const id = user.uid || user.email;
      let name = user.displayName || (user.email ? user.email.split("@")[0] : "User");
      if (id) {
        const stored = localStorage.getItem(`bl_profile_${id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            name = parsed.username || parsed.handle || name;
          } catch {
            /* ignore parse errors */
          }
        }
      }
      setDisplayName(name);
      setInitial(name.slice(0, 1).toUpperCase());
    };
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      updateFromUser(user);
    });
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail) {
        setDisplayName(detail);
        setInitial(detail.slice(0, 1).toUpperCase());
      }
    };
    window.addEventListener("bl:displayNameUpdated", handleCustom);
    // initial run
    updateFromUser(auth.currentUser);
    return () => {
      unsubAuth();
      window.removeEventListener("bl:displayNameUpdated", handleCustom);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const outsideDropdown = dropdownContainerRef.current && !dropdownContainerRef.current.contains(target);
      const outsideLogo = logoRef.current && !logoRef.current.contains(target);
      if (outsideDropdown) {
        setOpenDropdown(null);
      }
      if (outsideLogo) {
        setLogoMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const loggedOutLinks = (
    <>
      <a href="#live" className="text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-md text-sm font-semibold">Live Now</a>
      <a href="#upcoming" className="text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-md text-sm font-semibold">Upcoming</a>
      <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-md text-sm font-semibold">How It Works</a>
      <button onClick={onSellClick} className="text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-md text-sm font-semibold">Sell</button>
    </>
  );

  const loggedInLinks = (
    <>
      <button onClick={() => onNavigate("home")} className={`px-4 py-2 rounded-full text-sm font-bold hover-glow transition-colors ${currentPage === "home" ? "bg-white text-black" : "text-white hover:bg-white/10"}`}>Home</button>
      <button onClick={() => onNavigate("browse")} className={`px-4 py-2 rounded-full text-sm font-bold hover-glow transition-colors ${currentPage === "browse" ? "bg-white text-black" : "text-white hover:bg-white/10"}`}>Browse</button>
    </>
  );

  const loggedOutActions = (
    <div className="flex items-center gap-3">
      <button onClick={onLoginClick} className="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100">
        Log in
      </button>
      <a href="#" className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #ff6f3c, #ff9a62)" }}>
        Sign up
      </a>
    </div>
  );

  const loggedInActions = (
    <div ref={dropdownContainerRef} className="flex items-center gap-2 text-white">
      <div className="relative">
        <button onClick={() => toggleDropdown("plus")} className="p-2 rounded-full hover:bg-white/10 transition-colors icon-hover" aria-label="Create">
          <PlusCircleIcon />
        </button>
        {openDropdown === "plus" && <PlusDropdown onNavigateToSellerHub={onNavigateToSellerHub} />}
      </div>
      <div className="relative">
        <button onClick={() => toggleDropdown("activity")} className="p-2 rounded-full hover:bg-white/10 transition-colors icon-hover" aria-label="Activity">
          <HeartIcon />
        </button>
        {openDropdown === "activity" && <ActivityDropdown />}
      </div>
      <div className="relative">
        <button onClick={() => toggleDropdown("messages")} className="p-2 rounded-full hover:bg-white/10 transition-colors icon-hover" aria-label="Messages">
          <ChatBubbleIcon />
        </button>
        {openDropdown === "messages" && <MessagesDropdown />}
      </div>
      <div className="relative">
        <button onClick={() => toggleDropdown("notifications")} className="p-2 rounded-full hover:bg-white/10 transition-colors icon-hover" aria-label="Notifications">
          <BellIcon />
        </button>
        {openDropdown === "notifications" && <NotificationsDropdown />}
      </div>
      <div className="relative">
        <button
          onClick={() => toggleDropdown("profile")}
          className="w-10 h-10 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center hover:bg-slate-800 transition-colors"
          aria-label="Account menu"
        >
          {initial}
        </button>
        {openDropdown === "profile" && (
          <ProfileDropdown
            onNavigate={onNavigate}
            onLogout={onLogout}
            displayName={displayName}
            initial={initial}
          />
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/70 border-b border-[#ffffff14]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8 relative">
            <div className="relative" ref={logoRef}>
              <div
                role="button"
                tabIndex={0}
                aria-label="BazaarLive Home"
                onClick={() => setLogoMenu((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setLogoMenu((prev) => !prev);
                }}
                className="flex items-center cursor-pointer"
              >
                <Logo />
              </div>
              {logoMenu && (
                <div className="logo-dropdown">
                  <button
                    className="w-full text-left px-3 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-100"
                    onClick={() => {
                      setLogoMenu(false);
                      onSellClick();
                    }}
                  >
                    Switch to Selling
                  </button>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              {isLoggedIn ? loggedInLinks : loggedOutLinks}
            </div>
          </div>

          {isLoggedIn && (
            <div className="flex-1 max-w-lg mx-8 hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search BazaarLive"
                  className="w-full rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#ff6f3c] bg-white/10 border border-[#ffffff1a] text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          <div className="hidden md:block">
            {isLoggedIn ? loggedInActions : loggedOutActions}
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-white/10 inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#ff6f3c]"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-[#ffffff1a]" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isLoggedIn ? loggedInLinks : loggedOutLinks}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-200">
            <div className="flex items-center px-5 gap-3">
              {isLoggedIn ? (
                <div className="text-slate-900 font-semibold">Welcome!</div>
              ) : (
                <>
                  <button onClick={() => { onLoginClick(); setIsMenuOpen(false); }} className="w-full text-center bg-slate-100 text-slate-900 px-3 py-2 rounded-md text-base font-semibold transition-colors">
                    Log in
                  </button>
                  <a href="#" className="w-full text-center text-white px-4 py-2 rounded-md text-base font-bold" style={{ background: "linear-gradient(135deg, #ff6f3c, #ff9a62)" }}>
                    Sign up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

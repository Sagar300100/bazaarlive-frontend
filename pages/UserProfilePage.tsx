import React, { useEffect, useState } from "react";
import { getAuth, updateProfile as updateAuthProfile } from "firebase/auth";

interface UserProfilePageProps {
  onNavigate: (page: string, data?: { username?: string }) => void;
  username: string | null;
}

type ShowCard = {
  id: string;
  title: string;
  timeLabel: string;
  image: string;
  live?: boolean;
  savedCount?: number;
};

type ProfileData = {
  username: string;
  handle: string;
  bio?: string;
  avatar?: string;
  followers?: number;
  following?: number;
  rating?: number;
  ratingCount?: string;
  avgShip?: string;
  sold?: string;
  categories?: string[];
  upcomingShows: ShowCard[];
};

const defaultProfile: ProfileData = {
  username: "yourshop",
  handle: "Your Name",
  bio: "Tell buyers what you sell and why they should follow.",
  avatar: "",
  followers: 0,
  following: 0,
  rating: undefined,
  ratingCount: "",
  avgShip: "",
  sold: "",
  categories: [],
  upcomingShows: [
    {
      id: "1",
      title: "Upcoming Show",
      timeLabel: "Live · 0",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop",
      live: true,
      savedCount: 0,
    },
    {
      id: "2",
      title: "Next Drop",
      timeLabel: "Tomorrow 10:30 AM",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop",
      savedCount: 0,
    },
    {
      id: "3",
      title: "Feature Show",
      timeLabel: "Fri 10:30 AM",
      image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=600&auto=format&fit=crop",
      savedCount: 0,
    },
  ],
};

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-3 pb-2 text-sm font-semibold border-b-2 transition-colors ${
      active ? "border-white text-white" : "border-transparent text-gray-400 hover:text-white"
    }`}
  >
    {label}
  </button>
);

const ShowTile: React.FC<{ show: ShowCard; seller: string }> = ({ show, seller }) => (
  <div className="bg-[#0d1529] rounded-xl overflow-hidden shadow border border-gray-800 flex flex-col">
    <div className="relative aspect-[3/4]">
      <img src={show.image} alt={show.title} className="w-full h-full object-cover" />
      <div className="absolute top-2 left-2">
        <span
          className={`px-2 py-1 rounded-full text-xs font-bold ${
            show.live ? "bg-red-600 text-white" : "bg-black/70 text-white"
          }`}
        >
          {show.timeLabel}
        </span>
      </div>
      {show.savedCount !== undefined && (
        <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full px-2 py-1 text-xs font-semibold">
          {show.savedCount}
        </div>
      )}
    </div>
    <div className="p-3 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold">
          {seller.slice(0, 1).toUpperCase()}
        </div>
        <span>{seller}</span>
      </div>
      <p className="text-white font-semibold text-sm leading-tight">{show.title}</p>
    </div>
  </div>
);

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<"Shows" | "Shop" | "Reviews" | "Clips">("Shows");
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState<string>("bl_profile_guest");
  const [formState, setFormState] = useState({
    username: profile.username,
    handle: profile.handle,
    bio: profile.bio || "",
  });

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const id = user?.uid || user?.email;
      const key = id ? `bl_profile_${id}` : "bl_profile_guest";
      setStorageKey(key);
      setLoading(true);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const loadProfile = () => {
      try {
        setLoading(true);
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const merged = { ...defaultProfile, ...parsed };
          setProfile(merged);
          setFormState({
            username: merged.username,
            handle: merged.handle,
            bio: merged.bio || "",
          });
          setError(null);
        } else {
          setProfile(defaultProfile);
          setFormState({
            username: defaultProfile.username,
            handle: defaultProfile.handle,
            bio: defaultProfile.bio || "",
          });
        }
      } catch (err: any) {
        setError(err?.message || "Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [storageKey]);

  useEffect(() => {
    setFormState({
      username: profile.username,
      handle: profile.handle,
      bio: profile.bio || "",
    });
  }, [profile]);

  const handleMessage = () => onNavigate("messages", { username: profile.username });
  const handleFollow = () => alert("Followed seller (demo)");

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = {
        username: formState.username.trim() || profile.username,
        handle: formState.handle.trim() || profile.handle,
        bio: formState.bio,
      };
      const merged = { ...profile, ...updated };
      localStorage.setItem(storageKey, JSON.stringify(merged));
      setProfile(merged);
      // Also update Firebase auth displayName so the header dropdown shows the new name
      const user = auth.currentUser;
      if (user) {
        await updateAuthProfile(user, { displayName: merged.handle });
        await user.reload();
        window.dispatchEvent(new CustomEvent("bl:displayNameUpdated", { detail: merged.handle }));
      }
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-gray-200">
      <div className="w-full h-56 bg-gradient-to-r from-[#0f172a] via-[#0c162c] to-[#0b1020] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(147,197,253,0.12),transparent_35%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-[#0b1224] border border-[#1f2940] rounded-2xl shadow-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-gray-800"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#111a2d] flex items-center justify-center text-3xl font-bold text-amber-200 ring-4 ring-gray-800">
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                  </div>
                  <p className="text-gray-400 text-sm">{profile.handle}</p>
                  <p className="text-gray-200 text-sm mt-2">
                    {profile.bio || "Add a bio to build trust with buyers."}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-300">
                    {profile.rating !== undefined && profile.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400">★</span>
                        <span className="font-semibold text-white">{profile.rating.toFixed(1)}</span>
                        {profile.ratingCount ? (
                          <span className="text-gray-400">({profile.ratingCount} reviews)</span>
                        ) : null}
                      </div>
                    )}
                    {profile.avgShip ? (
                      <div className="flex items-center gap-1">
                        <span>🚚</span>
                        <span className="text-gray-300">{profile.avgShip}</span>
                      </div>
                    ) : null}
                    {profile.sold ? (
                      <div className="flex items-center gap-1">
                        <span>🛍</span>
                        <span className="text-gray-300">{profile.sold} sold</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    onClick={handleMessage}
                    className="border border-[#26314d] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#111a2d] transition-colors"
                  >
                    Message
                  </button>
                  <button
                    onClick={handleFollow}
                    className="bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-300 transition-colors"
                  >
                    Follow
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/10 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors border border-white/10"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="flex gap-6 text-sm text-gray-300 mt-4 flex-wrap">
                <span>
                  <span className="text-white font-semibold">{profile.following ?? 0}</span> Following
                </span>
                <span>
                  <span className="text-white font-semibold">{profile.followers ?? 0}</span> Followers
                </span>
                {profile.categories && profile.categories.length > 0 && (
                  <span className="text-gray-400">Categories: {profile.categories.join(" · ")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#1f2940] pt-4">
            <div className="flex gap-6">
              <TabButton label="Shop" active={activeTab === "Shop"} onClick={() => setActiveTab("Shop")} />
              <TabButton label="Shows" active={activeTab === "Shows"} onClick={() => setActiveTab("Shows")} />
              <TabButton
                label="Reviews"
                active={activeTab === "Reviews"}
                onClick={() => setActiveTab("Reviews")}
              />
              <TabButton label="Clips" active={activeTab === "Clips"} onClick={() => setActiveTab("Clips")} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === "Shows" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Upcoming Shows ({profile.upcomingShows.length})</h2>
                <button className="text-sm text-amber-300 hover:text-amber-200">View schedule</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {profile.upcomingShows.map((show) => (
                  <ShowTile key={show.id} show={show} seller={profile.username} />
                ))}
              </div>
            </div>
          )}

          {activeTab !== "Shows" && (
            <div className="bg-[#0b1224] border border-[#1f2940] rounded-2xl p-10 text-center text-gray-400">
              Content for {activeTab} is coming soon.
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0b1224] border border-[#1f2940] rounded-2xl shadow-2xl w-full max-w-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Name</label>
                <input
                  className="bg-[#0f182d] border border-[#1f2940] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={formState.handle}
                  onChange={(e) => setFormState((s) => ({ ...s, handle: e.target.value }))}
                  placeholder="Display name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Username</label>
                <input
                  className="bg-[#0f182d] border border-[#1f2940] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={formState.username}
                  onChange={(e) => setFormState((s) => ({ ...s, username: e.target.value }))}
                  placeholder="Username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Bio</label>
                <textarea
                  className="bg-[#0f182d] border border-[#1f2940] rounded-lg px-3 py-2 text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={formState.bio}
                  onChange={(e) => setFormState((s) => ({ ...s, bio: e.target.value }))}
                  placeholder="Tell buyers about your shop and what you sell."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg border border-[#1f2940] text-gray-200 hover:bg-[#0f182d]"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black font-semibold hover:bg-amber-300 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          </div>
        </div>
      )}

      {error && !isEditing && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-sm text-red-400">{error}</div>
      )}
      {loading && <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-sm text-gray-400">Loading…</div>}
    </div>
  );
};

export default UserProfilePage;

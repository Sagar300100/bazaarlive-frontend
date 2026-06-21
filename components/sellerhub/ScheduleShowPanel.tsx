import React, { useState, useEffect } from 'react';
import { LockIcon } from '../Icons';
import { onboardingCategories, subCategories, sellingFormats } from '../../constants/onboardingData';
import type { ShowData } from '../../services/api';

type Section = 'info' | 'media' | 'shipping' | 'content' | 'options' | 'discovery' | 'promote' | 'giveaways';

const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-[#1B3A6B] placeholder:text-[#4A7AB5] focus:outline-none focus:ring-2 focus:ring-[#2B6CB8]/30 disabled:opacity-50 disabled:cursor-not-allowed";
const inputStyle = { border: "1.5px solid rgba(43,108,184,0.25)", background: "rgba(43,108,184,0.03)" };
const labelCls = "block text-sm font-semibold text-[#1B3A6B] mb-1.5";

const sectionCardStyle = {
  background: "rgba(43,108,184,0.03)",
  border: "1.5px solid rgba(43,108,184,0.12)",
  borderRadius: "0.75rem",
  padding: "1.25rem",
};

const NavItem: React.FC<{ label: string; isActive: boolean; onClick: () => void; disabled?: boolean; children?: React.ReactNode }> = ({ label, isActive, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-between items-center"
    style={
      disabled
        ? { color: "#9BB3D0", cursor: "not-allowed" }
        : isActive
        ? { background: "rgba(43,108,184,0.1)", color: "#2B6CB8", border: "1.5px solid rgba(43,108,184,0.2)" }
        : { color: "#4A7AB5" }
    }
    onMouseEnter={e => { if (!disabled && !isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,108,184,0.06)"; }}
    onMouseLeave={e => { if (!disabled && !isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
  >
    <span>{label}</span>
    {children}
  </button>
);

const Toggle: React.FC<{ label: string; description?: string; enabled: boolean; onChange: (e: boolean) => void }> = ({ label, description, enabled, onChange }) => (
  <div>
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-semibold text-[#1B3A6B]">{label}</span>
      <div className="relative flex-shrink-0 ml-4">
        <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
        <div
          className="block w-11 h-6 rounded-full transition-colors"
          style={{ background: enabled ? "#2B6CB8" : "rgba(43,108,184,0.2)" }}
        />
        <div
          className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm"
          style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
    </label>
    {description && <p className="text-xs text-[#4A7AB5] mt-2 pr-14">{description}</p>}
  </div>
);

const MutedWordsInput = () => {
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');

  const addWord = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentWord.trim()) {
      e.preventDefault();
      if (!words.includes(currentWord.trim())) setWords([...words, currentWord.trim()]);
      setCurrentWord('');
    }
  };

  const removeWord = (w: string) => setWords(words.filter(x => x !== w));

  return (
    <div>
      <label className={labelCls}>Muted Words</label>
      <div
        className="w-full flex flex-wrap items-center gap-2 p-2 rounded-xl min-h-[44px]"
        style={{ border: "1.5px solid rgba(43,108,184,0.25)", background: "rgba(43,108,184,0.03)" }}
      >
        {words.map(word => (
          <div
            key={word}
            className="flex items-center gap-1 text-white text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ background: "#2B6CB8" }}
          >
            <span>{word}</span>
            <button onClick={() => removeWord(word)} className="text-white/70 hover:text-white">&times;</button>
          </div>
        ))}
        <input
          type="text"
          value={currentWord}
          onChange={e => setCurrentWord(e.target.value)}
          onKeyDown={addWord}
          placeholder="Add words and press Enter…"
          className="flex-1 bg-transparent focus:outline-none text-sm text-[#1B3A6B] placeholder:text-[#4A7AB5] min-w-[150px]"
        />
      </div>
    </div>
  );
};

interface ScheduleShowPanelProps {
  onBack: () => void;
  onScheduleShow: (show: Omit<ShowData, 'id' | 'sellerRating'>) => void;
  onUpdateShow: (show: ShowData) => void;
  showToEdit: ShowData | null;
}

const ScheduleShowPanel: React.FC<ScheduleShowPanelProps> = ({ onBack, onScheduleShow, onUpdateShow, showToEdit }) => {
  const [activeSection, setActiveSection] = useState<Section>('info');

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '13:50',
    category: '',
    subcategory: '',
    sellingFormat: '',
    brand: '',
    shippedFrom: '',
    tags: ['Antique', 'Vintage'],
    thumbnail: '',
    thumbnailFile: null as File | null,
    videoFile: null as File | null,
    videoPreview: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (showToEdit) {
      setFormData({
        name: showToEdit.name,
        date: showToEdit.date,
        time: showToEdit.time,
        category: showToEdit.category,
        subcategory: showToEdit.subcategory,
        sellingFormat: showToEdit.sellingFormat,
        brand: showToEdit.brand || '',
        shippedFrom: showToEdit.shippedFrom || '',
        tags: showToEdit.tags,
        thumbnail: showToEdit.thumbnail,
        thumbnailFile: null,
        videoFile: null,
        videoPreview: showToEdit.videoPreview || '',
      });
    }
  }, [showToEdit]);

  const [freePickup, setFreePickup] = useState(false);
  const [disablePrebids, setDisablePrebids] = useState(false);
  const [explicitLanguage, setExplicitLanguage] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState<'public' | 'private'>('public');
  const [promoteShow, setPromoteShow] = useState(false);
  const [enableGiveaways, setEnableGiveaways] = useState(false);
  const [promotionBudget, setPromotionBudget] = useState(25);
  const estimatedDuration = 2.0;

  const suggestedTags = ['Antique', 'Vintage', 'Home Decor', 'Glass Decor', 'Holiday', 'Jewelry', 'Kitchen and Dining', 'Art', 'Collectibles', 'Sports Cards'];

  const handleTagClick = (tag: string) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 3)
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
  };

  const removeTag = (tag: string) =>
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (fieldErrors[id]) setFieldErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleFileChange = (id: 'thumbnailFile' | 'videoFile', target: 'thumbnail' | 'videoPreview') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFormData(prev => ({ ...prev, [id]: file, [target]: file ? file.name : prev[target as keyof typeof prev] as any }));
    };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim())        errors.name        = 'Name is required';
    if (!formData.date.trim())        errors.date        = 'Show date is required';
    if (!formData.time.trim())        errors.time        = 'Show time is required';
    if (!formData.category.trim())    errors.category    = 'Category is required';
    if (!formData.subcategory.trim()) errors.subcategory = 'Subcategory is required';

    if (Object.keys(errors).length) { setFieldErrors(errors); setActiveSection('info'); return; }

    const showPayload: any = { ...formData, isLive: false, seller: 'sagsin' };
    if (showToEdit) onUpdateShow({ ...showToEdit, ...showPayload });
    else onScheduleShow(showPayload);
  };

  const errorBorder = (key: string) =>
    fieldErrors[key] ? { border: "1.5px solid #ef4444" } : inputStyle;

  const mediaUploadBox = (icon: React.ReactNode, title: string, subtitle: string, accept: string, onChange: any, fileName?: string | null) => (
    <div
      className="rounded-xl p-5 text-center"
      style={{ border: "2px dashed rgba(43,108,184,0.25)", background: "rgba(43,108,184,0.02)" }}
    >
      <div className="mx-auto h-10 w-10 text-[#4A7AB5] mb-2">{icon}</div>
      <p className="text-sm font-bold text-[#1B3A6B]">{title}</p>
      <p className="text-xs text-[#4A7AB5] mb-3">{subtitle}</p>
      <input type="file" accept={accept} onChange={onChange} className="w-full text-sm text-[#4A7AB5]" />
      {fileName && <p className="text-xs text-[#4A7AB5] mt-1 truncate">{fileName}</p>}
    </div>
  );

  const photoIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 10H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z" />
    </svg>
  );
  const videoIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4zm5 4l6 4-6 4V8z" />
    </svg>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'info':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#1B3A6B] mb-1">Show Information</h2>
              <p className="text-sm text-[#4A7AB5]">
                Go live in the next 7 days and we'll match your first ₹15,000 in sales.{' '}
                <a href="#" className="text-[#2B6CB8] font-semibold hover:underline">Learn more</a>
              </p>
            </div>
            <div>
              <label htmlFor="name" className={labelCls}>Name your show *</label>
              <input type="text" id="name" value={formData.name} onChange={handleChange} className={inputCls} style={errorBorder('name')} />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date" className={labelCls}>Show Date *</label>
                <input type="date" id="date" value={formData.date} onChange={handleChange} className={inputCls} style={errorBorder('date')} />
                {fieldErrors.date && <p className="text-xs text-red-500 mt-1">{fieldErrors.date}</p>}
              </div>
              <div>
                <label htmlFor="time" className={labelCls}>Show Time *</label>
                <input type="time" id="time" value={formData.time} onChange={handleChange} className={inputCls} style={errorBorder('time')} />
                {fieldErrors.time && <p className="text-xs text-red-500 mt-1">{fieldErrors.time}</p>}
              </div>
              <div>
                <label htmlFor="repeats" className={labelCls}>Repeats</label>
                <select id="repeats" className={inputCls} style={inputStyle}><option>Does not repeat</option></select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className={labelCls}>Category *</label>
                <select id="category" value={formData.category} onChange={handleChange} className={inputCls} style={errorBorder('category')}>
                  <option value="">Select a category…</option>
                  {onboardingCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                </select>
                {fieldErrors.category && <p className="text-xs text-red-500 mt-1">{fieldErrors.category}</p>}
              </div>
              <div>
                <label htmlFor="subcategory" className={labelCls}>Subcategory *</label>
                <select id="subcategory" value={formData.subcategory} onChange={handleChange} disabled={!formData.category} className={inputCls} style={errorBorder('subcategory')}>
                  <option value="">Select a subcategory…</option>
                  {(subCategories[formData.category] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
                {fieldErrors.subcategory && <p className="text-xs text-red-500 mt-1">{fieldErrors.subcategory}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="sellingFormat" className={labelCls}>Primary Selling Format *</label>
              <select id="sellingFormat" value={formData.sellingFormat} onChange={handleChange} className={inputCls} style={inputStyle}>
                <option>Select a format…</option>
                {sellingFormats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand" className={labelCls}>Brand (optional)</label>
                <input type="text" id="brand" value={formData.brand} onChange={handleChange} className={inputCls} style={inputStyle} placeholder="e.g. Nike" />
              </div>
              <div>
                <label htmlFor="shippedFrom" className={labelCls}>Shipped From (optional)</label>
                <input type="text" id="shippedFrom" value={formData.shippedFrom} onChange={handleChange} className={inputCls} style={inputStyle} placeholder="e.g. Mumbai" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags <span className="text-[#4A7AB5] font-normal">(Select up to 3)</span></label>
              <div
                className="flex flex-wrap items-center gap-2 p-2 rounded-xl min-h-[44px]"
                style={{ border: "1.5px solid rgba(43,108,184,0.25)", background: "rgba(43,108,184,0.03)" }}
              >
                {formData.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-1 text-white text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "#2B6CB8" }}>
                    <span>{tag}</span>
                    <button onClick={() => removeTag(tag)} className="text-white/70 hover:text-white">&times;</button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-[#4A7AB5] font-semibold self-center">Suggested Tags:</span>
                {suggestedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    disabled={formData.tags.includes(tag) || formData.tags.length >= 3}
                    className="text-xs px-3 py-1 rounded-full font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: formData.tags.includes(tag) ? "rgba(43,108,184,0.15)" : "rgba(43,108,184,0.07)",
                      color: "#2B6CB8",
                      border: "1px solid rgba(43,108,184,0.2)",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1B3A6B]">Media (optional)</h3>
              <p className="text-xs text-[#4A7AB5]">Add a thumbnail and a short video preview to maximise your show's exposure.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaUploadBox(photoIcon, "Add a Photo", "JPG, PNG up to 10MB", "image/*", handleFileChange('thumbnailFile','thumbnail'), formData.thumbnailFile?.name)}
                {mediaUploadBox(videoIcon, "Add a Video", "Upload a short preview", "video/*", handleFileChange('videoFile','videoPreview'), formData.videoFile?.name)}
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Media</h2>
            <p className="text-sm text-[#4A7AB5]">Add a thumbnail and video preview to maximise your show's exposure on Any &amp; All.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mediaUploadBox(photoIcon, "Add a Photo", "JPG, PNG up to 10MB", "image/*", handleFileChange('thumbnailFile','thumbnail'), formData.thumbnailFile?.name)}
              {mediaUploadBox(videoIcon, "Add a Video", "Upload a short preview", "video/*", handleFileChange('videoFile','videoPreview'), formData.videoFile?.name)}
            </div>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Shipping Settings</h2>
            <p className="text-sm text-[#4A7AB5]">Adjust defaults for domestic shipping, shipping costs, and local pickup for this show.</p>
            <div style={sectionCardStyle} className="space-y-4">
              <Toggle label="Free Pickup" enabled={freePickup} onChange={setFreePickup} />
              <hr style={{ borderColor: "rgba(43,108,184,0.12)" }} />
              <div>
                <label className={labelCls}>Royal Mail Collections and Dropoffs</label>
                <select className={inputCls} style={inputStyle}><option>Please select your preferred collection and dropoff options.</option></select>
              </div>
            </div>
          </div>
        );

      case 'options':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Show Options</h2>
            <div style={sectionCardStyle}>
              <Toggle label="Disable prebids" enabled={disablePrebids} onChange={setDisablePrebids}
                description="Turn this on to disable pre-bids in your show. When enabled, no buyers will be allowed to pre-bid in this show." />
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Content Settings</h2>
            <div style={sectionCardStyle} className="space-y-5">
              <div>
                <label className={labelCls}>Primary Language *</label>
                <select className={inputCls} style={inputStyle} defaultValue="English">
                  <option>English</option>
                  <option>Hindi</option>
                </select>
              </div>
              <Toggle label="Explicit Language" enabled={explicitLanguage} onChange={setExplicitLanguage} />
              <MutedWordsInput />
            </div>
          </div>
        );

      case 'discovery':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Show Discovery</h2>
            <div style={sectionCardStyle} className="space-y-2">
              {(['public', 'private'] as const).map(opt => (
                <label
                  key={opt}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                  style={{ background: showDiscovery === opt ? "rgba(43,108,184,0.08)" : "transparent" }}
                  onMouseEnter={e => { if (showDiscovery !== opt) (e.currentTarget as HTMLLabelElement).style.background = "rgba(43,108,184,0.04)"; }}
                  onMouseLeave={e => { if (showDiscovery !== opt) (e.currentTarget as HTMLLabelElement).style.background = "transparent"; }}
                >
                  <input
                    type="radio"
                    name="discovery"
                    value={opt}
                    checked={showDiscovery === opt}
                    onChange={() => setShowDiscovery(opt)}
                    className="mt-1"
                    style={{ accentColor: "#2B6CB8" }}
                  />
                  <div>
                    <span className="font-bold text-[#1B3A6B] text-sm capitalize">{opt}</span>
                    <p className="text-xs text-[#4A7AB5] mt-0.5">
                      {opt === 'public' ? 'Discoverable by everyone.' : 'Only discoverable through sharing.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 'promote':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Promote Show</h2>
            <div style={sectionCardStyle}>
              <Toggle label="Promote Show" enabled={promoteShow} onChange={setPromoteShow}
                description="Reach a wider audience on Any &amp; All by promoting your entire show." />
            </div>
            {promoteShow && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#1B3A6B]">₹{promotionBudget.toFixed(2)}/hr</p>
                  <input
                    type="range" min="20" max="100" step="1"
                    value={promotionBudget}
                    onChange={e => setPromotionBudget(parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-4"
                    style={{ accentColor: "#2B6CB8" }}
                  />
                </div>
                <div style={sectionCardStyle}>
                  <p className="font-bold text-[#1B3A6B] text-sm">
                    For best results, we suggest setting your budget in the{' '}
                    <span className="text-green-600">₹20–₹30 per hour</span> range.
                  </p>
                </div>
                <div style={sectionCardStyle} className="space-y-3 text-sm">
                  <h3 className="font-bold text-[#1B3A6B]">Promotional Summary</h3>
                  <div className="flex justify-between text-[#4A7AB5]"><span>Duration</span><span className="font-semibold text-[#1B3A6B]">Full Show</span></div>
                  <div className="flex justify-between text-[#4A7AB5]"><span>Est. Impressions</span><span className="font-semibold text-[#1B3A6B]">{250 + (promotionBudget - 20) * 8}–{417 + (promotionBudget - 20) * 10}/hr</span></div>
                  <hr style={{ borderColor: "rgba(43,108,184,0.12)" }} />
                  <h4 className="font-bold text-[#1B3A6B]">Budget Details</h4>
                  <div className="flex justify-between text-[#4A7AB5]"><span>Hourly Budget</span><span className="font-semibold text-[#1B3A6B]">₹{promotionBudget.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[#4A7AB5]"><span>Est. Duration</span><span className="font-semibold text-[#1B3A6B]">× {estimatedDuration.toFixed(1)} hrs</span></div>
                  <hr style={{ borderColor: "rgba(43,108,184,0.12)" }} />
                  <div className="flex justify-between font-bold text-[#1B3A6B]"><span>Estimated Total Spend</span><span>₹{(promotionBudget * estimatedDuration).toFixed(2)}</span></div>
                </div>
              </div>
            )}
          </div>
        );

      case 'giveaways':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Giveaways</h2>
            <div style={sectionCardStyle}>
              <Toggle label="Enable Giveaways" enabled={enableGiveaways} onChange={setEnableGiveaways}
                description="Run giveaways during your stream to engage viewers and grow your audience. You can configure giveaway details from the main Seller Hub." />
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">{showToEdit ? 'Edit Show' : 'Schedule Show'}</h1>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="text-[#4A7AB5] hover:text-[#1B3A6B] hover:bg-blue-50 px-4 py-2 rounded-xl font-semibold transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="text-white px-5 py-2 rounded-xl font-bold transition-colors text-sm"
            style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
          >
            {showToEdit ? 'Update Show' : 'Schedule Show'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            <NavItem label="Show Information"  isActive={activeSection === 'info'}      onClick={() => setActiveSection('info')} />
            <NavItem label="Media"             isActive={activeSection === 'media'}     onClick={() => setActiveSection('media')} />
            <NavItem label="Shipping Settings" isActive={activeSection === 'shipping'}  onClick={() => setActiveSection('shipping')} />
            <NavItem label="Content Settings"  isActive={activeSection === 'content'}   onClick={() => setActiveSection('content')} />
            <NavItem label="Show Options"      isActive={activeSection === 'options'}   onClick={() => setActiveSection('options')} />
            <NavItem label="Show Discovery"    isActive={activeSection === 'discovery'} onClick={() => setActiveSection('discovery')} />
            <NavItem label="Giveaways"         isActive={false} onClick={() => {}} disabled>
              <LockIcon />
            </NavItem>
            <NavItem label="Promote Show"      isActive={activeSection === 'promote'}   onClick={() => setActiveSection('promote')} />
          </nav>
        </aside>

        {/* Main content */}
        <main
          className="flex-1 rounded-2xl p-6"
          style={{ background: "white", border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 2px 12px rgba(43,108,184,0.07)" }}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ScheduleShowPanel;

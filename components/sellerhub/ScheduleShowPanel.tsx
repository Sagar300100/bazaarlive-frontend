import React, { useState, useEffect } from 'react';
import { LockIcon } from '../Icons';
import { onboardingCategories, subCategories, sellingFormats } from '../../constants/onboardingData';
import type { ShowData } from '../../services/api';

type Section = 'info' | 'media' | 'shipping' | 'content' | 'options' | 'discovery' | 'promote' | 'giveaways';

const NavItem: React.FC<{ label: string; isActive: boolean; onClick: () => void; disabled?: boolean; children?: React.ReactNode; }> = ({ label, isActive, onClick, disabled, children }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center ${
            disabled 
            ? 'text-gray-600 cursor-not-allowed' 
            : isActive 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
        <span>{label}</span>
        {children}
    </button>
);

const Toggle: React.FC<{label: string, description?: string, enabled: boolean, onChange: (e:boolean) => void}> = ({label, description, enabled, onChange}) => (
    <div>
        <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-orange-600' : 'bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
            </div>
        </label>
        {description && <p className="text-xs text-gray-400 mt-2 pr-12">{description}</p>}
    </div>
);

const MutedWordsInput = () => {
    const [words, setWords] = useState<string[]>([]);
    const [currentWord, setCurrentWord] = useState('');

    const addWord = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentWord.trim()) {
            e.preventDefault();
            if (!words.includes(currentWord.trim())) {
                setWords([...words, currentWord.trim()]);
            }
            setCurrentWord('');
        }
    };
    
    const removeWord = (wordToRemove: string) => {
        setWords(words.filter(w => w !== wordToRemove));
    };
    
    return (
        <div>
            <label htmlFor="mutedWords" className="block text-sm font-medium text-gray-300 mb-2">Muted Words</label>
            <div className="w-full input-field flex flex-wrap items-center gap-2 p-2">
                {words.map(word => (
                    <div key={word} className="flex items-center gap-1 bg-gray-600 text-white text-sm font-semibold px-2 py-1 rounded">
                        <span>{word}</span>
                        <button onClick={() => removeWord(word)} className="text-gray-400 hover:text-white">&times;</button>
                    </div>
                ))}
                 <input
                    type="text"
                    id="mutedWords"
                    value={currentWord}
                    onChange={e => setCurrentWord(e.target.value)}
                    onKeyDown={addWord}
                    placeholder="Add words and press Enter..."
                    className="flex-1 bg-transparent focus:outline-none min-w-[150px]"
                />
            </div>
        </div>
    )
}

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
        if (!formData.tags.includes(tag) && formData.tags.length < 3) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (fieldErrors[id]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    const handleFileChange = (id: 'thumbnailFile' | 'videoFile', target: 'thumbnail' | 'videoPreview') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            [id]: file,
            [target]: file ? file.name : prev[target as keyof typeof prev] as any,
        }));
    };

    const handleSubmit = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.date.trim()) errors.date = 'Show date is required';
        if (!formData.time.trim()) errors.time = 'Show time is required';
        if (!formData.category.trim()) errors.category = 'Category is required';
        if (!formData.subcategory.trim()) errors.subcategory = 'Subcategory is required';

        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            setActiveSection('info');
            return;
        }

        const showPayload: any = {
            ...formData,
            isLive: false,
            seller: 'sagsin' // Hardcoded for now
        };

        if (showToEdit) {
            onUpdateShow({ ...showToEdit, ...showPayload });
        } else {
            onScheduleShow(showPayload);
        }
    };

    const renderContent = () => {
        const errorClass = (key: string) => fieldErrors[key] ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : '';

        switch(activeSection) {
            case 'info':
                return (
                     <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white mb-1">Show Information</h2>
                        <p className="text-sm text-gray-400">Go live in the next 7 days and we'll match your first ₹15,000 in sales. <a href="#" className="text-orange-400 hover:underline">Learn more</a></p>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Name your show *</label>
                            <input type="text" id="name" value={formData.name} onChange={handleChange} className={`w-full input-field${errorClass('name')}`} />
                            {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">Show Date *</label>
                                <input type="date" id="date" value={formData.date} onChange={handleChange} className={`w-full input-field${errorClass('date')}`} />
                                {fieldErrors.date && <p className="text-xs text-red-400 mt-1">{fieldErrors.date}</p>}
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-2">Show Time *</label>
                                <input type="time" id="time" value={formData.time} onChange={handleChange} className={`w-full input-field${errorClass('time')}`} />
                                {fieldErrors.time && <p className="text-xs text-red-400 mt-1">{fieldErrors.time}</p>}
                            </div>
                            <div>
                                <label htmlFor="repeats" className="block text-sm font-medium text-gray-300 mb-2">Repeats</label>
                                <select id="repeats" className="w-full input-field"><option>Does not repeat</option></select>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                                <select id="category" value={formData.category} onChange={handleChange} className={`w-full input-field${errorClass('category')}`}>
                                    <option value="">Select a category...</option>
                                    {onboardingCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                                </select>
                                {fieldErrors.category && <p className="text-xs text-red-400 mt-1">{fieldErrors.category}</p>}
                            </div>
                            <div>
                                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-300 mb-2">Subcategory *</label>
                                <select id="subcategory" value={formData.subcategory} onChange={handleChange} disabled={!formData.category} className={`w-full input-field disabled:bg-gray-800 disabled:cursor-not-allowed${errorClass('subcategory')}`}>
                                    <option value="">Select a subcategory...</option>
                                    {(subCategories[formData.category] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                                {fieldErrors.subcategory && <p className="text-xs text-red-400 mt-1">{fieldErrors.subcategory}</p>}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="sellingFormat" className="block text-sm font-medium text-gray-300 mb-2">Primary Selling Format *</label>
                            <select id="sellingFormat" value={formData.sellingFormat} onChange={handleChange} className="w-full input-field">
                                <option>Select a format...</option>
                                {sellingFormats.map(format => <option key={format} value={format}>{format}</option>)}
                            </select>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-300 mb-2">Brand (optional)</label>
                                <input type="text" id="brand" value={formData.brand} onChange={handleChange} className="w-full input-field" placeholder="e.g., Nike"/>
                            </div>
                            <div>
                                <label htmlFor="shippedFrom" className="block text-sm font-medium text-gray-300 mb-2">Shipped From (optional)</label>
                                <input type="text" id="shippedFrom" value={formData.shippedFrom} onChange={handleChange} className="w-full input-field" placeholder="e.g., Mumbai"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tags <span className="text-gray-400 font-normal">(Select up to 3)</span></label>
                            <div className="w-full input-field flex flex-wrap items-center gap-2 p-2 min-h-[44px]">
                                {formData.tags.map(tag => (
                                    <div key={tag} className="flex items-center gap-1 bg-gray-600 text-white text-sm font-semibold px-2 py-1 rounded">
                                        <span>{tag}</span>
                                        <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-white">&times;</button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="text-sm text-gray-400 self-center">Suggested Tags:</span>
                                {suggestedTags.map(tag => (
                                    <button key={tag} onClick={() => handleTagClick(tag)} className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={formData.tags.includes(tag) || formData.tags.length >= 3}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-md font-semibold text-white">Media (optional)</h3>
                            <p className="text-sm text-gray-400">Add a thumbnail and a short video preview to maximize your show's exposure.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                                    <div className="mx-auto h-10 w-10 text-gray-400 mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 10H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <p className="text-sm font-semibold text-white">Add a Photo</p>
                                    <p className="text-xs text-gray-500 mb-2">JPG, PNG up to 10MB</p>
                                    <input type="file" accept="image/*" onChange={handleFileChange('thumbnailFile','thumbnail')} className="w-full text-sm text-gray-300" />
                                    {formData.thumbnailFile && <p className="text-xs text-gray-400 mt-1 truncate">{formData.thumbnailFile.name}</p>}
                                </div>
                                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                                    <div className="mx-auto h-10 w-10 text-gray-400 mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4zm5 4l6 4-6 4V8z" /></svg>
                                    </div>
                                    <p className="text-sm font-semibold text-white">Add a Video</p>
                                    <p className="text-xs text-gray-500 mb-2">Upload a short preview</p>
                                    <input type="file" accept="video/*" onChange={handleFileChange('videoFile','videoPreview')} className="w-full text-sm text-gray-300" />
                                    {formData.videoFile && <p className="text-xs text-gray-400 mt-1 truncate">{formData.videoFile.name}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'media':
                 return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-white">Media</h2>
                        <p className="text-sm text-gray-400 mt-1 mb-4">Add a thumbnail and video preview to maximize your show's exposure on BazaarLive.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                                <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 10H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-white">Add a Photo</p>
                                <p className="text-xs text-gray-500 mb-3">JPG, PNG up to 10MB</p>
                                <input type="file" accept="image/*" onChange={handleFileChange('thumbnailFile','thumbnail')} className="w-full text-sm text-gray-300" />
                                {formData.thumbnailFile && <p className="text-xs text-gray-400 mt-1 truncate">{formData.thumbnailFile.name}</p>}
                            </div>
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                                <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4zm5 4l6 4-6 4V8z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-white">Add a Video</p>
                                <p className="text-xs text-gray-500 mb-3">Upload a short preview</p>
                                <input type="file" accept="video/*" onChange={handleFileChange('videoFile','videoPreview')} className="w-full text-sm text-gray-300" />
                                {formData.videoFile && <p className="text-xs text-gray-400 mt-1 truncate">{formData.videoFile.name}</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'shipping':
                 return (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Shipping Settings</h2>
                        <p className="text-sm text-gray-400 -mt-5">Adjust your defaults for domestic shipping, shipping costs, and local pickup for this show.</p>
                        <div className="bg-gray-800 p-6 rounded-lg space-y-4 border border-gray-700">
                            <Toggle label="Free Pickup" enabled={freePickup} onChange={setFreePickup} />
                            <hr className="border-gray-700" />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Royal Mail Collections and Dropoffs</label>
                                <select className="w-full input-field"><option>Please select your preferred collection and dropoff options.</option></select>
                            </div>
                        </div>
                    </div>
                );
            case 'options':
                return (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Show Options</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                             <Toggle label="Disable prebids" enabled={disablePrebids} onChange={setDisablePrebids} description="Turn this on to disable pre-bids in your show. When enabled, no buyers will be allowed to pre-bid in this show." />
                        </div>
                    </div>
                );
            case 'content':
                return (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Content Settings</h2>
                        <div className="bg-gray-800 p-6 rounded-lg space-y-6 border border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Primary Language *</label>
                                <select className="w-full input-field" defaultValue="English"><option>English</option><option>Hindi</option></select>
                            </div>
                            <Toggle label="Explicit Language" enabled={explicitLanguage} onChange={setExplicitLanguage} />
                            <MutedWordsInput />
                        </div>
                    </div>
                );
            case 'discovery':
                return (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Show Discovery</h2>
                        <div className="bg-gray-800 p-6 rounded-lg space-y-4 border border-gray-700">
                            <label className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                <input type="radio" name="discovery" value="public" checked={showDiscovery === 'public'} onChange={() => setShowDiscovery('public')} className="form-radio bg-gray-700 text-orange-600 mt-1" />
                                <div>
                                    <span className="font-medium text-white">Public</span>
                                    <p className="text-xs text-gray-400">Discoverable by everyone.</p>
                                </div>
                            </label>
                             <label className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                <input type="radio" name="discovery" value="private" checked={showDiscovery === 'private'} onChange={() => setShowDiscovery('private')} className="form-radio bg-gray-700 text-orange-600 mt-1" />
                                <div>
                                    <span className="font-medium text-white">Private</span>
                                    <p className="text-xs text-gray-400">Only discoverable through sharing.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                );
            case 'promote':
                return (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Promote Show</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                             <Toggle label="Promote Show" enabled={promoteShow} onChange={setPromoteShow} description="Reach a wider audience on BazaarLive by promoting your entire show." />
                        </div>
                         {promoteShow && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-white">₹{promotionBudget.toFixed(2)}/hr</p>
                                    <input 
                                        type="range"
                                        min="20"
                                        max="100"
                                        step="1"
                                        value={promotionBudget}
                                        onChange={e => setPromotionBudget(parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-4"
                                    />
                                </div>
                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                    <p className="font-semibold text-white mb-2">For best results, we suggest you set your budget in the <span className="text-green-400">₹20-₹30 per hour</span> range.</p>
                                </div>
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-sm space-y-3">
                                    <h3 className="font-bold text-white mb-2">Promotional Summary</h3>
                                    <div className="flex justify-between text-gray-300"><span>Duration</span> <span>Full Show</span></div>
                                    <div className="flex justify-between text-gray-300"><span>Est. Impressions</span> <span>{250 + (promotionBudget - 20) * 8} - {417 + (promotionBudget - 20) * 10}/hr</span></div>
                                    <hr className="border-gray-700" />
                                    <h4 className="font-semibold text-white pt-2">Budget Details</h4>
                                    <div className="flex justify-between text-gray-300"><span>Hourly Budget</span> <span>₹{promotionBudget.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-gray-300"><span>Est. Duration</span> <span>x {estimatedDuration.toFixed(1)} hrs</span></div>
                                    <hr className="border-gray-700" />
                                     <div className="flex justify-between text-white font-bold pt-2"><span>Estimated Total Spend</span> <span>₹{(promotionBudget * estimatedDuration).toFixed(2)}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'giveaways':
                return (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Giveaways</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <Toggle 
                                label="Enable Giveaways" 
                                enabled={enableGiveaways} 
                                onChange={setEnableGiveaways} 
                                description="Run giveaways during your stream to engage viewers and grow your audience. You can configure giveaway details from the main Seller Hub." 
                            />
                        </div>
                    </div>
                );
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{showToEdit ? 'Edit Show' : 'Schedule Show'}</h1>
                <div>
                     <button onClick={onBack} className="text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors">Cancel</button>
                     <button onClick={handleSubmit} className="ml-4 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                        {showToEdit ? 'Update Show' : 'Schedule Show'}
                     </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <nav className="space-y-1">
                        <NavItem label="Show Information" isActive={activeSection === 'info'} onClick={() => setActiveSection('info')} />
                        <NavItem label="Media" isActive={activeSection === 'media'} onClick={() => setActiveSection('media')} />
                        <NavItem label="Shipping Settings" isActive={activeSection === 'shipping'} onClick={() => setActiveSection('shipping')} />
                        <NavItem label="Content Settings" isActive={activeSection === 'content'} onClick={() => setActiveSection('content')} />
                        <NavItem label="Show Options" isActive={activeSection === 'options'} onClick={() => setActiveSection('options')} />
                        <NavItem label="Show Discovery" isActive={activeSection === 'discovery'} onClick={() => setActiveSection('discovery')} />
                        <NavItem label="Giveaways" isActive={false} onClick={() => {}} disabled>
                            <LockIcon />
                        </NavItem>
                        <NavItem label="Promote Show" isActive={activeSection === 'promote'} onClick={() => setActiveSection('promote')} />
                    </nav>
                </aside>

                <main className="flex-1 bg-gray-900 p-8 rounded-lg border border-gray-700">
                    {renderContent()}
                </main>
            </div>
            <style>{`.input-field { background-color: #1F2937; border: 1px solid #4B5563; border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; -webkit-appearance: none; } .input-field:focus { outline: none; box-shadow: 0 0 0 2px #F97316; border-color: #F97316 } .form-radio { border-color: #4B5563 } .form-radio:checked { background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e"); } input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: #fff; border-radius: 50%; cursor: pointer; border: 4px solid #F97316 } input[type="range"]::-moz-range-thumb { width: 20px; height: 20px; background: #fff; border-radius: 50%; cursor: pointer; border: 4px solid #F97316 }`}</style>
        </div>
    );
};

export default ScheduleShowPanel;

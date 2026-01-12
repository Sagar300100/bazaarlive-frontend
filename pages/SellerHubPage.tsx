import React, { useState, useEffect } from 'react';
import { HomeIcon, InventoryIcon, OffersIcon, ShowsIcon, MarketingIcon, ShipmentsIcon, ReferralsIcon, FinancesIcon, SupportChatIcon, SellerResourcesIcon, SettingsIcon, ChevronRightIcon, MembershipIcon, TicketIcon, AnalyticsIcon } from '../components/Icons';
import HomePanel from '../components/sellerhub/HomePanel';
import ShowsPanel from '../components/sellerhub/ShowsPanel';
import ScheduleShowPanel from '../components/sellerhub/ScheduleShowPanel';
import FinancesPanel from '../components/sellerhub/FinancesPanel';
import CouponsPanel from '../components/sellerhub/marketing/CouponsPanel';
import PromoteToolsPanel from '../components/sellerhub/marketing/PromoteToolsPanel';
import MembershipPanel from '../components/sellerhub/MembershipPanel';
import GiveawaysPanel from '../components/sellerhub/GiveawaysPanel';
import AnalyticsPanel from '../components/sellerhub/AnalyticsPanel';
import InventoryPanel from '../components/sellerhub/InventoryPanel';
import ReferralsPanel from '../components/sellerhub/ReferralsPanel';
import CreateProductPage from '../components/sellerhub/CreateProductPage';
import type { ShowData } from '../services/api';

type SellerHubPageType = 
  'home' | 'inventory' | 'offers' | 
  'shows' | 'shows_tools' | 'schedule_show' | 'orders' |
  'marketing' | 'marketing_promote' | 'marketing_coupons' |
  'shipments' | 'referrals' | 'finances' | 'membership' | 'giveaways' | 'analytics' |
  'settings' | 'support' | 'resources' | 'create_product';

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors group ${isActive ? 'bg-[#ff6f3c]/20 text-[#ff6f3c]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

const ExpandableSidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  children: React.ReactNode;
}> = ({ icon, label, isActive, children }) => {
  const [isOpen, setIsOpen] = useState(isActive);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between gap-4 px-3 py-2.5 rounded-md text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group">
        <div className="flex items-center gap-4">
          {icon}
          <span>{label}</span>
        </div>
        <ChevronRightIcon />
      </button>
      {isOpen && <div className="pl-6 pt-1 space-y-1 border-l border-gray-700 ml-5">{children}</div>}
    </div>
  );
};

interface SellerHubPageProps {
  onNavigate: (page: string) => void;
  onOpenShow: (show: ShowData) => void;
  showToEdit: ShowData | null;
  scheduledShows: ShowData[];
  pastShows: ShowData[];
  onScheduleShow: (show: Omit<ShowData, 'id' | 'sellerRating'>) => void;
  onUpdateShow: (show: ShowData) => void;
  onCancelShow: (id: number | string) => void; // ← updated to accept string ids
  initialPage?: string;
  initialShowsTab?: 'upcoming' | 'past';
}

const SellerHubPage: React.FC<SellerHubPageProps> = ({ 
  onNavigate, onOpenShow, showToEdit,
  scheduledShows, pastShows, onScheduleShow, onUpdateShow, onCancelShow,
  initialPage = 'home', initialShowsTab = 'upcoming'
}) => {
  const getInitialPage = () => {
    if (showToEdit) return 'schedule_show';
    return initialPage as SellerHubPageType;
  };

  const [activePage, setActivePage] = useState<SellerHubPageType>(getInitialPage());
  const [editingShow, setEditingShow] = useState<ShowData | null>(showToEdit);
  const sampleOrders = [
    { orderId: 'ORD-1001', date: '2025-12-01', customer: 'Ravi Kumar', items: 'vr (1)', channel: 'Live', price: '₹12', status: 'Paid', earnings: 'Released' },
    { orderId: 'ORD-1002', date: '2025-12-01', customer: 'Sneha Patel', items: 'Headphones (1)', channel: 'Marketplace', price: '₹899', status: 'Pending', earnings: 'On hold' },
  ];

  const sampleShipments = [
    { recipient: 'Ravi Kumar', orderDate: '2025-12-01', items: 'vr (1)', value: '₹12', weight: '0.5 kg', dimensions: '20 x 15 x 10 cm', hazmat: 'No', status: 'Label ready', tracking: '—' },
    { recipient: 'Sneha Patel', orderDate: '2025-12-01', items: 'Headphones (1)', value: '₹899', weight: '1.0 kg', dimensions: '25 x 20 x 12 cm', hazmat: 'No', status: 'Awaiting pickup', tracking: 'SR-TRK-1234' },
  ];

  const handleScheduleShowInternal = (newShow: Omit<ShowData, 'id' | 'sellerRating'>) => {
    onScheduleShow(newShow);
    setActivePage('shows');
  };
  
  const handleUpdateShowInternal = (updatedShow: ShowData) => {
    onUpdateShow(updatedShow);
    setEditingShow(null);
    setActivePage('shows');
  };

  const handleEditShow = (show: ShowData) => {
    setEditingShow(show);
    setActivePage('schedule_show');
  };
  
  const handleNavigateToSchedule = () => {
    setEditingShow(null);
    setActivePage('schedule_show');
  }

  const renderContent = () => {
    switch (activePage) {
      case 'home': return <HomePanel onScheduleShow={handleNavigateToSchedule} />;
      case 'inventory': return <InventoryPanel shows={scheduledShows} onCreateProduct={() => setActivePage('create_product')} />;
      case 'create_product': return (
        <CreateProductPage
          shows={scheduledShows}
          onCancel={() => setActivePage('inventory')}
          onSaved={() => setActivePage('inventory')}
        />
      );
      case 'shows': return (
        <ShowsPanel
          shows={scheduledShows}
          pastShows={pastShows}
          onScheduleShow={handleNavigateToSchedule}
          onEditShow={handleEditShow}
          onCancelShow={onCancelShow}
          onOpenShow={onOpenShow}
          initialTab={initialShowsTab}
        />
      );
      case 'schedule_show': return (
        <ScheduleShowPanel
          onScheduleShow={handleScheduleShowInternal}
          onUpdateShow={handleUpdateShowInternal}
          showToEdit={editingShow}
          onBack={() => setActivePage('shows')}
        />
      );
      case 'finances': return <FinancesPanel />;
      case 'membership': return <MembershipPanel />;
      case 'giveaways': return <GiveawaysPanel />;
      case 'analytics': return <AnalyticsPanel />;
      case 'marketing_coupons': return <CouponsPanel />;
      case 'marketing_promote': return <PromoteToolsPanel />;
      case 'orders':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Orders</h2>
              <p className="text-sm text-gray-400">Recent sales from live shows and marketplace.</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-9 text-xs uppercase tracking-wide text-gray-400 px-4 py-3 bg-gray-800">
                <span>Order</span><span>Date</span><span>Customer</span><span>Items</span><span>Sales Channel</span><span>Price</span><span>Order Status</span><span>Earnings Status</span><span>Actions</span>
              </div>
              <div className="divide-y divide-gray-800">
                {sampleOrders.map(order => (
                  <div key={order.orderId} className="grid grid-cols-9 px-4 py-3 text-sm text-gray-100 items-center">
                    <span className="font-semibold">{order.orderId}</span>
                    <span>{order.date}</span>
                    <span>{order.customer}</span>
                    <span>{order.items}</span>
                    <span>{order.channel}</span>
                    <span>{order.price}</span>
                    <span>{order.status}</span>
                    <span>{order.earnings}</span>
                    <div className="flex gap-2">
                      <button className="text-orange-400 hover:underline text-xs">View</button>
                      <button className="text-gray-300 hover:underline text-xs">Refund</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      );
      case 'shipments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Shipments</h2>
              <p className="text-sm text-gray-400">Create labels and track fulfillment.</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-10 text-xs uppercase tracking-wide text-gray-400 px-4 py-3 bg-gray-800">
                <span>Recipient</span><span>Order Date</span><span>Items</span><span>Value</span><span>Weight</span><span>Dimensions</span><span>Hazmat</span><span>Status</span><span>Tracking</span><span>Actions</span>
              </div>
              <div className="divide-y divide-gray-800">
                {sampleShipments.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-10 px-4 py-3 text-sm text-gray-100 items-center">
                    <span>{s.recipient}</span>
                    <span>{s.orderDate}</span>
                    <span>{s.items}</span>
                    <span>{s.value}</span>
                    <span>{s.weight}</span>
                    <span>{s.dimensions}</span>
                    <span>{s.hazmat}</span>
                    <span>{s.status}</span>
                    <span>{s.tracking}</span>
                    <div className="flex gap-2">
                      <button className="text-orange-400 hover:underline text-xs">Print Label</button>
                      <button className="text-gray-300 hover:underline text-xs">Tracking</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-900 border border-gray-700 rounded-lg p-4">
              <p className="font-semibold text-white mb-1">Shiprocket integration</p>
              <p>Yes—you can use Shiprocket. Wire the “Print Label” action to create a shipment via Shiprocket&apos;s API (sandbox keys), then store the label URL and tracking ID to show here.</p>
            </div>
          </div>
        );
      case 'referrals':
        return <ReferralsPanel />;
      default: return <div className="p-8 text-gray-400">Content for {activePage}</div>;
    }
  };

  return (
    <div className="seller-hub flex min-h-screen text-white">
      {/* Sidebar */}
      <aside className="w-64 glass p-4 border-r border-[#ffffff14] flex flex-col fade-rise hover-glow">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white">B</div>
          <h2 className="font-bold text-lg text-white">Seller Hub</h2>
        </div>

        <div className="mb-4">
          <button 
            onClick={() => onNavigate('home')}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-md bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="font-semibold">Switch to Buying</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <SidebarItem icon={<HomeIcon />} label="Home" isActive={activePage === 'home'} onClick={() => setActivePage('home')} />
          <SidebarItem icon={<InventoryIcon />} label="Inventory" isActive={activePage === 'inventory'} onClick={() => setActivePage('inventory')} />
          <SidebarItem icon={<OffersIcon />} label="Offers" isActive={activePage === 'offers'} onClick={() => setActivePage('offers')} />
          
          <ExpandableSidebarItem icon={<ShowsIcon />} label="Shows" isActive={['shows', 'schedule_show', 'shows_tools', 'orders'].includes(activePage)}>
            <SidebarItem icon={<div/>} label="Shows" isActive={activePage === 'shows'} onClick={() => setActivePage('shows')} />
            <SidebarItem icon={<div/>} label="Show tools" isActive={activePage === 'shows_tools'} onClick={() => setActivePage('shows_tools')} />
            <SidebarItem icon={<div/>} label="Orders" isActive={activePage === 'orders'} onClick={() => setActivePage('orders')} />
          </ExpandableSidebarItem>

          <ExpandableSidebarItem icon={<MarketingIcon />} label="Marketing" isActive={['marketing_promote', 'marketing_coupons'].includes(activePage)}>
            <SidebarItem icon={<div/>} label="Promote Tools" isActive={activePage === 'marketing_promote'} onClick={() => setActivePage('marketing_promote')} />
            <SidebarItem icon={<div/>} label="Coupons" isActive={activePage === 'marketing_coupons'} onClick={() => setActivePage('marketing_coupons')} />
          </ExpandableSidebarItem>
          
          <SidebarItem icon={<ShipmentsIcon />} label="Shipments" isActive={activePage === 'shipments'} onClick={() => setActivePage('shipments')} />
          <SidebarItem icon={<ReferralsIcon />} label="Referrals" isActive={activePage === 'referrals'} onClick={() => setActivePage('referrals')} />
          <SidebarItem icon={<TicketIcon />} label="Giveaways" isActive={activePage === 'giveaways'} onClick={() => setActivePage('giveaways')} />
          <SidebarItem icon={<AnalyticsIcon />} label="Analytics" isActive={activePage === 'analytics'} onClick={() => setActivePage('analytics')} />
          <SidebarItem icon={<FinancesIcon />} label="Finances" isActive={activePage === 'finances'} onClick={() => setActivePage('finances')} />
          <SidebarItem icon={<MembershipIcon />} label="Membership" isActive={activePage === 'membership'} onClick={() => setActivePage('membership')} />
        </nav>
        <div className="mt-auto space-y-1 pt-4 border-t border-gray-800">
          <SidebarItem icon={<SettingsIcon />} label="Settings" isActive={activePage === 'settings'} onClick={() => onNavigate('settings')} />
          <SidebarItem icon={<SupportChatIcon />} label="Support Chat" isActive={activePage === 'support'} onClick={() => setActivePage('support')} />
          <SidebarItem icon={<SellerResourcesIcon />} label="Seller Resources" isActive={activePage === 'resources'} onClick={() => setActivePage('resources')} />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-800 fade-rise d1">
        <div className="hover-glow h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default SellerHubPage;

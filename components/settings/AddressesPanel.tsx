
import React, { useState } from 'react';
import { EditIcon, TrashIcon } from '../Icons';
import AddressModal from '../modals/AddressModal';

export interface Address {
    id: number;
    name: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
    shippingMethod: 'Standard' | 'Express';
    shippingCost: string;
}

const initialAddresses: Address[] = [
    {
        id: 1,
        name: 'Sagar Singhal',
        street: '28 Ruby Street',
        city: 'GREATER',
        state: 'London',
        pincode: 'SE15 1LL',
        country: 'GB',
        phone: '9876543210',
        shippingMethod: 'Standard',
        shippingCost: '₹50',
    }
];

const AddressesPanel: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const handleAddAddress = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleDeleteAddress = (id: number) => {
        setAddresses(addresses.filter(addr => addr.id !== id));
    };

    const handleSaveAddress = (address: Omit<Address, 'id'> & { id?: number }) => {
        if (address.id) {
            // Editing existing address
            setAddresses(addresses.map(addr => addr.id === address.id ? { ...addr, ...address } : addr));
        } else {
            // Adding new address
            setAddresses([...addresses, { ...address, id: Date.now() }]);
        }
        setIsModalOpen(false);
    };


    return (
        <>
         <div className="bg-gray-900 rounded-lg">
            <div className="p-8 space-y-8">
                <h2 className="text-xl font-bold text-white">Addresses</h2>

                {/* Saved Addresses */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">Saved Addresses</h3>
                         <button onClick={handleAddAddress} className="bg-white text-gray-900 font-bold py-2 px-5 rounded-lg hover:bg-gray-200 transition-colors">
                            Add Address
                        </button>
                    </div>
                    <p className="text-sm text-gray-400">Manage your shipping address details.</p>

                    <div className="mt-6 space-y-4">
                    {addresses.length > 0 ? addresses.map(address => (
                        <div key={address.id} className="border border-gray-700 rounded-lg p-4 flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-white">{address.name} <span className="text-xs bg-gray-600 text-gray-300 font-medium px-2 py-0.5 rounded-full ml-2">Return</span></p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {address.street}<br/>
                                    {address.city}, {address.state} {address.pincode}<br/>
                                    {address.country}
                                </p>
                                <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v5.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V8a1 1 0 00-1-1h-5z" />
                                    </svg>
                                    <p className="text-sm text-gray-300">
                                        {address.shippingMethod} Shipping: <span className="font-semibold text-white">{address.shippingCost}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleEditAddress(address)}><EditIcon /></button>
                                <button onClick={() => handleDeleteAddress(address.id)}><TrashIcon /></button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-700 rounded-lg">
                            <p className="text-gray-400">No saved addresses.</p>
                        </div>
                    )}
                    </div>
                </div>

                {/* Country of Residence */}
                 <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold text-white mb-1">Country of Residence</h3>
                    <p className="text-sm text-gray-400 mb-4">The country of residence influences the recommendations for shows and products.</p>
                     <div>
                        <label htmlFor="country" className="sr-only">Country</label>
                        <select
                            id="country"
                            name="country"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            defaultValue="IN"
                        >
                            <option value="IN">India</option>
                            <option value="US">United States</option>
                            <option value="GB">United Kingdom</option>
                            <option value="CA">Canada</option>
                        </select>
                    </div>
                 </div>
            </div>
        </div>
        <AddressModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveAddress}
            address={editingAddress}
        />
        </>
    );
};

export default AddressesPanel;
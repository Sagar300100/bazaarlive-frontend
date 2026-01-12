
import React, { useState, useEffect } from 'react';
import { Address } from '../settings/AddressesPanel';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Omit<Address, 'id'> & { id?: number }) => void;
  address: Address | null;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onSave, address }) => {
  const [formData, setFormData] = useState({
    name: '', street: '', city: '', state: '', pincode: '', country: 'IN', phone: '',
    shippingMethod: 'Standard' as 'Standard' | 'Express',
    shippingCost: '50'
  });

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        phone: address.phone,
        shippingMethod: address.shippingMethod,
        shippingCost: address.shippingCost.replace('₹', '')
      });
    } else {
      setFormData({ name: '', street: '', city: '', state: '', pincode: '', country: 'IN', phone: '', shippingMethod: 'Standard', shippingCost: '50' });
    }
  }, [address, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, shippingCost: `₹${formData.shippingCost}`, id: address?.id });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{address ? 'Edit Address' : 'Add New Address'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="space-y-4">
             {/* Form fields */}
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full input-field" required />
            </div>
             <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
                <input type="text" name="street" id="street" value={formData.street} onChange={handleChange} className="w-full input-field" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">City</label>
                    <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className="w-full input-field" required />
                </div>
                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-1">State / Province</label>
                    <input type="text" name="state" id="state" value={formData.state} onChange={handleChange} className="w-full input-field" required />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-300 mb-1">Pincode</label>
                    <input type="text" name="pincode" id="pincode" value={formData.pincode} onChange={handleChange} className="w-full input-field" required />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="w-full input-field" required />
                </div>
            </div>
             <div className="border-t border-gray-700 pt-4 mt-4">
                 <h3 className="text-md font-semibold text-white mb-2">Shipping Details</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="shippingMethod" className="block text-sm font-medium text-gray-300 mb-1">Shipping Method</label>
                        <select
                            name="shippingMethod"
                            id="shippingMethod"
                            value={formData.shippingMethod}
                            onChange={handleChange}
                            className="w-full input-field"
                        >
                            <option value="Standard">Standard</option>
                            <option value="Express">Express</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-300 mb-1">Shipping Cost (₹)</label>
                        <input
                            type="number"
                            name="shippingCost"
                            id="shippingCost"
                            value={formData.shippingCost}
                            onChange={handleChange}
                            className="w-full input-field"
                            placeholder="e.g., 50"
                            required
                        />
                    </div>
                 </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-4">
              <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors">Cancel</button>
              <button type="submit" className="py-2 px-5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-colors">Save Address</button>
          </div>
        </form>
        <style>{`.input-field { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; } .input-field:focus { outline: none; box-shadow: 0 0 0 2px #F97316; }`}</style>
      </div>
    </div>
  );
};

export default AddressModal;
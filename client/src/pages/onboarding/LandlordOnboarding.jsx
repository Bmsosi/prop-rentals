import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandlordOnboarding() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        businessName: '',
        businessAddress: '',
        taxId: '',
        numberOfProperties: '',
        bankName: '',
        accountNumber: '',
        routingNumber: ''
    });
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        setError('');

        try {
            navigate('/landlord/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-center mb-2">Welcome Landlord!</h1>
                <p className="text-center text-gray-600 mb-6">Complete your profile to get started</p>

                <div className="bg-white p-6 rounded shadow">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Business Name (Optional)</label>
                        <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => handleChange('businessName', e.target.value)}
                            placeholder="ABC Property Management"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Business Address</label>
                        <input
                            type="text"
                            value={formData.businessAddress}
                            onChange={(e) => handleChange('businessAddress', e.target.value)}
                            placeholder="123 Business St, City, State, ZIP"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Tax ID / EIN</label>
                        <input
                            type="text"
                            value={formData.taxId}
                            onChange={(e) => handleChange('taxId', e.target.value)}
                            placeholder="XX-XXXXXXX"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Number of Properties</label>
                        <input
                            type="number"
                            value={formData.numberOfProperties}
                            onChange={(e) => handleChange('numberOfProperties', e.target.value)}
                            placeholder="5"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h2 className="text-lg font-semibold mb-4">Banking Information</h2>

                        <div className="mb-4">
                            <label className="block mb-1 font-medium">Bank Name</label>
                            <input
                                type="text"
                                value={formData.bankName}
                                onChange={(e) => handleChange('bankName', e.target.value)}
                                placeholder="Bank of America"
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block mb-1 font-medium">Account Number</label>
                            <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => handleChange('accountNumber', e.target.value)}
                                placeholder="XXXXXXXXXXXX"
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block mb-1 font-medium">Routing Number</label>
                            <input
                                type="text"
                                value={formData.routingNumber}
                                onChange={(e) => handleChange('routingNumber', e.target.value)}
                                placeholder="XXXXXXXXX"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-gray-500 text-white p-3 rounded hover:bg-green-600 font-medium"
                    >
                        Complete Profile & Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TenantOnboarding() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        dateOfBirth: '',
        address: '',
        employmentStatus: '',
        monthlyIncome: '',
        emergencyContact: '',
        emergencyPhone: ''
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
            navigate('/tenant/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-center mb-2">Welcome Tenant!</h1>
                <p className="text-center text-gray-600 mb-6">Complete your profile to get started</p>

                <div className="bg-white p-6 rounded shadow">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Current Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="123 Main St, City, State, ZIP"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Employment Status</label>
                        <select
                            value={formData.employmentStatus}
                            onChange={(e) => handleChange('employmentStatus', e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select employment status</option>
                            <option value="employed">Employed</option>
                            <option value="self-employed">Self-Employed</option>
                            <option value="student">Student</option>
                            <option value="unemployed">Unemployed</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Monthly Income</label>
                        <input
                            type="number"
                            value={formData.monthlyIncome}
                            onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                            placeholder="5000"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Emergency Contact Name</label>
                        <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={(e) => handleChange('emergencyContact', e.target.value)}
                            placeholder="John Doe"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block mb-1 font-medium">Emergency Contact Phone</label>
                        <input
                            type="tel"
                            value={formData.emergencyPhone}
                            onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                            placeholder="+1234567890"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-gray-700 text-white p-3 rounded hover:bg-gray-800 font-medium"
                    >
                        Complete Profile & Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
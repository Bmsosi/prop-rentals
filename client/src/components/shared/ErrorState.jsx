import React from 'react';

const ErrorState = ({ message }) => (
    <div className="text-center py-12">
        <p className="text-red-500 mb-2">Failed to load properties</p>
        <p className="text-sm text-gray-600">{message}</p>
    </div>
);

export default ErrorState;

import React from 'react';
import { Home } from 'lucide-react';

const EmptyState = ({ message = 'No data found' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <p>{message}</p>
        </div>
    );
};

export default EmptyState;

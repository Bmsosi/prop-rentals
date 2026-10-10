import React from 'react';

const LoadingState = ({ message = 'Loading...', compact = false }) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'min-h-[50vh]'}`}>
            <style>{`
                @keyframes bigBounce {
                    0%, 80%, 100% {
                        transform: translateY(0) scale(1);
                    }
                    40% {
                        transform: translateY(-12px) scale(1.1);
                    }
                }
                .bounce-dot {
                    animation: bigBounce 1.2s ease-in-out infinite;
                }
            `}</style>
            <div className="flex gap-2 mb-4 h-8 items-end">
                <div className="w-2 h-2 bg-gray-700 rounded-full bounce-dot" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-700 rounded-full bounce-dot" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-gray-700 rounded-full bounce-dot" style={{ animationDelay: '400ms' }}></div>
            </div>
            {message && <p className="text-sm text-gray-600 font-medium">{message}</p>}
        </div>
    );
};

export default LoadingState;

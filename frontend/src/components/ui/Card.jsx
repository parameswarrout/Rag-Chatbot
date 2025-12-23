import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, gradient = false, ...props }) => {
    return (
        <div
            className={twMerge(
                'rounded-xl border border-white/10 backdrop-blur-sm p-4 transition-all',
                gradient 
                    ? 'bg-gradient-to-br from-white/5 to-white/10' // Lighter for interactive elements
                    : 'bg-black/20', // Darker for containers
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;

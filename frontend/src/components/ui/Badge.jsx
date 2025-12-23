import React from 'react';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, variant = 'default', className }) => {
    const variants = {
        default: 'bg-gray-700/50 text-gray-300',
        success: 'bg-green-500/10 text-green-400 border border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    };

    return (
        <span
            className={twMerge(
                'px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5',
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    );
};

export default Badge;

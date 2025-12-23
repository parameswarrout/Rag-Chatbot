import React from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    className, 
    disabled, 
    ...props 
}) => {
    const variants = {
        primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20',
        secondary: 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-transparent',
        outline: 'bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20',
        danger: 'bg-red-500/10 text-red-400 border border-transparent hover:bg-red-500/20 hover:border-red-500/20',
        ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs rounded-lg',
        md: 'px-4 py-2 text-sm rounded-xl',
        lg: 'px-6 py-3 text-base rounded-xl',
        icon: 'p-2 rounded-xl'
    };

    return (
        <button
            className={twMerge(
                'font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;

import React, { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const NeoButton: React.FC<NeoButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md',
  children, 
  ...props 
}) => {
  const baseStyles = "font-bold border-2 border-neo-black shadow-neo transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-neo-yellow text-neo-black hover:bg-yellow-400",
    secondary: "bg-neo-blue text-neo-black hover:bg-cyan-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "bg-white text-neo-black hover:bg-gray-50",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-8 py-4 text-lg w-full",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      {children}
    </button>
  );
};

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  color?: string;
}

export const NeoCard: React.FC<NeoCardProps> = ({ children, className, color = 'bg-white', ...props }) => {
  return (
    <div 
      className={cn("border-2 border-neo-black shadow-neo p-4", color, className)} 
      {...props}
    >
      {children}
    </div>
  );
};

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const NeoInput: React.FC<NeoInputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="font-bold text-sm uppercase">{label}</label>
      <input 
        className={cn(
          "w-full p-3 border-2 border-neo-black shadow-neo-sm focus:outline-none focus:ring-2 focus:ring-neo-yellow focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all",
          className
        )}
        {...props}
      />
    </div>
  );
};

interface NeoTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const NeoTextArea: React.FC<NeoTextAreaProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="font-bold text-sm uppercase">{label}</label>
      <textarea 
        className={cn(
          "w-full p-3 border-2 border-neo-black shadow-neo-sm focus:outline-none focus:ring-2 focus:ring-neo-yellow transition-all min-h-[100px]",
          className
        )}
        {...props}
      />
    </div>
  );
};
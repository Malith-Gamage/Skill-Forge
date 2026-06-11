import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({ hover = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

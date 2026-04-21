import React from 'react';
import { formatCurrency } from '@/lib/formatters';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-blue-50 text-blue-600 border-blue-200',
  success: 'bg-green-50 text-green-600 border-green-200',
  warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  danger: 'bg-red-50 text-red-600 border-red-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

export default function SummaryCard({
  title,
  value,
  icon,
  variant = 'primary',
  size = 'md',
}: SummaryCardProps) {
  const isCurrency = typeof value === 'number' && title.toLowerCase().includes('total') ||
    title.toLowerCase().includes('salary') ||
    title.toLowerCase().includes('pay') ||
    title.toLowerCase().includes('severance');

  return (
    <div className={`border rounded-lg ${variantStyles[variant]} ${sizeStyles[size]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
            {title}
          </p>
          <p className="font-bold mt-1">
            {isCurrency ? formatCurrency(value as number) : value}
          </p>
        </div>
        {icon && <div className="text-2xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
}


import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message?: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  className?: string;
}

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info
};

const colorMap = {
  error: 'text-red-600 bg-red-50 border-red-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  success: 'text-green-600 bg-green-50 border-green-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200'
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  type = 'error', 
  className 
}) => {
  if (!message) return null;

  const Icon = iconMap[type];

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-md border text-sm',
      colorMap[type],
      className
    )}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

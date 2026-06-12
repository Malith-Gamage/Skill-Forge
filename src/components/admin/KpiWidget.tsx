import { LucideIcon } from 'lucide-react';

interface KpiWidgetProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  bg?: string;
}

export default function KpiWidget({
  label,
  value,
  icon: Icon,
  color = 'text-blue-600',
  bg = 'bg-blue-100',
}: KpiWidgetProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 text-center">
      <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-3 dark:opacity-80`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

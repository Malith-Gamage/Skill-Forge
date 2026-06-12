interface BadgeProps {
  label: string;
  color?: 'blue' | 'purple' | 'gold' | 'green' | 'gray' | 'red';
  size?: 'sm' | 'md';
}

const colors = {
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  gold:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  red:    'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
};

export default function Badge({ label, color = 'blue', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colors[color]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'}`}>
      {label}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  className?: string;
}

export default function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-linear-to-r from-primary to-primary-end rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

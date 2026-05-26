interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  badgeColor?: string;
}

const BADGE_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export function FilterButton({ active, onClick, label, count, badgeColor = "blue" }: FilterButtonProps) {
  const activeClass = active
    ? "bg-blue-600 text-white"
    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";

  const badgeClass = BADGE_COLORS[badgeColor] || BADGE_COLORS.blue;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeClass}`}
    >
      {label}
      <span
        className={`px-1.5 py-0.5 text-xs rounded-full ${
          active ? "bg-white/20 text-white" : badgeClass
        }`}
      >
        {count}
      </span>
    </button>
  );
}

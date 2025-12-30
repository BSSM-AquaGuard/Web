import { cn } from "@/lib/cn";

type Option = { value: string; label: string };

type SelectProps = {
  value: string;
  options: Option[];
  placeholder?: string;
  onValueChange?: (v: string) => void;
  className?: string;
};

export function Select({ value, options, placeholder, onValueChange, className }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

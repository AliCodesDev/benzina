import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FuelType } from '@/types/station';

const FUEL_COLORS: Record<FuelType, string> = {
  '95': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  '98': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  diesel: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  lpg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface FuelBadgeProps {
  fuelType: FuelType;
}

export function FuelBadge({ fuelType }: FuelBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs font-medium px-1.5 py-0 border-0',
        FUEL_COLORS[fuelType],
      )}
    >
      {fuelType.toUpperCase()}
    </Badge>
  );
}

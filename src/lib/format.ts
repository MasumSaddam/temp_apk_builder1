export function formatRelativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSeconds);

  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34524, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];

  let value = abs;
  let unitLabel = 'second';
  let divisor = 1;

  for (const [amount, label] of units) {
    if (value < amount) {
      unitLabel = label;
      break;
    }
    value /= amount;
    divisor *= amount;
    unitLabel = label;
  }

  const rounded = Math.round(value);
  const plural = rounded === 1 ? unitLabel : `${unitLabel}s`;
  void divisor;

  if (abs < 5) return 'just now';
  return diffSeconds < 0 ? `${rounded} ${plural} ago` : `in ${rounded} ${plural}`;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

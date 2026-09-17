export function parseMoneyToCents(value: string | undefined | null): number | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/\s+/g, '')
    .replace(/[^0-9,.-]/g, '');

  if (!normalized || normalized === '-' || normalized === '.' || normalized === ',') {
    return null;
  }

  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  let sanitized = normalized;

  if (hasComma && hasDot) {
    const decimalSeparator = normalized.lastIndexOf(',') > normalized.lastIndexOf('.') ? ',' : '.';
    const groupSeparator = decimalSeparator === ',' ? '.' : ',';
    sanitized = normalized.replace(new RegExp(`\\${groupSeparator}`, 'g'), '').replace(decimalSeparator, '.');
  } else if (hasComma) {
    sanitized = normalized.match(/,\d{1,2}$/) ? normalized.replace(',', '.') : normalized.replace(/,/g, '');
  } else if (hasDot) {
    sanitized = normalized;
  }

  if (!/^[-+]?\d+(\.\d+)?$/.test(sanitized)) {
    return null;
  }

  const numericValue = Number(sanitized);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.round(Math.abs(numericValue) * 100);
}

export function formatCentsAsCurrency(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('sk-SK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' EUR';
}

export function sumCents(values: Array<number | null>): number {
  return values.reduce<number>((total, entry) => total + (entry ?? 0), 0);
}

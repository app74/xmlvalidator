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

  let sanitized = normalized;
  const hasComma = sanitized.includes(',');
  const hasDot = sanitized.includes('.');

  if (hasComma && hasDot) {
    const decimalSeparator = sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.') ? ',' : '.';
    const groupSeparator = decimalSeparator === ',' ? '.' : ',';
    sanitized = sanitized.replace(new RegExp(`\\${groupSeparator}`, 'g'), '').replace(decimalSeparator, '.');
  } else if (hasComma) {
    sanitized = sanitized.match(/,\d{1,2}$/) ? sanitized.replace(',', '.') : sanitized.replace(/,/g, '');
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
  return `${value.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

export function sumCents(values: Array<number | null>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

import { ValidationIssue } from '../models/ValidationModels';
import { getXmlTagOccurrences, getLineText } from '../utils/XmlUtils';

function mod97String(value: string): bigint {
  let remainder = 0n;
  const chunkSize = 9;

  for (let index = 0; index < value.length; index += chunkSize) {
    const chunk = value.slice(index, index + chunkSize);
    remainder = (remainder * (10n ** BigInt(chunk.length)) + BigInt(chunk)) % 97n;
  }

  return remainder;
}

export function normalizeIban(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

export function validateIbanChecksum(value: string): boolean {
  const candidate = normalizeIban(value);
  if (!/^[A-Z]{2}[0-9A-Z]{11,33}$/.test(candidate)) {
    return false;
  }

  const rearranged = candidate.slice(4) + candidate.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  return mod97String(digits) === 1n;
}

export function validateIban(xml: string): { issues: ValidationIssue[]; ibanOccurrences: number; uniqueIbans: number; invalidIbans: string[] } {
  const occurrences = getXmlTagOccurrences(xml, 'IBAN');
  const values = occurrences.map((entry) => normalizeIban(entry.value));
  const unique = [...new Set(values.filter(Boolean))];
  const invalidIbans: string[] = [];
  const issues: ValidationIssue[] = [];

  for (const occurrence of occurrences) {
    const normalized = normalizeIban(occurrence.value);
    if (!validateIbanChecksum(normalized)) {
      invalidIbans.push(normalized);
      issues.push({
        type: 'iban',
        severity: 'error',
        message: 'IBAN nevyhovuje kontrolnému súčtu alebo syntaxi.',
        line: occurrence.line,
        column: occurrence.column,
        xmlLine: getLineText(xml, occurrence.line).trimEnd(),
        recommendation: 'Skontrolujte správnosť IBAN kódu a formát zápisu.',
      });
    }
  }

  return {
    issues,
    ibanOccurrences: occurrences.length,
    uniqueIbans: unique.length,
    invalidIbans,
  };
}

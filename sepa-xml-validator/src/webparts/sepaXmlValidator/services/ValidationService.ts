import { SepaValidationResult, ValidationCheck, ValidationIssue, ValidationStatus } from '../models/ValidationModels';
import { findSuspiciousCharacters, findXmlStructureIssues, hasDangerousXml } from '../utils/XmlUtils';
import { parseMoneyToCents, sumCents, formatCentsAsCurrency } from '../utils/MoneyUtils';

function getAllElementsByLocalName(xml: string, localName: string): Array<{ value: string; line: number; column: number }> {
  const regex = new RegExp('<(?:[A-Za-z_][^>:]*:)?' + localName + '\\b[^>]*>([\\s\\S]*?)</(?:[A-Za-z_][^>:]*:)?' + localName + '>', 'gi');
  const results: Array<{ value: string; line: number; column: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const value = (match[1] || '').replace(/^\s+|\s+$/g, '');
    const before = xml.slice(0, match.index);
    const line = before.split(/\r?\n/).length;
    const lastBreakIndex = Math.max(before.lastIndexOf('\n'), before.lastIndexOf('\r'));
    const column = lastBreakIndex >= 0 ? before.length - lastBreakIndex : before.length + 1;
    results.push({ value, line, column });
  }

  return results;
}

function mod97String(value: string): number {
  let remainder = 0;
  const chunkSize = 9;

  for (let index = 0; index < value.length; index += chunkSize) {
    const chunk = value.slice(index, index + chunkSize);
    remainder = (remainder * Math.pow(10, chunk.length) + Number(chunk)) % 97;
  }

  return remainder;
}

function getIssuesForCountry(xml: string): ValidationIssue[] {
  const items = getAllElementsByLocalName(xml, 'Ctry');
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (/^[A-Z]{2}$/.test(item.value)) {
      continue;
    }

    issues.push({
      type: 'country',
      severity: 'error',
      message: 'Kód krajiny má nesprávny formát.',
      line: item.line,
      column: item.column,
      xmlLine: xml.split(/\r?\n/)[item.line - 1] || '',
      recommendation: 'Očakávané: <Ctry>SK</Ctry>'
    });
  }

  return issues;
}

function getIssuesForBic(xml: string): ValidationIssue[] {
  const items = getAllElementsByLocalName(xml, 'BIC');
  const issues: ValidationIssue[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(item.value)) {
      continue;
    }

    issues.push({
      type: 'bic',
      severity: 'error',
      message: 'BIC má neplatný formát.',
      line: item.line,
      column: item.column,
      xmlLine: xml.split(/\r?\n/)[item.line - 1] || '',
      recommendation: 'BIC musí mať 8 alebo 11 veľkých alfanumerických znakov.'
    });
  }

  return issues;
}

function getIssuesForIban(xml: string): { issues: ValidationIssue[]; total: number; unique: number; invalid: string[] } {
  const items = getAllElementsByLocalName(xml, 'IBAN');
  const sanitized = items.map(function (item) { return item.value.replace(/\s+/g, '').toUpperCase(); });
  const unique: string[] = [];
  const invalid: string[] = [];
  const issues: ValidationIssue[] = [];

  for (let index = 0; index < sanitized.length; index += 1) {
    const iban = sanitized[index];
    if (unique.indexOf(iban) < 0 && iban) {
      unique.push(iban);
    }

    if (!iban || !/^[A-Z]{2}[0-9A-Z]{11,33}$/.test(iban)) {
      invalid.push(iban);
      issues.push({
        type: 'iban',
        severity: 'error',
        message: 'IBAN nevyhovuje syntaxi alebo kontrolnému súčtu.',
        line: items[index].line,
        column: items[index].column,
        xmlLine: xml.split(/\r?\n/)[items[index].line - 1] || '',
        recommendation: 'Skontrolujte formát a checksum IBAN.'
      });
      continue;
    }

    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numeric = rearranged.replace(/[A-Z]/g, function (letter) {
      return String(letter.charCodeAt(0) - 55);
    });

    if (mod97String(numeric) !== 1) {
      invalid.push(iban);
      issues.push({
        type: 'iban',
        severity: 'error',
        message: 'IBAN nevyhovuje kontrolnému súčtu.',
        line: items[index].line,
        column: items[index].column,
        xmlLine: xml.split(/\r?\n/)[items[index].line - 1] || '',
        recommendation: 'Skontrolujte hodnotu IBAN.'
      });
    }
  }

  return { issues, total: items.length, unique: unique.length, invalid };
}

function getIssuesForTransactionCount(xml: string): { issues: ValidationIssue[]; actual: number; declared?: number } {
  const declared = getAllElementsByLocalName(xml, 'NbOfTxs');
  const declaredValue = declared.length > 0 ? parseInt((declared[0] ? declared[0].value : '').trim(), 10) : undefined;
  const actual = getAllElementsByLocalName(xml, 'InstdAmt').length;
  const issues: ValidationIssue[] = [];

  if (declaredValue !== undefined && isFinite(declaredValue) && actual !== declaredValue) {
    const line = declared[0] ? declared[0].line : 1;
    issues.push({
      type: 'transaction-count',
      severity: 'error',
      message: 'Počet platieb nezhoduje sa: ' + actual + ' vs ' + declaredValue + '.',
      line,
      xmlLine: xml.split(/\r?\n/)[line - 1] || '',
      recommendation: 'Upravte hodnotu GrpHdr/NbOfTxs tak, aby zodpovedala počtu InstdAmt.'
    });
  }

  return { issues, actual, declared: declaredValue };
}

function getIssuesForControlSum(xml: string): { issues: ValidationIssue[]; calculated?: string; declared?: string } {
  const declaredItems = getAllElementsByLocalName(xml, 'CtrlSum');
  const declared = declaredItems[0] ? declaredItems[0].value.trim() : undefined;
  const amounts = getAllElementsByLocalName(xml, 'InstdAmt').map(function (item) {
    return parseMoneyToCents(item.value);
  });
  const calculated = sumCents(amounts);
  const issues: ValidationIssue[] = [];

  if (declared !== undefined) {
    const declaredCents = parseMoneyToCents(declared);
    if (declaredCents === null) {
      issues.push({
        type: 'control-sum',
        severity: 'error',
        message: 'Kontrolný súčet má neplatný formát.',
        line: declaredItems[0] ? declaredItems[0].line : 1,
        xmlLine: xml.split(/\r?\n/)[(declaredItems[0] ? declaredItems[0].line : 1) - 1] || '',
        recommendation: 'Zadajte hodnotu v tvare 1234.56 EUR.'
      });
    } else if (declaredCents !== calculated) {
      issues.push({
        type: 'control-sum',
        severity: 'error',
        message: 'Kontrolný súčet sa nezhoduje: ' + formatCentsAsCurrency(calculated) + ' vs ' + declared + '.',
        line: declaredItems[0] ? declaredItems[0].line : 1,
        xmlLine: xml.split(/\r?\n/)[(declaredItems[0] ? declaredItems[0].line : 1) - 1] || '',
        recommendation: 'Upravte hodnotu GrpHdr/CtrlSum tak, aby zodpovedala súčtu InstdAmt.'
      });
    }
  }

  return { issues, calculated: formatCentsAsCurrency(calculated), declared };
}

export function validateSepaDocument(xml: string, fileName: string, fileSize: number): SepaValidationResult {
  const structureIssues = findXmlStructureIssues(xml);
  const suspicious = findSuspiciousCharacters(xml);
  const countryIssues = getIssuesForCountry(xml);
  const bicIssues = getIssuesForBic(xml);
  const ibanResult = getIssuesForIban(xml);
  const transactionResult = getIssuesForTransactionCount(xml);
  const controlSumResult = getIssuesForControlSum(xml);

  const securityIssues: ValidationIssue[] = hasDangerousXml(xml) ? [{
    type: 'security',
    severity: 'error',
    message: 'XML obsahuje DOCTYPE alebo deklarácie entít.',
    recommendation: 'Odstráňte DOCTYPE a externé entity.'
  }] : [];

  const issues: ValidationIssue[] = securityIssues.slice(0).concat(
    structureIssues,
    suspicious.map(function (item) {
      return {
        type: 'suspicious-character',
        severity: 'error',
        message: 'Nájdený neviditeľný alebo neplatný znak.',
        line: item.line,
        column: item.column,
        character: item.character,
        codePoint: item.codePoint,
        xmlLine: item.xmlLine,
        recommendation: 'Odstráňte neviditeľný znak z XML.'
      };
    }),
    countryIssues,
    bicIssues,
    ibanResult.issues,
    transactionResult.issues,
    controlSumResult.issues
  );

  const checks: ValidationCheck[] = [
    { id: 'xml-structure', name: 'XML štruktúra', status: structureIssues.length > 0 || securityIssues.length > 0 ? 'error' : 'ok', issues: securityIssues.concat(structureIssues) },
    { id: 'special-characters', name: 'Špeciálne / neviditeľné znaky', status: suspicious.length > 0 ? 'error' : 'ok', issues: suspicious.map(function (item) {
      return {
        type: 'suspicious-character',
        severity: 'error',
        message: 'Nájdený neviditeľný alebo neplatný znak.',
        line: item.line,
        column: item.column,
        character: item.character,
        codePoint: item.codePoint,
        xmlLine: item.xmlLine,
        recommendation: 'Odstráňte neviditeľný znak z XML.'
      };
    }) },
    { id: 'ctry', name: 'Ctry', status: countryIssues.length > 0 ? 'error' : 'ok', issues: countryIssues },
    { id: 'bic', name: 'BIC', status: bicIssues.length > 0 ? 'error' : 'ok', issues: bicIssues },
    { id: 'iban', name: 'IBAN', status: ibanResult.issues.length > 0 ? 'error' : 'ok', issues: ibanResult.issues },
    { id: 'nb-of-txs', name: 'NbOfTxs', status: transactionResult.issues.length > 0 ? 'error' : 'ok', issues: transactionResult.issues },
    { id: 'ctrl-sum', name: 'CtrlSum', status: controlSumResult.issues.length > 0 ? 'error' : 'ok', issues: controlSumResult.issues }
  ];

  const overallStatus: ValidationStatus = issues.length > 0 ? 'error' : 'ok';

  return {
    fileName,
    fileSize,
    encoding: 'UTF-8',
    hasBom: xml.indexOf('\uFEFF') === 0,
    xmlWellFormed: !hasDangerousXml(xml) && structureIssues.length === 0,
    transactionCount: transactionResult.actual,
    declaredTransactionCount: transactionResult.declared,
    calculatedControlSum: controlSumResult.calculated,
    declaredControlSum: controlSumResult.declared,
    ibanOccurrences: ibanResult.total,
    uniqueIbans: ibanResult.unique,
    invalidIbans: ibanResult.invalid,
    issues,
    checks,
    overallStatus,
    overallSummary: overallStatus === 'ok' ? 'XML JE V PORIADKU' : 'XML OBSAHUJE CHYBY'
  };
}

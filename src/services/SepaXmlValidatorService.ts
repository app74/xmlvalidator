import { ValidationCheck, ValidationIssue, ValidationStatus, SepaValidationResult } from '../models/ValidationModels';
import { hasDangerousXml, findSuspiciousCharacters } from '../utils/XmlUtils';
import { validateCountry } from './CountryValidator';
import { validateIban } from './IbanValidator';
import { validateTransactionCount } from './TransactionValidator';
import { validateControlSum } from './ControlSumValidator';

export function validateSepaXml(xmlText: string, fileName: string, fileSize: number): SepaValidationResult {
  const issues: ValidationIssue[] = [];
  const securityIssues = hasDangerousXml(xmlText) ? [{
    type: 'security' as const,
    severity: 'error' as const,
    message: 'XML obsahuje DOCTYPE alebo deklarácie entít, čo je nepovolené v tejto validácii.',
    recommendation: 'XML bez externých entít a bez DOCTYPE je povolené.',
  }] : [];

  issues.push(...securityIssues);
  issues.push(...findSuspiciousCharacters(xmlText));
  issues.push(...validateCountry(xmlText));

  const ibanResult = validateIban(xmlText);
  issues.push(...ibanResult.issues);

  const txnResult = validateTransactionCount(xmlText);
  issues.push(...txnResult.issues);

  const ctrlResult = validateControlSum(xmlText);
  issues.push(...ctrlResult.issues);

  const checks: ValidationCheck[] = [
    {
      id: 'xml-structure',
      name: 'XML štruktúra',
      status: securityIssues.length > 0 ? 'error' : 'ok',
      issues: securityIssues,
    },
    {
      id: 'special-characters',
      name: 'Špeciálne / neviditeľné znaky',
      status: findSuspiciousCharacters(xmlText).length > 0 ? 'error' : 'ok',
      issues: findSuspiciousCharacters(xmlText),
    },
    {
      id: 'ctry',
      name: 'Ctry',
      status: validateCountry(xmlText).length > 0 ? 'error' : 'ok',
      issues: validateCountry(xmlText),
    },
    {
      id: 'iban',
      name: 'IBAN',
      status: ibanResult.issues.length > 0 ? 'error' : 'ok',
      issues: ibanResult.issues,
    },
    {
      id: 'nb-of-txs',
      name: 'NbOfTxs',
      status: txnResult.issues.length > 0 ? 'error' : 'ok',
      issues: txnResult.issues,
    },
    {
      id: 'ctrl-sum',
      name: 'CtrlSum',
      status: ctrlResult.issues.length > 0 ? 'error' : 'ok',
      issues: ctrlResult.issues,
    },
  ];

  const overallStatus: ValidationStatus = issues.length > 0 ? 'error' : 'ok';
  const result: SepaValidationResult = {
    fileName: fileName,
    fileSize: fileSize,
    encoding: 'UTF-8',
    hasBom: xmlText.startsWith('\uFEFF'),
    xmlWellFormed: true,
    transactionCount: txnResult.transactionCount,
    declaredTransactionCount: txnResult.declaredTransactionCount,
    calculatedControlSum: ctrlResult.calculatedControlSum,
    declaredControlSum: ctrlResult.declaredControlSum,
    ibanOccurrences: ibanResult.ibanOccurrences,
    uniqueIbans: ibanResult.uniqueIbans,
    invalidIbans: ibanResult.invalidIbans,
    issues,
    checks,
    overallStatus,
    overallSummary: issues.length > 0 ? 'XML OBSAHUJE CHYBY' : 'XML JE V PORIADKU',
  };

  return result;
}

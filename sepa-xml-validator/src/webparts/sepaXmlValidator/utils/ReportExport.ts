import { SepaValidationResult } from '../models/ValidationModels';

function csvCell(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}

export function createTextReport(result: SepaValidationResult): string {
  const lines: string[] = [
    'SEPA XML VALIDÁCIA',
    'Súbor: ' + result.fileName,
    'Veľkosť: ' + result.fileSize + ' B',
    'Výsledok: ' + result.overallSummary,
    'Počet platieb: ' + result.transactionCount,
    'Deklarovaný počet platieb: ' + (result.declaredTransactionCount === undefined ? '—' : result.declaredTransactionCount.toString()),
    'Vypočítaný CtrlSum: ' + (result.calculatedControlSum || '—'),
    'Deklarovaný CtrlSum: ' + (result.declaredControlSum || '—'),
    'IBAN výskytov: ' + result.ibanOccurrences,
    'Unikátne IBANy: ' + result.uniqueIbans,
    'Neplatné IBANy: ' + result.invalidIbans.length,
    '',
    'NÁLEZY'
  ];

  result.issues.forEach(function (issue, index) {
    lines.push((index + 1) + '. ' + issue.message + (issue.line ? ' (riadok ' + issue.line + ')' : ''));
    if (issue.recommendation) {
      lines.push('   Odporúčanie: ' + issue.recommendation);
    }
  });

  return lines.join('\r\n');
}

export function createCsvReport(result: SepaValidationResult): string {
  const lines: string[] = ['"Typ";"Závažnosť";"Správa";"Riadok";"Stĺpec";"Odporúčanie"'];

  result.issues.forEach(function (issue) {
    lines.push([
      csvCell(issue.type),
      csvCell(issue.severity),
      csvCell(issue.message),
      csvCell(issue.line === undefined ? '' : issue.line.toString()),
      csvCell(issue.column === undefined ? '' : issue.column.toString()),
      csvCell(issue.recommendation || '')
    ].join(';'));
  });

  return lines.join('\r\n');
}

export function downloadReport(result: SepaValidationResult, format: 'txt' | 'csv'): void {
  const content = format === 'csv' ? createCsvReport(result) : createTextReport(result);
  const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const baseName = result.fileName.replace(/\.xml$/i, '');

  anchor.href = url;
  anchor.download = baseName + '-validacia.' + format;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadXml(xml: string, fileName: string): void {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const baseName = fileName.replace(/\.xml$/i, '');

  anchor.href = url;
  anchor.download = baseName + '-opravene.xml';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

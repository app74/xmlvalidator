import * as React from 'react';
import { SepaValidationResult } from '../models/ValidationModels';

interface IValidationDashboardProps {
  result: SepaValidationResult;
  onExport: (format: 'txt' | 'csv') => void;
}

export const ValidationDashboard: React.FC<IValidationDashboardProps> = ({ result, onExport }) => {
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ok':
        return '✅ OK';
      case 'warning':
        return '⚠ UPOZORNENIE';
      case 'not-checked':
        return '— KONTROLA SA NEPODARILA VYKONAŤ';
      default:
        return '❌ CHYBA';
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Kontrolné údaje</h3>
      <div style={{ marginBottom: 16 }}>
        <strong>{result.overallSummary}</strong>
      </div>
      <ul>
        <li>Počet platieb: {result.transactionCount}</li>
        <li>GrpHdr/NbOfTxs: {result.declaredTransactionCount ?? '—'}</li>
        <li>Súčet InstdAmt: {result.calculatedControlSum ?? '—'}</li>
        <li>GrpHdr/CtrlSum: {result.declaredControlSum ?? '—'}</li>
        <li>IBAN výskytov: {result.ibanOccurrences}</li>
        <li>Unikátne IBANy: {result.uniqueIbans}</li>
        <li>Neplatné IBANy: {result.invalidIbans.length}</li>
      </ul>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" onClick={() => onExport('txt')}>Stiahnuť TXT report</button>
        <button type="button" onClick={() => onExport('csv')}>Stiahnuť CSV report</button>
      </div>

      {result.checks.map((check) => (
        <div key={check.id} style={{ marginTop: 12, border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div><strong>{check.name}</strong></div>
          <div style={{ marginTop: 6 }}>{getStatusLabel(check.status)}</div>
          {check.issues.length > 0 && (
            <ul style={{ marginTop: 10 }}>
              {check.issues.map((issue, index) => (
                <li key={`${check.id}-${index}`}>
                  {issue.message}
                  {issue.line ? ` (Riadok ${issue.line})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

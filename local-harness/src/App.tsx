import React, { useRef, useState } from 'react';
import { validateSepaDocument } from '../../sepa-xml-validator/src/webparts/sepaXmlValidator/services/ValidationService';
import { SepaValidationResult } from '../../sepa-xml-validator/src/webparts/sepaXmlValidator/models/ValidationModels';
import { downloadReport } from '../../sepa-xml-validator/src/webparts/sepaXmlValidator/utils/ReportExport';

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  }
  return (bytes / 1024).toFixed(1) + ' KB';
}

export default function App(): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<SepaValidationResult>();
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>();

  const validateFile = (file: File): void => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Vyberte súbor s príponou .xml.');
      setResult(undefined);
      return;
    }

    setIsReading(true);
    setError(undefined);
    setResult(undefined);
    const reader = new FileReader();

    reader.onload = (): void => {
      try {
        const xml = typeof reader.result === 'string' ? reader.result : '';
        if (!xml) {
          throw new Error('Súbor sa nepodarilo načítať ako text.');
        }
        setResult(validateSepaDocument(xml, file.name, file.size));
      } catch (readError) {
        setError(readError instanceof Error ? readError.message : 'Súbor sa nepodarilo overiť.');
      } finally {
        setIsReading(false);
      }
    };

    reader.onerror = (): void => {
      setIsReading(false);
      setError('Súbor sa nepodarilo načítať.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      validateFile(file);
    }
  };

  return (
    <main className="app-shell">
      <div className="eyebrow">LOKÁLNY TESTOVACÍ HARNESS</div>
      <h1>Overovanie SEPA XML</h1>
      <p className="intro">Nahrajte XML priamo do prehliadača. Dáta neopúšťajú toto zariadenie.</p>

      <section
        className={'drop-zone' + (isDragging ? ' drop-zone--active' : '')}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Vybrať XML súbor"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              validateFile(file);
            }
            event.target.value = '';
          }}
        />
        <span className="drop-zone__icon" aria-hidden="true">XML</span>
        <strong>Pretiahnite XML súbor sem</strong>
        <span>alebo kliknite a vyberte ho z počítača</span>
      </section>

      {isReading && <p className="notice" aria-live="polite">Načítavam a overujem XML...</p>}
      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {result && (
        <section className="results" aria-live="polite">
          <div className={'result-banner result-banner--' + result.overallStatus}>
            <div>
              <span className="result-banner__label">Výsledok overenia</span>
              <h2>{result.overallSummary}</h2>
            </div>
            <div className="file-meta">{result.fileName}<br />{formatBytes(result.fileSize)}</div>
          </div>

          <div className="metrics">
            <Metric label="Platby" value={result.transactionCount.toString()} />
            <Metric label="CtrlSum" value={result.calculatedControlSum || '—'} />
            <Metric label="IBANy" value={result.ibanOccurrences.toString()} />
            <Metric label="Nálezy" value={result.issues.length.toString()} />
          </div>

          <div className="actions">
            <button type="button" onClick={() => downloadReport(result, 'txt')}>Stiahnuť TXT report</button>
            <button type="button" onClick={() => downloadReport(result, 'csv')}>Stiahnuť CSV report</button>
          </div>

          <h3>Kontroly</h3>
          <div className="checks">
            {result.checks.map((check) => (
              <article className="check" key={check.id}>
                <div className="check__heading">
                  <strong>{check.name}</strong>
                  <span className={'status status--' + check.status}>{check.status === 'ok' ? 'OK' : 'CHYBA'}</span>
                </div>
                {check.issues.length > 0 && (
                  <ul>
                    {check.issues.map((issue, index) => (
                      <li key={check.id + '-' + index}>{issue.message}{issue.line ? ' (riadok ' + issue.line + ')' : ''}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Metric(props: { label: string; value: string }): React.ReactElement {
  return (
    <div className="metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

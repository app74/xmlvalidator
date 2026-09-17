import * as React from 'react';
import styles from './SepaXmlValidator.module.scss';
import type { ISepaXmlValidatorProps } from './ISepaXmlValidatorProps';
import { FileDropZone } from './FileDropZone';
import { ValidationDashboard } from './ValidationDashboard';
import { SepaValidationResult } from '../models/ValidationModels';
import { validateSepaDocument } from '../services/ValidationService';
import { downloadReport } from '../utils/ReportExport';

interface ISepaXmlValidatorState {
  result?: SepaValidationResult;
  isReading: boolean;
  error?: string;
}

export default class SepaXmlValidator extends React.Component<ISepaXmlValidatorProps, ISepaXmlValidatorState> {
  public state: ISepaXmlValidatorState = { isReading: false };

  private handleFileSelected = (file: File): void => {
    this.setState({ isReading: true, error: undefined, result: undefined });
    const reader = new FileReader();

    reader.onload = (): void => {
      try {
        const xml = typeof reader.result === 'string' ? reader.result : '';
        if (!xml) {
          throw new Error('Súbor sa nepodarilo načítať ako text.');
        }
        this.setState({
          isReading: false,
          result: validateSepaDocument(xml, file.name, file.size),
          error: undefined
        });
      } catch (error) {
        this.setState({ isReading: false, error: error instanceof Error ? error.message : 'Súbor sa nepodarilo overiť.' });
      }
    };

    reader.onerror = (): void => {
      this.setState({ isReading: false, error: 'Súbor sa nepodarilo načítať.' });
    };
    reader.readAsText(file, 'UTF-8');
  };

  private handleExport = (format: 'txt' | 'csv'): void => {
    if (this.state.result) {
      downloadReport(this.state.result, format);
    }
  };

  public render(): React.ReactElement<ISepaXmlValidatorProps> {
    const { result, isReading, error } = this.state;

    return (
      <section className={`${styles.sepaXmlValidator}`}>
        <header>
          <h2>Overovanie SEPA XML</h2>
          <p>XML zostáva v prehliadači a neposiela sa na externú službu.</p>
        </header>
        <FileDropZone onFileSelected={this.handleFileSelected} />
        {isReading && <p aria-live="polite">Načítavam a overujem XML...</p>}
        {error && <p role="alert">{error}</p>}
        {result && <ValidationDashboard result={result} onExport={this.handleExport} />}
      </section>
    );
  }
}

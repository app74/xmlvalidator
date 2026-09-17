import * as React from 'react';
import styles from './SepaXmlValidator.module.scss';
import type { ISepaXmlValidatorProps } from './ISepaXmlValidatorProps';
import { FileDropZone } from './FileDropZone';
import { ValidationDashboard } from './ValidationDashboard';
import { SepaValidationResult } from '../models/ValidationModels';
import { validateSepaDocument } from '../services/ValidationService';
import { downloadReport, downloadXml } from '../utils/ReportExport';
import { applyRepair, getRepairProposals, RepairProposal } from '../utils/RepairService';

interface ISepaXmlValidatorState {
  result?: SepaValidationResult;
  isReading: boolean;
  error?: string;
  repairXml?: string;
  repairProposals: RepairProposal[];
  hasAppliedRepair: boolean;
}

export default class SepaXmlValidator extends React.Component<ISepaXmlValidatorProps, ISepaXmlValidatorState> {
  public state: ISepaXmlValidatorState = { isReading: false, repairProposals: [], hasAppliedRepair: false };

  private handleFileSelected = (file: File): void => {
    this.setState({ isReading: true, error: undefined, result: undefined, repairXml: undefined, repairProposals: [], hasAppliedRepair: false });
    const reader = new FileReader();

    reader.onload = (): void => {
      try {
        const xml = typeof reader.result === 'string' ? reader.result : '';
        if (!xml) {
          throw new Error('Súbor sa nepodarilo načítať ako text.');
        }
        const validation = validateSepaDocument(xml, file.name, file.size);
        this.setState({
          isReading: false,
          result: validation,
          error: undefined,
          repairXml: xml,
          repairProposals: getRepairProposals(xml, validation)
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

  private handleApplyRepair = (): void => {
    const proposal = this.state.repairProposals[0];
    const currentXml = this.state.repairXml;
    const currentResult = this.state.result;
    if (!proposal || !currentXml || !currentResult) {
      return;
    }

    const updatedXml = applyRepair(currentXml, proposal);
    const updatedResult = validateSepaDocument(updatedXml, currentResult.fileName, new Blob([updatedXml]).size);
    this.setState({
      repairXml: updatedXml,
      result: updatedResult,
      repairProposals: getRepairProposals(updatedXml, updatedResult),
      hasAppliedRepair: true
    });
  };

  private handleSkipRepair = (): void => {
    this.setState({ repairProposals: this.state.repairProposals.slice(1) });
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
        {result && this.state.repairProposals.length > 0 && (
          <RepairStep proposal={this.state.repairProposals[0]} onApply={this.handleApplyRepair} onSkip={this.handleSkipRepair} />
        )}
        {result && this.state.repairProposals.length === 0 && result.issues.length > 0 && (
          <p role="status">Zostávajúce nálezy nemajú bezpečnú automatickú opravu. Skontrolujte ich manuálne.</p>
        )}
        {result && this.state.repairProposals.length === 0 && this.state.hasAppliedRepair && result.issues.length === 0 && (
          <p role="status">Finálna kontrola opraveného XML prešla bez nálezov.</p>
        )}
        {result && this.state.repairProposals.length === 0 && !this.state.hasAppliedRepair && result.issues.length === 0 && (
          <p role="status">XML je v poriadku.</p>
        )}
        {result && <ValidationDashboard result={result} onExport={this.handleExport} />}
        {result && this.state.repairXml && (
          <button type="button" onClick={() => downloadXml(this.state.repairXml as string, result.fileName)}>Stiahnuť aktuálne XML</button>
        )}
      </section>
    );
  }
}

function RepairStep(props: { proposal: RepairProposal; onApply: () => void; onSkip: () => void }): React.ReactElement {
  return (
    <div style={{ marginTop: 16, padding: 16, border: '2px solid #9b7929', background: '#fff8df' }}>
      <strong>Krokovaná oprava: {props.proposal.title}</strong>
      <p>{props.proposal.description}</p>
      {props.proposal.warning && <p><strong>Upozornenie:</strong> {props.proposal.warning}</p>}
      <p><strong>Pôvodná hodnota:</strong> {props.proposal.before || '(prázdne)'}</p>
      <p><strong>Navrhovaná hodnota:</strong> {props.proposal.after || '(prázdne)'}</p>
      <button type="button" onClick={props.onApply}>Použiť opravu a znovu overiť</button>{' '}
      <button type="button" onClick={props.onSkip}>Preskočiť</button>
    </div>
  );
}
